import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import Anthropic from '@anthropic-ai/sdk'

const store = new Store()

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── Task / board persistence ───────────────────────────────────────────────
ipcMain.handle('get-tasks', () => store.get('tasks', []))
ipcMain.handle('set-tasks', (_, tasks) => store.set('tasks', tasks))
ipcMain.handle('get-board', () => store.get('board', null))
ipcMain.handle('set-board', (_, snapshot) => store.set('board', snapshot))

// ── Settings ───────────────────────────────────────────────────────────────
ipcMain.handle('get-api-key', () => store.get('apiKey', ''))
ipcMain.handle('set-api-key', (_, key) => store.set('apiKey', key))

// ── AI tools ──────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'create_task',
    description: 'Create a new task for the user. Tasks with a dueDate appear on the Calendar page as events. Use this for both tasks and calendar events.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        priority: {
          type: 'string',
          enum: ['Today', 'This Week', 'This Month', 'Someday'],
          description: 'Task priority tag'
        },
        dueDate: {
          type: 'string',
          description: 'Optional due date in YYYY-MM-DD format. Required for calendar events.'
        }
      },
      required: ['title', 'priority']
    }
  },
  {
    name: 'complete_task',
    description: 'Mark an existing task as completed.',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'number', description: 'The numeric ID of the task (shown in the task list).' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task.',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'number', description: 'The numeric ID of the task to delete.' }
      },
      required: ['taskId']
    }
  }
]

function executeTool(name, input) {
  const tasks = store.get('tasks', [])

  switch (name) {
    case 'create_task': {
      const task = {
        id: Date.now(),
        title: input.title,
        priority: input.priority || 'Someday',
        dueDate: input.dueDate || '',
        done: false
      }
      const updated = [...tasks, task]
      store.set('tasks', updated)
      return { ok: true, label: `Created "${task.title}"`, tasks: updated }
    }

    case 'complete_task': {
      const task = tasks.find(t => t.id === input.taskId)
      if (!task) return { ok: false, label: `Task ID ${input.taskId} not found`, tasks }
      const updated = tasks.map(t => t.id === input.taskId ? { ...t, done: true } : t)
      store.set('tasks', updated)
      return { ok: true, label: `Completed "${task.title}"`, tasks: updated }
    }

    case 'delete_task': {
      const task = tasks.find(t => t.id === input.taskId)
      if (!task) return { ok: false, label: `Task ID ${input.taskId} not found`, tasks }
      const updated = tasks.filter(t => t.id !== input.taskId)
      store.set('tasks', updated)
      return { ok: true, label: `Deleted "${task.title}"`, tasks: updated }
    }

    default:
      return { ok: false, label: `Unknown tool: ${name}`, tasks }
  }
}

function buildSystemPrompt() {
  const tasks = store.get('tasks', [])
  const today = new Date().toISOString().split('T')[0]
  const taskList = tasks.length
    ? tasks.map(t =>
        `- [${t.done ? 'x' : ' '}] [ID:${t.id}] ${t.title} (${t.priority}${t.dueDate ? ', due: ' + t.dueDate : ''})`
      ).join('\n')
    : 'No tasks yet.'

  return `You are a helpful productivity assistant inside ProductivityRat, a personal task manager. Be concise and action-oriented.

You have tools to create tasks, complete tasks, and delete tasks. Tasks with a due date automatically appear on the Calendar page.

Today's date: ${today}

User's current tasks:
${taskList}`
}

// ── Chat with agentic tool loop ────────────────────────────────────────────
ipcMain.handle('chat-send', async (event, { messages }) => {
  const apiKey = store.get('apiKey', '')
  if (!apiKey) throw new Error('No API key configured. Go to Settings and paste your Anthropic API key.')

  const client = new Anthropic({ apiKey })
  let conversationMessages = [...messages]

  try {
    while (true) {
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 8096,
        system: buildSystemPrompt(),
        tools: TOOLS,
        messages: conversationMessages
      })

      // Send all text blocks to the renderer as one burst
      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          if (!event.sender.isDestroyed()) event.sender.send('chat-chunk', block.text)
        }
      }

      if (response.stop_reason !== 'tool_use') {
        if (!event.sender.isDestroyed()) event.sender.send('chat-done')
        break
      }

      // Commit whatever text arrived before the tool call
      if (!event.sender.isDestroyed()) event.sender.send('chat-segment-end')

      // Rebuild assistant content as plain objects — strips thinking blocks and skips empty text.
      const assistantContent = response.content.flatMap(b => {
        if (b.type === 'tool_use') return [{ type: 'tool_use', id: b.id, name: b.name, input: b.input }]
        if (b.type === 'text' && b.text) return [{ type: 'text', text: b.text }]
        return []
      })
      conversationMessages.push({ role: 'assistant', content: assistantContent })

      const toolResults = []
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        const { ok, label, tasks: updatedTasks } = executeTool(block.name, block.input)

        if (!event.sender.isDestroyed()) event.sender.send('chat-tool-use', { name: block.name, label, ok })
        if (!event.sender.isDestroyed()) event.sender.send('tasks-updated', updatedTasks)

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: label
        })
      }

      conversationMessages.push({ role: 'user', content: toolResults })
      // loop → next API round
    }
  } catch (err) {
    event.sender.send('chat-error', err.message ?? String(err))
  }
})

// ── App lifecycle ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
