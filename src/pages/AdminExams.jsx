import { useState, useEffect, useCallback } from "react";
import StudentPreview from "../components/StudentPreview.jsx";
import { api } from "../api.js";
import { formatDate } from "../dateUtils.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');`;

let C = {
  bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",
  gold:"#c8a96e",goldDim:"#7c5830",goldHover:"#d4b87a",
  text:"#e2e8f0",muted:"#475569",dim:"#1e293b",
  success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa",purple:"#a78bfa",
};

const LEVELS       = ["A1","A2","B1","B2","C1","C2"];
// Receptive → Productive (cognitive load order)
const SECTION_ORDER = ["READING","LISTENING","WRITING","SPEAKING"];
const LEVEL_COLORS = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };

const QTYPE_META = {
  SINGLE_CHOICE:        { label:"Single Choice",      icon:"◉",  color:"#60a5fa", manual:false },
  MULTIPLE_CHOICE:      { label:"Multiple Choice",    icon:"☑",  color:"#a78bfa", manual:false },
  FILL_IN_THE_BLANKS:   { label:"Fill in the Blanks", icon:"✎",  color:"#e879f9", manual:false },
  DRAG_TO_TEXT:         { label:"Drag to Text",       icon:"⟳",  color:"#34d399", manual:false },
  TEXT_INSERTION:       { label:"Text Insertion",     icon:"⊕",  color:"#38bdf8", manual:false },
  DRAG_AND_DROP_TABLE:  { label:"D&D Table",          icon:"⊞",  color:"#fb923c", manual:false },
  DRAG_AND_DROP_IMAGE:  { label:"D&D Image",          icon:"🖼", color:"#f472b6", manual:false },
  IMAGE_CLICK:          { label:"Image Click",        icon:"🎯", color:"#facc15", manual:false },
  SPEAKING_INDEPENDENT: { label:"Speaking (Ind.)",    icon:"🎤", color:"#f87171", manual:true  },
  SPEAKING_INTEGRATED:  { label:"Speaking (Int.)",    icon:"🎙", color:"#fb923c", manual:true  },
  WRITING_INDEPENDENT:  { label:"Writing (Ind.)",     icon:"✍",  color:"#94a3b8", manual:true  },
  WRITING_INTEGRATED:   { label:"Writing (Int.)",     icon:"📝", color:"#64748b", manual:true  },
};

const STATUS_META = {
  draft:     { label:"Draft",     color:"#f59e0b", icon:"○" },
  active:    { label:"Active",    color:"#22c55e", icon:"●" },
  scheduled: { label:"Scheduled", color:"#60a5fa", icon:"◷" },
  completed: { label:"Completed", color:"#94a3b8", icon:"✓" },
  archived:  { label:"Archived",  color:"#475569", icon:"▪" },
};

const fmtDate = (d) => d ? formatDate(d) : "";

function placementTotals(t=[]) {
  let q=0,pts=0;
  for(const r of t){const rq=(r.subpools||[]).reduce((s,sp)=>s+sp.count,0);q+=rq;pts+=rq*(r.pointsEach||1);}
  return{q,pts};
}
function fixedTotals(s){s=Array.isArray(s)?s:[];return{q:s.reduce((a,sp)=>a+sp.count,0),pts:s.reduce((a,sp)=>a+sp.count*(sp.pointsEach||1),0)};}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Badge({children,color,small}){
  return <span style={{background:color+"18",color,border:`1px solid ${color}33`,borderRadius:6,padding:small?"1px 7px":"3px 10px",fontSize:small?10:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:.4,whiteSpace:"nowrap"}}>{children}</span>;
}

function Btn({children,onClick,variant="ghost",color,disabled,small,style={}}){
  const base={fontFamily:"'DM Sans',sans-serif",fontSize:small?12:13,fontWeight:600,borderRadius:9,padding:small?"6px 14px":"10px 20px",cursor:disabled?"not-allowed":"pointer",border:"none",transition:"all .15s",opacity:disabled?.5:1,...style};
  const v={primary:{background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"white",boxShadow:`0 4px 14px ${C.gold}44`},danger:{background:"#f8717118",color:C.danger,border:`1px solid ${C.danger}33`},ghost:{background:"transparent",color:C.muted,border:`1px solid ${C.border2}`},solid:{background:color||C.card,color:C.text,border:`1px solid ${C.border2}`}};
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
}

const IS = {background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:10,padding:"10px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};

function Input({label,hint,value,onChange,placeholder,type="text",min,max,style={}}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase"}}>{label}{hint&&<span style={{fontWeight:400,textTransform:"none",letterSpacing:0,marginLeft:5,color:C.muted,fontSize:10}}>— {hint}</span>}</label>}
      <input type={type} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} max={max}
        style={{...IS,...style}} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border2}/>
    </div>
  );
}

function Sel({label,hint,value,onChange,options}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase"}}>{label}{hint&&<span style={{fontWeight:400,textTransform:"none",letterSpacing:0,marginLeft:5,color:C.muted,fontSize:10}}>— {hint}</span>}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{...IS,cursor:"pointer",appearance:"auto"}}>
        {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
    </div>
  );
}

function Toggle({label,hint,value,onChange}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:C.panel,border:`1px solid ${C.border2}`,borderRadius:10}}>
      <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,fontWeight:500}}>{label}</div>{hint&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2}}>{hint}</div>}</div>
      <div onClick={()=>onChange(!value)} style={{width:44,height:24,borderRadius:12,background:value?C.gold:C.dim,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0,marginLeft:14}}>
        <div style={{position:"absolute",top:3,left:value?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left .2s",boxShadow:"0 1px 4px #0006"}}/>
      </div>
    </div>
  );
}

function Divider({label}){
  return <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,paddingBottom:6,borderBottom:`1px solid ${C.border}`,marginTop:4}}>{label}</div>;
}

function Modal({title,subtitle,onClose,children,wide}){
  return(
    <div style={{position:"fixed",inset:0,background:"#00000092",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.panel,border:`1px solid ${C.border2}`,borderRadius:22,padding:"36px 40px",width:"100%",maxWidth:wide?960:700,maxHeight:"93vh",overflowY:"auto",animation:"fadeSlideIn .25s ease",boxShadow:"0 32px 80px #000000bb"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28}}>
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,margin:"0 0 4px",fontWeight:600}}>{title}</h2>
            {subtitle&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,margin:0}}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${C.border2}`,borderRadius:8,width:34,height:34,color:C.muted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StepBar({steps,current}){
  return(
    <div style={{display:"flex",alignItems:"center",marginBottom:32}}>
      {steps.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:"none"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:i<current?C.success:i===current?C.gold:C.dim,border:`2px solid ${i<current?C.success:i===current?C.gold:C.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:i<=current?"white":C.muted,transition:"all .3s"}}>{i<current?"✓":i+1}</div>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:i===current?C.gold:C.muted,whiteSpace:"nowrap",letterSpacing:.3}}>{s}</span>
          </div>
          {i<steps.length-1&&<div style={{flex:1,height:2,background:i<current?C.success:C.border,margin:"0 8px",marginBottom:16,transition:"background .3s"}}/>}
        </div>
      ))}
    </div>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────
const WIZARD_STEPS = ["General","Structure","Students","Schedule"];

function makeBlankFixed(){
  return{examType:"fixed",title:"",level:"B1",duration:60,passingScore:70,shuffle:true,showResults:true,showQuestionLevel:true,showQuestionPoints:true,
    subpools:[{section:"READING",level:"B1",count:3,pointsEach:2},{section:"LISTENING",level:"B1",count:2,pointsEach:2}],
    assignedTo:[],startDate:"",endDate:"",startTime:"09:00",isOpen:false,examCenterId:"",status:"draft"};
}
function makeBlankPlacement(){
  return{examType:"placement",title:"",level:null,duration:90,passingScore:null,shuffle:true,showResults:true,showQuestionLevel:true,showQuestionPoints:true,showPlacementThreshold:true,
    placementTemplate:[
      {level:"A1",pointsEach:1,subpools:[{section:"READING",count:3},{section:"LISTENING",count:2}]},
      {level:"A2",pointsEach:1,subpools:[{section:"READING",count:3},{section:"LISTENING",count:2}]},
      {level:"B1",pointsEach:2,subpools:[{section:"READING",count:2},{section:"LISTENING",count:2},{section:"WRITING",count:1}]},
      {level:"B2",pointsEach:2,subpools:[{section:"READING",count:2},{section:"LISTENING",count:2},{section:"WRITING",count:1}]},
      {level:"C1",pointsEach:3,subpools:[{section:"READING",count:2},{section:"LISTENING",count:2},{section:"SPEAKING",count:1}]},
      {level:"C2",pointsEach:3,subpools:[{section:"READING",count:2},{section:"SPEAKING",count:1},{section:"WRITING",count:1}]},
    ],
    placementThresholds:{A1:60,A2:60,B1:65,B2:65,C1:70,C2:70},
    assignedTo:[],startDate:"",endDate:"",startTime:"09:00",isOpen:false,examCenterId:"",status:"draft"};
}

function ExamWizard({initial,onSave,onCancel,students=[],sections=[],centers=[]}){
  const isEdit=!!initial;
  const [step,setStep]=useState(0);
  const [form,setForm]=useState(()=>{
    if(initial){const base=initial.examType==="placement"?makeBlankPlacement():makeBlankFixed();return{...base,...initial};}
    return makeBlankFixed();
  });
  const set=useCallback((k,v)=>setForm(p=>({...p,[k]:v})),[]);
  const [allQ,setAllQ]=useState([]);
  useEffect(()=>{api.getQuestions().then(d=>setAllQ(Array.isArray(d)?d:[])).catch(()=>{});},[]);

  const isp=form.examType==="placement";
  const fT=fixedTotals(form.subpools);
  const pT=placementTotals(form.placementTemplate);

  const poolCnt=(level,section)=>allQ.filter(q=>q.level===level&&q.section===section).length;

  // Fixed subpool ops
  const addFSP=()=>set("subpools",[...(form.subpools||[]),{section:sections[0]||"READING",level:form.level||"B1",count:3,pointsEach:2}]);
  const remFSP=(i)=>set("subpools",(form.subpools||[]).filter((_,j)=>j!==i));
  const updFSP=(i,f,v)=>set("subpools",(form.subpools||[]).map((sp,j)=>j===i?{...sp,[f]:(f==="count"||f==="pointsEach")?+v:v}:sp));

  // Placement subpool ops
  const updPts=(lv,v)=>set("placementTemplate",(form.placementTemplate||[]).map(r=>r.level===lv?{...r,pointsEach:Math.max(1,+v)}:r));
  const addPSP=(lv)=>set("placementTemplate",(form.placementTemplate||[]).map(r=>r.level===lv?{...r,subpools:[...(r.subpools||[]),{section:sections[0]||"Reading",count:2}]}:r));
  const remPSP=(lv,i)=>set("placementTemplate",(form.placementTemplate||[]).map(r=>r.level===lv?{...r,subpools:(r.subpools||[]).filter((_,j)=>j!==i)}:r));
  const updPSP=(lv,i,f,v)=>set("placementTemplate",(form.placementTemplate||[]).map(r=>r.level===lv?{...r,subpools:(r.subpools||[]).map((sp,j)=>j===i?{...sp,[f]:f==="count"?+v:v}:sp)}:r));
  const updThr=(lv,v)=>set("placementThresholds",{...(form.placementThresholds||{}),[lv]:+v});

  // ── Step 0: General ──────────────────────────────────────────────────────
  const s0=(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Type selector */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase"}}>Exam Type</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[{id:"fixed",icon:"🎯",title:"Fixed Level",desc:"One level (A1–C2), pass/fail threshold"},{id:"placement",icon:"📊",title:"Placement",desc:"All 6 levels, detects student's level"}].map(t=>{
            const sel=form.examType===t.id;
            return(
              <button key={t.id} onClick={()=>{const b=t.id==="placement"?makeBlankPlacement():makeBlankFixed();setForm({...b,title:form.title});}} style={{background:sel?C.gold+"14":"transparent",border:`2px solid ${sel?C.gold:C.border2}`,borderRadius:14,padding:"16px 18px",textAlign:"left",cursor:"pointer",transition:"all .2s",position:"relative"}}>
                {sel&&<div style={{position:"absolute",top:10,right:12,width:18,height:18,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width={10} height={10} viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg></div>}
                <div style={{fontSize:20,marginBottom:7}}>{t.icon}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:sel?C.gold:C.text,fontWeight:600,marginBottom:4}}>{t.title}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,lineHeight:1.5}}>{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <Input label="Exam Title" value={form.title} onChange={v=>set("title",v)} placeholder={isp?"e.g. «Language Placement Test»":"e.g. «Summer B1 Examination»"}/>

      <div style={{display:"grid",gridTemplateColumns:isp?"1fr 1fr":"1fr 1fr 1fr",gap:14}}>
        {!isp&&<Sel label="Language Level" value={form.level||"B1"} onChange={v=>set("level",v)} options={LEVELS.map(l=>({value:l,label:l}))}/>}
        <Input label="Duration" hint="min" value={form.duration} onChange={v=>set("duration",Math.max(1,+v))} type="number" min={1} max={480}/>
        {!isp&&<Input label="Passing Score" hint="%" value={form.passingScore} onChange={v=>set("passingScore",Math.max(1,Math.min(100,+v)))} type="number" min={1} max={100}/>}
      </div>

      {centers.length>0&&(
        <Sel label="Exam Center" hint="optional" value={form.examCenterId||""} onChange={v=>set("examCenterId",v===""?null:+v)}
          options={[{value:"",label:"— No center —"},...centers.map(c=>({value:c.id,label:c.name}))]}/>
      )}

      <Sel label="Status" value={form.status} onChange={v=>set("status",v)}
        options={Object.entries(STATUS_META).map(([v,m])=>({value:v,label:`${m.icon} ${m.label}`}))}/>
    </div>
  );

  // ── Step 1: Structure ────────────────────────────────────────────────────
  const s1=isp?(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Template */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase"}}>Questions per Level</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.gold}}>{pT.q} q · {pT.pts} pts total</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(form.placementTemplate||[]).map(row=>{
            const lc=LEVEL_COLORS[row.level]||"#94a3b8";
            const rq=(row.subpools||[]).reduce((s,sp)=>s+sp.count,0);
            return(
              <div key={row.level} style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:C.dim,borderBottom:`1px solid ${C.border}`}}>
                  <Badge color={lc}>{row.level}</Badge>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,flex:1}}>{rq} q · <span style={{color:C.gold}}>{rq*(row.pointsEach||1)} pts</span></span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>pts/q</span>
                  <input type="number" min={1} max={10} value={row.pointsEach||1} onChange={e=>updPts(row.level,e.target.value)}
                    style={{background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"3px 8px",color:C.gold,fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,outline:"none",width:46,textAlign:"center"}}/>
                  <button onClick={()=>addPSP(row.level)} style={{background:C.gold+"18",border:`1px solid ${C.gold}44`,borderRadius:6,padding:"4px 10px",color:C.gold,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",fontWeight:600}}>+ subpool</button>
                </div>
                {(row.subpools||[]).length===0&&<div style={{padding:"9px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,fontStyle:"italic"}}>No subpools</div>}
                {(row.subpools||[]).map((sp,idx)=>{
                  const pc=poolCnt(row.level,sp.section);const ok=pc>=sp.count;
                  return(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 14px",borderBottom:`1px solid ${C.border}`}}>
                      <span style={{color:C.muted,fontSize:10,width:16}}>┗</span>
                      <select value={sp.section} onChange={e=>updPSP(row.level,idx,"section",e.target.value)}
                        style={{background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"5px 8px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",flex:"0 0 148px"}}>
                        {sections.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="number" min={1} max={30} value={sp.count} onChange={e=>updPSP(row.level,idx,"count",e.target.value)}
                        style={{background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"5px 8px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",width:50,textAlign:"center"}}/>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:ok?C.success:C.danger,flex:1}}>{ok?`✓ ${pc} in pool`:`✗ only ${pc} (need ${sp.count})`}</span>
                      <button onClick={()=>remPSP(row.level,idx)} style={{background:"transparent",border:"none",color:C.danger,cursor:"pointer",fontSize:13,padding:"0 4px"}}>✕</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Thresholds */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase"}}>Pass Thresholds</span>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted}}>Ladder: pass A1→A2→… consecutively</span>
        </div>
        <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:9}}>
          {LEVELS.map(lv=>{
            const t=(form.placementThresholds||{})[lv]??60;const lc=LEVEL_COLORS[lv];
            return(
              <div key={lv} style={{display:"flex",alignItems:"center",gap:12}}>
                <Badge color={lc} small>{lv}</Badge>
                <div style={{flex:1,height:5,background:C.dim,borderRadius:3,overflow:"hidden"}}><div style={{width:`${t}%`,height:"100%",background:lc,borderRadius:3,transition:"width .3s"}}/></div>
                <input type="range" min={0} max={100} value={t} onChange={e=>updThr(lv,e.target.value)} style={{width:88,accentColor:lc,cursor:"pointer",flexShrink:0}}/>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:lc,fontWeight:700,width:36,textAlign:"right",flexShrink:0}}>{t}%</span>
              </div>
            );
          })}
          <div style={{marginTop:2,background:C.card,borderRadius:8,padding:"7px 12px"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,lineHeight:1.5}}>💡 Result = highest consecutive level all passing. A1✓ A2✓ B1✗ → <strong style={{color:LEVEL_COLORS.A2}}>A2</strong></span>
          </div>
        </div>
      </div>
      <Toggle label="Shuffle Questions" hint="Randomize order within each level group" value={form.shuffle} onChange={v=>set("shuffle",v)}/>
    </div>
  ):(
    // Fixed structure — subpools with section × level × count × pointsEach
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,lineHeight:1.6}}>
        🎯 <strong style={{color:C.text}}>Fixed exam:</strong> define question pools per <strong style={{color:C.gold}}>Section × Level</strong>. Questions are grouped and delivered in canonical order:
        {" "}<span style={{color:"#60a5fa",fontWeight:600}}>Reading</span>{" → "}
        <span style={{color:"#34d399",fontWeight:600}}>Listening</span>{" → "}
        <span style={{color:"#94a3b8",fontWeight:600}}>Writing</span>{" → "}
        <span style={{color:"#fb923c",fontWeight:600}}>Speaking</span>
        {" "}(Receptive → Productive). Shuffle applies within each section.
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase"}}>Question Rules · <span style={{color:C.gold}}>{fT.q} q total</span></span>
        <button onClick={addFSP} style={{background:C.gold+"18",border:`1px solid ${C.gold}44`,borderRadius:6,padding:"4px 12px",color:C.gold,fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",fontWeight:600}}>+ Add rule</button>
      </div>
      {/* Column headers */}
      {(form.subpools||[]).length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 100px 60px 60px 36px",gap:8,padding:"0 4px"}}>
          {["Section","Level","Count","Pts/q",""].map(h=><span key={h} style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,letterSpacing:.5,textTransform:"uppercase"}}>{h}</span>)}
        </div>
      )}
      {(form.subpools||[]).length===0&&<div style={{padding:"14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,fontStyle:"italic",background:C.panel,borderRadius:10,textAlign:"center"}}>No rules added yet. Click "+ Add rule" to define a question pool.</div>}
      {(form.subpools||[]).map((sp,idx)=>{
        const lv=sp.level||form.level||"B1";
        const pc=poolCnt(lv,sp.section);const ok=pc>=sp.count;
        return(
          <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 100px 60px 60px 36px",gap:8,alignItems:"center",padding:"8px 10px",background:C.panel,border:`1.5px solid ${ok?C.border2:C.danger+"55"}`,borderRadius:10}}>
            <select value={sp.section} onChange={e=>updFSP(idx,"section",e.target.value)}
              style={{background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"6px 8px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",width:"100%"}}>
              {sections.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select value={lv} onChange={e=>updFSP(idx,"level",e.target.value)}
              style={{background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"6px 8px",color:LEVEL_COLORS[lv]||C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",width:"100%",fontWeight:700}}>
              {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              <input type="number" min={1} max={50} value={sp.count} onChange={e=>updFSP(idx,"count",e.target.value)}
                style={{background:C.card,border:`1.5px solid ${ok?C.border2:C.danger}`,borderRadius:6,padding:"6px 6px",color:ok?C.text:C.danger,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",width:"100%",textAlign:"center"}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:ok?C.muted:C.danger,textAlign:"center"}}>{ok?`${pc} avail`:pc===0?"none":pc+" only"}</span>
            </div>
            <input type="number" min={1} max={10} value={sp.pointsEach||1} onChange={e=>updFSP(idx,"pointsEach",e.target.value)}
              style={{background:C.card,border:`1.5px solid ${C.border2}`,borderRadius:6,padding:"6px 6px",color:C.gold,fontFamily:"'DM Mono',monospace",fontSize:12,outline:"none",width:"100%",textAlign:"center",fontWeight:700}}/>
            <button onClick={()=>remFSP(idx)} style={{background:"transparent",border:"none",color:C.danger,cursor:"pointer",fontSize:13,padding:"0 4px",justifySelf:"center"}}>✕</button>
          </div>
        );
      })}
      <Toggle label="Shuffle Questions" hint="Randomize order for each student" value={form.shuffle} onChange={v=>set("shuffle",v)}/>
    </div>
  );

  // ── Step 2: Students ─────────────────────────────────────────────────────
  const [stFilter,setStFilter]=useState("");
  const fltSt=students.filter(s=>!stFilter||s.name.toLowerCase().includes(stFilter.toLowerCase()));
  const allSel=students.length>0&&students.every(s=>(form.assignedTo||[]).includes(s.id));
  const togAll=()=>set("assignedTo",allSel?[]:students.map(s=>s.id));
  const togSt=(id)=>set("assignedTo",(form.assignedTo||[]).includes(id)?(form.assignedTo||[]).filter(x=>x!==id):[...(form.assignedTo||[]),id]);

  const s2=(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <input value={stFilter} onChange={e=>setStFilter(e.target.value)} placeholder="🔍 Search…"
          style={{flex:1,...IS,padding:"8px 12px",fontSize:13}}/>
        <button onClick={togAll} style={{background:allSel?C.info+"22":"transparent",border:`1px solid ${allSel?C.info:C.border2}`,borderRadius:8,padding:"8px 14px",color:allSel?C.info:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>
          {allSel?"Deselect All":"Select All"}
        </button>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,whiteSpace:"nowrap"}}><span style={{color:C.gold,fontWeight:700}}>{(form.assignedTo||[]).length}</span> selected</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:360,overflowY:"auto"}}>
        {fltSt.length===0&&<div style={{padding:"24px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted}}>No students</div>}
        {fltSt.map(s=>{
          const sel=(form.assignedTo||[]).includes(s.id);const lc=LEVEL_COLORS[s.level]||"#94a3b8";
          return(
            <div key={s.id} onClick={()=>togSt(s.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 13px",background:sel?C.info+"0e":C.panel,border:`1.5px solid ${sel?C.info+"55":C.border}`,borderRadius:10,cursor:"pointer",transition:"all .12s"}}>
              <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?C.info:C.border2}`,background:sel?C.info+"33":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {sel&&<svg width={11} height={11} viewBox="0 0 11 11"><path d="M1.5 6l3 3 5-5" stroke={C.info} strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>{s.name[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:sel?C.text:C.muted,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>{s.email}</div>
              </div>
              {s.level&&<Badge color={lc} small>{s.level}</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Step 3: Schedule ─────────────────────────────────────────────────────
  const totals=isp?pT:fT;
  const s3=(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Divider label="Exam Window"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Input label="Start Date" value={form.startDate} onChange={v=>set("startDate",v)} type="date"/>
        <Input label="End Date"   value={form.endDate}   onChange={v=>set("endDate",v)}   type="date"/>
        <Input label="Start Time" hint="when session opens at kiosk" value={form.startTime} onChange={v=>set("startTime",v)} type="time"/>
      </div>

      <Divider label="Access"/>
      <Toggle label="Open for Registration" hint="Students can see this exam in their personal cabinet and self-register" value={form.isOpen} onChange={v=>set("isOpen",v)}/>

      <Divider label="Student Display"/>
      <Toggle label="Show results after submission"      hint="Score displayed after finishing"              value={form.showResults}               onChange={v=>set("showResults",v)}/>
      <Toggle label="Show question level tag (A1–C2)"   hint="Level badge visible on each question"         value={form.showQuestionLevel??true}    onChange={v=>set("showQuestionLevel",v)}/>
      <Toggle label="Show question points"              hint="Point value visible on each question"         value={form.showQuestionPoints??true}   onChange={v=>set("showQuestionPoints",v)}/>
      {isp&&<Toggle label="Show level thresholds on start screen" hint="Required % per level shown before exam" value={form.showPlacementThreshold??true} onChange={v=>set("showPlacementThreshold",v)}/>}

      <Divider label="Summary"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          {label:"Questions", value:totals.q,                          color:C.gold},
          {label:"Points",    value:isp?totals.pts:"—",                color:C.warning},
          {label:"Students",  value:(form.assignedTo||[]).length,      color:C.info},
          {label:"Pass",      value:isp?"per level":(form.passingScore+"%"), color:C.success},
        ].map(x=>(
          <div key={x.label} style={{textAlign:"center",background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 8px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:x.color,fontWeight:700}}>{x.value}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,marginTop:2}}>{x.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Registration summary block shown in edit mode instead of Students step
  const assignments=initial?.assignments||[];
  const s2edit=(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",background:C.card,border:`1px solid ${C.border}`,borderRadius:12}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:C.gold+"22",border:`2px solid ${C.gold}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>👥</div>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:C.gold,fontWeight:700,lineHeight:1}}>{assignments.length}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,marginTop:3}}>student{assignments.length!==1?"s":""} registered for this exam</div>
        </div>
      </div>
      {assignments.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:280,overflowY:"auto"}}>
          {assignments.map(a=>{
            const st=students.find(s=>s.id===a.studentId);
            const lc=LEVEL_COLORS[st?.level]||"#94a3b8";
            return(
              <div key={a.studentId} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:9}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>{st?st.name[0]:"?"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{st?.name||`Student #${a.studentId}`}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>{st?.email||""}</div>
                </div>
                {st?.level&&<Badge color={lc} small>{st.level}</Badge>}
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:C.gold,background:C.gold+"18",border:`1px solid ${C.gold}33`,borderRadius:4,padding:"1px 7px",letterSpacing:.8,flexShrink:0}}>{a.pin}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,padding:"8px 12px",background:C.panel,borderRadius:8,border:`1px solid ${C.border}`}}>
        💡 Students self-register via their personal cabinet. Once registered they receive a PIN to use at the terminal.
      </div>
    </div>
  );

  const EDIT_CONTENT=[s0,s1,s2edit,s3];
  const EDIT_LABELS=["General","Structure","Registrations","Schedule"];
  const SCONTENT=[s0,s1,s2,s3];
  const SLABELS=WIZARD_STEPS;
  const canNext=[form.title.trim().length>0,isp?pT.q>0:fT.q>0,true,true];

  if(isEdit) return(
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {EDIT_CONTENT.map((c,i)=>(
        <div key={i} style={{marginBottom:28}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:14,paddingBottom:7,borderBottom:`1px solid ${C.border}`}}>{EDIT_LABELS[i]}</div>
          {c}
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8,paddingTop:18,borderTop:`1px solid ${C.border}`}}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" onClick={()=>onSave(form)}>✓ Save Changes</Btn>
      </div>
    </div>
  );

  return(
    <div>
      <StepBar steps={SLABELS} current={step}/>
      <div style={{minHeight:380}}>{SCONTENT[step]}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:26,paddingTop:18,borderTop:`1px solid ${C.border}`}}>
        <Btn onClick={step===0?onCancel:()=>setStep(s=>s-1)}>{step===0?"Cancel":"← Back"}</Btn>
        <div style={{display:"flex",gap:10}}>
          {step<3&&<Btn variant="ghost" onClick={()=>onSave({...form,status:"draft"})}>💾 Save Draft</Btn>}
          {step<3
            ?<Btn variant="primary" disabled={!canNext[step]} onClick={()=>setStep(s=>s+1)}>Next →</Btn>
            :<Btn variant="primary" onClick={()=>onSave(form)}>✓ Create Exam</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ── Exam Card ─────────────────────────────────────────────────────────────────
function ExamCard({exam,onEdit,onDelete,onViewResults,onPreview,onToggleOpen,allStudents=[]}){
  const sm=STATUS_META[exam.status]||STATUS_META.draft;
  const lc=LEVEL_COLORS[exam.level]||"#94a3b8";
  const isp=exam.examType==="placement";
  const totals=isp?placementTotals(exam.placementTemplate||[]):fixedTotals(exam.subpools||[]);
  const assignments=(exam.assignments||[]).map(a=>({...a,student:allStudents.find(s=>s.id===a.studentId)}));

  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px",display:"flex",flexDirection:"column",gap:12,transition:"border .2s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.border2}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
            {isp?<Badge color={C.purple}>📊 Placement</Badge>:<Badge color={lc}>{exam.level}</Badge>}
            <Badge color={sm.color}>{sm.icon} {sm.label}</Badge>
            {exam.isOpen&&<Badge color={C.success}>🟢 Registration Open</Badge>}
          </div>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:C.text,margin:"0 0 3px",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exam.title}</h3>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted}}>#{exam.id}</div>
        </div>
        {/* isOpen toggle */}
        <div title={exam.isOpen?"Close registration":"Open for registration"} onClick={()=>onToggleOpen(exam)}
          style={{width:36,height:20,borderRadius:10,background:exam.isOpen?C.success:C.dim,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0,marginTop:4}}>
          <div style={{position:"absolute",top:2,left:exam.isOpen?18:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left .2s",boxShadow:"0 1px 3px #0006"}}/>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
        {(isp?[
          {icon:"📋",val:totals.q+" q",         tip:"Questions"},
          {icon:"💎",val:totals.pts+" pts",      tip:"Points"},
          {icon:"⏱", val:exam.duration+" min",   tip:"Duration"},
          {icon:"🎯",val:(()=>{const v=Object.values(exam.placementThresholds||{});return v.length?Math.min(...v)+"%/lv":"—";})(),tip:"Threshold"},
        ]:[
          {icon:"📋",val:totals.q+" q",             tip:"Questions"},
          {icon:"💎",val:totals.pts+" pts",          tip:"Points"},
          {icon:"⏱", val:exam.duration+" min",      tip:"Duration"},
          {icon:"🎯",val:(exam.passingScore??0)+"%", tip:"Pass score"},
        ]).map(x=>(
          <div key={x.tip} title={x.tip} style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"7px 4px",textAlign:"center"}}>
            <div style={{fontSize:11,marginBottom:2}}>{x.icon}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:C.text,fontWeight:500}}>{x.val}</div>
          </div>
        ))}
      </div>

      {/* Schedule */}
      {(exam.startDate||exam.startTime)&&(
        <div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:8}}>
          <span style={{fontSize:11}}>📅</span>
          {exam.startDate&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>{fmtDate(exam.startDate)}{exam.endDate&&exam.endDate!==exam.startDate?" → "+fmtDate(exam.endDate):""}</span>}
          {exam.startTime&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:C.gold,background:C.gold+"18",borderRadius:5,padding:"1px 6px",marginLeft:"auto"}}>{exam.startTime}</span>}
        </div>
      )}

      {/* Center */}
      {exam.examCenter&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>🏢 {exam.examCenter.name}</div>}

      {/* Students */}
      <div>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:5}}>Students · {assignments.length}</div>
        {assignments.length===0
          ?<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>None registered</span>
          :<div style={{display:"flex",flexDirection:"column",gap:3}}>
            {assignments.slice(0,3).map(a=>(
              <div key={a.studentId} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 9px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:8}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,color:C.text,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>{a.student?a.student.name[0]:"?"}</div>
                <span style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.student?a.student.name:`#${a.studentId}`}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,color:C.gold,background:C.gold+"18",border:`1px solid ${C.gold}33`,borderRadius:4,padding:"1px 6px",letterSpacing:.8,flexShrink:0}}>{a.pin}</span>
              </div>
            ))}
            {assignments.length>3&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,paddingLeft:8}}>+{assignments.length-3} more</div>}
          </div>
        }
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:6,paddingTop:2}}>
        <Btn small onClick={()=>onEdit(exam)} style={{flex:1}}>✎ Edit</Btn>
        <Btn small onClick={()=>onPreview(exam)} variant="solid" color={C.purple+"22"} style={{flex:1}}><span style={{color:C.purple}}>▶ Preview</span></Btn>
        {(exam.status==="completed"||exam.status==="active")&&(
          <Btn small onClick={()=>onViewResults(exam)} variant="solid" color={C.success+"22"} style={{flex:1}}><span style={{color:C.success}}>📊</span></Btn>
        )}
        <Btn small variant="danger" onClick={()=>onDelete(exam.id)}>✕</Btn>
      </div>
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({exam,onClose,onSave,students=[]}){
  const [assigned,setAssigned]=useState([...(exam.assignedTo||[])]);
  const epins=Object.fromEntries((exam.assignments||[]).map(a=>[a.studentId,a.pin]));
  const tog=(id)=>setAssigned(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);
  const allSel=students.length>0&&students.every(s=>assigned.includes(s.id));
  const togAll=()=>setAssigned(allSel?[]:students.map(s=>s.id));
  return(
    <Modal title="Assign Students" subtitle={exam.title} onClose={onClose}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted}}>Selected: <span style={{color:C.gold,fontWeight:700}}>{assigned.length}</span></span>
        <button onClick={togAll} style={{background:allSel?C.info+"22":"transparent",border:`1px solid ${allSel?C.info:C.border2}`,borderRadius:8,padding:"5px 14px",color:allSel?C.info:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>{allSel?"Deselect All":"Select All"}</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:380,overflowY:"auto",marginBottom:18}}>
        {students.map(s=>{
          const sel=assigned.includes(s.id);const lc=LEVEL_COLORS[s.level]||"#94a3b8";const pin=epins[s.id];
          return(
            <div key={s.id} onClick={()=>tog(s.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",background:sel?C.info+"0e":C.panel,border:`1.5px solid ${sel?C.info+"55":C.border}`,borderRadius:10,cursor:"pointer",transition:"all .12s"}}>
              <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?C.info:C.border2}`,background:sel?C.info+"33":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<svg width={11} height={11} viewBox="0 0 11 11"><path d="M1.5 6l3 3 5-5" stroke={C.info} strokeWidth={1.8} fill="none" strokeLinecap="round"/></svg>}</div>
              <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>{s.name[0]}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:sel?C.text:C.muted,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>{s.email}</div></div>
              {pin&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:C.gold,background:C.gold+"18",border:`1px solid ${C.gold}33`,borderRadius:4,padding:"1px 6px",letterSpacing:.8,flexShrink:0}}>{pin}</span>}
              {s.level&&<Badge color={lc} small>{s.level}</Badge>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={()=>onSave(assigned)}>✓ Save</Btn>
      </div>
    </Modal>
  );
}

// ── Results Modal ─────────────────────────────────────────────────────────────
function ResultsModal({exam,onClose,allStudents=[]}){
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{api.getResults({examId:exam.id}).then(setResults).catch(()=>{}).finally(()=>setLoading(false));},[exam.id]);
  return(
    <Modal title="Results" subtitle={exam.title} onClose={onClose}>
      {loading?<div style={{padding:"40px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted}}>Loading…</div>
      :results.length===0?<div style={{padding:"40px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted}}>No results yet</div>
      :<div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:440,overflowY:"auto"}}>
        {results.map(r=>{
          const s=allStudents.find(x=>x.id===r.studentId)||r.student;
          const pass=r.passed;const lc=LEVEL_COLORS[r.detectedLevel]||"#94a3b8";
          return(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.border2},${C.dim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{s?.name?.[0]||"?"}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s?.name||"Unknown"}</div><div style={{height:4,background:C.dim,borderRadius:2,marginTop:5,overflow:"hidden"}}><div style={{width:`${r.pct}%`,height:"100%",background:pass?C.success:C.danger,borderRadius:2,transition:"width .6s"}}/></div></div>
              {r.detectedLevel&&<Badge color={lc}>{r.detectedLevel}</Badge>}
              <div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:pass?C.success:C.danger,fontWeight:700}}>{r.score}/{r.totalPoints}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:pass?C.success:C.danger}}>{r.pct}% · {pass?"✓ Pass":"✕ Fail"}</div></div>
            </div>
          );
        })}
      </div>}
    </Modal>
  );
}

// ── Exam Preview ──────────────────────────────────────────────────────────────
// Dot size constants
const DOT = 14; // px — dot diameter

function NavDots({questions, idx, setIdx, isp}){
  const SECTION_COLORS = {READING:"#60a5fa",LISTENING:"#34d399",SPEAKING:"#fb923c",WRITING:"#94a3b8"};

  if(isp){
    // Placement: Level label + section label + dots, all inline with wrapping
    const levels=[...new Set(questions.map(q=>q.level))];
    return(
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"6px 14px",
        padding:"8px 14px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:10}}>
        {levels.map(lv=>{
          const lc=LEVEL_COLORS[lv]||"#94a3b8";
          const lqs=questions.map((q,i)=>({q,i})).filter(({q})=>q.level===lv);
          const secs=[...new Set(lqs.map(({q})=>q.section))];
          return(
            <div key={lv} style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,
                color:lc,flexShrink:0}}>{lv}</span>
              {secs.map(sec=>{
                const sc=SECTION_COLORS[sec]||C.muted;
                const sq=lqs.filter(({q})=>q.section===sec);
                return(
                  <div key={`${lv}-${sec}`} style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:sc,
                      textTransform:"uppercase",letterSpacing:.4,flexShrink:0}}>{sec}</span>
                    {sq.map(({i})=>(
                      <button key={`${lv}-${sec}-${i}`} onClick={()=>setIdx(i)} title={`Q${i+1}`}
                        style={{width:DOT,height:DOT,borderRadius:"50%",padding:0,cursor:"pointer",flexShrink:0,
                          background:i===idx?C.gold:sc+"55",
                          border:`2px solid ${i===idx?C.gold:sc}`,
                          boxShadow:i===idx?`0 0 6px ${C.gold}88`:"none",
                          transition:"all .15s"}}/>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // Fixed: group by Section only
  const secs=[...new Set(questions.map(q=>q.section).filter(Boolean))];
  const hasSecs=secs.length>0;
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"10px 14px",
      background:C.panel,border:`1px solid ${C.border}`,borderRadius:10}}>
      {hasSecs ? secs.map(sec=>{
        const sc=SECTION_COLORS[sec]||C.muted;
        const sq=questions.map((q,i)=>({q,i})).filter(({q})=>q.section===sec);
        return(
          <div key={sec} style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:sc,
              textTransform:"uppercase",letterSpacing:.5,flexShrink:0}}>{sec}</span>
            {sq.map(({i})=>(
              <button key={i} onClick={()=>setIdx(i)} title={`Q${i+1}`}
                style={{width:DOT,height:DOT,borderRadius:"50%",padding:0,cursor:"pointer",flexShrink:0,
                  background:i===idx?C.gold:sc+"55",
                  border:`2px solid ${i===idx?C.gold:sc}`,
                  boxShadow:i===idx?`0 0 6px ${C.gold}88`:"none",
                  transition:"all .15s"}}/>
            ))}
          </div>
        );
      }) : questions.map((_,i)=>(
        <button key={i} onClick={()=>setIdx(i)} title={`Q${i+1}`}
          style={{width:DOT,height:DOT,borderRadius:"50%",padding:0,cursor:"pointer",flexShrink:0,
            background:i===idx?C.gold:C.border2,
            border:`2px solid ${i===idx?C.gold:C.muted}`,
            boxShadow:i===idx?`0 0 6px ${C.gold}88`:"none",
            transition:"all .15s"}}/>
      ))}
    </div>
  );
}

function ExamPreview({exam, questions, onClose}){
  const [idx, setIdx] = useState(0);
  const q = questions[idx];
  const isp = exam?.examType==="placement";

  if(!q) return(
    <div style={{color:C.muted,fontFamily:"'DM Sans',sans-serif",padding:"40px",textAlign:"center"}}>
      No questions in this exam
    </div>
  );

  const navDots = (
    <NavDots questions={questions} idx={idx} setIdx={setIdx} isp={isp}/>
  );

  return(
    <StudentPreview
      key={q.id}
      q={q}
      onClose={onClose}
      navDots={navDots}
      navPrev={idx>0 ? ()=>setIdx(i=>i-1) : null}
      navNext={idx<questions.length-1 ? ()=>setIdx(i=>i+1) : null}
    />
  );
}

// ── Exams Page ────────────────────────────────────────────────────────────────
function ExamsPage(){
  const [exams,setExams]=useState([]);
  const [students,setStudents]=useState([]);
  const [sections,setSections]=useState([]);
  const [centers,setCenters]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [modal,setModal]=useState(null);
  const [editing,setEditing]=useState(null);
  const [assigning,setAssigning]=useState(null);
  const [viewingResults,setViewingResults]=useState(null);
  const [deleteId,setDeleteId]=useState(null);
  const [previewing,setPreviewing]=useState(null);
  const [previewLoading,setPreviewLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [filterStatus,setFilterStatus]=useState("all");
  const [filterLevel,setFilterLevel]=useState("all");
  const [search,setSearch]=useState("");

  useEffect(()=>{
    Promise.all([
      api.getExams(),
      api.getStudents(),
      api.getSections(),
      api.getAllCenters().catch(()=>[]),
    ]).then(([e,s,secs,c])=>{
      setExams(Array.isArray(e)?e:[]);
      setStudents(Array.isArray(s)?s:[]);
      setSections((Array.isArray(secs)?secs:[]).map(sec=>sec.name||sec));
      setCenters(Array.isArray(c)?c:[]);
      setLoading(false);
    }).catch(err=>{setError(err.message);setLoading(false);});
  },[]);

  const filtered=exams.filter(e=>{
    if(filterStatus!=="all"&&e.status!==filterStatus)return false;
    if(filterLevel!=="all"&&e.level!==filterLevel)return false;
    if(search&&!e.title.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  const handleSave=async(form)=>{
    setSaving(true);
    try{
      if(modal==="edit"){const u=await api.updateExam(form.id,form);setExams(es=>es.map(e=>e.id===u.id?u:e));}
      else{const c=await api.createExam(form);setExams(es=>[c,...es]);}
      setModal(null);setEditing(null);
    }catch(err){alert("Save failed: "+err.message);}
    finally{setSaving(false);}
  };

  const handleDelete=async(id)=>{
    try{await api.deleteExam(id);setExams(es=>es.filter(e=>e.id!==id));}
    catch(err){alert("Delete failed: "+err.message);}
    setDeleteId(null);
  };

  const handleAssign=async(ids)=>{
    try{const u=await api.updateExam(assigning.id,{assignedTo:ids});setExams(es=>es.map(e=>e.id===assigning.id?u:e));}
    catch(err){alert("Assign failed: "+err.message);}
    setAssigning(null);
  };

  const handleToggleOpen=async(exam)=>{
    try{const u=await api.updateExam(exam.id,{isOpen:!exam.isOpen});setExams(es=>es.map(e=>e.id===exam.id?u:e));}
    catch(err){alert("Failed: "+err.message);}
  };

  const handlePreview=async(exam)=>{
    setPreviewLoading(true);
    try{const q=await api.getExamQuestions(exam.id,true);console.log("preview q:",q);setPreviewing({exam,questions:Array.isArray(q)?q:[]});}
    catch(err){console.error("preview error:",err);alert("Preview error: "+err.message);}
    finally{setPreviewLoading(false);}
  };

  const statCounts=Object.fromEntries(Object.keys(STATUS_META).map(s=>[s,exams.filter(e=>e.status===s).length]));

  return(
    <div style={{flex:1,overflowY:"auto",padding:"32px 40px",minWidth:0,width:"100%",boxSizing:"border-box"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:C.text,margin:"0 0 4px",fontWeight:600}}>Exam Management</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,margin:0}}>{exams.length} exam{exams.length!==1?"s":""} · {students.length} students · {sections.length} sections</p>
        </div>
        <Btn variant="primary" onClick={()=>{setEditing(null);setModal("create");}}>+ New Exam</Btn>
      </div>

      {/* Status cards */}
      <div style={{display:"flex",gap:10,marginBottom:22,flexWrap:"wrap"}}>
        {Object.entries(STATUS_META).map(([s,m])=>(
          <div key={s} onClick={()=>setFilterStatus(filterStatus===s?"all":s)}
            style={{background:filterStatus===s?m.color+"18":C.card,border:`1px solid ${filterStatus===s?m.color+"55":C.border}`,borderRadius:12,padding:"11px 16px",cursor:"pointer",transition:"all .15s",minWidth:80}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:m.color}}>{statCounts[s]||0}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2}}>{m.label}</div>
          </div>
        ))}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 16px",minWidth:80}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.success}}>{exams.filter(e=>e.isOpen).length}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2}}>Registration Open</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"11px 14px",marginBottom:18,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search exams…"
          style={{flex:"1 1 160px",background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:9,padding:"7px 12px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[{value:"all",label:"All"},...LEVELS.map(l=>({value:l,label:l}))].map(({value,label})=>{
            const lc=LEVEL_COLORS[value]||C.gold;const act=filterLevel===value;
            return(<button key={value} onClick={()=>setFilterLevel(value)} style={{background:act?lc+"22":"transparent",border:`1px solid ${act?lc:C.border2}`,borderRadius:7,padding:"4px 10px",color:act?lc:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:500,cursor:"pointer",transition:"all .12s"}}>{label}</button>);
          })}
        </div>
      </div>

      {/* Grid */}
      {loading?<div style={{textAlign:"center",padding:"60px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>Loading…</div>
      :error?<div style={{textAlign:"center",padding:"60px",color:C.danger,fontFamily:"'DM Sans',sans-serif"}}>Error: {error}</div>
      :filtered.length===0?<div style={{textAlign:"center",padding:"60px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>No exams found</div>
      :(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:16}}>
          {filtered.map(exam=>(
            <ExamCard key={exam.id} exam={exam} allStudents={students}
              onEdit={e=>{setEditing(e);setModal("edit");}}
              onDelete={id=>setDeleteId(id)}
              onViewResults={e=>setViewingResults(e)}
              onPreview={handlePreview}
              onToggleOpen={handleToggleOpen}
            />
          ))}
        </div>
      )}

      {/* Wizard */}
      {(modal==="create"||modal==="edit")&&(
        <Modal title={modal==="edit"?"Edit Exam":"New Exam"} subtitle={modal==="edit"?`#${editing?.id} · ${editing?.title}`:"4-step wizard"} onClose={()=>{setModal(null);setEditing(null);}} wide>
          {saving&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.gold,marginBottom:12,textAlign:"center"}}>Saving…</div>}
          <ExamWizard initial={editing} onSave={handleSave} onCancel={()=>{setModal(null);setEditing(null);}} students={students} sections={sections} centers={centers}/>
        </Modal>
      )}


      {viewingResults&&<ResultsModal exam={viewingResults} onClose={()=>setViewingResults(null)} allStudents={students}/>}

      {deleteId&&(
        <Modal title="Delete Exam?" onClose={()=>setDeleteId(null)}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.muted,marginBottom:22}}>Exam #{deleteId} and all assignments will be permanently deleted.</p>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn onClick={()=>setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={()=>handleDelete(deleteId)}>✕ Delete</Btn>
          </div>
        </Modal>
      )}

      {previewLoading&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}><div style={{color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15}}>Loading preview…</div></div>}
      {previewing&&(
        <ExamPreview exam={previewing.exam} questions={previewing.questions} onClose={()=>setPreviewing(null)}/>
      )}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function AdminExams({theme}){
  if(theme)C=theme;
  return(
    <>
      <style>{FONTS}{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#243050;border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
        select option{background:#080f1a}
        input[type=date],input[type=time]{color-scheme:dark}
      `}</style>
      <div style={{flex:1,display:"flex",overflow:"hidden",minWidth:0}}>
        <ExamsPage/>
      </div>
    </>
  );
}
