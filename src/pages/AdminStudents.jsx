import { useState, useEffect, useMemo } from "react";
import { api } from "../api.js";

let C = { bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",gold:"#c8a96e",goldDim:"#7c5830",text:"#e2e8f0",muted:"#475569",dim:"#1e293b",success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa",purple:"#a78bfa",scrollThumb:"#243050",sidebarBg:"#080f1a",topbarBg:"#080f1acc" };

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');`;


const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const LC = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function avg(arr) { return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0; }
function pctColor(p) { return p>=80?C.success:p>=60?C.warning:C.danger; }

// ── UI Atoms ──────────────────────────────────────────────────────────────────
function Avatar({ letter, size=38, color=C.gold }) {
  return <div style={{ width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${color}33,${color}11)`,border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:size*0.45,fontWeight:700,color,flexShrink:0 }}>{letter}</div>;
}

function LevelBadge({ level, small }) {
  const c = LC[level]||"#94a3b8";
  return <span style={{ background:c+"18",color:c,border:`1px solid ${c}33`,borderRadius:6,padding:small?"1px 7px":"3px 10px",fontSize:small?10:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:.4 }}>{level}</span>;
}

function StatusDot({ status }) {
  const c = status==="active"?C.success:C.muted;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:c }}><span style={{ width:7,height:7,borderRadius:"50%",background:c,display:"inline-block" }} />{status==="active"?"Active":"Inactive"}</span>;
}

function Btn({ children, onClick, variant="ghost", small, style={} }) {
  const base = { fontFamily:"'DM Sans',sans-serif",fontSize:small?11:13,fontWeight:600,borderRadius:9,padding:small?"5px 12px":"9px 18px",cursor:"pointer",border:"none",transition:"all .15s",...style };
  const v = {
    primary: { background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"white",boxShadow:`0 3px 12px ${C.gold}44` },
    ghost:   { background:"transparent",color:C.muted,border:`1px solid ${C.border2}` },
    danger:  { background:"#f8717114",color:C.danger,border:`1px solid #f8717130` },
    info:    { background:C.info+"14",color:C.info,border:`1px solid ${C.info}30` },
  };
  return <button onClick={onClick} style={{...base,...v[variant]}}>{children}</button>;
}

function Input({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.5,textTransform:"uppercase" }}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:10,padding:"10px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none" }}
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

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"#000000a0",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{ background:C.panel,border:`1px solid ${C.border2}`,borderRadius:22,padding:"36px 40px",width:"100%",maxWidth:wide?860:640,maxHeight:"92vh",overflowY:"auto",animation:"fadeSlideIn .3s ease",boxShadow:"0 32px 80px #000000cc" }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24 }}>
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,margin:"0 0 3px",fontWeight:600 }}>{title}</h2>
            {subtitle && <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,margin:0 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${C.border2}`,borderRadius:8,width:34,height:34,color:C.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBar({ value, max, color, height=6 }) {
  const pct = max>0 ? Math.min((value/max)*100,100) : 0;
  return (
    <div style={{ width:"100%",height,background:C.dim,borderRadius:height/2,overflow:"hidden" }}>
      <div style={{ width:`${pct}%`,height:"100%",background:color||C.gold,borderRadius:height/2,transition:"width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color=C.gold, width=120, height=36 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => [
    (i/(data.length-1))*(width-4)+2,
    height-4-((v-min)/range)*(height-8),
  ]);
  const path = pts.map((p,i)=>(i===0?`M${p[0]},${p[1]}`:`L${p[0]},${p[1]}`)).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow:"visible" }}>
      <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={3} fill={color} />
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function Donut({ segments, size=80, stroke=10 }) {
  const r = (size-stroke)/2, cx=size/2, cy=size/2;
  const circ = 2*Math.PI*r;
  const total = segments.reduce((a,b)=>a+b.value,0)||1;
  let offset = 0;
  return (
    <svg width={size} height={size}>
      {segments.map((s,i)=>{
        const dash = (s.value/total)*circ;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset*circ/total}
          style={{ transform:"rotate(-90deg)",transformOrigin:"50% 50%",transition:"stroke-dasharray .6s" }}
        />;
        offset += s.value;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.dim} strokeWidth={stroke} />
      {segments.map((s,i)=>{
        const dash = (s.value/total)*circ;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={-segments.slice(0,i).reduce((a,b)=>a+b.value,0)/total*circ}
          style={{ transform:"rotate(-90deg)",transformOrigin:"50% 50%" }}
        />;
        return el;
      })}
    </svg>
  );
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────
function StatTile({ icon, label, value, sub, color=C.gold, sparkData }) {
  return (
    <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 22px",display:"flex",flexDirection:"column",gap:8 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ width:38,height:38,borderRadius:10,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{icon}</div>
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>
      <div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:700,color,lineHeight:1 }}>{value}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,fontWeight:500,marginTop:4 }}>{label}</div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Student Profile Modal ─────────────────────────────────────────────────────
function StudentProfile({ student, onClose, onEdit }) {
  const [results, setResults] = useState([]);
  useEffect(() => { api.getResults({ studentId: student.id }).then(setResults); }, [student.id]);
  const scores = results.map(r=>r.pct);
  const avgScore = avg(scores);
  const passed = results.filter(r=>r.passed).length;

  const avatarLetter = student.avatar || student.name?.[0] || "?";
  const subtitle = [student.email, student.group].filter(Boolean).join(" · ");

  const contactRows = [
    ["📧", student.email],
    ["📞", student.phone],
    ["📅", student.joined ? new Date(student.joined).toLocaleDateString("hy-AM", { year:"numeric", month:"long", day:"numeric" }) : null],
    ["👥", student.group],
  ].filter(([, val]) => val);

  return (
    <Modal title={student.name} subtitle={subtitle} onClose={onClose} wide>
      <div style={{ display:"flex",gap:24,flexWrap:"wrap" }}>
        {/* Left column */}
        <div style={{ display:"flex",flexDirection:"column",gap:16,minWidth:220,flex:"0 0 220px" }}>
          <div style={{ textAlign:"center",padding:"24px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:14 }}>
            <Avatar letter={avatarLetter} size={64} color={LC[student.level]||C.gold} />
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:C.text,fontWeight:600,marginTop:12 }}>{student.name}</div>
            {student.group && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,marginTop:4 }}>{student.group}</div>}
            <div style={{ marginTop:10 }}><LevelBadge level={student.level} /></div>
            <div style={{ marginTop:8 }}><StatusDot status={student.status} /></div>
          </div>
          {contactRows.length > 0 && (
            <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px" }}>
              {contactRows.map(([icon, val], i) => (
                <div key={icon} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom: i < contactRows.length-1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize:13,marginTop:1,flexShrink:0 }}>{icon}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,wordBreak:"break-all" }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex:1,minWidth:280,display:"flex",flexDirection:"column",gap:14 }}>
          {/* Summary stats */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
            {[
              { label:"Exams", value:results.length, color:C.info },
              { label:"Passed", value:passed, color:C.success },
              { label:"Avg %", value:results.length ? avgScore+"%" : "—", color:results.length ? pctColor(avgScore) : C.muted },
            ].map(s=>(
              <div key={s.label} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",textAlign:"center" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:s.color }}>{s.value}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Score trend */}
          {scores.length > 1 && (
            <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:12 }}>Score Trend</div>
              <Sparkline data={scores} color={C.gold} width={340} height={60} />
            </div>
          )}

          {/* Exam results list */}
          <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:12 }}>Exam Results</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {results.map(r=>(
                <div key={r.examId} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,fontWeight:500 }}>{r.examTitle}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:5 }}>
                      <div style={{ flex:1 }}><MiniBar value={r.score} max={r.maxScore} color={pctColor(r.pct)} height={4} /></div>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,flexShrink:0 }}>{r.score}/{r.maxScore}</span>
                    </div>
                    {r.completedAt && (
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,marginTop:3 }}>
                        {new Date(r.completedAt).toLocaleDateString("hy-AM", { year:"numeric", month:"short", day:"numeric" })}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign:"right",minWidth:70 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:pctColor(r.pct) }}>{r.pct}%</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:r.passed?C.success:C.danger,fontWeight:600 }}>{r.passed?"✓ Passed":"✕ Failed"}</div>
                  </div>
                </div>
              ))}
              {results.length===0 && (
                <div style={{ textAlign:"center",padding:"24px 0" }}>
                  <div style={{ fontSize:28,marginBottom:8 }}>📋</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>No exam results yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display:"flex",justifyContent:"flex-end",marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`,gap:10 }}>
        <Btn onClick={onClose}>Close</Btn>
        <Btn variant="primary" onClick={()=>onEdit(student)}>✎ Edit</Btn>
      </div>
    </Modal>
  );
}

// ── Student Form Modal ────────────────────────────────────────────────────────
function StudentForm({ initial, onSave, onCancel }) {
  const blank = { name:"",email:"",phone:"",group:"Խ-101",level:"B1",status:"active" };
  const [f,setF] = useState(initial||blank);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={initial?"Խ. students · Edit Student":"Ն. students · New Student"} onClose={onCancel}>
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        <Input label="Full Name" value={f.name} onChange={v=>set("name",v)} placeholder="e.g. Անի Հակոբյան" />
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <Input label="Email" value={f.email} onChange={v=>set("email",v)} placeholder="ani@mail.am" />
          <Input label="Phone" value={f.phone} onChange={v=>set("phone",v)} placeholder="+374 ..." />
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
          <Select label="Group" value={f.group} onChange={v=>set("group",v)} options={["Խ-101","Խ-102","Խ-103","Խ-104"].map(g=>({value:g,label:g}))} />
          <Select label="Level" value={f.level} onChange={v=>set("level",v)} options={LEVELS.map(l=>({value:l,label:l}))} />
          <Select label="Settings" value={f.status} onChange={v=>set("status",v)} options={[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]} />
        </div>
        <div style={{ display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid ${C.border}` }}>
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" onClick={()=>onSave(f)} disabled={!f.name||!f.email}>{initial?"✓ Save":"✓ Create"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Analytics Dashboard ───────────────────────────────────────────────────────
function AnalyticsDash() {
  const [students, setStudents] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [exams, setExams] = useState([]);
  useEffect(() => {
    Promise.all([api.getStudents(), api.getResults(), api.getExams()]).then(([s,r,e]) => {
      setStudents(s); setAllResults(r); setExams(e);
    });
  }, []);

  const totalStudents = students.length;
  const activeStudents = students.filter(s=>s.status==="active").length;
  const totalExams = allResults.length;
  const passedExams = allResults.filter(r=>r.passed).length;
  const avgPct = avg(allResults.map(r=>r.pct));

  const levelDist = LEVELS.map(l=>({ l, n:students.filter(s=>s.level===l).length, color:LC[l] }));
  const groupDist = ["Խ-101","Խ-102","Խ-103"].map(g=>({ g, n:students.filter(s=>s.group===g).length }));

  // Pass rate per exam
  const examStats = exams.map(e=>{
    const rs = allResults.filter(r=>r.examId===e.id);
    const passed = rs.filter(r=>r.passed).length;
    const avgS = avg(rs.map(r=>r.pct));
    return { ...e, attempts:rs.length, passed, passRate:rs.length?Math.round((passed/rs.length)*100):0, avgScore:avgS };
  });

  // Score distribution buckets
  const buckets = [
    { label:"0–40%",  min:0,  max:40,  color:C.danger },
    { label:"41–60%", min:41, max:60,  color:C.warning },
    { label:"61–80%", min:61, max:80,  color:C.info },
    { label:"81–100%",min:81, max:100, color:C.success },
  ];
  const bucketCounts = buckets.map(b=>({ ...b, count:allResults.filter(r=>r.pct>=b.min&&r.pct<=b.max).length }));
  const maxBucket = Math.max(...bucketCounts.map(b=>b.count));

  // Monthly trend (fake)
  const months = ["Հն","Փ","Մ","Ա","Մ","Հ","Հ","Օ","Ս","Հ","Ն","Դ"];
  const monthData = months.map((_,i)=>40+Math.round(Math.sin(i*0.6)*20)+i*3);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
      {/* KPI row */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14 }}>
        <StatTile icon="👤" label="Total Students" value={totalStudents} sub={`${activeStudents} active`} color={C.info} sparkData={[6,7,8,8,9,10]} />
        <StatTile icon="📋" label="Փ. քննություններ" value={totalExams} sub={`${passedExams} passed`} color={C.gold} sparkData={[3,5,6,8,9,11,12]} />
        <StatTile icon="🎯" label="Ան. % (avg)" value={`${Math.round((passedExams/totalExams)*100)}%`} sub="pass rate" color={C.success} sparkData={[50,55,60,65,68,72,75]} />
        <StatTile icon="📊" label="Avg կ." value={`${avgPct}%`} sub="mean score" color={C.purple} sparkData={[58,60,62,64,65,67,70]} />
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
        {/* Level distribution */}
        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:16 }}>Ուս. մ. · Level Distribution</div>
          <div style={{ display:"flex",alignItems:"center",gap:24 }}>
            <Donut size={96} stroke={12} segments={levelDist.filter(l=>l.n>0).map(l=>({ value:l.n, color:l.color }))} />
            <div style={{ flex:1,display:"flex",flexDirection:"column",gap:8 }}>
              {levelDist.map(l=>(
                <div key={l.l} style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ background:l.color+"22",color:l.color,border:`1px solid ${l.color}33`,borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif",minWidth:30,textAlign:"center" }}>{l.l}</span>
                  <div style={{ flex:1 }}><MiniBar value={l.n} max={totalStudents} color={l.color} height={5} /></div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,minWidth:16,textAlign:"right" }}>{l.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score distribution */}
        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:16 }}>Ա. ծ. · Score Distribution</div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {bucketCounts.map(b=>(
              <div key={b.label} style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,minWidth:52 }}>{b.label}</span>
                <div style={{ flex:1 }}><MiniBar value={b.count} max={maxBucket||1} color={b.color} height={20} /></div>
                <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,color:b.color,minWidth:22,textAlign:"right" }}>{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Exam pass rates */}
        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:16 }}>Ք. ան. % · Exam Pass Rates</div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {examStats.map(e=>(
              <div key={e.id} style={{ display:"flex",flexDirection:"column",gap:5 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,fontWeight:500 }}>{e.title}</span>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{e.attempts} հ.</span>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,color:pctColor(e.passRate) }}>{e.passRate}%</span>
                  </div>
                </div>
                <MiniBar value={e.passRate} max={100} color={pctColor(e.passRate)} height={5} />
              </div>
            ))}
          </div>
        </div>

        {/* Monthly score trend */}
        <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:16 }}>Ամ. ա. · Monthly Avg Score</div>
          <div style={{ position:"relative",paddingBottom:20 }}>
            <Sparkline data={monthData} color={C.gold} width={360} height={80} />
            <div style={{ display:"flex",justifyContent:"space-between",marginTop:6 }}>
              {months.map(m=><span key={m} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,color:C.muted }}>{m}</span>)}
            </div>
          </div>
          <div style={{ display:"flex",gap:16,marginTop:8 }}>
            <div><span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.gold }}>{Math.max(...monthData)}%</span><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted }}>Max</div></div>
            <div><span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.info }}>{Math.min(...monthData)}%</span><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted }}>Min</div></div>
            <div><span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.success }}>{avg(monthData)}%</span><div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted }}>Avg</div></div>
          </div>
        </div>
      </div>

      {/* Top performers */}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"22px 24px" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:16 }}>🏆 Լ. ու. · Top Performers</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10 }}>
          {students.map(s=>{
            const rs = allResults.filter(r=>r.studentId===s.id);
            const a = avg(rs.map(r=>r.pct));
            return { ...s, avgScore:a, resultCount:rs.length };
          }).sort((a,b)=>b.avgScore-a.avgScore).slice(0,6).map((s,rank)=>(
            <div key={s.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.panel,border:`1px solid ${rank===0?C.gold:C.border}`,borderRadius:12 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:rank===0?C.gold:rank===1?"#94a3b8":rank===2?"#cd7f32":C.muted,minWidth:22 }}>{rank+1}</div>
              <Avatar letter={s.avatar || s.name?.[0] || "?"} size={32} color={LC[s.level]||C.gold} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted }}>{s.resultCount} exam{s.resultCount!==1?"s":""}</div>
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:pctColor(s.avgScore) }}>{s.avgScore}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Students Table ────────────────────────────────────────────────────────────
function StudentsTable() {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    Promise.all([api.getStudents(), api.getResults()]).then(([s, r]) => {
      setStudents(s);
      setResults(r);
      setLoading(false);
    });
  }, []);

  const groups = [...new Set(students.map(s=>s.group))];

  const enriched = useMemo(()=>students.map(s=>{
    const rs = results.filter(r=>r.studentId===s.id);
    return { ...s, resultCount:rs.length, avgScore:avg(rs.map(r=>r.pct)), passCount:rs.filter(r=>r.passed).length };
  }), [students, results]);

  const filtered = useMemo(()=>{
    let r = enriched;
    if (search) r = r.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||(s.email||"").toLowerCase().includes(search.toLowerCase()));
    if (filterGroup!=="all") r = r.filter(s=>s.group===filterGroup);
    if (filterLevel!=="all") r = r.filter(s=>s.level===filterLevel);
    if (filterStatus!=="all") r = r.filter(s=>s.status===filterStatus);
    r = [...r].sort((a,b)=>{
      if (sortBy==="name") return a.name.localeCompare(b.name);
      if (sortBy==="score") return b.avgScore-a.avgScore;
      if (sortBy==="exams") return b.resultCount-a.resultCount;
      return 0;
    });
    return r;
  }, [enriched,search,filterGroup,filterLevel,filterStatus,sortBy]);

  const handleSave = async (f) => {
    if (editing) {
      const updated = await api.updateStudent(editing.id, f);
      setStudents(ss=>ss.map(s=>s.id===editing.id?updated:s));
    } else {
      const newS = await api.createStudent({...f, avatar: f.name?.[0] || "?"});
      setStudents(ss=>[newS,...ss]);
    }
    setEditing(null); setCreating(false);
  };

  const COL = ["#","Student","Group","Level","Exams","Avg","Passed","Settings",""];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      {/* Toolbar */}
      <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search students..."
          style={{ flex:"1 1 200px",background:C.panel,border:`1.5px solid ${C.border2}`,borderRadius:9,padding:"9px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none" }} />
        <div style={{ display:"flex",gap:6 }}>
          {[{value:"all",label:"All"},{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}].map(({value,label})=>{
            const c=value==="active"?C.success:value==="inactive"?C.muted:C.gold;
            const act=filterStatus===value;
            return <button key={value} onClick={()=>setFilterStatus(value)} style={{ background:act?c+"22":"transparent",border:`1px solid ${act?c:C.border2}`,borderRadius:8,padding:"6px 12px",color:act?c:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .15s" }}>{label}</button>;
          })}
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {[{value:"all",label:"All Groups"},...groups.map(g=>({value:g,label:g}))].map(({value,label})=>{
            const act=filterGroup===value;
            return <button key={value} onClick={()=>setFilterGroup(value)} style={{ background:act?C.info+"22":"transparent",border:`1px solid ${act?C.info:C.border2}`,borderRadius:8,padding:"6px 12px",color:act?C.info:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .15s" }}>{label}</button>;
          })}
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {[{value:"all",label:"All Levels"},...LEVELS.map(l=>({value:l,label:l}))].map(({value,label})=>{
            const c=LC[value]||C.gold; const act=filterLevel===value;
            return <button key={value} onClick={()=>setFilterLevel(value)} style={{ background:act?c+"22":"transparent",border:`1px solid ${act?c:C.border2}`,borderRadius:8,padding:"6px 12px",color:act?c:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .15s" }}>{label}</button>;
          })}
        </div>
        <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ background:C.panel,border:`1px solid ${C.border2}`,borderRadius:9,padding:"7px 12px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",cursor:"pointer" }}>
            <option value="name">Ա–Ֆ</option>
            <option value="score">Score ↓</option>
            <option value="exams">Exams ↓</option>
          </select>
          <Btn variant="primary" small onClick={()=>setCreating(true)}>+ New Student</Btn>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
        <div style={{ display:"grid",gridTemplateColumns:"36px 1fr 80px 60px 50px 70px 70px 80px 80px",gap:10,padding:"10px 18px",background:C.panel,borderBottom:`1px solid ${C.border}` }}>
          {COL.map((h,i)=><span key={i} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,fontWeight:600,letterSpacing:.8,textTransform:"uppercase" }}>{h}</span>)}
        </div>
        {loading ? (
          <div style={{ padding:"48px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.muted }}>Loading…</div>
        ) : filtered.length===0 ? (
          <div style={{ padding:"48px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.muted }}>No students found</div>
        ) : filtered.map(s=>(
          <div key={s.id} style={{ display:"grid",gridTemplateColumns:"36px 1fr 80px 60px 50px 70px 70px 80px 80px",gap:10,padding:"12px 18px",borderBottom:`1px solid ${C.border}`,alignItems:"center",cursor:"pointer",transition:"background .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.panel+"aa"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            onClick={()=>setViewing(s)}>
            <Avatar letter={s.avatar || s.name?.[0] || "?"} size={28} color={LC[s.level]||C.gold} />
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,fontWeight:500 }}>{s.name}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted }}>{s.email}</div>
            </div>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.info }}>{s.group}</span>
            <LevelBadge level={s.level} small />
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,textAlign:"center" }}>{s.resultCount}</span>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,color:pctColor(s.avgScore),textAlign:"center" }}>{s.avgScore>0?s.avgScore+"%":"—"}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.success }}>{s.passCount}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted }}>/{ s.resultCount}</span>
            </div>
            <StatusDot status={s.status} />
            <div style={{ display:"flex",gap:5 }} onClick={e=>e.stopPropagation()}>
              <button onClick={e=>{e.stopPropagation();setEditing(s)}} style={{ background:"transparent",border:`1px solid ${C.border2}`,borderRadius:6,padding:"4px 9px",color:C.muted,fontSize:12,cursor:"pointer" }}>✎</button>
              <button onClick={e=>{e.stopPropagation();setDeleteId(s.id)}} style={{ background:"transparent",border:`1px solid #f8717130`,borderRadius:6,padding:"4px 9px",color:C.danger,fontSize:12,cursor:"pointer" }}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,textAlign:"right" }}>{filtered.length} / {students.length} students</div>

      {viewing && <StudentProfile student={viewing} onClose={()=>setViewing(null)} onEdit={s=>{setEditing(s);setViewing(null)}} />}
      {(editing||creating) && <StudentForm initial={editing} onSave={handleSave} onCancel={()=>{setEditing(null);setCreating(false)}} />}
      {deleteId && (
        <Modal title="Delete?" onClose={()=>setDeleteId(null)}>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.muted,marginBottom:20 }}>Delete student #{deleteId}?</p>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <Btn onClick={()=>setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={async()=>{await api.deleteStudent(deleteId);setStudents(ss=>ss.filter(s=>s.id!==deleteId));setDeleteId(null)}}>✕ Ջ.</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminStudents({ theme }) {
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
      `}</style>
      <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", boxSizing:"border-box" }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:"#e2e8f0", margin:"0 0 4px", fontWeight:600 }}>Students</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#475569", margin:0 }}>Student Management</p>
        </div>
        <StudentsTable />
      </div>
    </>
  );
}