import { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────────
const LEVEL_COLORS = { A1:'#4ade80',A2:'#86efac',B1:'#60a5fa',B2:'#93c5fd',C1:'#f59e0b',C2:'#fbbf24' };

// category derived from question type when section.category is absent
function questionCategory(q) {
  if (q.category) return q.category;
  const t = q.type ?? '';
  if (t.startsWith('SPEAKING')) return 'SPEAKING';
  if (t.startsWith('WRITING'))  return 'WRITING';
  // legacy types
  if (t === 'voice')   return 'SPEAKING';
  if (t === 'writing') return 'WRITING';
  if (q.audioSrc || q.media?.some?.(m => m.type === 'audio'))
    return 'LISTENING';
  return 'READING';
}

// ── Global timer ───────────────────────────────────────────────────────────────
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
  const fmt = s =>
    `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  return { fmt: fmt(remaining), pct: remaining / (durationMinutes * 60), urgent: remaining < 300 };
}

// ── Countdown hook (prep / record) ────────────────────────────────────────────
function useCountdown(seconds, running, onDone) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef(null);
  useEffect(() => {
    if (!running) return;
    setLeft(seconds);
    ref.current = setInterval(() => {
      setLeft(v => {
        if (v <= 1) { clearInterval(ref.current); onDone(); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running]);
  return left;
}

// ── Audio player (with replay limit) ──────────────────────────────────────────
function AudioPlayer({ src, maxReplays = 2, autoPlay = false, T, onFirstPlay }) {
  const [plays, setPlays]     = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProg]   = useState(0);
  const [started, setStarted] = useState(false);
  const aRef = useRef(null);

  useEffect(() => {
    if (autoPlay && aRef.current && plays === 0) {
      aRef.current.play().then(() => {
        setPlays(1); setPlaying(true); setStarted(true);
        onFirstPlay?.();
      }).catch(() => {});
    }
  }, [autoPlay]);

  const toggle = () => {
    const a = aRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); return; }
    if (plays >= maxReplays) return;
    if (!started || a.ended) setPlays(p => p + 1);
    setStarted(true);
    onFirstPlay?.();
    a.play();
    setPlaying(true);
  };

  const canPlay = plays < maxReplays || playing;

  return (
    <div style={{ background:'#ffffff08', border:'1px solid #ffffff15',
      borderRadius:14, padding:'14px 18px', marginBottom:18,
      display:'flex', alignItems:'center', gap:14 }}>
      <audio ref={aRef} src={src}
        onTimeUpdate={() => aRef.current && setProg(aRef.current.currentTime / (aRef.current.duration || 1))}
        onEnded={() => setPlaying(false)} />
      <button onClick={toggle} disabled={!canPlay} style={{
        width:44, height:44, borderRadius:'50%', flexShrink:0,
        background: canPlay ? T.gold : T.dim,
        border:'none', cursor: canPlay ? 'pointer' : 'not-allowed',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:16, color:'#1a1200',
      }}>{playing ? '⏸' : '▶'}</button>
      <div style={{ flex:1 }}>
        <div style={{ height:4, background:'#ffffff15', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress*100}%`, background:T.gold,
            borderRadius:99, transition:'width .2s' }} />
        </div>
        <div style={{ marginTop:7, fontSize:11, color:T.muted,
          display:'flex', justifyContent:'space-between' }}>
          <span>🔊 Audio</span>
          <span style={{ color: plays >= maxReplays ? T.error : T.muted }}>
            {plays}/{maxReplays} plays{plays >= maxReplays ? ' · limit reached' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── SPEAKING recorder ─────────────────────────────────────────────────────────
function SpeakingRecorder({ question, sessionId, backendUrl, T, onRecorded }) {
  const prepSeconds   = question.content?.prepSeconds ?? question.prepSeconds ?? 30;
  const recordSeconds = question.content?.recordSeconds ?? question.maxSeconds ?? 60;
  const maxAttempts   = question.content?.maxAttempts ?? 2;

  // phase: prep → recording → uploading → done | error
  const [phase,    setPhase]    = useState('prep');
  const [attempts, setAttempts] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadErr, setUploadErr] = useState(null);

  const mediaRef  = useRef(null);
  const chunksRef = useRef([]);

  // ── prep countdown ────────────────────────────────────────────────────────
  const prepLeft = useCountdown(prepSeconds, phase === 'prep', () => setPhase('recording'));

  // ── record countdown ──────────────────────────────────────────────────────
  const recLeft  = useCountdown(recordSeconds, phase === 'recording', stopAndUpload);

  // auto-start mic when prep ends
  useEffect(() => {
    if (phase !== 'recording') return;
    startMic();
  }, [phase]);

  async function startMic() {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => stream.getTracks().forEach(t => t.stop());
      mr.start(200);
      mediaRef.current = mr;
    } catch (e) {
      setPhase('error');
      setUploadErr('Microphone access denied: ' + e.message);
    }
  }

  function stopAndUpload() {
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.onstop = async () => {
        mediaRef.current.stream?.getTracks().forEach(t => t.stop());
        await upload();
      };
      mediaRef.current.stop();
    } else {
      upload();
    }
    setPhase('uploading');
  }

  async function upload() {
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url  = URL.createObjectURL(blob);
      setAudioUrl(url);
      const form = new FormData();
      form.append('audio', blob, `q${question.id}_${sessionId}.webm`);
      form.append('sessionId', sessionId);
      form.append('questionId', String(question.id));
      const r = await fetch(`${backendUrl}/api/session/voice`, { method:'POST', body:form });
      if (!r.ok) throw new Error('Upload failed');
      setPhase('done');
      onRecorded(question.id);
    } catch (e) {
      setPhase('error');
      setUploadErr(e.message);
    }
  }

  function retake() {
    setPhase('prep');
    setAttempts(a => a + 1);
    setAudioUrl(null);
    setUploadErr(null);
  }

  // ── render ────────────────────────────────────────────────────────────────
  const canRetake = phase === 'done' && attempts + 1 < maxAttempts;

  if (phase === 'prep') return (
    <div style={{ background:'#ffffff08', border:'1px solid #ffffff15',
      borderRadius:16, padding:'32px 28px', textAlign:'center' }}>
      <div style={{ fontSize:13, color:T.muted, marginBottom:12 }}>
        Preparation time
      </div>
      <div style={{ fontSize:64, fontWeight:900, color:T.gold,
        fontFamily:"'DM Mono',monospace", lineHeight:1, marginBottom:8 }}>
        {String(Math.floor(prepLeft/60)).padStart(2,'0')}:{String(prepLeft%60).padStart(2,'0')}
      </div>
      <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>
        Read the task carefully.<br/>Recording starts automatically.
      </div>
      {/* Shrinking bar */}
      <div style={{ marginTop:20, height:4, background:'#ffffff15',
        borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:99, background:T.gold,
          width:`${(prepLeft/prepSeconds)*100}%`, transition:'width 1s linear' }} />
      </div>
    </div>
  );

  if (phase === 'recording') return (
    <div style={{ background:'#ff000008', border:'1px solid #ff000033',
      borderRadius:16, padding:'32px 28px', textAlign:'center' }}>
      <div style={{ width:16, height:16, borderRadius:'50%', background:'#ef4444',
        margin:'0 auto 14px', animation:'recPulse 1s ease-in-out infinite' }} />
      <div style={{ fontSize:13, color:'#ef4444', fontWeight:700,
        letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>
        Recording
      </div>
      <div style={{ fontSize:52, fontWeight:900, color:T.text,
        fontFamily:"'DM Mono',monospace", lineHeight:1, marginBottom:10 }}>
        {String(Math.floor(recLeft/60)).padStart(2,'0')}:{String(recLeft%60).padStart(2,'0')}
      </div>
      <div style={{ height:4, background:'#ffffff15', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'#ef4444', borderRadius:99,
          width:`${(recLeft/recordSeconds)*100}%`, transition:'width 1s linear' }} />
      </div>
      <button onClick={stopAndUpload}
        style={{ marginTop:20, padding:'10px 24px', borderRadius:10,
          background:'#ef444422', border:'1px solid #ef444466',
          color:'#ef4444', cursor:'pointer', fontSize:13, fontWeight:700 }}>
        ⏹ Stop early
      </button>
    </div>
  );

  if (phase === 'uploading') return (
    <div style={{ textAlign:'center', padding:'40px 0', color:T.muted }}>
      <div style={{ fontSize:32, marginBottom:10 }}>⏳</div>
      Uploading recording…
    </div>
  );

  if (phase === 'done') return (
    <div style={{ background:'#4ade8008', border:'1px solid #4ade8033',
      borderRadius:16, padding:'24px 20px' }}>
      <div style={{ fontSize:13, color:'#4ade80', fontWeight:700, marginBottom:12 }}>
        ✓ Recording saved
      </div>
      {audioUrl && (
        <audio controls src={audioUrl}
          style={{ width:'100%', borderRadius:8, marginBottom:12 }} />
      )}
      {canRetake && (
        <button onClick={retake}
          style={{ padding:'8px 18px', borderRadius:8,
            background:'#ffffff08', border:`1px solid ${T.border2}`,
            color:T.muted, cursor:'pointer', fontSize:12 }}>
          ↺ Re-record ({maxAttempts - attempts - 1} left)
        </button>
      )}
    </div>
  );

  if (phase === 'error') return (
    <div style={{ background:'#ef444408', border:'1px solid #ef444433',
      borderRadius:14, padding:'20px', color:'#ef4444', fontSize:13 }}>
      ⚠ {uploadErr || 'Recording failed'}
    </div>
  );

  return null;
}

// ── WRITING input ─────────────────────────────────────────────────────────────
function WritingInput({ question, answer, onChange, T }) {
  const minW = question.content?.minWords ?? question.minWords ?? 0;
  const maxW = question.content?.maxWords ?? question.maxWords ?? 9999;
  const words = (answer || '').trim().split(/\s+/).filter(Boolean).length;
  const tooShort = words < minW;
  const tooLong  = words > maxW;
  const okColor  = tooShort ? T.muted : tooLong ? '#ef4444' : '#4ade80';

  // Block clipboard paste
  const blockPaste = (e) => e.preventDefault();

  return (
    <div>
      <textarea
        value={answer || ''}
        onChange={e => onChange(e.target.value)}
        onPaste={blockPaste}
        onCopy={blockPaste}
        onCut={blockPaste}
        placeholder="Write your answer here…"
        rows={10}
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        style={{
          width:'100%', boxSizing:'border-box',
          padding:'16px 18px',
          background:'#ffffff06',
          border:`1.5px solid ${tooLong ? '#ef4444' : answer ? T.gold+'55' : '#ffffff18'}`,
          borderRadius:12, color:T.text,
          fontFamily:"'DM Sans',sans-serif", fontSize:15, lineHeight:1.7,
          outline:'none', resize:'vertical',
          transition:'border .2s',
        }}
      />
      {/* Word count */}
      <div style={{ display:'flex', justifyContent:'space-between',
        marginTop:6, fontSize:11 }}>
        <span style={{ color:T.muted }}>
          {minW > 0 && `min ${minW} words`}
          {minW > 0 && maxW < 9999 && ' · '}
          {maxW < 9999 && `max ${maxW} words`}
        </span>
        <span style={{ color:okColor, fontWeight:600,
          fontFamily:"'DM Mono',monospace" }}>
          {words} {tooShort ? `/ ${minW} words` : tooLong ? `(${words - maxW} over limit)` : 'words ✓'}
        </span>
      </div>
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────
function QuestionCard({ q, index, total, answer, onAnswer,
  sessionId, backendUrl, T, config, onMediaPlayed }) {

  const category = questionCategory(q);
  const lc = LEVEL_COLORS[q.level] || '#94a3b8';

  // Media list (new schema) or legacy fields
  const mediaList = q.media ?? (
    q.audioSrc ? [{ type:'audio', url:q.audioSrc, maxPlays:config.maxAudioReplays ?? 2 }] :
    q.videoSrc ? [{ type:'video', url:q.videoSrc, maxPlays:config.maxVideoReplays ?? 1 }] :
    []
  );

  // Options (new schema uses content.options, legacy uses q.options)
  const options  = q.content?.options  ?? q.options  ?? [];
  const correct  = q.content?.correct  ?? q.correct;
  const qText    = q.prompt ?? q.text ?? '';

  const renderMedia = () => mediaList.map((m, i) => {
    if (m.type === 'audio') return (
      <AudioPlayer key={i} src={m.url} maxReplays={m.maxPlays ?? 2}
        autoPlay={category === 'LISTENING' && i === 0}
        T={T} onFirstPlay={onMediaPlayed} />
    );
    if (m.type === 'video') return (
      <video key={i} controls src={m.url} onPlay={onMediaPlayed}
        style={{ width:'100%', borderRadius:12, marginBottom:16,
          maxHeight:240 }} />
    );
    if (m.type === 'image') return (
      <img key={i} src={m.url} alt=""
        style={{ maxWidth:'100%', borderRadius:12, marginBottom:16 }} />
    );
    return null;
  });

  const renderInput = () => {
    const type = q.type;

    if (type === 'SINGLE_CHOICE' || type === 'single_choice') return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {options.map((opt, i) => {
          const sel = answer === i;
          return (
            <button key={i} onClick={() => onAnswer(i)} style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'14px 20px', borderRadius:12, cursor:'pointer',
              background: sel ? T.optionSelected : T.optionBg,
              border:`1.5px solid ${sel ? T.optionBorder : '#ffffff18'}`,
              textAlign:'left', transition:'all .15s',
            }}>
              <div style={{
                width:22, height:22, borderRadius:'50%', flexShrink:0,
                border:`2px solid ${sel ? T.gold : '#ffffff33'}`,
                background: sel ? T.gold : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{sel && <div style={{ width:8, height:8, borderRadius:'50%', background:'#1a1200' }} />}</div>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15,
                color: sel ? T.text : T.muted, lineHeight:1.5 }}>{opt}</span>
            </button>
          );
        })}
      </div>
    );

    if (type === 'MULTIPLE_CHOICE' || type === 'multi_choice' || type === 'multi_select') {
      const sel = Array.isArray(answer) ? answer : [];
      const toggle = i => onAnswer(sel.includes(i) ? sel.filter(x=>x!==i) : [...sel, i]);
      const required = q.content?.requiredCount;
      return (
        <div>
          <div style={{ fontSize:11, color:T.muted, marginBottom:8 }}>
            {required ? `Select exactly ${required}` : 'Select all that apply'}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {options.map((opt, i) => {
              const checked = sel.includes(i);
              return (
                <button key={i} onClick={() => toggle(i)} style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'14px 20px', borderRadius:12, cursor:'pointer',
                  background: checked ? T.optionSelected : T.optionBg,
                  border:`1.5px solid ${checked ? T.optionBorder : '#ffffff18'}`,
                  textAlign:'left', transition:'all .15s',
                }}>
                  <div style={{
                    width:20, height:20, borderRadius:5, flexShrink:0,
                    border:`2px solid ${checked ? T.gold : '#ffffff33'}`,
                    background: checked ? T.gold+'33' : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{checked && <span style={{ color:T.gold, fontSize:12, fontWeight:700 }}>✓</span>}</div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15,
                    color: checked ? T.text : T.muted }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (type === 'FILL_IN_THE_BLANKS' || type === 'fill_blank' || type === 'fill_wordbank') {
      return (
        <input type="text" value={answer || ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder="Type your answer…"
          autoComplete="off" spellCheck={false}
          style={{
            width:'100%', boxSizing:'border-box', padding:'14px 18px',
            background:'#ffffff06',
            border:`1.5px solid ${answer ? T.gold+'66' : '#ffffff18'}`,
            borderRadius:12, color:T.text,
            fontFamily:"'DM Sans',sans-serif", fontSize:15, outline:'none',
          }} />
      );
    }

    if (type === 'WRITING_INDEPENDENT' || type === 'WRITING_INTEGRATED' || type === 'writing') {
      return (
        <WritingInput question={q} answer={answer}
          onChange={onAnswer} T={T} />
      );
    }

    if (type === 'SPEAKING_INDEPENDENT' || type === 'SPEAKING_INTEGRATED' || type === 'voice') {
      return (
        <SpeakingRecorder question={q} sessionId={sessionId}
          backendUrl={backendUrl} T={T}
          onRecorded={qid => onAnswer('recorded_' + qid)} />
      );
    }

    return (
      <div style={{ color:T.muted, fontSize:13, padding:'20px 0' }}>
        [Unsupported question type: {type}]
      </div>
    );
  };

  return (
    <div>
      {/* Meta chips */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:T.muted }}>
          {index+1}/{total}
        </span>
        <span style={{ background:lc+'18', color:lc, border:`1px solid ${lc}33`,
          borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
          {q.section ?? category}
        </span>
        {config?.showQuestionLevel && (
          <span style={{ background:lc+'22', color:lc, border:`1px solid ${lc}44`,
            borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
            {q.level}
          </span>
        )}
        <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:6,
          color: category==='SPEAKING'?'#f87171':category==='WRITING'?'#60a5fa':
                 category==='LISTENING'?'#a78bfa':T.muted,
          background: (category==='SPEAKING'?'#f87171':category==='WRITING'?'#60a5fa':
                       category==='LISTENING'?'#a78bfa':'#94a3b8')+'18',
        }}>
          {category==='SPEAKING'?'🎙 Speaking':category==='WRITING'?'✍ Writing':
           category==='LISTENING'?'🎧 Listening':'📖 Reading'}
        </span>
        {config?.showQuestionPoints && (
          <span style={{ marginLeft:'auto', color:T.gold,
            fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700 }}>
            {q.points}pt
          </span>
        )}
      </div>

      {/* Context text (SPEAKING_INTEGRATED / WRITING_INTEGRATED) */}
      {q.contextText && (
        <div style={{ background:'#ffffff06', border:'1px solid #ffffff12',
          borderLeft:`3px solid ${T.gold}44`,
          borderRadius:12, padding:'14px 18px', marginBottom:18,
          fontSize:14, color:T.muted, lineHeight:1.7 }}>
          <div style={{ fontSize:10, color:T.gold, fontWeight:700,
            letterSpacing:1.2, textTransform:'uppercase', marginBottom:6 }}>
            Read / Context
          </div>
          {q.contextText}
        </div>
      )}

      {/* Media */}
      {renderMedia()}

      {/* Question text */}
      <div style={{ fontSize:17, lineHeight:1.75, color:T.text,
        fontFamily:"'DM Sans',sans-serif", marginBottom:24 }}>
        {qText}
      </div>

      {/* Answer input */}
      {renderInput()}
    </div>
  );
}

// ── Main ExamScreen ────────────────────────────────────────────────────────────
export default function ExamScreen({ T, session, backendUrl, onFinish }) {
  const {
    sessionId, studentName, examTitle, examType, examConfig, questions, answers: initAnswers,
  } = session;

  const [answers,      setAnswers]      = useState(initAnswers || {});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finishing,    setFinishing]    = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  // LISTENING: track if media has played at least once per question
  const [mediaPlayed,  setMediaPlayed]  = useState({});

  const config  = examConfig || { duration:60 };
  const totalQ  = questions.length;
  const answered = Object.keys(answers).length;

  const handleExpire = useCallback(() => finish(), []);
  const { fmt:timerFmt, urgent, pct:timerPct } = useTimer(config.duration || 60, handleExpire);

  const q        = questions[currentIndex];
  const category = q ? questionCategory(q) : 'READING';

  // ── Navigation rules per category ───────────────────────────────────────
  // READING:   free — can go anywhere
  // LISTENING: linear — Prev disabled; Next enabled only after media played
  // SPEAKING:  no navigation (recorder manages itself, auto-advance on done)
  // WRITING:   free (like READING)
  const canGoPrev = category !== 'LISTENING' && category !== 'SPEAKING' && currentIndex > 0;
  const canGoNext = (() => {
    if (currentIndex >= totalQ - 1) return false;
    if (category === 'SPEAKING') return false;          // recorder handles advance
    if (category === 'LISTENING') {
      return !!mediaPlayed[q?.id];                      // must have played audio first
    }
    return true;
  })();

  // Auto-advance after SPEAKING done
  useEffect(() => {
    const a = answers[String(q?.id)];
    if (category === 'SPEAKING' && a?.startsWith?.('recorded_') && currentIndex < totalQ - 1) {
      const t = setTimeout(() => setCurrentIndex(i => i + 1), 1200);
      return () => clearTimeout(t);
    }
  }, [answers, currentIndex]);

  const saveAnswer = async (questionId, value) => {
    setAnswers(prev => ({ ...prev, [String(questionId)]: value }));
    try {
      await fetch(`${backendUrl}/api/session/answer`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ sessionId, questionId, answer: value }),
      });
    } catch {}
  };

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const r    = await fetch(`${backendUrl}/api/session/finish`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await r.json();
      onFinish(data);
    } catch { onFinish({ result:null }); }
  };

  const goTo = i => { if (i >= 0 && i < totalQ) setCurrentIndex(i); };

  // ── Section divider awareness (show banner on section change) ─────────────
  const prevQ      = currentIndex > 0 ? questions[currentIndex - 1] : null;
  const newSection = prevQ && (prevQ.section !== q?.section || questionCategory(prevQ) !== category);

  return (
    <div style={{ width:'100%', height:'100vh', display:'flex', flexDirection:'column', background:T.bg }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        height:64, display:'flex', alignItems:'center',
        padding:'0 24px', gap:16,
        background:T.bg2, borderBottom:`1px solid ${T.border}`, flexShrink:0,
      }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20,
          fontWeight:700, color:T.gold }}>ArmExam</div>
        <div style={{ width:1, height:28, background:T.border2 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {examTitle}
          </div>
          <div style={{ fontSize:11, color:T.muted }}>
            {studentName} · {answered}/{totalQ} answered
          </div>
        </div>

        {/* Category indicator (changes color with section) */}
        <div style={{ fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:8,
          color: category==='SPEAKING'?'#f87171':category==='WRITING'?'#60a5fa':
                 category==='LISTENING'?'#a78bfa':T.gold,
          background: (category==='SPEAKING'?'#f87171':category==='WRITING'?'#60a5fa':
                       category==='LISTENING'?'#a78bfa':T.gold)+'15',
          border:`1px solid ${(category==='SPEAKING'?'#f87171':category==='WRITING'?'#60a5fa':
                  category==='LISTENING'?'#a78bfa':T.gold)}33`,
          transition:'all .3s',
        }}>
          {category==='SPEAKING'?'🎙 Speaking':category==='WRITING'?'✍ Writing':
           category==='LISTENING'?'🎧 Listening':'📖 Reading'}
        </div>

        {/* Timer */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          background:T.timerBg, borderRadius:12, padding:'7px 14px',
          border:`1px solid ${urgent ? T.error+'55' : T.border2}`,
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28"
            style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
            <circle cx="14" cy="14" r="11" fill="none" stroke={T.border2} strokeWidth="2.5"/>
            <circle cx="14" cy="14" r="11" fill="none"
              stroke={urgent ? T.error : T.timerText} strokeWidth="2.5"
              strokeDasharray={`${2*Math.PI*11}`}
              strokeDashoffset={`${2*Math.PI*11*(1-timerPct)}`}
              strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{
            fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700,
            color: urgent ? T.error : T.timerText,
            animation: urgent ? 'pulse 1s infinite' : 'none',
          }}>{timerFmt}</div>
        </div>

        <button onClick={() => setShowConfirm(true)} style={{
          background:'transparent', border:`1.5px solid ${T.gold}66`,
          borderRadius:10, padding:'8px 16px', cursor:'pointer',
          color:T.gold, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
        }}>Finish</button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Sidebar — hidden for SPEAKING (distraction-free) */}
        {category !== 'SPEAKING' && (
          <div style={{
            width:200, background:T.bg2, borderRight:`1px solid ${T.border}`,
            padding:12, overflowY:'auto', flexShrink:0,
            display:'flex', flexDirection:'column', gap:6,
          }}>
            <div style={{ fontSize:10, color:T.muted, letterSpacing:1,
              textTransform:'uppercase', marginBottom:6,
              fontFamily:"'DM Sans',sans-serif" }}>Questions</div>
            {questions.map((qn, i) => {
              const isAns = answers[String(qn.id)] !== undefined;
              const isCur = i === currentIndex;
              const lc    = LEVEL_COLORS[qn.level] || '#94a3b8';
              const cat   = questionCategory(qn);
              // LISTENING: can only go forward (no clicking back)
              const clickable = cat !== 'SPEAKING' &&
                (cat !== 'LISTENING' || i <= currentIndex);
              return (
                <button key={qn.id}
                  onClick={() => clickable && goTo(i)}
                  style={{
                    display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                    borderRadius:9, cursor: clickable ? 'pointer' : 'default',
                    textAlign:'left',
                    background: isCur ? T.gold+'18' : isAns ? '#4ade8010' : 'transparent',
                    border:`1px solid ${isCur ? T.gold+'55' : isAns ? '#4ade8033' : T.border}`,
                    opacity: clickable ? 1 : 0.45,
                  }}>
                  <div style={{
                    width:22, height:22, borderRadius:6, flexShrink:0,
                    background: isCur ? T.gold : isAns ? '#4ade80' : T.panel,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:700,
                    color: isCur || isAns ? '#fff' : T.dim,
                    fontFamily:"'DM Mono',monospace",
                  }}>{i+1}</div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:10, color: isCur ? T.gold : T.text,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      maxWidth:120 }}>
                      {(qn.prompt ?? qn.text ?? '').slice(0, 28)}…
                    </div>
                    <div style={{ display:'flex', gap:3, marginTop:2 }}>
                      <span style={{ fontSize:8, color:lc, background:lc+'18',
                        borderRadius:3, padding:'1px 4px' }}>{qn.level}</span>
                      {isAns && <span style={{ fontSize:8, color:'#4ade80' }}>✓</span>}
                      {cat === 'LISTENING' && i > currentIndex &&
                        <span style={{ fontSize:8, color:T.muted }}>🔒</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Question area */}
        <div style={{ flex:1, overflowY:'auto', padding:'32px 48px', maxWidth:800 }}>

          {/* Section change banner */}
          {newSection && (
            <div style={{ background:T.gold+'10', border:`1px solid ${T.gold}33`,
              borderRadius:12, padding:'10px 16px', marginBottom:20,
              display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>
                {category==='SPEAKING'?'🎙':category==='WRITING'?'✍':
                 category==='LISTENING'?'🎧':'📖'}
              </span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:T.gold }}>
                  New section: {q?.section ?? category}
                </div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                  {category==='LISTENING' && 'Listen carefully — you cannot go back in this section.'}
                  {category==='SPEAKING'  && 'Speak clearly — your response will be recorded automatically.'}
                  {category==='WRITING'   && 'Write your response. Copy-paste is disabled.'}
                  {category==='READING'   && 'Read the text and answer the questions.'}
                </div>
              </div>
            </div>
          )}

          {q && (
            <QuestionCard
              q={q} index={currentIndex} total={totalQ}
              answer={answers[String(q.id)]}
              onAnswer={val => saveAnswer(q.id, val)}
              sessionId={sessionId} backendUrl={backendUrl}
              T={T} config={config}
              onMediaPlayed={() => setMediaPlayed(p => ({ ...p, [q.id]: true }))}
            />
          )}

          {/* Navigation */}
          {category !== 'SPEAKING' && (
            <div style={{ display:'flex', justifyContent:'space-between',
              marginTop:36, paddingTop:24, borderTop:`1px solid ${T.border}` }}>
              <button onClick={() => goTo(currentIndex - 1)} disabled={!canGoPrev} style={{
                background:T.panel, border:`1px solid ${T.border2}`, borderRadius:10,
                padding:'11px 24px', cursor: canGoPrev ? 'pointer' : 'not-allowed',
                color: canGoPrev ? T.text : T.dim,
                fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500,
              }}>
                {category === 'LISTENING' ? '🔒 No back' : '← Previous'}
              </button>

              {currentIndex < totalQ - 1 ? (
                <button onClick={() => goTo(currentIndex + 1)}
                  disabled={!canGoNext} style={{
                    background: canGoNext ? T.gold : T.dim,
                    border:'none', borderRadius:10,
                    padding:'11px 28px', cursor: canGoNext ? 'pointer' : 'not-allowed',
                    color: canGoNext ? '#1a1200' : '#ffffff44',
                    fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700,
                    transition:'all .15s',
                  }}>
                  {category === 'LISTENING' && !mediaPlayed[q?.id]
                    ? '🎧 Play audio first'
                    : 'Next →'}
                </button>
              ) : (
                <button onClick={() => setShowConfirm(true)} style={{
                  background:'#4ade80', border:'none', borderRadius:10,
                  padding:'11px 28px', cursor:'pointer',
                  color:'#0a1a0a', fontFamily:"'DM Sans',sans-serif",
                  fontSize:13, fontWeight:700,
                }}>Finish Exam ✓</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm modal ─────────────────────────────────────────────────── */}
      {showConfirm && (
        <div style={{ position:'fixed', inset:0, background:'#00000088',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
          justifyContent:'center', zIndex:9998 }}>
          <div style={{ background:T.card, border:`1px solid ${T.border2}`,
            borderRadius:20, padding:'40px 48px', maxWidth:420, width:'90%',
            textAlign:'center', boxShadow:'0 24px 80px #00000055' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🎓</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24,
              fontWeight:700, color:T.text, marginBottom:8 }}>Submit Exam?</div>
            <div style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:8 }}>
              Answered <strong style={{ color:T.gold }}>{answered}</strong> of{' '}
              <strong style={{ color:T.gold }}>{totalQ}</strong> questions.
            </div>
            {answered < totalQ && (
              <div style={{ background:T.warning+'18', border:`1px solid ${T.warning}44`,
                borderRadius:10, padding:'10px 16px', marginBottom:20,
                fontSize:12, color:T.warning }}>
                ⚠ {totalQ - answered} questions unanswered
              </div>
            )}
            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button onClick={() => setShowConfirm(false)} style={{
                flex:1, padding:'12px', background:T.panel,
                border:`1px solid ${T.border2}`, borderRadius:12,
                cursor:'pointer', color:T.muted,
                fontFamily:"'DM Sans',sans-serif", fontSize:13,
              }}>Cancel</button>
              <button onClick={() => { setShowConfirm(false); finish(); }}
                disabled={finishing} style={{
                  flex:1, padding:'12px',
                  background: finishing ? T.dim : '#4ade80',
                  border:'none', borderRadius:12,
                  cursor: finishing ? 'not-allowed' : 'pointer',
                  color:'#0a1a0a', fontFamily:"'DM Sans',sans-serif",
                  fontSize:13, fontWeight:700,
                }}>{finishing ? 'Submitting…' : 'Submit ✓'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes recPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
      `}</style>
    </div>
  );
}
