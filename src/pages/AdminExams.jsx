import { useState, useEffect } from "react";
import { QUESTIONS as DATA_QUESTIONS } from "../data.js";
import { api } from "../api.js";
import { getSections } from "../sections.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');`;

let C = { bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",gold:"#c8a96e",goldDim:"#7c5830",text:"#e2e8f0",muted:"#475569",dim:"#1e293b",success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa",purple:"#a78bfa",scrollThumb:"#243050",sidebarBg:"#080f1a",topbarBg:"#080f1acc" };

const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const LEVEL_COLORS = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };
const SECTIONS = getSections();
const QTYPES_LIST = [
  { id:"single_choice", label:"Single Choice", icon:"◉" },
  { id:"multi_choice",  label:"Multi Choice",  icon:"☑" },
  { id:"multi_select",  label:"Multi Select",  icon:"⊞" },
  { id:"fill_blank",    label:"Fill Blank",    icon:"✎" },
  { id:"fill_wordbank", label:"Word Bank",     icon:"🧩" },
  { id:"writing",       label:"Writing",       icon:"✍" },
  { id:"audio",         label:"Audio",         icon:"🎧" },
  { id:"video",         label:"Video",         icon:"🎬" },
  { id:"voice",         label:"Voice",         icon:"🎤" },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
const SEED_QUESTIONS = DATA_QUESTIONS; // used only for question-pool availability checks in wizard

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META = {
  draft:     { label:"Draft",     color:"#f59e0b", icon:"○" },
  active:    { label:"Active",    color:"#22c55e", icon:"●" },
  scheduled: { label:"Scheduled", color:"#60a5fa", icon:"◷" },
  completed: { label:"Completed", color:"#94a3b8", icon:"✓" },
  archived:  { label:"Archived",  color:"#475569", icon:"▪" },
};

const QTYPE_ICON = { single_choice:"◉", multi_choice:"☑", multi_select:"⊞", audio:"🎧", video:"🎬", fill_blank:"✎", writing:"✍" };
const QTYPE_COLOR = { single_choice:"#60a5fa", multi_choice:"#a78bfa", multi_select:"#34d399", audio:"#f59e0b", video:"#f87171", fill_blank:"#e879f9", writing:"#94a3b8" };

function totalPoints(qIds) {
  return (qIds||[]).reduce((s,id)=>{ const q=SEED_QUESTIONS.find(q=>q.id===id); return s+(q?.points||0); },0);
}

// ── UI Atoms ──────────────────────────────────────────────────────────────────
function Badge({ children, color, small }) {
  return <span style={{ background:color+"18", color, border:`1px solid ${color}33`, borderRadius:6, padding: small?"1px 7px":"3px 10px", fontSize: small?10:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:.4, whiteSpace:"nowrap" }}>{children}</span>;
}

function Btn({ children, onClick, variant="ghost", color, disabled, small, style={} }) {
  const base = { fontFamily:"'DM Sans',sans-serif", fontSize: small?12:13, fontWeight:600, borderRadius:9, padding: small?"6px 14px":"10px 20px", cursor: disabled?"not-allowed":"pointer", border:"none", transition:"all .15s", opacity: disabled?.5:1, ...style };
  const styles = {
    primary: { background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, color:"white", boxShadow:`0 4px 14px ${C.gold}44` },
    danger:  { background:"#f8717118", color:C.danger, border:`1px solid ${C.danger}33` },
    ghost:   { background:"transparent", color:C.muted, border:`1px solid ${C.border2}` },
    solid:   { background: color||C.card, color:C.text, border:`1px solid ${C.border2}` },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...styles[variant]}}>{children}</button>;
}

function Input({ label, value, onChange, placeholder, type="text", style={} }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase" }}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:10,padding:"10px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",...style }}
        onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border2}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase" }}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:10,padding:"10px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",cursor:"pointer" }}>
        {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange, hint }) {
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:C.panel,border:`1px solid ${C.border2}`,borderRadius:10 }}>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,fontWeight:500 }}>{label}</div>
        {hint && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2 }}>{hint}</div>}
      </div>
      <div onClick={()=>onChange(!value)} style={{ width:44,height:24,borderRadius:12,background:value?C.gold:C.dim,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0 }}>
        <div style={{ position:"absolute",top:3,left:value?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left .2s",boxShadow:"0 1px 4px #0006" }} />
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"#00000092",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{ background:C.panel,border:`1px solid ${C.border2}`,borderRadius:22,padding:"36px 40px",width:"100%",maxWidth:wide?900:680,maxHeight:"92vh",overflowY:"auto",animation:"fadeSlideIn .3s ease",boxShadow:"0 32px 80px #000000bb" }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28 }}>
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,margin:"0 0 4px",fontWeight:600 }}>{title}</h2>
            {subtitle && <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,margin:0 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${C.border2}`,borderRadius:8,width:34,height:34,color:C.muted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Wizard Step Indicator ─────────────────────────────────────────────────────
function StepBar({ steps, current }) {
  return (
    <div style={{ display:"flex",alignItems:"center",marginBottom:32 }}>
      {steps.map((s,i)=>(
        <div key={i} style={{ display:"flex",alignItems:"center",flex: i<steps.length-1?1:"none" }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background: i<current?C.success:i===current?C.gold:C.dim, border:`2px solid ${i<current?C.success:i===current?C.gold:C.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color: i<=current?"white":C.muted,transition:"all .3s" }}>
              {i < current ? "✓" : i+1}
            </div>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color: i===current?C.gold:C.muted,whiteSpace:"nowrap",letterSpacing:.3 }}>{s}</span>
          </div>
          {i < steps.length-1 && <div style={{ flex:1,height:2,background: i<current?C.success:C.border,margin:"0 8px",marginBottom:16,transition:"background .3s" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Exam Wizard ───────────────────────────────────────────────────────────────
const WIZARD_STEPS = ["General","Questions","Students","Schedule"];

function ExamWizard({ initial, onSave, onCancel, students = [] }) {
  const isEdit = !!initial;
  const blankFixed = { examType:"fixed", title:"", level:"B1", duration:60, passingScore:70, shuffle:true, showResults:true, allowReview:false, showQuestionLevel:true, showQuestionPoints:true,
    subpools:[{ section:"Reading", count:3 },{ section:"Grammar", count:2 }],
    assignedTo:[], startDate:"", endDate:"", startTime:"09:00", endTime:"18:00", status:"draft", notes:"" };
  const blankPlacement = { examType:"placement", title:"", level:null, duration:90, passingScore:null, shuffle:true, showResults:true, allowReview:false, showQuestionLevel:true, showQuestionPoints:true, showPlacementThreshold:true,
    startDate:"", endDate:"", startTime:"09:00", endTime:"18:00", status:"draft", notes:"",
    questionIds:[], assignedTo:[],
    placementTemplate:[
      { level:"A1", pointsEach:1, subpools:[{ section:"Reading", count:3 },{ section:"Grammar", count:2 }] },
      { level:"A2", pointsEach:1, subpools:[{ section:"Reading", count:3 },{ section:"Vocabulary", count:2 }] },
      { level:"B1", pointsEach:2, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Grammar", count:1 }] },
      { level:"B2", pointsEach:2, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Writing", count:1 }] },
      { level:"C1", pointsEach:3, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Writing", count:1 }] },
      { level:"C2", pointsEach:3, subpools:[{ section:"Reading", count:2 },{ section:"Grammar", count:2 },{ section:"Writing", count:1 }] },
    ],
    placementThresholds:{ A1:60, A2:60, B1:60, B2:60, C1:60, C2:60 },
  };
  const blank = blankFixed;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial ? {...blank,...initial} : blank);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const availableQs = SEED_QUESTIONS.filter(q => !form.level || q.level === form.level || form.level === "all");
  const toggleQ = (id) => set("questionIds", form.questionIds.includes(id) ? form.questionIds.filter(x=>x!==id) : [...form.questionIds,id]);
  const toggleStudent = (id) => set("assignedTo", form.assignedTo.includes(id) ? form.assignedTo.filter(x=>x!==id) : [...form.assignedTo,id]);

  const pts = totalPoints(form.questionIds);

  // Subpool helpers — shared for both fixed and placement
  const fixedTotalQ = (form.subpools||[]).reduce((s,sp)=>s+sp.count,0);
  const rowTotal = (row) => (row.subpools||[]).reduce((s,sp)=>s+sp.count,0);

  // Fixed subpool ops
  const addFixedSubpool   = () => set("subpools", [...(form.subpools||[]), {section:"Reading", count:2}]);
  const removeFixedSP     = (idx) => set("subpools", (form.subpools||[]).filter((_,i)=>i!==idx));
  const updateFixedSP     = (idx, field, val) =>
    set("subpools", (form.subpools||[]).map((sp,i)=>i===idx?{...sp,[field]:field==="count"?+val:val}:sp));

  // Placement subpool ops
  const updatePtsEach     = (level, val) =>
    set("placementTemplate", (form.placementTemplate||[]).map(r=>r.level===level?{...r,pointsEach:+val}:r));
  const addSubpool        = (level) =>
    set("placementTemplate", (form.placementTemplate||[]).map(r=>r.level===level
      ? {...r, subpools:[...(r.subpools||[]), {section:"Reading", count:2}]} : r));
  const removeSubpool     = (level, idx) =>
    set("placementTemplate", (form.placementTemplate||[]).map(r=>r.level===level
      ? {...r, subpools:(r.subpools||[]).filter((_,i)=>i!==idx)} : r));
  const updateSubpool     = (level, idx, field, val) =>
    set("placementTemplate", (form.placementTemplate||[]).map(r=>r.level===level
      ? {...r, subpools:(r.subpools||[]).map((sp,i)=>i===idx?{...sp,[field]:field==="count"?+val:val}:sp)} : r));

  const updateThreshold   = (level, val) =>
    set("placementThresholds", {...(form.placementThresholds||{}), [level]:+val});

  const placementTotalQ   = (form.placementTemplate||[]).reduce((s,r)=>s+rowTotal(r),0);
  const placementTotalPts = (form.placementTemplate||[]).reduce((s,r)=>s+rowTotal(r)*r.pointsEach,0);

  const step0 = (
    <div style={{ display:"flex",flexDirection:"column",gap:22 }}>

      {/* ── Exam Type selector ── */}
      <div>
        <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase",display:"block",marginBottom:12 }}>Exam Type</label>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {[
            { id:"fixed",     icon:"🎯", title:"Fixed Level Exam",
              desc:"All questions are from one level (A1–C2). Pass/fail based on a fixed score threshold." },
            { id:"placement", icon:"📊", title:"Placement Exam",
              desc:"Questions from all levels (e.g. 5×A1, 5×A2 … 5×C2). The system calculates the student's language level automatically." },
          ].map(t=>{
            const sel = form.examType===t.id;
            return (
              <button key={t.id} onClick={()=>{
                if (t.id==="fixed") setForm({...blankFixed, title:form.title});
                else setForm({...blankPlacement, title:form.title});
              }} style={{
                background: sel?C.gold+"14":"transparent",
                border:`2px solid ${sel?C.gold:C.border2}`,
                borderRadius:14, padding:"18px 20px", textAlign:"left",
                cursor:"pointer", transition:"all .2s", position:"relative",
              }}>
                {sel && <div style={{ position:"absolute",top:12,right:14,width:18,height:18,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center" }}><svg width={10} height={10} viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg></div>}
                <div style={{ fontSize:24,marginBottom:8 }}>{t.icon}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:sel?C.gold:C.text,fontWeight:600,marginBottom:6 }}>{t.title}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,lineHeight:1.5 }}>{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Common fields ── */}
      <Input label="Exam Title" value={form.title} onChange={v=>set("title",v)} placeholder={form.examType==="placement"?"e.g. «Language Placement Test»":"e.g. «Summer B1 Examination»"} />
      <div style={{ display:"grid",gridTemplateColumns:`${form.examType==="fixed"?"1fr 1fr 1fr":"1fr 1fr"}`,gap:14 }}>
        {form.examType==="fixed" && (
          <Select label="Language Level" value={form.level||"B1"} onChange={v=>set("level",v)}
            options={LEVELS.map(l=>({value:l,label:l}))} />
        )}
        <Input label="Duration (min)" value={form.duration} onChange={v=>set("duration",+v)} type="number" />
        {form.examType==="fixed" && (
          <Input label="Passing Score (%)" value={form.passingScore} onChange={v=>set("passingScore",+v)} type="number" />
        )}
      </div>

      {/* ── FIXED: nothing extra needed ── */}

      {/* ── PLACEMENT: template editor ── */}
      {form.examType==="placement" && (
        <div style={{ display:"flex",flexDirection:"column",gap:20 }}>

          {/* Question template per level with subpools */}
          <div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
              <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase" }}>Questions per Level · Subpools</label>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gold }}>
                Total: {placementTotalQ} questions · {placementTotalPts} pts
              </span>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {(form.placementTemplate||[]).map(row=>{
                const lc = LEVEL_COLORS[row.level]||"#94a3b8";
                const total = rowTotal(row);
                return (
                  <div key={row.level} style={{ background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                    {/* Level header */}
                    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:C.dim,borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{row.level}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>
                        {total} questions ·
                      </span>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>pts each:</span>
                        <input type="number" min={1} max={10} value={row.pointsEach}
                          onChange={e=>updatePtsEach(row.level,e.target.value)}
                          style={{ background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"3px 8px",color:C.gold,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,outline:"none",width:48,textAlign:"center" }} />
                      </div>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:C.gold,fontWeight:700,marginLeft:"auto" }}>{total*row.pointsEach} pt subtotal</span>
                      <button onClick={()=>addSubpool(row.level)} style={{ background:C.gold+"18",border:`1px solid ${C.gold}44`,borderRadius:6,padding:"4px 10px",color:C.gold,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",fontWeight:600 }}>+ Add subpool</button>
                    </div>
                    {/* Subpools */}
                    {(row.subpools||[]).length === 0 && (
                      <div style={{ padding:"12px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,fontStyle:"italic" }}>No subpools — click "+ Add subpool" to define pools</div>
                    )}
                    {(row.subpools||[]).map((sp,idx)=>{
                      const poolCount = SEED_QUESTIONS.filter(q=>q.level===row.level&&q.section===sp.section).length;
                      const ok = poolCount >= sp.count;
                      return (
                        <div key={idx} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 16px",borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,width:20,textAlign:"center" }}>┗</span>
                          <select value={sp.section} onChange={e=>updateSubpool(row.level,idx,"section",e.target.value)}
                            style={{ background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"5px 8px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",flex:"0 0 140px" }}>
                            {SECTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                          <input type="number" min={1} max={20} value={sp.count}
                            onChange={e=>updateSubpool(row.level,idx,"count",e.target.value)}
                            style={{ background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"5px 8px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",width:56,textAlign:"center" }} />
                          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:ok?C.success:"#f87171",minWidth:90 }}>
                            {ok ? `✓ ${poolCount} available` : `✗ only ${poolCount} (need ${sp.count})`}
                          </span>
                          <button onClick={()=>removeSubpool(row.level,idx)} style={{ background:"transparent",border:"none",color:"#f87171",cursor:"pointer",fontSize:15,padding:"0 4px",marginLeft:"auto" }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level thresholds */}
          <div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
              <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase" }}>Level Thresholds (%)</label>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>Student must pass each level consecutively (no gaps)</span>
            </div>
            <div style={{ background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",display:"flex",flexDirection:"column",gap:12 }}>
              {LEVELS.map((level,i)=>{
                const thresh = (form.placementThresholds||{})[level]??0;
                const lc = LEVEL_COLORS[level]||"#94a3b8";
                return (
                  <div key={level} style={{ display:"flex",alignItems:"center",gap:16 }}>
                    <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",width:44,textAlign:"center",flexShrink:0 }}>{level}</span>
                    <div style={{ flex:1,height:6,background:C.dim,borderRadius:3,overflow:"hidden" }}>
                      <div style={{ width:`${thresh}%`,height:"100%",background:lc,borderRadius:3,transition:"width .3s" }}/>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
                      <input type="range" min={0} max={100} value={thresh}
                        onChange={e=>updateThreshold(level,e.target.value)}
                        style={{ width:100,accentColor:lc,cursor:"pointer" }} />
                      <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:lc,fontWeight:700,width:36,textAlign:"right" }}>{thresh}%</span>
                    </div>
                    {i>0 && (
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,width:140 }}>
                        {level} questions: need ≥ {thresh}%
                      </span>
                    )}
                    {i===0 && (
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,width:140 }}>
                        A1 questions: need ≥ {thresh}% to pass
                      </span>
                    )}
                  </div>
                );
              })}
              {/* Visual explanation */}
              <div style={{ marginTop:4,background:C.card,borderRadius:8,padding:"10px 14px" }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,lineHeight:1.6 }}>
                  💡 Each level is scored <strong style={{color:C.text}}>independently</strong>. 
                  Student gets highest level where <em>they and all lower levels</em> meet the threshold.
                  Example: A1✓ A2✓ B1✗ → result is <strong style={{color:LEVEL_COLORS["A2"]}}>A2</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Input label="Notes (optional)" value={form.notes} onChange={v=>set("notes",v)} placeholder="Internal notes..." />
    </div>
  );

  // Step 1 — Questions (fixed) or Pool overview (placement)
  const step1 = (()=>{
    if (form.examType === "placement") {
      // Placement: show pool status per level - how many questions exist vs needed
      return (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 22px" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6 }}>
              In a Placement Exam, questions are drawn <strong style={{color:C.text}}>automatically from the question bank</strong> at exam time, based on the template you defined in Step 1.<br/>
              <span style={{ color:C.gold }}>Review the question pool availability below.</span>
            </div>
            <div style={{ background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
              <div style={{ display:"grid",gridTemplateColumns:"60px 1fr 80px 70px 70px",gap:12,padding:"10px 18px",borderBottom:`1px solid ${C.border}`,background:C.dim }}>
                {["Level","Subpools","Total Q","Threshold","Status"].map(h=>(
                  <span key={h} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,fontWeight:700,letterSpacing:.6,textTransform:"uppercase" }}>{h}</span>
                ))}
              </div>
              {(form.placementTemplate||[]).map(row=>{
                const lc = LEVEL_COLORS[row.level]||"#94a3b8";
                const total = rowTotal(row);
                const allOk = (row.subpools||[]).every(sp=>
                  SEED_QUESTIONS.filter(q=>q.level===row.level&&q.section===sp.section).length >= sp.count
                );
                return (
                  <div key={row.level}>
                    <div style={{ display:"grid",gridTemplateColumns:"60px 1fr 80px 70px 70px",gap:12,padding:"10px 18px",borderBottom:`1px solid ${C.border}`,alignItems:"center",background:allOk?"transparent":"#f8717108" }}>
                      <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",textAlign:"center" }}>{row.level}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>{total} q across {(row.subpools||[]).length} subpool{(row.subpools||[]).length!==1?"s":""}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,textAlign:"center" }}>{total}</span>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:lc,fontWeight:700,textAlign:"center" }}>≥{(form.placementThresholds||{})[row.level]??60}%</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:allOk?C.success:"#f87171" }}>{allOk?"✓ OK":"✗ Error"}</span>
                    </div>
                    {(row.subpools||[]).map((sp,idx)=>{
                      const poolCount = SEED_QUESTIONS.filter(q=>q.level===row.level&&q.section===sp.section).length;
                      const ok = poolCount >= sp.count;
                      return (
                        <div key={idx} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 18px 7px 32px",borderBottom:`1px solid ${C.border}`,background:ok?"transparent":"#f8717106" }}>
                          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>┗</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,flex:1 }}>{sp.section}</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>need {sp.count}</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:ok?C.success:"#f87171",fontWeight:600,minWidth:80,textAlign:"right" }}>
                            {ok ? `✓ ${poolCount} in pool` : `✗ only ${poolCount}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{ padding:"12px 18px",display:"flex",justifyContent:"space-between" }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>Total: {placementTotalQ} questions · {placementTotalPts} points</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>Questions selected randomly at exam time</span>
              </div>
            </div>
          </div>
          <Toggle label="Shuffle Questions" hint="Randomize order within each level group" value={form.shuffle} onChange={v=>set("shuffle",v)} />
        </div>
      );
    }
    // Fixed exam — subpool editor by section
    const level = form.level || "B1";
    return (
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 18px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,lineHeight:1.6 }}>
          Questions are picked <strong style={{color:C.text}}>randomly</strong> at exam time from the <strong style={{color:LEVEL_COLORS[level]||C.gold}}>{level}</strong> question bank, by section.
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase" }}>
              Section subpools · total: {fixedTotalQ} questions
            </span>
            <button onClick={addFixedSubpool} style={{ background:C.gold+"18",border:`1px solid ${C.gold}44`,borderRadius:6,padding:"4px 12px",color:C.gold,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",fontWeight:600 }}>+ Add section</button>
          </div>
          {(form.subpools||[]).length === 0 && (
            <div style={{ padding:"16px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,fontStyle:"italic",background:C.panel,borderRadius:10,textAlign:"center" }}>No sections added yet</div>
          )}
          {(form.subpools||[]).map((sp,idx)=>{
            const poolCount = SEED_QUESTIONS.filter(q=>q.level===level&&q.section===sp.section).length;
            const ok = poolCount >= sp.count;
            return (
              <div key={idx} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.panel,border:`1.5px solid ${ok?C.border2:"#f8717144"}`,borderRadius:10 }}>
                <select value={sp.section} onChange={e=>updateFixedSP(idx,"section",e.target.value)}
                  style={{ background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",flex:"0 0 160px" }}>
                  {SECTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" min={1} max={30} value={sp.count}
                  onChange={e=>updateFixedSP(idx,"count",e.target.value)}
                  style={{ background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",width:64,textAlign:"center" }} />
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:ok?C.success:"#f87171",flex:1 }}>
                  {ok ? `✓ ${poolCount} available` : `✗ only ${poolCount} in pool (need ${sp.count})`}
                </span>
                <button onClick={()=>removeFixedSP(idx)} style={{ background:"transparent",border:"none",color:"#f87171",cursor:"pointer",fontSize:15,padding:"0 4px" }}>✕</button>
              </div>
            );
          })}
        </div>
        <Toggle label="Shuffle Questions" hint="Randomize question order for each student" value={form.shuffle} onChange={v=>set("shuffle",v)} />
      </div>
    );
  })();

  // Step 2 — Students
  const step2 = (()=>{
    const allSelected = students.length > 0 && students.every(s=>form.assignedTo.includes(s.id));
    const toggleAll = () => set("assignedTo", allSelected ? [] : students.map(s=>s.id));
    return (
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>Selected: <span style={{ color:C.gold,fontWeight:700 }}>{form.assignedTo.length}</span> students</span>
          <button onClick={toggleAll} style={{ background:allSelected?C.info+"22":"transparent",border:`1px solid ${allSelected?C.info:C.border2}`,borderRadius:8,padding:"6px 14px",color:allSelected?C.info:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .15s" }}>
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
        {/* Student list */}
        <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:340,overflowY:"auto" }}>
          {students.map(s=>{
            const sel = form.assignedTo.includes(s.id);
            const lc = LEVEL_COLORS[s.level]||"#94a3b8";
            return (
              <div key={s.id} onClick={()=>toggleStudent(s.id)} style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:sel?C.info+"0e":C.panel,border:`1.5px solid ${sel?C.info+"55":C.border}`,borderRadius:10,cursor:"pointer",transition:"all .15s" }}>
                <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?C.info:C.border2}`,background:sel?C.info+"33":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  {sel && <svg width={11} height={11} viewBox="0 0 11 11"><path d="M1.5 6l3 3 5-5" stroke={C.info} strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0 }}>
                  {s.name[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:sel?C.text:C.muted,fontWeight:500 }}>{s.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{s.email}</div>
                </div>
                <Badge color="#94a3b8" small>#{s.id}</Badge>
                <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:5,padding:"1px 8px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{s.level||"—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  })();

  // Step 3 — Schedule & settings
  const step3 = (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <Input label="Start Date" value={form.startDate} onChange={v=>set("startDate",v)} type="date" />
        <Input label="End Date" value={form.endDate} onChange={v=>set("endDate",v)} type="date" />
        <Input label="Start Time" value={form.startTime} onChange={v=>set("startTime",v)} type="time" />
        <Input label="End Time" value={form.endTime} onChange={v=>set("endTime",v)} type="time" />
      </div>
      <Select label="Status" value={form.status} onChange={v=>set("status",v)} options={Object.entries(STATUS_META).map(([v,m])=>({value:v,label:m.label}))} />
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",paddingBottom:4,borderBottom:`1px solid ${C.border}` }}>Behaviour</div>
        <Toggle label="Show results to student" hint="Show results to student after exam" value={form.showResults} onChange={v=>set("showResults",v)} />
        <Toggle label="Allow Answer Review" hint="Allow answer review after submission" value={form.allowReview} onChange={v=>set("allowReview",v)} />
        <Toggle label="Show question level (A1–C2) to student" hint="Students see the level badge on each question during the exam" value={form.showQuestionLevel??true} onChange={v=>set("showQuestionLevel",v)} />
        <Toggle label="Show question points to student" hint="Students see the point value of each question during the exam" value={form.showQuestionPoints??true} onChange={v=>set("showQuestionPoints",v)} />
        {form.examType==="placement" && (
          <Toggle label="Show level thresholds to student" hint="On the exam start screen, show required % threshold per level" value={form.showPlacementThreshold??true} onChange={v=>set("showPlacementThreshold",v)} />
        )}
      </div>
      {/* Summary card */}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px 24px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:14 }}>Summary</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12 }}>
          {[
            { label:"Questions", value: form.examType==="placement"?placementTotalQ:fixedTotalQ, color:C.gold },
            { label:"Points",  value: pts,                    color:C.warning },
            { label:"Student", value: form.assignedTo.length,  color:C.info },
            { label:"Pass %", value: form.passingScore+"%",   color:C.success },
          ].map(x=>(
            <div key={x.label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:x.color,fontWeight:700 }}>{x.value}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{x.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const STEP_CONTENT = [step0,step1,step2,step3];
  const STEP_LABELS = ["General", "Questions", "Students", "Schedule & Settings"];
  const canProceed = [
    form.title.trim().length > 0,
    form.examType === "placement" ? placementTotalQ > 0 : fixedTotalQ > 0,
    (form.assignedTo||[]).length > 0,
    true,
  ];

  // Edit mode: show all sections at once
  if (isEdit) return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {STEP_CONTENT.map((content, i) => (
        <div key={i} style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:16, paddingBottom:8, borderBottom:`1px solid ${C.border}` }}>
            {STEP_LABELS[i]}
          </div>
          {content}
        </div>
      ))}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" onClick={()=>onSave(form)}>✓ Save</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <StepBar steps={WIZARD_STEPS} current={step} />
      <div style={{ minHeight:380 }}>{STEP_CONTENT[step]}</div>
      <div style={{ display:"flex",justifyContent:"space-between",marginTop:28,paddingTop:20,borderTop:`1px solid ${C.border}` }}>
        <Btn onClick={step===0?onCancel:()=>setStep(s=>s-1)}>
          {step===0 ? "Cancel" : "← Back"}
        </Btn>
        <div style={{ display:"flex",gap:10 }}>
          {step<3 && <Btn variant="ghost" onClick={()=>set("status","draft")}>Save Draft</Btn>}
          {step < 3
            ? <Btn variant="primary" disabled={!canProceed[step]} onClick={()=>setStep(s=>s+1)}>Next →</Btn>
            : <Btn variant="primary" onClick={()=>onSave(form)}>✓ Create</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ── Exam Card ─────────────────────────────────────────────────────────────────
function ExamCard({ exam, onEdit, onDelete, onAssign, onViewResults, allStudents = [] }) {
  const sm = STATUS_META[exam.status]||STATUS_META.draft;
  const lc = LEVEL_COLORS[exam.level]||"#94a3b8";
  const pts = (exam.subpools||[]).reduce((s,sp)=>s+sp.count,0);
  const assignedStudents = allStudents.filter(s=>exam.assignedTo.includes(s.id));

  return (
    <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px",display:"flex",flexDirection:"column",gap:16,transition:"border .2s",cursor:"default" }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.border2}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      {/* Top */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
            {exam.examType==="placement"
              ? <span style={{ background:"#a78bfa18",color:"#a78bfa",border:"1px solid #a78bfa33",borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>📊 Placement</span>
              : <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{exam.level}</span>
            }
            <span style={{ background:sm.color+"18",color:sm.color,border:`1px solid ${sm.color}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{sm.icon} {sm.label}</span>
          </div>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:C.text,margin:"0 0 4px",fontWeight:600,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{exam.title}</h3>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{exam.createdAt}</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"flex",gap:12 }}>
        {(exam.examType==="placement" ? [
          { icon:"📊",val:(exam.placementTemplate||[]).reduce((s,r)=>s+(r.subpools||[]).reduce((ss,sp)=>ss+sp.count,0),0)+" q",tip:"Total Questions" },
          { icon:"🎚",val:"A1→C2",tip:"All Levels" },
          { icon:"⏱",val:exam.duration+" min",tip:"Duration" },
          { icon:"🎯",val:`${Math.min(...Object.values(exam.placementThresholds||{A1:60}))}%/lvl`,tip:"Per-level threshold" },
        ] : [
          { icon:"📋",val:(exam.subpools||(exam.placementTemplate||[]).flatMap(r=>r.subpools||[])).reduce((s,sp)=>s+sp.count,0)+" q",tip:"Questions" },
          { icon:"🏆",val:pts+" pts",tip:"Total Points" },
          { icon:"⏱",val:exam.duration+" min",tip:"Duration" },
          { icon:"🎯",val:(exam.passingScore??0)+"%",tip:"Pass Score" },
        ]).map(x=>(
          <div key={x.tip} style={{ flex:1,background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px",textAlign:"center" }}>
            <div style={{ fontSize:14,marginBottom:2 }}>{x.icon}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,fontWeight:600 }}>{x.val}</div>
          </div>
        ))}
      </div>

      {/* Date */}
      {exam.startDate && (
        <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:9 }}>
          <span style={{ fontSize:13 }}>📅</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>{exam.startDate}{exam.endDate&&exam.endDate!==exam.startDate?" → "+exam.endDate:""}</span>
        </div>
      )}

      {/* Assigned students */}
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:8 }}>
          Assigned Students · {assignedStudents.length}
        </div>
        <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
          {assignedStudents.slice(0,5).map(s=>(
            <div key={s.id} title={s.name} style={{ width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,border:`2px solid ${C.panel}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:C.text,fontFamily:"'DM Sans',sans-serif" }}>
              {s.name[0]}
            </div>
          ))}
          {assignedStudents.length>5 && (
            <div style={{ width:30,height:30,borderRadius:"50%",background:C.dim,border:`2px solid ${C.panel}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.muted,fontFamily:"'DM Sans',sans-serif" }}>
              +{assignedStudents.length-5}
            </div>
          )}
          {assignedStudents.length===0 && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>None yet</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex",gap:8,paddingTop:4 }}>
        <Btn small onClick={()=>onEdit(exam)} style={{ flex:1 }}>✎ Edit</Btn>
        <Btn small onClick={()=>onAssign(exam)} style={{ flex:1 }} variant="solid" color={C.info+"22"}>
          <span style={{ color:C.info }}>+ Assign</span>
        </Btn>
        {exam.status==="completed" && (
          <Btn small onClick={()=>onViewResults(exam)} style={{ flex:1 }} variant="solid" color={C.success+"22"}>
            <span style={{ color:C.success }}>📊 Results</span>
          </Btn>
        )}
        <Btn small variant="danger" onClick={()=>onDelete(exam.id)}>✕</Btn>
      </div>
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({ exam, onClose, onSave, students = [] }) {
  const [assigned, setAssigned] = useState([...exam.assignedTo]);
  const toggle = (id) => setAssigned(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);
  const allSelected = students.length > 0 && students.every(s=>assigned.includes(s.id));
  const toggleAll = () => setAssigned(allSelected ? [] : students.map(s=>s.id));
  return (
    <Modal title="Assign Students" subtitle={exam.title} onClose={onClose}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>Selected: <span style={{ color:C.gold,fontWeight:700 }}>{assigned.length}</span></span>
        <button onClick={toggleAll} style={{ background:allSelected?C.info+"22":"transparent",border:`1px solid ${allSelected?C.info:C.border2}`,borderRadius:8,padding:"5px 14px",color:allSelected?C.info:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .15s" }}>
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:360,overflowY:"auto",marginBottom:20 }}>
        {students.map(s=>{
          const sel=assigned.includes(s.id);
          const lc=LEVEL_COLORS[s.level]||"#94a3b8";
          return (
            <div key={s.id} onClick={()=>toggle(s.id)} style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:sel?C.info+"0e":C.panel,border:`1.5px solid ${sel?C.info+"55":C.border}`,borderRadius:10,cursor:"pointer",transition:"all .15s" }}>
              <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?C.info:C.border2}`,background:sel?C.info+"33":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {sel&&<svg width={11} height={11} viewBox="0 0 11 11"><path d="M1.5 6l3 3 5-5" stroke={C.info} strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>{s.name[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:sel?C.text:C.muted,fontWeight:500 }}>{s.name}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{s.email}</div>
              </div>
              <Badge color="#94a3b8" small>#{s.id}</Badge>
              <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:5,padding:"1px 8px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{s.level||"—"}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={()=>onSave(assigned)}>✓ Save</Btn>
      </div>
    </Modal>
  );
}

// ── Results Preview ───────────────────────────────────────────────────────────
function ResultsModal({ exam, onClose, allStudents = [] }) {
  const [results, setResults] = useState([]);
  useEffect(() => {
    api.getResults({ examId: exam.id }).then(setResults);
  }, [exam.id]);

  return (
    <Modal title="Results" subtitle={exam.title} onClose={onClose}>
      <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:420,overflowY:"auto" }}>
        {results.length === 0 && (
          <div style={{ padding:"32px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>No results yet</div>
        )}
        {results.map(r=>{
          const s = allStudents.find(x=>x.id===r.studentId) || r.student;
          const pass = r.passed;
          return (
            <div key={r.id} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:10 }}>
              <div style={{ width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{s?.name?.[0]||"?"}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,fontWeight:500 }}>{s?.name||"Unknown"}</div>
                <div style={{ height:5,background:C.dim,borderRadius:3,marginTop:6,overflow:"hidden" }}>
                  <div style={{ width:`${r.pct}%`,height:"100%",background:pass?C.success:C.danger,borderRadius:3,transition:"width .6s" }} />
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:pass?C.success:C.danger,fontWeight:700 }}>{r.score}/{r.totalPoints}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:pass?C.success:C.danger }}>{r.pct}% · {pass?"✓ Pass":"✕ Fail"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  { id:"questions",icon:"📋",label:"Questions" },
  { id:"exams",    icon:"🎓",label:"Exams" },
  { id:"students", icon:"👤",label:"Students" },
  { id:"results",  icon:"📊",label:"Analytics" },
  { id:"media",    icon:"📁",label:"Media" },
  { id:"settings", icon:"⚙️", label:"Settings" },
];


// ── Exams Page ────────────────────────────────────────────────────────────────
function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [viewingResults, setViewingResults] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([api.getExams(), api.getStudents()]).then(([e, s]) => {
      setExams(e); setStudents(s); setLoading(false);
    });
  }, []);

  const filtered = exams.filter(e=>{
    if (filterStatus!=="all" && e.status!==filterStatus) return false;
    if (filterLevel!=="all" && e.level!==filterLevel) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async (form) => {
    if (modal==="edit") {
      const updated = await api.updateExam(form.id, form);
      setExams(es=>es.map(e=>e.id===updated.id?updated:e));
    } else {
      const created = await api.createExam(form);
      setExams(es=>[created,...es]);
    }
    setModal(null); setEditing(null);
  };
  const handleDelete = async (id) => {
    await api.deleteExam(id);
    setExams(es=>es.filter(e=>e.id!==id));
    setDeleteId(null);
  };
  const handleAssignSave = async (ids) => {
    const updated = await api.updateExam(assigning.id, { assignedTo: ids });
    setExams(es=>es.map(e=>e.id===assigning.id?updated:e));
    setAssigning(null);
  };

  const statCounts = Object.fromEntries(Object.keys(STATUS_META).map(s=>[s,exams.filter(e=>e.status===s).length]));

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", boxSizing:"border-box" }}>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:C.text,margin:"0 0 4px",fontWeight:600 }}>Exam Management</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,margin:0 }}>Exam Management · Create & Assign</p>
        </div>
        <Btn variant="primary" onClick={()=>{setEditing(null);setModal("create")}}>+ New Exam</Btn>
      </div>

      {/* Status cards */}
      <div style={{ display:"flex",gap:12,marginBottom:24,flexWrap:"wrap" }}>
        {Object.entries(STATUS_META).map(([s,m])=>(
          <div key={s} onClick={()=>setFilterStatus(filterStatus===s?"all":s)}
            style={{ background:filterStatus===s?m.color+"18":C.card,border:`1px solid ${filterStatus===s?m.color+"55":C.border}`,borderRadius:12,padding:"14px 20px",cursor:"pointer",transition:"all .15s",minWidth:100 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:m.color }}>{statCounts[s]||0}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",marginBottom:20,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Որ. քննություններ..." style={{ flex:"1 1 180px",background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:9,padding:"8px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none" }} />
        <div style={{ display:"flex",gap:6 }}>
          {[{value:"all",label:"All"},...LEVELS.map(l=>({value:l,label:l}))].map(({value,label})=>{
            const lc=LEVEL_COLORS[value]||C.gold;
            const act=filterLevel===value;
            return <button key={value} onClick={()=>setFilterLevel(value)} style={{ background:act?(lc+"22"):"transparent",border:`1px solid ${act?lc:C.border2}`,borderRadius:8,padding:"6px 12px",color:act?lc:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer",transition:"all .15s" }}>{label}</button>;
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign:"center",padding:"60px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>Loading…</div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>No exams found</div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:18 }}>
          {filtered.map(exam=>(
            <ExamCard key={exam.id} exam={exam}
              allStudents={students}
              onEdit={e=>{setEditing(e);setModal("edit")}}
              onDelete={id=>setDeleteId(id)}
              onAssign={e=>setAssigning(e)}
              onViewResults={e=>setViewingResults(e)}
            />
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      {(modal==="create"||modal==="edit") && (
        <Modal title={modal==="edit"?"Edit Exam":"New Exam"} subtitle="4-step wizard" onClose={()=>{setModal(null);setEditing(null)}} wide>
          <ExamWizard initial={editing} onSave={handleSave} onCancel={()=>{setModal(null);setEditing(null)}} students={students} />
        </Modal>
      )}

      {/* Assign Modal */}
      {assigning && <AssignModal exam={assigning} onClose={()=>setAssigning(null)} onSave={handleAssignSave} students={students} />}

      {/* Results Modal */}
      {viewingResults && <ResultsModal exam={viewingResults} onClose={()=>setViewingResults(null)} allStudents={students} />}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal title="Delete Exam?" onClose={()=>setDeleteId(null)}>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.muted,marginBottom:24 }}>This action cannot be undone. Exam #{deleteId} will be permanently deleted.</p>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <Btn onClick={()=>setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={()=>handleDelete(deleteId)}>✕ Delete</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function AdminExams({ theme }) {
  if (theme) C = theme;
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
        input[type=date],input[type=time]{color-scheme:dark}
      `}</style>
      <div style={{ flex:1, display:"flex", overflow:"hidden", minWidth:0 }}>
        <ExamsPage />
      </div>
    </>
  );
}