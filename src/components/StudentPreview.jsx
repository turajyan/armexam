import { useState, useEffect } from "react";
import { getExamTypography } from "../examTypography.js";
import { THEMES, DEFAULT_THEME, THEME_KEY } from "../theme.js";

const LEVEL_COLORS = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };

const NEW_TYPES = [
  { id:"SINGLE_CHOICE",       label:"Single Choice",     icon:"◉",  color:"#60a5fa" },
  { id:"MULTIPLE_CHOICE",     label:"Multiple Choice",   icon:"☑",  color:"#a78bfa" },
  { id:"FILL_IN_THE_BLANKS",  label:"Fill Blanks",       icon:"✎",  color:"#e879f9" },
  { id:"DRAG_TO_TEXT",        label:"Drag to Text",      icon:"🧩", color:"#f472b6" },
  { id:"TEXT_INSERTION",      label:"Text Insertion",    icon:"↩",  color:"#34d399" },
  { id:"DRAG_AND_DROP_TABLE", label:"D&D Table",         icon:"⊞",  color:"#fb923c" },
  { id:"DRAG_AND_DROP_IMAGE", label:"D&D Image",         icon:"🗺",  color:"#f59e0b" },
  { id:"IMAGE_CLICK",         label:"Image Click",       icon:"🎯", color:"#f87171" },
  { id:"SPEAKING_INDEPENDENT",label:"Speaking (Indep.)", icon:"🎤", color:"#fb923c" },
  { id:"SPEAKING_INTEGRATED", label:"Speaking (Integ.)", icon:"🎙", color:"#f97316" },
  { id:"WRITING_INDEPENDENT", label:"Writing (Indep.)",  icon:"✍",  color:"#94a3b8" },
  { id:"WRITING_INTEGRATED",  label:"Writing (Integ.)",  icon:"📝", color:"#64748b" },
];
const ntypeInfo = (id) => NEW_TYPES.find(t => t.id === id) || NEW_TYPES[0];

function StudentPreview({ q, onClose, navPrev, navNext, navDots, adminMode = false, theme = null }) {
  const [themeId, setThemeId] = useState(() =>
    localStorage.getItem(THEME_KEY) || DEFAULT_THEME
  );
  useEffect(() => {
    // Sync when theme changes (Settings page fires storage event)
    const onStorage = () => setThemeId(localStorage.getItem(THEME_KEY) || DEFAULT_THEME);
    window.addEventListener("storage", onStorage);
    // Also listen to our custom event
    const onCustom = () => setThemeId(localStorage.getItem(THEME_KEY) || DEFAULT_THEME);
    window.addEventListener("armexam:themechange", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("armexam:themechange", onCustom);
    };
  }, []);
  const baseTheme = theme || THEMES[themeId] || THEMES[DEFAULT_THEME];
  const T = {
    ...baseTheme,
    // aliases used in StudentPreview
    optionBg:       baseTheme.panel      || "#080f1a",
    optionSelected: (baseTheme.gold || "#c8a96e") + "18",
    optionBorder:   (baseTheme.gold || "#c8a96e") + "66",
  };
  const lc = LEVEL_COLORS[q.level] || "#94a3b8";
  const ti = ntypeInfo(q.type);
  const c  = q.content || {};
  const media = Array.isArray(q.media) ? q.media : [];
  const [typo, setTypo] = useState(() => getExamTypography());
  // Re-read when admin saves settings
  useEffect(() => {
    const handler = () => setTypo(getExamTypography());
    window.addEventListener("armexam:appearance", handler);
    return () => window.removeEventListener("armexam:appearance", handler);
  }, []);

  // ── per-type interactive state ──────────────────────────────────────────
  const [choiceAns,    setChoiceAns]    = useState(null);      // SINGLE_CHOICE
  const [multiAns,     setMultiAns]     = useState([]);        // MULTIPLE_CHOICE
  const [fillAns,      setFillAns]      = useState("");        // FILL_IN_THE_BLANKS
  const [writingAns,   setWritingAns]   = useState("");        // WRITING
  // DRAG_TO_TEXT
  const [placed,       setPlaced]       = useState({});        // { slot_1: "word" }
  const [bankWords,    setBankWords]    = useState(null);      // shuffled word bank
  const [dragWord,     setDragWord]     = useState(null);      // currently dragging word

  // Init shuffled bank when q changes
  const initBank = () => {
    const wb = [...(c.wordBank || [])];
    for (let i = wb.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wb[i], wb[j]] = [wb[j], wb[i]];
    }
    setBankWords(wb);
    setPlaced({});
  };
  useEffect(() => { initBank(); setChoiceAns(null); setMultiAns([]); setFillAns(""); setWritingAns("");
    setTPlaced({}); setTBank(null); setTDrag(null);
    setImgClick(null);
    setDdiPlaced({}); setDdiBank(null); setDdiDrag(null); setDdiDragFrom(null);
    setTiAns({});
  }, [q.id]);
  // DRAG_AND_DROP_TABLE state
  const [tPlaced, setTPlaced] = useState({});
  const [tBank,   setTBank]   = useState(null);
  const [tDrag,   setTDrag]   = useState(null);
  // IMAGE_CLICK state
  const [imgClick, setImgClick] = useState(null);
  // TEXT_INSERTION state
  const [tiAns, setTiAns] = useState({}); // { x, y } in percent
  // DRAG_AND_DROP_IMAGE state
  const [ddiPlaced,   setDdiPlaced]   = useState({});   // { hotspotId: labelId }
  const [ddiBank,     setDdiBank]     = useState(null); // null = all labels in bank
  const [ddiDrag,     setDdiDrag]     = useState(null); // labelId being dragged
  const [ddiDragFrom, setDdiDragFrom] = useState(null); // "bank" | hotspotId

  const bank = bankWords || [...(c.wordBank || [])];

  // Drop word into slot
  const dropIntoSlot = (slotName) => {
    if (!dragWord) return;
    const prev = placed[slotName];
    setPlaced(p => ({ ...p, [slotName]: dragWord }));
    // return previous word to bank if slot was occupied
    setBankWords(bw => {
      const next = (bw || []).filter(w => w !== dragWord);
      return prev ? [...next, prev] : next;
    });
    setDragWord(null);
  };
  const returnToBank = (slotName) => {
    const w = placed[slotName];
    if (!w) return;
    setPlaced(p => { const n = {...p}; delete n[slotName]; return n; });
    setBankWords(bw => [...(bw||[]), w]);
  };

  // Parse DRAG_TO_TEXT text into segments
  const parseDragText = (text) => {
    const segs = [];
    const rx = /\{(slot_\d+)\}/g;
    let last = 0, m;
    rx.lastIndex = 0;
    while ((m = rx.exec(text)) !== null) {
      if (m.index > last) segs.push({ type:"text", val: text.slice(last, m.index) });
      segs.push({ type:"slot", name: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) segs.push({ type:"text", val: text.slice(last) });
    return segs;
  };

  const renderInput = () => {
    const type = q.type;

    if (type === "SINGLE_CHOICE") {
      const options = c.options || [];
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {options.map((opt, i) => {
            const sel = choiceAns === i;
            return (
              <button key={i} onClick={() => setChoiceAns(i)} style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"14px 20px", borderRadius:12, cursor:"pointer",
                background: sel ? T.optionSelected : T.optionBg,
                border:`1.5px solid ${sel ? T.optionBorder : T.border2}`,
                textAlign:"left", transition:"all .15s", width:"100%",
              }}>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${sel ? T.gold : T.border2}`,
                  background: sel ? T.gold : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {sel && <div style={{ width:8, height:8, borderRadius:"50%", background:T.bg }} />}
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:typo.answerFontSize, color: sel ? T.text : T.muted }}>{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (type === "MULTIPLE_CHOICE") {
      const options = c.options || [];
      const toggle = i => setMultiAns(a => a.includes(i) ? a.filter(x=>x!==i) : [...a, i]);
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>
            {c.requiredCount ? `Select exactly ${c.requiredCount}` : "Select all that apply"}
          </div>
          {options.map((opt, i) => {
            const checked = multiAns.includes(i);
            return (
              <button key={i} onClick={() => toggle(i)} style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"14px 20px", borderRadius:12, cursor:"pointer",
                background: checked ? T.optionSelected : T.optionBg,
                border:`1.5px solid ${checked ? T.optionBorder : T.border2}`,
                textAlign:"left", transition:"all .15s", width:"100%",
              }}>
                <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
                  border:`2px solid ${checked ? T.gold : T.border2}`,
                  background: checked ? T.gold+"33" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {checked && <span style={{ color:T.gold, fontSize:12, fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:typo.answerFontSize, color: checked ? T.text : T.muted }}>{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (type === "FILL_IN_THE_BLANKS") {
      const segs = c.segments || [];
      // fillAns is now an object { blankId: value }
      const blanks = segs.filter(s => s.type === "blank");
      const ans = typeof fillAns === "object" && fillAns !== null ? fillAns : {};
      const setBlank = (id, val) => setFillAns(prev => ({ ...(typeof prev === "object" && prev !== null ? prev : {}), [id]: val }));
      return (
        <div style={{ background:T.panel, border:`1px solid ${T.border2}`, borderRadius:12,
          padding:"18px 22px", fontSize:16, color:T.text, fontFamily:"'DM Sans',sans-serif", lineHeight:2.6 }}>
          {segs.map((s, i) =>
            s.type === "text"
              ? <span key={i}>{s.value}</span>
              : <input key={i} type="text" value={ans[s.id] || ""} autoComplete="off" spellCheck={false}
                  onChange={e => setBlank(s.id, e.target.value)}
                  placeholder="…"
                  style={{ display:"inline-block", width: Math.max(80, ((ans[s.id]||"").length + 3) * 9) + "px",
                    background:"transparent",
                    borderTop:"none", borderLeft:"none", borderRight:"none",
                    borderBottom:`2px solid ${ans[s.id] ? T.gold : T.border2}`,
                    color:T.gold, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:600,
                    outline:"none", textAlign:"center", padding:"0 4px", margin:"0 3px",
                    transition:"border-bottom-color .15s" }} />
          )}
        </div>
      );
    }

    if (type === "DRAG_TO_TEXT") {
      const segs = parseDragText(c.text || "");
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Sentence with droppable slots */}
          <div style={{ background:T.panel, border:`1px solid ${T.border2}`, borderRadius:12,
            padding:"18px 22px", fontSize:16, color:T.text, fontFamily:"'DM Sans',sans-serif", lineHeight:2.2 }}>
            {segs.map((seg, i) =>
              seg.type === "text"
                ? <span key={i}>{seg.val}</span>
                : (
                  <span key={i}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={e => { e.preventDefault(); dropIntoSlot(seg.name); }}
                    onClick={() => placed[seg.name] && returnToBank(seg.name)}
                    style={{
                      display:"inline-block", minWidth:90, textAlign:"center",
                      background: placed[seg.name] ? T.gold+"22" : T.card,
                      border:`2px dashed ${placed[seg.name] ? T.gold+"88" : T.border2}`,
                      borderRadius:8, padding:"2px 14px", margin:"0 4px",
                      color: placed[seg.name] ? T.gold : T.muted,
                      fontSize:14, fontWeight:600, cursor: placed[seg.name] ? "pointer" : "default",
                      transition:"all .15s",
                    }}
                    title={placed[seg.name] ? "Click to return" : "Drop here"}>
                    {placed[seg.name] || "___"}
                  </span>
                )
            )}
          </div>
          {/* Word bank */}
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted, marginBottom:8, letterSpacing:.5, textTransform:"uppercase" }}>Word bank</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {bank.map((w, i) => (
                <span key={w+i} draggable
                  onDragStart={() => setDragWord(w)}
                  onDragEnd={() => setDragWord(null)}
                  style={{
                    background: dragWord === w ? T.gold+"33" : T.card,
                    border:`1.5px solid ${dragWord === w ? T.gold+"88" : T.border2}`,
                    borderRadius:8, padding:"8px 18px", fontSize:14, color:T.text,
                    fontFamily:"'DM Sans',sans-serif", fontWeight:500,
                    cursor:"grab", userSelect:"none", transition:"all .15s",
                  }}>
                  {w}
                </span>
              ))}
              {bank.length === 0 && <span style={{ fontSize:12, color:T.muted }}>All words placed</span>}
            </div>
          </div>
          <button onClick={initBank} style={{ alignSelf:"flex-start", background:"transparent",
            border:`1px solid ${T.border2}`, borderRadius:8, padding:"6px 14px",
            color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            ↺ Reset
          </button>
        </div>
      );
    }

    if (type === "WRITING_INDEPENDENT" || type === "WRITING_INTEGRATED") {
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {c.prompt && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.muted, margin:0 }}>{c.prompt}</p>}
          <textarea rows={8} value={writingAns} onChange={e => setWritingAns(e.target.value)}
            placeholder="Write your response here…"
            style={{ background:T.panel, border:`1.5px solid T.border2`,
              borderRadius:12, padding:"14px 18px", color:T.text,
              fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", resize:"vertical" }} />
          <div style={{ fontSize:11, color:T.muted, textAlign:"right" }}>
            {writingAns.trim().split(/\s+/).filter(Boolean).length} words
            {c.minWords && ` / min ${c.minWords}`}
            {c.maxWords && ` / max ${c.maxWords}`}
          </div>
        </div>
      );
    }

    if (type === "SPEAKING_INDEPENDENT" || type === "SPEAKING_INTEGRATED") {
      return (
        <div style={{ background:T.panel, borderRadius:12, padding:"24px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎤</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.muted, marginBottom:8 }}>
            Speaking question — recording UI only available in the Exam Terminal
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:12 }}>
            {c.prepSeconds && <span style={{ fontSize:12, color:T.gold }}>⏱ Prep: {c.prepSeconds}s</span>}
            {c.recordSeconds && <span style={{ fontSize:12, color:T.gold }}>🎙 Record: {c.recordSeconds}s</span>}
          </div>
        </div>
      );
    }

    if (type === "DRAG_AND_DROP_TABLE") {
      const columns = c.columns || [];
      const items   = c.items   || [];
      // placed: { itemId: colId }
      const bank = tBank ?? [...items];

      const dropIntoCol = (colId) => {
        if (!tDrag) return;
        setTPlaced(p => ({ ...p, [tDrag.id]: colId }));
        setTBank(b => (b ?? items).filter(x => x.id !== tDrag.id));
        setTDrag(null);
      };
      const returnItem = (itemId) => {
        const item = items.find(x => x.id === itemId);
        if (!item) return;
        setTPlaced(p => { const n = {...p}; delete n[itemId]; return n; });
        setTBank(b => [...(b ?? []), item]);
      };

      return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Columns */}
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${columns.length}, 1fr)`, gap:12 }}>
            {columns.map(col => {
              const colItems = items.filter(it => tPlaced[it.id] === col.id);
              return (
                <div key={col.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); dropIntoCol(col.id); }}
                  style={{ background:T.panel, border:`2px dashed ${T.border2}`, borderRadius:12,
                    minHeight:120, padding:12, transition:"border .15s" }}
                  onDragEnter={e => e.currentTarget.style.borderColor = "#fb923c88"}
                  onDragLeave={e => e.currentTarget.style.borderColor = T.border2}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
                    color:"#fb923c", marginBottom:10, textAlign:"center",
                    background:"#fb923c18", borderRadius:7, padding:"4px 0" }}>{col.title}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {colItems.map(it => (
                      <div key={it.id} onClick={() => returnItem(it.id)}
                        style={{ background:"#fb923c18", border:"1px solid #fb923c44",
                          borderRadius:8, padding:"8px 12px", fontSize:13, color:T.text,
                          fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                          title:"Click to return" }}>
                        {it.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Bank */}
          {bank.length > 0 && (
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted,
                marginBottom:8, letterSpacing:.5, textTransform:"uppercase" }}>Drag items into columns</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {bank.map(it => (
                  <div key={it.id} draggable
                    onDragStart={() => setTDrag(it)}
                    onDragEnd={() => setTDrag(null)}
                    style={{ background: tDrag?.id === it.id ? "#fb923c33" : T.card,
                      border:`1.5px solid ${tDrag?.id === it.id ? "#fb923c88" : T.border2}`,
                      borderRadius:8, padding:"8px 16px", fontSize:13, color:T.text,
                      fontFamily:"'DM Sans',sans-serif", cursor:"grab",
                      userSelect:"none", transition:"all .15s" }}>
                    {it.text}
                  </div>
                ))}
              </div>
            </div>
          )}
          {bank.length === 0 && (
            <div style={{ fontSize:12, color:"#4ade80", textAlign:"center" }}>✓ All items placed</div>
          )}
          <button onClick={() => { setTPlaced({}); setTBank([...items]); }}
            style={{ alignSelf:"flex-start", background:"transparent",
              border:`1px solid ${T.border2}`, borderRadius:8, padding:"6px 14px",
              color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            ↺ Reset
          </button>
        </div>
      );
    }

    if (type === "IMAGE_CLICK") {
      const hotspots = c.hotspots || [];
      const imgUrl   = media.find(m => m.type === "image")?.url;
      const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        setImgClick({ x, y });
      };
      const hit = imgClick && hotspots.find(hs => {
        if (!hs.correct) return false; // skip distractor zones
        const hw = hs.width  ?? 10;
        const hh = hs.height ?? 10;
        return imgClick.x >= hs.x && imgClick.x <= hs.x + hw &&
               imgClick.y >= hs.y && imgClick.y <= hs.y + hh;
      });

      return (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {!imgUrl && (
            <div style={{ background:T.panel, borderRadius:12, padding:"32px",
              textAlign:"center", color:T.muted, fontSize:13 }}>
              No image attached — add an image in the Media section
            </div>
          )}
          {imgUrl && (
            <div style={{ position:"relative", display:"inline-block", cursor:"crosshair",
              borderRadius:12, overflow:"hidden", userSelect:"none" }}
              onClick={handleClick}>
              <img src={imgUrl} alt="" style={{ width:"100%", display:"block", borderRadius:12 }} />
              {/* Show click marker */}
              {imgClick && (
                <div style={{
                  position:"absolute",
                  left: imgClick.x + "%", top: imgClick.y + "%",
                  transform:"translate(-50%,-50%)",
                  width:22, height:22, borderRadius:"50%",
                  background: hit ? "#4ade8066" : "#f8717166",
                  border: `2px solid ${hit ? "#4ade80" : "#f87171"}`,
                  pointerEvents:"none", transition:"all .15s",
                }} />
              )}
            </div>
          )}
          {imgClick && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, textAlign:"center",
              color: hit ? "#4ade80" : "#f87171" }}>
              {hit ? "✓ Correct zone" : "✗ Try again"}
              <button onClick={() => setImgClick(null)}
                style={{ marginLeft:12, background:"transparent", border:`1px solid ${T.border2}`,
                  borderRadius:6, padding:"3px 10px", color:T.muted, fontSize:11, cursor:"pointer" }}>
                Reset
              </button>
            </div>
          )}
          {!imgClick && imgUrl && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.muted, textAlign:"center" }}>
              Click on the image to mark your answer
            </div>
          )}
        </div>
      );
    }

    if (type === "DRAG_AND_DROP_IMAGE") {
      const labels  = c.labels   || [];   // [{ id, text }]
      const hotspots = c.hotspots || [];  // [{ id, x, y, correct }]  x/y in %
      const imgUrl  = media.find(m => m.type === "image")?.url;

      const allLabelIds = labels.map(l => l.id);
      const bank = ddiBank ?? allLabelIds;
      const labelText = id => labels.find(l => l.id === id)?.text ?? id;

      const startDragLabel = (labelId, fromHsId = null) => {
        setDdiDrag(labelId);
        setDdiDragFrom(fromHsId ?? "bank");
      };
      const endDrag = () => { setDdiDrag(null); setDdiDragFrom(null); };

      const dropOnHotspot = (hsId) => {
        if (!ddiDrag) return;
        const prev = ddiPlaced[hsId]; // label currently on target hotspot
        const srcHs = ddiDragFrom && ddiDragFrom !== "bank" ? ddiDragFrom : null;
        // Place dragged label onto target hotspot
        setDdiPlaced(p => {
          const next = { ...p, [hsId]: ddiDrag };
          if (srcHs) delete next[srcHs]; // vacate source hotspot
          return next;
        });
        setDdiBank(b => {
          let next = (b ?? allLabelIds).filter(id => id !== ddiDrag);
          if (prev && prev !== ddiDrag) next = [...next, prev]; // displaced label → bank (unless swapping same)
          if (!srcHs) next = next.filter(id => id !== ddiDrag); // from bank: ensure removed
          return next;
        });
        setDdiDrag(null); setDdiDragFrom(null);
      };
      const returnHotspot = (hsId) => {
        const lbl = ddiPlaced[hsId];
        if (!lbl) return;
        setDdiPlaced(p => { const n = {...p}; delete n[hsId]; return n; });
        setDdiBank(b => [...(b ?? allLabelIds), lbl]);
      };

      const HOTSPOT_W = 96; const HOTSPOT_H = 30;
      const isHsDragActive = (hsId) => ddiDragFrom === hsId;
      const LABEL_COLORS = ["#f59e0b","#60a5fa","#4ade80","#f87171","#a78bfa","#34d399","#fb923c","#e879f9"];
      const labelColor = (labelId) => {
        const idx = labels.findIndex(l => l.id === labelId);
        return idx >= 0 ? LABEL_COLORS[idx % LABEL_COLORS.length] : T.gold;
      };

      return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Image with hotspots */}
          {imgUrl ? (
            <div style={{ position:"relative", width:"100%", userSelect:"none" }}
              onDragOver={e => e.preventDefault()}>
              <img src={imgUrl} alt="" style={{ width:"100%", display:"block", borderRadius:12 }}/>
              {hotspots.map(hs => {
                const placed = ddiPlaced[hs.id];
                const isDraggingThis = isHsDragActive(hs.id);
                return (
                  <div key={hs.id}
                    draggable={!!placed}
                    onDragStart={placed ? (e) => { e.stopPropagation(); startDragLabel(placed, hs.id); } : undefined}
                    onDragEnd={endDrag}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); dropOnHotspot(hs.id); }}
                    onClick={() => !ddiDrag && placed && returnHotspot(hs.id)}
                    title={placed ? "Drag to move · Click to return to bank" : "Drop a label here"}
                    style={{
                      position:"absolute",
                      left: `calc(${hs.x}% - ${HOTSPOT_W/2}px)`,
                      top:  `calc(${hs.y}% - ${HOTSPOT_H/2}px)`,
                      width: HOTSPOT_W, height: HOTSPOT_H,
                      background: placed ? "transparent" : ddiDrag ? T.border2+"44" : T.border,
                      border: `2px dashed ${isDraggingThis ? labelColor(placed)+"88" : placed ? labelColor(placed) : ddiDrag ? T.border2 : T.border2}`,
                      borderRadius: 8,
                      cursor: placed ? "grab" : ddiDrag ? "copy" : "default",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .15s",
                      opacity: isDraggingThis ? 0.4 : 1,
                    }}>
                    {placed
                      ? <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                          color:"#fff", fontWeight:700, pointerEvents:"none",
                          background: labelColor(placed)+"dd",
                          padding:"2px 8px", borderRadius:5,
                          textShadow:"0 1px 2px #00000088" }}>{labelText(placed)}</span>
                      : <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                          color:T.border2, pointerEvents:"none",
                          background:T.panel, padding:"2px 8px", borderRadius:5 }}>drop here</span>
                    }
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding:"20px", textAlign:"center", color:T.muted,
              background:T.panel, borderRadius:12, fontSize:13 }}>No image attached</div>
          )}

          {/* Label bank */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {bank.map(id => (
              <div key={id} draggable
                onDragStart={() => startDragLabel(id, null)}
                onDragEnd={endDrag}
                style={{
                  padding:"6px 14px", borderRadius:8, cursor:"grab",
                  background: ddiDrag===id ? labelColor(id) : labelColor(id)+"cc",
                  border:`1.5px solid ${labelColor(id)}`,
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#fff",
                  textShadow:"0 1px 2px #00000066",
                  userSelect:"none", transition:"all .15s",
                }}>
                {labelText(id)}
              </div>
            ))}
            {bank.length === 0 && (
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.muted }}>
                All labels placed — click a label on the map to return it
              </span>
            )}
          </div>

          {/* Reset */}
          <button onClick={() => { setDdiPlaced({}); setDdiBank(allLabelIds); }}
            style={{ alignSelf:"flex-start", background:"transparent", border:`1px solid ${T.border2}`,
              borderRadius:7, padding:"5px 14px", color:T.muted, fontSize:12, cursor:"pointer" }}>
            ↺ Reset
          </button>
        </div>
      );
    }

    if (type === "TEXT_INSERTION") {
      const passages  = c.passages  || [];
      const rawSentences = c.sentences || [];
      const rawMarkers   = (c.markers  || []).map(m => ({ ...m, id: String(m.id) }));
      // Migrate old format (no sentences array) — synthesize from passages
      const sentences = rawSentences.length > 0 ? rawSentences :
        rawMarkers.map((m, i) => ({ id: m.id, text: passages[m.correct] ?? ("Sentence " + (i+1)) }));
      const markers = rawMarkers;
      const ans = (typeof tiAns === "object" && tiAns !== null) ? tiAns : {};
      const setMarker = (mid, idx) => setTiAns(a => ({ ...(a||{}), [mid]: idx }));

      return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Passage with gap indicators */}
          <div style={{ background:T.panel, border:`1px solid ${T.border2}`, borderRadius:12,
            padding:"18px 22px", fontFamily:"'DM Sans',sans-serif", fontSize:15,
            color:T.text, lineHeight:2 }}>
            {passages.map((p, i) => {
              const filledId = Object.keys(ans).find(mid => Number(ans[mid]) === i);
              const filledSentence = filledId ? sentences.find(s=>s.id===filledId) : null;
              return (
                <span key={i}>
                  <span>{p}</span>
                  {i < passages.length - 1 && (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                      margin:"0 6px", verticalAlign:"middle" }}>
                      {filledSentence ? (
                        <span style={{ background:T.gold+"22", border:`1.5px solid ${T.gold+"88"}`,
                          borderRadius:8, padding:"2px 10px", fontSize:12, color:T.gold,
                          fontStyle:"italic", cursor:"default" }}>
                          ↩ {filledSentence.text.slice(0,40)}{filledSentence.text.length>40?"…":""}
                        </span>
                      ) : (
                        <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
                          width:24, height:24, borderRadius:"50%",
                          background:T.border2, border:"1.5px solid T.border2",
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

          {/* Sentence cards — drag each to the right gap */}
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted,
            letterSpacing:.5, textTransform:"uppercase", marginBottom:4 }}>
            Sentences to insert
          </div>
          {sentences.map((s, si) => {
            const marker = markers.find(m=>m.id===s.id);
            if (!marker) return null;
            const currentGap = ans[s.id] !== undefined ? Number(ans[s.id]) : null;
            return (
              <div key={s.id} style={{ background:T.panel, border:`1px solid ${T.border2}`,
                borderRadius:12, padding:"14px 18px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                  color:T.text, marginBottom:10, fontStyle:"italic" }}>
                  "{s.text}"
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted, marginRight:4 }}>
                    Insert after:
                  </span>
                  {passages.slice(0,-1).map((_,gi) => {
                    const sel = currentGap === gi;
                    return (
                      <button key={gi} onClick={()=>setMarker(s.id, gi)}
                        style={{ padding:"5px 14px", borderRadius:8, cursor:"pointer",
                          background: sel ? T.gold+"22" : T.card,
                          border:`1.5px solid ${sel ? T.gold+"88" : T.border2}`,
                          color: sel ? T.gold : T.muted,
                          fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:sel?700:400,
                          transition:"all .15s" }}>
                        Gap {gi+1}
                      </button>
                    );
                  })}
                  {currentGap !== null && (
                    <button onClick={()=>setTiAns(a=>{const n={...a};delete n[s.id];return n;})}
                      style={{ padding:"5px 10px", borderRadius:8, cursor:"pointer",
                        background:"transparent", border:`1px solid ${T.border}`,
                        color:T.muted, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return <div style={{ color:T.muted, fontSize:13, padding:"20px 0" }}>[Preview not available for {q.type}]</div>;
  };

  const inner = (
    <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:20,
      width:"100%", maxWidth:700, maxHeight:"90vh",
      display:"flex", flexDirection:"column", boxShadow:"0 32px 100px #000d" }}>

        {/* Top bar: close button always top-right */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 14px 0", flexShrink:0 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted }}>
            Student Preview
          </span>
          {onClose && <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${T.border}`,
            borderRadius:8, width:30, height:30, color:T.muted, fontSize:15, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>}
        </div>

        {/* Nav dots (exam preview mode) */}
        {navDots && (
          <div style={{ padding:"6px 14px 0", flexShrink:0 }}>{navDots}</div>
        )}

        {/* Header: level + type badges */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          padding:"8px 14px 10px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <span style={{ background:lc+"18", color:lc, border:`1px solid ${lc}33`,
            borderRadius:5, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{q.level}</span>
          <span style={{ background:ti.color+"18", color:ti.color, border:`1px solid ${ti.color}33`,
            borderRadius:5, padding:"2px 8px", fontSize:10, fontWeight:600 }}>{ti.icon} {ti.label}</span>
        </div>

        {/* Body */}
        <div style={{ overflowY:"auto", padding:"28px 32px", flex:1 }}>
          {/* Media */}
          {media.map((m, i) => (
            <div key={i} style={{ marginBottom:16 }}>
              {m.type === "audio" && m.url && <audio controls src={m.url} style={{ width:"100%", accentColor:T.gold }} />}
              {m.type === "video" && m.url && <video controls src={m.url} style={{ width:"100%", borderRadius:12, maxHeight:240 }} />}
              {m.type === "image" && m.url && !["DRAG_AND_DROP_IMAGE","IMAGE_CLICK"].includes(q.type) && <img src={m.url} alt="" style={{ maxWidth:"100%", borderRadius:12, marginBottom:8 }} />}
            </div>
          ))}
          {/* Context */}
          {q.contextText && (
            <div style={{ background:T.gold+"12", borderRadius:12, padding:"18px 22px", marginBottom:20,
              borderLeft:`3px solid ${T.gold}`, position:"relative" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.gold,
                letterSpacing:.8, textTransform:"uppercase", fontWeight:600, marginBottom:8 }}>
                Context
              </div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:typo.contextFontSize,
                color:T.text, lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>{q.contextText}</p>
            </div>
          )}
          {/* Prompt */}
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:typo.promptFontSize,
            color:T.text, lineHeight:1.6, marginBottom:24, fontWeight:600 }}>{q.prompt || "(no prompt)"}</p>
          {/* Interactive input */}
          {renderInput()}

          {/* ── Admin answer key panel ─────────────────────────────── */}
          {adminMode && (() => {
            const panels = [];
            const type = q.type;
            const c = q.content || {};

            if (type === "SINGLE_CHOICE") {
              const opts = c.options || [];
              panels.push(
                <div key="ak" style={{ marginTop:20, background:"#22c55e0d", border:"1px solid #22c55e33",
                  borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#22c55e",
                    letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>✓ Answer key</div>
                  {opts.map((opt, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4,
                      fontFamily:"'DM Sans',sans-serif", fontSize:13,
                      color: i === c.correct ? "#22c55e" : T.muted }}>
                      <span style={{ fontSize:11 }}>{i === c.correct ? "✓" : "○"}</span> {opt}
                    </div>
                  ))}
                </div>
              );
            }

            if (type === "MULTIPLE_CHOICE") {
              const opts = c.options || [];
              const correct = Array.isArray(c.correct) ? c.correct : [];
              panels.push(
                <div key="ak" style={{ marginTop:20, background:"#22c55e0d", border:"1px solid #22c55e33",
                  borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#22c55e",
                    letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>✓ Answer key</div>
                  {opts.map((opt, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4,
                      fontFamily:"'DM Sans',sans-serif", fontSize:13,
                      color: correct.includes(i) ? "#22c55e" : T.muted }}>
                      <span style={{ fontSize:11 }}>{correct.includes(i) ? "✓" : "○"}</span> {opt}
                    </div>
                  ))}
                </div>
              );
            }

            if (type === "FILL_IN_THE_BLANKS" || type === "DRAG_TO_TEXT") {
              const slots = c.slots || {};
              panels.push(
                <div key="ak" style={{ marginTop:20, background:"#22c55e0d", border:"1px solid #22c55e33",
                  borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#22c55e",
                    letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>✓ Answer key</div>
                  {Object.entries(slots).map(([slot, answer]) => (
                    <div key={slot} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                      color:T.text, marginBottom:4 }}>
                      <span style={{ color:T.muted }}>{slot}:</span> <span style={{ color:"#22c55e" }}>{answer}</span>
                    </div>
                  ))}
                </div>
              );
            }

            if (type === "DRAG_AND_DROP_TABLE") {
              const items = c.items || [];
              const cols  = c.columns || [];
              const correct = c.correct || {};
              panels.push(
                <div key="ak" style={{ marginTop:20, background:"#22c55e0d", border:"1px solid #22c55e33",
                  borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#22c55e",
                    letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>✓ Answer key</div>
                  {items.map(it => {
                    const col = cols.find(col => col.id === correct[it.id]);
                    return (
                      <div key={it.id} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                        color:T.text, marginBottom:4 }}>
                        <span style={{ color:T.muted }}>{it.text}</span>
                        <span style={{ color:"#22c55e" }}> → {col?.title ?? "?"}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (type === "DRAG_AND_DROP_IMAGE") {
              const labels   = c.labels   || [];
              const hotspots = c.hotspots || [];
              panels.push(
                <div key="ak" style={{ marginTop:20, background:"#22c55e0d", border:"1px solid #22c55e33",
                  borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#22c55e",
                    letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>✓ Answer key</div>
                  {hotspots.map((hs, i) => {
                    const lbl = labels.find(l => l.id === hs.correct);
                    return (
                      <div key={hs.id} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                        color:T.text, marginBottom:4 }}>
                        <span style={{ color:T.muted }}>Hotspot {i+1} ({Math.round(hs.x)}%,{Math.round(hs.y)})%:</span>
                        <span style={{ color:"#22c55e" }}> {lbl?.text ?? "?"}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (type === "IMAGE_CLICK") {
              const hotspots = c.hotspots || [];
              const correct  = hotspots.filter(h => h.correct);
              const dist     = hotspots.filter(h => !h.correct);
              panels.push(
                <div key="ak" style={{ marginTop:20, background:"#22c55e0d", border:"1px solid #22c55e33",
                  borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#22c55e",
                    letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>✓ Answer key</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.text, marginBottom:6 }}>
                    <span style={{ color:"#22c55e" }}>✓ Correct zones: </span>
                    {correct.map((h,i) => `Zone ${hotspots.indexOf(h)+1} (${Math.round(h.x)}%,${Math.round(h.y)}% ${Math.round(h.width??10)}×${Math.round(h.height??10)}%)`).join(", ") || "none"}
                  </div>
                  {dist.length > 0 && (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.text }}>
                      <span style={{ color:"#f87171" }}>✗ Distractor zones: </span>
                      {dist.map((h,i) => `Zone ${hotspots.indexOf(h)+1}`).join(", ")}
                    </div>
                  )}
                </div>
              );
            }

            if (type === "TEXT_INSERTION") {
              const passages  = c.passages  || [];
              const rawSents  = c.sentences || [];
              const rawMarkers = (c.markers || []).map(m => ({ ...m, id: String(m.id) }));
              // Migrate: if no sentences, synthesize from passages
              const akSentences = rawSents.length > 0 ? rawSents :
                rawMarkers.map((m, i) => ({ id: m.id, text: passages[m.correct] ?? ("Sentence " + (i+1)) }));
              panels.push(
                <div key="ak" style={{ marginTop:20, background:"#22c55e0d", border:"1px solid #22c55e33",
                  borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#22c55e",
                    letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>✓ Answer key</div>
                  {rawMarkers.map((m, mi) => {
                    const s = akSentences.find(s => s.id === m.id);
                    return (
                      <div key={m.id} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                        color:T.text, marginBottom:6 }}>
                        <span style={{ color:"#22c55e", fontWeight:600 }}>Gap {m.correct+1}</span>
                        <span style={{ color:T.muted }}> ← </span>
                        <span style={{ fontStyle:"italic" }}>"{s?.text || "?"}"</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (["SPEAKING_INDEPENDENT","SPEAKING_INTEGRATED","WRITING_INDEPENDENT","WRITING_INTEGRATED"].includes(type)) {
              const rubrics = c.rubrics || [];
              panels.push(
                <div key="ak" style={{ marginTop:20, background:T.info+"0d", border:`1px solid ${T.info}33`,
                  borderRadius:12, padding:"14px 18px" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.info,
                    letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>📋 Rubrics</div>
                  {rubrics.map(r => (
                    <div key={r.id} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                      color:T.text, marginBottom:4 }}>
                      {r.label} — <span style={{ color:T.warning }}>max {r.maxScore} pts</span>
                    </div>
                  ))}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.muted, marginTop:8 }}>
                    Total: {rubrics.reduce((s,r) => s + (r.maxScore||0), 0)} pts · Manual grading required
                  </div>
                </div>
              );
            }

            return panels.length ? panels : null;
          })()}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px", borderTop:`1px solid ${T.border}`, flexShrink:0,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted }}>
            {q.points} pt · read-only preview
          </span>
          {navDots ? (
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={navPrev} disabled={!navPrev} style={{ background:"transparent",
                border:`1px solid ${T.border2}`, borderRadius:9, padding:"7px 16px", color: navPrev ? T.text : T.muted,
                fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor: navPrev ? "pointer" : "not-allowed",
                opacity: navPrev ? 1 : 0.4 }}>← Prev</button>
              {navNext
                ? <button onClick={navNext} style={{ background:"linear-gradient(135deg,#c8a96e,#7c5830)",
                    border:"none", borderRadius:9, padding:"7px 16px", color:"white",
                    fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", fontWeight:600 }}>Next →</button>
                : <button onClick={onClose} style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)",
                    border:"none", borderRadius:9, padding:"7px 16px", color:"white",
                    fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", fontWeight:600 }}>✓ Done</button>
              }
            </div>
          ) : (
            <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${T.border2}`,
              borderRadius:9, padding:"8px 20px", color:T.muted,
              fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer" }}>Close</button>
          )}
        </div>
      </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000cc", backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:20 }}
      onMouseDown={e => { if (e.target === e.currentTarget) e.currentTarget._closeOnUp = true; }}
      onMouseUp={e => { if (e.currentTarget._closeOnUp && e.target === e.currentTarget && onClose) onClose(); e.currentTarget._closeOnUp = false; }}>
      {inner}
    </div>
  );
}

// ── Questions Page ─────────────────────────────────────────────────────────────

export default StudentPreview;
