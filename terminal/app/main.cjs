/**
 * ArmExam Terminal — Electron Main Process
 * Kiosk mode: fullscreen, no menu, no devtools in prod, mic access granted
 *
 * SERVER DISCOVERY ORDER:
 *   1. terminal-config.json  { "serverUrl": "http://192.168.1.100:4000" }
 *      — place this file next to the .exe on each kiosk machine
 *   2. ENV variable          ARMEXAM_SERVER=http://192.168.1.100:4000
 *   3. Fallback              http://localhost:4000  (dev / single-machine)
 */
const { app, BrowserWindow, session, globalShortcut, ipcMain, dialog } = require('electron');
const path  = require('path');
const fs    = require('fs');
const http  = require('http');
const https = require('https');

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// ── Server URL resolution ──────────────────────────────────────────────────────
function resolveServerUrl() {
  // 1. Config file next to the executable (or next to main.cjs in dev)
  const configPaths = [
    path.join(path.dirname(app.getPath('exe')), 'terminal-config.json'),
    path.join(__dirname, 'terminal-config.json'),
  ];
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (cfg.serverUrl) {
          console.log(`[config] Server URL from ${configPath}: ${cfg.serverUrl}`);
          return cfg.serverUrl.replace(/\/$/, ''); // strip trailing slash
        }
      } catch (e) {
        console.warn(`[config] Failed to parse ${configPath}:`, e.message);
      }
    }
  }

  // 2. Environment variable
  if (process.env.ARMEXAM_SERVER) {
    console.log(`[config] Server URL from ENV: ${process.env.ARMEXAM_SERVER}`);
    return process.env.ARMEXAM_SERVER.replace(/\/$/, '');
  }

  // 3. Fallback
  console.log('[config] Using fallback: http://localhost:4000');
  return 'http://localhost:4000';
}

const SERVER_URL = resolveServerUrl();

// ── Connectivity check ─────────────────────────────────────────────────────────
// Pings /api/health before showing UI. Retries for 30s to handle
// cases where the server machine boots slightly later than kiosks.
function checkServerConnectivity(url, retries = 6, delayMs = 5000) {
  return new Promise((resolve) => {
    const attempt = (remaining) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(`${url}/api/health`, { timeout: 4000 }, (res) => {
        resolve({ ok: true, status: res.statusCode });
      });
      req.on('error', (e) => {
        console.warn(`[health] ${url}/api/health failed (${remaining} retries left): ${e.message}`);
        if (remaining <= 0) {
          resolve({ ok: false, error: e.message });
        } else {
          setTimeout(() => attempt(remaining - 1), delayMs);
        }
      });
      req.on('timeout', () => {
        req.destroy();
        if (remaining <= 0) {
          resolve({ ok: false, error: 'timeout' });
        } else {
          setTimeout(() => attempt(remaining - 1), delayMs);
        }
      });
    };
    attempt(retries);
  });
}

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

  // Allow navigation only to known origins
  win.webContents.on('will-navigate', (e, url) => {
    const allowed = [
      'http://localhost:5174',   // vite dev server
      'file://',                  // production build
      SERVER_URL,                 // configured server (may be LAN IP)
    ];
    if (!allowed.some(a => url.startsWith(a))) {
      console.warn('[nav] Blocked navigation to:', url);
      e.preventDefault();
    }
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

// ── App lifecycle ──────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  createWindow();

  if (!isDev) {
    globalShortcut.registerAll([
      'Alt+F4', 'Super+L', 'Super+D', 'Ctrl+Alt+Delete',
      'Ctrl+W', 'Ctrl+T', 'Ctrl+N', 'Alt+Tab',
      'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
    ], () => {});
  }

  // Connectivity check — notify renderer of result
  // UI shows "Connecting to server…" until this resolves
  if (!isDev) {
    const result = await checkServerConnectivity(SERVER_URL);
    if (!result.ok) {
      // Send to renderer so it can show a clear error screen
      win.webContents.once('did-finish-load', () => {
        win.webContents.send('server-unreachable', { url: SERVER_URL, error: result.error });
      });
    } else {
      win.webContents.once('did-finish-load', () => {
        win.webContents.send('server-ready', { url: SERVER_URL });
      });
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC handlers ───────────────────────────────────────────────────────────────
ipcMain.handle('get-backend-url',  () => SERVER_URL);
ipcMain.handle('get-server-info',  () => ({
  url:       SERVER_URL,
  isLocal:   SERVER_URL.includes('localhost') || SERVER_URL.includes('127.0.0.1'),
  configuredVia: (() => {
    const configPath = path.join(path.dirname(app.getPath('exe')), 'terminal-config.json');
    if (fs.existsSync(configPath)) return 'config-file';
    if (process.env.ARMEXAM_SERVER) return 'env';
    return 'fallback';
  })(),
}));

ipcMain.handle('supervisor-exit', (_, password) => {
  if (password === (process.env.SUPERVISOR_PASSWORD || 'armexam-admin')) {
    app.quit();
    return true;
  }
  return false;
});

ipcMain.handle('check-connectivity', async () => {
  return await checkServerConnectivity(SERVER_URL, 1, 0);
});
