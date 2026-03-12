import { useEffect, useRef } from 'react';

const LEVEL_COLORS = { A1:'#4ade80',A2:'#86efac',B1:'#60a5fa',B2:'#93c5fd',C1:'#f59e0b',C2:'#fbbf24' };

function AnimatedScore({ score, T }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2, r = 90;
    let current = 0;
    const target = score;
    const color = score >= 70 ? T.success : score >= 50 ? T.warning : T.error;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Track
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, Math.PI*1.5);
      ctx.strokeStyle = T.border2; ctx.lineWidth = 10; ctx.stroke();
      // Progress
      const end = -Math.PI/2 + (current/100) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, end);
      ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
      // Text
      ctx.fillStyle = T.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 40px 'Cormorant Garamond', serif`;
      ctx.fillText(`${Math.round(current)}%`, cx, cy - 8);
      ctx.font = `400 12px 'DM Sans', sans-serif`;
      ctx.fillStyle = T.muted;
      ctx.fillText('Score', cx, cy + 22);
    };

    const anim = setInterval(() => {
      current = Math.min(current + target/60, target);
      draw();
      if (current >= target) clearInterval(anim);
    }, 16);
    return () => clearInterval(anim);
  }, [score, T]);

  return <canvas ref={canvasRef} width={220} height={220} />;
}

export default function ResultScreen({ T, result: resultData, session, onDone }) {
  const result = resultData?.result || resultData || {};
  const { score = 0, earnedPts = 0, totalPts = 0, passed, placementLevel,
          belowMinimum, passingScore, levelResults } = result;
  const isPlacement = session?.examType === 'placement';
  const statusColor = belowMinimum ? T.error : isPlacement ? T.blue : passed ? T.success : T.error;
  const plColor = LEVEL_COLORS[placementLevel] || T.gold;

  return (
    <div style={{
      width: '100%', height: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: T.bg, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${statusColor}08 0%, transparent 70%)`,
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none',
      }} />

      <div style={{
        background: T.card, border: `1px solid ${T.border2}`,
        borderRadius: 28, padding: '52px 56px', textAlign: 'center',
        maxWidth: 520, width: '90%',
        boxShadow: `0 32px 100px ${statusColor}18`,
        position: 'relative',
      }}>
        {/* Status badge */}
        <div style={{
          position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
          background: statusColor, borderRadius: 20, padding: '6px 24px',
          fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: '#fff',
          boxShadow: `0 4px 20px ${statusColor}44`,
        }}>
          {belowMinimum ? 'BELOW MINIMUM ✗' : isPlacement ? 'PLACEMENT RESULT' : passed ? 'PASSED ✓' : 'NOT PASSED ✗'}
        </div>

        {/* Score ring */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <AnimatedScore score={score} T={T} />
        </div>

        {/* Placement level or below minimum message */}
        {isPlacement && (
          <div style={{ marginBottom: 24 }}>
            {belowMinimum ? (
              <div style={{
                background: T.error + '15', border: `1px solid ${T.error}44`,
                borderRadius: 16, padding: '16px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: T.error, marginBottom: 4 }}>
                  Score too low for placement
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>
                  Additional preparation is recommended before retaking the test
                </div>
              </div>
            ) : placementLevel && (
              <>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>Your language level</div>
                <div style={{
                  display: 'inline-block',
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: 52, fontWeight: 700, color: plColor,
                  background: plColor + '18', border: `2px solid ${plColor}44`,
                  borderRadius: 20, padding: '10px 36px', lineHeight: 1,
                }}>{placementLevel}</div>
              </>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, justifyContent: 'center' }}>
          {[
            { label: 'Points', value: `${earnedPts} / ${totalPts}`, color: T.gold },
            { label: 'Score', value: `${score}%`, color: statusColor },
            !isPlacement && { label: 'Required', value: `${passingScore ?? 70}%`, color: T.muted },
            !isPlacement && { label: 'Status', value: passed ? 'Pass' : 'Fail', color: statusColor },
          ].filter(Boolean).map((s, i) => (
            <div key={i} style={{
              background: T.panel, border: `1px solid ${T.border2}`,
              borderRadius: 14, padding: '14px 20px', minWidth: 100,
            }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per-level breakdown for placement */}
        {isPlacement && levelResults && (
          <div style={{
            background: T.panel, border: `1px solid ${T.border2}`,
            borderRadius: 14, padding: '16px 20px', marginBottom: 20, textAlign: 'left',
          }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>
              Per-level breakdown
            </div>
            {['A1','A2','B1','B2','C1','C2'].map(lvl => {
              const r = levelResults[lvl];
              if (!r) return null;
              const lc = LEVEL_COLORS[lvl] || T.muted;
              const isTarget = lvl === placementLevel;
              return (
                <div key={lvl} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px',
                  borderRadius: 8, marginBottom: 4,
                  background: isTarget ? lc + '14' : 'transparent',
                  border: `1px solid ${isTarget ? lc + '44' : 'transparent'}`,
                }}>
                  <span style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700,
                    color: lc, background: lc + '18', borderRadius: 5,
                    padding: '2px 8px', minWidth: 30, textAlign: 'center',
                  }}>{lvl}</span>
                  {/* Progress bar */}
                  <div style={{ flex: 1, height: 6, background: T.border2, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${r.pct}%`,
                      background: r.passed ? lc : T.error,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color: r.passed ? lc : T.error, minWidth: 36, textAlign: 'right' }}>
                    {r.pct}%
                  </span>
                  <span style={{ fontSize: 11, color: r.passed ? T.success : T.error, minWidth: 14 }}>
                    {r.passed ? '✓' : '✗'}
                  </span>
                  {isTarget && (
                    <span style={{ fontSize: 10, color: lc, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>← your level</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Student name */}
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 28 }}>
          <span style={{ color: T.text, fontWeight: 600 }}>{session?.studentName}</span>
          {' · '}{session?.examTitle}
        </div>

        {/* Writing/voice notice */}
        {earnedPts < totalPts && (
          <div style={{
            background: T.warning + '15', border: `1px solid ${T.warning}33`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 24,
            fontSize: 12, color: T.warning, lineHeight: 1.6,
          }}>
            ℹ Writing and voice answers require manual grading and will be scored separately by the examiner.
          </div>
        )}

        {/* Done button */}
        <button onClick={onDone} style={{
          width: '100%', padding: '15px',
          background: `linear-gradient(135deg, ${T.gold}, ${T.goldHover})`,
          border: 'none', borderRadius: 14, cursor: 'pointer',
          color: '#1a1200', fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700,
          letterSpacing: .3,
        }}>
          Done · Ավարտ
        </button>
      </div>

      {/* Particles */}
      {passed && !belowMinimum && !isPlacement && <Confetti T={T} color={T.success} />}
      {passed && !belowMinimum && isPlacement && <Confetti T={T} color={plColor} />}
    </div>
  );
}

function Confetti({ T, color }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', width: 6, height: 6, borderRadius: 2,
          background: i % 3 === 0 ? color : i % 3 === 1 ? T.gold : T.purple,
          left: `${5 + i * 4.5}%`, top: '-10px',
          animation: `fall${i % 4} ${2 + (i % 3)}s ${i * 0.15}s ease-in infinite`,
          opacity: .8,
        }} />
      ))}
      <style>{`
        @keyframes fall0 { 0%{top:-10px;transform:rotate(0)} 100%{top:110vh;transform:rotate(360deg)} }
        @keyframes fall1 { 0%{top:-10px;transform:rotate(0) translateX(0)} 100%{top:110vh;transform:rotate(-270deg) translateX(40px)} }
        @keyframes fall2 { 0%{top:-10px;transform:rotate(0) translateX(0)} 100%{top:110vh;transform:rotate(180deg) translateX(-30px)} }
        @keyframes fall3 { 0%{top:-10px;transform:rotate(0)} 100%{top:110vh;transform:rotate(450deg) translateX(20px)} }
      `}</style>
    </div>
  );
}
