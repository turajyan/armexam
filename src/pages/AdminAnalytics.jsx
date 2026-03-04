import { useState } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const C = {
  bg:"#04080f", panel:"#080f1a", card:"#0d1829", border:"#1a2540",
  border2:"#243050", gold:"#c8a96e", goldDim:"#7c5830",
  text:"#e2e8f0", muted:"#475569", dim:"#1e293b",
  success:"#22c55e", danger:"#f87171", warning:"#f59e0b",
  info:"#60a5fa", purple:"#a78bfa",
};

const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const LEVEL_COLORS = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED_RESULTS = [
  { id:1,  studentId:1, studentName:"Անի Հակոբյան",   examId:1, examTitle:"Armenian A2 Test",     score:78, maxScore:100, passed:true,  date:"2025-03-01", level:"A2", duration:32 },
  { id:2,  studentId:2, studentName:"Հայկ Պետրոսյան", examId:1, examTitle:"Armenian A2 Test",     score:45, maxScore:100, passed:false, date:"2025-03-01", level:"A2", duration:41 },
  { id:3,  studentId:3, studentName:"Մարիա Սարգսյան",  examId:2, examTitle:"Grammar B1 Quiz",      score:90, maxScore:100, passed:true,  date:"2025-03-02", level:"B1", duration:28 },
  { id:4,  studentId:1, studentName:"Անի Հակոբյան",   examId:2, examTitle:"Grammar B1 Quiz",      score:82, maxScore:100, passed:true,  date:"2025-03-03", level:"B1", duration:30 },
  { id:5,  studentId:4, studentName:"Արամ Ղազարյան",  examId:3, examTitle:"Reading Comp C1",      score:67, maxScore:100, passed:true,  date:"2025-03-04", level:"C1", duration:55 },
  { id:6,  studentId:5, studentName:"Նարե Մկրտչյան",  examId:1, examTitle:"Armenian A2 Test",     score:55, maxScore:100, passed:true,  date:"2025-03-04", level:"A2", duration:38 },
  { id:7,  studentId:2, studentName:"Հայկ Պետրոսյան", examId:3, examTitle:"Reading Comp C1",      score:30, maxScore:100, passed:false, date:"2025-03-05", level:"C1", duration:60 },
  { id:8,  studentId:6, studentName:"Սոֆյա Դավթյան",  examId:2, examTitle:"Grammar B1 Quiz",      score:95, maxScore:100, passed:true,  date:"2025-03-05", level:"B1", duration:22 },
  { id:9,  studentId:3, studentName:"Մարիա Սարգսյան",  examId:4, examTitle:"Vocabulary B2 Pack",   score:73, maxScore:100, passed:true,  date:"2025-03-06", level:"B2", duration:44 },
  { id:10, studentId:7, studentName:"Տիգրան Ավետիսյան",examId:1, examTitle:"Armenian A2 Test",    score:88, maxScore:100, passed:true,  date:"2025-03-06", level:"A2", duration:29 },
  { id:11, studentId:4, studentName:"Արամ Ղազարյան",  examId:4, examTitle:"Vocabulary B2 Pack",   score:61, maxScore:100, passed:true,  date:"2025-03-07", level:"B2", duration:50 },
  { id:12, studentId:8, studentName:"Լուսինե Գրիգ.",  examId:2, examTitle:"Grammar B1 Quiz",      score:40, maxScore:100, passed:false, date:"2025-03-07", level:"B1", duration:45 },
  { id:13, studentId:5, studentName:"Նարե Մկրտչյան",  examId:4, examTitle:"Vocabulary B2 Pack",   score:77, maxScore:100, passed:true,  date:"2025-03-08", level:"B2", duration:47 },
  { id:14, studentId:9, studentName:"Կարեն Ստեփ.",    examId:3, examTitle:"Reading Comp C1",      score:52, maxScore:100, passed:true,  date:"2025-03-08", level:"C1", duration:58 },
  { id:15, studentId:6, studentName:"Սոֆյա Դավթյան",  examId:5, examTitle:"Speaking B2 Test",     score:84, maxScore:100, passed:true,  date:"2025-03-09", level:"B2", duration:20 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
const pct = (a,b) => b ? Math.round(a/b*100) : 0;

function StatCard({ icon, label, value, sub, color=C.gold, trend }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px", flex:1, minWidth:160 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:24 }}>{icon}</div>
        {trend !== undefined && (
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
            color: trend >= 0 ? C.success : C.danger,
            background: (trend >= 0 ? C.success : C.danger)+"18",
            borderRadius:6, padding:"2px 7px" }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginTop:6 }}>{label}</div>
      {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted+"aa", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// Mini bar chart
function BarChart({ data, color=C.gold, height=80 }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ width:"100%", background: color+"22", borderRadius:"4px 4px 0 0", overflow:"hidden", height: height - 20 }}>
            <div style={{
              width:"100%",
              height:`${(d.value/max)*100}%`,
              background:`linear-gradient(to top, ${color}88, ${color})`,
              borderRadius:"4px 4px 0 0",
              marginTop:"auto",
              transition:"height .5s cubic-bezier(.4,0,.2,1)",
            }} />
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, whiteSpace:"nowrap" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// Donut chart (CSS conic-gradient)
function DonutChart({ value, total, color=C.gold, size=100, label }) {
  const p = pct(value, total);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <div style={{
        width:size, height:size, borderRadius:"50%",
        background:`conic-gradient(${color} ${p*3.6}deg, ${C.dim} 0deg)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative",
      }}>
        <div style={{ width:size*0.68, height:size*0.68, borderRadius:"50%", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:size*0.2, fontWeight:700, color, lineHeight:1 }}>{p}%</div>
        </div>
      </div>
      {label && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{label}</div>}
    </div>
  );
}

// Score distribution sparkline
function ScoreSparkline({ scores, width=200, height=50 }) {
  if (!scores.length) return null;
  // bucket into 10 ranges: 0-9, 10-19, ... 90-100
  const buckets = Array(10).fill(0);
  scores.forEach(s => { buckets[Math.min(Math.floor(s/10), 9)]++; });
  const max = Math.max(...buckets, 1);
  return (
    <svg width={width} height={height} style={{ overflow:"visible" }}>
      {buckets.map((b, i) => {
        const bw = (width-18)/10;
        const bh = (b/max) * (height-8);
        const x = i*(bw+2);
        const y = height - bh - 4;
        const hue = i < 4 ? C.danger : i < 6 ? C.warning : C.success;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx={2} fill={hue} opacity={0.8} />
            <text x={x+bw/2} y={height} textAnchor="middle" fontSize={8} fill={C.muted} fontFamily="DM Sans">
              {i*10}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Results Table ─────────────────────────────────────────────────────────────
function ResultsTable({ results }) {
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState(-1);

  const sorted = [...results].sort((a,b) => {
    if (sort === "score") return dir * (a.score - b.score);
    if (sort === "date")  return dir * (a.date > b.date ? 1 : -1);
    if (sort === "name")  return dir * a.studentName.localeCompare(b.studentName);
    return 0;
  });

  const toggle = (col) => { if (sort===col) setDir(d=>-d); else { setSort(col); setDir(-1); }; };
  const SortBtn = ({col, label}) => (
    <span onClick={()=>toggle(col)} style={{ cursor:"pointer", userSelect:"none",
      color: sort===col ? C.gold : C.muted,
      display:"inline-flex", alignItems:"center", gap:3 }}>
      {label} {sort===col ? (dir===-1?"↓":"↑") : ""}
    </span>
  );

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      {/* Head */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 80px 80px 70px 80px", gap:14, padding:"11px 20px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        {[["name","Student"], ["examTitle","Exam"], [null,"Level"], ["score","Score"], ["duration","Min"], ["date","Date"]].map(([col,label],i) => (
          <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, fontWeight:600, letterSpacing:.8, textTransform:"uppercase" }}>
            {col ? <SortBtn col={col} label={label} /> : label}
          </span>
        ))}
      </div>
      {sorted.map(r => (
        <div key={r.id} style={{ display:"grid", gridTemplateColumns:"2fr 2fr 80px 80px 70px 80px", gap:14, padding:"13px 20px", borderBottom:`1px solid ${C.border}`, transition:"background .15s" }}
          onMouseEnter={e=>e.currentTarget.style.background=C.panel}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text }}>{r.studentName}</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted }}>{r.examTitle}</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700,
            color: LEVEL_COLORS[r.level]||"#94a3b8",
            background: (LEVEL_COLORS[r.level]||"#94a3b8")+"18",
            border:`1px solid ${(LEVEL_COLORS[r.level]||"#94a3b8")}33`,
            borderRadius:6, padding:"2px 8px", textAlign:"center" }}>{r.level}</span>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ flex:1, height:4, background:C.dim, borderRadius:2, overflow:"hidden" }}>
              <div style={{ width:`${r.score}%`, height:"100%", borderRadius:2,
                background: r.score>=60 ? C.success : r.score>=40 ? C.warning : C.danger,
                transition:"width .4s" }} />
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:700,
              color: r.score>=60 ? C.success : r.score>=40 ? C.warning : C.danger, minWidth:36, textAlign:"right" }}>
              {r.score}
            </span>
          </div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, textAlign:"center" }}>{r.duration}′</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{r.date}</span>
        </div>
      ))}
      {sorted.length === 0 && (
        <div style={{ padding:48, textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.muted }}>
          No results found
        </div>
      )}
    </div>
  );
}

// ── Main Analytics Page ───────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [results] = useState(SEED_RESULTS);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterPassed, setFilterPassed] = useState("all");
  const [tab, setTab] = useState("overview"); // overview | results | students | exams

  const filtered = results.filter(r => {
    if (filterLevel !== "all" && r.level !== filterLevel) return false;
    if (filterPassed === "passed" && !r.passed) return false;
    if (filterPassed === "failed" && r.passed) return false;
    return true;
  });

  // Aggregates
  const totalExams   = filtered.length;
  const passCount    = filtered.filter(r=>r.passed).length;
  const passRate     = pct(passCount, totalExams);
  const avgScore     = avg(filtered.map(r=>r.score));
  const avgDuration  = avg(filtered.map(r=>r.duration));
  const uniqueStudents = new Set(filtered.map(r=>r.studentId)).size;

  // By level
  const byLevel = LEVELS.map(l => ({
    label: l,
    value: filtered.filter(r=>r.level===l).length,
    avg: avg(filtered.filter(r=>r.level===l).map(r=>r.score)),
    pass: pct(filtered.filter(r=>r.level===l&&r.passed).length, filtered.filter(r=>r.level===l).length),
  }));

  // By exam
  const exams = [...new Set(filtered.map(r=>r.examTitle))];
  const byExam = exams.map(e => ({
    label: e.length > 16 ? e.slice(0,14)+"…" : e,
    full: e,
    value: filtered.filter(r=>r.examTitle===e).length,
    avg: avg(filtered.filter(r=>r.examTitle===e).map(r=>r.score)),
    pass: pct(filtered.filter(r=>r.examTitle===e&&r.passed).length, filtered.filter(r=>r.examTitle===e).length),
  }));

  // Top / bottom students
  const studentMap = {};
  filtered.forEach(r => {
    if (!studentMap[r.studentId]) studentMap[r.studentId] = { name:r.studentName, scores:[], count:0 };
    studentMap[r.studentId].scores.push(r.score);
    studentMap[r.studentId].count++;
  });
  const studentStats = Object.values(studentMap).map(s => ({ ...s, avg: avg(s.scores) }))
    .sort((a,b) => b.avg - a.avg);

  const TAB_BTN = (id, label) => (
    <button key={id} onClick={()=>setTab(id)} style={{
      background: tab===id ? C.gold+"22" : "transparent",
      border: `1px solid ${tab===id ? C.gold+"55" : C.border}`,
      borderRadius:10, padding:"8px 18px",
      color: tab===id ? C.gold : C.muted,
      fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight: tab===id ? 600 : 400,
      cursor:"pointer", transition:"all .15s",
    }}>{label}</button>
  );

  return (
    <>
      <style>{FONTS}{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#243050;border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
      `}</style>
      <div style={{ flex:1, overflowY:"auto", padding:"32px 40px", minWidth:0, width:"100%", animation:"fadeSlideIn .3s ease" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:C.text, margin:"0 0 4px", fontWeight:600 }}>Analytics</h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, margin:0 }}>Exam results & performance overview</p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Level filter */}
            <div style={{ display:"flex", gap:5 }}>
              {["all",...LEVELS].map(l => (
                <button key={l} onClick={()=>setFilterLevel(l)} style={{
                  background: filterLevel===l ? (LEVEL_COLORS[l]||C.gold)+"22" : "transparent",
                  border:`1px solid ${filterLevel===l ? (LEVEL_COLORS[l]||C.gold) : C.border}`,
                  borderRadius:8, padding:"5px 10px",
                  color: filterLevel===l ? (LEVEL_COLORS[l]||C.gold) : C.muted,
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                  cursor:"pointer", transition:"all .15s",
                }}>{l==="all"?"All":l}</button>
              ))}
            </div>
            {/* Pass filter */}
            <div style={{ display:"flex", gap:5 }}>
              {[["all","All"],["passed","Passed"],["failed","Failed"]].map(([v,l]) => (
                <button key={v} onClick={()=>setFilterPassed(v)} style={{
                  background: filterPassed===v ? (v==="passed"?C.success:v==="failed"?C.danger:C.gold)+"22" : "transparent",
                  border:`1px solid ${filterPassed===v ? (v==="passed"?C.success:v==="failed"?C.danger:C.gold) : C.border}`,
                  borderRadius:8, padding:"5px 10px",
                  color: filterPassed===v ? (v==="passed"?C.success:v==="failed"?C.danger:C.gold) : C.muted,
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                  cursor:"pointer", transition:"all .15s",
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap" }}>
          <StatCard icon="📝" label="Total Attempts" value={totalExams} sub={`${uniqueStudents} students`} color={C.gold} trend={12} />
          <StatCard icon="✅" label="Pass Rate" value={passRate+"%"} sub={`${passCount} passed`} color={C.success} trend={5} />
          <StatCard icon="📊" label="Avg Score" value={avgScore} sub="out of 100" color={C.info} trend={-2} />
          <StatCard icon="⏱" label="Avg Duration" value={avgDuration+"′"} sub="minutes" color={C.purple} />
          <StatCard icon="👤" label="Active Students" value={uniqueStudents} color={C.warning} trend={8} />
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          {[["overview","📈 Overview"],["results","📋 All Results"],["students","👤 Students"],["exams","🎓 By Exam"]].map(([id,l])=>TAB_BTN(id,l))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Score distribution + pass donut */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>

              {/* Score distribution */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:16 }}>Score Distribution</div>
                <ScoreSparkline scores={filtered.map(r=>r.score)} width={220} height={70} />
              </div>

              {/* Pass/Fail donut */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.8, textTransform:"uppercase", alignSelf:"flex-start" }}>Pass / Fail</div>
                <DonutChart value={passCount} total={totalExams} color={C.success} size={110} />
                <div style={{ display:"flex", gap:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:C.success }} />
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>Passed {passCount}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:C.danger }} />
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>Failed {totalExams-passCount}</span>
                  </div>
                </div>
              </div>

              {/* Avg score by level */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:16 }}>Avg Score by Level</div>
                <BarChart data={byLevel.map(l=>({ label:l.label, value:l.avg }))} height={90} />
              </div>
            </div>

            {/* By level table */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:16 }}>Performance by Level</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
                {byLevel.map(l => (
                  <div key={l.label} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px", textAlign:"center" }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:LEVEL_COLORS[l.label]||"#94a3b8", marginBottom:8 }}>{l.label}</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:C.text, lineHeight:1 }}>{l.avg||"—"}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, marginTop:3 }}>avg score</div>
                    <div style={{ marginTop:8, height:3, background:C.dim, borderRadius:2, overflow:"hidden" }}>
                      <div style={{ width:`${l.pass}%`, height:"100%", background: l.pass>=60?C.success:l.pass>=40?C.warning:C.danger, borderRadius:2 }} />
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, marginTop:3 }}>{l.pass}% pass · {l.value} attempts</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top students */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:16 }}>Top Performers</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {studentStats.slice(0,5).map((s,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg, ${i===0?C.gold:i===1?"#94a3b8":i===2?"#cd7f32":C.dim}, ${C.dim})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:"white", flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text }}>{s.name}</div>
                        <div style={{ height:4, background:C.dim, borderRadius:2, overflow:"hidden", marginTop:4 }}>
                          <div style={{ width:`${s.avg}%`, height:"100%", background:i===0?C.gold:C.success, borderRadius:2, transition:"width .5s" }} />
                        </div>
                      </div>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:i===0?C.gold:C.text, minWidth:36, textAlign:"right" }}>{s.avg}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:16 }}>By Exam</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {byExam.map((e,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text }}>{e.label}</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{e.value} attempts · {e.pass}% pass</span>
                        </div>
                        <div style={{ height:4, background:C.dim, borderRadius:2, overflow:"hidden" }}>
                          <div style={{ width:`${e.avg}%`, height:"100%", background:e.avg>=60?C.success:C.warning, borderRadius:2 }} />
                        </div>
                      </div>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.info, minWidth:36, textAlign:"right" }}>{e.avg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS TAB ── */}
        {tab === "results" && (
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, marginBottom:12, textAlign:"right" }}>{filtered.length} results</div>
            <ResultsTable results={filtered} />
          </div>
        )}

        {/* ── STUDENTS TAB ── */}
        {tab === "students" && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:16 }}>Student Performance Summary</div>
            <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 80px 80px 80px 80px", gap:14, padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:C.panel, borderRadius:"8px 8px 0 0" }}>
              {["#","Student","Attempts","Avg Score","Highest","Pass Rate"].map((h,i) => (
                <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, fontWeight:600, letterSpacing:.8, textTransform:"uppercase" }}>{h}</span>
              ))}
            </div>
            {studentStats.map((s,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"40px 1fr 80px 80px 80px 80px", gap:14, padding:"14px 16px", borderBottom:`1px solid ${C.border}`, transition:"background .15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.panel}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>{i+1}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, fontWeight:500 }}>{s.name}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted, textAlign:"center" }}>{s.count}</span>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700, color: s.avg>=60?C.success:C.danger, textAlign:"center" }}>{s.avg}</span>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700, color:C.gold, textAlign:"center" }}>{Math.max(...s.scores)}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted, textAlign:"center" }}>
                  {pct(s.scores.filter(x=>x>=60).length, s.scores.length)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── EXAMS TAB ── */}
        {tab === "exams" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:16 }}>
            {byExam.map((e,i) => {
              const examResults = filtered.filter(r=>r.examTitle===e.full);
              return (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px" }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:C.text, fontWeight:600, marginBottom:16, lineHeight:1.3 }}>{e.full}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                    {[["Attempts", e.value],["Avg Score", e.avg],["Pass Rate", e.pass+"%"],["Avg Time", avg(examResults.map(r=>r.duration))+"′"]].map(([l,v])=>(
                      <div key={l} style={{ background:C.panel, borderRadius:10, padding:"10px 14px" }}>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, marginBottom:3 }}>{l}</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:C.gold }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height:4, background:C.dim, borderRadius:2, overflow:"hidden" }}>
                    <div style={{ width:`${e.avg}%`, height:"100%", background:e.avg>=60?C.success:C.warning, borderRadius:2 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>avg {e.avg}/100</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:e.pass>=60?C.success:C.danger }}>{e.pass}% pass rate</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
