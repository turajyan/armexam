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

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('terminal-theme') || 'dark');
  const [screen, setScreen] = useState('pin'); // pin | exam | result
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [backendUrl, setBackendUrl] = useState(BACKEND || 'http://localhost:4000');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getBackendUrl().then(setBackendUrl);
    }
  }, []);

  const T = THEMES[theme] || THEMES.dark;

  const handleLogin = useCallback(async (sessionData) => {
    setSession(sessionData);
    setScreen('exam');

    // ── Background media prefetch ────────────────────────────────────────────
    // Collect all media URLs from the session questions and ask the terminal
    // backend to cache them locally. This runs after the exam starts so it
    // doesn't delay the PIN login, but completes well before the student
    // reaches media-heavy sections (Listening / Speaking).
    const urls = [];
    for (const q of sessionData.questions ?? []) {
      for (const m of q.media ?? []) {
        if (m.url && (m.url.startsWith('http://') || m.url.startsWith('https://'))) {
          urls.push(m.url);
        }
      }
      // Legacy single-field media
      if (q.audioSrc?.startsWith('http')) urls.push(q.audioSrc);
      if (q.videoSrc?.startsWith('http')) urls.push(q.videoSrc);
      if (q.imageSrc?.startsWith('http')) urls.push(q.imageSrc);
    }

    if (urls.length > 0) {
      const bu = sessionData.backendUrl ?? backendUrl ?? 'http://localhost:4000';
      try {
        const r = await fetch(`${bu}/api/media/prefetch`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: [...new Set(urls)] }), // deduplicate
        });
        if (r.ok) {
          const d = await r.json();
          console.log(`[prefetch] ${d.cached?.length ?? 0} files cached, ${d.failed?.length ?? 0} failed`);
          // Rewrite media URLs in session to point to local cache
          for (const q of sessionData.questions ?? []) {
            for (const m of q.media ?? []) {
              const match = d.cached?.find(c => c.url === m.url);
              if (match) m.url = `${bu}/api/media/${match.filename}`;
            }
            for (const field of ['audioSrc', 'videoSrc', 'imageSrc']) {
              const match = d.cached?.find(c => c.url === q[field]);
              if (match) q[field] = `${bu}/api/media/${match.filename}`;
            }
          }
          // Update session in state with rewritten URLs
          setSession({ ...sessionData });
        }
      } catch (e) {
        console.warn('[prefetch] Failed:', e.message, '— using original URLs');
      }
    }
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

      {screen === 'pin' && (
        <PinScreen T={T} backendUrl={backendUrl} onLogin={handleLogin} />
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
