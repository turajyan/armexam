import { useState, useEffect } from "react";

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

function StudentPreview({ q, onClose, navPrev, navNext, navDots }) {
  const T = {
    bg:"#04080f", panel:"#080f1a", card:"#0d1829", border:"#1a2540",
    text:"#e2e8f0", muted:"#475569", gold:"#c8a96e",
    optionBg:"#ffffff08", optionSelected:"#c8a96e18", optionBorder:"#c8a96e66",
    success:"#22c55e", danger:"#f87171",
  };
  const lc = LEVEL_COLORS[q.level] || "#94a3b8";
  const ti = ntypeInfo(q.type);
  const c  = q.content || {};
  const media = Array.isArray(q.media) ? q.media : [];

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
  }, [q.id]);
  // DRAG_AND_DROP_TABLE state
  const [tPlaced, setTPlaced] = useState({});
  const [tBank,   setTBank]   = useState(null);
  const [tDrag,   setTDrag]   = useState(null);
  // IMAGE_CLICK state
  const [imgClick, setImgClick] = useState(null); // { x, y } in percent

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
                border:`1.5px solid ${sel ? T.optionBorder : "#ffffff18"}`,
                textAlign:"left", transition:"all .15s", width:"100%",
              }}>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${sel ? T.gold : "#ffffff33"}`,
                  background: sel ? T.gold : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {sel && <div style={{ width:8, height:8, borderRadius:"50%", background:"#1a1200" }} />}
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color: sel ? T.text : T.muted }}>{opt}</span>
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
                border:`1.5px solid ${checked ? T.optionBorder : "#ffffff18"}`,
                textAlign:"left", transition:"all .15s", width:"100%",
              }}>
                <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
                  border:`2px solid ${checked ? T.gold : "#ffffff33"}`,
                  background: checked ? T.gold+"33" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {checked && <span style={{ color:T.gold, fontSize:12, fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color: checked ? T.text : T.muted }}>{opt}</span>
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
        <div style={{ background:"#ffffff06", border:"1px solid #ffffff18", borderRadius:12,
          padding:"18px 22px", fontSize:16, color:T.text, fontFamily:"'DM Sans',sans-serif", lineHeight:2.6 }}>
          {segs.map((s, i) =>
            s.type === "text"
              ? <span key={i}>{s.value}</span>
              : <input key={i} type="text" value={ans[s.id] || ""} autoComplete="off" spellCheck={false}
                  onChange={e => setBlank(s.id, e.target.value)}
                  placeholder="…"
                  style={{ display:"inline-block", width: Math.max(80, ((ans[s.id]||"").length + 3) * 9) + "px",
                    background:"transparent", borderBottom:`2px solid ${ans[s.id] ? T.gold+"aa" : "#ffffff44"}`,
                    border:"none", borderBottom:`2px solid ${ans[s.id] ? T.gold : "#ffffff44"}`,
                    color:T.gold, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:600,
                    outline:"none", textAlign:"center", padding:"0 4px", margin:"0 3px",
                    transition:"border .15s" }} />
          )}
        </div>
      );
    }

    if (type === "DRAG_TO_TEXT") {
      const segs = parseDragText(c.text || "");
      return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Sentence with droppable slots */}
          <div style={{ background:"#ffffff06", border:"1px solid #ffffff18", borderRadius:12,
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
                      background: placed[seg.name] ? T.gold+"22" : "#ffffff0a",
                      border:`2px dashed ${placed[seg.name] ? T.gold+"88" : "#ffffff33"}`,
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
                    background: dragWord === w ? T.gold+"33" : "#ffffff0d",
                    border:`1.5px solid ${dragWord === w ? T.gold+"88" : "#ffffff22"}`,
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
            border:`1px solid #ffffff22`, borderRadius:8, padding:"6px 14px",
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
            style={{ background:"#ffffff06", border:`1.5px solid #ffffff18`,
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
        <div style={{ background:"#ffffff06", borderRadius:12, padding:"24px", textAlign:"center" }}>
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
                  style={{ background:"#ffffff06", border:"2px dashed #ffffff22", borderRadius:12,
                    minHeight:120, padding:12, transition:"border .15s" }}
                  onDragEnter={e => e.currentTarget.style.borderColor = "#fb923c88"}
                  onDragLeave={e => e.currentTarget.style.borderColor = "#ffffff22"}>
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
                    style={{ background: tDrag?.id === it.id ? "#fb923c33" : "#ffffff0d",
                      border:`1.5px solid ${tDrag?.id === it.id ? "#fb923c88" : "#ffffff22"}`,
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
              border:"1px solid #ffffff22", borderRadius:8, padding:"6px 14px",
              color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            ↺ Reset
          </button>
        </div>
      );
    }

    if (type === "IMAGE_CLICK") {
      const hotspots = c.hotspots || [];
      const imgUrl   = (media[0] || {}).url;
      const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        setImgClick({ x, y });
      };
      const hit = imgClick && hotspots.find(hs => {
        const hw = hs.width  ?? 10;
        const hh = hs.height ?? 10;
        return imgClick.x >= hs.x && imgClick.x <= hs.x + hw &&
               imgClick.y >= hs.y && imgClick.y <= hs.y + hh;
      });

      return (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {!imgUrl && (
            <div style={{ background:"#ffffff06", borderRadius:12, padding:"32px",
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
                style={{ marginLeft:12, background:"transparent", border:"1px solid #ffffff22",
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

    return <div style={{ color:T.muted, fontSize:13, padding:"20px 0" }}>[Preview not available for {q.type}]</div>;
  };

  const inner = (
    <div style={{ background:T.bg, border:"1px solid #1a2540", borderRadius:20,
      width:"100%", maxWidth:700, maxHeight:"90vh",
      display:"flex", flexDirection:"column", boxShadow:"0 32px 100px #000d" }}>

        {/* Nav dots (exam preview mode) */}
        {navDots && (
          <div style={{ padding:"10px 16px 0", flexShrink:0 }}>{navDots}</div>
        )}

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"12px 24px", borderBottom:"1px solid #1a2540", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#475569" }}>Student Preview</span>
            <span style={{ background:lc+"18", color:lc, border:`1px solid ${lc}33`,
              borderRadius:5, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{q.level}</span>
            <span style={{ background:ti.color+"18", color:ti.color, border:`1px solid ${ti.color}33`,
              borderRadius:5, padding:"2px 8px", fontSize:10, fontWeight:600 }}>{ti.icon} {ti.label}</span>
          </div>
          {onClose && <button onClick={onClose} style={{ background:"transparent", border:"1px solid #1a2540",
            borderRadius:8, width:32, height:32, color:"#475569", fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>}
        </div>

        {/* Body */}
        <div style={{ overflowY:"auto", padding:"28px 32px", flex:1 }}>
          {/* Media */}
          {media.map((m, i) => (
            <div key={i} style={{ marginBottom:16 }}>
              {m.type === "audio" && m.url && <audio controls src={m.url} style={{ width:"100%", accentColor:T.gold }} />}
              {m.type === "video" && m.url && <video controls src={m.url} style={{ width:"100%", borderRadius:12, maxHeight:240 }} />}
              {m.type === "image" && m.url && <img src={m.url} alt="" style={{ maxWidth:"100%", borderRadius:12, marginBottom:8 }} />}
            </div>
          ))}
          {/* Context */}
          {q.contextText && (
            <div style={{ background:"#ffffff06", borderRadius:12, padding:"16px 20px", marginBottom:20,
              borderLeft:"3px solid #c8a96e44" }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#94a3b8", lineHeight:1.7, margin:0 }}>{q.contextText}</p>
            </div>
          )}
          {/* Prompt */}
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:T.text,
            lineHeight:1.6, marginBottom:24, fontWeight:600 }}>{q.prompt || "(no prompt)"}</p>
          {/* Interactive input */}
          {renderInput()}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px", borderTop:"1px solid #1a2540", flexShrink:0,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#475569" }}>
            {q.points} pt{embedded ? " · read-only" : " · Read-only preview"}
          </span>
          {navDots ? (
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={navPrev} disabled={!navPrev} style={{ background:"transparent",
                border:"1px solid #243050", borderRadius:9, padding:"7px 16px", color: navPrev ? "#e2e8f0" : "#475569",
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
            <button onClick={onClose} style={{ background:"transparent", border:"1px solid #243050",
              borderRadius:9, padding:"8px 20px", color:"#475569",
              fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer" }}>Close</button>
          )}
        </div>
      </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000cc", backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:20 }}
      onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      {inner}
    </div>
  );
}

// ── Questions Page ─────────────────────────────────────────────────────────────

export default StudentPreview;
