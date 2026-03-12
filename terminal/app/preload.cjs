const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl:       () => ipcRenderer.invoke('get-backend-url'),
  getServerInfo:       () => ipcRenderer.invoke('get-server-info'),
  checkConnectivity:   () => ipcRenderer.invoke('check-connectivity'),
  supervisorExit:      (password) => ipcRenderer.invoke('supervisor-exit', password),

  // Server status events pushed from main process
  onServerReady:       (cb) => ipcRenderer.on('server-ready',       (_, data) => cb(data)),
  onServerUnreachable: (cb) => ipcRenderer.on('server-unreachable', (_, data) => cb(data)),
});
