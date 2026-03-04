import { useState } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');`;

const C = {
  bg:"#04080f", panel:"#080f1a", card:"#0d1829", border:"#1a2540",
  border2:"#243050", gold:"#c8a96e", goldDim:"#7c5830",
  text:"#e2e8f0", muted:"#475569", dim:"#1e293b",
  success:"#22c55e", danger:"#f87171", warning:"#f59e0b", info:"#60a5fa", purple:"#a78bfa",
};

const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const LEVEL_COLORS = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };
const SECTIONS = ["Կարդալ","Գրել","Լսել","Քերականություն","Բառապաշար","Լսել / Տեսնել","Ազատ շարադրություն"];

// ── Seed ─────────────────────────────────────────────────────────────────────
const SEED_QUESTIONS = [
  { id:1,  type:"single_choice", level:"A2", section:"Կարդալ",       points:1, text:"Ընտրի՛ր ճիշտ պատասխանը. «Ես ___ դպրոց եմ գնում»" },
  { id:2,  type:"multi_choice",  level:"B1", section:"Քերականություն",points:2, text:"Ո՞ր նախ. են ճիշտ կառուցված" },
  { id:3,  type:"audio",         level:"B2", section:"Լսել",          points:3, text:"Լսի՛ր — ինչի՞ մասին է խոսում բ." },
  { id:4,  type:"video",         level:"C1", section:"Լսել / Տ.",     points:4, text:"Դիտի՛ր — ո՞ր թեման է հիմն." },
  { id:5,  type:"multi_select",  level:"B2", section:"Բառապաշար",    points:3, text:"Ընտ. ճ. բառ. «ճամփ.» թ." },
  { id:6,  type:"fill_blank",    level:"A1", section:"Գրել",          points:1, text:"Լր. «Ես ___ եմ»" },
  { id:7,  type:"writing",       level:"C2", section:"Ազատ շ.",       points:10,text:"Գրի՛ր 150-200 բ. «Տ. ազդ. հ. լ.»" },
  { id:8,  type:"single_choice", level:"A1", section:"Կարդալ",       points:1, text:"«Բ.» բ. ի՞նչ է նշ." },
  { id:9,  type:"audio",         level:"C1", section:"Լսել",          points:4, text:"Լ. 2 ան. — ի՞նչ ասաց խ." },
  { id:10, type:"multi_choice",  level:"B2", section:"Քերականություն",points:2, text:"Ո՞ր ձ. ձ. են ճ." },
];

const SEED_STUDENTS = [
  { id:1, name:"Անի Հակոբյան",    email:"ani@example.am",   group:"Խ-101", level:"B1" },
  { id:2, name:"Արամ Պետրոսյան",  email:"aram@example.am",  group:"Խ-101", level:"A2" },
  { id:3, name:"Մարինե Գ.",       email:"marine@example.am",group:"Խ-102", level:"B2" },
  { id:4, name:"Դավիթ Ս.",        email:"davit@example.am", group:"Խ-102", level:"C1" },
  { id:5, name:"Նարեկ Ավ.",       email:"narek@example.am", group:"Խ-103", level:"A1" },
  { id:6, name:"Լուսինե Կ.",      email:"lusine@example.am",group:"Խ-103", level:"B1" },
  { id:7, name:"Վահե Մ.",         email:"vahe@example.am",  group:"Խ-101", level:"A2" },
  { id:8, name:"Հայկ Ա.",         email:"hayk@example.am",  group:"Խ-102", level:"B2" },
];

const SEED_EXAMS = [
  { id:1, title:"Summer B1 Examination", level:"B1", duration:60, sections:["Կարդալ","Լսել","Քերականություն"], questionIds:[1,2,3,5,8], assignedTo:[1,2,7], status:"active",   startDate:"2025-06-01", endDate:"2025-06-30", passingScore:70, shuffle:true,  showResults:true,  createdAt:"2025-05-15" },
  { id:2, title:"A2 Entrance Test",  level:"A2", duration:45, sections:["Կարդալ","Գրել"],                  questionIds:[1,6,8],    assignedTo:[2,7],   status:"draft",    startDate:"2025-07-01", endDate:"2025-07-15", passingScore:60, shuffle:false, showResults:false, createdAt:"2025-05-20" },
  { id:3, title:"C1–C2 Final Examination",level:"C1", duration:90, sections:["All"],                          questionIds:[3,4,7,9],  assignedTo:[3,4,8], status:"completed",startDate:"2025-04-10", endDate:"2025-04-10", passingScore:80, shuffle:true,  showResults:true,  createdAt:"2025-04-01" },
  { id:4, title:"B2 Vocabulary Exam",    level:"B2", duration:75, sections:["Listening","Video","Vocabulary"],              questionIds:[3,4,5,10], assignedTo:[3,8],   status:"scheduled",startDate:"2025-08-01", endDate:"2025-08-05", passingScore:75, shuffle:true,  showResults:true,  createdAt:"2025-06-01" },
];

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
  return qIds.reduce((s,id)=>{ const q=SEED_QUESTIONS.find(q=>q.id===id); return s+(q?.points||0); },0);
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

function ExamWizard({ initial, onSave, onCancel }) {
  const isEdit = !!initial;
  const blank = { title:"", level:"B1", duration:60, sections:[], passingScore:70, shuffle:true, showResults:true, allowReview:false, randomQuestions:false, questionCount:10, questionIds:[], assignedTo:[], assignedGroups:[], startDate:"", endDate:"", startTime:"09:00", endTime:"18:00", status:"draft", notes:"" };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial ? {...blank,...initial} : blank);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const availableQs = SEED_QUESTIONS.filter(q => !form.level || q.level === form.level || form.level === "all");
  const toggleQ = (id) => set("questionIds", form.questionIds.includes(id) ? form.questionIds.filter(x=>x!==id) : [...form.questionIds,id]);
  const toggleStudent = (id) => set("assignedTo", form.assignedTo.includes(id) ? form.assignedTo.filter(x=>x!==id) : [...form.assignedTo,id]);

  const pts = totalPoints(form.questionIds);

  // Step 0 — General info
  const Step0 = () => (
    <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
      <Input label="Exam Title" value={form.title} onChange={v=>set("title",v)} placeholder="օր. «Ամառային B1 Քննություն»" />
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
        <Select label="Level" value={form.level} onChange={v=>set("level",v)} options={[{value:"all",label:"All"},...LEVELS.map(l=>({value:l,label:l}))]} />
        <Input label="Duration (min)" value={form.duration} onChange={v=>set("duration",+v)} type="number" />
        <Input label="Passing Score (%)" value={form.passingScore} onChange={v=>set("passingScore",+v)} type="number" />
      </div>
      <div>
        <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase",display:"block",marginBottom:10 }}>Բաժիններ</label>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {SECTIONS.map(s=>{
            const sel = form.sections.includes(s);
            return <button key={s} onClick={()=>set("sections",sel?form.sections.filter(x=>x!==s):[...form.sections,s])} style={{ background:sel?C.gold+"22":"transparent",border:`1px solid ${sel?C.gold:C.border2}`,borderRadius:8,padding:"6px 14px",color:sel?C.gold:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .15s" }}>{s}</button>;
          })}
        </div>
      </div>
      <Input label="Notes (optional)" value={form.notes} onChange={v=>set("notes",v)} placeholder="Ներքին գ. կամ ն. ..." />
    </div>
  );

  // Step 1 — Questions
  const Step1 = () => (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>
          Selected: <span style={{ color:C.gold,fontWeight:700 }}>{form.questionIds.length}</span> հ. · <span style={{ color:C.gold,fontWeight:700 }}>{pts}</span> կ.
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <Btn small onClick={()=>set("questionIds",availableQs.map(q=>q.id))}>Select All</Btn>
          <Btn small onClick={()=>set("questionIds",[])}>Clear</Btn>
        </div>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:380,overflowY:"auto" }}>
        {availableQs.map(q=>{
          const sel = form.questionIds.includes(q.id);
          const lc = LEVEL_COLORS[q.level]||"#94a3b8";
          return (
            <div key={q.id} onClick={()=>toggleQ(q.id)} style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:sel?C.gold+"0e":C.panel,border:`1.5px solid ${sel?C.gold+"55":C.border}`,borderRadius:10,cursor:"pointer",transition:"all .15s" }}>
              <div style={{ width:20,height:20,borderRadius:4,border:`2px solid ${sel?C.gold:C.border2}`,background:sel?C.gold+"33":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {sel && <svg width={11} height={11} viewBox="0 0 11 11"><path d="M1.5 6l3 3 5-5" stroke={C.gold} strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,minWidth:24 }}>#{q.id}</span>
              <span style={{ fontSize:14 }}>{QTYPE_ICON[q.type]}</span>
              <span style={{ flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:sel?C.text:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{q.text}</span>
              <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:5,padding:"1px 8px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{q.level}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gold,fontWeight:600,minWidth:28,textAlign:"right" }}>{q.points}pt</span>
            </div>
          );
        })}
      </div>
      <Toggle label="Shuffle Questions" hint="Randomize question order for each student" value={form.shuffle} onChange={v=>set("shuffle",v)} />
    </div>
  );

  // Step 2 — Students
  const Step2 = () => {
    const groups = [...new Set(SEED_STUDENTS.map(s=>s.group))];
    const toggleGroup = (g) => {
      const ids = SEED_STUDENTS.filter(s=>s.group===g).map(s=>s.id);
      const allSel = ids.every(id=>form.assignedTo.includes(id));
      set("assignedTo", allSel ? form.assignedTo.filter(id=>!ids.includes(id)) : [...new Set([...form.assignedTo,...ids])]);
    };
    return (
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>Selected: <span style={{ color:C.gold,fontWeight:700 }}>{form.assignedTo.length}</span> ուս.</span>
          <div style={{ display:"flex",gap:8 }}>
            <Btn small onClick={()=>set("assignedTo",SEED_STUDENTS.map(s=>s.id))}>Select All</Btn>
            <Btn small onClick={()=>set("assignedTo",[])}>Clear</Btn>
          </div>
        </div>
        {/* Groups */}
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {groups.map(g=>{
            const ids = SEED_STUDENTS.filter(s=>s.group===g).map(s=>s.id);
            const allSel = ids.every(id=>form.assignedTo.includes(id));
            return <button key={g} onClick={()=>toggleGroup(g)} style={{ background:allSel?C.info+"22":"transparent",border:`1px solid ${allSel?C.info:C.border2}`,borderRadius:8,padding:"6px 14px",color:allSel?C.info:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .15s" }}>{g} ({ids.length})</button>;
          })}
        </div>
        {/* Student list */}
        <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:340,overflowY:"auto" }}>
          {SEED_STUDENTS.map(s=>{
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
                <Badge color="#60a5fa" small>{s.group}</Badge>
                <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:5,padding:"1px 8px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{s.level}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Step 3 — Schedule & settings
  const Step3 = () => (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <Input label="Մ. ամ." value={form.startDate} onChange={v=>set("startDate",v)} type="date" />
        <Input label="Ա. ամ." value={form.endDate} onChange={v=>set("endDate",v)} type="date" />
        <Input label="Մ. ժ." value={form.startTime} onChange={v=>set("startTime",v)} type="time" />
        <Input label="Ա. ժ." value={form.endTime} onChange={v=>set("endTime",v)} type="time" />
      </div>
      <Select label="Settings" value={form.status} onChange={v=>set("status",v)} options={Object.entries(STATUS_META).map(([v,m])=>({value:v,label:m.label}))} />
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <Toggle label="Show results to student" hint="Show results to student after exam" value={form.showResults} onChange={v=>set("showResults",v)} />
        <Toggle label="Վ. ու. թ." hint="Allow answer review after submission" value={form.allowReview} onChange={v=>set("allowReview",v)} />
      </div>
      {/* Summary card */}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px 24px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:14 }}>Ամփ. · Summary</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12 }}>
          {[
            { label:"Questions", value: form.questionIds.length, color:C.gold },
            { label:"Settings",   value: pts,                    color:C.warning },
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

  const STEP_CONTENT = [<Step0/>,<Step1/>,<Step2/>,<Step3/>];
  const canProceed = [
    form.title.trim().length > 0,
    form.questionIds.length > 0,
    form.assignedTo.length > 0,
    true,
  ];

  return (
    <div>
      <StepBar steps={WIZARD_STEPS} current={step} />
      <div style={{ minHeight:380 }}>{STEP_CONTENT[step]}</div>
      <div style={{ display:"flex",justifyContent:"space-between",marginTop:28,paddingTop:20,borderTop:`1px solid ${C.border}` }}>
        <Btn onClick={step===0?onCancel:()=>setStep(s=>s-1)}>
          {step===0 ? "Cancel" : "← Back"}
        </Btn>
        <div style={{ display:"flex",gap:10 }}>
          {step<3 && <Btn variant="ghost" onClick={()=>set("status","draft")}>Draft-ա.</Btn>}
          {step < 3
            ? <Btn variant="primary" disabled={!canProceed[step]} onClick={()=>setStep(s=>s+1)}>Հ. →</Btn>
            : <Btn variant="primary" onClick={()=>onSave(form)}>{isEdit?"✓ Save":"✓ Create"}</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ── Exam Card ─────────────────────────────────────────────────────────────────
function ExamCard({ exam, onEdit, onDelete, onAssign, onViewResults }) {
  const sm = STATUS_META[exam.status]||STATUS_META.draft;
  const lc = LEVEL_COLORS[exam.level]||"#94a3b8";
  const pts = totalPoints(exam.questionIds);
  const assignedStudents = SEED_STUDENTS.filter(s=>exam.assignedTo.includes(s.id));

  return (
    <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px",display:"flex",flexDirection:"column",gap:16,transition:"border .2s",cursor:"default" }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.border2}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      {/* Top */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
            <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{exam.level}</span>
            <span style={{ background:sm.color+"18",color:sm.color,border:`1px solid ${sm.color}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{sm.icon} {sm.label}</span>
          </div>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:C.text,margin:"0 0 4px",fontWeight:600,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{exam.title}</h3>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{exam.createdAt}</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"flex",gap:12 }}>
        {[
          { icon:"📋",val:exam.questionIds.length+" հ.",tip:"Questions" },
          { icon:"🏆",val:pts+" կ.",tip:"Settings" },
          { icon:"⏱",val:exam.duration+" min",tip:"Duration" },
          { icon:"🎯",val:exam.passingScore+"%",tip:"Pass %" },
        ].map(x=>(
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
        <div style={{ display:"flex",gap:4,flexWrap:"wrap",gap:4 }}>
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
          <span style={{ color:C.info }}>+ Նշ.</span>
        </Btn>
        {exam.status==="completed" && (
          <Btn small onClick={()=>onViewResults(exam)} style={{ flex:1 }} variant="solid" color={C.success+"22"}>
            <span style={{ color:C.success }}>📊 Ար.</span>
          </Btn>
        )}
        <Btn small variant="danger" onClick={()=>onDelete(exam.id)}>✕</Btn>
      </div>
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({ exam, onClose, onSave }) {
  const [assigned, setAssigned] = useState([...exam.assignedTo]);
  const toggle = (id) => setAssigned(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);
  const groups = [...new Set(SEED_STUDENTS.map(s=>s.group))];
  const toggleGroup = (g) => {
    const ids = SEED_STUDENTS.filter(s=>s.group===g).map(s=>s.id);
    const allSel = ids.every(id=>assigned.includes(id));
    setAssigned(a=>allSel?a.filter(id=>!ids.includes(id)):[...new Set([...a,...ids])]);
  };
  return (
    <Modal title="Assign Students" subtitle={exam.title} onClose={onClose}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>Selected: <span style={{ color:C.gold,fontWeight:700 }}>{assigned.length}</span></span>
        <div style={{ display:"flex",gap:8 }}>
          {groups.map(g=>{
            const ids=SEED_STUDENTS.filter(s=>s.group===g).map(s=>s.id);
            const allSel=ids.every(id=>assigned.includes(id));
            return <button key={g} onClick={()=>toggleGroup(g)} style={{ background:allSel?C.info+"22":"transparent",border:`1px solid ${allSel?C.info:C.border2}`,borderRadius:8,padding:"5px 12px",color:allSel?C.info:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer" }}>{g}</button>;
          })}
        </div>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:360,overflowY:"auto",marginBottom:20 }}>
        {SEED_STUDENTS.map(s=>{
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
              <Badge color="#60a5fa" small>{s.group}</Badge>
              <span style={{ background:lc+"18",color:lc,border:`1px solid ${lc}33`,borderRadius:5,padding:"1px 8px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>{s.level}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
        <Btn onClick={onClose}>Չ.</Btn>
        <Btn variant="primary" onClick={()=>onSave(assigned)}>✓ Պ. · Save</Btn>
      </div>
    </Modal>
  );
}

// ── Results Preview ───────────────────────────────────────────────────────────
function ResultsModal({ exam, onClose }) {
  const students = SEED_STUDENTS.filter(s=>exam.assignedTo.includes(s.id));
  const fakeScore = (id) => Math.floor(50 + (id*17+exam.id*7) % 45);
  const pts = totalPoints(exam.questionIds);
  return (
    <Modal title="Results" subtitle={exam.title} onClose={onClose}>
      <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:420,overflowY:"auto" }}>
        {students.map(s=>{
          const sc = fakeScore(s.id);
          const pct = Math.round((sc/pts)*100);
          const pass = pct >= exam.passingScore;
          return (
            <div key={s.id} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:10 }}>
              <div style={{ width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{s.name[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,fontWeight:500 }}>{s.name}</div>
                <div style={{ height:5,background:C.dim,borderRadius:3,marginTop:6,overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`,height:"100%",background:pass?C.success:C.danger,borderRadius:3,transition:"width .6s" }} />
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,color: pass?C.success:C.danger,fontWeight:700 }}>{sc}/{pts}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color: pass?C.success:C.danger }}>{pct}% · {pass?"✓ Ան.":"✕ Ձ."}</div>
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
  const [exams, setExams] = useState(SEED_EXAMS);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [viewingResults, setViewingResults] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = exams.filter(e=>{
    if (filterStatus!=="all" && e.status!==filterStatus) return false;
    if (filterLevel!=="all" && e.level!==filterLevel) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = (form) => {
    if (modal==="edit") setExams(es=>es.map(e=>e.id===form.id?{...form}:e));
    else setExams(es=>[{...form,id:Date.now(),createdAt:new Date().toISOString().slice(0,10)},...es]);
    setModal(null); setEditing(null);
  };
  const handleDelete = (id) => { setExams(es=>es.filter(e=>e.id!==id)); setDeleteId(null); };
  const handleAssignSave = (ids) => {
    setExams(es=>es.map(e=>e.id===assigning.id?{...e,assignedTo:ids}:e));
    setAssigning(null);
  };

  const statCounts = Object.fromEntries(Object.keys(STATUS_META).map(s=>[s,exams.filter(e=>e.status===s).length]));

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", boxSizing:"border-box" }}>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:C.text,margin:"0 0 4px",fontWeight:600 }}>Քննությունների կ.</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,margin:0 }}>Exam Management · Create & Assign</p>
        </div>
        <Btn variant="primary" onClick={()=>{setEditing(null);setModal("create")}}>+ Նոր քննություն</Btn>
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
      {filtered.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>No exams found</div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:18 }}>
          {filtered.map(exam=>(
            <ExamCard key={exam.id} exam={exam}
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
          <ExamWizard initial={editing} onSave={handleSave} onCancel={()=>{setModal(null);setEditing(null)}} />
        </Modal>
      )}

      {/* Assign Modal */}
      {assigning && <AssignModal exam={assigning} onClose={()=>setAssigning(null)} onSave={handleAssignSave} />}

      {/* Results Modal */}
      {viewingResults && <ResultsModal exam={viewingResults} onClose={()=>setViewingResults(null)} />}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal title="Delete Exam?" onClose={()=>setDeleteId(null)}>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.muted,marginBottom:24 }}>Այս գ. ա. չ. · #{deleteId}</p>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <Btn onClick={()=>setDeleteId(null)}>Չ.</Btn>
            <Btn variant="danger" onClick={()=>handleDelete(deleteId)}>✕ Ջ.</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function AdminExams() {
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