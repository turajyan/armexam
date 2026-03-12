import { useState, useEffect, useRef } from 'react';

export default function PinScreen({ T, backendUrl, onLogin }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    if (!pin.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`${backendUrl}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      onLogin(data);
    } catch (e) {
      setError(e.message === 'Invalid or expired PIN' ? 'Անվավեր կամ ժամկետանց PIN' : e.message);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div style={{
      width: '100%', height: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: T.bg,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative background rings */}
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        border: `1px solid ${T.gold}0a`, top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        border: `1px solid ${T.gold}0e`, top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
      }} />

      {/* Logo / Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
          background: `linear-gradient(135deg, ${T.gold}22, ${T.gold}44)`,
          border: `1px solid ${T.gold}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>🎓</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 36, fontWeight: 700, color: T.text, letterSpacing: -1,
        }}>ArmExam</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 6, letterSpacing: .5 }}>
          Exam Terminal · Քննական Կայան
        </div>
      </div>

      {/* PIN Card */}
      <div style={{
        background: T.card, border: `1px solid ${T.border2}`,
        borderRadius: 24, padding: '40px 48px', width: 420,
        boxShadow: `0 24px 80px #00000033`,
        animation: shake ? 'shake .5s ease' : 'none',
      }}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-10px)}
            40%{transform:translateX(10px)}
            60%{transform:translateX(-6px)}
            80%{transform:translateX(6px)}
          }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        `}</style>

        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            Մուտք PIN կոդով
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>
            Enter your exam PIN code
          </div>
        </div>

        {/* PIN Input */}
        <div style={{ position: 'relative', marginBottom: error ? 12 : 20 }}>
          <input
            ref={inputRef}
            type="text"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            onKeyDown={handleKey}
            placeholder="Paste or type PIN..."
            spellCheck={false}
            autoComplete="off"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: T.inputBg, border: `1.5px solid ${error ? T.error + '88' : pin ? T.gold + '66' : T.inputBorder}`,
              borderRadius: 12, padding: '14px 16px',
              color: T.text, fontFamily: "'DM Mono', monospace", fontSize: 11,
              outline: 'none', letterSpacing: .5,
              transition: 'border .2s',
            }}
          />
          {pin && (
            <button onClick={() => { setPin(''); setError(''); inputRef.current?.focus(); }} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16,
            }}>✕</button>
          )}
        </div>

        {error && (
          <div style={{
            background: T.error + '18', border: `1px solid ${T.error}44`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            fontSize: 12, color: T.error, fontFamily: "'DM Sans',sans-serif",
          }}>⚠ {error}</div>
        )}

        {/* Submit button */}
        <button
          onClick={submit}
          disabled={loading || !pin.trim()}
          style={{
            width: '100%', padding: '14px',
            background: loading || !pin.trim() ? T.border2 : `linear-gradient(135deg, ${T.gold}, ${T.goldHover})`,
            border: 'none', borderRadius: 12, cursor: loading || !pin.trim() ? 'not-allowed' : 'pointer',
            color: loading || !pin.trim() ? T.dim : '#1a1200',
            fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: .3, transition: 'all .2s',
          }}
        >
          {loading ? (
            <span style={{ animation: 'pulse 1s infinite' }}>Ստուգվում է...</span>
          ) : 'Մուտք → Enter'}
        </button>

        {/* Hint */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: T.dim, lineHeight: 1.6 }}>
          PIN կոդը տրվում է քննության կազմակերպողի կողմից<br/>
          <span style={{ opacity: .6 }}>PIN is provided by the exam administrator</span>
        </div>
      </div>

      {/* Version */}
      <div style={{ position: 'absolute', bottom: 16, fontSize: 10, color: T.dim, opacity: .5 }}>
        ArmExam Terminal v1.0 · Kiosk Mode
      </div>
    </div>
  );
}
