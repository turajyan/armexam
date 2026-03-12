/**
 * ArmExam Terminal — Electron Main Process
 * Kiosk mode: fullscreen, no menu, no devtools in prod, mic access granted
 */
const { app, BrowserWindow, session, globalShortcut, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const BACKEND_URL = 'http://localhost:4000';

let win;

function createWindow() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'camera', 'audioCapture'];
    callback(allowed.includes(permission));
  });

  win = new BrowserWindow({
    fullscreen: !isDev,
    kiosk: !isDev,
    frame: isDev,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
    title: 'ArmExam Terminal',
    width: 1280,
    height: 800,
  });

  win.webContents.on('will-navigate', (e, url) => {
    const allowed = ['http://localhost:5174', 'http://localhost:4000', 'file://'];
    if (!allowed.some(a => url.startsWith(a))) e.preventDefault();
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (isDev) {
    win.loadURL('http://localhost:5174');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  if (!isDev) {
    win.webContents.on('context-menu', e => e.preventDefault());
  }
}

app.whenReady().then(() => {
  createWindow();

  if (!isDev) {
    globalShortcut.registerAll([
      'Alt+F4', 'Super+L', 'Super+D', 'Ctrl+Alt+Delete',
      'Ctrl+W', 'Ctrl+T', 'Ctrl+N', 'Alt+Tab',
      'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
    ], () => {});
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-backend-url', () => BACKEND_URL);
ipcMain.handle('supervisor-exit', (_, password) => {
  if (password === (process.env.SUPERVISOR_PASSWORD || 'armexam-admin')) {
    app.quit();
    return true;
  }
  return false;
});
