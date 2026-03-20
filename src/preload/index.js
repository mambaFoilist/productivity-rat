import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  setTasks: (tasks) => ipcRenderer.invoke('set-tasks', tasks),
  getBoard: () => ipcRenderer.invoke('get-board'),
  setBoard: (snapshot) => ipcRenderer.invoke('set-board', snapshot)
})