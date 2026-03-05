import { useState, useMemo } from "react";

let C = { bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",gold:"#c8a96e",goldDim:"#7c5830",text:"#e2e8f0",muted:"#475569",dim:"#1e293b",success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa",purple:"#a78bfa",scrollThumb:"#243050",sidebarBg:"#080f1a",topbarBg:"#080f1acc" };

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');`;

const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const LC = { A1:"#4ade80", A2:"#86efac", B1:"#60a5fa", B2:"#93c5fd", C1:"#f59e0b", C2:"#fbbf24" };

const STUDENTS = [
  { id:1,  name:"Անի Հակոբյան",   group:"Խ-101", level:"B1", status:"active" },
  { id:2,  name:"Արամ Պետ.",      group:"Խ-101", level:"A2", status:"active" },
  { id:3,  name:"Մարինե Գ.",      group:"Խ-102", level:"B2", status:"active" },
  { id:4,  name:"Դավիթ Ս.",       group:"Խ-102", level:"C1", status:"active" },
  { id:5,  name:"Նարեկ Ա.",       group:"Խ-103", level:"A1", status:"inactive" },
  { id:6,  name:"Լուսինե Կ.",     group:"Խ-103", level:"B1", status:"active" },
  { id:7,  name:"Վահե Մ.",        group:"Խ-101", level:"A2", status:"active" },
  { id:8,  name:"Հայկ Ա.",        group:"Խ-102", level:"B2", status:"active" },
  { id:9,  name:"Սոնա Բ.",        group:"Խ-103", level:"C2", status:"active" },
  { id:10, name:"Տիգրան Ղ.",      group:"Խ-101", level:"B2", status:"active" },
];
const EXAMS_LIST = [
  { id:1, title:"Summer B1 Exam",   level:"B1", maxScore:20, passingScore:70, date:"2024-10-15" },
  { id:2, title:"A2 Entrance Test",   level:"A2", maxScore:10, passingScore:60, date:"2024-11-01" },
  { id:3, title:"C1–C2 Final Exam", level:"C1", maxScore:30, passingScore:80, date:"2024-11-20" },
  { id:4, title:"B2 Vocabulary Test",    level:"B2", maxScore:22, passingScore:75, date:"2024-12-05" },
];
function fakeResult(sId, eId) {
  const seed  = (sId * 31 + eId * 17) % 100;
  const exam  = EXAMS_LIST.find(e=>e.id===eId);
  const score = Math.min(Math.round((seed / 100) * exam.maxScore), exam.maxScore);
  const p     = Math.round((score / exam.maxScore) * 100);
  return { studentId:sId, examId:eId, score, maxScore:exam.maxScore, pct:p, passed:p>=exam.passingScore, date:exam.date };
}
const ALL_RESULTS = STUDENTS.flatMap(s => EXAMS_LIST.slice(0, 2+(s.id%3)).map(e=>fakeResult(s.id,e.id)));
const MONTHLY = [
  { month:"Sep", exams:4,  passed:3  },
  { month:"Oct", exams:7,  passed:5  },
  { month:"Nov", exams:12, passed:8  },
  { month:"Dec", exams:9,  passed:7  },
  { month:"Jan", exams:6,  passed:4  },
  { month:"Feb", exams:8,  passed:6  },
];

const avg  = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
const pct2 = (n,t) => t ? Math.round((n/t)*100) : 0;

function StatCard({ icon, label, value, sub, color=C.gold, trend }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px", display:"flex", flexDirection:"column", gap:8, flex:1, minWidth:160 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        {trend!==undefined && (
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, color:trend>=0?C.success:C.danger, background:trend>=0?C.success+"18":C.danger+"18", border:`1px solid ${trend>=0?C.success+"44":C.danger+"44"}`, borderRadius:6, padding:"2px 8px" }}>
            {trend>=0?"↑":"↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>{label}</div>
      {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#334155" }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data }) {
  const maxV = Math.max(...data.map(d=>Math.max(d.exams,d.passed)));
  const W=500, H=180, PL=32, PR=10, PT=10, PB=38;
  const cW=W-PL-PR, cH=H-PT-PB;
  const bW=(cW/data.length)*0.33;
  return (
    <div>
      <div style={{ display:"flex", gap:16, marginBottom:10 }}>
        {[["Exams Taken",C.info],["Passed",C.success]].map(([l,c])=>(
          <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:c }} />
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{l}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {[0,.25,.5,.75,1].map(r=>{
          const y=PT+cH*(1-r);
          return <g key={r}>
            <line x1={PL} y1={y} x2={W-PR} y2={y} stroke={C.border} strokeWidth={1} strokeDasharray={r===0?"none":"3 3"}/>
            <text x={PL-5} y={y+4} textAnchor="end" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fill:C.muted }}>{Math.round(maxV*r)}</text>
          </g>;
        })}
        {data.map((d,i)=>{
          const sw=cW/data.length, x0=PL+sw*i+sw*0.12;
          const h1=(d.exams/maxV)*cH, h2=(d.passed/maxV)*cH;
          return <g key={i}>
            <rect x={x0}      y={PT+cH-h1} width={bW} height={h1} fill={C.info}    rx={3} opacity={.85}/>
            <rect x={x0+bW+2} y={PT+cH-h2} width={bW} height={h2} fill={C.success} rx={3} opacity={.9}/>
            <text x={x0+bW+1} y={H-8} textAnchor="middle" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fill:C.muted }}>{d.month}</text>
          </g>;
        })}
      </svg>
    </div>
  );
}

function DonutChart({ segments, size=130 }) {
  const total = segments.reduce((a,s)=>a+s.value,0);
  if (!total) return null;
  const R=size/2-12, r=R*.58, cx=size/2, cy=size/2;
  let angle=-Math.PI/2;
  const paths = segments.map(seg=>{
    const sw=(seg.value/total)*2*Math.PI;
    const x1=cx+R*Math.cos(angle), y1=cy+R*Math.sin(angle);
    angle+=sw;
    const x2=cx+R*Math.cos(angle), y2=cy+R*Math.sin(angle);
    const lg=sw>Math.PI?1:0;
    return { ...seg, d:`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} Z`, pct:Math.round((seg.value/total)*100) };
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        {paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={.9} stroke={C.bg} strokeWidth={2}/>)}
        <circle cx={cx} cy={cy} r={r} fill={C.card}/>
        <text x={cx} y={cy-5} textAnchor="middle" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fill:C.gold, fontWeight:700 }}>{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fill:C.muted }}>total</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {paths.map((p,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:p.color, flexShrink:0 }}/>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text }}>{p.label}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:p.color, fontWeight:700, marginLeft:8 }}>
              {p.value} <span style={{ fontSize:11, color:C.muted }}>({p.pct}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreDist({ results }) {
  const buckets=[
    { label:"90–100%", min:90, max:100, color:"#22c55e" },
    { label:"75–89%",  min:75, max:89,  color:"#86efac" },
    { label:"60–74%",  min:60, max:74,  color:"#f59e0b" },
    { label:"40–59%",  min:40, max:59,  color:"#f97316" },
    { label:"0–39%",   min:0,  max:39,  color:"#f87171" },
  ];
  const maxN=Math.max(...buckets.map(b=>results.filter(r=>r.pct>=b.min&&r.pct<=b.max).length),1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {buckets.map(b=>{
        const n=results.filter(r=>r.pct>=b.min&&r.pct<=b.max).length;
        return (
          <div key={b.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, width:60, flexShrink:0 }}>{b.label}</span>
            <div style={{ flex:1, height:18, background:C.dim, borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:`${(n/maxN)*100}%`, height:"100%", background:b.color, borderRadius:4, transition:"width .4s" }}/>
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:b.color, fontWeight:700, width:24, textAlign:"right" }}>{n}</span>
          </div>
        );
      })}
    </div>
  );
}

function LevelDist({ students }) {
  const total=students.length;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
      {LEVELS.map(l=>{
        const n=students.filter(s=>s.level===l).length;
        const w=pct2(n,total);
        return (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:LC[l], width:28 }}>{l}</span>
            <div style={{ flex:1, height:20, background:C.dim, borderRadius:5, overflow:"hidden" }}>
              <div style={{ width:`${w}%`, height:"100%", background:LC[l]+"88", borderRadius:5, display:"flex", alignItems:"center", paddingLeft:8 }}>
                {w>=15 && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.bg, fontWeight:700 }}>{n}</span>}
              </div>
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:LC[l], fontWeight:700, width:24, textAlign:"right" }}>{n}</span>
          </div>
        );
      })}
    </div>
  );
}

function TopStudentsTable({ students, results }) {
  const rows = students.map(s=>{
    const rs=results.filter(r=>r.studentId===s.id);
    return { ...s, examCount:rs.length, avgPct:avg(rs.map(r=>r.pct)), passRate:pct2(rs.filter(r=>r.passed).length, rs.length) };
  }).sort((a,b)=>b.avgPct-a.avgPct).slice(0,8);
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"18px 22px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, fontWeight:600 }}>Top Students</span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>ranked by avg score</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"32px 1fr 60px 60px 100px 110px", gap:12, padding:"10px 22px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        {["#","Student","Level","Exams","Pass Rate","Avg Score"].map(h=>(
          <span key={h} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, fontWeight:700, letterSpacing:.6, textTransform:"uppercase" }}>{h}</span>
        ))}
      </div>
      {rows.map((s,i)=>{
        const lc=LC[s.level]||"#94a3b8";
        const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
        return (
          <div key={s.id} style={{ display:"grid", gridTemplateColumns:"32px 1fr 60px 60px 100px 110px", gap:12, padding:"12px 22px", borderBottom:`1px solid ${C.border}`, alignItems:"center", transition:"background .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.panel}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted }}>{medal||`${i+1}`}</span>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:`${lc}22`, border:`1px solid ${lc}44`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:lc, fontWeight:700, flexShrink:0 }}>{s.name[0]}</div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, fontWeight:500 }}>{s.name}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{s.group}</div>
              </div>
            </div>
            <span style={{ background:`${lc}18`, color:lc, border:`1px solid ${lc}33`, borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", textAlign:"center" }}>{s.level}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, textAlign:"center" }}>{s.examCount}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ flex:1, height:4, background:C.dim, borderRadius:2 }}>
                <div style={{ width:`${s.passRate}%`, height:"100%", background:s.passRate>=75?C.success:s.passRate>=50?C.warning:C.danger, borderRadius:2 }}/>
              </div>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, width:32, textAlign:"right" }}>{s.passRate}%</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:6, background:C.dim, borderRadius:3 }}>
                <div style={{ width:`${Math.min(s.avgPct,100)}%`, height:"100%", background:`linear-gradient(90deg,${C.gold},${C.goldDim})`, borderRadius:3 }}/>
              </div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:C.gold, fontWeight:700, width:38, textAlign:"right" }}>{s.avgPct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExamPerfTable({ exams, results }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"18px 22px", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, fontWeight:600 }}>Exam Performance</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 60px 60px 1fr 80px", gap:12, padding:"10px 22px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        {["Exam","Level","Taken","Passed","Pass Rate","Avg"].map(h=>(
          <span key={h} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, fontWeight:700, letterSpacing:.6, textTransform:"uppercase" }}>{h}</span>
        ))}
      </div>
      {exams.map(exam=>{
        const rs=results.filter(r=>r.examId===exam.id);
        const taken=rs.length, passed=rs.filter(r=>r.passed).length;
        const passR=pct2(passed,taken), avgSc=avg(rs.map(r=>r.pct));
        const lc=LC[exam.level]||"#94a3b8";
        return (
          <div key={exam.id} style={{ display:"grid", gridTemplateColumns:"1fr 60px 60px 60px 1fr 80px", gap:12, padding:"14px 22px", borderBottom:`1px solid ${C.border}`, alignItems:"center", transition:"background .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.panel}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, fontWeight:500 }}>{exam.title}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, marginTop:2 }}>{exam.date}</div>
            </div>
            <span style={{ background:`${lc}18`, color:lc, border:`1px solid ${lc}33`, borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", textAlign:"center" }}>{exam.level}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.text, textAlign:"center" }}>{taken}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.success, textAlign:"center" }}>{passed}</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:6, background:C.dim, borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${Math.min(passR,100)}%`, height:"100%", background:passR>=75?C.success:passR>=50?C.warning:C.danger, borderRadius:3 }}/>
              </div>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:passR>=75?C.success:passR>=50?C.warning:C.danger, minWidth:36, textAlign:"right", flexShrink:0 }}>{passR}%</span>
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.gold, fontWeight:700, textAlign:"center" }}>{Math.min(avgSc,100)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics({ theme }) {
  if (theme) C = theme;
  const [period, setPeriod] = useState("all");

  const results = useMemo(()=>{
    if (period==="all") return ALL_RESULTS;
    const cutoff = period==="month" ? "2024-11-20" : "2024-11-01";
    return ALL_RESULTS.filter(r=>r.date>=cutoff);
  }, [period]);

  const totalStudents  = STUDENTS.length;
  const activeStudents = STUDENTS.filter(s=>s.status==="active").length;
  const totalTaken     = results.length;
  const totalPassed    = results.filter(r=>r.passed).length;
  const avgScore       = avg(results.map(r=>r.pct));
  const passRate       = pct2(totalPassed, totalTaken);

  return (
    <>
      <style>{FONTS}{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
      `}</style>
      <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", boxSizing:"border-box", animation:"fadeSlideIn .35s ease" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:16 }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:C.text, margin:"0 0 4px", fontWeight:600 }}>Analytics</h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, margin:0 }}>Platform performance overview</p>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[["all","All Time"],["quarter","Last Quarter"],["month","Last Month"]].map(([v,l])=>(
              <button key={v} onClick={()=>setPeriod(v)} style={{ background:period===v?C.gold+"22":"transparent", border:`1px solid ${period===v?C.gold:C.border2}`, borderRadius:9, padding:"8px 16px", color:period===v?C.gold:C.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all .15s" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
          <StatCard icon="👤" label="Total Students"  value={totalStudents}  sub={`${activeStudents} active`}          color={C.info}    trend={8}  />
          <StatCard icon="📝" label="Exams Taken"     value={totalTaken}    sub={`across ${EXAMS_LIST.length} exams`}  color={C.purple}  trend={12} />
          <StatCard icon="✅" label="Pass Rate"       value={`${passRate}%`} sub={`${totalPassed} passed`}             color={C.success} trend={3}  />
          <StatCard icon="⭐" label="Avg Score"       value={`${avgScore}%`} sub="across all exams"                    color={C.gold}    trend={-2} />
        </div>

        {/* Charts row */}
        <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:20, marginBottom:20 }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, fontWeight:600, marginBottom:16 }}>Monthly Activity</div>
            <BarChart data={MONTHLY}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 24px" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:C.text, fontWeight:600, marginBottom:14 }}>Pass / Fail</div>
              <DonutChart segments={[
                { label:"Passed", value:totalPassed,              color:C.success },
                { label:"Failed", value:totalTaken-totalPassed,   color:C.danger  },
              ]}/>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 24px" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:C.text, fontWeight:600, marginBottom:14 }}>Groups</div>
              <DonutChart segments={["Խ-101","Խ-102","Խ-103"].map((g,i)=>({
                label:g, value:STUDENTS.filter(s=>s.group===g).length,
                color:[C.info,C.purple,C.warning][i],
              }))}/>
            </div>
          </div>
        </div>

        {/* Score dist + Level dist */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, fontWeight:600, marginBottom:16 }}>Score Distribution</div>
            <ScoreDist results={results}/>
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, fontWeight:600, marginBottom:16 }}>Student Levels</div>
            <LevelDist students={STUDENTS}/>
          </div>
        </div>

        {/* Tables */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <ExamPerfTable exams={EXAMS_LIST} results={results}/>
          <TopStudentsTable students={STUDENTS} results={results}/>
        </div>

      </div>
    </>
  );
}
