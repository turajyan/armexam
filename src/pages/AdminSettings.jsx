import { useState, useEffect } from "react";
import { api } from "../api.js";

let C = { bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",gold:"#c8a96e",goldDim:"#7c5830",text:"#e2e8f0",muted:"#475569",dim:"#1e293b",success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa",purple:"#a78bfa",scrollThumb:"#243050",sidebarBg:"#080f1a",topbarBg:"#080f1acc" };

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');`;


// ── UI Atoms ──────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant="ghost", small, disabled, style={} }) {
  const base = { fontFamily:"'DM Sans',sans-serif", fontSize:small?12:13, fontWeight:600, borderRadius:9, padding:small?"6px 14px":"10px 20px", cursor:disabled?"not-allowed":"pointer", border:"none", transition:"all .15s", opacity:disabled?.5:1, ...style };
  const v = {
    primary: { background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, color:"white", boxShadow:`0 3px 12px ${C.gold}44` },
    ghost:   { background:"transparent", color:C.muted, border:`1px solid ${C.border2}` },
    danger:  { background:"#f8717114", color:C.danger, border:`1px solid #f8717130` },
    success: { background:C.success+"14", color:C.success, border:`1px solid ${C.success}30` },
    info:    { background:C.info+"14", color:C.info, border:`1px solid ${C.info}30` },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
}

function Input({ label, value, onChange, placeholder, type="text", hint, style={} }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, fontWeight:500 }}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{ background:C.panel, border:`1.5px solid ${focus?C.gold:C.border2}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", transition:"border .15s", ...style }}
      />
      {hint && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{hint}</span>}
    </div>
  );
}

function Select({ label, value, onChange, options, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, fontWeight:500 }}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", cursor:"pointer" }}>
        {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
      {hint && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{hint}</span>}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows=3, hint }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, fontWeight:500 }}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{ background:C.panel, border:`1.5px solid ${focus?C.gold:C.border2}`, borderRadius:10, padding:"10px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", resize:"vertical", transition:"border .15s" }}
      />
      {hint && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{hint}</span>}
    </div>
  );
}

function Toggle({ label, value, onChange, hint, danger }) {
  const onColor = danger ? C.danger : C.gold;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:C.panel, border:`1px solid ${value&&danger?C.danger+"55":C.border2}`, borderRadius:11, transition:"border .2s", gap:16 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, fontWeight:500 }}>{label}</div>
        {hint && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, marginTop:3, lineHeight:1.5 }}>{hint}</div>}
      </div>
      <div onClick={()=>onChange(!value)} style={{ width:46, height:26, borderRadius:13, background:value?onColor:C.dim, cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, left:value?23:3, width:20, height:20, borderRadius:"50%", background:"white", transition:"left .2s", boxShadow:"0 1px 4px #0006" }} />
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  const PRESETS = ["#c8a96e","#60a5fa","#a78bfa","#34d399","#f87171","#f59e0b","#e879f9","#94a3b8"];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, fontWeight:500 }}>{label}</label>}
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        {PRESETS.map(c=>(
          <button key={c} onClick={()=>onChange(c)} title={c} style={{ width:28, height:28, borderRadius:"50%", background:c, border:`2.5px solid ${value===c?"white":"transparent"}`, cursor:"pointer", transition:"all .15s", boxShadow:value===c?`0 0 0 2px ${c}`:"none", flexShrink:0 }} />
        ))}
        <input type="color" value={value} onChange={e=>onChange(e.target.value)} title="Custom color"
          style={{ width:28, height:28, borderRadius:"50%", border:`1px solid ${C.border2}`, background:"transparent", cursor:"pointer", padding:0 }} />
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>{value}</span>
      </div>
    </div>
  );
}

function SettingSection({ title, icon, description, children }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", marginBottom:16 }}>
      <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, margin:0, fontWeight:600 }}>{title}</h3>
        </div>
        {description && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, margin:"6px 0 0 28px" }}>{description}</p>}
      </div>
      <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:14 }}>
        {children}
      </div>
    </div>
  );
}

function SaveBar({ onSave, onReset, saved }) {
  return (
    <div style={{ position:"sticky", bottom:0, background:C.panel+"ee", backdropFilter:"blur(12px)", borderTop:`1px solid ${C.border}`, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:saved?C.success:C.warning, transition:"color .3s" }}>
        {saved ? "✓ All settings saved!" : "⚠ Unsaved changes"}
      </span>
      <div style={{ display:"flex", gap:10 }}>
        <Btn onClick={onReset}>↺ Reset</Btn>
        <Btn variant="primary" onClick={onSave}>✓ Save Settings</Btn>
      </div>
    </div>
  );
}

function AdminRow({ admin, onEdit, onDelete, isSelf }) {
  const roleColor = { superadmin:C.gold, admin:C.info, examiner:C.purple, viewer:C.muted };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:C.panel, border:`1px solid ${C.border}`, borderRadius:11, marginBottom:8 }}>
      <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${C.border2},${C.dim})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700, color:C.text, flexShrink:0 }}>
        {admin.name[0]}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, fontWeight:500 }}>
          {admin.name}
          {isSelf && <span style={{ fontSize:10, color:C.gold, background:C.gold+"18", borderRadius:4, padding:"1px 6px", marginLeft:6 }}>You</span>}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{admin.email}</div>
      </div>
      <span style={{ background:roleColor[admin.role]+"18", color:roleColor[admin.role], border:`1px solid ${roleColor[admin.role]}33`, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", textTransform:"capitalize" }}>{admin.role}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:admin.active?C.success:C.muted }}>{admin.active?"● Active":"○ Inactive"}</span>
      {!isSelf && (
        <div style={{ display:"flex", gap:6 }}>
          <Btn small onClick={()=>onEdit(admin)}>Edit</Btn>
          <Btn small variant="danger" onClick={()=>onDelete(admin.id)}>Remove</Btn>
        </div>
      )}
    </div>
  );
}

function BackupRow({ backup }) {
  const statusColor = { success:C.success, running:C.warning, failed:C.danger };
  const statusLabel = { success:"✓ Success", running:"↻ Running", failed:"✕ Failed" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"11px 16px", background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:6 }}>
      <span style={{ fontSize:16 }} title={backup.type==="auto"?"Automatic backup":"Manual backup"}>{backup.type==="auto"?"🤖":"👤"}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text, fontWeight:500 }}>{backup.name}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{backup.date} · {backup.size}</div>
      </div>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:statusColor[backup.status] }}>{statusLabel[backup.status]}</span>
      <Btn small>⬇ Download</Btn>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"general",      icon:"⚙️",  label:"General" },
  { id:"exam",         icon:"🎓", label:"Exam Defaults" },
  { id:"appearance",   icon:"🎨", label:"Appearance" },
  { id:"sections",     icon:"📂", label:"Sections" },
  { id:"users",        icon:"👥", label:"Admin Users" },
  { id:"email",        icon:"📧", label:"Email / SMTP" },
  { id:"security",     icon:"🔒", label:"Security" },
  { id:"backup",       icon:"💾", label:"Backup" },
  { id:"integrations", icon:"🔗", label:"Integrations" },
];


const SEED_BACKUPS = [
  { id:1, name:"backup_2025-03-01_auto.sql",   date:"2025-03-01 03:00", size:"14.2 MB", type:"auto",   status:"success" },
  { id:2, name:"backup_2025-02-22_auto.sql",   date:"2025-02-22 03:00", size:"13.8 MB", type:"auto",   status:"success" },
  { id:3, name:"backup_2025-02-15_manual.sql", date:"2025-02-15 11:22", size:"13.5 MB", type:"manual", status:"success" },
  { id:4, name:"backup_2025-02-08_auto.sql",   date:"2025-02-08 03:00", size:"12.9 MB", type:"auto",   status:"failed"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage({ theme, onThemeChange, currentTheme }) {
  if (theme) C = theme;
  const [tab, setTab] = useState("general");
  const [saved, setSaved] = useState(true);
  const [toast, setToast] = useState(null);
  // sections: [{ id, name }]
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState("");
  const [editingSection, setEditingSection] = useState(null); // { id, value }

  useEffect(() => {
    api.getSections().then(setSections).catch(() => {});
  }, []);

  const addSection = async () => {
    const name = newSection.trim();
    if (!name || sections.some(s => s.name === name)) return;
    try {
      const created = await api.createSection({ name });
      setSections(prev => [...prev, created]); // sortOrder assigned by backend (max+1)
      setNewSection("");
    } catch (e) { setToast({ type:"danger", msg: e.message }); }
  };

  const deleteSection = async (id) => {
    try {
      await api.deleteSection(id);
      setSections(prev => prev.filter(s => s.id !== id));
    } catch (e) { setToast({ type:"danger", msg: e.message }); }
  };

  const startEdit = (sec) => setEditingSection({ id: sec.id, value: sec.name });
  const confirmEdit = async () => {
    if (!editingSection) return;
    const name = editingSection.value.trim();
    if (!name) return;
    try {
      const updated = await api.updateSection(editingSection.id, { name });
      setSections(prev => prev.map(s => s.id === updated.id ? updated : s)); // keep existing order
      setEditingSection(null);
    } catch (e) { setToast({ type:"danger", msg: e.message }); }
  };

  const [general, setGeneral] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("armexam_general_settings") || "{}");
      return {
        platformName:    saved.platformName    ?? "ArmExam",
        platformNameHy:  saved.platformNameHy  ?? "Հայոց Լեզվի Քննություն",
        tagline:         saved.tagline         ?? "Armenian Language Testing Platform",
        supportEmail:    saved.supportEmail    ?? "support@armexam.am",
        supportPhone:    saved.supportPhone    ?? "+374 10 000 000",
        timezone:        saved.timezone        ?? "Asia/Yerevan",
        dateFormat:      saved.dateFormat      ?? "DD.MM.YYYY",
        timeFormat:      saved.timeFormat      ?? "HH:mm",
        language:        saved.language        ?? "hy",
        maintenanceMode: saved.maintenanceMode ?? false,
        registrationOpen:saved.registrationOpen ?? true,
      };
    } catch {
      return {
        platformName:"ArmExam", platformNameHy:"Հայոց Լեզվի Քննություն",
        tagline:"Armenian Language Testing Platform",
        supportEmail:"support@armexam.am", supportPhone:"+374 10 000 000",
        timezone:"Asia/Yerevan", dateFormat:"DD.MM.YYYY", timeFormat:"HH:mm",
        language:"hy", maintenanceMode:false, registrationOpen:true,
      };
    }
  });

  const [exam, setExam] = useState({
    defaultDuration:60,
    defaultPassingScore:70,
    maxAttempts:1,
    shuffleDefault:true,
    showResultsDefault:true,
    allowReviewDefault:false,
    audioMaxPlays:2,
    videoMaxPlays:2,
    pauseBetweenAudio:25,
    autoSaveInterval:30,
    sessionTimeout:120,
    warningBeforeEnd:5,
    certificateEnabled:true,
  });

  const [appearance, setAppearance] = useState({
    primaryColor:"#c8a96e",
    accentColor:"#60a5fa",
    dangerColor:"#f87171",
    theme:currentTheme||"dark",
    fontHeading:"Cormorant Garamond",
    fontBody:"DM Sans",
    borderRadius:"14",
    logoText:"Հ",
    showLevelBadges: true,
    showTimer: true,
    compactMode: false,
  });

  const [emailCfg, setEmailCfg] = useState({
    smtpHost:"smtp.gmail.com",
    smtpPort:"587",
    smtpUser:"noreply@armexam.am",
    smtpPass:"",
    smtpTls:true,
    sendOnAssign:true,
    sendOnResult:true,
    sendReminder:true,
    reminderHours:24,
    fromName:"ArmExam",
    replyTo:"support@armexam.am",
  });

  const [security, setSecurity] = useState({
    twoFactorRequired:false,
    sessionDuration:8,
    maxLoginAttempts:5,
    lockoutMinutes:15,
    passwordMinLength:8,
    requireUppercase:true,
    requireNumbers:true,
    requireSpecial:false,
    ipWhitelist:"",
    auditLog:true,
    examProctoring:false,
  });

  const [backup, setBackup] = useState({
    autoBackup:true,
    backupFrequency:"weekly",
    backupTime:"03:00",
    retentionWeeks:4,
    backupLocation:"local",
    s3Bucket:"",
    s3Region:"",
  });

  const setG   = (k,v) => { setGeneral(p=>({...p,[k]:v})); setSaved(false); };
  const setE   = (k,v) => { setExam(p=>({...p,[k]:v})); setSaved(false); };
  const setA   = (k,v) => { setAppearance(p=>({...p,[k]:v})); setSaved(false); };
  const setEM  = (k,v) => { setEmailCfg(p=>({...p,[k]:v})); setSaved(false); };
  const setSec = (k,v) => { setSecurity(p=>({...p,[k]:v})); setSaved(false); };
  const setBk  = (k,v) => { setBackup(p=>({...p,[k]:v})); setSaved(false); };

  const showToast = (msg, color=C.success) => {
    setToast({msg,color});
    setTimeout(()=>setToast(null), 3000);
  };

  const handleSave  = () => {
    setSaved(true);
    try { localStorage.setItem("armexam_general_settings", JSON.stringify(general)); } catch {}
    window.dispatchEvent(new Event("armexam:langchange"));
    showToast("✓ Settings saved successfully!");
  };
  const handleReset = () => { setSaved(true); showToast("↺ Reset to last saved state", C.warning); };

  const renderTab = () => {
    switch(tab) {

      // ── GENERAL ────────────────────────────────────────────────────────────
      case "general": return (<>
        <SettingSection title="Platform Information" icon="🏛" description="Basic information displayed to students and in reports">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Input label="Platform Name (English)" value={general.platformName} onChange={v=>setG("platformName",v)} placeholder="ArmExam" />
            <Input label="Platform Name (Armenian)" value={general.platformNameHy} onChange={v=>setG("platformNameHy",v)} placeholder="Հայոց Լեզվի Քննություն" />
          </div>
          <Input label="Tagline / Description" value={general.tagline} onChange={v=>setG("tagline",v)} placeholder="Armenian Language Testing Platform" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Input label="Support Email" value={general.supportEmail} onChange={v=>setG("supportEmail",v)} type="email" hint="Shown to students on error pages" />
            <Input label="Support Phone" value={general.supportPhone} onChange={v=>setG("supportPhone",v)} hint="Optional contact number" />
          </div>
        </SettingSection>

        <SettingSection title="Region & Language" icon="🌍" description="Timezone, date/time format, and default interface language">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Select label="Timezone" value={general.timezone} onChange={v=>setG("timezone",v)}
              options={[
                "Asia/Yerevan","Europe/Moscow","Europe/Istanbul","Europe/Berlin",
                "Europe/London","America/New_York","America/Los_Angeles","Asia/Dubai",
              ].map(z=>({value:z,label:z}))} />
            <Select label="Default Interface Language" value={general.language} onChange={v=>setG("language",v)}
              options={[{value:"hy",label:"Հայերեն"},{value:"ru",label:"Русский"},{value:"en",label:"English"}]} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Select label="Date Format" value={general.dateFormat} onChange={v=>setG("dateFormat",v)}
              options={["DD.MM.YYYY","MM/DD/YYYY","YYYY-MM-DD"].map(f=>({value:f,label:f}))} />
            <Select label="Time Format" value={general.timeFormat} onChange={v=>setG("timeFormat",v)}
              options={[{value:"HH:mm",label:"24h — 14:30"},{value:"HH:mm:ss",label:"24h + seconds — 14:30:05"},{value:"hh:mm A",label:"12h AM/PM — 02:30 PM"}]} />
          </div>
          {/* Live preview */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>Preview:</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, fontWeight:500 }}>
              {(() => {
                const d = new Date();
                const pad = n => String(n).padStart(2,"0");
                const day = pad(d.getDate()), month = pad(d.getMonth()+1), year = d.getFullYear();
                const h24 = d.getHours(), mins = pad(d.getMinutes()), secs = pad(d.getSeconds());
                const datePart = general.dateFormat === "MM/DD/YYYY" ? `${month}/${day}/${year}`
                               : general.dateFormat === "YYYY-MM-DD" ? `${year}-${month}-${day}`
                               : `${day}.${month}.${year}`;
                const timePart = general.timeFormat === "hh:mm A"
                               ? `${pad(h24%12||12)}:${mins} ${h24>=12?"PM":"AM"}`
                               : general.timeFormat === "HH:mm:ss"
                               ? `${pad(h24)}:${mins}:${secs}`
                               : `${pad(h24)}:${mins}`;
                return `${datePart}, ${timePart}`;
              })()}
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, marginLeft:"auto" }}>используется по всему проекту</span>
          </div>
        </SettingSection>

        <SettingSection title="Platform Access Control" icon="🎛" description="Control who can access the platform">
          <Toggle
            label="Maintenance Mode"
            value={general.maintenanceMode}
            onChange={v=>setG("maintenanceMode",v)}
            hint="Block all student access while updates are in progress. Admins can still log in."
            danger
          />
          <Toggle
            label="Open Student Registration"
            value={general.registrationOpen}
            onChange={v=>setG("registrationOpen",v)}
            hint="Allow new students to self-register. Disable to allow only admin-created accounts."
          />
        </SettingSection>
      </>);

      // ── EXAM DEFAULTS ──────────────────────────────────────────────────────
      case "exam": return (<>
        <SettingSection title="Default Exam Settings" icon="📋" description="These values are pre-filled when creating a new exam. Can be overridden per exam.">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Input label="Default Duration (minutes)" value={exam.defaultDuration} onChange={v=>setE("defaultDuration",+v)} type="number" hint="How long students have to complete the exam" />
            <Input label="Passing Score (%)" value={exam.defaultPassingScore} onChange={v=>setE("defaultPassingScore",+v)} type="number" hint="Minimum score to pass (0–100)" />
            <Input label="Max Attempts per Student" value={exam.maxAttempts} onChange={v=>setE("maxAttempts",+v)} type="number" hint="How many times a student can retake the exam" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Toggle label="Shuffle Questions by Default" value={exam.shuffleDefault} onChange={v=>setE("shuffleDefault",v)} hint="Randomize question order for each student" />
            <Toggle label="Show Results After Exam" value={exam.showResultsDefault} onChange={v=>setE("showResultsDefault",v)} hint="Students see their score immediately after submitting" />
            <Toggle label="Allow Answer Review" value={exam.allowReviewDefault} onChange={v=>setE("allowReviewDefault",v)} hint="Students can review their answers after submission" />
            <Toggle label="Issue Certificates" value={exam.certificateEnabled} onChange={v=>setE("certificateEnabled",v)} hint="Generate a certificate PDF for passed exams" />
          </div>
        </SettingSection>

        <SettingSection title="Audio & Video Settings" icon="🎧" description="Controls for listening questions with audio or video clips">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Select label="Max Audio Playbacks" value={exam.audioMaxPlays} onChange={v=>setE("audioMaxPlays",+v)}
              options={[1,2,3].map(n=>({value:n,label:`${n} time${n>1?"s":""}`}))}
              hint="How many times students can play audio clips" />
            <Select label="Max Video Playbacks" value={exam.videoMaxPlays} onChange={v=>setE("videoMaxPlays",+v)}
              options={[1,2,3].map(n=>({value:n,label:`${n} time${n>1?"s":""}`}))}
              hint="How many times students can replay video clips" />
            <Select label="Pause Between Replays (seconds)" value={exam.pauseBetweenAudio} onChange={v=>setE("pauseBetweenAudio",+v)}
              options={[15,20,25,30].map(n=>({value:n,label:`${n} seconds`}))}
              hint="Mandatory wait time before the next playback is allowed" />
          </div>
        </SettingSection>

        <SettingSection title="Session & Timing" icon="⏱" description="Auto-save and timeout behaviour during an active exam">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Input label="Auto-save Interval (seconds)" value={exam.autoSaveInterval} onChange={v=>setE("autoSaveInterval",+v)} type="number" hint="How often answers are saved automatically" />
            <Input label="Idle Session Timeout (minutes)" value={exam.sessionTimeout} onChange={v=>setE("sessionTimeout",+v)} type="number" hint="Auto-submit if student is inactive for this long" />
            <Input label="Low-time Warning (minutes)" value={exam.warningBeforeEnd} onChange={v=>setE("warningBeforeEnd",+v)} type="number" hint="Show a warning banner this many minutes before time expires" />
          </div>
        </SettingSection>
      </>);

      // ── APPEARANCE ─────────────────────────────────────────────────────────
      case "appearance": return (<>
        <SettingSection title="Brand Colors" icon="🎨" description="Main colors used throughout the platform UI">
          <ColorPicker label="Primary Color (buttons, badges, highlights)" value={appearance.primaryColor} onChange={v=>setA("primaryColor",v)} />
          <ColorPicker label="Accent Color (active states, info badges)"   value={appearance.accentColor}  onChange={v=>setA("accentColor",v)} />
          <ColorPicker label="Danger Color (errors, delete actions)"       value={appearance.dangerColor}  onChange={v=>setA("dangerColor",v)} />
        </SettingSection>

        <SettingSection title="Typography & Layout" icon="✍" description="Fonts, border radius, and display preferences">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Select label="Theme" value={appearance.theme} onChange={v=>{setA("theme",v); if(onThemeChange) onThemeChange(v);}}
              options={[{value:"dark",label:"Dark 🌙"},{value:"medium",label:"Dim 🌆"},{value:"light",label:"Light ☀️"}]} />
            <Select label="Heading Font" value={appearance.fontHeading} onChange={v=>setA("fontHeading",v)}
              options={["Cormorant Garamond","Playfair Display","Merriweather"].map(f=>({value:f,label:f}))} />
            <Select label="Body Font" value={appearance.fontBody} onChange={v=>setA("fontBody",v)}
              options={["DM Sans","Noto Sans Armenian","Source Sans 3"].map(f=>({value:f,label:f}))} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Input label="Card Corner Radius (px)" value={appearance.borderRadius} onChange={v=>setA("borderRadius",v)} type="number" hint="Roundness of cards and buttons (0 = sharp, 20 = very round)" />
            <Input label="Logo Monogram" value={appearance.logoText} onChange={v=>setA("logoText",v)} hint="1–2 letter abbreviation shown in the sidebar logo" />
          </div>
        </SettingSection>

        <SettingSection title="UI Display Options" icon="🖥" description="Toggle visible elements in the student exam view">
          <Toggle label="Show Level Badges (A1–C2)" value={appearance.showLevelBadges} onChange={v=>setA("showLevelBadges",v)} hint="Display coloured level indicators next to each question" />
          <Toggle label="Show Countdown Timer" value={appearance.showTimer} onChange={v=>setA("showTimer",v)} hint="Students see a live timer during the exam" />
          <Toggle label="Compact Layout" value={appearance.compactMode} onChange={v=>setA("compactMode",v)} hint="Reduce padding and spacing for smaller screens" />
        </SettingSection>

        <SettingSection title="Live Preview" icon="👁" description="See how your color and font settings look in real time">
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:+appearance.borderRadius, padding:"20px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:+appearance.borderRadius, background:`linear-gradient(135deg,${appearance.primaryColor},${appearance.primaryColor}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:`'${appearance.fontHeading}',serif`, fontSize:22, fontWeight:700, color:"white" }}>
                {appearance.logoText||"Հ"}
              </div>
              <div>
                <div style={{ fontFamily:`'${appearance.fontHeading}',serif`, fontSize:20, color:C.text, fontWeight:600 }}>ArmExam</div>
                <div style={{ fontFamily:`'${appearance.fontBody}',sans-serif`, fontSize:12, color:C.muted }}>Armenian Language Testing Platform</div>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                {appearance.showLevelBadges && <span style={{ background:appearance.primaryColor+"22", color:appearance.primaryColor, border:`1px solid ${appearance.primaryColor}44`, borderRadius:+appearance.borderRadius/2, padding:"4px 12px", fontSize:12, fontFamily:`'${appearance.fontBody}',sans-serif`, fontWeight:700 }}>B2</span>}
                <span style={{ background:appearance.accentColor+"22", color:appearance.accentColor, border:`1px solid ${appearance.accentColor}44`, borderRadius:+appearance.borderRadius/2, padding:"4px 12px", fontSize:12, fontFamily:`'${appearance.fontBody}',sans-serif`, fontWeight:700 }}>Active</span>
              </div>
            </div>
            <div style={{ fontFamily:`'${appearance.fontBody}',sans-serif`, fontSize:14, color:C.muted, lineHeight:1.6 }}>
              Sample question text in selected body font. Ընտրի՛ր ճիշտ պատասխանը։
            </div>
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button style={{ background:`linear-gradient(135deg,${appearance.primaryColor},${appearance.primaryColor}99)`, border:"none", borderRadius:+appearance.borderRadius/1.5, padding:"8px 18px", color:"white", fontFamily:`'${appearance.fontBody}',sans-serif`, fontSize:13, fontWeight:600, cursor:"pointer" }}>Next Question</button>
              <button style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:+appearance.borderRadius/1.5, padding:"8px 18px", color:C.muted, fontFamily:`'${appearance.fontBody}',sans-serif`, fontSize:13, cursor:"pointer" }}>Previous</button>
            </div>
          </div>
        </SettingSection>
      </>);

      // ── ADMIN USERS ────────────────────────────────────────────────────────
      case "users": return (<>
        <SettingSection title="Administrator Accounts" icon="👥" description="Manage who has access to the admin panel and what they can do">
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px",
            background:C.gold+"0e", border:`1px solid ${C.gold}33`, borderRadius:12 }}>
            <span style={{ fontSize:24 }}>⊕</span>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.text, fontWeight:600, marginBottom:2 }}>
                Administrator management has its own tab
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>
                Use the <strong style={{ color:C.gold }}>Admins</strong> tab in the left sidebar to add, edit, and delete admin accounts.
              </div>
            </div>
          </div>
        </SettingSection>

        <SettingSection title="Roles & Permissions" icon="🔑" description="Each role has a fixed set of permissions. Assign roles to admins in the Admins tab.">
          {[
            { role:"super_admin",  color:C.gold,    perms:["Full platform access","Manage all admins & centers","Questions, Exams, Students","Analytics, Media, Settings","Can assign any role"] },
            { role:"center_admin", color:C.info,    perms:["Questions, Exams, Students","Analytics for own center","Grading","Cannot access Settings or Admins tab"] },
            { role:"content_editor", label:"Content Editor", color:C.warning, perms:["View & edit question bank only","Cannot manage exams or students","No analytics, no settings"] },
            { role:"examiner",     color:C.purple,  perms:["View question bank (read-only)","Grade speaking & writing","No access to exam management"] },
          ].map(r=>(
            <div key={r.role} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px", background:C.panel, border:`1px solid ${C.border}`, borderRadius:10 }}>
              <span style={{ background:r.color+"18", color:r.color, border:`1px solid ${r.color}33`, borderRadius:6, padding:"3px 12px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", textTransform:"capitalize", whiteSpace:"nowrap", marginTop:2 }}>{r.label || r.role}</span>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {r.perms.map(p=>(
                  <span key={p} style={{ background:C.dim, color:C.muted, borderRadius:6, padding:"3px 10px", fontSize:11, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </SettingSection>
      </>);

      // ── EMAIL ──────────────────────────────────────────────────────────────
      case "email": return (<>
        <SettingSection title="SMTP Configuration" icon="📧" description="Email server settings for sending notifications to students and admins">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Input label="SMTP Host" value={emailCfg.smtpHost} onChange={v=>setEM("smtpHost",v)} placeholder="smtp.gmail.com" />
            <Input label="SMTP Port" value={emailCfg.smtpPort} onChange={v=>setEM("smtpPort",v)} type="number" hint="Usually 587 (TLS) or 465 (SSL)" />
            <Input label="SMTP Username" value={emailCfg.smtpUser} onChange={v=>setEM("smtpUser",v)} type="email" />
            <Input label="SMTP Password" value={emailCfg.smtpPass} onChange={v=>setEM("smtpPass",v)} type="password" />
          </div>
          <Toggle label="Use TLS Encryption" value={emailCfg.smtpTls} onChange={v=>setEM("smtpTls",v)} hint="Recommended for secure email transmission" />
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="info" onClick={()=>showToast("📧 Test email sent to "+emailCfg.smtpUser, C.info)}>📧 Send Test Email</Btn>
          </div>
        </SettingSection>

        <SettingSection title="Sender Details" icon="✉️" description="How outgoing emails appear to recipients">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Input label="From Name" value={emailCfg.fromName} onChange={v=>setEM("fromName",v)} hint='Shown as sender name, e.g. "ArmExam"' />
            <Input label="Reply-To Address" value={emailCfg.replyTo} onChange={v=>setEM("replyTo",v)} type="email" hint="Where students reply to" />
          </div>
        </SettingSection>

        <SettingSection title="Email Notifications" icon="🔔" description="Choose which events automatically send an email to the student">
          <Toggle label="Notify when exam is assigned" value={emailCfg.sendOnAssign} onChange={v=>setEM("sendOnAssign",v)} hint="Student receives an email with exam details and access link" />
          <Toggle label="Notify when results are published" value={emailCfg.sendOnResult} onChange={v=>setEM("sendOnResult",v)} hint="Student receives their score and pass/fail status" />
          <Toggle label="Send exam reminder" value={emailCfg.sendReminder} onChange={v=>setEM("sendReminder",v)} hint="Remind the student N hours before the exam start time" />
          {emailCfg.sendReminder && (
            <Input label="Reminder — hours before exam" value={emailCfg.reminderHours} onChange={v=>setEM("reminderHours",+v)} type="number" hint='E.g. "24" sends the reminder 1 day before' />
          )}
        </SettingSection>
      </>);

      // ── SECURITY ───────────────────────────────────────────────────────────
      case "security": return (<>
        <SettingSection title="Login & Session Security" icon="🔐" description="Protect admin accounts from unauthorized access">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Input label="Session Duration (hours)" value={security.sessionDuration} onChange={v=>setSec("sessionDuration",+v)} type="number" hint="Admin is logged out after this many hours of inactivity" />
            <Input label="Max Failed Login Attempts" value={security.maxLoginAttempts} onChange={v=>setSec("maxLoginAttempts",+v)} type="number" hint="Account is locked after this many wrong passwords" />
            <Input label="Lockout Duration (minutes)" value={security.lockoutMinutes} onChange={v=>setSec("lockoutMinutes",+v)} type="number" hint="How long the account stays locked after too many failures" />
          </div>
          <Toggle label="Require Two-Factor Authentication (2FA)" value={security.twoFactorRequired} onChange={v=>setSec("twoFactorRequired",v)} hint="All admin accounts must set up 2FA on their next login" />
        </SettingSection>

        <SettingSection title="Password Policy" icon="🔑" description="Requirements for admin and student passwords">
          <Input label="Minimum Password Length" value={security.passwordMinLength} onChange={v=>setSec("passwordMinLength",+v)} type="number" hint="Recommended: at least 8 characters" />
          <Toggle label="Require Uppercase Letters" value={security.requireUppercase} onChange={v=>setSec("requireUppercase",v)} hint='Password must contain at least one uppercase letter (A–Z)' />
          <Toggle label="Require Numbers" value={security.requireNumbers} onChange={v=>setSec("requireNumbers",v)} hint='Password must contain at least one digit (0–9)' />
          <Toggle label="Require Special Characters" value={security.requireSpecial} onChange={v=>setSec("requireSpecial",v)} hint='Password must contain ! @ # $ % & * etc.' />
        </SettingSection>

        <SettingSection title="Monitoring & Proctoring" icon="👁" description="Track admin actions and detect suspicious student behaviour">
          <Toggle label="Enable Admin Audit Log" value={security.auditLog} onChange={v=>setSec("auditLog",v)} hint="Record every create, edit, and delete action performed by admins" />
          <Toggle label="Enable Exam Proctoring" value={security.examProctoring} onChange={v=>setSec("examProctoring",v)} hint="Detect and log if students switch browser tabs during the exam" />
          <Textarea
            label="IP Whitelist for Admin Panel (optional)"
            value={security.ipWhitelist}
            onChange={v=>setSec("ipWhitelist",v)}
            placeholder={"192.168.1.0/24\n10.0.0.1"}
            rows={3}
            hint="One IP address or CIDR range per line. Leave empty to allow access from anywhere."
          />
        </SettingSection>
      </>);

      // ── BACKUP ─────────────────────────────────────────────────────────────
      case "backup": return (<>
        <SettingSection title="Automatic Backup Schedule" icon="⚙️" description="Automatically back up the database on a schedule">
          <Toggle label="Enable Automatic Backups" value={backup.autoBackup} onChange={v=>setBk("autoBackup",v)} hint="Database is exported and saved at the scheduled time" />
          {backup.autoBackup && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <Select label="Backup Frequency" value={backup.backupFrequency} onChange={v=>setBk("backupFrequency",v)}
                options={[{value:"daily",label:"Every Day"},{value:"weekly",label:"Every Week"},{value:"monthly",label:"Every Month"}]} />
              <Input label="Backup Time" value={backup.backupTime} onChange={v=>setBk("backupTime",v)} type="time" hint="Server local time (usually run at night)" />
              <Select label="Keep Backups For" value={backup.retentionWeeks} onChange={v=>setBk("retentionWeeks",+v)}
                options={[2,4,8,12].map(n=>({value:n,label:`${n} weeks`}))} hint="Older backups are deleted automatically" />
            </div>
          )}
        </SettingSection>

        <SettingSection title="Backup Storage Location" icon="💽" description="Where backup files are saved">
          <Select label="Storage Type" value={backup.backupLocation} onChange={v=>setBk("backupLocation",v)}
            options={[{value:"local",label:"Local Disk (same server)"},{value:"s3",label:"S3-compatible (MinIO, AWS S3)"},{value:"ftp",label:"FTP / SFTP"}]} />
          {backup.backupLocation==="s3" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Input label="S3 Bucket Name" value={backup.s3Bucket} onChange={v=>setBk("s3Bucket",v)} placeholder="armexam-backups" />
              <Input label="S3 Region" value={backup.s3Region} onChange={v=>setBk("s3Region",v)} placeholder="us-east-1 or custom endpoint" />
            </div>
          )}
        </SettingSection>

        <SettingSection title="Backup History" icon="📋" description="Recent backup files. Download to restore on another server.">
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:4 }}>
            <Btn variant="primary" small onClick={()=>showToast("↻ Manual backup started — this may take a moment...", C.warning)}>↻ Run Manual Backup Now</Btn>
          </div>
          {SEED_BACKUPS.map(b=><BackupRow key={b.id} backup={b} />)}
        </SettingSection>
      </>);

      // ── INTEGRATIONS ───────────────────────────────────────────────────────
      case "integrations": return (<>
        <SettingSection title="API Access" icon="🔗" description="External systems can use the REST API to read exam data and submit results">
          <div style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginBottom:4 }}>API Key</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, letterSpacing:1 }}>armexam_••••••••••••••••••••••••••••••••</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn small onClick={()=>showToast("📋 API key copied to clipboard!", C.success)}>📋 Copy Key</Btn>
              <Btn small variant="danger" onClick={()=>showToast("🔄 New API key generated. Update your integrations!", C.warning)}>↺ Regenerate</Btn>
            </div>
          </div>
          <Toggle label="Enable API Access" value={true} onChange={()=>{}} hint="Allow external applications to connect via the REST API" />
        </SettingSection>

        <SettingSection title="Third-party Integrations" icon="🧩" description="Connect ArmExam with external platforms and services">
          {[
            { name:"Google Classroom", icon:"📚", color:"#4285f4", connected:false, desc:"Sync students and assignments with Google Classroom" },
            { name:"Moodle LMS",       icon:"🎓", color:"#f98012", connected:false, desc:"Import/export exams from your Moodle installation" },
            { name:"Zoom",             icon:"📹", color:"#2d8cff", connected:false, desc:"Automatically create Zoom sessions for proctored exams" },
            { name:"Telegram Bot",     icon:"✈️",  color:"#2ca5e0", connected:true,  desc:"Send exam notifications and results via Telegram" },
            { name:"MinIO Storage",    icon:"🪣", color:"#c72c48", connected:true,  desc:"Store media files on a self-hosted MinIO S3 server" },
          ].map(int=>(
            <div key={int.name} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:C.panel, border:`1px solid ${int.connected?int.color+"44":C.border}`, borderRadius:11 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:int.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{int.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, fontWeight:600 }}>{int.name}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, marginTop:2 }}>{int.desc}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:int.connected?C.success:C.muted, marginTop:3 }}>{int.connected?"● Connected":"○ Not connected"}</div>
              </div>
              <Btn small variant={int.connected?"danger":"ghost"} onClick={()=>showToast(int.connected?`${int.name} disconnected`:`${int.name} — configure credentials first`, int.connected?C.danger:C.info)}>
                {int.connected?"Disconnect":"Connect"}
              </Btn>
            </div>
          ))}
        </SettingSection>
      </>);

      // ── SECTIONS ───────────────────────────────────────────────────────────
      case "sections": return (<>
        <SettingSection title="Question Sections" icon="📂"
          description="Drag ☰ to reorder. Order applies site-wide: exam delivery, question filters, statistics.">
          {/* Add */}
          <div style={{ display:"flex", gap:8 }}>
            <input
              value={newSection}
              onChange={e=>setNewSection(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addSection()}
              placeholder="New section name…"
              style={{ flex:1, background:C.panel, border:`1.5px solid ${C.border2}`, borderRadius:10, padding:"9px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }}
            />
            <Btn variant="primary" onClick={addSection} disabled={!newSection.trim()}>+ Add</Btn>
          </div>
          {/* Drag-sortable list */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}
            onDragOver={e=>e.preventDefault()}>
            {sections.map((s, idx)=>(
              <div key={s.id}
                draggable
                onDragStart={e=>{ e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("secIdx", String(idx)); }}
                onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; }}
                onDrop={e=>{
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData("secIdx"));
                  if (from === idx) return;
                  const next = [...sections];
                  const [moved] = next.splice(from, 1);
                  next.splice(idx, 0, moved);
                  const reordered = next.map((sec, i) => ({ ...sec, sortOrder: i }));
                  setSections(reordered);
                  api.reorderSections(reordered.map(sec => ({ id: sec.id, sortOrder: sec.sortOrder })))
                    .catch(() => setToast({ type:"danger", msg:"Failed to save order" }));
                }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                  background:C.panel, border:`1px solid ${C.border}`, borderRadius:10,
                  cursor:"default", userSelect:"none" }}>
                {/* Drag handle */}
                <span style={{ fontSize:16, color:C.muted, cursor:"grab", lineHeight:1, flexShrink:0 }}>☰</span>
                {/* Order badge */}
                <span style={{ fontSize:11, color:C.muted, fontFamily:"'DM Sans',sans-serif",
                  background:C.bg, borderRadius:5, padding:"1px 7px", flexShrink:0 }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize:14, flexShrink:0 }}>📂</span>
                {editingSection?.id===s.id ? (
                  <input
                    autoFocus
                    value={editingSection.value}
                    onChange={e=>setEditingSection(es=>({...es,value:e.target.value}))}
                    onKeyDown={e=>{ if(e.key==="Enter") confirmEdit(); if(e.key==="Escape") setEditingSection(null); }}
                    style={{ flex:1, background:C.bg, border:`1.5px solid ${C.gold}`, borderRadius:8,
                      padding:"5px 10px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }}
                  />
                ) : (
                  <span style={{ flex:1, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text }}>{s.name}</span>
                )}
                <div style={{ display:"flex", gap:6 }}>
                  {editingSection?.id===s.id ? (
                    <>
                      <Btn small variant="success" onClick={confirmEdit}>✓</Btn>
                      <Btn small onClick={()=>setEditingSection(null)}>✕</Btn>
                    </>
                  ) : (
                    <>
                      <Btn small onClick={()=>startEdit(s)}>✎ Rename</Btn>
                      <Btn small variant="danger" onClick={()=>deleteSection(s.id)}>✕</Btn>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, marginTop:4 }}>
            Order is saved immediately on drop. Used by: exam delivery, question filters, NavDots, statistics.
          </div>
        </SettingSection>
      </>);

      default: return null;
    }
  };

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden", minWidth:0, width:"100%", boxSizing:"border-box" }}>
      {/* Tabs sidebar */}
      <div style={{ width:180, background:C.panel, borderRight:`1px solid ${C.border}`, padding:"20px 12px", flexShrink:0, overflowY:"auto" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:12, paddingLeft:4 }}>Settings</div>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ width:"100%", background:tab===t.id?C.gold+"18":"transparent", border:`1px solid ${tab===t.id?C.gold+"44":"transparent"}`, borderRadius:9, padding:"9px 12px", color:tab===t.id?C.gold:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:tab===t.id?600:400, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:8, transition:"all .15s", marginBottom:3 }}>
            <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", boxSizing:"border-box", paddingBottom:80 }}>
        {renderTab()}
        <SaveBar onSave={handleSave} onReset={handleReset} saved={saved} />
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{ position:"fixed", bottom:80, right:24, background:C.card, border:`1px solid ${toast.color}55`, borderRadius:12, padding:"12px 20px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:toast.color, boxShadow:"0 8px 24px #00000066", zIndex:2000, animation:"fadeSlideIn .3s ease", maxWidth:320 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
