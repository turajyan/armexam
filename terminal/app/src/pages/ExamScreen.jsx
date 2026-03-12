import { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const LEVEL_COLORS = { A1:'#4ade80',A2:'#86efac',B1:'#60a5fa',B2:'#93c5fd',C1:'#f59e0b',C2:'#fbbf24' };

// ── Timer ─────────────────────────────────────────────────────────────────────
function useTimer(durationMinutes, onExpire) {
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [onExpire]);

  const fmt = (s) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const pct = remaining / (durationMinutes * 60);
  const urgent = remaining < 300; // < 5 min

  return { remaining, fmt: fmt(remaining), pct, urgent };
}

// ── Audio Player ──────────────────────────────────────────────────────────────
function AudioPlayer({ src, maxReplays, T }) {
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const canPlay = plays < maxReplays;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      if (!canPlay) return;
      if (audioRef.current.ended || audioRef.current.currentTime === 0) {
        setPlays(p => p + 1);
      }
      audioRef.current.play();
    }
    setPlaying(p => !p);
  };

  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border2}`,
      borderRadius: 14, padding: '16px 20px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => setProgress(audioRef.current ? audioRef.current.currentTime / (audioRef.current.duration || 1) : 0)}
        onEnded={() => setPlaying(false)}
      />
      <button onClick={toggle} disabled={!canPlay && !playing} style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: canPlay ? T.gold : T.dim,
        border: 'none', cursor: canPlay ? 'pointer' : 'not-allowed',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: '#1a1200', transition: 'all .15s',
      }}>
        {playing ? '⏸' : '▶'}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ height: 4, background: T.border2, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress*100}%`, background: T.gold, borderRadius: 99, transition: 'width .2s' }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: T.muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>🔊 Audio</span>
          <span style={{ color: plays >= maxReplays ? T.error : T.muted }}>
            {plays}/{maxReplays} {plays >= maxReplays ? '· Max replays reached' : 'replays used'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Video Player ──────────────────────────────────────────────────────────────
function VideoPlayer({ src, maxReplays, T }) {
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const canPlay = plays < maxReplays;

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      if (!canPlay) return;
      if (videoRef.current.ended || videoRef.current.currentTime === 0) setPlays(p => p + 1);
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div style={{ marginBottom: 20, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border2}` }}>
      <video ref={videoRef} src={src} style={{ width: '100%', display: 'block', background: '#000', maxHeight: 300 }}
        onEnded={() => setPlaying(false)} />
      <div style={{ background: T.panel, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={toggle} disabled={!canPlay && !playing} style={{
          background: canPlay ? T.gold : T.dim, border: 'none', borderRadius: 8,
          padding: '6px 16px', cursor: canPlay ? 'pointer' : 'not-allowed',
          color: '#1a1200', fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
        }}>{playing ? '⏸ Pause' : '▶ Play'}</button>
        <span style={{ fontSize: 11, color: plays >= maxReplays ? T.error : T.muted }}>
          📹 {plays}/{maxReplays} replays used {plays >= maxReplays ? '· limit reached' : ''}
        </span>
      </div>
    </div>
  );
}

// ── Voice Recorder ────────────────────────────────────────────────────────────
function VoiceRecorder({ question, sessionId, backendUrl, T, onRecorded }) {
  const [state, setState] = useState('idle'); // idle | recording | uploading | done | error
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = question.maxAttempts || 2;
  const minSeconds = question.minSeconds || 10;
  const maxSeconds = question.maxSeconds || 60;

  const recRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    if (attempts >= maxAttempts) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      recRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recRef.current.ondataavailable = e => chunksRef.current.push(e.data);
      recRef.current.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const b = new Blob(chunksRef.current, { type: 'audio/webm' });
        setBlob(b);
        uploadBlob(b);
      };
      recRef.current.start(100);
      setDuration(0);
      setState('recording');
      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d + 1 >= maxSeconds) { stopRecording(); return maxSeconds; }
          return d + 1;
        });
      }, 1000);
    } catch {
      setState('error');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recRef.current?.state === 'recording') recRef.current.stop();
    setAttempts(a => a + 1);
  };

  const uploadBlob = async (b) => {
    setState('uploading');
    const form = new FormData();
    form.append('audio', b, 'recording.webm');
    form.append('sessionId', sessionId);
    form.append('questionId', question.id);
    try {
      const r = await fetch(`${backendUrl}/api/session/voice`, { method: 'POST', body: form });
      if (r.ok) { setState('done'); onRecorded(question.id); }
      else setState('error');
    } catch { setState('error'); }
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{
      background: T.panel, border: `1.5px solid ${
        state === 'recording' ? T.error + '88' :
        state === 'done' ? T.success + '55' : T.border2
      }`, borderRadius: 16, padding: '20px 24px', marginTop: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        {/* Recording indicator */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: state === 'recording' ? T.error : state === 'done' ? T.success : T.card,
            border: `2px solid ${state === 'recording' ? T.error : state === 'done' ? T.success : T.border2}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, cursor: state === 'recording' ? 'pointer' : 'default',
            transition: 'all .2s',
          }} onClick={state === 'recording' ? stopRecording : undefined}>
            {state === 'idle' ? '🎤' : state === 'recording' ? '⏹' : state === 'done' ? '✓' : state === 'uploading' ? '⏳' : '⚠'}
          </div>
          {state === 'recording' && (
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: `2px solid ${T.error}66`,
              animation: 'ripple 1.2s ease-out infinite',
            }} />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
            {state === 'idle' && 'Ready to record'}
            {state === 'recording' && `Recording... ${fmt(duration)} / ${fmt(maxSeconds)}`}
            {state === 'uploading' && 'Uploading...'}
            {state === 'done' && '✓ Recording saved'}
            {state === 'error' && '⚠ Error — try again'}
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>
            Min: {fmt(minSeconds)} · Max: {fmt(maxSeconds)} · {attempts}/{maxAttempts} attempts
          </div>

          {/* Progress bar while recording */}
          {state === 'recording' && (
            <div style={{ marginTop: 8, height: 3, background: T.border2, borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${(duration/maxSeconds)*100}%`, background: T.error, borderRadius: 99, transition: 'width .5s' }} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8 }}>
          {state === 'idle' && (
            <button onClick={startRecording} disabled={attempts >= maxAttempts} style={{
              background: attempts >= maxAttempts ? T.dim : T.error,
              border: 'none', borderRadius: 10, padding: '10px 18px',
              color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
              cursor: attempts >= maxAttempts ? 'not-allowed' : 'pointer',
            }}>🎤 Record</button>
          )}
          {state === 'recording' && (
            <button onClick={stopRecording} disabled={duration < minSeconds} style={{
              background: duration >= minSeconds ? T.success : T.dim,
              border: 'none', borderRadius: 10, padding: '10px 18px',
              color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
              cursor: duration >= minSeconds ? 'pointer' : 'not-allowed',
            }}>⏹ Stop</button>
          )}
          {state === 'done' && attempts < maxAttempts && (
            <button onClick={() => { setBlob(null); setState('idle'); }} style={{
              background: T.card, border: `1px solid ${T.border2}`,
              borderRadius: 10, padding: '10px 18px',
              color: T.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: 'pointer',
            }}>Re-record ({maxAttempts - attempts} left)</button>
          )}
        </div>
      </div>

      {/* Playback if recorded */}
      {blob && state === 'done' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Preview your recording:</div>
          <audio controls src={URL.createObjectURL(blob)} style={{ width: '100%', height: 32 }} />
        </div>
      )}

      <style>{`
        @keyframes ripple { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.6);opacity:0} }
      `}</style>
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ q, index, total, answer, onAnswer, sessionId, backendUrl, T, config }) {
  const lc = LEVEL_COLORS[q.level] || '#94a3b8';

  const renderInput = () => {
    if (q.type === 'single_choice') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, i) => {
            const sel = answer === i;
            return (
              <button key={i} onClick={() => onAnswer(i)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
                background: sel ? T.optionSelected : T.optionBg,
                border: `1.5px solid ${sel ? T.optionBorder : T.border2}`,
                textAlign: 'left', transition: 'all .15s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${sel ? T.gold : T.dim}`,
                  background: sel ? T.gold : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1200' }} />}
                </div>
                <span style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: sel ? T.text : T.muted,
                  lineHeight: 1.5,
                }}>{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === 'multi_choice' || q.type === 'multi_select') {
      const sel = Array.isArray(answer) ? answer : [];
      const toggle = (i) => {
        const next = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i];
        onAnswer(next);
      };
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Select all that apply</div>
          {q.options.map((opt, i) => {
            const checked = sel.includes(i);
            return (
              <button key={i} onClick={() => toggle(i)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
                background: checked ? T.optionSelected : T.optionBg,
                border: `1.5px solid ${checked ? T.optionBorder : T.border2}`,
                textAlign: 'left', transition: 'all .15s',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${checked ? T.gold : T.dim}`,
                  background: checked ? T.gold + '33' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <span style={{ color: T.gold, fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: checked ? T.text : T.muted }}>{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === 'fill_blank') {
      return (
        <input
          type="text" value={answer || ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder="Մուտքագրե՛ք պատասխանը / Enter your answer..."
          autoComplete="off" spellCheck={false}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '14px 18px',
            background: T.inputBg, border: `1.5px solid ${answer ? T.gold + '66' : T.inputBorder}`,
            borderRadius: 12, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 15,
            outline: 'none', transition: 'border .2s',
          }}
        />
      );
    }

    if (q.type === 'writing') {
      return (
        <div>
          <textarea
            value={answer || ''} onChange={e => onAnswer(e.target.value)}
            placeholder="Գրե՛ք ձեր պատասխանը / Write your answer..."
            rows={6} spellCheck={false}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '14px 18px',
              background: T.inputBg, border: `1.5px solid ${answer ? T.gold + '66' : T.inputBorder}`,
              borderRadius: 12, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 15,
              outline: 'none', resize: 'vertical', lineHeight: 1.6,
            }}
          />
          <div style={{ fontSize: 11, color: T.muted, marginTop: 6, textAlign: 'right' }}>
            {(answer || '').split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      );
    }

    if (q.type === 'voice') {
      return (
        <VoiceRecorder
          question={q} sessionId={sessionId} backendUrl={backendUrl}
          T={T} onRecorded={(qid) => onAnswer('recorded_' + qid)}
        />
      );
    }

    if (q.type === 'audio') {
      return (
        <div>
          {q.audioSrc && <AudioPlayer src={q.audioSrc} maxReplays={config.maxAudioReplays} T={T} />}
          {q.options && (
            <QuestionCard q={{ ...q, type: 'single_choice' }} index={index} total={total}
              answer={answer} onAnswer={onAnswer} T={T} config={config}
              sessionId={sessionId} backendUrl={backendUrl} />
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      {/* Question meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.muted }}>
          Q{index + 1}/{total}
        </span>
        <span style={{
          background: lc + '18', color: lc, border: `1px solid ${lc}33`,
          borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700,
        }}>{q.section}</span>
        {config.showQuestionLevel && (
          <span style={{
            background: lc + '22', color: lc, border: `1px solid ${lc}44`,
            borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700,
          }}>{q.level}</span>
        )}
        {config.showQuestionPoints && (
          <span style={{ marginLeft: 'auto', color: T.gold, fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700 }}>
            {q.points}pt
          </span>
        )}
      </div>

      {/* Image */}
      {q.imageSrc && (
        <img src={q.imageSrc} alt="" style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 16 }} />
      )}

      {/* Video */}
      {q.videoSrc && <VideoPlayer src={q.videoSrc} maxReplays={config.maxVideoReplays} T={T} />}

      {/* Audio — shown for any question that has audioSrc */}
      {q.audioSrc && (
        <AudioPlayer src={q.audioSrc} maxReplays={config.maxAudioReplays} T={T} />
      )}

      {/* Audio standalone question — no extra render needed, handled above */}
      {q.type === 'audio' && !q.audioSrc && (
        <AudioPlayer src={q.audioSrc} maxReplays={config.maxAudioReplays} T={T} />
      )}

      {/* Question text */}
      <div style={{
        fontSize: 17, lineHeight: 1.7, color: T.text,
        fontFamily: "'DM Sans',sans-serif", marginBottom: 24, fontWeight: 400,
      }}>{q.text}</div>

      {/* Answer input — skip duplicate render for audio type */}
      {q.type !== 'audio' && renderInput()}
      {q.type === 'audio' && q.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, i) => {
            const sel = answer === i;
            return (
              <button key={i} onClick={() => onAnswer(i)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
                background: sel ? T.optionSelected : T.optionBg,
                border: `1.5px solid ${sel ? T.optionBorder : T.border2}`,
                textAlign: 'left', transition: 'all .15s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${sel ? T.gold : T.dim}`,
                  background: sel ? T.gold : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1200' }} />}
                </div>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: sel ? T.text : T.muted }}>{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ExamScreen ───────────────────────────────────────────────────────────
export default function ExamScreen({ T, session, backendUrl, onFinish }) {
  const { sessionId, studentName, examTitle, examType, examConfig, questions, answers: initAnswers } = session;
  const [answers, setAnswers] = useState(initAnswers || {});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const config = examConfig || { duration: 60, maxAudioReplays: 2, maxVideoReplays: 1 };
  const totalQ = questions.length;
  const answered = Object.keys(answers).length;

  const handleExpire = useCallback(() => { finish(); }, []);
  const { fmt: timerFmt, urgent, pct: timerPct } = useTimer(config.duration || 60, handleExpire);

  // Save answer to backend
  const saveAnswer = async (questionId, value) => {
    setAnswers(prev => ({ ...prev, [String(questionId)]: value }));
    try {
      await fetch(`${backendUrl}/api/session/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId, answer: value }),
      });
    } catch {}
  };

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const r = await fetch(`${backendUrl}/api/session/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await r.json();
      onFinish(data);
    } catch {
      onFinish({ result: null });
    }
  };

  const q = questions[currentIndex];
  const goTo = (i) => { if (i >= 0 && i < totalQ) setCurrentIndex(i); };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 20,
        background: T.bg2, borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: T.gold, marginRight: 8 }}>
          ArmExam
        </div>
        <div style={{ width: 1, height: 28, background: T.border2 }} />

        {/* Exam title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {examTitle}
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>{studentName} · {answered}/{totalQ} answered</div>
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.timerBg, borderRadius: 12, padding: '8px 16px',
          border: `1px solid ${urgent ? T.error + '55' : T.border2}`,
        }}>
          <div style={{ position: 'relative', width: 28, height: 28 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="14" cy="14" r="11" fill="none" stroke={T.border2} strokeWidth="2.5"/>
              <circle cx="14" cy="14" r="11" fill="none"
                stroke={urgent ? T.error : T.timerText} strokeWidth="2.5"
                strokeDasharray={`${2*Math.PI*11}`}
                strokeDashoffset={`${2*Math.PI*11*(1-timerPct)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 700, color: urgent ? T.error : T.timerText, fontFamily: "'DM Mono',monospace",
            }}>⏱</div>
          </div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700,
            color: urgent ? T.error : T.timerText,
            animation: urgent ? 'pulse 1s infinite' : 'none',
          }}>{timerFmt}</div>
        </div>

        {/* Finish button */}
        <button onClick={() => setShowConfirm(true)} style={{
          background: 'transparent', border: `1.5px solid ${T.gold}66`,
          borderRadius: 10, padding: '8px 18px', cursor: 'pointer',
          color: T.gold, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
        }}>Finish Exam</button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Question Navigator sidebar */}
        <div style={{
          width: 220, background: T.bg2, borderRight: `1px solid ${T.border}`,
          padding: 16, overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
            Questions
          </div>
          {questions.map((qn, i) => {
            const isAns = answers[String(qn.id)] !== undefined;
            const isCur = i === currentIndex;
            const lc = LEVEL_COLORS[qn.level] || '#94a3b8';
            return (
              <button key={qn.id} onClick={() => goTo(i)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                background: isCur ? T.gold + '18' : isAns ? T.success + '10' : 'transparent',
                border: `1px solid ${isCur ? T.gold + '55' : isAns ? T.success + '33' : T.border}`,
                transition: 'all .15s',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: isCur ? T.gold : isAns ? T.success : T.panel,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: isCur || isAns ? '#fff' : T.dim,
                  fontFamily: "'DM Mono',monospace",
                }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: isCur ? T.gold : T.text, fontWeight: isCur ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                    {qn.text.slice(0, 30)}…
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                    <span style={{ fontSize: 9, color: lc, background: lc+'18', borderRadius: 3, padding: '1px 5px' }}>{qn.section}</span>
                    {isAns && <span style={{ fontSize: 9, color: T.success }}>✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Question content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', maxWidth: 780 }}>
          {q && (
            <QuestionCard
              q={q} index={currentIndex} total={totalQ}
              answer={answers[String(q.id)]}
              onAnswer={(val) => saveAnswer(q.id, val)}
              sessionId={sessionId} backendUrl={backendUrl}
              T={T} config={config}
            />
          )}

          {/* Prev / Next */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
            <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} style={{
              background: T.panel, border: `1px solid ${T.border2}`, borderRadius: 10,
              padding: '11px 24px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              color: currentIndex === 0 ? T.dim : T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500,
            }}>← Previous</button>

            {currentIndex < totalQ - 1 ? (
              <button onClick={() => goTo(currentIndex + 1)} style={{
                background: T.gold, border: 'none', borderRadius: 10,
                padding: '11px 28px', cursor: 'pointer',
                color: '#1a1200', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
              }}>Next →</button>
            ) : (
              <button onClick={() => setShowConfirm(true)} style={{
                background: T.success, border: 'none', borderRadius: 10,
                padding: '11px 28px', cursor: 'pointer',
                color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
              }}>Finish Exam ✓</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirm finish modal ── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998,
        }}>
          <div style={{
            background: T.card, border: `1px solid ${T.border2}`,
            borderRadius: 20, padding: '40px 48px', maxWidth: 420, width: '90%',
            textAlign: 'center', boxShadow: '0 24px 80px #00000055',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎓</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              Submit Exam?
            </div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 8 }}>
              You've answered <strong style={{ color: T.gold }}>{answered}</strong> of <strong style={{ color: T.gold }}>{totalQ}</strong> questions.
            </div>
            {answered < totalQ && (
              <div style={{ background: T.warning + '18', border: `1px solid ${T.warning}44`, borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 12, color: T.warning }}>
                ⚠ {totalQ - answered} questions unanswered
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowConfirm(false)} style={{
                flex: 1, padding: '12px', background: T.panel, border: `1px solid ${T.border2}`,
                borderRadius: 12, cursor: 'pointer', color: T.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              }}>Cancel</button>
              <button onClick={() => { setShowConfirm(false); finish(); }} disabled={finishing} style={{
                flex: 1, padding: '12px', background: finishing ? T.dim : T.success,
                border: 'none', borderRadius: 12, cursor: finishing ? 'not-allowed' : 'pointer',
                color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
              }}>{finishing ? 'Submitting...' : 'Submit ✓'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
