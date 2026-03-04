import { useState, useRef, useCallback } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');`;

const C = {
  bg:"#04080f", panel:"#080f1a", card:"#0d1829", border:"#1a2540",
  border2:"#243050", gold:"#c8a96e", goldDim:"#7c5830",
  text:"#e2e8f0", muted:"#475569", dim:"#1e293b",
  success:"#22c55e", danger:"#f87171", warning:"#f59e0b", info:"#60a5fa", purple:"#a78bfa",
  info:"#60a5fa", purple:"#a78bfa",
};

// ── File type config ──────────────────────────────────────────────────────────
const FILE_TYPES = {
  audio: { label:"Audio", icon:"🎧", color:"#f59e0b", accept:"audio/*", exts:["mp3","wav","ogg","m4a","flac"] },
  video: { label:"Video", icon:"🎬", color:"#f87171", accept:"video/*", exts:["mp4","webm","mov","avi","mkv"] },
  image: { label:"Image", icon:"🖼",  color:"#60a5fa", accept:"image/*", exts:["jpg","jpeg","png","webp","gif","svg"] },
  doc:   { label:"Doc",   icon:"📄", color:"#a78bfa", accept:".pdf,.doc,.docx,.txt", exts:["pdf","doc","docx","txt"] },
};

function getFileType(name) {
  const ext = name.split(".").pop().toLowerCase();
  for (const [type, cfg] of Object.entries(FILE_TYPES)) {
    if (cfg.exts.includes(ext)) return type;
  }
  return "doc";
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/(1024*1024)).toFixed(1) + " MB";
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("ru-RU", { day:"2-digit", month:"short", year:"numeric" });
}

// ── Seed files ────────────────────────────────────────────────────────────────
const SEED_FILES = [
  { id:1,  name:"listening_b1_track1.mp3",  type:"audio", size:2340000,  folder:"audio/b1",   usedIn:["Ամ. B1 Ք."],  uploadedAt:"2025-01-10", tags:["b1","listening"] },
  { id:2,  name:"listening_b2_interview.mp3",type:"audio", size:4100000,  folder:"audio/b2",   usedIn:["B2 Պ. Ք."],   uploadedAt:"2025-01-15", tags:["b2","interview"] },
  { id:3,  name:"c1_lecture_excerpt.mp3",   type:"audio", size:6800000,  folder:"audio/c1",   usedIn:["C1–C2 Բ. Մ."],uploadedAt:"2025-02-01", tags:["c1","lecture"] },
  { id:4,  name:"video_discussion_b2.mp4",  type:"video", size:45000000, folder:"video/b2",   usedIn:["B2 Պ. Ք."],   uploadedAt:"2025-02-10", tags:["b2","discussion"] },
  { id:5,  name:"video_news_c1.mp4",        type:"video", size:78000000, folder:"video/c1",   usedIn:["C1–C2 Բ. Մ."],uploadedAt:"2025-02-12", tags:["c1","news"] },
  { id:6,  name:"reading_passage_a2.jpg",   type:"image", size:320000,   folder:"images/a2",  usedIn:["A2 Ախ. Փ."], uploadedAt:"2025-01-20", tags:["a2","reading"] },
  { id:7,  name:"grammar_table_b1.png",     type:"image", size:180000,   folder:"images/b1",  usedIn:["Ամ. B1 Ք."], uploadedAt:"2025-01-22", tags:["b1","grammar"] },
  { id:8,  name:"vocabulary_chart_b2.png",  type:"image", size:240000,   folder:"images/b2",  usedIn:[],             uploadedAt:"2025-03-01", tags:["b2"] },
  { id:9,  name:"exam_instructions_hy.pdf", type:"doc",   size:520000,   folder:"docs",       usedIn:["Բոլոր"],      uploadedAt:"2025-01-05", tags:["instructions","hy"] },
  { id:10, name:"sample_writing_c2.pdf",    type:"doc",   size:380000,   folder:"docs",       usedIn:["C1–C2 Բ. Մ."],uploadedAt:"2025-02-20", tags:["c2","writing"] },
  { id:11, name:"a1_intro_track.mp3",       type:"audio", size:1200000,  folder:"audio/a1",   usedIn:[],             uploadedAt:"2025-03-05", tags:["a1"] },
  { id:12, name:"map_exercise_b1.webp",     type:"image", size:290000,   folder:"images/b1",  usedIn:[],             uploadedAt:"2025-03-10", tags:["b1","map"] },
];

const FOLDERS = ["Բոլոր", "audio/a1", "audio/b1", "audio/b2", "audio/c1", "video/b2", "video/c1", "images/a2", "images/b1", "images/b2", "docs"];

// ── UI Atoms ──────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant="ghost", small, disabled, style={} }) {
  const base = { fontFamily:"'DM Sans',sans-serif", fontSize:small?11:13, fontWeight:600, borderRadius:9, padding:small?"5px 12px":"9px 18px", cursor:disabled?"not-allowed":"pointer", border:"none", transition:"all .15s", opacity:disabled?.5:1, ...style };
  const v = {
    primary: { background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, color:"white", boxShadow:`0 3px 12px ${C.gold}44` },
    ghost:   { background:"transparent", color:C.muted, border:`1px solid ${C.border2}` },
    danger:  { background:"#f8717114", color:C.danger, border:`1px solid #f8717130` },
    success: { background:C.success+"14", color:C.success, border:`1px solid ${C.success}30` },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
}

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"#000000a8",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{ background:C.panel,border:`1px solid ${C.border2}`,borderRadius:22,padding:"32px 36px",width:"100%",maxWidth:wide?820:560,maxHeight:"92vh",overflowY:"auto",animation:"fadeSlideIn .3s ease",boxShadow:"0 32px 80px #000000cc" }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22 }}>
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:C.text,margin:"0 0 3px",fontWeight:600 }}>{title}</h2>
            {subtitle && <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,margin:0 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${C.border2}`,borderRadius:8,width:32,height:32,color:C.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUpload }) {
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState([]);
  const inputRef = useRef();

  const processFiles = useCallback((fileList) => {
    const files = Array.from(fileList);
    const newUploads = files.map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: f.size,
      type: getFileType(f.name),
      progress: 0,
      done: false,
    }));
    setUploading(prev => [...prev, ...newUploads]);

    // Simulate upload progress
    newUploads.forEach(u => {
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 25 + 10;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
          setUploading(prev => prev.map(x => x.id===u.id ? {...x,progress:100,done:true} : x));
          setTimeout(() => {
            setUploading(prev => prev.filter(x => x.id!==u.id));
            onUpload({
              id: Date.now(),
              name: u.name,
              type: u.type,
              size: u.size,
              folder: "audio/b1",
              usedIn: [],
              uploadedAt: new Date().toISOString().slice(0,10),
              tags: [],
            });
          }, 800);
        } else {
          setUploading(prev => prev.map(x => x.id===u.id ? {...x,progress:Math.round(prog)} : x));
        }
      }, 180);
    });
  }, [onUpload]);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);processFiles(e.dataTransfer.files)}}
        style={{ border:`2px dashed ${drag?C.gold:C.border2}`,borderRadius:16,padding:"36px 24px",textAlign:"center",cursor:"pointer",transition:"all .2s",background:drag?C.gold+"06":"transparent" }}>
        <div style={{ fontSize:36,marginBottom:10 }}>{drag?"📂":"⬆️"}</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:drag?C.gold:C.text,marginBottom:6 }}>
          {drag ? "Drop to upload!" : "Drop files here or click to browse"}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,marginBottom:16 }}>
          Drag & drop · կամ սեղ.
        </div>
        <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
          {Object.values(FILE_TYPES).map(t=>(
            <span key={t.label} style={{ background:t.color+"18",color:t.color,border:`1px solid ${t.color}33`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>
              {t.icon} {t.exts.slice(0,3).join(", ")}
            </span>
          ))}
        </div>
        <input ref={inputRef} type="file" multiple style={{ display:"none" }}
          accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt"
          onChange={e=>processFiles(e.target.files)} />
      </div>

      {/* Upload progress list */}
      {uploading.length > 0 && (
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          {uploading.map(u => {
            const ft = FILE_TYPES[u.type];
            return (
              <div key={u.id} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>{ft.icon}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.name}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:u.done?C.success:C.gold }}>{u.done?"✓":"↑"} {u.progress}%</span>
                </div>
                <div style={{ height:3,background:C.dim,borderRadius:2,overflow:"hidden" }}>
                  <div style={{ width:`${u.progress}%`,height:"100%",background:u.done?C.success:C.gold,transition:"width .2s",borderRadius:2 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── File Card (Grid view) ─────────────────────────────────────────────────────
function FileCard({ file, selected, onSelect, onPreview, onDelete }) {
  const ft = FILE_TYPES[file.type];
  return (
    <div
      onClick={() => onSelect(file.id)}
      style={{ background:selected?ft.color+"10":C.card, border:`1.5px solid ${selected?ft.color:C.border}`, borderRadius:14, padding:"16px", cursor:"pointer", transition:"all .15s", position:"relative" }}>
      {/* Checkbox */}
      <div style={{ position:"absolute",top:10,left:10,width:18,height:18,borderRadius:4,border:`2px solid ${selected?ft.color:C.border2}`,background:selected?ft.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1 }}>
        {selected && <svg width={10} height={10} viewBox="0 0 10 10"><path d="M1.5 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg>}
      </div>

      {/* Thumbnail / icon area */}
      <div style={{ height:90,background:C.panel,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,position:"relative",overflow:"hidden" }}>
        {file.type==="image" ? (
          <div style={{ width:"100%",height:"100%",background:`linear-gradient(135deg,${ft.color}22,${ft.color}08)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <span style={{ fontSize:32 }}>{ft.icon}</span>
          </div>
        ) : (
          <>
            <span style={{ fontSize:36 }}>{ft.icon}</span>
            {file.type==="audio" && (
              <div style={{ position:"absolute",bottom:8,left:8,right:8,display:"flex",gap:2,alignItems:"flex-end",height:20 }}>
                {Array.from({length:16}).map((_,i)=>(
                  <div key={i} style={{ flex:1,background:ft.color+"66",borderRadius:1,height:`${20+Math.sin(i*1.2)*12}%` }} />
                ))}
              </div>
            )}
            {file.type==="video" && (
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,#0d182988,#04080f88)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:ft.color+"44",border:`1px solid ${ft.color}88`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <svg width={10} height={10} viewBox="0 0 10 10"><polygon points="2,1 9,5 2,9" fill={ft.color}/></svg>
                </div>
              </div>
            )}
          </>
        )}
        {/* Preview button on hover */}
        <button onClick={e=>{e.stopPropagation();onPreview(file)}} style={{ position:"absolute",top:6,right:6,width:24,height:24,borderRadius:6,background:"#00000088",border:"none",color:"white",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          👁
        </button>
      </div>

      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4 }} title={file.name}>
        {file.name}
      </div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted }}>{fmtSize(file.size)}</span>
        <span style={{ background:ft.color+"18",color:ft.color,border:`1px solid ${ft.color}33`,borderRadius:5,padding:"1px 6px",fontSize:9,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{ft.label}</span>
      </div>
      {file.usedIn.length > 0 && (
        <div style={{ marginTop:6,fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.success }}>● {file.usedIn.length} exam{file.usedIn.length>1?"s":""}</div>
      )}
    </div>
  );
}

// ── File Row (List view) ──────────────────────────────────────────────────────
function FileRow({ file, selected, onSelect, onPreview, onDelete }) {
  const ft = FILE_TYPES[file.type];
  return (
    <div onClick={()=>onSelect(file.id)} style={{ display:"grid",gridTemplateColumns:"32px 40px 1fr 100px 90px 120px 80px 80px",gap:12,alignItems:"center",padding:"11px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:selected?ft.color+"08":"transparent",transition:"background .15s" }}
      onMouseEnter={e=>{ if(!selected) e.currentTarget.style.background=C.panel }}
      onMouseLeave={e=>{ if(!selected) e.currentTarget.style.background="transparent" }}>
      <div style={{ width:18,height:18,borderRadius:4,border:`2px solid ${selected?ft.color:C.border2}`,background:selected?ft.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        {selected && <svg width={10} height={10} viewBox="0 0 10 10"><path d="M1.5 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg>}
      </div>
      <span style={{ fontSize:20,textAlign:"center" }}>{ft.icon}</span>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{file.name}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted }}>{file.folder}</div>
      </div>
      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>{fmtSize(file.size)}</span>
      <span style={{ background:ft.color+"18",color:ft.color,border:`1px solid ${ft.color}33`,borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{ft.label}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{fmtDate(file.uploadedAt)}</span>
      <div>
        {file.usedIn.length>0
          ? <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.success }}>● {file.usedIn.length}</span>
          : <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>—</span>}
      </div>
      <div style={{ display:"flex",gap:5 }} onClick={e=>e.stopPropagation()}>
        <button onClick={()=>onPreview(file)} style={{ background:"transparent",border:`1px solid ${C.border2}`,borderRadius:6,padding:"4px 8px",color:C.muted,fontSize:12,cursor:"pointer" }}>👁</button>
        <button onClick={()=>onDelete([file.id])} style={{ background:"transparent",border:`1px solid #f8717130`,borderRadius:6,padding:"4px 8px",color:C.danger,fontSize:12,cursor:"pointer" }}>✕</button>
      </div>
    </div>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ file, onClose, onDelete }) {
  const ft = FILE_TYPES[file.type];
  return (
    <Modal title={file.name} subtitle={`${ft.label} · ${fmtSize(file.size)}`} onClose={onClose}>
      {/* Media preview area */}
      <div style={{ background:C.bg,borderRadius:14,padding:"32px",textAlign:"center",marginBottom:20,border:`1px solid ${C.border}`,minHeight:160,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12 }}>
        {file.type==="audio" && (
          <>
            <span style={{ fontSize:48 }}>🎧</span>
            <div style={{ display:"flex",gap:2,alignItems:"flex-end",height:36 }}>
              {Array.from({length:32}).map((_,i)=>(
                <div key={i} style={{ width:5,background:ft.color+"88",borderRadius:2,height:`${20+Math.abs(Math.sin(i*0.9))*70}%` }} />
              ))}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>Audio preview · {file.name}</div>
          </>
        )}
        {file.type==="video" && (
          <>
            <div style={{ width:120,height:68,background:C.dim,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.border2}` }}>
              <svg width={24} height={24} viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill={ft.color}/></svg>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>Video preview · {file.name}</div>
          </>
        )}
        {file.type==="image" && (
          <>
            <span style={{ fontSize:56 }}>🖼</span>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>Image preview · {file.name}</div>
          </>
        )}
        {file.type==="doc" && (
          <>
            <span style={{ fontSize:48 }}>📄</span>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>Document · {file.name}</div>
          </>
        )}
      </div>

      {/* File details */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20 }}>
        {[
          ["📁 Folder", file.folder],
          ["📦 Size", fmtSize(file.size)],
          ["📅 Uploaded", fmtDate(file.uploadedAt)],
          ["🔗 Used in", file.usedIn.length ? file.usedIn.join(", ") : "Not used"],
        ].map(([l,v])=>(
          <div key={l} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,marginBottom:3 }}>{l}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {file.tags.length > 0 && (
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:20 }}>
          {file.tags.map(t=>(
            <span key={t} style={{ background:C.dim,color:C.muted,borderRadius:6,padding:"3px 9px",fontSize:11,fontFamily:"'DM Sans',sans-serif" }}>#{t}</span>
          ))}
        </div>
      )}

      {/* URL copy */}
      <div style={{ display:"flex",gap:8,marginBottom:20 }}>
        <div style={{ flex:1,background:C.bg,border:`1px solid ${C.border2}`,borderRadius:9,padding:"9px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
          /media/{file.folder}/{file.name}
        </div>
        <Btn small onClick={()=>{}}>📋 Copy</Btn>
      </div>

      <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
        <Btn variant="danger" small onClick={()=>{onDelete([file.id]);onClose()}}>✕ Ջ.</Btn>
        <Btn variant="ghost" small onClick={onClose}>Փ.</Btn>
        <Btn variant="primary" small onClick={()=>{}}>⬇ Բ.</Btn>
      </div>
    </Modal>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ files }) {
  const total = files.length;
  const totalSize = files.reduce((a,f)=>a+f.size,0);
  return (
    <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 20px" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:C.gold }}>{total}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2 }}>Ֆ. ընդ.</div>
      </div>
      {Object.entries(FILE_TYPES).map(([type,ft])=>{
        const n = files.filter(f=>f.type===type).length;
        const sz = files.filter(f=>f.type===type).reduce((a,f)=>a+f.size,0);
        return (
          <div key={type} style={{ background:ft.color+"0a",border:`1px solid ${ft.color}22`,borderRadius:12,padding:"14px 20px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
              <span style={{ fontSize:16 }}>{ft.icon}</span>
              <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:ft.color }}>{n}</span>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted }}>{ft.label} · {fmtSize(sz)}</div>
          </div>
        );
      })}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 20px" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.purple }}>{fmtSize(totalSize)}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2 }}>Ընդ. Չ.</div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────


// ── Media Page ────────────────────────────────────────────────────────────────
function MediaPage() {
  const [files, setFiles] = useState(SEED_FILES);
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState("grid"); // grid | list
  const [filterType, setFilterType] = useState("all");
  const [filterFolder, setFilterFolder] = useState("Բոլոր");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [previewing, setPreviewing] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteIds, setDeleteIds] = useState(null);

  const filtered = files
    .filter(f => {
      if (filterType !== "all" && f.type !== filterType) return false;
      if (filterFolder !== "Բոլոր" && f.folder !== filterFolder) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a,b) => {
      if (sortBy==="name") return a.name.localeCompare(b.name);
      if (sortBy==="size") return b.size - a.size;
      if (sortBy==="date") return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      return 0;
    });

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
  const selectAll = () => setSelected(filtered.map(f=>f.id));
  const clearSelect = () => setSelected([]);
  const handleDelete = (ids) => { setFiles(fs=>fs.filter(f=>!ids.includes(f.id))); setSelected(s=>s.filter(id=>!ids.includes(id))); setDeleteIds(null); };
  const handleUpload = (file) => setFiles(fs=>[file,...fs]);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", boxSizing:"border-box" }}>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:C.text,margin:"0 0 4px",fontWeight:600 }}>Ֆայլերի կ. · Media</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,margin:0 }}>Audio · Video · Images · Documents</p>
        </div>
        <Btn variant="primary" onClick={()=>setShowUpload(true)}>⬆ Վ. ֆ.</Btn>
      </div>

      {/* Stats */}
      <div style={{ marginBottom:24 }}><StatsBar files={files} /></div>

      {/* Toolbar */}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search files..."
          style={{ flex:"1 1 160px",background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:9,padding:"7px 12px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none" }} />

        {/* Type filter */}
        <div style={{ display:"flex",gap:5 }}>
          {[{id:"all",icon:"📁",label:"All",color:C.gold},...Object.entries(FILE_TYPES).map(([id,t])=>({id,icon:t.icon,label:t.label,color:t.color}))].map(t=>(
            <button key={t.id} onClick={()=>setFilterType(t.id)} style={{ background:filterType===t.id?t.color+"22":"transparent",border:`1px solid ${filterType===t.id?t.color:C.border2}`,borderRadius:8,padding:"5px 10px",color:filterType===t.id?t.color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:500,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:4 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ background:C.panel,border:`1px solid ${C.border2}`,borderRadius:9,padding:"6px 10px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",cursor:"pointer" }}>
          <option value="date">Ամ. ↓</option>
          <option value="name">Ան. A–Z</option>
          <option value="size">Չ. ↓</option>
        </select>

        {/* View toggle */}
        <div style={{ display:"flex",gap:4,background:C.panel,borderRadius:9,padding:3,border:`1px solid ${C.border2}` }}>
          {[["grid","⊞"],["list","☰"]].map(([v,icon])=>(
            <button key={v} onClick={()=>setView(v)} style={{ background:view===v?C.gold+"22":"transparent",border:`1px solid ${view===v?C.gold:"transparent"}`,borderRadius:7,padding:"4px 10px",color:view===v?C.gold:C.muted,fontSize:14,cursor:"pointer",transition:"all .15s" }}>{icon}</button>
          ))}
        </div>
      </div>

      {/* Folder sidebar + content */}
      <div style={{ display:"flex",gap:16 }}>
        {/* Folder tree */}
        <div style={{ width:160,flexShrink:0,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 12px",alignSelf:"flex-start" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:10 }}>Թ. · Folders</div>
          {FOLDERS.map(f=>(
            <button key={f} onClick={()=>setFilterFolder(f)} style={{ width:"100%",background:filterFolder===f?C.gold+"18":"transparent",border:`1px solid ${filterFolder===f?C.gold+"44":"transparent"}`,borderRadius:8,padding:"7px 10px",color:filterFolder===f?C.gold:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:6,transition:"all .15s",marginBottom:2 }}>
              <span style={{ fontSize:12 }}>{f==="Բոլոր"?"📂":f.startsWith("audio")?"🎧":f.startsWith("video")?"🎬":f.startsWith("images")?"🖼":"📄"}</span>
              <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f}</span>
            </button>
          ))}
        </div>

        {/* Files area */}
        <div style={{ flex:1 }}>
          {/* Selection bar */}
          {filtered.length > 0 && (
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
              <button onClick={selected.length===filtered.length?clearSelect:selectAll} style={{ background:"transparent",border:`1px solid ${C.border2}`,borderRadius:7,padding:"4px 12px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer" }}>
                {selected.length===filtered.length?"✕ Delete":"☑ Select All"}
              </button>
              {selected.length > 0 && (
                <>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gold }}>{selected.length} ընտ.</span>
                  <Btn small variant="danger" onClick={()=>setDeleteIds(selected)}>✕ Delete Selected</Btn>
                </>
              )}
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginLeft:"auto" }}>{filtered.length} ֆ.</span>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign:"center",padding:"60px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>
              <div style={{ fontSize:40,marginBottom:12 }}>📭</div>
              No files found
            </div>
          ) : view==="grid" ? (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12 }}>
              {filtered.map(f=>(
                <FileCard key={f.id} file={f} selected={selected.includes(f.id)}
                  onSelect={toggleSelect} onPreview={setPreviewing} onDelete={ids=>setDeleteIds(ids)} />
              ))}
            </div>
          ) : (
            <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
              <div style={{ display:"grid",gridTemplateColumns:"32px 40px 1fr 100px 90px 120px 80px 80px",gap:12,padding:"9px 16px",background:C.panel,borderBottom:`1px solid ${C.border}` }}>
                {["","","Name","Size","Type","Uploaded","Used In",""].map((h,i)=>(
                  <span key={i} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8,textTransform:"uppercase" }}>{h}</span>
                ))}
              </div>
              {filtered.map(f=>(
                <FileRow key={f.id} file={f} selected={selected.includes(f.id)}
                  onSelect={toggleSelect} onPreview={setPreviewing} onDelete={ids=>setDeleteIds(ids)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <Modal title="⬆ Upload Files" subtitle="Audio, Video, Images, Documents" onClose={()=>setShowUpload(false)} wide>
          <UploadZone onUpload={(f)=>{ handleUpload(f); }} />
          <div style={{ display:"flex",justifyContent:"flex-end",marginTop:16 }}>
            <Btn onClick={()=>setShowUpload(false)}>Փ. · Close</Btn>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {previewing && (
        <PreviewModal file={previewing} onClose={()=>setPreviewing(null)}
          onDelete={(ids)=>{ handleDelete(ids); setPreviewing(null); }} />
      )}

      {/* Delete confirm */}
      {deleteIds && (
        <Modal title="Delete Files?" onClose={()=>setDeleteIds(null)}>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.muted,marginBottom:20 }}>
            {deleteIds.length} ֆ. · {deleteIds.length} file{deleteIds.length>1?"s":""} will be deleted permanently.
          </p>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <Btn onClick={()=>setDeleteIds(null)}>Չ.</Btn>
            <Btn variant="danger" onClick={()=>handleDelete(deleteIds)}>✕ Ջ.</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function AdminMedia() {
  return (
    <>
      <style>{FONTS}{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#243050;border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
        select option{background:#080f1a}
      `}</style>
      <MediaPage />
    </>
  );
}