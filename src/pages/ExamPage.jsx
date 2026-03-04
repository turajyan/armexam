import { useState, useEffect, useRef, useCallback } from "react";
import { EXAMS, QUESTIONS, STUDENTS, LEVELS, LEVEL_COLORS, buildExamQuestions, computePlacementLevel } from "../data.js";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
`;



// ── Helpers ─────────────────────────────────────────────────────────────────
function LevelBadge({ level }) {
  return (
    <span style={{
      background: LEVEL_COLORS[level] + "22",
      color: LEVEL_COLORS[level],
      border: `1px solid ${LEVEL_COLORS[level]}44`,
      borderRadius: 6,
      padding: "2px 10px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      fontFamily: "'DM Sans', sans-serif",
    }}>{level}</span>
  );
}

function ProgressBar({ current, total }) {
  const pct = ((current) / total) * 100;
  return (
    <div style={{ width: "100%", height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
        borderRadius: 2,
        transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

function Timer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft(p => {
      if (p <= 1) { clearInterval(t); onExpire?.(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, []);
  const pct = left / seconds;
  const color = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#f59e0b" : "#f87171";
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={36} height={36} viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={18} cy={18} r={15} fill="none" stroke="#1e293b" strokeWidth={3} />
        <circle cx={18} cy={18} r={15} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${2 * Math.PI * 15}`}
          strokeDashoffset={`${2 * Math.PI * 15 * (1 - pct)}`}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
        />
      </svg>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 600, color, minWidth: 50 }}>
        {m}:{s}
      </span>
    </div>
  );
}

// ── Audio Player ─────────────────────────────────────────────────────────────
function AudioQuestion({ question, value, onChange }) {
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pauseActive, setPauseActive] = useState(false);
  const [pauseLeft, setPauseLeft] = useState(0);
  const pauseRef = useRef(null);

  const handlePlay = () => {
    if (plays >= question.maxPlays || playing || pauseActive) return;
    setPlaying(true);
    // Simulate audio 4s
    setTimeout(() => {
      setPlaying(false);
      const newPlays = plays + 1;
      setPlays(newPlays);
      if (newPlays < question.maxPlays) {
        setPauseActive(true);
        setPauseLeft(question.pauseSeconds);
        pauseRef.current = setInterval(() => {
          setPauseLeft(p => {
            if (p <= 1) { clearInterval(pauseRef.current); setPauseActive(false); return 0; }
            return p - 1;
          });
        }, 1000);
      }
    }, 4000);
  };

  const remaining = question.maxPlays - plays;

  return (
    <div>
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e3a5f",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 20,
        boxShadow: "0 4px 24px #0008",
      }}>
        {/* Waveform visual */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} style={{
              width: 3,
              height: playing ? `${8 + Math.sin(i * 0.8 + Date.now() * 0.01) * 14 + 10}px` : `${4 + Math.abs(Math.sin(i * 1.2)) * 20}px`,
              background: playing ? "#c8a96e" : "#334155",
              borderRadius: 2,
              transition: "height 0.15s, background 0.3s",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button
            onClick={handlePlay}
            disabled={plays >= question.maxPlays || playing || pauseActive}
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: plays >= question.maxPlays ? "#1e293b" : "linear-gradient(135deg, #c8a96e, #a07840)",
              border: "none", cursor: plays >= question.maxPlays ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: plays < question.maxPlays ? "0 0 20px #c8a96e44" : "none",
              transition: "all 0.2s",
              opacity: (pauseActive) ? 0.5 : 1,
            }}
          >
            {playing ? (
              <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width={18} height={18} viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748b", textAlign: "center" }}>
            {pauseActive ? (
              <span style={{ color: "#f59e0b" }}>Սպասե՛ք {pauseLeft}վ</span>
            ) : (
              <span style={{ color: plays >= question.maxPlays ? "#475569" : "#94a3b8" }}>
                {remaining > 0 ? `${remaining} անգամ` : "Ավարտված"}
              </span>
            )}
          </div>
        </div>
      </div>
      <SingleChoiceOptions options={question.options} value={value} onChange={onChange} />
    </div>
  );
}

// ── Video Question ────────────────────────────────────────────────────────────
function VideoQuestion({ question, value, onChange }) {
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    if (plays >= question.maxPlays || playing) return;
    setPlaying(true);
    setTimeout(() => { setPlaying(false); setPlays(p => p + 1); }, 5000);
  };

  return (
    <div>
      <div style={{
        background: "#080f1a",
        border: "1px solid #1e3a5f",
        borderRadius: 16,
        aspectRatio: "16/9",
        marginBottom: 20,
        overflow: "hidden",
        position: "relative",
        cursor: plays < question.maxPlays && !playing ? "pointer" : "default",
      }} onClick={handlePlay}>
        {/* Fake video frame */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 12,
        }}>
          {playing ? (
            <>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#c8a96e22", border: "2px solid #c8a96e44", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="#c8a96e">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#c8a96e" }}>Նվագում է...</div>
            </>
          ) : (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: plays >= question.maxPlays ? "#1e293b" : "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: plays < question.maxPlays ? "0 0 30px #c8a96e55" : "none",
              }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: plays >= question.maxPlays ? "#475569" : "#94a3b8" }}>
                {plays >= question.maxPlays ? "Դիտումն ավարտված է" : `${question.maxPlays - plays} անգամ մնաց`}
              </div>
            </>
          )}
        </div>
        {/* Progress bar when playing */}
        {playing && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#1e293b" }}>
            <div style={{
              height: "100%", background: "#c8a96e",
              animation: "videoProgress 5s linear forwards",
            }} />
          </div>
        )}
      </div>
      <SingleChoiceOptions options={question.options} value={value} onChange={onChange} />
    </div>
  );
}

// ── Choice Components ─────────────────────────────────────────────────────────
function SingleChoiceOptions({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((opt, i) => {
        const sel = value === i;
        return (
          <button key={i} onClick={() => onChange(i)} style={{
            background: sel ? "linear-gradient(90deg, #c8a96e15, #c8a96e08)" : "#0f172a",
            border: `1.5px solid ${sel ? "#c8a96e" : "#1e293b"}`,
            borderRadius: 12,
            padding: "14px 18px",
            textAlign: "left",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 14,
            transition: "all 0.2s",
            color: sel ? "#e8c98e" : "#94a3b8",
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              border: `2px solid ${sel ? "#c8a96e" : "#334155"}`,
              background: sel ? "#c8a96e" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s",
            }}>
              {sel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0f172a" }} />}
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function MultiChoiceOptions({ options, value = [], onChange, multi = false }) {
  const toggle = (i) => {
    if (multi) {
      const next = value.includes(i) ? value.filter(v => v !== i) : [...value, i];
      onChange(next);
    } else {
      onChange(value.includes(i) ? value.filter(v => v !== i) : [...value, i]);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((opt, i) => {
        const sel = value.includes(i);
        return (
          <button key={i} onClick={() => toggle(i)} style={{
            background: sel ? "linear-gradient(90deg, #3b82f615, #3b82f608)" : "#0f172a",
            border: `1.5px solid ${sel ? "#3b82f6" : "#1e293b"}`,
            borderRadius: 12,
            padding: "14px 18px",
            textAlign: "left",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 14,
            transition: "all 0.2s",
            color: sel ? "#93c5fd" : "#94a3b8",
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: 4,
              border: `2px solid ${sel ? "#3b82f6" : "#334155"}`,
              background: sel ? "#3b82f6" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s",
            }}>
              {sel && (
                <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function FillBlankQuestion({ question, value = "", onChange }) {
  return (
    <div>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22, color: "#e2e8f0", lineHeight: 1.8,
        marginBottom: 24, background: "#0f172a",
        border: "1px solid #1e293b", borderRadius: 12,
        padding: "20px 24px",
      }}>
        {question.text.replace(/_+/, "").split(" ").map((w, i) => (
          <span key={i}>{w} </span>
        ))}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={question.placeholder}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "2px solid #c8a96e",
            outline: "none",
            color: "#c8a96e",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18,
            padding: "2px 8px",
            width: 140,
            textAlign: "center",
          }}
        />
      </div>
    </div>
  );
}

function WritingQuestion({ question, value = "", onChange }) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const pct = Math.min(words / question.minWords, 1);
  const overMax = words > question.maxWords;
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Գրի՛ր այստեղ..."
        style={{
          width: "100%", minHeight: 220,
          background: "#0a111e",
          border: `1.5px solid ${overMax ? "#f87171" : "#1e293b"}`,
          borderRadius: 12, padding: "18px",
          color: "#e2e8f0",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15, lineHeight: 1.8,
          resize: "vertical", outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            width: `${pct * 100}%`, height: "100%",
            background: overMax ? "#f87171" : pct >= 1 ? "#4ade80" : "#c8a96e",
            borderRadius: 2, transition: "width 0.3s, background 0.3s",
          }} />
        </div>
        <span style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12,
          color: overMax ? "#f87171" : words >= question.minWords ? "#4ade80" : "#64748b",
        }}>
          {words}/{question.minWords}–{question.maxWords} բառ
        </span>
      </div>
    </div>
  );
}



// ── Fill in the Blank — Word Bank (Drag & Drop) ───────────────────────────────
// value = { [blankId]: word } — map of blank index -> placed word
function FillWordBankQuestion({ question, value = {}, onChange }) {
  // dragState: which word is being dragged and from where
  const [dragWord, setDragWord]     = useState(null);   // the word string
  const [dragFrom, setDragFrom]     = useState(null);   // "bank" | blankId (number)
  const [overBlank, setOverBlank]   = useState(null);   // blankId being hovered
  const [overBank,  setOverBank]    = useState(false);  // hovering the bank

  // Words still in the bank = wordBank minus all placed words
  const placed    = Object.values(value);
  const inBank    = question.wordBank.filter(w => !placed.includes(w));
  const filledIds = Object.keys(value).map(Number);

  // ── drag handlers ──
  const onDragStartWord = (word, from) => (e) => {
    setDragWord(word);
    setDragFrom(from);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropBlank = (blankId) => (e) => {
    e.preventDefault();
    if (dragWord === null) return;
    const next = { ...value };
    // If blank already has a word, send it back to bank (just remove it from value)
    // If dragging FROM another blank, free that blank
    if (typeof dragFrom === "number") delete next[dragFrom];
    next[blankId] = dragWord;
    onChange(next);
    setDragWord(null); setDragFrom(null); setOverBlank(null);
  };

  const onDropBank = (e) => {
    e.preventDefault();
    if (dragWord === null || dragFrom === "bank") return;
    const next = { ...value };
    if (typeof dragFrom === "number") delete next[dragFrom];
    onChange(next);
    setDragWord(null); setDragFrom(null); setOverBank(false);
  };

  const onDragOver = (setter, val) => (e) => { e.preventDefault(); setter(val); };
  const onDragEnd  = () => { setDragWord(null); setDragFrom(null); setOverBlank(null); setOverBank(false); };

  const GLD = "#c8a96e";
  const BLU = "#60a5fa";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Sentence / text area ── */}
      <div style={{
        background:"#0a111e", border:`1px solid #1e293b`,
        borderRadius:16, padding:"24px 28px",
        fontFamily:"'Cormorant Garamond',serif", fontSize:20,
        color:"#e2e8f0", lineHeight:2.2,
      }}>
        {question.segments.map((seg, si) => {
          if (seg.type === "text") {
            return <span key={si}>{seg.content}</span>;
          }
          // blank slot
          const blankId  = seg.id;
          const word     = value[blankId];
          const isOver   = overBlank === blankId;
          const isDraggingThis = dragFrom === blankId;

          return (
            <span
              key={si}
              onDragOver={onDragOver(setOverBlank, blankId)}
              onDragLeave={() => setOverBlank(null)}
              onDrop={onDropBlank(blankId)}
              style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                minWidth: word ? "auto" : 100,
                height: 36,
                margin:"0 4px",
                borderRadius: 8,
                border: `2px ${isOver ? "solid" : "dashed"} ${
                  isOver   ? BLU :
                  word     ? GLD+"88" :
                             "#334155"
                }`,
                background: isOver   ? BLU+"15" :
                            word     ? GLD+"10" :
                                       "#0f172a",
                padding: word ? "0 12px" : "0 8px",
                cursor: word ? "grab" : "default",
                transition:"all .15s",
                verticalAlign:"middle",
                position:"relative",
                opacity: isDraggingThis ? 0.4 : 1,
              }}
            >
              {word ? (
                <span
                  draggable
                  onDragStart={onDragStartWord(word, blankId)}
                  onDragEnd={onDragEnd}
                  style={{
                    fontFamily:"'DM Sans',sans-serif", fontSize:15,
                    fontWeight:600, color:GLD,
                    cursor:"grab", userSelect:"none",
                    display:"flex", alignItems:"center", gap:6,
                  }}
                >
                  {word}
                  {/* ✕ click to return to bank */}
                  <span
                    onClick={() => { const next={...value}; delete next[blankId]; onChange(next); }}
                    style={{ fontSize:11, color:"#475569", cursor:"pointer", lineHeight:1 }}
                    title="Remove"
                  >✕</span>
                </span>
              ) : (
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#334155" }}>
                  {isOver ? "drop here" : `_____`}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* ── Word bank ── */}
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#475569", letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>
          Word Bank — drag words into the blanks above
        </div>
        <div
          onDragOver={onDragOver(setOverBank, true)}
          onDragLeave={() => setOverBank(false)}
          onDrop={onDropBank}
          style={{
            display:"flex", flexWrap:"wrap", gap:10,
            background: overBank ? BLU+"0d" : "#0a111e",
            border:`2px ${overBank ? "solid" : "dashed"} ${overBank ? BLU : "#1e293b"}`,
            borderRadius:14, padding:"16px 20px",
            minHeight:60,
            transition:"all .15s",
          }}
        >
          {inBank.length === 0 && (
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#334155", alignSelf:"center" }}>
              All words placed ✓
            </span>
          )}
          {inBank.map(word => (
            <span
              key={word}
              draggable
              onDragStart={onDragStartWord(word, "bank")}
              onDragEnd={onDragEnd}
              style={{
                background:`linear-gradient(135deg, #1e293b, #0f172a)`,
                border:`1.5px solid #334155`,
                borderRadius:9, padding:"8px 16px",
                fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500,
                color:"#e2e8f0", cursor:"grab", userSelect:"none",
                transition:"all .15s",
                boxShadow: dragWord===word && dragFrom==="bank" ? "none" : "0 2px 8px #00000044",
                opacity: dragWord===word && dragFrom==="bank" ? 0.4 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GLD; e.currentTarget.style.color = GLD; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#e2e8f0"; }}
            >
              {word}
            </span>
          ))}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#334155", marginTop:8 }}>
          {placed.filter(Boolean).length} / {question.segments.filter(s=>s.type==="blank").length} blanks filled
          {placed.filter(Boolean).length > 0 && (
            <button
              onClick={() => onChange({})}
              style={{ marginLeft:12, background:"transparent", border:"none", color:"#475569", fontSize:11, cursor:"pointer", textDecoration:"underline" }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Voice Recording Question ──────────────────────────────────────────────────
function VoiceQuestion({ question, value, onChange }) {
  // value = { blob, url, duration, attemptsDone } | null
  const [phase, setPhase] = useState("idle"); // idle | recording | review | submitted
  const [duration, setDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const attemptsUsed = value?.attemptsDone || 0;
  const attemptsLeft = question.maxAttempts - attemptsUsed;
  const hasRecording = phase === "review" || (value?.url && phase === "submitted");
  const currentUrl = phase === "review" ? value?.url : value?.url;

  // Request mic permission on mount
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => { stream.getTracks().forEach(t => t.stop()); setPermissionGranted(true); })
      .catch(() => setPermissionGranted(false));
  }, []);

  const startRecording = async () => {
    if (attemptsLeft <= 0) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const newAttempts = attemptsUsed + 1;
        onChange({ blob, url, duration, attemptsDone: newAttempts });
        stream.getTracks().forEach(t => t.stop());
        setPhase("review");
      };
      mr.start();
      setMediaRecorder(mr);
      setPhase("recording");
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d + 1 >= question.maxSeconds) { mr.stop(); clearInterval(timerRef.current); return d + 1; }
          return d + 1;
        });
      }, 1000);
    } catch (e) {
      setError("Microphone access denied. Please allow microphone in browser settings.");
      setPermissionGranted(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && phase === "recording") {
      clearInterval(timerRef.current);
      mediaRecorder.stop();
    }
  };

  const deleteRecording = () => {
    if (value?.url) URL.revokeObjectURL(value.url);
    onChange(null);
    setPhase("idle");
    setDuration(0);
    setPlaying(false);
  };

  const submitRecording = () => {
    setPhase("submitted");
  };

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const GLD = "#c8a96e";
  const REC = "#f87171";

  // Waveform bars (animated during recording)
  const WaveBars = ({ active, color }) => (
    <div style={{ display:"flex", gap:3, alignItems:"center", height:36 }}>
      {Array.from({length:20}).map((_,i) => (
        <div key={i} style={{
          width:4, borderRadius:2,
          background: color,
          height: active ? `${20 + Math.abs(Math.sin(Date.now()/200 + i))*60}%` : `${15 + Math.abs(Math.sin(i*0.7))*50}%`,
          opacity: active ? 1 : 0.4,
          transition: active ? "height 0.15s" : "none",
          animation: active ? `voiceBar${i%4} 0.${5+i%4}s ease-in-out infinite alternate` : "none",
        }} />
      ))}
    </div>
  );

  // Permission denied state
  if (permissionGranted === false) {
    return (
      <div style={{ background:"#f8717114", border:"1px solid #f8717140", borderRadius:14, padding:"24px", textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🎤</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#f87171", fontWeight:600, marginBottom:8 }}>Microphone Access Required</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>
          Please allow microphone access in your browser settings and reload the page.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Attempts counter */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:6 }}>
          {Array.from({length: question.maxAttempts}).map((_,i) => (
            <div key={i} style={{
              width:10, height:10, borderRadius:"50%",
              background: i < attemptsUsed ? (phase==="submitted" && i === attemptsUsed-1 ? "#22c55e" : "#f87171") : "#1e293b",
              border: `1.5px solid ${i < attemptsUsed ? (phase==="submitted" && i === attemptsUsed-1 ? "#22c55e" : "#f8717188") : "#334155"}`,
            }} />
          ))}
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color: attemptsLeft > 0 ? "#94a3b8" : "#f87171" }}>
          {phase === "submitted"
            ? "✓ Answer submitted"
            : attemptsLeft > 0
              ? `${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining`
              : "No attempts left"}
        </span>
      </div>

      {/* Main recording area */}
      <div style={{
        background:"#06091280",
        border:`1.5px solid ${phase==="recording" ? REC+"88" : phase==="submitted" ? "#22c55e44" : "#1e293b"}`,
        borderRadius:18,
        padding:"28px 24px",
        display:"flex", flexDirection:"column", alignItems:"center", gap:20,
        transition:"border-color .3s",
      }}>

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <>
            <div style={{ fontSize:48, opacity:.7 }}>🎤</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#64748b", textAlign:"center" }}>
              Press <strong style={{ color:GLD }}>Start Recording</strong> when ready.<br/>
              Max duration: {fmtTime(question.maxSeconds)} · Minimum: {fmtTime(question.minSeconds)}
            </div>
            {attemptsLeft > 0 && (
              <button onClick={startRecording} style={{
                background:`linear-gradient(135deg,${REC},#dc2626)`,
                border:"none", borderRadius:50, width:72, height:72,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", fontSize:28, boxShadow:`0 4px 20px ${REC}55`,
                transition:"transform .15s",
              }} onMouseEnter={e=>e.target.style.transform="scale(1.06)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>
                🎤
              </button>
            )}
            {attemptsLeft > 0
              ? <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#475569" }}>Tap to start recording</span>
              : <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#f87171" }}>All attempts used</span>
            }
          </>
        )}

        {/* ── RECORDING ── */}
        {phase === "recording" && (
          <>
            {/* Pulsing red dot + timer */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:REC, boxShadow:`0 0 0 0 ${REC}`, animation:"recPulse 1s ease infinite" }} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:28, fontWeight:700, color:REC, letterSpacing:2 }}>
                {fmtTime(duration)}
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#475569" }}>/ {fmtTime(question.maxSeconds)}</span>
            </div>

            {/* Animated waveform */}
            <div style={{ display:"flex", gap:3, alignItems:"center", height:48 }}>
              {Array.from({length:24}).map((_,i) => (
                <div key={i} style={{
                  width:5, borderRadius:3,
                  background:`linear-gradient(to top, ${REC}66, ${REC})`,
                  animation:`voiceWave ${0.4 + (i%5)*0.1}s ease-in-out ${i*0.04}s infinite alternate`,
                  minHeight:4,
                }} />
              ))}
            </div>

            {/* Stop button */}
            <button onClick={stopRecording} style={{
              background:`linear-gradient(135deg,${REC},#dc2626)`,
              border:"none", borderRadius:14, padding:"14px 32px",
              color:"white", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700,
              cursor:"pointer", display:"flex", alignItems:"center", gap:8,
              boxShadow:`0 4px 16px ${REC}44`,
            }}>
              ⏹ Stop Recording
            </button>

            {duration < question.minSeconds && (
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#f59e0b" }}>
                Keep speaking — minimum {fmtTime(question.minSeconds)}
              </span>
            )}
          </>
        )}

        {/* ── REVIEW ── */}
        {phase === "review" && value?.url && (
          <>
            <div style={{ fontSize:40 }}>🎙</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#94a3b8" }}>
              Recording ready · {fmtTime(value.duration || duration)}
            </div>

            {/* Audio playback */}
            <audio ref={audioRef} src={value.url} onEnded={()=>setPlaying(false)}
              style={{ display:"none" }} />

            <div style={{ display:"flex", gap:3, alignItems:"center", height:40, opacity: playing ? 1 : 0.5, transition:"opacity .3s" }}>
              {Array.from({length:28}).map((_,i) => (
                <div key={i} style={{
                  width:4, borderRadius:2,
                  background: playing ? GLD : "#334155",
                  height:`${12 + Math.abs(Math.sin(i*0.8))*60}%`,
                  animation: playing ? `voiceWave ${0.3 + (i%6)*0.1}s ease-in-out ${i*0.03}s infinite alternate` : "none",
                }} />
              ))}
            </div>

            {/* Playback controls */}
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button onClick={() => {
                if (!audioRef.current) return;
                if (playing) { audioRef.current.pause(); audioRef.current.currentTime = 0; setPlaying(false); }
                else { audioRef.current.play(); setPlaying(true); }
              }} style={{
                background: playing ? "#1e293b" : GLD+"22",
                border:`1.5px solid ${playing ? "#334155" : GLD}`,
                borderRadius:12, padding:"10px 22px",
                color: playing ? "#94a3b8" : GLD,
                fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
                cursor:"pointer", display:"flex", alignItems:"center", gap:8,
              }}>
                {playing ? "⏹ Stop" : "▶ Play Back"}
              </button>
            </div>

            {/* Action buttons */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
              {attemptsLeft > 0 && (
                <button onClick={deleteRecording} style={{
                  background:"#f8717114", border:"1px solid #f8717144",
                  borderRadius:10, padding:"10px 20px",
                  color:"#f87171", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
                  cursor:"pointer",
                }}>
                  🗑 Delete & Re-record
                </button>
              )}
              <button onClick={submitRecording} disabled={duration > 0 && duration < question.minSeconds} style={{
                background:`linear-gradient(135deg,#22c55e,#16a34a)`,
                border:"none", borderRadius:10, padding:"10px 24px",
                color:"white", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700,
                cursor: duration > 0 && duration < question.minSeconds ? "not-allowed" : "pointer",
                opacity: duration > 0 && duration < question.minSeconds ? .5 : 1,
                boxShadow:"0 4px 14px #22c55e44",
              }}>
                ✓ Submit This Recording
              </button>
            </div>

            {attemptsLeft > 0 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#475569", textAlign:"center" }}>
                Not happy with it? Delete and re-record. {attemptsLeft} attempt{attemptsLeft!==1?"s":""} left.
              </div>
            )}
          </>
        )}

        {/* ── SUBMITTED ── */}
        {phase === "submitted" && (
          <>
            <div style={{ fontSize:48 }}>✅</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#22c55e", fontWeight:600 }}>
              Answer Submitted
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#64748b", textAlign:"center" }}>
              Your voice recording has been saved.<br/>You can still listen back below.
            </div>
            {value?.url && (
              <audio controls src={value.url} style={{
                width:"100%", maxWidth:320,
                accentColor: GLD,
              }} />
            )}
          </>
        )}
      </div>

      {/* Hint */}
      {question.hint && phase !== "submitted" && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#475569", lineHeight:1.6, padding:"10px 14px", background:"#0f172a", borderRadius:10, border:"1px solid #1e293b" }}>
          💡 {question.hint}
        </div>
      )}

      {error && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#f87171", padding:"10px 14px", background:"#f8717110", borderRadius:10, border:"1px solid #f8717133" }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ question, index, total, value, onChange, onNext, onPrev, isLast }) {
  const renderBody = () => {
    switch (question.type) {
      case "single_choice":
        return <SingleChoiceOptions options={question.options} value={value} onChange={onChange} />;
      case "multi_choice":
        return <MultiChoiceOptions options={question.options} value={value || []} onChange={onChange} />;
      case "multi_select":
        return <MultiChoiceOptions options={question.options} value={value || []} onChange={onChange} multi />;
      case "audio":
        return <AudioQuestion question={question} value={value} onChange={onChange} />;
      case "video":
        return <VideoQuestion question={question} value={value} onChange={onChange} />;
      case "fill_blank":
        return <FillBlankQuestion question={question} value={value} onChange={onChange} />;
      case "fill_wordbank":
        return <FillWordBankQuestion question={question} value={value || {}} onChange={onChange} />;
      case "writing":
        return <WritingQuestion question={question} value={value} onChange={onChange} />;
      case "voice":
        return <VoiceQuestion question={question} value={value} onChange={onChange} />;
      default:
        return null;
    }
  };

  const typeLabels = {
    single_choice: "Single Choice",
    multi_choice: "Multiple Correct",
    multi_select: "Select All That Apply",
    audio: "Listening",
    video: "Video",
    fill_blank: "Fill in the Blank",
    fill_wordbank: "🧩 Word Bank",
    writing: "Writing",
    voice: "🎤 Voice Recording",
  };

  return (
    <div style={{
      background: "linear-gradient(160deg, #0d1829 0%, #0a1120 100%)",
      border: "1px solid #1e293b",
      borderRadius: 20,
      padding: "32px 36px",
      maxWidth: "100%",
      width: "100%",
      boxShadow: "0 24px 64px #00000080",
      animation: "fadeSlideIn 0.35s cubic-bezier(.4,0,.2,1)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LevelBadge level={question.level} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#475569", letterSpacing: 0.5 }}>
            {question.section}
          </span>
          <span style={{
            background: "#1e293b", borderRadius: 6,
            padding: "2px 8px", fontSize: 11, color: "#64748b",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {typeLabels[question.type]}
          </span>
        </div>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#c8a96e", fontWeight: 600 }}>
          {question.points} {question.points === 1 ? "միավոր" : "միավոր"}
        </span>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#475569" }}>
            Հարց {index + 1} / {total}
          </span>
        </div>
        <ProgressBar current={index + 1} total={total} />
      </div>

      {/* Question text */}
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20, color: "#e2e8f0", lineHeight: 1.7,
        marginBottom: 24, fontWeight: 500,
      }}>
        {question.text}
      </p>

      {/* Body */}
      {renderBody()}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, gap: 12 }}>
        <button onClick={onPrev} disabled={index === 0} style={{
          background: index === 0 ? "#0f172a" : "#1e293b",
          border: "1px solid #334155",
          borderRadius: 10, padding: "10px 24px",
          color: index === 0 ? "#334155" : "#94a3b8",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          cursor: index === 0 ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}>
          ← Նախորդ
        </button>
        <button onClick={onNext} style={{
          background: isLast
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #c8a96e, #a07840)",
          border: "none",
          borderRadius: 10, padding: "10px 28px",
          color: "white",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
          cursor: "pointer",
          boxShadow: isLast ? "0 4px 16px #10b98144" : "0 4px 16px #c8a96e44",
          transition: "all 0.2s",
        }}>
          {isLast ? "✓ Ավարտել" : "Հաջորդ →"}
        </button>
      </div>
    </div>
  );
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────
function QuestionNav({ questions, current, answers, onJump }) {
  return (
    <div style={{
      background: "#080f1a",
      border: "1px solid #1e293b",
      borderRadius: 16,
      padding: "20px 16px",
      width: 200,
      flexShrink: 0,
    }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
        Հարցեր
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {questions.map((q, i) => {
          const ans = answers[q.id];
          const answered = q.type === "fill_wordbank"
            ? (ans && typeof ans === "object" && Object.keys(ans).length > 0)
            : q.type === "voice"
            ? (ans && ans.url)
            : ans !== undefined && ans !== "" && !(Array.isArray(ans) && ans.length === 0) && ans !== null;
          const isCurrent = i === current;
          return (
            <button key={q.id} onClick={() => onJump(i)} style={{
              width: 36, height: 36, borderRadius: 8,
              border: `1.5px solid ${isCurrent ? "#c8a96e" : answered ? "#22c55e44" : "#1e293b"}`,
              background: isCurrent ? "#c8a96e22" : answered ? "#22c55e11" : "#0f172a",
              color: isCurrent ? "#c8a96e" : answered ? "#4ade80" : "#475569",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}>
              {i + 1}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#22c55e22", border: "1px solid #22c55e44" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#475569" }}>Պատասխանված</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#c8a96e22", border: "1px solid #c8a96e" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#475569" }}>Ընթացիկ</span>
        </div>
      </div>
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────
function scoreQuestion(q, a) {
  if (q.type === "single_choice" || q.type === "audio" || q.type === "video") {
    return a === q.correct ? q.points : 0;
  } else if (q.type === "multi_choice" || q.type === "multi_select") {
    const sorted = [...(a || [])].sort().join(",");
    const correctSorted = [...q.correct].sort().join(",");
    return sorted === correctSorted ? q.points : 0;
  } else if (q.type === "fill_blank") {
    return (a || "").toLowerCase().trim() === q.answer.toLowerCase() ? q.points : 0;
  } else if (q.type === "fill_wordbank") {
    if (!a || !q.correct) return 0;
    let pts = 0;
    q.segments.filter(s=>s.type==="blank").forEach((s,i) => {
      if (a[s.id] === q.correct[i]) pts += Math.round(q.points / q.segments.filter(s=>s.type==="blank").length);
    });
    return pts;
  } else if (q.type === "writing") {
    const wc = (a || "").trim().split(/\s+/).filter(Boolean).length;
    return (wc >= q.minWords && wc <= q.maxWords) ? q.points : 0;
  } else if (q.type === "voice") {
    return a?.url ? q.points : 0; // manual grading placeholder
  }
  return 0;
}

function ResultsScreen({ answers, questions, exam, onRestart }) {
  const [showDetails, setShowDetails] = useState(false);

  const isPlacement = exam?.examType === "placement";

  let score = 0, maxScore = 0;
  const qResults = questions.map(q => {
    const a = answers[q.id];
    const earned = scoreQuestion(q, a);
    score += earned;
    maxScore += q.points;
    const answered = a !== undefined && a !== null && a !== "" && !(Array.isArray(a) && !a.length);
    const isAuto = !["writing","voice"].includes(q.type);
    return { q, a, earned, isCorrect: isAuto && earned === q.points, isPartial: isAuto && earned > 0 && earned < q.points, answered, isAuto };
  });

  const pct = Math.round((score / maxScore) * 100);

  // Placement: compute detected level from thresholds
  const placement = isPlacement ? computePlacementLevel(exam, questions, answers) : null;
  const detectedLevel = placement?.detectedLevel || null;

  // Fixed: pass/fail based on exam's passingScore
  const passingPct = exam?.passingScore ?? 60;
  const passed = isPlacement ? false : pct >= passingPct; // placement has no pass/fail
  const GLD = "#c8a96e";
  const typeLabels = { single_choice:"Choice", multi_choice:"Multi", multi_select:"Select", audio:"Audio", video:"Video", fill_blank:"Fill", fill_wordbank:"Word Bank", writing:"Writing", voice:"Voice" };

  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:20, animation:"fadeSlideIn .4s ease" }}>

      {/* ── Score card ── */}
      <div style={{ background:"linear-gradient(160deg,#0d1829 0%,#0a1120 100%)", border:`1px solid ${isPlacement?"#a78bfa33":passed?"#22c55e33":"#f8717133"}`, borderRadius:24, padding:"40px", textAlign:"center", boxShadow:"0 24px 64px #00000080", position:"relative", overflow:"hidden", maxWidth:800, alignSelf:"center", width:"100%" }}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 0%, ${isPlacement?"#a78bfa":passed?"#22c55e":"#f87171"}0a 0%, transparent 70%)`, pointerEvents:"none" }} />

        {/* Donut */}
        <div style={{ width:140, height:140, borderRadius:"50%", margin:"0 auto 24px", background:`conic-gradient(${isPlacement?"#a78bfa":passed?GLD:"#f87171"} ${pct*3.6}deg, #1e293b 0deg)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:112, height:112, borderRadius:"50%", background:"#080f1a", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:2 }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, color:isPlacement?"#a78bfa":passed?GLD:"#f87171", lineHeight:1 }}>{pct}%</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#475569", letterSpacing:1 }}>SCORE</span>
          </div>
        </div>

        {/* Title */}
        {isPlacement ? (
          <>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, color:"#e2e8f0", margin:"0 0 10px", fontWeight:600 }}>
              Placement Complete ✓
            </h2>
            {/* Detected level badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:12, background:"#a78bfa14", border:"1px solid #a78bfa44", borderRadius:16, padding:"14px 28px", marginBottom:28 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#a78bfa" }}>Detected Language Level</span>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, color: LEVEL_COLORS[detectedLevel] || "#a78bfa", lineHeight:1 }}>
                {detectedLevel}
              </span>
            </div>
            {/* Level scale */}
            <div style={{ display:"flex", gap:0, borderRadius:10, overflow:"hidden", marginBottom:28, maxWidth:500, margin:"0 auto 28px" }}>
              {["A1","A2","B1","B2","C1","C2"].map(l => {
                const lc = LEVEL_COLORS[l];
                const isDetected = l === detectedLevel;
                return (
                  <div key={l} style={{ flex:1, background:isDetected?lc+"33":"#0f172a", border:`1px solid ${isDetected?lc+"88":lc+"22"}`, padding:"10px 4px", textAlign:"center", transition:"all .3s" }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:isDetected?lc:"#334155" }}>{l}</div>
                    {isDetected && <div style={{ fontSize:10, color:lc, marginTop:2 }}>▲</div>}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, color:"#e2e8f0", margin:"0 0 6px", fontWeight:600 }}>
              {passed ? "Քննությունն անցված է ✓" : "Քննությունն ավարտված է"}
            </h2>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#64748b", marginBottom:28 }}>
              {passed ? `Congratulations — passed! (threshold: ${passingPct}%)` : `Exam completed — score below ${passingPct}% threshold`}
            </p>
          </>
        )}

        {/* Stats row */}
        <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:28, flexWrap:"wrap" }}>
          {[
            { label:"Score",     value:`${score}/${maxScore}`, color:GLD },
            ...(isPlacement
              ? [{ label:"Level", value:detectedLevel, color:LEVEL_COLORS[detectedLevel]||"#a78bfa" }]
              : [{ label:passed?"Passed":"Failed", value:passed?"✓":"✗", color:passed?"#22c55e":"#f87171" }]
            ),
            { label:"Correct",   value:qResults.filter(r=>r.isCorrect).length+"/"+qResults.filter(r=>r.isAuto).length, color:"#22c55e" },
            { label:"Unanswered",value:qResults.filter(r=>!r.answered).length, color:"#f59e0b" },
          ].map(s=>(
            <div key={s.label} style={{ background:"#0f172a", borderRadius:14, padding:"16px 22px", border:"1px solid #1e293b", minWidth:90, textAlign:"center" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#475569", marginBottom:5, letterSpacing:.8, textTransform:"uppercase" }}>{s.label}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:s.color, fontWeight:700, lineHeight:1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button onClick={()=>setShowDetails(d=>!d)} style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:12, padding:"12px 28px", color:"#94a3b8", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, cursor:"pointer" }}>
            {showDetails ? "▲ Hide Details" : "▼ Review Answers"}
          </button>
          <button onClick={onRestart} style={{ background:`linear-gradient(135deg,${GLD},#a07840)`, border:"none", borderRadius:12, padding:"12px 28px", color:"white", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:`0 4px 20px ${GLD}44` }}>
            ↺ Choose Another Exam
          </button>
        </div>
      </div>

      {/* ── Question breakdown ── */}
      {showDetails && (
        <div style={{ display:"flex", flexDirection:"column", gap:10, animation:"fadeSlideIn .3s ease" }}>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#e2e8f0", fontWeight:600, margin:0 }}>Answer Review</h3>
          {qResults.map(({ q, a, earned, isCorrect, isPartial, answered, isAuto }, i) => {
            const lc = LEVEL_COLORS[q.level] || "#94a3b8";
            const statusColor = !answered ? "#475569" : !isAuto ? "#f59e0b" : isCorrect ? "#22c55e" : isPartial ? "#f59e0b" : "#f87171";
            const statusIcon  = !answered ? "—" : !isAuto ? "✦" : isCorrect ? "✓" : isPartial ? "½" : "✗";
            return (
              <div key={q.id} style={{ background:"linear-gradient(135deg,#0d1829,#0a1120)", border:`1.5px solid ${statusColor}33`, borderRadius:16, padding:"18px 22px", display:"flex", gap:16, alignItems:"flex-start" }}>
                {/* Status badge */}
                <div style={{ width:36, height:36, borderRadius:"50%", background:statusColor+"18", border:`2px solid ${statusColor}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:statusColor }}>
                  {statusIcon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#475569" }}>#{i+1}</span>
                    <span style={{ background:lc+"18", color:lc, border:`1px solid ${lc}33`, borderRadius:5, padding:"1px 7px", fontSize:10, fontWeight:700 }}>{q.level}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#475569" }}>{q.section}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#334155" }}>{typeLabels[q.type]}</span>
                    <span style={{ marginLeft:"auto", fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:700, color:statusColor }}>{earned}/{q.points}pt</span>
                  </div>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#cbd5e1", lineHeight:1.5, margin:"0 0 8px" }}>{q.text}</p>

                  {/* Show answer details for auto-graded */}
                  {isAuto && answered && (
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {/* User answer */}
                      <div style={{ background:"#0f172a", border:`1px solid ${isCorrect?"#22c55e33":"#f8717133"}`, borderRadius:8, padding:"6px 12px", flex:1, minWidth:120 }}>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"#475569", letterSpacing:.8, marginBottom:3 }}>YOUR ANSWER</div>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:isCorrect?"#22c55e":"#f87171" }}>
                          {q.type==="fill_blank" || q.type==="fill_wordbank"
                            ? (q.type==="fill_blank" ? (a||"—") : Object.values(a||{}).join(", ")||"—")
                            : Array.isArray(a)
                              ? (a.length ? a.map(i=>q.options[i]).join(", ") : "—")
                              : (q.options?.[a] ?? "—")
                          }
                        </div>
                      </div>
                      {/* Correct answer (only if wrong) */}
                      {!isCorrect && (
                        <div style={{ background:"#0f172a", border:"1px solid #22c55e33", borderRadius:8, padding:"6px 12px", flex:1, minWidth:120 }}>
                          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"#475569", letterSpacing:.8, marginBottom:3 }}>CORRECT ANSWER</div>
                          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#22c55e" }}>
                            {q.type==="fill_blank" ? q.answer
                              : q.type==="fill_wordbank" ? (q.correct||[]).join(", ")
                              : Array.isArray(q.correct)
                                ? q.correct.map(i=>q.options[i]).join(", ")
                                : (q.options?.[q.correct] ?? "—")
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!isAuto && answered && (
                    <div style={{ background:"#f59e0b0d", border:"1px solid #f59e0b33", borderRadius:8, padding:"6px 12px" }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#f59e0b" }}>✦ Requires manual grading by examiner</span>
                    </div>
                  )}
                  {!answered && (
                    <div style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:8, padding:"6px 12px" }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#475569" }}>Not answered</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Start Screen ──────────────────────────────────────────────────────────────
function StartScreen({ onStart }) {
  const [selected, setSelected] = useState(null);
  const activeExams = EXAMS.filter(e => e.status === "active");
  const STATUS_COLORS = { active:"#22c55e", draft:"#f59e0b", scheduled:"#60a5fa", completed:"#94a3b8" };
  return (
    <div style={{
      maxWidth: 780, width: "100%",
      animation: "fadeSlideIn 0.4s ease",
      display: "flex", flexDirection: "column", gap: 24,
    }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, color:"#e2e8f0", margin:"0 0 6px", fontWeight:600 }}>
          Հայոց Լեզվի Քննություններ
        </h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#475569", margin:0 }}>
          Armenian Language Examinations · Select an exam to begin
        </p>
      </div>

      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#e2e8f0", margin: "0 0 8px", lineHeight: 1.2 }}>
        {t.title}
      </h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#475569", marginBottom: 36 }}>{t.sub}</p>

      {/* Language selector */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
        {[["hy", "ՀԱՅ"], ["ru", "РУС"], ["en", "ENG"]].map(([l, label]) => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: "8px 20px", borderRadius: 8,
            background: lang === l ? "#c8a96e22" : "#0f172a",
            border: `1.5px solid ${lang === l ? "#c8a96e" : "#1e293b"}`,
            color: lang === l ? "#c8a96e" : "#475569",
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {/* Exam list */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {activeExams.length === 0 && (
          <div style={{ textAlign:"center", padding:"48px 0", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#475569" }}>
            No active exams available
          </div>
        )}
        {activeExams.map(exam => {
          const sel = selected?.id === exam.id;
          const lc = LEVEL_COLORS[exam.level] || "#a78bfa";
          const isPlacement = exam.examType === "placement";
          const qCount = isPlacement
            ? (exam.placementTemplate||[]).reduce((s,r)=>s+r.count,0)
            : exam.questionIds.length;
          return (
            <div key={exam.id} onClick={() => setSelected(exam)}
              style={{ background: sel?"linear-gradient(135deg,#0d1829,#0a1522)":"#0d1829",
                border:`2px solid ${sel?"#c8a96e":"#1e293b"}`,
                borderRadius:18, padding:"22px 26px", cursor:"pointer",
                transition:"all .2s", boxShadow: sel?"0 0 0 1px #c8a96e33":"none",
                display:"flex", alignItems:"center", gap:20 }}>
              {/* Left icon */}
              <div style={{ width:52, height:52, borderRadius:14, flexShrink:0,
                background: isPlacement ? "#a78bfa18" : lc+"18",
                border:`1.5px solid ${isPlacement?"#a78bfa44":lc+"44"}`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                {isPlacement ? "📊" : "🎯"}
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  {isPlacement
                    ? <span style={{ background:"#a78bfa18",color:"#a78bfa",border:"1px solid #a78bfa33",borderRadius:5,padding:"1px 8px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>📊 Placement</span>
                    : <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:5,padding:"1px 8px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{exam.level}</span>
                  }
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#22c55e",background:"#22c55e18",border:"1px solid #22c55e33",borderRadius:5,padding:"1px 8px" }}>Active</span>
                </div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#e2e8f0",fontWeight:600,marginBottom:4 }}>{exam.title}</div>
                <div style={{ display:"flex", gap:16 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#475569" }}>📋 {qCount} questions</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#475569" }}>⏱ {exam.duration} min</span>
                  {!isPlacement && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#475569" }}>🎯 Pass: {exam.passingScore}%</span>}
                  {isPlacement  && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#a78bfa" }}>🎚 All levels · auto-detect</span>}
                </div>
              </div>
              {/* Select indicator */}
              <div style={{ width:24, height:24, borderRadius:"50%", border:`2px solid ${sel?"#c8a96e":"#334155"}`,
                background:sel?"#c8a96e":"transparent", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}>
                {sel && <svg width={12} height={12} viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} fill="none" strokeLinecap="round"/></svg>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected exam detail + Start button */}
      {selected && (
        <div style={{ background:"linear-gradient(135deg,#0a1520,#080f1a)", border:"1px solid #c8a96e33", borderRadius:18, padding:"24px 28px", animation:"fadeSlideIn .25s ease" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#e2e8f0", fontWeight:600, marginBottom:16 }}>
            {selected.title}
          </div>
          {selected.examType==="placement" ? (
            <div style={{ marginBottom:20 }}>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#64748b", margin:"0 0 14px", lineHeight:1.6 }}>
                This is a <strong style={{color:"#a78bfa"}}>Placement Exam</strong>. Questions from all levels will be selected automatically. After completion, the system determines your Armenian language level.
              </p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {(selected.placementTemplate||[]).map(r=>{
                  const lc = LEVEL_COLORS[r.level]||"#94a3b8";
                  return <span key={r.level} style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{r.level}: {r.count}q</span>;
                })}
              </div>
            </div>
          ) : (
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#64748b", margin:"0 0 20px", lineHeight:1.6 }}>
              Level <strong style={{color:LEVEL_COLORS[selected.level]||"#94a3b8"}}>{selected.level}</strong> · {selected.questionIds.length} questions · {selected.duration} minutes · Pass score: {selected.passingScore}%
            </p>
          )}
          <button onClick={() => onStart(selected)} style={{
            width:"100%", background:"linear-gradient(135deg,#c8a96e,#a07840)",
            border:"none", borderRadius:14, padding:"16px",
            color:"white", fontFamily:"'DM Sans',sans-serif",
            fontSize:16, fontWeight:600, cursor:"pointer",
            boxShadow:"0 8px 32px #c8a96e44", letterSpacing:.5, transition:"all .2s",
          }}>
            Սկսել Քննությունը →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function ArmExam() {
  const [screen, setScreen]   = useState("start"); // start | exam | results
  const [activeExam, setActiveExam] = useState(null);   // selected exam object
  const [examQuestions, setExamQuestions] = useState([]); // built question list
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleStart = (exam) => {
    const qs = buildExamQuestions(exam);
    setActiveExam(exam);
    setExamQuestions(qs);
    setCurrent(0);
    setAnswers({});
    setScreen("exam");
  };

  const handleAnswer = (val) => {
    setAnswers(a => ({ ...a, [examQuestions[current].id]: val }));
  };
  const handleNext = () => {
    if (current < examQuestions.length - 1) setCurrent(c => c + 1);
    else setScreen("results");
  };
  const handlePrev = () => { if (current > 0) setCurrent(c => c - 1); };
  const handleRestart = () => { setScreen("start"); setActiveExam(null); setCurrent(0); setAnswers({}); };

  return (
    <>
      <style>{FONTS}{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes recPulse {
  0%   { box-shadow: 0 0 0 0 #f8717166; }
  70%  { box-shadow: 0 0 0 10px #f8717100; }
  100% { box-shadow: 0 0 0 0  #f8717100; }
}
@keyframes voiceWave {
  from { transform: scaleY(0.3); }
  to   { transform: scaleY(1.0); }
}
@keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes videoProgress {
          from { width: 0; }
          to { width: 100%; }
        }
        button:hover { filter: brightness(1.08); }
        textarea { scrollbar-width: thin; scrollbar-color: #1e293b transparent; }
      `}</style>
      <div style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column",
        background: "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, #050c18 60%, #020709 100%)",
        fontFamily: "'DM Sans', sans-serif",
        overflow: "hidden",
      }}>
        {/* Top bar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid #0f1f38",
          background: "#04080f99",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #c8a96e, #7c5830)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 16, color: "white",
            }}>Հ</div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#e2e8f0", letterSpacing: 1 }}>
              ArmExam
            </span>
            {activeExam && screen === "exam" && (
              <>
                <span style={{ color:"#1e293b", fontSize:16 }}>·</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#64748b", maxWidth:300, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {activeExam.title}
                </span>
              </>
            )}
          </div>
          {screen === "exam" && (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Timer seconds={(activeExam?.duration || 45) * 60} />
              <button onClick={() => setScreen("results")} style={{
                background: "transparent", border: "1px solid #334155",
                borderRadius: 8, padding: "6px 16px",
                color: "#64748b", fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, cursor: "pointer",
              }}>
                Ավարտել
              </button>
            </div>
          )}
        </header>

        {/* Main */}
        <main style={{
          flex: 1, overflowY: "auto",
          padding: "32px 40px",
          display: "flex", flexDirection: "column",
          alignItems: "stretch",
          minHeight: 0,
        }}>
          {screen === "start" && (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-start" }}>
              <StartScreen onStart={handleStart} />
            </div>
          )}
          {screen === "exam" && examQuestions.length > 0 && (
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", width: "100%" }}>
              <QuestionNav
                questions={examQuestions}
                current={current}
                answers={answers}
                onJump={setCurrent}
              />
              <QuestionCard
                question={examQuestions[current]}
                index={current}
                total={examQuestions.length}
                value={answers[examQuestions[current].id]}
                onChange={handleAnswer}
                onNext={handleNext}
                onPrev={handlePrev}
                isLast={current === examQuestions.length - 1}
              />
            </div>
          )}
          {screen === "results" && (
            <ResultsScreen
              answers={answers}
              questions={examQuestions}
              exam={activeExam}
              onRestart={handleRestart}
            />
          )}
        </main>

        {/* Footer */}
        <footer style={{
          textAlign: "center", padding: "16px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 11,
          color: "#1e293b", borderTop: "1px solid #0f1f38",
          flexShrink: 0,
        }}>
          ArmExam © 2025 · Armenian Language Testing Platform
        </footer>
      </div>
    </>
  );
}
