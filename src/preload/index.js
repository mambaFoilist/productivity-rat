import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  setTasks: (tasks) => ipcRenderer.invoke('set-tasks', tasks),
  getBoard: () => ipcRenderer.invoke('get-board'),
  setBoard: (snapshot) => ipcRenderer.invoke('set-board', snapshot),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (key) => ipcRenderer.invoke('set-api-key', key),
  chatSend: (payload) => ipcRenderer.invoke('chat-send', payload),
  onChatChunk: (cb) => ipcRenderer.on('chat-chunk', (_, chunk) => cb(chunk)),
  onChatDone: (cb) => ipcRenderer.on('chat-done', () => cb()),
  onChatError: (cb) => ipcRenderer.on('chat-error', (_, msg) => cb(msg)),
  offChatListeners: () => {
    ipcRenderer.removeAllListeners('chat-chunk')
    ipcRenderer.removeAllListeners('chat-done')
    ipcRenderer.removeAllListeners('chat-error')
  }
})