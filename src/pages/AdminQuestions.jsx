import { useState, useEffect, useRef } from "react";
import StudentPreview from "../components/StudentPreview.jsx";
import { api } from "../api.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');`;

// ── Constants ────────────────────────────────────────────────────────────────
const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const LEVEL_COLORS = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };
// Question types — canonical list (new schema). Also aliased as QTYPES below for filter pills.

// ── Palette ──────────────────────────────────────────────────────────────────
let C = { bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",gold:"#c8a96e",goldDim:"#7c5830",text:"#e2e8f0",muted:"#475569",dim:"#1e293b",success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa",purple:"#a78bfa",scrollThumb:"#243050",sidebarBg:"#080f1a",topbarBg:"#080f1acc" };

// ── Helpers ──────────────────────────────────────────────────────────────────
// ntypeInfo() defined below with NEW_TYPES — aliased here for early-reference callsites
// ntypeInfo and QTYPES defined after NEW_TYPES const (line ~85)

function Badge({ children, color="#64748b", bg }) {
  return <span style={{ background: bg||(color+"18"), color, border:`1px solid ${color}33`, borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:.5 }}>{children}</span>;
}

function Pill({ label, active, onClick, color="#c8a96e" }) {
  return (
    <button onClick={onClick} style={{ background:active?(color+"22"):"transparent", border:`1px solid ${active?color:C.border}`, borderRadius:8, padding:"5px 14px", color:active?color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all .15s" }}>
      {label}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type="text", style={} }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase" }}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", transition:"border .15s", ...style }}
        onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border2}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase" }}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", cursor:"pointer" }}>
        {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows=4 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase" }}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", resize:"vertical", transition:"border .15s" }}
        onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border2}
      />
    </div>
  );
}


// ── helpers ───────────────────────────────────────────────────────────────────
// Build a blank question state for the form.
// `initial` comes from the API (new schema): prompt, content{}, media[], contextText, config{}
const NEW_TYPES = [
  { id:"SINGLE_CHOICE",       label:"Single Choice",     icon:"◉",  color:"#60a5fa", hasOptions:true,  hasMedia:false },
  { id:"MULTIPLE_CHOICE",     label:"Multiple Choice",   icon:"☑",  color:"#a78bfa", hasOptions:true,  hasMedia:false },
  { id:"FILL_IN_THE_BLANKS",  label:"Fill Blanks",       icon:"✎",  color:"#e879f9", hasOptions:false, hasMedia:false },
  { id:"DRAG_TO_TEXT",        label:"Drag to Text",      icon:"🧩", color:"#f472b6", hasOptions:false, hasMedia:false },
  { id:"TEXT_INSERTION",      label:"Text Insertion",    icon:"↩",  color:"#34d399", hasOptions:false, hasMedia:false },
  { id:"DRAG_AND_DROP_TABLE", label:"D&D Table",         icon:"⊞",  color:"#fb923c", hasOptions:false, hasMedia:false },
  { id:"DRAG_AND_DROP_IMAGE", label:"D&D Image",         icon:"🗺",  color:"#f59e0b", hasOptions:false, hasMedia:true  },
  { id:"IMAGE_CLICK",         label:"Image Click",       icon:"🎯", color:"#f87171", hasOptions:false, hasMedia:true  },
  { id:"SPEAKING_INDEPENDENT",label:"Speaking (Indep.)", icon:"🎤", color:"#fb923c", hasOptions:false, hasMedia:false },
  { id:"SPEAKING_INTEGRATED", label:"Speaking (Integ.)", icon:"🎙", color:"#f97316", hasOptions:false, hasMedia:true  },
  { id:"WRITING_INDEPENDENT", label:"Writing (Indep.)",  icon:"✍",  color:"#94a3b8", hasOptions:false, hasMedia:false },
  { id:"WRITING_INTEGRATED",  label:"Writing (Integ.)",  icon:"📝", color:"#64748b", hasOptions:false, hasMedia:true  },
];
const ntypeInfo = (id) => NEW_TYPES.find(t => t.id === id) || NEW_TYPES[0];
const qtype = ntypeInfo;   // alias used in StatsBar / legacy call-sites
const QTYPES = NEW_TYPES;  // alias used in filter pill rows

function blankContent(type) {
  switch (type) {
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE":
      return { options: ["", "", "", ""], correct: type === "SINGLE_CHOICE" ? 0 : [] };
    case "FILL_IN_THE_BLANKS":
      return { segments: [{ type: "text", value: "Text " }, { type: "blank", id: 1, answer: "" }, { type: "text", value: "." }] };
    case "DRAG_TO_TEXT":
      return { text: "The sun {slot_1} every day.", wordBank: ["rises", "falls", "sleeps"], slots: { slot_1: "rises" } };
    case "TEXT_INSERTION":
      return { passages: ["Sentence to insert."], markers: [{ id: 1, correct: 0 }] };
    case "DRAG_AND_DROP_TABLE":
      return { columns: [{ id: "col_a", title: "Group A" }, { id: "col_b", title: "Group B" }], items: [{ id: "i1", text: "Item 1" }, { id: "i2", text: "Item 2" }], correct: { i1: "col_a", i2: "col_b" } };
    case "DRAG_AND_DROP_IMAGE":
      return { labels: [{ id: "lbl1", text: "Label 1" }], hotspots: [{ id: "hs1", x: 50, y: 50, correct: "lbl1" }] };
    case "IMAGE_CLICK":
      return { hotspots: [{ id: "hs1", x: 10, y: 10, width: 20, height: 20, correct: true }] };
    case "SPEAKING_INDEPENDENT":
    case "SPEAKING_INTEGRATED":
      return { prepSeconds: 30, recordSeconds: 60, maxAttempts: 1, rubrics: [
        { id: "fluency", label: "Fluency & Coherence", maxScore: 5 },
        { id: "lexical", label: "Lexical Resource", maxScore: 5 },
        { id: "grammar", label: "Grammatical Range", maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation", maxScore: 5 },
      ]};
    case "WRITING_INDEPENDENT":
    case "WRITING_INTEGRATED":
      return { minWords: 150, maxWords: 300, rubrics: [
        { id: "task_response", label: "Task Response", maxScore: 5 },
        { id: "coherence", label: "Coherence & Cohesion", maxScore: 5 },
        { id: "lexical", label: "Lexical Resource", maxScore: 5 },
        { id: "grammar", label: "Grammatical Range", maxScore: 5 },
      ]};
    default:
      return {};
  }
}

function blankQ() {
  return { type: "SINGLE_CHOICE", level: "B1", section: "", points: 1, status: "draft",
    prompt: "", contextText: "", media: [], content: blankContent("SINGLE_CHOICE"), config: {} };
}

function fromApi(q) {
  // Normalise API response → form state
  return {
    id: q.id,
    type: q.type || "SINGLE_CHOICE",
    level: q.level || "B1",
    section: q.section || "",
    points: q.points ?? 1,
    status: q.status || "draft",
    prompt: q.prompt || "",
    contextText: q.contextText || "",
    media: Array.isArray(q.media) ? q.media : [],
    content: q.content || blankContent(q.type),
    config: q.config || {},
  };
}

function toApi(q) {
  // Normalise form state → API body (only new schema fields)
  // id is kept so handleSave can route edit vs create
  const { id, type, level, section, points, status, prompt, contextText, media, content, config } = q;
  return { id, type, level, section, points: Number(points), status, prompt, contextText: contextText || null,
    media: media && media.length ? media : null, content, config: config && Object.keys(config).length ? config : null };
}

// ── Media editor ──────────────────────────────────────────────────────────────
function MediaEditor({ media = [], onChange }) {
  const add = (type) => onChange([...media, { type, url: "", maxPlays: type === "audio" ? 2 : 1 }]);
  const upd = (i, patch) => onChange(media.map((m, j) => j === i ? { ...m, ...patch } : m));
  const del = (i) => onChange(media.filter((_, j) => j !== i));
  const [uploading, setUploading] = useState({}); // { index: true }

  const uploadFile = async (file, i) => {
    setUploading(u => ({ ...u, [i]: true }));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("armexam_admin_token")}` },
        body: form,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const { url, type } = await res.json();
      upd(i, { url, type });
    } catch (e) {
      alert("Upload error: " + e.message);
    } finally {
      setUploading(u => { const n = { ...u }; delete n[i]; return n; });
    }
  };

  return (
    <div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", marginBottom:8 }}>
        Media  <span style={{ color:C.muted, fontWeight:400, textTransform:"none" }}>(image / audio / video)</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
        {media.map((m, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"70px 1fr auto auto", gap:8, alignItems:"center", background:C.panel, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 12px" }}>
            <select value={m.type} onChange={e => upd(i, { type: e.target.value })}
              style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:6, padding:"5px 8px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
              <option value="image">image</option>
              <option value="audio">audio</option>
              <option value="video">video</option>
            </select>
            <div style={{ display:"flex", gap:4, alignItems:"center", position:"relative" }}>
              {uploading[i] ? (
                <div style={{ flex:1, padding:"7px 10px", background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8,
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>
                  ⏳ Uploading…
                </div>
              ) : (
                <input value={m.url} onChange={e => upd(i, { url: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && upd(i, { url: e.target.value })}
                  placeholder="https://… or drag & drop / click 📎 to upload"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadFile(f, i); }}
                  style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8, padding:"7px 10px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none", flex:1 }} />
              )}
              {/* File picker button */}
              <label title="Upload file" style={{ background:"#6366f122", border:"1px solid #6366f155", borderRadius:7, width:28, height:28, color:"#818cf8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                📎
                <input type="file" accept="image/*,audio/*,video/*" style={{ display:"none" }}
                  onChange={e => { const f = e.target.files[0]; if (f) uploadFile(f, i); e.target.value = ""; }} />
              </label>
              {m.url && !uploading[i] && (
                <button onClick={() => upd(i, { url: m.url })} title="Confirm URL"
                  style={{ background:"#22c55e22", border:"1px solid #22c55e55", borderRadius:7, width:28, height:28, color:"#22c55e", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>✓</button>
              )}
            </div>
            {m.type !== "image" && (
              <select value={m.maxPlays ?? 2} onChange={e => upd(i, { maxPlays: Number(e.target.value) })}
                style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:6, padding:"5px 8px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                {[1,2,3].map(n => <option key={n} value={n}>{n}×</option>)}
              </select>
            )}
            <button onClick={() => del(i)} style={{ background:"transparent", border:"none", color:"#f87171", cursor:"pointer", fontSize:16, padding:"0 4px" }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {["image","audio","video"].map(t => (
          <button key={t} onClick={() => add(t)} style={{ background:C.panel, border:`1px dashed ${C.border2}`, borderRadius:8, padding:"6px 14px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Content editors per type ──────────────────────────────────────────────────
function ChoiceEditor({ content, multi, onChange }) {
  const opts = content.options || ["","","",""];
  const correct = content.correct ?? (multi ? [] : 0);
  const toggle = (i) => {
    if (!multi) { onChange({ ...content, correct: i }); return; }
    const cur = Array.isArray(correct) ? correct : [];
    onChange({ ...content, correct: cur.includes(i) ? cur.filter(x=>x!==i) : [...cur, i] });
  };
  const isCorrect = (i) => Array.isArray(correct) ? correct.includes(i) : correct === i;
  const setOpt = (i, v) => { const a = [...opts]; a[i] = v; onChange({ ...content, options: a }); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase" }}>
        Options  <span style={{ color:C.muted, fontWeight:400, textTransform:"none" }}>· click circle = correct</span>
      </label>
      {opts.map((opt, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => toggle(i)} style={{ width:28, height:28, borderRadius: multi ? "6px" : "50%", border:`2px solid ${isCorrect(i) ? C.success : C.border2}`, background: isCorrect(i) ? C.success+"22" : "transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
            {isCorrect(i) && <svg width={12} height={12} viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke={C.success} strokeWidth={2} strokeLinecap="round" fill="none"/></svg>}
          </button>
          <input value={opt} onChange={e => setOpt(i, e.target.value)} placeholder={`Option ${i+1}…`}
            style={{ flex:1, background:C.panel, border:`1.5px solid ${isCorrect(i) ? C.success+"55" : C.border2}`, borderRadius:10, padding:"9px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", transition:"border .15s" }} />
          {opts.length > 2 && (
            <button onClick={() => { const a=opts.filter((_,j)=>j!==i); onChange({...content,options:a}); }} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:16, padding:"4px 6px" }}>✕</button>
          )}
        </div>
      ))}
      <button onClick={() => onChange({ ...content, options: [...opts, ""] })} style={{ background:"transparent", border:`1px dashed ${C.border2}`, borderRadius:10, padding:"8px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer", marginTop:4 }}>
        + Add option
      </button>
    </div>
  );
}

function FillBlanksEditor({ content, onChange }) {
  // Simple textarea-based editor: text with [[blank:answer]] markers
  const segs = content.segments || [];
  const display = segs.map(s => s.type === "blank" ? `[[${s.answer||""}]]` : s.value).join("");

  const parse = (raw) => {
    const parts = raw.split(/(\[\[.*?\]\])/);
    let blankId = 1;
    return parts.map(p => {
      const m = p.match(/^\[\[(.*?)\]\]$/);
      if (m) return { type: "blank", id: blankId++, answer: m[1] };
      return { type: "text", value: p };
    }).filter(s => s.type === "blank" || s.value);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase" }}>
        Segments  <span style={{ color:C.muted, fontWeight:400, textTransform:"none" }}>· use [[answer]] for blanks</span>
      </label>
      <textarea value={display} onChange={e => onChange({ ...content, segments: parse(e.target.value) })} rows={3}
        style={{ background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", resize:"vertical" }}
        placeholder="e.g. Ես ամեն օր [[արթնանում]] եմ ժամը [[ութին]]:" />
      <div style={{ fontSize:11, color:C.muted }}>Preview: {segs.map((s,i) => s.type==="blank" ? <mark key={i} style={{ background:C.gold+"22", color:C.gold, borderRadius:4, padding:"1px 6px", margin:"0 2px" }}>{s.answer||"___"}</mark> : <span key={i}>{s.value}</span>)}</div>
    </div>
  );
}

function DragToTextEditor({ content, onChange }) {
  const [selWord, setSelWord] = useState("");
  const textareaRef = useRef(null);

  const text      = content.text     || "";
  const wordBank  = content.wordBank || [];
  const slots     = content.slots    || {};

  // Count existing slots to auto-name next one
  const nextSlotName = () => {
    const nums = Object.keys(slots).map(k => parseInt(k.replace(/[^0-9]/g,""))).filter(Boolean);
    return "slot_" + ((nums.length ? Math.max(...nums) : 0) + 1);
  };

  // Turn selected text in textarea into a slot
  const addSlot = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const word = text.slice(start, end).trim();
    if (!word) return;
    const name = nextSlotName();
    const newText = text.slice(0, start) + "{" + name + "}" + text.slice(end);
    const newSlots = { ...slots, [name]: word };
    const newWordBank = wordBank.includes(word) ? wordBank : [...wordBank, word];
    onChange({ ...content, text: newText, slots: newSlots, wordBank: newWordBank });
  };

  // Remove a slot — replace {slot_N} back with its correct answer
  const removeSlot = (name) => {
    const newText = text.replace("{" + name + "}", slots[name] || name);
    const newSlots = { ...slots };
    delete newSlots[name];
    const correctAnswers = Object.values(newSlots);
    const newWordBank = wordBank.filter(w => correctAnswers.includes(w) || !Object.values(slots).includes(w));
    onChange({ ...content, text: newText, slots: newSlots, wordBank: newWordBank });
  };

  // Add a distractor word to word bank
  const [distractor, setDistractor] = useState("");
  const addDistractor = () => {
    const w = distractor.trim();
    if (!w || wordBank.includes(w)) { setDistractor(""); return; }
    onChange({ ...content, wordBank: [...wordBank, w] });
    setDistractor("");
  };
  const removeFromBank = (w) => {
    // Don't remove if it's a correct answer for a slot
    if (Object.values(slots).includes(w)) return;
    onChange({ ...content, wordBank: wordBank.filter(x => x !== w) });
  };

  // Parse text into segments for preview
  const segments = [];
  let remaining = text, segIdx = 0;
  const slotPattern = /\{(slot_\d+)\}/g;
  let match, lastIdx = 0;
  slotPattern.lastIndex = 0;
  while ((match = slotPattern.exec(text)) !== null) {
    if (match.index > lastIdx) segments.push({ type:"text", val: text.slice(lastIdx, match.index) });
    segments.push({ type:"slot", name: match[1], answer: slots[match[1]] || "?" });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) segments.push({ type:"text", val: text.slice(lastIdx) });

  const lbl = { fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", display:"block", marginBottom:6 };
  const chip = (color) => ({ display:"inline-flex", alignItems:"center", gap:5, background:color+"18", color, border:`1px solid ${color}33`, borderRadius:7, padding:"3px 10px", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", margin:"3px" });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Step 1 — text */}
      <div>
        <label style={lbl}>① Введи текст, выдели слово, нажми «+ Слот»</label>
        <div style={{ display:"flex", gap:8 }}>
          <textarea ref={textareaRef} rows={3} value={text}
            onChange={e => onChange({ ...content, text: e.target.value })}
            onMouseUp={() => { const ta = textareaRef.current; setSelWord(ta ? text.slice(ta.selectionStart, ta.selectionEnd).trim() : ""); }}
            onKeyUp={() => { const ta = textareaRef.current; setSelWord(ta ? text.slice(ta.selectionStart, ta.selectionEnd).trim() : ""); }}
            placeholder="The sun ___ in the east every morning."
            style={{ flex:1, background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:10, padding:"9px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", resize:"vertical" }} />
          <button onClick={addSlot} disabled={!selWord}
            style={{ alignSelf:"flex-start", padding:"9px 16px", borderRadius:10, border:"none",
              background: selWord ? "#f472b622" : C.dim, color: selWord ? "#f472b6" : C.muted,
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor: selWord ? "pointer" : "not-allowed",
              whiteSpace:"nowrap", transition:"all .15s" }}>
            + Слот{selWord ? `: «${selWord}»` : ""}
          </button>
        </div>
      </div>

      {/* Step 2 — slots preview */}
      {Object.keys(slots).length > 0 && (
        <div>
          <label style={lbl}>② Слоты (нажми × чтобы убрать)</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {Object.entries(slots).map(([name, answer]) => (
              <span key={name} style={chip("#f472b6")}>
                {"{"+name+"}"} = <b>{answer}</b>
                <span onClick={() => removeSlot(name)} style={{ cursor:"pointer", opacity:.7, fontSize:14 }}>×</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — preview */}
      {text && (
        <div>
          <label style={lbl}>③ Превью вопроса</label>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", fontSize:14, color:C.text, fontFamily:"'DM Sans',sans-serif", lineHeight:1.8 }}>
            {segments.map((seg, i) =>
              seg.type === "text"
                ? <span key={i}>{seg.val}</span>
                : <span key={i} style={{ display:"inline-block", minWidth:70, background:"#f472b618", color:"#f472b6", border:"1.5px dashed #f472b688", borderRadius:6, padding:"1px 12px", margin:"0 3px", textAlign:"center", fontSize:13 }}>___</span>
            )}
          </div>
        </div>
      )}

      {/* Step 4 — word bank */}
      <div>
        <label style={lbl}>④ Word bank (правильные добавляются автоматически, добавь дистракторы)</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8, minHeight:32 }}>
          {wordBank.map(w => {
            const isCorrect = Object.values(slots).includes(w);
            return (
              <span key={w} style={chip(isCorrect ? "#4ade80" : "#94a3b8")}>
                {w}
                {!isCorrect && <span onClick={() => removeFromBank(w)} style={{ cursor:"pointer", opacity:.7, fontSize:14 }}>×</span>}
              </span>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={distractor} onChange={e => setDistractor(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addDistractor()}
            placeholder="Добавить слово-дистрактор…"
            style={{ flex:1, background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:9, padding:"7px 12px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }} />
          <button onClick={addDistractor}
            style={{ padding:"7px 14px", borderRadius:9, border:"none", background:"#94a3b822", color:"#94a3b8", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            + Добавить
          </button>
        </div>
      </div>

    </div>
  );
}

function SpeakingEditor({ content, onChange }) {
  const set = (k,v) => onChange({ ...content, [k]: v });
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
      <Input label="Prep seconds" type="number" value={content.prepSeconds??30}   onChange={v=>set("prepSeconds",+v)} />
      <Input label="Record seconds" type="number" value={content.recordSeconds??60} onChange={v=>set("recordSeconds",+v)} />
      <Input label="Max attempts" type="number" value={content.maxAttempts??1}   onChange={v=>set("maxAttempts",+v)} />
    </div>
  );
}

function WritingEditor({ content, onChange }) {
  const set = (k,v) => onChange({ ...content, [k]: v });
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Input label="Min words" type="number" value={content.minWords??150} onChange={v=>set("minWords",+v)} />
      <Input label="Max words" type="number" value={content.maxWords??300} onChange={v=>set("maxWords",+v)} />
    </div>
  );
}


// ── DragTableEditor ───────────────────────────────────────────────────────────
// content: { columns:[{id,title}], items:[{id,text}], correct:{itemId:colId} }
function DragTableEditor({ content, onChange }) {
  const c = content || {};
  const columns = c.columns || [];
  const items   = c.items   || [];
  const correct = c.correct || {};

  const uid = () => "id_" + Math.random().toString(36).slice(2,7);

  const upd = (patch) => onChange({ ...c, columns, items, correct, ...patch });

  // ── Columns ──
  const addCol = () => {
    const id = uid();
    upd({ columns: [...columns, { id, title: "Group " + String.fromCharCode(65 + columns.length) }] });
  };
  const renameCol = (id, title) => upd({ columns: columns.map(col => col.id === id ? { ...col, title } : col) });
  const deleteCol = (id) => {
    const newCorrect = Object.fromEntries(Object.entries(correct).filter(([,v]) => v !== id));
    upd({ columns: columns.filter(c => c.id !== id), correct: newCorrect });
  };

  // ── Items ──
  const addItem = () => upd({ items: [...items, { id: uid(), text: "" }] });
  const updateItem = (id, text) => upd({ items: items.map(it => it.id === id ? { ...it, text } : it) });
  const deleteItem = (id) => {
    const { [id]: _, ...newCorrect } = correct;
    upd({ items: items.filter(it => it.id !== id), correct: newCorrect });
  };

  // ── Assign ──
  const assign = (itemId, colId) => {
    upd({ correct: colId ? { ...correct, [itemId]: colId } : Object.fromEntries(Object.entries(correct).filter(([k]) => k !== itemId)) });
  };

  const S = {
    label: { fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", marginBottom:6, display:"block" },
    row:   { display:"flex", alignItems:"center", gap:8, marginBottom:6 },
    inp:   { flex:1, background:C.bg, border:`1.5px solid ${C.border2}`, borderRadius:8, padding:"7px 10px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" },
    btn:   { background:"transparent", border:`1px dashed ${C.border2}`, borderRadius:8, padding:"6px 14px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" },
    del:   { background:"transparent", border:"none", color:"#f87171", cursor:"pointer", fontSize:15, padding:"0 4px", flexShrink:0 },
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* Columns */}
      <div>
        <span style={S.label}>Columns (groups)</span>
        {columns.map(col => (
          <div key={col.id} style={S.row}>
            <div style={{ width:12, height:12, borderRadius:3, background:C.gold+"66", flexShrink:0 }} />
            <input value={col.title} onChange={e => renameCol(col.id, e.target.value)}
              placeholder="Column title…"
              style={S.inp} />
            <button onClick={() => deleteCol(col.id)} style={S.del}>✕</button>
          </div>
        ))}
        <button onClick={addCol} style={S.btn}>+ Add column</button>
      </div>

      {/* Items + assignment */}
      <div>
        <span style={S.label}>Items — drag targets</span>
        {columns.length === 0 && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginBottom:8 }}>
            ⚠ Add at least one column first
          </div>
        )}
        {items.map((it, idx) => (
          <div key={it.id} style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:8, marginBottom:6, alignItems:"center",
            background:C.panel, border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 12px" }}>
            <input value={it.text} onChange={e => updateItem(it.id, e.target.value)}
              placeholder={`Item ${idx + 1} text…`} style={{ ...S.inp, flex:"unset" }} />
            <select value={correct[it.id] || ""}
              onChange={e => assign(it.id, e.target.value)}
              style={{ background:C.bg, border:`1.5px solid ${correct[it.id] ? C.gold+"88" : C.border2}`,
                borderRadius:7, padding:"6px 10px", color: correct[it.id] ? C.gold : C.muted,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" }}>
              <option value="">— assign to column —</option>
              {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
            </select>
            <button onClick={() => deleteItem(it.id)} style={S.del}>✕</button>
          </div>
        ))}
        <button onClick={addItem} style={S.btn}>+ Add item</button>
      </div>

      {/* Preview matrix */}
      {columns.length > 0 && items.length > 0 && (
        <div>
          <span style={S.label}>Answer key preview</span>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${columns.length}, 1fr)`, gap:8 }}>
            {columns.map(col => (
              <div key={col.id} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 12px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.gold, fontWeight:600, marginBottom:8 }}>{col.title}</div>
                {items.filter(it => correct[it.id] === col.id).map(it => (
                  <div key={it.id} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text,
                    background:C.bg, borderRadius:6, padding:"5px 9px", marginBottom:4 }}>{it.text || "(empty)"}</div>
                ))}
                {items.filter(it => correct[it.id] === col.id).length === 0 && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, fontStyle:"italic" }}>no items</div>
                )}
              </div>
            ))}
          </div>
          {items.filter(it => !correct[it.id]).length > 0 && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#f59e0b", marginTop:6 }}>
              ⚠ Unassigned: {items.filter(it => !correct[it.id]).map(it => it.text || "(empty)").join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── DragImageEditor ────────────────────────────────────────────────────────────
// content: { labels:[{id,text}], hotspots:[{id,x,y,correct:labelId}] }
// image comes from q.media (handled by MediaEditor above)
function DragImageEditor({ content, onChange, media = [] }) {
  const c = content || {};
  const labels   = c.labels   || [];
  const hotspots = c.hotspots || [];

  const uid = () => "id_" + Math.random().toString(36).slice(2,7);
  const upd = (patch) => onChange({ ...c, labels, hotspots, ...patch });

  const imgUrl = (media || []).find(m => m.type === "image")?.url;

  // Which hotspot is selected for editing
  const [selHs, setSelHs] = useState(null);
  const draggingHs = useRef(null); // { id, startX, startY } during mouse drag

  const imgRef = useRef(null);

  // Click on blank image area → add new hotspot
  const handleImgClick = (e) => {
    if (draggingHs.current) return; // was a drag, not a click
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width)  * 100);
    const y = Math.round(((e.clientY - rect.top)  / rect.height) * 100);
    const id = uid();
    upd({ hotspots: [...hotspots, { id, x, y, correct: labels[0]?.id || "" }] });
    setSelHs(id);
  };

  // Drag existing hotspot to reposition it
  const startHsDrag = (e, hsId) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = imgRef.current.getBoundingClientRect();
    draggingHs.current = { id: hsId, rect };

    const onMove = (mv) => {
      const r = draggingHs.current?.rect;
      if (!r) return;
      const x = Math.min(100, Math.max(0, Math.round(((mv.clientX - r.left) / r.width)  * 100)));
      const y = Math.min(100, Math.max(0, Math.round(((mv.clientY - r.top)  / r.height) * 100)));
      upd({ hotspots: hotspots.map(h => h.id === hsId ? { ...h, x, y } : h) });
    };
    const onUp = () => {
      setTimeout(() => { draggingHs.current = null; }, 50);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  const updateHs = (id, patch) => upd({ hotspots: hotspots.map(h => h.id === id ? { ...h, ...patch } : h) });
  const deleteHs = (id) => { upd({ hotspots: hotspots.filter(h => h.id !== id) }); if (selHs === id) setSelHs(null); };

  const addLabel = () => upd({ labels: [...labels, { id: uid(), text: "" }] });
  const updateLabel = (id, text) => upd({ labels: labels.map(l => l.id === id ? { ...l, text } : l) });
  const deleteLabel = (id) => {
    upd({
      labels: labels.filter(l => l.id !== id),
      hotspots: hotspots.map(h => h.correct === id ? { ...h, correct: "" } : h),
    });
  };

  const S = {
    label: { fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", marginBottom:6, display:"block" },
    row:   { display:"flex", alignItems:"center", gap:8, marginBottom:6 },
    inp:   { flex:1, background:C.bg, border:`1.5px solid ${C.border2}`, borderRadius:8, padding:"7px 10px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" },
    btn:   { background:"transparent", border:`1px dashed ${C.border2}`, borderRadius:8, padding:"6px 14px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" },
    del:   { background:"transparent", border:"none", color:"#f87171", cursor:"pointer", fontSize:15, padding:"0 4px", flexShrink:0 },
  };

  // Hotspot colors by index
  const HS_COLORS = ["#f59e0b","#60a5fa","#4ade80","#f87171","#a78bfa","#34d399","#fb923c","#e879f9"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* Labels bank */}
      <div>
        <span style={S.label}>Labels (drag targets student will see)</span>
        {labels.map((lbl, idx) => (
          <div key={lbl.id} style={S.row}>
            <div style={{ width:12, height:12, borderRadius:3, background:HS_COLORS[idx % HS_COLORS.length], flexShrink:0 }} />
            <input value={lbl.text} onChange={e => updateLabel(lbl.id, e.target.value)}
              placeholder={`Label ${idx + 1}…`} style={S.inp} />
            <button onClick={() => deleteLabel(lbl.id)} style={S.del}>✕</button>
          </div>
        ))}
        <button onClick={addLabel} style={S.btn}>+ Add label</button>
      </div>

      {/* Image + hotspot placement */}
      <div>
        <span style={S.label}>
          Image hotspots
          {imgUrl && <span style={{ color:C.muted, fontWeight:400, textTransform:"none", marginLeft:8 }}>— click to add · drag dot to reposition</span>}
        </span>

        {!imgUrl ? (
          <div style={{ background:C.panel, border:`1px dashed ${C.border2}`, borderRadius:12, padding:"32px", textAlign:"center",
            fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted }}>
            📎 Add an image in the <strong style={{ color:C.text }}>Media</strong> section above, then click here to place hotspots
          </div>
        ) : (
          <div style={{ position:"relative", display:"inline-block", width:"100%", cursor:"crosshair" }}>
            <img ref={imgRef} src={imgUrl} alt="" onClick={handleImgClick}
              style={{ width:"100%", display:"block", borderRadius:10, userSelect:"none" }} />
            {hotspots.map((hs, idx) => {
              const lbl = labels.find(l => l.id === hs.correct);
              const col = HS_COLORS[labels.findIndex(l => l.id === hs.correct) % HS_COLORS.length] || C.gold;
              const isSel = selHs === hs.id;
              return (
                <div key={hs.id}
                  onMouseDown={e => startHsDrag(e, hs.id)}
                  onClick={e => { e.stopPropagation(); if (!draggingHs.current) setSelHs(isSel ? null : hs.id); }}
                  title="Drag to reposition · Click to select"
                  style={{
                    position:"absolute",
                    left: `calc(${hs.x}% - 14px)`,
                    top:  `calc(${hs.y}% - 14px)`,
                    width:28, height:28, borderRadius:"50%",
                    background: col + "cc",
                    border: `2px solid ${isSel ? "white" : col}`,
                    cursor:"grab",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:700, color:"white",
                    boxShadow: isSel ? `0 0 0 3px ${col}66` : "0 2px 6px #00000055",
                    transition:"box-shadow .15s, border .15s", zIndex:2,
                    userSelect:"none",
                  }}>
                  {idx + 1}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hotspot assignment list */}
      {hotspots.length > 0 && (
        <div>
          <span style={S.label}>Hotspot → label assignment</span>
          {hotspots.map((hs, idx) => {
            const col = HS_COLORS[labels.findIndex(l => l.id === hs.correct) % HS_COLORS.length] || C.muted;
            return (
              <div key={hs.id}
                onClick={() => setSelHs(selHs === hs.id ? null : hs.id)}
                style={{ display:"grid", gridTemplateColumns:"28px 80px 1fr auto", gap:8, alignItems:"center",
                  marginBottom:6, padding:"9px 12px",
                  background: selHs === hs.id ? C.card : C.panel,
                  border:`1px solid ${selHs === hs.id ? C.gold+"66" : C.border}`,
                  borderRadius:9, cursor:"pointer" }}>
                {/* circle badge */}
                <div style={{ width:22, height:22, borderRadius:"50%", background:col+"cc",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700, color:"white" }}>{idx + 1}</div>
                {/* position */}
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>
                  x:{hs.x}% y:{hs.y}%
                </span>
                {/* label select */}
                <select value={hs.correct || ""} onChange={e => { e.stopPropagation(); updateHs(hs.id, { correct: e.target.value }); }}
                  onClick={e => e.stopPropagation()}
                  style={{ background:C.bg, border:`1.5px solid ${hs.correct ? col+"88" : C.border2}`,
                    borderRadius:7, padding:"5px 10px", color: hs.correct ? col : C.muted,
                    fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" }}>
                  <option value="">— assign label —</option>
                  {labels.map(l => <option key={l.id} value={l.id}>{l.text || "(empty)"}</option>)}
                </select>
                <button onClick={e => { e.stopPropagation(); deleteHs(hs.id); }} style={S.del}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Validation hint */}
      {labels.length > 0 && hotspots.length > 0 && (
        (() => {
          const unassigned = hotspots.filter(h => !h.correct).length;
          const unusedLabels = labels.filter(l => !hotspots.some(h => h.correct === l.id));
          return (unassigned > 0 || unusedLabels.length > 0) ? (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#f59e0b" }}>
              {unassigned > 0 && <div>⚠ {unassigned} hotspot(s) not assigned to a label</div>}
              {unusedLabels.length > 0 && <div>⚠ Unused label(s): {unusedLabels.map(l => l.text || "(empty)").join(", ")}</div>}
            </div>
          ) : (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.success }}>
              ✓ All hotspots assigned — {hotspots.length} hotspot(s), {labels.length} label(s)
            </div>
          );
        })()
      )}

      {imgUrl && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>
          💡 Click the image to add hotspot · Click a numbered dot to select · Use the list to assign labels · ✕ to delete
        </div>
      )}
    </div>
  );
}


function ImageClickEditor({ content, onChange, media = [] }) {
  const uid = () => "ic_" + Math.random().toString(36).slice(2,7);
  const hotspots = content.hotspots || [];
  const imgUrl   = media.find(m => m.type === "image")?.url;
  const imgRef   = useRef(null);

  // Drawing state
  const drawing  = useRef(null); // { startX, startY } in %
  const [dragBox, setDragBox] = useState(null); // live preview rect

  const upd = (patch) => onChange({ ...content, ...patch });
  const updHs = (id, patch) => upd({ hotspots: hotspots.map(h => h.id === id ? { ...h, ...patch } : h) });
  const delHs = (id) => upd({ hotspots: hotspots.filter(h => h.id !== id) });

  const toPercent = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width)  * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - rect.top)  / rect.height) * 100)),
    };
  };

  const onMouseDown = (e) => {
    if (!imgRef.current) return;
    e.preventDefault();
    const { x, y } = toPercent(e);
    drawing.current = { startX: x, startY: y };
    setDragBox({ x, y, w: 0, h: 0 });

    const onMove = (mv) => {
      if (!drawing.current) return;
      const p = toPercent(mv);
      const sx = drawing.current.startX, sy = drawing.current.startY;
      setDragBox({
        x: Math.min(sx, p.x), y: Math.min(sy, p.y),
        w: Math.abs(p.x - sx), h: Math.abs(p.y - sy),
      });
    };
    const onUp = (mv) => {
      if (!drawing.current) return;
      const p = toPercent(mv);
      const sx = drawing.current.startX, sy = drawing.current.startY;
      const w = Math.abs(p.x - sx), h = Math.abs(p.y - sy);
      drawing.current = null;
      setDragBox(null);
      if (w < 2 || h < 2) return; // ignore tiny clicks
      const id = uid();
      upd({ hotspots: [...hotspots, {
        id, x: Math.min(sx, p.x), y: Math.min(sy, p.y), width: w, height: h, correct: true,
      }]});
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  const HS_COLORS = ["#4ade80","#60a5fa","#f59e0b","#f87171","#a78bfa","#34d399"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {!imgUrl ? (
        <div style={{ background:C.panel, border:`1px dashed ${C.border2}`, borderRadius:12,
          padding:"32px", textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted }}>
          📎 Add an image in the <strong style={{ color:C.text }}>Media</strong> section above, then draw answer zones here
        </div>
      ) : (
        <>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>
            🖱 <strong style={{ color:C.text }}>Drag</strong> on the image to draw a correct-answer zone · Click a zone to delete it
          </div>

          <div style={{ position:"relative", display:"inline-block", width:"100%",
            cursor:"crosshair", userSelect:"none" }}
            onMouseDown={onMouseDown}>
            <img ref={imgRef} src={imgUrl} alt="" style={{ width:"100%", display:"block", borderRadius:10 }} />

            {/* Existing hotspots */}
            {hotspots.map((hs, idx) => (
              <div key={hs.id}
                onClick={e => { e.stopPropagation(); delHs(hs.id); }}
                title="Click to delete"
                style={{
                  position:"absolute",
                  left:  hs.x + "%", top:   hs.y + "%",
                  width: (hs.width  ?? 10) + "%",
                  height:(hs.height ?? 10) + "%",
                  background: (HS_COLORS[idx % HS_COLORS.length]) + "33",
                  border:`2px solid ${HS_COLORS[idx % HS_COLORS.length]}`,
                  borderRadius:6, cursor:"pointer", boxSizing:"border-box",
                  display:"flex", alignItems:"flex-start", justifyContent:"flex-end",
                }}>
                <span style={{ background:HS_COLORS[idx % HS_COLORS.length], color:"#fff",
                  fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700,
                  padding:"1px 5px", borderRadius:"0 4px 0 4px", lineHeight:1.6 }}>
                  {idx + 1} ✕
                </span>
              </div>
            ))}

            {/* Live drag preview */}
            {dragBox && dragBox.w > 0 && (
              <div style={{
                position:"absolute", pointerEvents:"none",
                left:  dragBox.x + "%", top:   dragBox.y + "%",
                width: dragBox.w + "%", height:dragBox.h + "%",
                background:"#4ade8022", border:"2px dashed #4ade80",
                borderRadius:6, boxSizing:"border-box",
              }} />
            )}
          </div>

          {/* Zone list */}
          {hotspots.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted,
                letterSpacing:.5, textTransform:"uppercase" }}>Answer zones</div>
              {hotspots.map((hs, idx) => (
                <div key={hs.id} style={{ display:"grid", gridTemplateColumns:"24px 1fr 1fr auto", gap:8,
                  alignItems:"center", background:C.panel, border:`1px solid ${C.border2}`,
                  borderRadius:8, padding:"8px 12px" }}>
                  <div style={{ width:14, height:14, borderRadius:3,
                    background:HS_COLORS[idx % HS_COLORS.length] }} />
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>
                    Zone {idx + 1} — {Math.round(hs.x)}%,{Math.round(hs.y)}%
                    &nbsp;({Math.round(hs.width ?? 10)}×{Math.round(hs.height ?? 10)}%)
                  </span>
                  <select value={hs.correct ? "correct" : "incorrect"}
                    onChange={e => updHs(hs.id, { correct: e.target.value === "correct" })}
                    style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:6,
                      padding:"4px 8px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                    <option value="correct">✓ Correct</option>
                    <option value="incorrect">✗ Incorrect / distractor</option>
                  </select>
                  <button onClick={() => delHs(hs.id)}
                    style={{ background:"transparent", border:"none", color:"#f87171", cursor:"pointer", fontSize:15 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {hotspots.length === 0 && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted,
              textAlign:"center", padding:"8px" }}>
              No zones yet — drag on the image above to add the correct answer area
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JsonEditor({ label, value, onChange }) {
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2));
  const [err, setErr] = useState("");
  const apply = (v) => { setRaw(v); try { onChange(JSON.parse(v)); setErr(""); } catch(e) { setErr(e.message); } };
  return (
    <div>
      <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", display:"block", marginBottom:5 }}>{label}</label>
      <textarea value={raw} onChange={e => apply(e.target.value)} rows={5}
        style={{ width:"100%", boxSizing:"border-box", background:C.panel, border:`1.5px solid ${err?C.danger:C.border2}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"monospace", fontSize:12, outline:"none", resize:"vertical" }} />
      {err && <div style={{ color:C.danger, fontSize:11, marginTop:4 }}>⚠ {err}</div>}
    </div>
  );
}

// ── QuestionForm ──────────────────────────────────────────────────────────────
function QuestionForm({ initial, onSave, onCancel, sections = [] }) {
  const [q, setQ] = useState(() => {
    const base = initial ? fromApi(initial) : blankQ();
    // Set section to first available if blank
    if (!base.section && sections.length) base.section = sections[0];
    return base;
  });
  const setF = (k, v) => setQ(p => ({ ...p, [k]: v }));
  const ti = ntypeInfo(q.type);
  const [submitted, setSubmitted] = useState(false);

  // When sections load async, set default section if still empty
  useEffect(() => {
    if (!q.section && sections.length) setF("section", sections[0]);
  }, [sections]);

  const validate = (q) => {
    const e = {};
    if (!q.prompt?.trim()) e.prompt = "Prompt is required";
    if (!q.section)        e.section = "Section is required";
    if (!q.level)          e.level   = "Level is required";
    if (!(q.points > 0))   e.points  = "Points must be > 0";
    // content checks
    const c = q.content || {};
    if (["SINGLE_CHOICE","MULTIPLE_CHOICE"].includes(q.type)) {
      const opts = c.options || [];
      if (opts.length < 2)                        e.content = "Add at least 2 options";
      else if (opts.some(o => !o?.trim()))         e.content = "All options must have text";
      else if (q.type === "SINGLE_CHOICE" && (c.correct == null || c.correct < 0 || c.correct >= opts.length))
        e.content = "Select a correct answer";
      else if (q.type === "MULTIPLE_CHOICE" && (!Array.isArray(c.correct) || c.correct.length === 0))
        e.content = "Select at least one correct answer";
    }
    if (q.type === "DRAG_AND_DROP_TABLE") {
      if (!c.columns?.length) e.content = "Add at least one column";
      else if (!c.items?.length) e.content = "Add at least one item";
      else if (c.items.some(it => !it.text?.trim())) e.content = "All items must have text";
      else if (c.items.some(it => !c.correct?.[it.id])) e.content = "Assign all items to a column";
    }
    if (q.type === "DRAG_AND_DROP_IMAGE") {
      if (!c.labels?.length)   e.content = "Add at least one label";
      if (!c.hotspots?.length) e.content = "Click the image to add at least one hotspot";
      else if (c.hotspots.some(h => !h.correct)) e.content = "Assign all hotspots to a label";
    }
    if (q.type === "DRAG_TO_TEXT" || q.type === "FILL_IN_THE_BLANKS") {
      // slots is an object { slot_name: answer } — check it has at least one key
      const slotCount = c.slots && typeof c.slots === "object" && !Array.isArray(c.slots)
        ? Object.keys(c.slots).length
        : 0;
      if (!slotCount) e.content = "Add at least one blank slot using the editor above";
    }
    return e;
  };

  const errors = submitted ? validate(q) : {};
  const isValid = Object.keys(validate(q)).length === 0;

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid) return;
    onSave(toApi(q));
  };

  const changeType = (type) => setQ(p => ({
    ...p, type,
    content: blankContent(type),
    media: ntypeInfo(type).hasMedia ? p.media : [],
  }));

  const contentEditor = () => {
    switch (q.type) {
      case "SINGLE_CHOICE":    return <ChoiceEditor content={q.content} multi={false} onChange={v => setF("content", v)} />;
      case "MULTIPLE_CHOICE":  return <ChoiceEditor content={q.content} multi={true}  onChange={v => setF("content", v)} />;
      case "FILL_IN_THE_BLANKS": return <FillBlanksEditor content={q.content} onChange={v => setF("content", v)} />;
      case "DRAG_TO_TEXT":     return <DragToTextEditor content={q.content} onChange={v => setF("content", v)} />;
      case "SPEAKING_INDEPENDENT":
      case "SPEAKING_INTEGRATED": return <SpeakingEditor content={q.content} onChange={v => setF("content", v)} />;
      case "WRITING_INDEPENDENT":
      case "WRITING_INTEGRATED":  return <WritingEditor content={q.content} onChange={v => setF("content", v)} />;
      case "DRAG_AND_DROP_TABLE":
        return <DragTableEditor content={q.content} onChange={v => setF("content", v)} />;
      case "DRAG_AND_DROP_IMAGE":
        return <DragImageEditor content={q.content} onChange={v => setF("content", v)} media={q.media} />;
      case "IMAGE_CLICK":
        return <ImageClickEditor content={q.content} onChange={v => setF("content", v)} media={q.media} />;
      default:
        return <JsonEditor label="content (JSON)" value={q.content} onChange={v => setF("content", v)} />;
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Type selector */}
      <div>
        <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", display:"block", marginBottom:10 }}>Question type</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
          {NEW_TYPES.map(t => (
            <button key={t.id} onClick={() => changeType(t.id)} style={{ background: q.type===t.id ? t.color+"20":"transparent", border:`1.5px solid ${q.type===t.id?t.color:C.border}`, borderRadius:10, padding:"7px 13px", color:q.type===t.id?t.color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, cursor:"pointer", transition:"all .15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Level / Section / Points / Status */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px 110px", gap:14 }}>
        <div>
          <Select label="Level"   value={q.level}   onChange={v=>setF("level",v)}   options={LEVELS} />
          {errors.level   && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.danger, marginTop:3 }}>⚠ {errors.level}</div>}
        </div>
        <div>
          <Select label="Section" value={q.section} onChange={v=>setF("section",v)} options={sections} />
          {errors.section && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.danger, marginTop:3 }}>⚠ {errors.section}</div>}
        </div>
        <div>
          <Input  label="Points"  value={q.points}  onChange={v=>setF("points",+v)} type="number" />
          {errors.points  && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.danger, marginTop:3 }}>⚠ {errors.points}</div>}
        </div>
        <Select label="Status"  value={q.status}  onChange={v=>setF("status",v)}
          options={[{value:"draft",label:"Draft"},{value:"published",label:"Published"}]} />
      </div>

      {/* Context text (reading passage / instructions) */}
      <Textarea label="Context text (optional — passage, instructions shown above prompt)"
        value={q.contextText} onChange={v=>setF("contextText",v)}
        placeholder="Reading passage, quote, scenario description…" rows={3} />

      {/* Prompt */}
      <div>
        <Textarea label="Prompt / Task instruction *"
          value={q.prompt} onChange={v=>setF("prompt",v)}
          placeholder="Write the task instruction in Armenian…" rows={2} />
        {errors.prompt && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.danger, marginTop:4 }}>⚠ {errors.prompt}</div>}
      </div>

      {/* Media */}
      <MediaEditor media={q.media} onChange={v=>setF("media",v)} />

      {/* Content editor — type-specific */}
      <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", marginBottom:14 }}>
          {ti.icon} {ti.label} — answer configuration
        </div>
        {contentEditor()}
      </div>

      {/* Content error */}
      {errors.content && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.danger,
          background:C.danger+"12", border:`1px solid ${C.danger}33`, borderRadius:8, padding:"8px 14px" }}>
          ⚠ {errors.content}
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", alignItems:"center", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
        {submitted && !isValid && (
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.danger, marginRight:"auto" }}>
            Fix the errors above to continue
          </span>
        )}
        <button onClick={onCancel} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 22px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:14, cursor:"pointer" }}>Cancel</button>
        <button onClick={handleSave}
          style={{ background: isValid ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.border2,
            border:"none", borderRadius:10, padding:"10px 28px", color: isValid ? "white" : C.muted,
            fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600,
            cursor: isValid ? "pointer" : "not-allowed",
            boxShadow: isValid ? `0 4px 16px ${C.gold}44` : "none",
            transition:"all .2s" }}>
          {q.id ? "✓ Save changes" : "✓ Create question"}
        </button>
      </div>
    </div>
  );
}

// ── QRow (list row) ───────────────────────────────────────────────────────────
function QRow({ q, onEdit, onDelete, onToggleStatus, onView }) {
  const [rowPreview, setRowPreview] = useState(false);
  const ti = ntypeInfo(q.type);
  const lc = LEVEL_COLORS[q.level] || "#94a3b8";
  const hasAudio = (q.media||[]).some(m => m.type === "audio");
  const hasVideo = (q.media||[]).some(m => m.type === "video");
  const hasImage = (q.media||[]).some(m => m.type === "image");

  return (
    <>
      {rowPreview && <StudentPreview q={q} onClose={() => setRowPreview(false)} />}
      <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 90px 70px 90px 90px 160px", alignItems:"center", gap:14, padding:"13px 20px", borderBottom:`1px solid ${C.border}`, transition:"background .15s" }}
        onMouseEnter={e=>e.currentTarget.style.background=C.card}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, fontWeight:500 }}>#{q.id}</span>

        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {q.prompt || "(no prompt)"}
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:12 }}>{ti.icon}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:ti.color }}>{ti.label}</span>
            <span style={{ color:C.border }}>·</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{q.section}</span>
            {hasAudio && <span title="has audio" style={{ fontSize:11 }}>🎧</span>}
            {hasVideo && <span title="has video" style={{ fontSize:11 }}>🎬</span>}
            {hasImage && <span title="has image" style={{ fontSize:11 }}>🖼</span>}
          </div>
        </div>

        <span style={{ display:"inline-block", width:"fit-content", background:lc+"18", color:lc, border:`1px solid ${lc}33`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", textAlign:"center" }}>{q.level}</span>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.gold, fontWeight:600, textAlign:"center" }}>{q.points}pt</span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, textAlign:"center" }}>
          {q.updatedAt ? new Date(q.updatedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"}) : "—"}
        </span>

        <button onClick={()=>onToggleStatus(q.id)} style={{ display:"inline-block", width:"fit-content", background:q.status==="published"?C.success+"18":"#f59e0b18", border:`1px solid ${q.status==="published"?C.success+"44":"#f59e0b44"}`, borderRadius:6, padding:"4px 10px", color:q.status==="published"?C.success:"#f59e0b", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer" }}>
          {q.status==="published"?"● Published":"○ Draft"}
        </button>

        <div style={{ display:"flex", gap:5, justifyContent:"flex-end" }}>
          <button onClick={()=>setRowPreview(true)} title="Student preview" style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:7, padding:"5px 10px", color:"#60a5fa", fontSize:13, cursor:"pointer" }}>🎓</button>
          <button onClick={()=>onView(q)}   title="View"   style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:7, padding:"5px 10px", color:C.info||"#60a5fa", fontSize:13, cursor:"pointer" }}>👁</button>
          <button onClick={()=>onEdit(q)}   title="Edit"   style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:7, padding:"5px 10px", color:C.muted, fontSize:13, cursor:"pointer" }}>✎</button>
          <button onClick={()=>onDelete(q.id)} title="Delete" style={{ background:"transparent", border:`1px solid #f8717130`, borderRadius:7, padding:"5px 10px", color:"#f87171", fontSize:13, cursor:"pointer" }}>✕</button>
        </div>
      </div>
    </>
  );
}

// ── ViewQuestion ──────────────────────────────────────────────────────────────
function ViewQuestion({ q, onEdit, onClose }) {
  const [preview, setPreview] = useState(false);
  const ti = ntypeInfo(q.type);
  const lc = LEVEL_COLORS[q.level] || "#94a3b8";
  const media = Array.isArray(q.media) ? q.media : [];
  const c = q.content || {};

  const renderContent = () => {
    if (["SINGLE_CHOICE","MULTIPLE_CHOICE"].includes(q.type) && c.options) {
      const correct = c.correct;
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {c.options.map((opt, i) => {
            const ok = Array.isArray(correct) ? correct.includes(i) : correct === i;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", background:ok?C.success+"0d":C.panel, border:`1.5px solid ${ok?C.success+"55":C.border}`, borderRadius:10 }}>
                <div style={{ width:20, height:20, borderRadius:Array.isArray(correct)?"4px":"50%", border:`2px solid ${ok?C.success:C.border2}`, background:ok?C.success:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {ok && <svg width={11} height={11} viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} strokeLinecap="round" fill="none"/></svg>}
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:ok?C.success:C.text, fontWeight:ok?600:400 }}>{opt}</span>
                {ok && <span style={{ marginLeft:"auto", fontSize:11, color:C.success, fontWeight:700 }}>✓</span>}
              </div>
            );
          })}
        </div>
      );
    }
    if (q.type === "FILL_IN_THE_BLANKS" && c.segments) {
      return (
        <div style={{ background:C.panel, borderRadius:10, padding:"14px 18px", fontFamily:"'Cormorant Garamond',serif", fontSize:18, lineHeight:2, color:C.text }}>
          {c.segments.map((s,i) => s.type==="blank"
            ? <mark key={i} style={{ background:C.gold+"22", color:C.gold, borderRadius:5, padding:"2px 8px", margin:"0 2px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700 }}>{s.answer}</mark>
            : <span key={i}>{s.value}</span>)}
        </div>
      );
    }
    if (q.type === "DRAG_TO_TEXT") return (
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ background:C.panel, borderRadius:10, padding:"12px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text }}>{c.text}</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {(c.wordBank||[]).map((w,i) => <span key={i} style={{ background:C.info+"18", color:C.info, border:`1px solid ${C.info}33`, borderRadius:7, padding:"4px 12px", fontSize:12, fontWeight:500 }}>{w}</span>)}
        </div>
        <div style={{ fontSize:12, color:C.muted }}>Correct: {JSON.stringify(c.slots)}</div>
      </div>
    );
    if (["SPEAKING_INDEPENDENT","SPEAKING_INTEGRATED"].includes(q.type)) return (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        {[["Prep",c.prepSeconds+"s"],["Record",c.recordSeconds+"s"],["Max attempts",c.maxAttempts]].map(([l,v])=>(
          <div key={l} style={{ background:C.panel, borderRadius:10, padding:"12px", textAlign:"center" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:C.gold, fontWeight:700 }}>{v}</div>
          </div>
        ))}
      </div>
    );
    if (["WRITING_INDEPENDENT","WRITING_INTEGRATED"].includes(q.type)) return (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[["Min words",c.minWords],["Max words",c.maxWords]].map(([l,v])=>(
          <div key={l} style={{ background:C.panel, borderRadius:10, padding:"12px", textAlign:"center" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:C.gold, fontWeight:700 }}>{v}</div>
          </div>
        ))}
      </div>
    );
    return <pre style={{ background:C.panel, borderRadius:10, padding:"12px 16px", fontSize:11, color:C.muted, overflow:"auto", maxHeight:200 }}>{JSON.stringify(c, null, 2)}</pre>;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ background:lc+"18", color:lc, border:`1px solid ${lc}33`, borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{q.level}</span>
        <span style={{ background:ti.color+"18", color:ti.color, border:`1px solid ${ti.color}33`, borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{ti.icon} {ti.label}</span>
        <span style={{ background:C.dim, color:C.muted, borderRadius:6, padding:"3px 10px", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{q.section}</span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.gold, marginLeft:4 }}>{q.points}pt</span>
        <span style={{ background:q.status==="published"?C.success+"18":"#f59e0b18", color:q.status==="published"?C.success:"#f59e0b", borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", marginLeft:"auto" }}>
          {q.status==="published"?"● Published":"○ Draft"}
        </span>
      </div>

      {q.contextText && (
        <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:8 }}>Context</div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:C.text, lineHeight:1.7, margin:0 }}>{q.contextText}</p>
        </div>
      )}

      <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:8 }}>Prompt</div>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:C.text, lineHeight:1.7, margin:0 }}>{q.prompt || "—"}</p>
      </div>

      {media.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {media.map((m, i) => (
            <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>
                {m.type === "audio" ? "🎧" : m.type === "video" ? "🎬" : "🖼"} {m.type}
                {m.maxPlays && <span style={{ marginLeft:8, color:C.gold }}>{m.maxPlays}× max plays</span>}
              </div>
              {m.type === "audio" && m.url && <audio controls src={m.url} style={{ width:"100%", accentColor:C.gold }} preload="metadata" />}
              {m.type === "video" && m.url && <video controls src={m.url} style={{ width:"100%", borderRadius:8, maxHeight:240 }} preload="metadata" />}
              {m.type === "image" && m.url && <img src={m.url} alt="" style={{ maxWidth:"100%", borderRadius:8 }} />}
              {!m.url && <div style={{ fontSize:12, color:C.muted }}>No URL set</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:12 }}>Answer configuration</div>
        {renderContent()}
      </div>

      {preview && <StudentPreview q={q} onClose={() => setPreview(false)} />}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
        <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 22px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:14, cursor:"pointer" }}>Close</button>
        <button onClick={() => setPreview(true)} style={{ background:"#60a5fa18", border:"1px solid #60a5fa44", borderRadius:10, padding:"10px 22px", color:"#60a5fa", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:"pointer" }}>👁 Student View</button>
        <button onClick={onEdit} style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, border:"none", borderRadius:10, padding:"10px 24px", color:"white", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:`0 4px 14px ${C.gold}44` }}>✎ Edit</button>
      </div>
    </div>
  );
}


// ── Student Preview ───────────────────────────────────────────────────────────
// Renders the question exactly as a student would see it in the terminal UI
// ── Questions Page ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#000000b0", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}
      onMouseDown={e => { if (e.target === e.currentTarget) e.currentTarget._closeOnUp = true; }}
      onMouseUp={e => { if (e.currentTarget._closeOnUp && e.target === e.currentTarget) onClose(); e.currentTarget._closeOnUp = false; }}>
      <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:16,
        width:"100%", maxWidth:820, maxHeight:"90vh", display:"flex", flexDirection:"column",
        boxShadow:"0 24px 80px #000a" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 24px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.text }}>{title}</span>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.border2}`,
            borderRadius:8, width:34, height:34, color:C.muted, fontSize:18, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", padding:"24px", flex:1 }}>{children}</div>
      </div>
    </div>
  );
}

function StatsBar({ questions }) {
  const total = questions.length;
  const byType = NEW_TYPES.map(t => ({ ...t, count: questions.filter(q => q.type === t.id).length }))
    .filter(t => t.count > 0);
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginRight:4 }}>
        {total} question{total!==1?"s":""}
      </span>
      {byType.map(t => (
        <span key={t.id} style={{ display:"inline-block", width:"fit-content",
          background:t.color+"18", color:t.color, border:`1px solid ${t.color}33`,
          borderRadius:7, padding:"3px 10px", fontSize:11, fontWeight:600,
          fontFamily:"'DM Sans',sans-serif" }}>
          {t.icon} {t.label} {t.count}
        </span>
      ))}
    </div>
  );
}

function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "create" | "edit" | "view"
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    Promise.all([api.getQuestions(), api.getSections()]).then(([qs, secs]) => {
      setQuestions(qs);
      setSections(secs.map(s => s.name)); // order preserved from server sortOrder
      setLoading(false);
    });
  }, []);

  const filtered = questions.filter(q => {
    if (filterType!=="all" && q.type!==filterType) return false;
    if (filterLevel!=="all" && q.level!==filterLevel) return false;
    if (filterStatus!=="all" && q.status!==filterStatus) return false;
    if (filterSection!=="all" && q.section!==filterSection) return false;
    if (search && !( (q.prompt||"").toLowerCase().includes(search.toLowerCase()) || String(q.id).includes(search) )) return false;
    return true;
  });

  const handleSave = async (q) => {
    if (modal==="edit") {
      const updated = await api.updateQuestion(q.id, q);
      setQuestions(qs=>qs.map(x=>x.id===updated.id?updated:x));
    } else {
      const newQ = await api.createQuestion(q);
      setQuestions(qs=>[newQ,...qs]);
    }
    setModal(null); setEditing(null);
  };

  const handleDelete = async (id) => {
    await api.deleteQuestion(id);
    setQuestions(qs=>qs.filter(q=>q.id!==id));
    setDeleteConfirm(null);
  };
  const handleToggleStatus = async (id) => {
    const q = questions.find(x=>x.id===id);
    const newStatus = q.status==="published" ? "draft" : "published";
    const updated = await api.updateQuestion(id, { status: newStatus });
    setQuestions(qs=>qs.map(x=>x.id===id?{...x,status:updated.status}:x));
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", boxSizing:"border-box" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:C.text, margin:"0 0 4px", fontWeight:600 }}>Question Management</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, margin:0 }}>Question Management</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 18px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
            ↑ Import JSON
          </button>
          <button onClick={()=>{setEditing(null);setModal("create")}} style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, border:"none", borderRadius:10, padding:"10px 22px", color:"white", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:`0 4px 16px ${C.gold}44`, display:"flex", alignItems:"center", gap:7 }}>
            + New Question
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom:24 }}><StatsBar questions={questions} /></div>

      {/* Filters */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px", marginBottom:20, display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search questions..." style={{ flex:"1 1 200px", background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:9, padding:"8px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }} />
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <Pill label="All" active={filterType==="all"} onClick={()=>setFilterType("all")} />
          {QTYPES.map(t=><Pill key={t.id} label={t.icon+" "+t.label} active={filterType===t.id} onClick={()=>setFilterType(t.id)} color={t.color} />)}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <Pill label="All" active={filterLevel==="all"} onClick={()=>setFilterLevel("all")} />
          {LEVELS.map(l=><Pill key={l} label={l} active={filterLevel===l} onClick={()=>setFilterLevel(l)} color={LEVEL_COLORS[l]} />)}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["all","All"],["published","Published"],["draft","Draft"]].map(([v,label])=>(
            <Pill key={v} label={label} active={filterStatus===v} onClick={()=>setFilterStatus(v)} color={v==="published"?C.success:v==="draft"?"#f59e0b":C.gold} />
          ))}
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <Pill label="All Sections" active={filterSection==="all"} onClick={()=>setFilterSection("all")} />
          {sections.map(s=><Pill key={s} label={s} active={filterSection===s} onClick={()=>setFilterSection(s)} />)}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
        {/* Head */}
        <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 90px 70px 90px 90px 130px", gap:14, padding:"11px 20px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
          {["#","Question","Level","Pts","Plays","Status",""].map((h,i)=>(
            <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, fontWeight:600, letterSpacing:.8, textTransform:"uppercase" }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <div style={{ padding:"48px", textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.muted }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"48px", textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.muted }}>
            No questions found
          </div>
        ) : filtered.map(q=>(
          <QRow key={q.id} q={q}
            onView={q=>{setViewing(q);setModal("view")}}
            onEdit={q=>{setEditing(q);setModal("edit")}}
            onDelete={id=>setDeleteConfirm(id)}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginTop:12, textAlign:"right" }}>
        {filtered.length} / {questions.length} questions
      </div>

      {/* Create/Edit Modal */}
      {(modal==="create"||modal==="edit") && (
        <Modal title={modal==="edit"?"Edit Question":"New Question"} onClose={()=>{setModal(null);setEditing(null)}}>
          <QuestionForm initial={editing} onSave={handleSave} onCancel={()=>{setModal(null);setEditing(null)}} sections={sections} />
        </Modal>
      )}

      {/* View Modal */}
      {modal==="view" && viewing && (
        <Modal title={"View Question #"+viewing.id} onClose={()=>{setModal(null);setViewing(null)}}>
          <ViewQuestion q={viewing} onEdit={()=>{setEditing(viewing);setModal("edit");setViewing(null)}} onClose={()=>{setModal(null);setViewing(null)}} />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="Delete question?" onClose={()=>setDeleteConfirm(null)}>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.muted, marginBottom:24 }}>Delete question #{deleteConfirm}? This cannot be undone.</p>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>setDeleteConfirm(null)} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 22px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:14, cursor:"pointer" }}>Cancel</button>
            <button onClick={()=>handleDelete(deleteConfirm)} style={{ background:"#f8717122", border:"1px solid #f8717144", borderRadius:10, padding:"10px 22px", color:"#f87171", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:"pointer" }}>✕ Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Question Stats Page ───────────────────────────────────────────────────────
function QuestionStatsPage() {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [sortKey,    setSortKey]    = useState("uses");
  const [sortDir,    setSortDir]    = useState("desc");
  const [filterLvl,  setFilterLvl]  = useState("all");
  const [filterSec,  setFilterSec]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [detail,     setDetail]     = useState(null); // row | null
  // Preserve sortOrder from server; fall back to appearance order in data
  const sections = [...new Set(rows.map(r => r.section))];

  useEffect(() => {
    api.getQuestionStats().then(data => {
      setRows(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sort = (key) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = rows
    .filter(r => {
      if (filterLvl !== "all" && r.level !== filterLvl) return false;
      if (filterSec !== "all" && r.section !== filterSec) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.prompt.toLowerCase().includes(q) && !String(r.questionId).includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });

  // Summary totals
  const totalUses    = rows.reduce((s, r) => s + r.uses, 0);
  const unusedCount  = rows.filter(r => r.uses === 0).length;
  const easyCount    = rows.filter(r => r.correctPct !== null && r.correctPct >= 80).length;
  const hardCount    = rows.filter(r => r.correctPct !== null && r.correctPct <= 40).length;

  const SortTh = ({ label, k, style={} }) => (
    <th onClick={() => sort(k)} style={{
      padding: "10px 14px", fontSize: 10, color: sortKey === k ? C.gold : C.muted,
      fontWeight: 700, letterSpacing: .8, textTransform: "uppercase",
      cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
      background: C.panel, borderBottom: `1px solid ${C.border}`,
      textAlign: "left", ...style,
    }}>
      {label} {sortKey === k ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </th>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", minWidth: 0, width: "100%", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: C.text, margin: "0 0 4px", fontWeight: 600 }}>
          Question Statistics
        </h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          Usage and correctness rates across all submitted exams
        </p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total questions used",  value: rows.length,   sub: `${totalUses} total appearances`,   color: C.gold },
            { label: "Never used",            value: unusedCount,   sub: "in question bank",                 color: unusedCount > 0 ? C.warning : C.success },
            { label: "Easy  (≥80% correct)",  value: easyCount,     sub: "consider increasing difficulty",   color: "#4ade80" },
            { label: "Hard  (≤40% correct)",  value: hardCount,     sub: "review or rephrase",               color: "#f87171" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.text, marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by prompt or ID…"
          style={{ flex: "1 1 200px", background: C.panel, border: `1.5px solid ${C.border2}`, borderRadius: 9, padding: "7px 12px", color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none" }} />
        <div style={{ display: "flex", gap: 5 }}>
          <Pill label="All Levels" active={filterLvl === "all"} onClick={() => setFilterLvl("all")} />
          {LEVELS.map(l => <Pill key={l} label={l} active={filterLvl === l} onClick={() => setFilterLvl(l)} color={LEVEL_COLORS[l]} />)}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Pill label="All Sections" active={filterSec === "all"} onClick={() => setFilterSec("all")} />
          {sections.map(s => <Pill key={s} label={s} active={filterSec === s} onClick={() => setFilterSec(s)} />)}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.muted, fontFamily: "'DM Sans',sans-serif" }}>No data yet — stats appear after exams are submitted</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans',sans-serif" }}>
              <thead>
                <tr>
                  <SortTh label="#"          k="questionId" style={{ width: 50 }} />
                  <th style={{ padding: "10px 14px", fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", background: C.panel, borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>Question</th>
                  <SortTh label="Level"      k="level"      style={{ width: 70 }} />
                  <th style={{ padding: "10px 14px", fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", background: C.panel, borderBottom: `1px solid ${C.border}`, width: 90 }}>Section</th>
                  <SortTh label="Used"       k="uses"       style={{ width: 70 }} />
                  <SortTh label="Correct"    k="correct"    style={{ width: 80 }} />
                  <SortTh label="Wrong"      k="incorrect"  style={{ width: 70 }} />
                  <SortTh label="Skipped"    k="skipped"    style={{ width: 75 }} />
                  <SortTh label="% Correct"  k="correctPct" style={{ width: 110 }} />
                  <SortTh label="Last used"  k="lastUsed"   style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <StatsRow key={r.questionId} r={r} i={i} onDetail={() => setDetail(r)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, marginTop: 10, textAlign: "right" }}>
        {filtered.length} / {rows.length} questions
      </div>

      {/* Detail drawer */}
      {detail && <StatsDetail r={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function StatsRow({ r, i, onDetail }) {
  const pct = r.correctPct;
  const barColor = pct === null ? C.muted
    : pct >= 80 ? "#4ade80"
    : pct >= 60 ? C.gold
    : pct >= 40 ? C.warning
    : "#f87171";
  const lc = LEVEL_COLORS[r.level] || C.muted;

  return (
    <tr
      onClick={onDetail}
      style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background .12s" }}
      onMouseEnter={e => e.currentTarget.style.background = C.panel}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <td style={{ padding: "11px 14px", fontSize: 12, color: C.muted }}>{r.questionId}</td>
      <td style={{ padding: "11px 14px", maxWidth: 340, overflow: "hidden" }}>
        <div style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.prompt || "—"}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.type}</div>
      </td>
      <td style={{ padding: "11px 14px" }}>
        <span style={{ fontSize: 11, color: lc, background: lc + "18", borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>{r.level}</span>
      </td>
      <td style={{ padding: "11px 14px", fontSize: 12, color: C.muted }}>{r.section}</td>
      <td style={{ padding: "11px 14px", fontSize: 13, color: C.text, fontWeight: r.uses > 0 ? 600 : 400 }}>{r.uses}</td>
      <td style={{ padding: "11px 14px", fontSize: 13, color: "#4ade80" }}>{r.correct}</td>
      <td style={{ padding: "11px 14px", fontSize: 13, color: "#f87171" }}>{r.incorrect}</td>
      <td style={{ padding: "11px 14px", fontSize: 13, color: C.muted }}>{r.skipped}</td>
      <td style={{ padding: "11px 14px", width: 110 }}>
        {pct === null ? (
          <span style={{ fontSize: 11, color: C.muted }}>—</span>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3, transition: "width .4s" }} />
              </div>
              <span style={{ fontSize: 12, color: barColor, fontWeight: 700, minWidth: 32, textAlign: "right" }}>{pct}%</span>
            </div>
          </div>
        )}
      </td>
      <td style={{ padding: "11px 14px", fontSize: 11, color: C.muted }}>
        {r.lastUsed ? new Date(r.lastUsed).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
      </td>
    </tr>
  );
}

function StatsDetail({ r, onClose }) {
  const pct = r.correctPct;
  const barColor = pct === null ? C.muted
    : pct >= 80 ? "#4ade80" : pct >= 60 ? C.gold : pct >= 40 ? C.warning : "#f87171";
  const lc = LEVEL_COLORS[r.level] || C.muted;
  const answered = r.uses - r.skipped;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000077", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 36px", width: "100%", maxWidth: 540, boxShadow: "0 32px 80px #00000099" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: C.text, fontWeight: 700, marginBottom: 4 }}>
              Question #{r.questionId}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 11, color: lc, background: lc + "18", borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>{r.level}</span>
              <span style={{ fontSize: 11, color: C.muted, background: C.panel, borderRadius: 5, padding: "2px 8px" }}>{r.section}</span>
              <span style={{ fontSize: 11, color: C.muted, background: C.panel, borderRadius: 5, padding: "2px 8px" }}>{r.type}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Prompt */}
        <div style={{ background: C.panel, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
          {r.prompt || "—"}
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Used",     value: r.uses,      color: C.gold },
            { label: "Correct",  value: r.correct,   color: "#4ade80" },
            { label: "Wrong",    value: r.incorrect,  color: "#f87171" },
            { label: "Skipped",  value: r.skipped,   color: C.muted },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.bg, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Correctness bar */}
        {pct !== null && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted }}>Correct rate ({answered} answered)</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4 }} />
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted, marginTop: 6 }}>
              {pct >= 80 ? "⚠ Easy — consider increasing difficulty"
               : pct <= 40 ? "⚠ Hard — consider reviewing or rephrasing"
               : "✓ Difficulty looks appropriate"}
            </div>
          </div>
        )}

        {r.lastUsed && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted }}>
            Last used: {new Date(r.lastUsed).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Placeholder pages ─────────────────────────────────────────────────────────
function PlaceholderPage({ title, icon }) {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:C.muted }}>
      <div style={{ fontSize:48 }}>{icon}</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:C.text }}>{title}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>Coming soon</div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function AdminQuestions({ theme }) {
  if (theme) C = theme;
  const [tab, setTab] = useState("questions"); // "questions" | "stats"

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
        select option{background:#080f1a}
      `}</style>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${C.border}`,
        background:C.panel, paddingLeft:32, flexShrink:0 }}>
        {[
          { id:"questions", icon:"☰", label:"Questions" },
          { id:"stats",     icon:"📊", label:"Statistics" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background:"transparent",
            borderBottom: tab===t.id ? `2px solid ${C.gold}` : "2px solid transparent",
            border:"none", borderRadius:0,
            padding:"14px 22px", marginBottom:-1,
            color: tab===t.id ? C.gold : C.muted,
            fontFamily:"'DM Sans',sans-serif", fontSize:13,
            fontWeight: tab===t.id ? 600 : 400,
            cursor:"pointer", display:"flex", alignItems:"center", gap:7,
            transition:"color .15s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === "questions" ? <QuestionsPage /> : <QuestionStatsPage />}
    </>
  );
}
