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
    <div style={{ background:T.card, border:'1px solid #ffffff15',
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
        <div style={{ height:4, background:T.border, borderRadius:99, overflow:'hidden' }}>
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

      // ── SHA-256 integrity ────────────────────────────────────────────────
      let sha256 = null;
      try {
        const buf    = await blob.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', buf);
        sha256 = Array.from(new Uint8Array(digest))
          .map(b => b.toString(16).padStart(2, '0')).join('');
      } catch {} // non-critical; backend accepts without hash too

      const form = new FormData();
      form.append('audio', blob, `q${question.id}_${sessionId}.webm`);
      form.append('sessionId', sessionId);
      form.append('questionId', String(question.id));
      if (sha256) form.append('sha256', sha256);

      const r = await fetch(`${backendUrl}/api/session/voice`, { method:'POST', body:form });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed');
      }
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
    <div style={{ background:T.card, border:'1px solid #ffffff15',
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
      <div style={{ marginTop:20, height:4, background:T.border,
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
      <div style={{ height:4, background:T.border, borderRadius:99, overflow:'hidden' }}>
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
            background:T.card, border:`1px solid ${T.border2}`,
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
          background:T.panel,
          border:`1.5px solid ${tooLong ? '#ef4444' : answer ? T.gold+'55' : T.border2}`,
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
  const c  = q.content || {};
  const mediaList_media = Array.isArray(q.media) ? q.media : [];

  // ── per-type state ────────────────────────────────────────────────────────
  // DRAG_TO_TEXT
  const [placed,    setPlaced]    = useState({});
  const [bankWords, setBankWords] = useState(null);
  const [dragWord,  setDragWord]  = useState(null);
  // DRAG_AND_DROP_TABLE
  const [tPlaced, setTPlaced] = useState({});
  const [tBank,   setTBank]   = useState(null);
  const [tDrag,   setTDrag]   = useState(null);
  // IMAGE_CLICK
  const [imgClick, setImgClick] = useState(null);
  // DRAG_AND_DROP_IMAGE
  const [ddiPlaced,   setDdiPlaced]   = useState({});
  const [ddiBank,     setDdiBank]     = useState(null);
  const [ddiDrag,     setDdiDrag]     = useState(null);
  const [ddiDragFrom, setDdiDragFrom] = useState(null);

  // reset state when question changes
  useEffect(() => {
    setBankWords(null); setPlaced({}); setDragWord(null);
    setTPlaced({}); setTBank(null); setTDrag(null);
    setImgClick(null);
    setDdiPlaced({}); setDdiBank(null); setDdiDrag(null); setDdiDragFrom(null);
  }, [q.id]);

  // DRAG_TO_TEXT helpers
  const parseDragText = (text) => {
    const segs = []; const rx = /\{(slot_\d+)\}/g; let last = 0, m;
    rx.lastIndex = 0;
    while ((m = rx.exec(text)) !== null) {
      if (m.index > last) segs.push({ type:'text', val: text.slice(last, m.index) });
      segs.push({ type:'slot', name: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) segs.push({ type:'text', val: text.slice(last) });
    return segs;
  };
  const bank = bankWords ?? [...(c.wordBank || [])];
  const initBank = () => { const wb = [...(c.wordBank||[])].sort(()=>Math.random()-.5); setBankWords(wb); setPlaced({}); onAnswer({}); };
  const dropIntoSlot = (slotName) => {
    if (!dragWord) return;
    const prev = placed[slotName];
    const next = { ...placed, [slotName]: dragWord };
    setPlaced(next);
    setBankWords(bw => { const nb = (bw||[]).filter(w=>w!==dragWord); return prev ? [...nb, prev] : nb; });
    setDragWord(null);
    onAnswer(next);
  };
  const returnToBank = (slotName) => {
    const w = placed[slotName]; if (!w) return;
    const next = {...placed}; delete next[slotName];
    setPlaced(next);
    setBankWords(bw => [...(bw||[]), w]);
    onAnswer(next);
  };

  // DDI helpers
  const LABEL_COLORS = ['#f59e0b','#60a5fa','#4ade80','#f87171','#a78bfa','#34d399','#fb923c','#e879f9'];
  const labelColor = (lid, labels) => { const i = labels.findIndex(l=>l.id===lid); return i>=0 ? LABEL_COLORS[i%LABEL_COLORS.length] : T.gold; };
  const startDragLabel = (lid, fromHs=null) => { setDdiDrag(lid); setDdiDragFrom(fromHs??'bank'); };
  const endDrag = () => { setDdiDrag(null); setDdiDragFrom(null); };

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
    if (m.type === 'image' && !['IMAGE_CLICK','DRAG_AND_DROP_IMAGE'].includes(q.type)) return (
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
              border:`1.5px solid ${sel ? T.optionBorder : T.border2}`,
              textAlign:'left', transition:'all .15s',
            }}>
              <div style={{
                width:22, height:22, borderRadius:'50%', flexShrink:0,
                border:`2px solid ${sel ? T.gold : T.border2}`,
                background: sel ? T.gold : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{sel && <div style={{ width:8, height:8, borderRadius:'50%', background:'#1a1200' }} />}</div>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:typo.answerFontSize,
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
                  border:`1.5px solid ${checked ? T.optionBorder : T.border2}`,
                  textAlign:'left', transition:'all .15s',
                }}>
                  <div style={{
                    width:20, height:20, borderRadius:5, flexShrink:0,
                    border:`2px solid ${checked ? T.gold : T.border2}`,
                    background: checked ? T.gold+'33' : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{checked && <span style={{ color:T.gold, fontSize:12, fontWeight:700 }}>✓</span>}</div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:typo.answerFontSize,
                    color: checked ? T.text : T.muted }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (type === 'FILL_IN_THE_BLANKS' || type === 'fill_blank' || type === 'fill_wordbank') {
      const segs = c.segments || [];
      const ans  = (typeof answer === 'object' && answer !== null) ? answer : {};
      const setBlank = (id, val) => onAnswer({ ...ans, [id]: val });
      if (segs.length === 0) return (
        <input type="text" value={answer || ''} onChange={e => onAnswer(e.target.value)}
          placeholder="Type your answer…" autoComplete="off" spellCheck={false}
          style={{ width:'100%', boxSizing:'border-box', padding:'14px 18px', background:T.panel,
            border:`1.5px solid ${answer ? T.gold+'66' : T.border2}`,
            borderRadius:12, color:T.text, fontFamily:"'DM Sans',sans-serif", fontSize:15, outline:'none' }} />
      );
      return (
        <div style={{ background:T.panel, border:'1px solid #ffffff18', borderRadius:12,
          padding:'18px 22px', fontSize:16, color:T.text, fontFamily:"'DM Sans',sans-serif", lineHeight:2.6 }}>
          {segs.map((s, i) =>
            s.type === 'text'
              ? <span key={i}>{s.value}</span>
              : <input key={i} type="text" value={ans[s.id] || ''} autoComplete="off" spellCheck={false}
                  onChange={e => setBlank(s.id, e.target.value)}
                  placeholder="…"
                  style={{ display:'inline-block',
                    width: Math.max(80, ((ans[s.id]||'').length + 3) * 9) + 'px',
                    background:'transparent',
                    borderTop:'none', borderLeft:'none', borderRight:'none',
                    borderBottom:`2px solid ${ans[s.id] ? T.gold : T.border2}`,
                    color:T.gold, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:600,
                    outline:'none', textAlign:'center', padding:'0 4px', margin:'0 3px',
                    transition:'border-bottom-color .15s' }} />
          )}
        </div>
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

    if (type === 'DRAG_TO_TEXT') {
      const segs = parseDragText(c.text || '');
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ background:T.panel, border:'1px solid #ffffff18', borderRadius:12,
            padding:'18px 22px', fontSize:16, color:T.text, fontFamily:"'DM Sans',sans-serif", lineHeight:2.2 }}>
            {segs.map((seg, i) =>
              seg.type === 'text'
                ? <span key={i}>{seg.val}</span>
                : (
                  <span key={i}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); dropIntoSlot(seg.name); }}
                    onClick={() => placed[seg.name] && returnToBank(seg.name)}
                    style={{ display:'inline-block', minWidth:90, textAlign:'center',
                      background: placed[seg.name] ? T.gold+'22' : T.card,
                      border:`2px dashed ${placed[seg.name] ? T.gold+'88' : T.border2}`,
                      borderRadius:8, padding:'2px 14px', margin:'0 4px',
                      color: placed[seg.name] ? T.gold : T.muted,
                      fontSize:14, fontWeight:600, cursor: placed[seg.name] ? 'pointer' : 'default',
                      transition:'all .15s' }}
                    title={placed[seg.name] ? 'Click to return' : 'Drop here'}>
                    {placed[seg.name] || '___'}
                  </span>
                )
            )}
          </div>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted,
              marginBottom:8, letterSpacing:.5, textTransform:'uppercase' }}>Word bank</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {bank.map((w, i) => (
                <span key={w+i} draggable
                  onDragStart={() => setDragWord(w)} onDragEnd={() => setDragWord(null)}
                  style={{ background: dragWord===w ? T.gold+'33' : T.card,
                    border:`1.5px solid ${dragWord===w ? T.gold+'88' : T.border2}`,
                    borderRadius:8, padding:'8px 18px', fontSize:14, color:T.text,
                    fontFamily:"'DM Sans',sans-serif", fontWeight:500,
                    cursor:'grab', userSelect:'none', transition:'all .15s' }}>
                  {w}
                </span>
              ))}
              {bank.length === 0 && <span style={{ fontSize:12, color:T.muted }}>All words placed</span>}
            </div>
          </div>
          <button onClick={initBank} style={{ alignSelf:'flex-start', background:'transparent',
            border:'1px solid #ffffff22', borderRadius:8, padding:'6px 14px',
            color:T.muted, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            ↺ Reset
          </button>

        </div>
      );
    }

    if (type === 'DRAG_AND_DROP_TABLE') {
      const columns = c.columns || [];
      const items   = c.items   || [];
      const tbk = tBank ?? [...items];
      const dropIntoCol = (colId) => {
        if (!tDrag) return;
        setTPlaced(p => ({ ...p, [tDrag.id]: colId }));
        setTBank(b => (b??items).filter(x=>x.id!==tDrag.id));
        setTDrag(null);
        // sync answer
        const next = { ...(typeof answer==='object'&&answer?answer:{}), [tDrag.id]: colId };
        onAnswer(next);
      };
      const returnItem = (itemId) => {
        const item = items.find(x=>x.id===itemId); if (!item) return;
        const next = { ...(typeof answer==='object'&&answer?answer:{}) };
        delete next[itemId];
        setTPlaced(p => { const n={...p}; delete n[itemId]; return n; });
        setTBank(b => [...(b??[]), item]);
        onAnswer(next);
      };
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${columns.length},1fr)`, gap:12 }}>
            {columns.map(col => {
              const colItems = items.filter(it => tPlaced[it.id]===col.id);
              return (
                <div key={col.id}
                  onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();dropIntoCol(col.id);}}
                  style={{ background:T.panel, border:'2px dashed #ffffff22', borderRadius:12,
                    minHeight:120, padding:12 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
                    color:'#fb923c', marginBottom:10, textAlign:'center',
                    background:'#fb923c18', borderRadius:7, padding:'4px 0' }}>{col.title}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {colItems.map(it => (
                      <div key={it.id} onClick={()=>returnItem(it.id)}
                        style={{ background:'#fb923c18', border:'1px solid #fb923c44',
                          borderRadius:8, padding:'8px 12px', fontSize:13, color:T.text,
                          fontFamily:"'DM Sans',sans-serif", cursor:'pointer' }}>
                        {it.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {tbk.length > 0 && (
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted,
                marginBottom:8, letterSpacing:.5, textTransform:'uppercase' }}>Drag items into columns</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {tbk.map(it => (
                  <div key={it.id} draggable onDragStart={()=>setTDrag(it)} onDragEnd={()=>setTDrag(null)}
                    style={{ background: tDrag?.id===it.id?'#fb923c33':T.card,
                      border:`1.5px solid ${tDrag?.id===it.id?'#fb923c88':T.border2}`,
                      borderRadius:8, padding:'8px 16px', fontSize:13, color:T.text,
                      fontFamily:"'DM Sans',sans-serif", cursor:'grab', userSelect:'none' }}>
                    {it.text}
                  </div>
                ))}
              </div>
            </div>
          )}
          {tbk.length === 0 && <div style={{ fontSize:12, color:'#4ade80', textAlign:'center' }}>✓ All items placed</div>}
          <button onClick={()=>{setTPlaced({});setTBank([...items]);onAnswer({});}}
            style={{ alignSelf:'flex-start', background:'transparent', border:'1px solid #ffffff22',
              borderRadius:8, padding:'6px 14px', color:T.muted, fontSize:12, cursor:'pointer' }}>
            ↺ Reset
          </button>
        </div>
      );
    }

    if (type === 'IMAGE_CLICK') {
      const hotspots = c.hotspots || [];
      const imgUrl   = mediaList_media.find(m=>m.type==='image')?.url;
      const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX-rect.left)/rect.width)*100;
        const y = ((e.clientY-rect.top)/rect.height)*100;
        setImgClick({x,y});
        onAnswer({x,y});
      };
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {!imgUrl && <div style={{ background:T.panel, borderRadius:12, padding:'32px',
            textAlign:'center', color:T.muted, fontSize:13 }}>No image attached</div>}
          {imgUrl && (
            <div style={{ position:'relative', display:'inline-block', cursor:'crosshair',
              borderRadius:12, overflow:'hidden', userSelect:'none', width:'100%' }}
              onClick={handleClick}>
              <img src={imgUrl} alt="" style={{ width:'100%', display:'block', borderRadius:12 }} />
              {imgClick && (
                <div style={{ position:'absolute',
                  left:imgClick.x+'%', top:imgClick.y+'%',
                  transform:'translate(-50%,-50%)',
                  width:22, height:22, borderRadius:'50%',
                  background:T.gold+'66', border:`2px solid ${T.gold}`,
                  pointerEvents:'none' }} />
              )}
            </div>
          )}
          {imgClick
            ? <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.muted, textAlign:'center' }}>
                ✓ Answer marked
                <button onClick={()=>{setImgClick(null);onAnswer(null);}}
                  style={{ marginLeft:12, background:'transparent', border:'1px solid #ffffff22',
                    borderRadius:6, padding:'3px 10px', color:T.muted, fontSize:11, cursor:'pointer' }}>
                  Reset
                </button>
              </div>
            : <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.muted, textAlign:'center' }}>
                Click on the image to mark your answer
              </div>
          }
        </div>
      );
    }

    if (type === 'DRAG_AND_DROP_IMAGE') {
      const labels   = c.labels   || [];
      const hotspots = c.hotspots || [];
      const imgUrl   = mediaList_media.find(m=>m.type==='image')?.url;
      const allLabelIds = labels.map(l=>l.id);
      const bk = ddiBank ?? allLabelIds;
      const labelText = id => labels.find(l=>l.id===id)?.text ?? id;
      const lc2 = lid => labelColor(lid, labels);
      const HOTSPOT_W = 96, HOTSPOT_H = 30;

      const dropOnHotspot = (hsId) => {
        if (!ddiDrag) return;
        const prev = ddiPlaced[hsId];
        const srcHs = ddiDragFrom && ddiDragFrom!=='bank' ? ddiDragFrom : null;
        const nextPlaced = { ...ddiPlaced, [hsId]: ddiDrag };
        if (srcHs) delete nextPlaced[srcHs];
        setDdiPlaced(nextPlaced);
        setDdiBank(b => {
          let next = (b??allLabelIds).filter(id=>id!==ddiDrag);
          if (prev && prev!==ddiDrag) next = [...next, prev];
          if (!srcHs) next = next.filter(id=>id!==ddiDrag);
          return next;
        });
        setDdiDrag(null); setDdiDragFrom(null);
        onAnswer(nextPlaced);
      };
      const returnHotspot = (hsId) => {
        const lbl = ddiPlaced[hsId]; if (!lbl) return;
        const next = {...ddiPlaced}; delete next[hsId];
        setDdiPlaced(next);
        setDdiBank(b => [...(b??allLabelIds), lbl]);
        onAnswer(next);
      };

      return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {imgUrl ? (
            <div style={{ position:'relative', width:'100%', userSelect:'none' }}
              onDragOver={e=>e.preventDefault()}>
              <img src={imgUrl} alt="" style={{ width:'100%', display:'block', borderRadius:12 }} />
              {hotspots.map(hs => {
                const placed2 = ddiPlaced[hs.id];
                const isDraggingThis = ddiDragFrom===hs.id;
                return (
                  <div key={hs.id}
                    draggable={!!placed2}
                    onDragStart={placed2?(e)=>{e.stopPropagation();startDragLabel(placed2,hs.id);}:undefined}
                    onDragEnd={endDrag}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={e=>{e.preventDefault();dropOnHotspot(hs.id);}}
                    onClick={()=>!ddiDrag&&placed2&&returnHotspot(hs.id)}
                    title={placed2?'Drag to move · Click to return':'Drop a label here'}
                    style={{ position:'absolute',
                      left:`calc(${hs.x}% - ${HOTSPOT_W/2}px)`,
                      top:`calc(${hs.y}% - ${HOTSPOT_H/2}px)`,
                      width:HOTSPOT_W, height:HOTSPOT_H,
                      background: placed2?'transparent':ddiDrag?T.border2+'44':T.border,
                      border:`2px dashed ${isDraggingThis?lc2(placed2)+'88':placed2?lc2(placed2):ddiDrag?T.border2:T.border2}`,
                      borderRadius:8, cursor:placed2?'grab':ddiDrag?'copy':'default',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      opacity:isDraggingThis?0.4:1, transition:'all .15s' }}>
                    {placed2
                      ? <span style={{ fontSize:12, color:'#fff', fontWeight:700, pointerEvents:'none',
                          background:lc2(placed2)+'dd', padding:'2px 8px', borderRadius:5,
                          textShadow:'0 1px 2px #00000088' }}>{labelText(placed2)}</span>
                      : <span style={{ fontSize:11, color:T.border2, pointerEvents:'none',
                          background:T.panel, padding:'2px 8px', borderRadius:5 }}>drop here</span>
                    }
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding:'20px', textAlign:'center', color:T.muted,
              background:T.panel, borderRadius:12, fontSize:13 }}>No image attached</div>
          )}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {bk.map(id => (
              <div key={id} draggable
                onDragStart={()=>startDragLabel(id,null)} onDragEnd={endDrag}
                style={{ padding:'6px 14px', borderRadius:8, cursor:'grab',
                  background:ddiDrag===id?lc2(id):lc2(id)+'cc',
                  border:`1.5px solid ${lc2(id)}`,
                  fontSize:13, color:'#fff', textShadow:'0 1px 2px #00000066',
                  userSelect:'none', fontFamily:"'DM Sans',sans-serif", transition:'all .15s' }}>
                {labelText(id)}
              </div>
            ))}
            {bk.length===0 && <span style={{ fontSize:12, color:T.muted }}>All labels placed</span>}
          </div>
          <button onClick={()=>{setDdiPlaced({});setDdiBank(allLabelIds);onAnswer({});}}
            style={{ alignSelf:'flex-start', background:'transparent', border:'1px solid #ffffff22',
              borderRadius:7, padding:'5px 14px', color:T.muted, fontSize:12, cursor:'pointer' }}>
            ↺ Reset
          </button>
        </div>
      );
    }

    if (type === 'TEXT_INSERTION') {
      const passages  = c.passages  || [];
      const rawSentences = c.sentences || [];
      const rawMarkers   = (c.markers  || []).map(m => ({ ...m, id: String(m.id) }));
      // Migrate old format (no sentences array) — synthesize from passages
      const sentences = rawSentences.length > 0 ? rawSentences :
        rawMarkers.map((m, i) => ({ id: m.id, text: passages[m.correct] ?? ("Sentence " + (i+1)) }));
      const markers = rawMarkers;
      const ans = (typeof answer === 'object' && answer !== null) ? answer : {};
      const setMarker = (mid, idx) => onAnswer({ ...ans, [mid]: idx });

      return (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Passage with filled-in previews */}
          <div style={{ background:T.panel, border:'1px solid #ffffff18', borderRadius:12,
            padding:'18px 22px', fontFamily:"'DM Sans',sans-serif", fontSize:15,
            color:T.text, lineHeight:2 }}>
            {passages.map((p, i) => {
              const filledId = Object.keys(ans).find(mid => Number(ans[mid]) === i);
              const filledSentence = filledId ? sentences.find(s=>s.id===filledId) : null;
              return (
                <span key={i}>
                  <span>{p}</span>
                  {i < passages.length - 1 && (
                    <span style={{ margin:'0 6px', verticalAlign:'middle' }}>
                      {filledSentence ? (
                        <span style={{ background:T.gold+'22', border:`1.5px solid ${T.gold+'88'}`,
                          borderRadius:8, padding:'2px 10px', fontSize:12, color:T.gold,
                          fontStyle:'italic' }}>
                          ↩ {filledSentence.text.slice(0,40)}{filledSentence.text.length>40?'…':''}
                        </span>
                      ) : (
                        <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                          width:24, height:24, borderRadius:'50%',
                          background:T.border2, border:'1.5px solid #ffffff33',
                          color:T.muted, fontSize:11, fontWeight:700 }}>
                          {i+1}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Sentence cards */}
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted,
            letterSpacing:.5, textTransform:'uppercase', marginBottom:4 }}>
            Sentences to insert
          </div>
          {sentences.map((s, si) => {
            const currentGap = ans[s.id] !== undefined ? Number(ans[s.id]) : null;
            return (
              <div key={s.id} style={{ background:T.panel, border:'1px solid #ffffff18',
                borderRadius:12, padding:'14px 18px' }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14,
                  color:T.text, marginBottom:10, fontStyle:'italic', lineHeight:1.5 }}>
                  "{s.text}"
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:T.muted, marginRight:4 }}>Insert after:</span>
                  {passages.slice(0,-1).map((_,gi) => {
                    const sel = currentGap === gi;
                    return (
                      <button key={gi} onClick={()=>setMarker(s.id, gi)}
                        style={{ padding:'6px 16px', borderRadius:8, cursor:'pointer',
                          background: sel ? T.gold+'22' : T.card,
                          border:`1.5px solid ${sel ? T.gold+'88' : T.border2}`,
                          color: sel ? T.gold : T.muted,
                          fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:sel?700:400,
                          transition:'all .15s' }}>
                        Gap {gi+1}
                      </button>
                    );
                  })}
                  {currentGap !== null && (
                    <button onClick={()=>{const n={...ans};delete n[s.id];onAnswer(n);}}
                      style={{ padding:'5px 10px', borderRadius:8, cursor:'pointer',
                        background:'transparent', border:'1px solid #ffffff15',
                        color:T.muted, fontSize:11 }}>✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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

      {/* Context text */}
      {q.contextText && (
        <div style={{ background:T.gold+'08', borderRadius:12, padding:'18px 22px', marginBottom:18,
          borderLeft:`3px solid ${T.gold}` }}>
          <div style={{ fontSize:10, color:T.gold, fontWeight:700,
            letterSpacing:.8, textTransform:'uppercase', marginBottom:8,
            fontFamily:"'DM Sans',sans-serif" }}>
            Context
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17,
            color:T.text, lineHeight:1.8, whiteSpace:'pre-wrap' }}>
            {q.contextText}
          </div>
        </div>
      )}

      {/* Media */}
      {renderMedia()}

      {/* Question text */}
      <div style={{ fontSize:typo.promptFontSize, lineHeight:1.75, color:T.text,
        fontFamily:"'DM Sans',sans-serif", marginBottom:24 }}>
        {qText}
      </div>

      {/* Answer input */}
      {renderInput()}
    </div>
  );
}

// ── Section Intro Screen ──────────────────────────────────────────────────────
function SectionIntro({ section, sectionIndex, totalSections, onStart, T }) {
  const catColors = {
    READING:   T.gold,
    LISTENING: '#a78bfa',
    SPEAKING:  '#f87171',
    WRITING:   '#60a5fa',
  };
  const c = catColors[section.category] ?? T.gold;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 520, width: '90%', textAlign: 'center',
        padding: '48px 40px',
        background: T.card,
        border: `1px solid ${c}33`,
        borderRadius: 24,
        boxShadow: `0 0 80px ${c}18`,
      }}>
        {/* Section counter */}
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2,
          textTransform: 'uppercase', marginBottom: 20, fontFamily: "'DM Sans',sans-serif" }}>
          Section {sectionIndex + 1} of {totalSections}
        </div>

        {/* Icon */}
        <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>
          {section.icon}
        </div>

        {/* Label */}
        <div style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 34, fontWeight: 700, color: c, marginBottom: 10,
        }}>
          {section.label}
        </div>

        {/* Question count */}
        <div style={{
          display: 'inline-block',
          background: c + '15', border: `1px solid ${c}33`,
          borderRadius: 20, padding: '5px 16px', marginBottom: 20,
          fontSize: 13, color: c, fontWeight: 600,
          fontFamily: "'DM Sans',sans-serif",
        }}>
          {section.questionCount} question{section.questionCount !== 1 ? 's' : ''}
        </div>

        {/* Instruction */}
        <div style={{
          background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: '16px 20px', marginBottom: 32,
          fontSize: 14, color: T.muted, lineHeight: 1.7,
          fontFamily: "'DM Sans',sans-serif",
        }}>
          {section.instruction}
        </div>

        {/* Rules list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32, textAlign: 'left' }}>
          {section.category === 'LISTENING' && [
            '🔊 Audio plays automatically when the question loads',
            '🔒 You cannot go back to previous questions',
            '▶ You may replay audio within the allowed limit',
          ].map((r, i) => <Rule key={i} text={r} T={T} />)}

          {section.category === 'SPEAKING' && [
            '⏱ You will have preparation time before recording',
            '🎙 Recording starts automatically after prep time',
            '🔒 You cannot go back or skip questions',
          ].map((r, i) => <Rule key={i} text={r} T={T} />)}

          {section.category === 'WRITING' && [
            '✏ Type your response in the text area',
            '🚫 Copy-paste is disabled',
            '📊 A word counter will guide you to the required length',
          ].map((r, i) => <Rule key={i} text={r} T={T} />)}

          {section.category === 'READING' && [
            '📖 Read the text and answer the questions',
            '↔ You can navigate freely between questions',
            '✏ You can change your answers at any time',
          ].map((r, i) => <Rule key={i} text={r} T={T} />)}
        </div>

        <button onClick={onStart} style={{
          background: `linear-gradient(135deg, ${c}, ${c}bb)`,
          border: 'none', borderRadius: 14,
          padding: '15px 48px',
          color: '#fff', fontWeight: 700, fontSize: 16,
          cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
          boxShadow: `0 4px 24px ${c}44`,
          transition: 'transform .15s, box-shadow .15s',
        }}>
          Start {section.label} →
        </button>
      </div>
    </div>
  );
}

function Rule({ text, T }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '8px 12px',
      background: T.panel, border: `1px solid ${T.border}`,
      borderRadius: 8, fontSize: 13, color: T.muted,
      fontFamily: "'DM Sans',sans-serif",
    }}>
      {text}
    </div>
  );
}

// ── Main ExamScreen ────────────────────────────────────────────────────────────
export default function ExamScreen({ T, session, backendUrl, onFinish }) {
  const {
    sessionId, studentName, examTitle, examType, examConfig,
    questions, answers: initAnswers,
    sections: initSections,
  } = session;

  const [answers,        setAnswers]        = useState(initAnswers || {});
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [finishing,      setFinishing]      = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [mediaPlayed,    setMediaPlayed]    = useState({});  // { [qId]: true }
  // Section intro: null = no intro shown, sectionId = showing intro for that section
  const [introFor,       setIntroFor]       = useState(
    initSections?.length > 0 ? initSections[0].id : null
  );

  const config    = examConfig || { duration: 60 };
  const sections  = initSections ?? [];
  const totalQ    = questions.length;
  const answered  = Object.keys(answers).length;

  const handleExpire = useCallback(() => finish(), []);
  const { fmt: timerFmt, urgent, pct: timerPct } = useTimer(config.duration || 60, handleExpire);

  const q        = questions[currentIndex];
  const category = q ? questionCategory(q) : 'READING';

  // ── Which section are we in? ───────────────────────────────────────────────
  const currentSection = sections.findLast?.(s => s.startIndex <= currentIndex)
    ?? sections[0]
    ?? { id: '', label: '', icon: '📝', category: 'READING', questionCount: totalQ, startIndex: 0 };
  const sectionIndex       = sections.indexOf(currentSection);
  const posInSection       = currentIndex - currentSection.startIndex;
  const isLastInSection    = posInSection === currentSection.questionCount - 1;
  const isLastQuestion     = currentIndex === totalQ - 1;

  // ── Navigation rules ───────────────────────────────────────────────────────
  const canGoPrev = category !== 'LISTENING' && category !== 'SPEAKING' && currentIndex > 0;
  const canGoNext = (() => {
    if (isLastQuestion) return false;
    if (category === 'SPEAKING') return false;
    if (category === 'LISTENING') return !!mediaPlayed[q?.id];
    return true;
  })();

  // Auto-advance after SPEAKING done
  useEffect(() => {
    const a = answers[String(q?.id)];
    if (category === 'SPEAKING' && a?.startsWith?.('recorded_') && currentIndex < totalQ - 1) {
      const nextIdx = currentIndex + 1;
      const nextQ   = questions[nextIdx];
      const nextSec = sections.findLast?.(s => s.startIndex <= nextIdx) ?? currentSection;

      const advance = () => {
        // Show section intro if moving to new section
        if (nextSec.id !== currentSection.id) {
          setIntroFor(nextSec.id);
        }
        setCurrentIndex(nextIdx);
      };
      const t = setTimeout(advance, 1200);
      return () => clearTimeout(t);
    }
  }, [answers, currentIndex]);

  // ── Heartbeat: flush all answers to backend every 12s ─────────────────────
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    const iv = setInterval(async () => {
      if (Object.keys(answersRef.current).length === 0) return;
      try {
        await fetch(`${backendUrl}/api/session/heartbeat`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, answers: answersRef.current }),
        });
      } catch {} // silent — data already saved on each individual answer
    }, 12_000);
    return () => clearInterval(iv);
  }, [sessionId, backendUrl]);

  const saveAnswer = async (questionId, value) => {
    setAnswers(prev => ({ ...prev, [String(questionId)]: value }));
    answersRef.current = { ...answersRef.current, [String(questionId)]: value };
    try {
      await fetch(`${backendUrl}/api/session/answer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId, answer: value }),
      });
    } catch {} // heartbeat will recover if this fails
  };

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const r    = await fetch(`${backendUrl}/api/session/finish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      onFinish(await r.json());
    } catch { onFinish({ result: null }); }
  };

  const goTo = (i) => {
    if (i < 0 || i >= totalQ) return;
    const targetSec = sections.findLast?.(s => s.startIndex <= i) ?? currentSection;
    // Show section intro when crossing section boundary going forward
    if (targetSec.id !== currentSection.id && i > currentIndex) {
      setIntroFor(targetSec.id);
    }
    setCurrentIndex(i);
  };

  // ── Section intro shown? ───────────────────────────────────────────────────
  const introSection = introFor ? sections.find(s => s.id === introFor) : null;
  if (introSection) {
    return (
      <SectionIntro
        section={introSection}
        sectionIndex={sections.indexOf(introSection)}
        totalSections={sections.length}
        T={T}
        onStart={() => setIntroFor(null)}
      />
    );
  }

  // ── Cat accent color ───────────────────────────────────────────────────────
  const catColor = {
    READING: T.gold, LISTENING: '#a78bfa', SPEAKING: '#f87171', WRITING: '#60a5fa',
  }[category] ?? T.gold;

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
        background: T.bg2, borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20,
          fontWeight: 700, color: T.gold }}>ArmExam</div>
        <div style={{ width: 1, height: 28, background: T.border2 }} />

        {/* Section breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {sections.map((sec, i) => {
            const isCurrent = sec.id === currentSection.id;
            const isPast    = i < sectionIndex;
            const secCat    = { READING: T.gold, LISTENING: '#a78bfa', SPEAKING: '#f87171', WRITING: '#60a5fa' }[sec.category] ?? T.gold;
            return (
              <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: T.border2, fontSize: 10 }}>›</span>}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  background: isCurrent ? secCat + '18' : 'transparent',
                  border: `1px solid ${isCurrent ? secCat + '44' : 'transparent'}`,
                  transition: 'all .3s',
                }}>
                  <span style={{ fontSize: 12 }}>{sec.icon}</span>
                  <span style={{
                    fontSize: 11, fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? secCat : isPast ? '#4ade8088' : T.muted,
                    fontFamily: "'DM Sans',sans-serif",
                  }}>
                    {isPast ? '✓' : ''}{sec.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.timerBg, borderRadius: 12, padding: '7px 14px',
          border: `1px solid ${urgent ? T.error + '55' : T.border2}`,
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx="14" cy="14" r="11" fill="none" stroke={T.border2} strokeWidth="2.5"/>
            <circle cx="14" cy="14" r="11" fill="none"
              stroke={urgent ? T.error : T.timerText} strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - timerPct)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700,
            color: urgent ? T.error : T.timerText,
            animation: urgent ? 'pulse 1s infinite' : 'none',
          }}>{timerFmt}</div>
        </div>

        <button onClick={() => setShowConfirm(true)} style={{
          background: 'transparent', border: `1.5px solid ${T.gold}66`,
          borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
          color: T.gold, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
        }}>Finish</button>
      </div>

      {/* ── Section progress bar (under top bar) ──────────────────────────── */}
      <div style={{ height: 3, background: T.border, flexShrink: 0, display: 'flex' }}>
        {sections.map((sec, i) => {
          const secCat  = { READING: T.gold, LISTENING: '#a78bfa', SPEAKING: '#f87171', WRITING: '#60a5fa' }[sec.category] ?? T.gold;
          const width   = (sec.questionCount / totalQ) * 100;
          const isCur   = sec.id === currentSection.id;
          const isPast  = i < sectionIndex;
          // Progress within current section
          const fill    = isPast ? 100 : isCur ? ((posInSection + 1) / sec.questionCount) * 100 : 0;
          return (
            <div key={sec.id} style={{ width: `${width}%`, background: T.card, position: 'relative' }}>
              <div style={{
                height: '100%', width: `${fill}%`,
                background: secCat, transition: 'width .4s',
              }} />
            </div>
          );
        })}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar — hidden for SPEAKING */}
        {category !== 'SPEAKING' && (
          <div style={{
            width: 200, background: T.bg2, borderRight: `1px solid ${T.border}`,
            padding: 12, overflowY: 'auto', flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {/* Section groups in sidebar */}
            {sections.map((sec, si) => {
              const secCat   = { READING: T.gold, LISTENING: '#a78bfa', SPEAKING: '#f87171', WRITING: '#60a5fa' }[sec.category] ?? T.gold;
              const isCurSec = sec.id === currentSection.id;
              return (
                <div key={sec.id}>
                  {/* Section label */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 8px 4px',
                    fontSize: 9, fontWeight: 700, color: isCurSec ? secCat : T.muted,
                    letterSpacing: 1, textTransform: 'uppercase',
                    fontFamily: "'DM Sans',sans-serif",
                    borderTop: si > 0 ? `1px solid ${T.border}` : 'none',
                    marginTop: si > 0 ? 4 : 0,
                  }}>
                    <span>{sec.icon}</span>
                    <span>{sec.label}</span>
                  </div>
                  {/* Questions in this section */}
                  {questions.slice(sec.startIndex, sec.startIndex + sec.questionCount).map((qn, qi) => {
                    const absIdx  = sec.startIndex + qi;
                    const isAns   = answers[String(qn.id)] !== undefined;
                    const isCur   = absIdx === currentIndex;
                    const lc      = LEVEL_COLORS[qn.level] || '#94a3b8';
                    const qCat    = questionCategory(qn);
                    const locked  = qCat === 'SPEAKING' ||
                      (qCat === 'LISTENING' && absIdx > currentIndex);
                    return (
                      <button key={qn.id}
                        onClick={() => !locked && goTo(absIdx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '7px 8px', borderRadius: 8,
                          cursor: locked ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                          background: isCur ? secCat + '18' : isAns ? '#4ade8010' : 'transparent',
                          border: `1px solid ${isCur ? secCat + '55' : isAns ? '#4ade8033' : T.border}`,
                          opacity: locked ? 0.4 : 1,
                          transition: 'all .12s',
                        }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                          background: isCur ? secCat : isAns ? '#4ade80' : T.panel,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: isCur || isAns ? '#fff' : T.dim,
                          fontFamily: "'DM Mono',monospace",
                        }}>{absIdx + 1}</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 10, color: isCur ? secCat : T.text,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 115,
                          }}>{(qn.prompt ?? qn.text ?? '').slice(0, 26)}…</div>
                          <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                            <span style={{ fontSize: 8, color: lc, background: lc + '18', borderRadius: 3, padding: '1px 4px' }}>{qn.level}</span>
                            {isAns && <span style={{ fontSize: 8, color: '#4ade80' }}>✓</span>}
                            {locked && <span style={{ fontSize: 8, color: T.muted }}>🔒</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Question content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', maxWidth: 800 }}>

          {/* Section header (shown once at top of each section's first question) */}
          {posInSection === 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px', borderRadius: 14, marginBottom: 24,
              background: catColor + '10', border: `1px solid ${catColor}33`,
            }}>
              <span style={{ fontSize: 22 }}>{currentSection.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: catColor,
                  fontFamily: "'DM Sans',sans-serif" }}>
                  {currentSection.label}
                  <span style={{ fontSize: 11, fontWeight: 400, color: T.muted, marginLeft: 8 }}>
                    Section {sectionIndex + 1} of {sections.length}
                    {' · '}{currentSection.questionCount} questions
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {currentSection.instruction}
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
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 36, paddingTop: 24, borderTop: `1px solid ${T.border}`,
            }}>
              <button onClick={() => goTo(currentIndex - 1)} disabled={!canGoPrev} style={{
                background: T.panel, border: `1px solid ${T.border2}`, borderRadius: 10,
                padding: '11px 24px', cursor: canGoPrev ? 'pointer' : 'not-allowed',
                color: canGoPrev ? T.text : T.dim,
                fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500,
              }}>
                {category === 'LISTENING' ? '🔒 No back' : '← Previous'}
              </button>

              {/* Section mini-progress (within section) */}
              <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>
                {posInSection + 1} / {currentSection.questionCount}
                {sections.length > 1 && (
                  <span style={{ color: catColor, marginLeft: 6 }}>
                    · {currentSection.label}
                  </span>
                )}
              </div>

              {isLastQuestion ? (
                <button onClick={() => setShowConfirm(true)} style={{
                  background: '#4ade80', border: 'none', borderRadius: 10,
                  padding: '11px 28px', cursor: 'pointer',
                  color: '#0a1a0a', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
                }}>Finish Exam ✓</button>
              ) : isLastInSection && sections[sectionIndex + 1] ? (
                <button onClick={() => {
                  const nextSec = sections[sectionIndex + 1];
                  setIntroFor(nextSec.id);
                  goTo(currentIndex + 1);
                }} disabled={!canGoNext} style={{
                  background: canGoNext ? catColor : T.dim, border: 'none', borderRadius: 10,
                  padding: '11px 28px', cursor: canGoNext ? 'pointer' : 'not-allowed',
                  color: canGoNext ? T.text : T.border2,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
                }}>
                  Next Section →
                </button>
              ) : (
                <button onClick={() => goTo(currentIndex + 1)} disabled={!canGoNext} style={{
                  background: canGoNext ? catColor : T.dim, border: 'none', borderRadius: 10,
                  padding: '11px 28px', cursor: canGoNext ? 'pointer' : 'not-allowed',
                  color: canGoNext ? T.bg : T.border2,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
                  transition: 'all .15s',
                }}>
                  {category === 'LISTENING' && !mediaPlayed[q?.id] ? '🎧 Play first' : 'Next →'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm finish modal ───────────────────────────────────────────── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000088',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9998,
        }}>
          <div style={{
            background: T.card, border: `1px solid ${T.border2}`,
            borderRadius: 20, padding: '40px 48px', maxWidth: 420, width: '90%',
            textAlign: 'center', boxShadow: '0 24px 80px #00000055',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎓</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24,
              fontWeight: 700, color: T.text, marginBottom: 8 }}>Submit Exam?</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 8 }}>
              Answered <strong style={{ color: T.gold }}>{answered}</strong> of{' '}
              <strong style={{ color: T.gold }}>{totalQ}</strong> questions.
            </div>
            {/* Section completion summary */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center',
              flexWrap: 'wrap', marginBottom: 16 }}>
              {sections.map(sec => {
                const secAns = questions
                  .slice(sec.startIndex, sec.startIndex + sec.questionCount)
                  .filter(q => answers[String(q.id)] !== undefined).length;
                const done   = secAns === sec.questionCount;
                const secCat = { READING: T.gold, LISTENING: '#a78bfa', SPEAKING: '#f87171', WRITING: '#60a5fa' }[sec.category] ?? T.gold;
                return (
                  <div key={sec.id} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12,
                    background: done ? '#4ade8015' : '#ff000015',
                    border: `1px solid ${done ? '#4ade8044' : '#ff000044'}`,
                    color: done ? '#4ade80' : '#f87171',
                  }}>
                    {sec.icon} {sec.label}: {secAns}/{sec.questionCount}
                  </div>
                );
              })}
            </div>
            {answered < totalQ && (
              <div style={{ background: T.warning + '18', border: `1px solid ${T.warning}44`,
                borderRadius: 10, padding: '10px 16px', marginBottom: 16,
                fontSize: 12, color: T.warning }}>
                ⚠ {totalQ - answered} questions unanswered
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setShowConfirm(false)} style={{
                flex: 1, padding: '12px', background: T.panel,
                border: `1px solid ${T.border2}`, borderRadius: 12,
                cursor: 'pointer', color: T.muted,
                fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              }}>Cancel</button>
              <button onClick={() => { setShowConfirm(false); finish(); }}
                disabled={finishing} style={{
                  flex: 1, padding: '12px',
                  background: finishing ? T.dim : '#4ade80',
                  border: 'none', borderRadius: 12,
                  cursor: finishing ? 'not-allowed' : 'pointer',
                  color: '#0a1a0a', fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13, fontWeight: 700,
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
