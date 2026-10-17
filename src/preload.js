const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  devices: () => ipcRenderer.invoke('devices'),
  analyze: (serial, dir) => ipcRenderer.invoke('analyze', serial, dir),
});
