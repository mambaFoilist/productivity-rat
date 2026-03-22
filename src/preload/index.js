import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Tasks
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  setTasks: (tasks) => ipcRenderer.invoke('set-tasks', tasks),

  // Board
  getBoard: () => ipcRenderer.invoke('get-board'),
  setBoard: (snapshot) => ipcRenderer.invoke('set-board', snapshot),

  // Settings
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (key) => ipcRenderer.invoke('set-api-key', key),

  // Chat
  chatSend: (payload) => ipcRenderer.invoke('chat-send', payload),

  // Chat events (streaming + tool loop)
  onChatChunk:      (cb) => ipcRenderer.on('chat-chunk',      (_, v) => cb(v)),
  onChatSegmentEnd: (cb) => ipcRenderer.on('chat-segment-end', ()    => cb()),
  onChatToolUse:    (cb) => ipcRenderer.on('chat-tool-use',   (_, v) => cb(v)),
  onChatDone:       (cb) => ipcRenderer.on('chat-done',       ()    => cb()),
  onChatError:      (cb) => ipcRenderer.on('chat-error',      (_, v) => cb(v)),

  offChatListeners: () => {
    ipcRenderer.removeAllListeners('chat-chunk')
    ipcRenderer.removeAllListeners('chat-segment-end')
    ipcRenderer.removeAllListeners('chat-tool-use')
    ipcRenderer.removeAllListeners('chat-done')
    ipcRenderer.removeAllListeners('chat-error')
  },

  // Live task updates pushed from main when tools mutate the store
  onTasksUpdated:  (cb) => ipcRenderer.on('tasks-updated', (_, v) => cb(v)),
  offTasksUpdated: ()   => ipcRenderer.removeAllListeners('tasks-updated')
})
