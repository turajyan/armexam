import { useState, useEffect, useCallback } from 'react';
import PinScreen from './pages/PinScreen.jsx';
import ExamScreen from './pages/ExamScreen.jsx';
import ResultScreen from './pages/ResultScreen.jsx';

const BACKEND = (typeof window !== 'undefined' && window.electronAPI)
  ? null // will be resolved async
  : 'http://localhost:4000';

export const THEMES = {
  dark: {
    name: 'Dark', id: 'dark',
    bg: '#0a0c12', bg2: '#10131c', card: '#161925', panel: '#1c2030',
    border: '#ffffff0e', border2: '#ffffff18',
    text: '#f0f0f5', muted: '#8891aa', dim: '#4a5270',
    gold: '#c8a96e', goldHover: '#d4b87a',
    success: '#4ade80', error: '#f87171', warning: '#fbbf24',
    purple: '#a78bfa', blue: '#60a5fa',
    timerBg: '#1c2030', timerText: '#c8a96e',
    inputBg: '#0a0c12', inputBorder: '#ffffff18',
    optionBg: '#10131c', optionSelected: '#c8a96e11', optionBorder: '#c8a96e55',
  },
  neutral: {
    name: 'Neutral', id: 'neutral',
    bg: '#1a1a2e', bg2: '#16213e', card: '#1f2744', panel: '#253055',
    border: '#ffffff12', border2: '#ffffff20',
    text: '#e8eaf6', muted: '#8e99c0', dim: '#4a5270',
    gold: '#7986cb', goldHover: '#8c9ce8',
    success: '#66bb6a', error: '#ef5350', warning: '#ffb74d',
    purple: '#9c8de8', blue: '#64b5f6',
    timerBg: '#253055', timerText: '#7986cb',
    inputBg: '#1a1a2e', inputBorder: '#ffffff20',
    optionBg: '#16213e', optionSelected: '#7986cb11', optionBorder: '#7986cb55',
  },
  light: {
    name: 'Light', id: 'light',
    bg: '#f5f5f0', bg2: '#eeede8', card: '#ffffff', panel: '#faf9f6',
    border: '#00000010', border2: '#0000001a',
    text: '#1a1a2a', muted: '#5a5a7a', dim: '#b0b0c8',
    gold: '#8b6f3e', goldHover: '#7a5f2e',
    success: '#2d8a50', error: '#c0392b', warning: '#b7860b',
    purple: '#6d48b5', blue: '#2563eb',
    timerBg: '#eeede8', timerText: '#8b6f3e',
    inputBg: '#ffffff', inputBorder: '#0000001a',
    optionBg: '#faf9f6', optionSelected: '#8b6f3e0e', optionBorder: '#8b6f3e55',
  },
};

// ── URL helpers ───────────────────────────────────────────────────────────────
function isRemoteUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * Deep-clone sessionData and rewrite all media URLs using urlMap.
 * urlMap: { "https://cdn.../file.mp3": "http://localhost:4000/api/media/abc123.mp3" }
 * Handles both new schema (q.media[].url) and legacy fields (audioSrc, videoSrc, imageSrc).
 */
function rewriteSessionUrls(session, urlMap) {
  if (!urlMap || Object.keys(urlMap).length === 0) return session;

  // Deep clone questions array — avoid mutating the original
  const questions = (session.questions ?? []).map(q => {
    const qClone = { ...q };

    // New schema: q.media = [{ type, url, maxPlays }, ...]
    if (Array.isArray(q.media)) {
      qClone.media = q.media.map(m => ({
        ...m,
        url: urlMap[m.url] ?? m.url,
      }));
    }

    // Legacy single fields
    if (q.audioSrc && urlMap[q.audioSrc]) qClone.audioSrc = urlMap[q.audioSrc];
    if (q.videoSrc && urlMap[q.videoSrc]) qClone.videoSrc = urlMap[q.videoSrc];
    if (q.imageSrc && urlMap[q.imageSrc]) qClone.imageSrc = urlMap[q.imageSrc];

    return qClone;
  });

  return { ...session, questions };
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('terminal-theme') || 'dark');
  const [screen, setScreen] = useState('connecting'); // connecting | pin | prefetch | exam | result
  const [prefetchProgress, setPrefetchProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [serverInfo, setServerInfo] = useState(null);
  const [connectError, setConnectError] = useState(null);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [backendUrl, setBackendUrl] = useState(BACKEND || 'http://localhost:4000');

  useEffect(() => {
    if (!window.electronAPI) {
      // Browser dev mode — go straight to PIN
      setScreen('pin');
      return;
    }

    // Get server URL from main process (reads terminal-config.json)
    window.electronAPI.getBackendUrl().then(url => {
      setBackendUrl(url);
    });

    window.electronAPI.getServerInfo().then(info => {
      setServerInfo(info);
    });

    // Listen for connectivity result pushed by main process
    window.electronAPI.onServerReady((data) => {
      setConnectError(null);
      setScreen('pin');
    });

    window.electronAPI.onServerUnreachable((data) => {
      setConnectError(data);
      // Stay on 'connecting' screen showing the error + retry button
    });

    // In dev mode Electron doesn't send these events — go to pin directly
    if (process?.env?.NODE_ENV === 'development') {
      setScreen('pin');
    }
  }, []);

  const retryConnect = async () => {
    setConnectError(null);
    setScreen('connecting');
    const result = await window.electronAPI.checkConnectivity();
    if (result.ok) {
      setScreen('pin');
    } else {
      setConnectError({ url: backendUrl, error: result.error });
    }
  };

  const T = THEMES[theme] || THEMES.dark;

  const handleLogin = useCallback(async (sessionData) => {
    const bu = backendUrl ?? 'http://localhost:4000';

    // ── Step 1: extract all remote media URLs from questions ─────────────────
    // Build a map: originalUrl → list of locations in the session data tree
    // so we can do a clean rewrite without mutating the original object.
    const urlSet = new Set();
    for (const q of sessionData.questions ?? []) {
      for (const m of q.media ?? []) {
        if (isRemoteUrl(m.url)) urlSet.add(m.url);
      }
      if (isRemoteUrl(q.audioSrc)) urlSet.add(q.audioSrc);
      if (isRemoteUrl(q.videoSrc)) urlSet.add(q.videoSrc);
      if (isRemoteUrl(q.imageSrc)) urlSet.add(q.imageSrc);
    }

    const uniqueUrls = [...urlSet];

    // ── Step 2: no media — skip straight to exam ──────────────────────────────
    if (uniqueUrls.length === 0) {
      setSession(sessionData);
      setScreen('exam');
      return;
    }

    // ── Step 3: show prefetch loading screen ──────────────────────────────────
    setPrefetchProgress({ done: 0, total: uniqueUrls.length, failed: 0 });
    setSession(sessionData);       // store session (without URL rewrite yet)
    setScreen('prefetch');         // show loading screen

    // ── Step 4: prefetch via terminal backend ─────────────────────────────────
    let urlMap = {};               // originalUrl → localUrl
    try {
      const resp = await fetch(`${bu}/api/media/prefetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: uniqueUrls }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const failed = data.failed?.length ?? 0;
        const cached = data.cached ?? [];

        setPrefetchProgress({ done: cached.length, total: uniqueUrls.length, failed });

        // Build rewrite map: originalUrl → http://localhost:4000/api/media/filename
        for (const entry of cached) {
          urlMap[entry.url] = `${bu}/api/media/${entry.filename}`;
        }

        console.log(`[prefetch] ${cached.length}/${uniqueUrls.length} cached, ${failed} failed`);
        if (failed > 0) {
          data.failed.forEach(f => console.warn(`[prefetch] failed: ${f.url} — ${f.error}`));
        }
      } else {
        console.warn('[prefetch] Backend returned', resp.status, '— using original URLs');
      }
    } catch (e) {
      console.warn('[prefetch] Network error:', e.message, '— using original URLs');
    }

    // ── Step 5: deep-clone session and rewrite URLs ───────────────────────────
    // Never mutate the original sessionData object.
    const rewritten = rewriteSessionUrls(sessionData, urlMap);

    // ── Step 6: enter exam ────────────────────────────────────────────────────
    setSession(rewritten);
    setScreen('exam');
  }, [backendUrl]);

  const handleFinish = useCallback((resultData) => {
    setResult(resultData);
    setScreen('result');
  }, []);

  const handleReturnToPin = useCallback(() => {
    setSession(null);
    setResult(null);
    setScreen('pin');
  }, []);

  const saveTheme = (t) => {
    localStorage.setItem('terminal-theme', t);
    setTheme(t);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: T.bg, color: T.text,
      fontFamily: "'DM Sans', sans-serif",
      transition: 'background .3s, color .3s',
    }}>
      {/* Theme switcher — always visible top-right corner */}
      <ThemeSwitcher theme={theme} setTheme={saveTheme} T={T} />

      {screen === 'connecting' && (
        <ConnectingScreen T={T} serverInfo={serverInfo} error={connectError}
          backendUrl={backendUrl} onRetry={retryConnect} />
      )}
      {screen === 'pin' && (
        <PinScreen T={T} backendUrl={backendUrl} onLogin={handleLogin} />
      )}
      {screen === 'prefetch' && session && (
        <PrefetchScreen T={T} progress={prefetchProgress} session={session} />
      )}
      {screen === 'exam' && session && (
        <ExamScreen T={T} session={session} backendUrl={backendUrl} onFinish={handleFinish} />
      )}
      {screen === 'result' && (
        <ResultScreen T={T} result={result} session={session} onDone={handleReturnToPin} />
      )}
    </div>
  );
}

// ── Connecting screen ─────────────────────────────────────────────────────────
// Shown at startup while Electron checks reachability of the terminal server.
function ConnectingScreen({ T, serverInfo, error, backendUrl, onRetry }) {
  const isLan = serverInfo && !serverInfo.isLocal;
  const url   = backendUrl || '…';

  if (error) return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: 32,
    }}>
      <div style={{ fontSize: 52, marginBottom: 24 }}>⚠️</div>

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 28, fontWeight: 700, color: T.text, marginBottom: 8,
      }}>Cannot reach server</div>

      <div style={{
        fontSize: 13, color: T.muted, marginBottom: 28,
        maxWidth: 420, textAlign: 'center', lineHeight: 1.7,
      }}>
        The exam server at <code style={{
          background: '#ffffff0e', borderRadius: 4,
          padding: '1px 6px', color: T.gold, fontSize: 12,
        }}>{url}</code> did not respond.
      </div>

      {/* Checklist */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: '20px 24px',
        maxWidth: 400, width: '100%', marginBottom: 28,
      }}>
        {[
          ['Is the server machine powered on?', true],
          ['Are both machines on the same Wi-Fi / LAN?', true],
          [`Is the server running on port 4000?`, true],
          [`Error: ${error.error}`, false],
        ].map(([text, isAction], i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '7px 0',
            borderBottom: i < 3 ? `1px solid ${T.border}` : 'none',
            fontSize: 13,
            color: isAction ? T.muted : '#f87171',
          }}>
            <span>{isAction ? '→' : '✗'}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <button onClick={onRetry} style={{
        background: T.gold, border: 'none', borderRadius: 12,
        padding: '13px 36px', cursor: 'pointer',
        color: '#1a1200', fontWeight: 700, fontSize: 15,
        fontFamily: "'DM Sans', sans-serif",
      }}>↺ Retry connection</button>

      {/* Config hint */}
      <div style={{
        marginTop: 32, fontSize: 11, color: T.muted,
        textAlign: 'center', lineHeight: 1.8, maxWidth: 380,
      }}>
        To change the server address, edit{' '}
        <code style={{ color: T.gold, fontSize: 11 }}>terminal-config.json</code>
        {' '}next to the application:<br/>
        <code style={{
          display: 'inline-block', marginTop: 6,
          background: '#ffffff08', borderRadius: 6,
          padding: '4px 10px', fontSize: 11, color: '#a78bfa',
        }}>{'{ "serverUrl": "http://192.168.1.100:4000" }'}</code>
      </div>
    </div>
  );

  // Connecting spinner
  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 28, fontWeight: 700, color: T.gold,
        marginBottom: 48, letterSpacing: 2,
      }}>Հ ArmExam</div>

      {/* Pulsing ring */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: `3px solid ${T.border}`,
        borderTopColor: T.gold,
        animation: 'spin 1s linear infinite',
        marginBottom: 28,
      }} />

      <div style={{ fontSize: 15, color: T.text, marginBottom: 8 }}>
        Connecting to exam server…
      </div>

      <div style={{
        fontSize: 12, color: T.muted,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {isLan ? '🌐' : '💻'}
        <code style={{ fontSize: 11 }}>{url}</code>
        {serverInfo?.configuredVia === 'config-file' && (
          <span style={{ color: '#4ade80', fontSize: 10 }}>· config file</span>
        )}
        {serverInfo?.configuredVia === 'fallback' && (
          <span style={{ color: '#f59e0b', fontSize: 10 }}>· fallback</span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}


// ── Prefetch loading screen ───────────────────────────────────────────────────
function PrefetchScreen({ T, progress, session }) {
  const { done, total, failed } = progress;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Derive section icons to show what's being prepared
  const sections = session?.sections ?? [];
  const hasListening = sections.some(s => s.category === 'LISTENING');
  const hasSpeaking  = sections.some(s => s.category === 'SPEAKING');

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: T.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 28, fontWeight: 700, color: T.gold,
        marginBottom: 48, letterSpacing: 2,
      }}>Հ ArmExam</div>

      {/* Spinner ring */}
      <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 32 }}>
        <svg width="96" height="96" viewBox="0 0 96 96"
          style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r="40"
            fill="none" stroke={T.border} strokeWidth="5" />
          <circle cx="48" cy="48" r="40"
            fill="none" stroke={T.gold} strokeWidth="5"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        {/* Percent in center */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: T.gold,
          fontFamily: "'DM Mono', monospace",
        }}>{pct}%</div>
      </div>

      {/* Status text */}
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>
        Preparing your exam…
      </div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 32 }}>
        Caching media files for offline playback
        {total > 0 && <span> · {done}/{total} files</span>}
      </div>

      {/* Section pills showing what's being cached */}
      {(hasListening || hasSpeaking) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          {hasListening && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: '#a78bfa18', border: '1px solid #a78bfa33',
              fontSize: 12, color: '#a78bfa',
            }}>
              🎧 <span>Listening audio</span>
            </div>
          )}
          {hasSpeaking && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: '#f8717118', border: '1px solid #f8717133',
              fontSize: 12, color: '#f87171',
            }}>
              🎙 <span>Speaking prompts</span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div style={{
        width: 320, height: 4,
        background: T.border, borderRadius: 99, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${T.gold}, ${T.gold}bb)`,
          width: `${pct}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Failed files warning */}
      {failed > 0 && (
        <div style={{
          marginTop: 20, padding: '8px 16px',
          background: '#f8717115', border: '1px solid #f8717133',
          borderRadius: 10, fontSize: 12, color: '#f87171',
        }}>
          ⚠ {failed} file{failed > 1 ? 's' : ''} couldn't be cached — will stream live
        </div>
      )}

      {/* Reassurance */}
      <div style={{
        position: 'absolute', bottom: 40,
        fontSize: 11, color: T.muted, letterSpacing: 0.5,
      }}>
        Do not close this window
      </div>
    </div>
  );
}

function ThemeSwitcher({ theme, setTheme, T }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: T.card, border: `1px solid ${T.border2}`,
        borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
        color: T.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 12,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: T.gold, display: 'inline-block' }} />
        {THEMES[theme].name}
        <span style={{ fontSize: 8, opacity: .6 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0,
          background: T.card, border: `1px solid ${T.border2}`,
          borderRadius: 12, overflow: 'hidden', minWidth: 130,
          boxShadow: '0 8px 32px #00000044',
        }}>
          {Object.values(THEMES).map(t => (
            <button key={t.id} onClick={() => { setTheme(t.id); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', padding: '10px 16px',
              background: theme === t.id ? T.gold + '18' : 'transparent',
              border: 'none', cursor: 'pointer', color: theme === t.id ? T.gold : T.text,
              fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.gold, flexShrink: 0 }} />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
