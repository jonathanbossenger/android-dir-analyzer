const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const adb = require('./adb');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('devices', () => adb.listDevices());
ipcMain.handle('analyze', (_e, serial, dir) => {
  if (typeof serial !== 'string' || typeof dir !== 'string') throw new Error('Invalid arguments');
  return adb.analyze(serial, dir);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
