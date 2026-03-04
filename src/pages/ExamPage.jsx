import { useState, useEffect, useRef, useCallback } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
`;

// ── Demo question bank ──────────────────────────────────────────────────────
const DEMO_QUESTIONS = [
  {
    id: 1,
    type: "single_choice",
    level: "A2",
    section: "Կարդալ", // Reading
    points: 1,
    text: "Ընտրի՛ր ճիշտ պատասխանը։ «Ես ___ դպրոց եմ գնում ամեն օր»։",
    options: ["դեպի", "մոտ", "կողքին", "առաջ"],
    correct: 0,
  },
  {
    id: 2,
    type: "multi_choice",
    level: "B1",
    section: "Քերականություն", // Grammar
    points: 2,
    text: "Ո՞ր նախադասություններն են քերականորեն ճիշտ։",
    options: [
      "Նա գրքեր է կարդում։",
      "Ես երեկ կինո գնացի։",
      "Նրանք վաղը ուսումնարան կգնան։",
      "Դու ճաշ ուտում ես արդեն։",
    ],
    correct: [0, 1, 2],
  },
  {
    id: 3,
    type: "multi_select",
    level: "B2",
    section: "Բառապաշար", // Vocabulary
    points: 3,
    text: "Ընտրի՛ր բոլոր բառերը, որոնք կապված են «ճամփորդություն» թեմայի հետ։",
    options: ["ինքնաթիռ", "բժիշկ", "կայարան", "ճամպրուկ", "դպրոց", "անձնագիր"],
    correct: [0, 2, 3, 5],
  },
  {
    id: 4,
    type: "audio",
    level: "B1",
    section: "Լսել", // Listening
    points: 3,
    text: "Լսի՛ր ձայնագրությունը և պատասխանի՛ր հարցին։ Ի՞նչ է պատմում մարդը։",
    audioSrc: null, // demo
    maxPlays: 2,
    pauseSeconds: 25,
    options: [
      "Նա պատմում է իր ճամփորդության մասին",
      "Նա պատմում է իր ընտանիքի մասին",
      "Նա պատմում է իր աշխատանքի մասին",
      "Նա պատմում է իր ծնողների մասին",
    ],
    correct: 0,
  },
  {
    id: 5,
    type: "video",
    level: "C1",
    section: "Լսել / Տեսնել",
    points: 4,
    text: "Դիտի՛ր տեսանյութը և պատասխանի՛ր հարցին։ Ի՞նչ թեմայի շուրջ է զրույցը։",
    videoSrc: null,
    maxPlays: 2,
    options: [
      "Կրթության բարեփոխումներ",
      "Բնապահպանական խնդիրներ",
      "Տնտեսական ճգնաժամ",
      "Մշակութային ժառանգություն",
    ],
    correct: 1,
  },
  {
    id: 6,
    type: "fill_blank",
    level: "A1",
    section: "Գրել", // Writing
    points: 1,
    text: "Լրացրո՛ւ բաց թողնված բառը։ «Ես ___ եմ» (to be - first person)",
    answer: "եմ",
    placeholder: "Գրի՛ր բառը...",
  },
  {
    id: 7,
    type: "writing",
    level: "C2",
    section: "Ազատ շարադրություն",
    points: 10,
    text: "Գրի՛ր 150-200 բառ հետևյալ թեմայի շուրջ։ «Ժամանակակից տեխնոլոգիաների ազդեցությունը հայոց լեզվի վրա»",
    minWords: 150,
    maxWords: 200,
  },
  {
    id: 8,
    type: "fill_wordbank",
    level: "A2",
    section: "Քերականություն",
    points: 4,
    text: "Դասավորի՛ր բառերը ճիշտ տեղերում։ Arrange the words in the correct blanks.",
    // segments: alternating plain text and blank slots
    // blanks have ids matching wordBank keys
    segments: [
      { type: "text", content: "Ես ամեն օր " },
      { type: "blank", id: 0 },
      { type: "text", content: " դպրոց: Իմ ընկերը " },
      { type: "blank", id: 1 },
      { type: "text", content: " գրքեր, բայց ես " },
      { type: "blank", id: 2 },
      { type: "text", content: " երաժշտություն:" },
    ],
    wordBank: ["գնում եմ", "կարդում է", "լսում եմ", "խաղում է", "գրում եմ"],
    correct: ["գնում եմ", "կարդում է", "լսում եմ"],
  },
  {
    id: 9,
    type: "voice",
    level: "B1",
    section: "Speaking",
    points: 5,
    text: "Ձայնագրի\u0580 պատասխանդ։ Պատմի\u0580 30\u201360 վայրկյան քո սիրած տոնի մասին։\n\n\"Describe your favourite holiday in Armenian. Speak for 30\u201360 seconds.\"",
    maxAttempts: 3,
    minSeconds: 5,
    maxSeconds: 90,
    hint: "Speak clearly. You have 3 attempts — re-record if not satisfied.",
  },
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLORS = {
  A1: "#4ade80", A2: "#86efac",
  B1: "#60a5fa", B2: "#93c5fd",
  C1: "#f59e0b", C2: "#fbbf24",
};

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
      maxWidth: 760,
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
          const answered = answers[q.id] !== undefined && answers[q.id] !== "" &&
            !(Array.isArray(answers[q.id]) && answers[q.id].length === 0);
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
function ResultsScreen({ answers, questions, onRestart }) {
  let score = 0, maxScore = 0;
  questions.forEach(q => {
    maxScore += q.points;
    const a = answers[q.id];
    if (q.type === "single_choice" || q.type === "audio" || q.type === "video") {
      if (a === q.correct) score += q.points;
    } else if (q.type === "multi_choice" || q.type === "multi_select") {
      const sorted = [...(a || [])].sort().join(",");
      const correctSorted = [...q.correct].sort().join(",");
      if (sorted === correctSorted) score += q.points;
    } else if (q.type === "fill_blank") {
      if ((a || "").toLowerCase().trim() === q.answer.toLowerCase()) score += q.points;
    } else if (q.type === "writing") {
      const wc = (a || "").trim().split(/\s+/).filter(Boolean).length;
      if (wc >= q.minWords && wc <= q.maxWords) score += q.points;
    }
  });
  const pct = Math.round((score / maxScore) * 100);
  const grade = pct >= 90 ? "C2" : pct >= 75 ? "C1" : pct >= 60 ? "B2" : pct >= 45 ? "B1" : pct >= 30 ? "A2" : "A1";

  return (
    <div style={{
      maxWidth: 560, width: "100%",
      background: "linear-gradient(160deg, #0d1829 0%, #0a1120 100%)",
      border: "1px solid #1e293b",
      borderRadius: 24, padding: "48px 40px",
      textAlign: "center",
      boxShadow: "0 24px 64px #00000080",
      animation: "fadeSlideIn 0.4s ease",
    }}>
      <div style={{
        width: 120, height: 120, borderRadius: "50%", margin: "0 auto 28px",
        background: `conic-gradient(#c8a96e ${pct * 3.6}deg, #1e293b 0deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "#080f1a",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
        }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#c8a96e" }}>{pct}%</span>
        </div>
      </div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#e2e8f0", margin: "0 0 8px" }}>
        Քննությունն ավարտված է
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748b", marginBottom: 28 }}>
        Exam completed
      </p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 32 }}>
        <div style={{ background: "#0f172a", borderRadius: 12, padding: "16px 24px", border: "1px solid #1e293b" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#475569", marginBottom: 4 }}>SCORE</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#c8a96e", fontWeight: 700 }}>{score}/{maxScore}</div>
        </div>
        <div style={{ background: "#0f172a", borderRadius: 12, padding: "16px 24px", border: "1px solid #1e293b" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#475569", marginBottom: 4 }}>LEVEL</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: LEVEL_COLORS[grade] }}>{grade}</div>
        </div>
      </div>
      <button onClick={onRestart} style={{
        background: "linear-gradient(135deg, #c8a96e, #a07840)",
        border: "none", borderRadius: 12,
        padding: "14px 36px",
        color: "white", fontFamily: "'DM Sans', sans-serif",
        fontSize: 15, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 20px #c8a96e44",
      }}>
        Նորից սկսել
      </button>
    </div>
  );
}

// ── Start Screen ──────────────────────────────────────────────────────────────
function StartScreen({ onStart }) {
  const [lang, setLang] = useState("hy");
  const [level, setLevel] = useState("B1");
  const texts = {
    hy: { title: "Հայոց Լեզվի Քննություն", sub: "Armenian Language Examination", start: "Սկսել Քննությունը" },
    ru: { title: "Экзамен по Армянскому", sub: "Armenian Language Examination", start: "Начать Экзамен" },
    en: { title: "Armenian Language Exam", sub: "Հայոց Լեզվի Քննություն", start: "Start Examination" },
  };
  const t = texts[lang];
  return (
    <div style={{
      maxWidth: 600, width: "100%",
      background: "linear-gradient(160deg, #0d1829 0%, #0a1120 100%)",
      border: "1px solid #1e293b",
      borderRadius: 24, padding: "52px 44px",
      textAlign: "center",
      boxShadow: "0 32px 80px #00000090",
      animation: "fadeSlideIn 0.4s ease",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          background: "#0f172a", border: "1px solid #1e293b",
          borderRadius: 16, padding: "12px 20px",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #c8a96e, #7c5830)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
            fontSize: 20, color: "white",
          }}>Հ</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#e2e8f0", letterSpacing: 1 }}>ArmExam</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>Language Testing</div>
          </div>
        </div>
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

      {/* Level selector */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
          Ընտրի՛ր մակարդակ
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {LEVELS.map(l => (
            <button key={l} onClick={() => setLevel(l)} style={{
              width: 48, height: 48, borderRadius: 10,
              background: level === l ? LEVEL_COLORS[l] + "22" : "#0f172a",
              border: `1.5px solid ${level === l ? LEVEL_COLORS[l] : "#1e293b"}`,
              color: level === l ? LEVEL_COLORS[l] : "#475569",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Exam info */}
      <div style={{ display: "flex", gap: 12, marginBottom: 36, justifyContent: "center" }}>
        {[["📋", "7 հարց", "Questions"], ["⏱", "45 րոպե", "Minutes"], ["🎯", level, "Level"]].map(([icon, val, lbl]) => (
          <div key={lbl} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "12px 16px", flex: 1 }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#c8a96e", fontWeight: 600 }}>{val}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#475569" }}>{lbl}</div>
          </div>
        ))}
      </div>

      <button onClick={() => onStart(lang, level)} style={{
        width: "100%",
        background: "linear-gradient(135deg, #c8a96e, #a07840)",
        border: "none", borderRadius: 14,
        padding: "16px",
        color: "white", fontFamily: "'DM Sans', sans-serif",
        fontSize: 16, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 8px 32px #c8a96e44",
        letterSpacing: 0.5,
        transition: "all 0.2s",
      }}>
        {t.start} →
      </button>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function ArmExam() {
  const [screen, setScreen] = useState("start"); // start | exam | results
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleStart = () => setScreen("exam");
  const handleAnswer = (val) => {
    setAnswers(a => ({ ...a, [DEMO_QUESTIONS[current].id]: val }));
  };
  const handleNext = () => {
    if (current < DEMO_QUESTIONS.length - 1) setCurrent(c => c + 1);
    else setScreen("results");
  };
  const handlePrev = () => { if (current > 0) setCurrent(c => c - 1); };
  const handleRestart = () => { setScreen("start"); setCurrent(0); setAnswers({}); };

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
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, #050c18 60%, #020709 100%)",
        display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Top bar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid #0f1f38",
          background: "#04080f99",
          backdropFilter: "blur(12px)",
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
          </div>
          {screen === "exam" && (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Timer seconds={45 * 60} />
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
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "32px 20px",
        }}>
          {screen === "start" && <StartScreen onStart={handleStart} />}
          {screen === "exam" && (
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", width: "100%", maxWidth: 1000 }}>
              <QuestionNav
                questions={DEMO_QUESTIONS}
                current={current}
                answers={answers}
                onJump={setCurrent}
              />
              <QuestionCard
                question={DEMO_QUESTIONS[current]}
                index={current}
                total={DEMO_QUESTIONS.length}
                value={answers[DEMO_QUESTIONS[current].id]}
                onChange={handleAnswer}
                onNext={handleNext}
                onPrev={handlePrev}
                isLast={current === DEMO_QUESTIONS.length - 1}
              />
            </div>
          )}
          {screen === "results" && <ResultsScreen answers={answers} questions={DEMO_QUESTIONS} onRestart={handleRestart} />}
        </main>

        {/* Footer */}
        <footer style={{
          textAlign: "center", padding: "16px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 11,
          color: "#1e293b", borderTop: "1px solid #0f1f38",
        }}>
          ArmExam © 2025 · Armenian Language Testing Platform
        </footer>
      </div>
    </>
  );
}
