import { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');`;

// ── Constants ────────────────────────────────────────────────────────────────
const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const LEVEL_COLORS = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };
const SECTIONS = ["Reading","Writing","Listening","Grammar","Vocabulary","Listening / Տեսնել","Free Writing"];
const QTYPES = [
  { id:"single_choice", label:"Single Choice", icon:"◉", color:"#60a5fa" },
  { id:"multi_choice",  label:"Multi Choice",  icon:"☑", color:"#a78bfa" },
  { id:"multi_select",  label:"Multi Select",  icon:"⊞", color:"#34d399" },
  { id:"audio",         label:"Audio",         icon:"🎧", color:"#f59e0b" },
  { id:"video",         label:"Video",         icon:"🎬", color:"#f87171" },
  { id:"fill_blank",    label:"Fill Blank",    icon:"✎", color:"#e879f9" },
  { id:"fill_wordbank", label:"Word Bank",     icon:"🧩", color:"#f472b6" },
  { id:"writing",       label:"Writing",       icon:"✍", color:"#94a3b8" },
  { id:"voice",         label:"Voice",         icon:"🎤", color:"#fb923c" },
];

// ── Palette ──────────────────────────────────────────────────────────────────
let C = { bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",gold:"#c8a96e",goldDim:"#7c5830",text:"#e2e8f0",muted:"#475569",dim:"#1e293b",success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa",purple:"#a78bfa",scrollThumb:"#243050",sidebarBg:"#080f1a",topbarBg:"#080f1acc" };

// ── Helpers ──────────────────────────────────────────────────────────────────
const qtype = (id) => QTYPES.find(q=>q.id===id) || QTYPES[0];

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

function UploadZone({ label, accept, icon, hint, onFile, fileName, onClear }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  const handleFile = f => { if (f && onFile) onFile(f); };
  const handleClear = (e) => {
    e.stopPropagation();
    if (ref.current) ref.current.value = "";
    if (onClear) onClear();
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase" }}>{label}</label>
          {fileName && onClear && (
            <button onClick={handleClear} style={{ background:"transparent", border:"none", color:"#f87171", cursor:"pointer", fontSize:16, padding:"0 2px", lineHeight:1 }} title="Remove">✕</button>
          )}
        </div>
      )}
      <div
        onClick={()=>ref.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}
        style={{ border:`2px dashed ${drag?C.gold:fileName?C.success:C.border2}`, borderRadius:12, padding:"24px 16px", textAlign:"center", cursor:"pointer", transition:"all .2s", background:drag?C.gold+"08":fileName?C.success+"08":"transparent" }}>
        <div style={{ fontSize:28, marginBottom:6 }}>{icon}</div>
        {fileName ? (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.success }}>{fileName}</div>
        ) : (
          <>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted }}>Drag or click to upload</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.dim, marginTop:4 }}>{hint}</div>
          </>
        )}
        <input ref={ref} type="file" accept={accept} style={{ display:"none" }}
          onChange={e=>{ handleFile(e.target.files[0]); e.target.value=""; }}
        />
      </div>
    </div>
  );
}

// ── Question Form ─────────────────────────────────────────────────────────────

// ── Word Bank Editor (inside QuestionForm) ─────────────────────────────────────
function WordBankEditor({ q, set }) {
  const segments = q.segments || [];
  const wordBank = q.wordBank || [];
  const blankCount = segments.filter(s=>s.type==="blank").length;

  const addWord = () => set("wordBank", [...wordBank, ""]);
  const updateWord = (i, v) => { const w=[...wordBank]; w[i]=v; set("wordBank",w); };
  const removeWord = (i) => set("wordBank", wordBank.filter((_,j)=>j!==i));

  // Segments editor: text chunks + blank markers
  const addText  = () => set("segments", [...segments, { type:"text",  content:"" }]);
  const addBlank = () => set("segments", [...segments, { type:"blank", id: blankCount }]);
  const updateSeg = (i, v) => { const s=[...segments]; s[i]={...s[i],content:v}; set("segments",s); };
  const removeSeg = (i) => {
    const s = segments.filter((_,j)=>j!==i);
    // re-index blanks
    let bi=0; s.forEach(seg=>{ if(seg.type==="blank") seg.id=bi++; });
    set("segments",s);
  };

  // Correct answers: ordered list matching blanks
  const correct = q.correct || [];
  const updateCorrect = (blankIdx, word) => {
    const c = [...correct];
    c[blankIdx] = word;
    set("correct", c);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* Sentence builder */}
      <div>
        <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", display:"block", marginBottom:10 }}>
          Sentence / Text Segments
        </label>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ background: seg.type==="blank"?"#f472b622":"#1e293b", color: seg.type==="blank"?"#f472b6":C.muted, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, width:52, textAlign:"center", flexShrink:0 }}>
                {seg.type==="blank" ? `Blank ${seg.id+1}` : "Text"}
              </span>
              {seg.type==="text"
                ? <input value={seg.content} onChange={e=>updateSeg(i,e.target.value)}
                    placeholder="Enter text..."
                    style={{ flex:1, background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:9, padding:"8px 12px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }} />
                : <span style={{ flex:1, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#f472b6" }}>[ blank slot ]</span>
              }
              <button onClick={()=>removeSeg(i)} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:15, padding:"4px" }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <button onClick={addText} style={{ background:"transparent", border:`1px dashed ${C.border2}`, borderRadius:9, padding:"7px 14px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>+ Text chunk</button>
          <button onClick={addBlank} style={{ background:"#f472b612", border:`1px dashed #f472b644`, borderRadius:9, padding:"7px 14px", color:"#f472b6", fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>+ Blank slot</button>
        </div>
      </div>

      {/* Word bank */}
      <div>
        <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", display:"block", marginBottom:10 }}>
          Word Bank (all available words, including distractors)
        </label>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {wordBank.map((w,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input value={w} onChange={e=>updateWord(i,e.target.value)} placeholder={`Word ${i+1}...`}
                style={{ flex:1, background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:9, padding:"8px 12px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }} />
              <button onClick={()=>removeWord(i)} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:15, padding:"4px" }}>✕</button>
            </div>
          ))}
          <button onClick={addWord} style={{ background:"transparent", border:`1px dashed ${C.border2}`, borderRadius:9, padding:"7px 14px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer", marginTop:2 }}>
            + Add word
          </button>
        </div>
      </div>

      {/* Correct answers per blank */}
      {blankCount > 0 && (
        <div>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", display:"block", marginBottom:10 }}>
            Correct Answer per Blank
          </label>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {Array.from({length:blankCount}).map((_,bi)=>(
              <div key={bi} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#f472b6", fontWeight:700, width:60 }}>Blank {bi+1}</span>
                <select value={correct[bi]||""} onChange={e=>updateCorrect(bi,e.target.value)}
                  style={{ flex:1, background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:9, padding:"8px 12px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }}>
                  <option value="">— select correct word —</option>
                  {wordBank.filter(Boolean).map(w=><option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Question Form ───────────────────────────────────────────────────────────────
function QuestionForm({ initial, onSave, onCancel }) {
  const isEdit = !!initial;
  const blank = { type:"single_choice", level:"B1", section:"Reading", points:1, status:"draft", text:"", options:["","","",""], correct:0 };
  const [q, setQ] = useState(initial ? {...initial, options: initial.options ? [...initial.options] : ["","","",""] } : blank);
  const set = (k,v) => setQ(p=>({...p,[k]:v}));

  const toggleCorrect = (i) => {
    if (["single_choice","audio","video"].includes(q.type)) { set("correct", i); }
    else {
      const cur = Array.isArray(q.correct) ? q.correct : [];
      set("correct", cur.includes(i) ? cur.filter(x=>x!==i) : [...cur, i]);
    }
  };
  const isCorrect = (i) => Array.isArray(q.correct) ? q.correct.includes(i) : q.correct===i;

  const hasOptions = ["single_choice","multi_choice","multi_select","audio","video"].includes(q.type);
  const hasMedia   = ["audio","video"].includes(q.type);
  const hasBlank    = q.type==="fill_blank";
  const hasWordBank = q.type==="fill_wordbank";
  const hasWriting  = q.type==="writing";
  const hasVoice    = q.type==="voice";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      {/* Type selector */}
      <div>
        <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", display:"block", marginBottom:10 }}>Question type</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {QTYPES.map(t=>(
            <button key={t.id} onClick={()=>set("type",t.id)} style={{ background:q.type===t.id?(t.color+"20"):"transparent", border:`1.5px solid ${q.type===t.id?t.color:C.border}`, borderRadius:10, padding:"8px 14px", color:q.type===t.id?t.color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", gap:6 }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row: level + section + points + status */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px 100px", gap:14 }}>
        <Select label="Level" value={q.level} onChange={v=>set("level",v)} options={LEVELS} />
        <Select label="Section" value={q.section} onChange={v=>set("section",v)} options={SECTIONS} />
        <Input label="Points" value={q.points} onChange={v=>set("points",+v)} type="number" />
        <Select label="Status" value={q.status} onChange={v=>set("status",v)} options={[{value:"draft",label:"Draft"},{value:"published",label:"Published"}]} />
      </div>

      {/* Question text */}
      <Textarea label="Հարցի տեքստ" value={q.text} onChange={v=>set("text",v)} placeholder="Write the question in Armenian..." rows={3} />

      {/* Media upload */}
      {hasMedia && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {q.type==="audio" && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <UploadZone label="🎧 Audio file" accept="audio/*" icon="🎧" hint="MP3, WAV, OGG · max 50MB"
                fileName={q.audioSrc ? (q.audioSrc.split("/").pop().split("?")[0] || "audio") : null}
                onFile={f => { const url = URL.createObjectURL(f); set("audioSrc", url); set("_audioFile", f); }}
                onClear={() => { set("audioSrc", ""); set("_audioFile", null); }}
              />
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input value={q.audioSrc||""} onChange={e=>set("audioSrc",e.target.value)}
                  placeholder="or URL: https://..."
                  style={{ flex:1, background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:8, padding:"7px 12px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }}
                />
                {q.audioSrc && <button onClick={()=>{ set("audioSrc",""); set("_audioFile",null); }} style={{ background:"transparent", border:"none", color:"#f87171", cursor:"pointer", fontSize:16, padding:"0 4px" }} title="Clear">✕</button>}
              </div>
              {q.audioSrc && <audio controls src={q.audioSrc} style={{ width:"100%", accentColor:C.gold }} preload="metadata" />}
            </div>
          )}
          {q.type==="video" && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <UploadZone label="🎬 Video file" accept="video/*" icon="🎬" hint="MP4, WebM · max 500MB"
                fileName={q.videoSrc ? (q.videoSrc.split("/").pop().split("?")[0] || "video") : null}
                onFile={f => { const url = URL.createObjectURL(f); set("videoSrc", url); set("_videoFile", f); }}
                onClear={() => { set("videoSrc", ""); set("_videoFile", null); }}
              />
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input value={q.videoSrc||""} onChange={e=>set("videoSrc",e.target.value)}
                  placeholder="or URL: https://..."
                  style={{ flex:1, background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:8, padding:"7px 12px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }}
                />
                {q.videoSrc && <button onClick={()=>{ set("videoSrc",""); set("_videoFile",null); }} style={{ background:"transparent", border:"none", color:"#f87171", cursor:"pointer", fontSize:16, padding:"0 4px" }} title="Clear">✕</button>}
              </div>
              {q.videoSrc && <video controls src={q.videoSrc} style={{ width:"100%", borderRadius:8, maxHeight:180 }} preload="metadata" />}
            </div>
          )}
          <UploadZone label="Image (optional)" accept="image/*" icon="🖼" hint="PNG, JPG, WebP · max 5MB"
            fileName={q.imageSrc ? (q.imageSrc.split("/").pop().split("?")[0] || "image") : null}
            onFile={f => { const url = URL.createObjectURL(f); set("imageSrc", url); }}
            onClear={() => set("imageSrc", "")}
          />
        </div>
      )}
      {!hasMedia && (
        <UploadZone label="Image (optional)" accept="image/*" icon="🖼" hint="PNG, JPG, WebP · max 5MB"
          fileName={q.imageSrc ? (q.imageSrc.split("/").pop().split("?")[0] || "image") : null}
          onFile={f => { const url = URL.createObjectURL(f); set("imageSrc", url); }}
          onClear={() => set("imageSrc", "")}
        />
      )}

      {/* Replay settings for audio/video */}
      {hasMedia && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Select label="Repeat count" value={q.maxPlays||2} onChange={v=>set("maxPlays",+v)} options={[{value:1,label:"1 անգամ"},{value:2,label:"2 անգամ"},{value:3,label:"3 անգամ"}]} />
          <Select label="Pause between" value={q.pauseSeconds||20} onChange={v=>set("pauseSeconds",+v)} options={[{value:20,label:"20 վ"},{value:25,label:"25 վ"},{value:30,label:"30 վ"}]} />
        </div>
      )}

      {/* Options */}
      {hasOptions && (
        <div>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.5, textTransform:"uppercase", display:"block", marginBottom:10 }}>
            Answer options
            <span style={{ marginLeft:8, color:C.gold, fontSize:10 }}>· green = correct</span>
          </label>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {(q.options||[]).map((opt,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <button onClick={()=>toggleCorrect(i)} style={{ width:30, height:30, borderRadius:["single_choice","audio","video"].includes(q.type)?"50%":"6px", border:`2px solid ${isCorrect(i)?C.success:C.border2}`, background:isCorrect(i)?C.success+"22":"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                  {isCorrect(i) && <svg width={13} height={13} viewBox="0 0 13 13"><path d="M2 7l3 3 6-6" stroke={C.success} strokeWidth={2} fill="none" strokeLinecap="round"/></svg>}
                </button>
                <input value={opt} onChange={e=>{const a=[...q.options];a[i]=e.target.value;set("options",a)}} placeholder={`Տ ${i+1}...`}
                  style={{ flex:1, background:C.panel, border:`1.5px solid ${isCorrect(i)?C.success+"44":C.border2}`, borderRadius:10, padding:"9px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", transition:"border .15s" }}
                />
                {q.options.length > 2 && (
                  <button onClick={()=>{const a=q.options.filter((_,j)=>j!==i);set("options",a)}} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:16, padding:"4px 6px" }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={()=>set("options",[...q.options,""])} style={{ background:"transparent", border:`1px dashed ${C.border2}`, borderRadius:10, padding:"9px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", marginTop:4 }}>
              + Add option
            </button>
          </div>
        </div>
      )}

      {/* Fill blank */}
      {hasBlank && <Input label="Correct answer" value={q.answer||""} onChange={v=>set("answer",v)} placeholder="Type correct word..." />}

      {/* Fill Word Bank editor */}
      {hasWordBank && (
        <WordBankEditor q={q} set={set} />
      )}

      {/* Writing */}
      {hasWriting && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Input label="Min words" value={q.minWords||150} onChange={v=>set("minWords",+v)} type="number" />
          <Input label="Max words" value={q.maxWords||200} onChange={v=>set("maxWords",+v)} type="number" />
        </div>
      )}

      {/* Voice settings */}
      {hasVoice && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          <Input label="Max Attempts" value={q.maxAttempts||3} onChange={v=>set("maxAttempts",+v)} type="number" />
          <Input label="Min seconds" value={q.minSeconds||10} onChange={v=>set("minSeconds",+v)} type="number" />
          <Input label="Max seconds" value={q.maxSeconds||90} onChange={v=>set("maxSeconds",+v)} type="number" />
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
        <button onClick={onCancel} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 22px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:14, cursor:"pointer" }}>Cancel</button>
        <button onClick={()=>onSave(q)} style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, border:"none", borderRadius:10, padding:"10px 28px", color:"white", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:`0 4px 16px ${C.gold}44` }}>
          {isEdit ? "✓ Save" : "✓ Create"}
        </button>
      </div>
    </div>
  );
}

// ── Question Row ──────────────────────────────────────────────────────────────
function QRow({ q, onEdit, onDelete, onToggleStatus, onView }) {
  const t = qtype(q.type);
  const lc = LEVEL_COLORS[q.level]||"#94a3b8";
  return (
    <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 90px 70px 90px 90px 130px", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:`1px solid ${C.border}`, transition:"background .15s" }}
      onMouseEnter={e=>e.currentTarget.style.background=C.card}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, fontWeight:500 }}>#{q.id}</span>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%" }}>{q.text}</div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:13 }}>{t.icon}</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:t.color }}>{t.label}</span>
          <span style={{ color:C.border }}>·</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{q.section}</span>
        </div>
      </div>
      <span style={{ background:lc+"18", color:lc, border:`1px solid ${lc}33`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", textAlign:"center" }}>{q.level}</span>
      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.gold, fontWeight:600, textAlign:"center" }}>{q.points}pt</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, textAlign:"center" }}>{q.createdAt}</span>
      <button onClick={()=>onToggleStatus(q.id)} style={{ background:q.status==="published"?C.success+"18":"#f59e0b18", border:`1px solid ${q.status==="published"?C.success+"44":"#f59e0b44"}`, borderRadius:6, padding:"4px 10px", color:q.status==="published"?C.success:"#f59e0b", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer" }}>
        {q.status==="published"?"● Published":"○ Draft"}
      </button>
      <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
        <button onClick={()=>onView(q)} title="View" style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:7, padding:"5px 11px", color:C.info||"#60a5fa", fontSize:13, cursor:"pointer" }}>👁</button>
        <button onClick={()=>onEdit(q)} title="Edit" style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:7, padding:"5px 11px", color:C.muted, fontSize:13, cursor:"pointer" }}>✎</button>
        <button onClick={()=>onDelete(q.id)} title="Delete" style={{ background:"transparent", border:`1px solid #f8717130`, borderRadius:7, padding:"5px 11px", color:"#f87171", fontSize:13, cursor:"pointer" }}>✕</button>
      </div>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ questions }) {
  const total = questions.length;
  const pub = questions.filter(q=>q.status==="published").length;
  const byLevel = LEVELS.map(l=>({ l, n:questions.filter(q=>q.level===l).length }));
  return (
    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
      {[
        { label:"Total", value:total, color:C.gold },
        { label:"Published", value:pub, color:C.success },
        { label:"Draft", value:total-pub, color:"#f59e0b" },
      ].map(s=>(
        <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 20px", minWidth:100 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:s.color }}>{s.value}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, marginTop:2 }}>{s.label}</div>
        </div>
      ))}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 20px", display:"flex", gap:10, alignItems:"center" }}>
        {byLevel.map(({l,n})=>(
          <div key={l} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:LEVEL_COLORS[l]||"#94a3b8" }}>{n}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000090", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:C.panel, border:`1px solid ${C.border2}`, borderRadius:20, padding:"32px 36px", width:"100%", maxWidth:700, maxHeight:"90vh", overflowY:"auto", animation:"fadeSlideIn .3s ease", boxShadow:"0 32px 80px #00000099" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:C.text, margin:0, fontWeight:600 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:8, width:34, height:34, color:C.muted, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  { id:"questions", icon:"📋", label:"Հարցեր" },
  { id:"exams",     icon:"🎓", label:"Քննություններ" },
  { id:"students",  icon:"👤", label:"Ուսանողներ" },
  { id:"results",   icon:"📊", label:"Արդյունքներ" },
  { id:"media",     icon:"📁", label:"Files" },
  { id:"settings",  icon:"⚙️",  label:"Կարգավ." },
];

function Sidebar({ active, onNav }) {
  return (
    <aside style={{ width:220, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, height:"100vh", position:"sticky", top:0 }}>
      {/* Logo */}
      <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:"white" }}>Հ</div>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700, color:C.text, letterSpacing:.5 }}>ArmExam</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:C.muted, letterSpacing:1.5, textTransform:"uppercase" }}>Admin Panel</div>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav style={{ flex:1, padding:"14px 12px", display:"flex", flexDirection:"column", gap:3 }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>onNav(n.id)} style={{ background:active===n.id?C.gold+"18":"transparent", border:`1px solid ${active===n.id?C.gold+"44":"transparent"}`, borderRadius:10, padding:"10px 14px", color:active===n.id?C.gold:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:active===n.id?600:400, cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left", transition:"all .15s" }}>
            <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      {/* User */}
      <div style={{ padding:"16px 20px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,#334155,#1e293b)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>👤</div>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text, fontWeight:500 }}>Admin</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted }}>Examinator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}


// ── View Question Modal ───────────────────────────────────────────────────────
function ViewQuestion({ q, onEdit, onClose }) {
  const t = qtype(q.type);
  const lc = LEVEL_COLORS[q.level] || "#94a3b8";
  const hasOptions = q.options && q.options.length > 0;

  const correctLabel = (idx) => {
    if (Array.isArray(q.correct)) return q.correct.includes(idx);
    return q.correct === idx;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* Meta row */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ background:lc+"18", color:lc, border:`1px solid ${lc}33`, borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{q.level}</span>
        <span style={{ background:t.color+"18", color:t.color, border:`1px solid ${t.color}33`, borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{t.icon} {t.label}</span>
        <span style={{ background:C.dim, color:C.muted, borderRadius:6, padding:"3px 10px", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{q.section}</span>
        <span style={{ background:q.status==="published"?C.success+"18":"#f59e0b18", color:q.status==="published"?C.success:"#f59e0b", border:`1px solid ${q.status==="published"?C.success+"44":"#f59e0b44"}`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", marginLeft:"auto" }}>
          {q.status==="published" ? "● Published" : "○ Draft"}
        </span>
      </div>

      {/* Question text */}
      <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 24px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>Question Text</div>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, lineHeight:1.7, margin:0 }}>{q.text}</p>
      </div>

      {/* Audio player preview */}
      {q.type === "audio" && q.audioSrc && (
        <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:12 }}>Audio File</div>
          <audio controls src={q.audioSrc} style={{ width:"100%", accentColor:C.gold }} preload="metadata" />
          {q.maxPlays && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginTop:8 }}>
            Max plays: <strong style={{color:C.gold}}>{q.maxPlays}×</strong>
            {q.pauseSeconds ? <> · Pause between plays: <strong style={{color:C.gold}}>{q.pauseSeconds}s</strong></> : null}
          </div>}
        </div>
      )}

      {/* Video player preview */}
      {q.type === "video" && q.videoSrc && (
        <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:12 }}>Video File</div>
          <video controls src={q.videoSrc} style={{ width:"100%", borderRadius:8, maxHeight:300 }} preload="metadata" />
          {q.maxPlays && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginTop:8 }}>
            Max plays: <strong style={{color:C.gold}}>{q.maxPlays}×</strong>
          </div>}
        </div>
      )}

      {/* Options */}
      {hasOptions && (
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>
            Answer Options {Array.isArray(q.correct) ? "(multiple correct)" : "(one correct)"}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {q.options.map((opt, i) => {
              const isCorrect = correctLabel(i);
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:isCorrect?C.success+"0d":C.panel, border:`1.5px solid ${isCorrect?C.success+"55":C.border}`, borderRadius:10 }}>
                  <div style={{ width:22, height:22, borderRadius:Array.isArray(q.correct)?4:"50%", border:`2px solid ${isCorrect?C.success:C.border2}`, background:isCorrect?C.success:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {isCorrect && <svg width={12} height={12} viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} strokeLinecap="round" fill="none"/></svg>}
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:isCorrect?C.success:C.text, fontWeight:isCorrect?600:400 }}>{opt}</span>
                  {isCorrect && <span style={{ marginLeft:"auto", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.success, fontWeight:700 }}>✓ Correct</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fill blank answer */}
      {q.type === "fill_blank" && q.answer && (
        <div style={{ background:C.success+"0d", border:`1px solid ${C.success}44`, borderRadius:12, padding:"14px 18px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:6 }}>Correct Answer</div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, color:C.success, fontWeight:700 }}>{q.answer}</span>
        </div>
      )}

      {/* Word Bank preview */}
      {q.type === "fill_wordbank" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Sentence with blanks */}
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>Sentence</div>
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 22px", fontFamily:"'Cormorant Garamond',serif", fontSize:19, color:C.text, lineHeight:2.2 }}>
              {(q.segments || []).map((seg, i) => {
                if (seg.type === "text") return <span key={i}>{seg.content}</span>;
                // blank slot — show correct word if available
                const correctWord = (q.correct || [])[seg.id] !== undefined
                  ? (q.wordBank || [])[(q.correct || [])[seg.id]]
                  : null;
                return (
                  <span key={i} style={{
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    minWidth:80, height:32, margin:"0 4px",
                    borderRadius:7, border:`2px dashed ${C.success}88`,
                    background:C.success+"0d", padding:"0 10px", verticalAlign:"middle",
                    fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.success, fontWeight:600,
                  }}>
                    {correctWord || `_${seg.id+1}_`}
                  </span>
                );
              })}
            </div>
          </div>
          {/* Word bank */}
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>
              Word Bank ({(q.wordBank||[]).length} words)
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {(q.wordBank || []).filter(Boolean).map((w, i) => (
                <span key={i} style={{
                  background:C.info+"15", color:C.info,
                  border:`1.5px solid ${C.info}44`,
                  borderRadius:8, padding:"6px 14px",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500,
                }}>
                  {w}
                </span>
              ))}
            </div>
          </div>
          {/* Correct order */}
          {q.correct && q.correct.length > 0 && (
            <div style={{ background:C.success+"0d", border:`1px solid ${C.success}33`, borderRadius:10, padding:"12px 16px" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:8 }}>Correct Order</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                {(q.correct || []).map((wi, i) => (
                  <span key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>#{i+1}</span>
                    <span style={{ background:C.success+"18", color:C.success, border:`1px solid ${C.success}44`, borderRadius:6, padding:"3px 10px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600 }}>
                      {(q.wordBank||[])[wi] || `word[${wi}]`}
                    </span>
                    {i < (q.correct||[]).length-1 && <span style={{ color:C.muted, fontSize:10 }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Writing limits */}
      {q.minWords && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[["Min Words", q.minWords], ["Max Words", q.maxWords], ["Points", q.points]].map(([l,v])=>(
            <div key={l} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", textAlign:"center" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, marginBottom:4 }}>{l}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:C.gold, fontWeight:700 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Info row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 16px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted }}>Points</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.gold, fontWeight:700 }}>{q.points} pt</div>
        </div>
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 16px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted }}>Created</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, marginTop:3 }}>{q.createdAt}</div>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
        <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 22px", color:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:14, cursor:"pointer" }}>Close</button>
        <button onClick={onEdit} style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, border:"none", borderRadius:10, padding:"10px 24px", color:"white", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:`0 4px 14px ${C.gold}44` }}>✎ Edit This Question</button>
      </div>
    </div>
  );
}

// ── Questions Page ─────────────────────────────────────────────────────────────
function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
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
    api.getQuestions().then(data => { setQuestions(data); setLoading(false); });
  }, []);

  const filtered = questions.filter(q => {
    if (filterType!=="all" && q.type!==filterType) return false;
    if (filterLevel!=="all" && q.level!==filterLevel) return false;
    if (filterStatus!=="all" && q.status!==filterStatus) return false;
    if (filterSection!=="all" && q.section!==filterSection) return false;
    if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !String(q.id).includes(search)) return false;
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
          {SECTIONS.map(s=><Pill key={s} label={s} active={filterSection===s} onClick={()=>setFilterSection(s)} />)}
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
          <QuestionForm initial={editing} onSave={handleSave} onCancel={()=>{setModal(null);setEditing(null)}} />
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
  return (
    <>
      <style>{`
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
        select option{background:#080f1a}
      `}</style>
      <QuestionsPage />
    </>
  );
}
