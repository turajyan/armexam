import { useState, useRef, useCallback, useEffect } from "react";
import * as api from "../api.js";

const C = { bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",
  gold:"#c8a96e",goldDim:"#7c5830",text:"#e2e8f0",muted:"#475569",
  success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa" };

const TYPE_CFG = {
  image: { label:"Image", icon:"🖼",  color:"#60a5fa", accept:"image/*" },
  audio: { label:"Audio", icon:"🎧", color:"#f59e0b", accept:"audio/*" },
  video: { label:"Video", icon:"🎬", color:"#f87171", accept:"video/*" },
};
const typeOf = (url="") => {
  const ext = url.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","webp","gif","svg","bmp"].includes(ext)) return "image";
  if (["mp3","wav","ogg","m4a","flac","aac"].includes(ext))        return "audio";
  if (["mp4","webm","mov","avi","mkv"].includes(ext))              return "video";
  return "doc";
};
const fmtSize = (b=0) => b < 1024 ? b+"B" : b < 1048576 ? (b/1024).toFixed(1)+"KB" : (b/1048576).toFixed(1)+"MB";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—";

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant="ghost", disabled, style={} }) {
  const vs = {
    primary: { background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"white",boxShadow:`0 3px 12px ${C.gold}44`,border:"none" },
    ghost:   { background:"transparent",color:C.muted,border:`1px solid ${C.border2}` },
    danger:  { background:C.danger+"14",color:C.danger,border:`1px solid ${C.danger}30` },
  };
  return <button onClick={disabled?undefined:onClick} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,
    borderRadius:9,padding:"8px 18px",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.45:1,
    transition:"all .15s",...vs[variant],...style }}>{children}</button>;
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUploaded }) {
  const [drag, setDrag] = useState(false);
  const [uploads, setUploads] = useState([]); // [{id,name,status,error}]
  const inputRef = useRef();

  const doUpload = useCallback(async (files) => {
    for (const file of Array.from(files)) {
      const id = Math.random().toString(36).slice(2);
      setUploads(u => [...u, { id, name:file.name, status:"uploading" }]);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/media/upload", {
          method:"POST",
          headers:{ Authorization:`Bearer ${localStorage.getItem("armexam_admin_token")}` },
          body: form,
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
        const data = await res.json();
        setUploads(u => u.map(x => x.id===id ? { ...x, status:"done" } : x));
        onUploaded(data);
        setTimeout(() => setUploads(u => u.filter(x => x.id!==id)), 1500);
      } catch(e) {
        setUploads(u => u.map(x => x.id===id ? { ...x, status:"error", error:e.message } : x));
      }
    }
  }, [onUploaded]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div onClick={() => inputRef.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);doUpload(e.dataTransfer.files)}}
        style={{ border:`2px dashed ${drag?C.gold:C.border2}`,borderRadius:14,padding:"28px 24px",
          textAlign:"center",cursor:"pointer",transition:"all .2s",background:drag?C.gold+"08":"transparent" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>{drag?"📂":"⬆️"}</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:drag?C.gold:C.text,marginBottom:4 }}>
          {drag ? "Drop to upload" : "Drop files or click to browse"}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>
          image · audio · video — up to 50 MB each
        </div>
        <input ref={inputRef} type="file" multiple accept="image/*,audio/*,video/*"
          style={{ display:"none" }} onChange={e=>doUpload(e.target.files)} />
      </div>

      {uploads.map(u => (
        <div key={u.id} style={{ display:"flex",alignItems:"center",gap:10,background:C.card,
          border:`1px solid ${u.status==="error"?C.danger:u.status==="done"?C.success:C.border}`,
          borderRadius:10,padding:"9px 14px" }}>
          <span style={{ fontSize:13 }}>
            {u.status==="uploading"?"⏳":u.status==="done"?"✅":"❌"}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,flex:1,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.name}</span>
          {u.error && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.danger }}>{u.error}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ file, onClose, onDelete }) {
  const t = TYPE_CFG[file.type] || TYPE_CFG.image;
  return (
    <div style={{ position:"fixed",inset:0,background:"#000000b0",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.panel,border:`1px solid ${C.border2}`,borderRadius:20,
        padding:"28px 32px",width:"100%",maxWidth:700,maxHeight:"90vh",overflowY:"auto",
        boxShadow:"0 32px 80px #000000cc" }}>

        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:22 }}>{t.icon}</span>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,fontWeight:600,
                wordBreak:"break-all" }}>{file.name}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2 }}>
                {fmtSize(file.size)} · {fmtDate(file.uploadedAt)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${C.border2}`,
            borderRadius:8,width:32,height:32,color:C.muted,cursor:"pointer",fontSize:16,
            display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        {/* Preview */}
        <div style={{ background:C.bg,borderRadius:12,padding:12,marginBottom:18,textAlign:"center" }}>
          {file.type==="image" && <img src={file.url} alt={file.name} style={{ maxWidth:"100%",maxHeight:400,borderRadius:8,objectFit:"contain" }} />}
          {file.type==="audio" && <audio controls src={file.url} style={{ width:"100%",accentColor:C.gold }} />}
          {file.type==="video" && <video controls src={file.url} style={{ maxWidth:"100%",maxHeight:360,borderRadius:8 }} />}
          {file.type==="doc"   && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,padding:20 }}>📄 Preview not available</div>}
        </div>

        {/* URL copy */}
        <div style={{ display:"flex",gap:8,marginBottom:16 }}>
          <input readOnly value={file.url} style={{ flex:1,background:C.bg,border:`1px solid ${C.border2}`,
            borderRadius:8,padding:"7px 10px",color:C.muted,fontFamily:"'DM Mono',monospace",fontSize:11,outline:"none" }} />
          <Btn onClick={()=>navigator.clipboard?.writeText(file.url)}>📋 Copy URL</Btn>
        </div>

        <div style={{ display:"flex",justifyContent:"flex-end",gap:10 }}>
          <Btn variant="danger" onClick={()=>onDelete(file)}>🗑 Delete</Btn>
          <Btn variant="primary" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ── List Row ──────────────────────────────────────────────────────────────────
function ListRow({ file, onPreview, onDelete, selected, onToggle }) {
  const t = TYPE_CFG[file.type] || { icon:"📄", color:C.muted };
  return (
    <div style={{ display:"grid",gridTemplateColumns:"36px 36px 1fr 80px 130px 90px",
      gap:0,alignItems:"center",padding:"0 16px",
      background:selected?C.gold+"0a":"transparent",
      borderBottom:`1px solid ${C.border}`,
      transition:"background .1s",cursor:"pointer" }}
      onDoubleClick={()=>onPreview(file)}>
      <div onClick={e=>{e.stopPropagation();onToggle(file.key)}}
        style={{ display:"flex",alignItems:"center",justifyContent:"center",height:44 }}>
        <div style={{ width:16,height:16,borderRadius:4,
          border:`1.5px solid ${selected?C.gold:C.border2}`,
          background:selected?C.gold:"transparent",
          display:"flex",alignItems:"center",justifyContent:"center" }}>
          {selected&&<span style={{ color:"#000",fontSize:10,fontWeight:700 }}>✓</span>}
        </div>
      </div>
      <div style={{ fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",height:44 }}>
        {t.icon}
      </div>
      <div style={{ padding:"0 8px",overflow:"hidden" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{file.name}</div>
        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:C.muted,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1 }}>{file.url}</div>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,textAlign:"right",paddingRight:16 }}>
        {fmtSize(file.size)}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,textAlign:"center" }}>
        {fmtDate(file.uploadedAt)}
      </div>
      <div style={{ display:"flex",gap:6,justifyContent:"flex-end" }}>
        <button onClick={e=>{e.stopPropagation();onPreview(file)}}
          style={{ background:"transparent",border:`1px solid ${C.border2}`,borderRadius:7,
            padding:"4px 10px",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
          Preview
        </button>
        <button onClick={e=>{e.stopPropagation();onDelete(file)}}
          style={{ background:"transparent",border:"none",color:C.danger,cursor:"pointer",fontSize:15,padding:"0 4px" }}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Media Page ────────────────────────────────────────────────────────────────
function MediaPage() {
  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("date");
  const [previewing, setPreviewing] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState(null); // file to confirm delete

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await api.getMedia();
      setFiles(Array.isArray(data) ? data : []);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = files
    .filter(f => {
      if (filterType !== "all" && f.type !== filterType) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a,b) => {
      if (sortBy==="name") return a.name.localeCompare(b.name);
      if (sortBy==="size") return (b.size||0) - (a.size||0);
      return new Date(b.uploadedAt||0) - new Date(a.uploadedAt||0);
    });

  const toggleSelect = (key) => setSelected(s => s.includes(key) ? s.filter(k=>k!==key) : [...s,key]);
  const allSelected = filtered.length > 0 && filtered.every(f => selected.includes(f.key));

  const handleUploaded = (newFile) => {
    setFiles(fs => [{ ...newFile, type: typeOf(newFile.url), uploadedAt: new Date() }, ...fs]);
    setShowUpload(false);
  };

  const doDelete = async (file) => {
    try {
      await api.deleteMedia(file.url);
      setFiles(fs => fs.filter(f => f.key !== file.key));
      setSelected(s => s.filter(k => k !== file.key));
      if (previewing?.key === file.key) setPreviewing(null);
    } catch(e) { alert("Delete error: " + e.message); }
    setDeleting(null);
  };

  const bulkDelete = async () => {
    const toDelete = files.filter(f => selected.includes(f.key));
    for (const f of toDelete) {
      try { await api.deleteMedia(f.url); } catch {}
    }
    setFiles(fs => fs.filter(f => !selected.includes(f.key)));
    setSelected([]);
    setDeleting(null);
  };

  // Stats
  const stats = { total: files.length, image: 0, audio: 0, video: 0, doc: 0, totalSize: 0 };
  files.forEach(f => { stats[f.type] = (stats[f.type]||0)+1; stats.totalSize += f.size||0; });

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", boxSizing:"border-box" }}>

      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:C.text,margin:"0 0 4px",fontWeight:600 }}>
            Media Library
          </h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,margin:0 }}>
            {stats.total} files · {fmtSize(stats.totalSize)} total
          </p>
        </div>
        <Btn variant="primary" onClick={()=>setShowUpload(s=>!s)}>
          {showUpload ? "✕ Close" : "⬆ Upload"}
        </Btn>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div style={{ marginBottom:20 }}>
          <UploadZone onUploaded={handleUploaded} />
        </div>
      )}

      {/* Stats pills */}
      <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap" }}>
        {Object.entries(TYPE_CFG).map(([type,t]) => (
          <div key={type} style={{ background:t.color+"12",border:`1px solid ${t.color}30`,borderRadius:10,
            padding:"8px 14px",display:"flex",alignItems:"center",gap:6 }}>
            <span>{t.icon}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:t.color,fontWeight:600 }}>{stats[type]||0}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
        padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by filename…"
          style={{ flex:"1 1 180px",background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:9,
            padding:"7px 12px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none" }} />

        <div style={{ display:"flex",gap:5 }}>
          {[{id:"all",icon:"📁",label:"All",color:C.gold},...Object.entries(TYPE_CFG).map(([id,t])=>({id,...t}))].map(t=>(
            <button key={t.id} onClick={()=>setFilterType(t.id)}
              style={{ background:filterType===t.id?t.color+"22":"transparent",
                border:`1px solid ${filterType===t.id?t.color:C.border2}`,
                borderRadius:8,padding:"5px 10px",color:filterType===t.id?t.color:C.muted,
                fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:500,cursor:"pointer",
                display:"flex",alignItems:"center",gap:4,transition:"all .15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          style={{ background:C.panel,border:`1px solid ${C.border2}`,borderRadius:9,
            padding:"6px 10px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",cursor:"pointer" }}>
          <option value="date">Date ↓</option>
          <option value="name">Name A–Z</option>
          <option value="size">Size ↓</option>
        </select>

        <button onClick={load} style={{ background:"transparent",border:`1px solid ${C.border2}`,
          borderRadius:9,padding:"6px 12px",color:C.muted,fontFamily:"'DM Sans',sans-serif",
          fontSize:12,cursor:"pointer" }}>↻ Refresh</button>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div style={{ background:C.gold+"12",border:`1px solid ${C.gold}33`,borderRadius:10,
          padding:"9px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.gold,fontWeight:600 }}>
            {selected.length} selected
          </span>
          <Btn variant="danger" style={{ padding:"5px 14px",fontSize:12 }}
            onClick={()=>setDeleting("bulk")}>
            🗑 Delete selected
          </Btn>
          <button onClick={()=>setSelected([])}
            style={{ background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12,
              fontFamily:"'DM Sans',sans-serif" }}>
            Clear
          </button>
        </div>
      )}

      {/* List header */}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px 12px 0 0",
        display:"grid",gridTemplateColumns:"36px 36px 1fr 80px 130px 90px",
        padding:"0 16px",borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:36,cursor:"pointer" }}
          onClick={()=>allSelected?setSelected([]):setSelected(filtered.map(f=>f.key))}>
          <div style={{ width:16,height:16,borderRadius:4,
            border:`1.5px solid ${allSelected?C.gold:C.border2}`,
            background:allSelected?C.gold:"transparent",
            display:"flex",alignItems:"center",justifyContent:"center" }}>
            {allSelected&&<span style={{ color:"#000",fontSize:10,fontWeight:700 }}>✓</span>}
          </div>
        </div>
        {["","File","Size","Uploaded",""].map((h,i) => (
          <div key={i} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,
            letterSpacing:.5,textTransform:"uppercase",display:"flex",alignItems:"center",
            height:36,paddingLeft:i===2?8:0,paddingRight:i===3?16:0,
            justifyContent:i===3?"flex-end":i===4?"center":"flex-start" }}>
            {h}
          </div>
        ))}
      </div>

      {/* List body */}
      <div style={{ border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"40px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>
            Loading…
          </div>
        ) : error ? (
          <div style={{ padding:"40px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.danger }}>
            ⚠ {error} — <span style={{ cursor:"pointer",color:C.gold }} onClick={load}>retry</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"48px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>
            {files.length === 0 ? "No files yet — upload something above ⬆" : "No results for this filter"}
          </div>
        ) : filtered.map(f => (
          <ListRow key={f.key} file={f}
            selected={selected.includes(f.key)}
            onToggle={toggleSelect}
            onPreview={setPreviewing}
            onDelete={f=>setDeleting(f)} />
        ))}
      </div>

      {/* Modals */}
      {previewing && (
        <PreviewModal file={previewing} onClose={()=>setPreviewing(null)}
          onDelete={f=>{setPreviewing(null);setDeleting(f);}} />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div style={{ position:"fixed",inset:0,background:"#000000b0",backdropFilter:"blur(6px)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100 }}
          onClick={e=>e.target===e.currentTarget&&setDeleting(null)}>
          <div style={{ background:C.panel,border:`1px solid ${C.border2}`,borderRadius:18,
            padding:"28px 32px",maxWidth:420,width:"100%",textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:12 }}>🗑</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,marginBottom:8 }}>
              Delete {deleting==="bulk" ? `${selected.length} files` : `"${deleting.name}"`}?
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,marginBottom:24 }}>
              This removes the file from MinIO. Questions using this URL will show broken media.
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <Btn onClick={()=>setDeleting(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={()=>deleting==="bulk"?bulkDelete():doDelete(deleting)}>
                Delete
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMedia({ theme }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <MediaPage />
    </div>
  );
}
