const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  supervisorExit: (password) => ipcRenderer.invoke('supervisor-exit', password),
});
