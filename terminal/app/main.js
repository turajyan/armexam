/**
 * ArmExam Terminal — Electron Main Process
 * Kiosk mode: fullscreen, no menu, no devtools in prod, mic access granted
 */
import { app, BrowserWindow, session, globalShortcut, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const BACKEND_URL = 'http://localhost:4000';

let win;

function createWindow() {
  // Grant microphone permission automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'camera', 'audioCapture'];
    callback(allowed.includes(permission));
  });

  win = new BrowserWindow({
    fullscreen: !isDev,
    kiosk: !isDev,           // true kiosk mode on production
    frame: false,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
    title: 'ArmExam Terminal',
  });

  // Block all navigation away from the app
  win.webContents.on('will-navigate', (e, url) => {
    const allowed = isDev
      ? ['http://localhost:5173', BACKEND_URL]
      : ['file://', BACKEND_URL];
    if (!allowed.some(a => url.startsWith(a))) {
      e.preventDefault();
    }
  });

  // Block new windows / popups
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(join(__dirname, 'dist/index.html'));
  }

  // Disable right-click context menu in prod
  if (!isDev) {
    win.webContents.on('context-menu', e => e.preventDefault());
  }
}

app.whenReady().then(() => {
  createWindow();

  // Block dangerous shortcuts in kiosk mode
  if (!isDev) {
    globalShortcut.registerAll([
      'Alt+F4', 'Super+L', 'Super+D', 'Ctrl+Alt+Delete',
      'Ctrl+W', 'Ctrl+T', 'Ctrl+N', 'Alt+Tab',
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11',
    ], () => {});
    // F12 devtools blocked too
    globalShortcut.register('F12', () => {});
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: renderer can request backend URL
ipcMain.handle('get-backend-url', () => BACKEND_URL);
// IPC: supervisor exit (admin only, requires password check in renderer)
ipcMain.handle('supervisor-exit', (_, password) => {
  if (password === (process.env.SUPERVISOR_PASSWORD || 'armexam-admin')) {
    app.quit();
    return true;
  }
  return false;
});
