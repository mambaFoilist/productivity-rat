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

ipcMain.handle('get-tasks', () => store.get('tasks', []))
ipcMain.handle('set-tasks', (_, tasks) => store.set('tasks', tasks))
ipcMain.handle('get-board', () => store.get('board', null))
ipcMain.handle('set-board', (_, snapshot) => store.set('board', snapshot))
ipcMain.handle('get-api-key', () => store.get('apiKey', ''))
ipcMain.handle('set-api-key', (_, key) => store.set('apiKey', key))

ipcMain.handle('chat-send', async (event, { messages, tasks }) => {
  const apiKey = store.get('apiKey', '')
  if (!apiKey) throw new Error('No API key set. Add one in Settings.')

  const client = new Anthropic({ apiKey })

  const taskList = tasks.length
    ? tasks.map(t => `- [${t.done ? 'x' : ' '}] ${t.title} (${t.priority}${t.dueDate ? ', due: ' + t.dueDate : ''})`).join('\n')
    : 'No tasks yet.'

  const systemPrompt = `You are a helpful productivity assistant built into ProductivityRat, a personal task manager. Be concise and practical.

The user's current tasks:
${taskList}`

  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages
  })

  stream.on('text', (text) => {
    event.sender.send('chat-chunk', text)
  })

  stream.on('error', (err) => {
    event.sender.send('chat-error', err.message)
  })

  await stream.finalMessage()
  event.sender.send('chat-done')
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })