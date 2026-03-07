import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api.js";

let C = { bg:"#04080f",panel:"#080f1a",card:"#0d1829",border:"#1a2540",border2:"#243050",gold:"#c8a96e",goldDim:"#7c5830",text:"#e2e8f0",muted:"#475569",dim:"#1e293b",success:"#22c55e",danger:"#f87171",warning:"#f59e0b",info:"#60a5fa",purple:"#a78bfa",scrollThumb:"#243050",sidebarBg:"#080f1a",topbarBg:"#080f1acc" };

const LC = { A1:"#4ade80", A2:"#86efac", B1:"#60a5fa", B2:"#93c5fd", C1:"#f59e0b", C2:"#fbbf24" };
const LEVELS = ["A1","A2","B1","B2","C1","C2"];

const avg  = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
const pct2 = (n,t) => t ? Math.round((n/t)*100) : 0;

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px", display:"flex", flexDirection:"column", gap:6, flex:1, minWidth:140 }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, color: color||C.gold, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text, fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.muted }}>{sub}</div>}
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, size=120, label="" }) {
  const total = segments.reduce((a,s)=>a+s.value,0);
  if (!total) return <div style={{ color:C.muted, fontSize:12, textAlign:"center", padding:"20px 0" }}>{t("adm.a.no_data")}</div>;
  const R=size/2-10, r=R*.54, cx=size/2, cy=size/2;
  let angle=-Math.PI/2;
  const paths = segments.map(seg => {
    const sw=(seg.value/total)*2*Math.PI;
    const x1=cx+R*Math.cos(angle), y1=cy+R*Math.sin(angle);
    angle+=sw;
    const x2=cx+R*Math.cos(angle), y2=cy+R*Math.sin(angle);
    return { ...seg, d:`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${sw>Math.PI?1:0} 1 ${x2} ${y2} Z`, pct:Math.round((seg.value/total)*100) };
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        {paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={.9} stroke={C.bg} strokeWidth={2}/>)}
        <circle cx={cx} cy={cy} r={r} fill={C.card}/>
        <text x={cx} y={cy-4} textAnchor="middle" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fill:C.gold, fontWeight:700 }}>{total}</text>
        {label && <text x={cx} y={cy+12} textAnchor="middle" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:8, fill:C.muted }}>{label}</text>}
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
        {paths.map((p,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:9, height:9, borderRadius:3, background:p.color, flexShrink:0 }}/>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text, flex:1 }}>{p.label}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:p.color, fontWeight:700 }}>{p.value}</span>
            <span style={{ color:C.muted, fontSize:10, width:30, textAlign:"right" }}>{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart (simple horizontal) ────────────────────────────────────────────
function HBar({ label, value, max, color, total }) {
  const w = max ? Math.round((value / max) * 100) : 0;
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.text, width:100, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:18, background:C.dim, borderRadius:4, overflow:"hidden" }}>
        <div style={{ width:`${w}%`, height:"100%", background:color, borderRadius:4, display:"flex", alignItems:"center", paddingLeft:8, transition:"width .4s" }}>
          {w >= 20 && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#000a", fontWeight:700 }}>{value}</span>}
        </div>
      </div>
      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color, fontWeight:700, width:28, textAlign:"right" }}>{value}</span>
      {total > 0 && <span style={{ color:C.muted, fontSize:10, width:30 }}>{pct}%</span>}
    </div>
  );
}

// ── City / Center Table ───────────────────────────────────────────────────────
function CityStatsTable({ cities }) {
  const [expanded, setExpanded] = useState({});
  if (!cities || cities.length === 0) return <div style={{ color:C.muted, fontSize:13, padding:"20px 0", textAlign:"center" }}>{t("adm.a.no_data")}</div>;
  return (
    <div>
      {cities.map(city => (
        <div key={city.id} style={{ marginBottom:8 }}>
          <div
            onClick={() => setExpanded(e => ({ ...e, [city.id]: !e[city.id] }))}
            style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:C.panel, borderRadius:10, cursor:"pointer", border:`1px solid ${C.border}` }}>
            <span style={{ color:C.gold, fontSize:14 }}>{expanded[city.id] ? "▼" : "▶"}</span>
            <span style={{ color:C.text, fontWeight:600, fontSize:14, flex:1 }}>🏙 {city.name}</span>
            <Chip label={t("adm.a.chip.students", { n: city.totalStudents })} color={C.info} />
            <Chip label={t("adm.a.chip.exams", { n: city.totalExams })} color={C.purple} />
            <Chip label={t("adm.a.chip.results", { n: city.totalResults })} color={C.muted} />
            <Chip label={t("adm.a.chip.passed", { n: city.passRate })} color={city.passRate >= 60 ? C.success : C.danger} />
          </div>
          {expanded[city.id] && city.centers.map(ctr => (
            <div key={ctr.id} style={{ marginLeft:24, marginTop:4, padding:"10px 16px", background:C.card, borderRadius:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ color:C.muted, fontSize:13 }}>└</span>
              <div style={{ flex:1 }}>
                <div style={{ color:C.text, fontSize:13, fontWeight:500 }}>{ctr.name}</div>
                {ctr.address && <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>📍 {ctr.address}</div>}
              </div>
              <Chip label={t("adm.a.chip.students", { n: ctr.totalStudents })} color={C.info} />
              <Chip label={t("adm.a.chip.exams", { n: ctr.totalExams })} color={C.purple} />
              <Chip label={t("adm.a.chip.passed", { n: ctr.passRate })} color={ctr.passRate >= 60 ? C.success : C.danger} />
              <Chip label={`avg ${ctr.avgScore}%`} color={C.gold} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Chip({ label, color }) {
  return <span style={{ background:color+"18", color, border:`1px solid ${color}33`, borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:500, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>{label}</span>;
}

// ── Exam Perf Table ───────────────────────────────────────────────────────────
function ExamPerfTable({ exams, results }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, fontWeight:600 }}>Exam Performance</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 60px 60px 1fr 80px", gap:12, padding:"10px 22px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        {["Exam","Level","Taken","Passed","Pass Rate","Avg"].map(h=>(
          <span key={h} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, fontWeight:700, letterSpacing:.6, textTransform:"uppercase" }}>{h}</span>
        ))}
      </div>
      {exams.length === 0 && <div style={{ padding:"20px 22px", color:C.muted, fontSize:13 }}>{t("adm.a.no_exams")}</div>}
      {exams.map(exam=>{
        const rs=results.filter(r=>r.examId===exam.id);
        const taken=rs.length, passed=rs.filter(r=>r.passed).length;
        const passR=pct2(passed,taken), avgSc=avg(rs.map(r=>r.pct));
        const lc=LC[exam.level]||"#94a3b8";
        return (
          <div key={exam.id} style={{ display:"grid", gridTemplateColumns:"1fr 60px 60px 60px 1fr 80px", gap:12, padding:"12px 22px", borderBottom:`1px solid ${C.border}`, alignItems:"center" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text, fontWeight:500 }}>{exam.title}</div>
            <span style={{ background:`${lc}18`, color:lc, border:`1px solid ${lc}33`, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", textAlign:"center" }}>{exam.level || "Place."}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.text, textAlign:"center" }}>{taken}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.success, textAlign:"center" }}>{passed}</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:6, background:C.dim, borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${Math.min(passR,100)}%`, height:"100%", background:passR>=75?C.success:passR>=50?C.warning:C.danger, borderRadius:3 }}/>
              </div>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:passR>=75?C.success:passR>=50?C.warning:C.danger, minWidth:36, textAlign:"right" }}>{passR}%</span>
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.gold, fontWeight:700, textAlign:"center" }}>{avgSc}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Top Students Table ────────────────────────────────────────────────────────
function TopStudentsTable({ students, results }) {
  const rows = students.map(s => {
    const rs = results.filter(r => r.studentId === s.id);
    return { ...s, examCount:rs.length, avgPct:avg(rs.map(r=>r.pct)), passRate:pct2(rs.filter(r=>r.passed).length, rs.length) };
  }).sort((a,b) => b.avgPct - a.avgPct).slice(0, 8);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.text, fontWeight:600 }}>Top Students</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"30px 1fr 60px 50px 50px 80px 100px", gap:12, padding:"10px 22px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
        {["#","Student","Level",t("adm.a.col.gender"),"Exams","Pass","Avg"].map(h=>(
          <span key={h} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:C.muted, fontWeight:700, letterSpacing:.6, textTransform:"uppercase" }}>{h}</span>
        ))}
      </div>
      {rows.length === 0 && <div style={{ padding:"20px 22px", color:C.muted, fontSize:13 }}>{t("adm.a.no_students")}</div>}
      {rows.map((s,i)=>{
        const lc = LC[s.level]||"#94a3b8";
        const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
        const gIcon = s.gender === "female" ? "♀" : s.gender === "male" ? "♂" : "—";
        return (
          <div key={s.id} style={{ display:"grid", gridTemplateColumns:"30px 1fr 60px 50px 50px 80px 100px", gap:12, padding:"11px 22px", borderBottom:`1px solid ${C.border}`, alignItems:"center" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.muted }}>{medal||`${i+1}`}</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:`${lc}22`, border:`1px solid ${lc}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:lc, fontWeight:700, flexShrink:0 }}>{s.name[0]}</div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.text }}>{s.name}</div>
                <div style={{ fontSize:10, color:C.muted }}>{s.country}</div>
              </div>
            </div>
            <span style={{ background:`${lc}18`, color:lc, border:`1px solid ${lc}33`, borderRadius:6, padding:"2px 7px", fontSize:11, fontWeight:700, textAlign:"center" }}>{s.level||"—"}</span>
            <span style={{ color:s.gender==="female"?"#f472b6":s.gender==="male"?C.info:C.muted, fontSize:14, textAlign:"center" }}>{gIcon}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:C.text, textAlign:"center" }}>{s.examCount}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:s.passRate>=75?C.success:s.passRate>=50?C.warning:C.danger, textAlign:"center" }}>{s.passRate}%</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ flex:1, height:5, background:C.dim, borderRadius:3 }}>
                <div style={{ width:`${Math.min(s.avgPct,100)}%`, height:"100%", background:`linear-gradient(90deg,${C.gold},${C.goldDim})`, borderRadius:3 }}/>
              </div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:C.gold, fontWeight:700, width:34, textAlign:"right" }}>{s.avgPct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function AdminAnalytics({ theme }) {
  const { t } = useTranslation();
  if (theme) C = theme;

  const [summary,    setSummary]    = useState(null);
  const [students,   setStudents]   = useState([]);
  const [results,    setResults]    = useState([]);
  const [exams,      setExams]      = useState([]);
  const [cityStats,  setCityStats]  = useState([]);
  const [tab,        setTab]        = useState("overview"); // overview | cities | students

  useEffect(() => {
    Promise.all([
      api.getSummary(),
      api.getStudents(),
      api.getResults(),
      api.getExams(),
      api.getByCity(),
    ]).then(([s, st, r, e, cs]) => {
      setSummary(s); setStudents(st); setResults(r); setExams(e); setCityStats(cs);
    }).catch(console.error);
  }, []);

  const totalStudents  = summary?.totalStudents  ?? students.length;
  const totalResults   = summary?.totalResults   ?? results.length;
  const totalPassed    = results.filter(r => r.passed).length;
  const avgScore       = summary?.avgScore       ?? avg(results.map(r => r.pct));
  const passRate       = summary?.passRate       ?? pct2(totalPassed, totalResults);
  const totalCenters   = summary?.totalCenters   ?? 0;
  const totalCities    = summary?.totalCities    ?? 0;

  const byGender  = summary?.studentsByGender  ?? {};
  const byLevel   = summary?.studentsByLevel   ?? {};
  const byCountry = summary?.studentsByCountry ?? {};

  const genderSegs = [
    { label:t("adm.a.gender.male"),  value: byGender.male   || 0, color: C.info      },
    { label:t("adm.a.gender.female"),  value: byGender.female  || 0, color: "#f472b6"  },
    { label:t("adm.a.gender.other"),   value: byGender.other   || 0, color: C.muted    },
  ].filter(s => s.value > 0);

  const levelSegs = LEVELS.map((l, i) => ({ label: l, value: byLevel[l] || 0, color: LC[l] })).filter(s => s.value > 0);
  const countryEntries = Object.entries(byCountry).sort((a,b) => b[1]-a[1]).slice(0, 6);
  const maxCountry = countryEntries[0]?.[1] || 1;

  const TABS = [["overview", t("adm.a.tab.overview")],["cities", t("adm.a.tab.cities")],["students", t("adm.a.tab.students")]];

  return (
    <div style={{ flex:1, overflowY:"auto", minWidth:0 }}>
      <div style={{ padding:"28px 36px", fontFamily:"'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, color:C.text, fontWeight:600, margin:0 }}>{t("adm.a.title")}</h1>
            <p style={{ fontSize:13, color:C.muted, margin:"4px 0 0" }}>{t("adm.a.subtitle")}</p>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                background: tab===id ? C.gold+"22" : "transparent",
                border: `1px solid ${tab===id ? C.gold : C.border}`,
                borderRadius:9, padding:"7px 16px", color: tab===id ? C.gold : C.muted,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, cursor:"pointer",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
          <StatCard icon="👤" label={t("adm.a.students")}  value={totalStudents}        color={C.info}    />
          <StatCard icon="📝" label={t("adm.a.results")} value={totalResults}         color={C.purple}  />
          <StatCard icon="✅" label={t("adm.a.passed")}       value={`${passRate}%`}       color={C.success} />
          <StatCard icon="⭐" label={t("adm.a.avg")} value={`${avgScore}%`}      color={C.gold}    />
          <StatCard icon="🏛" label={t("adm.a.centers")}     value={totalCenters}         color={C.warning} sub={t("adm.a.cities_sub", { n: totalCities })} />
          <StatCard icon="📋" label={t("adm.a.exams")}   value={exams.length}         color={C.info}    />
        </div>

        {/* ── Tab: Overview ─────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18, marginBottom:20 }}>

              {/* Gender distribution */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px" }}>
                <SectionTitle>{t("adm.a.gender")}</SectionTitle>
                <DonutChart segments={genderSegs} label={t("adm.a.students").toLowerCase()} />
              </div>

              {/* Level distribution */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px" }}>
                <SectionTitle>{t("adm.a.level")}</SectionTitle>
                <DonutChart segments={levelSegs} label={t("adm.a.students").toLowerCase()} />
              </div>

              {/* Pass / Fail */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px" }}>
                <SectionTitle>{t("adm.a.pass_fail")}</SectionTitle>
                <DonutChart segments={[
                  { label:t("adm.a.passed_lbl"),    value:totalPassed,              color:C.success },
                  { label:t("adm.a.failed_lbl"), value:totalResults - totalPassed, color:C.danger },
                ].filter(s=>s.value>0)} label={t("adm.a.results").toLowerCase()} />
              </div>
            </div>

            {/* Country breakdown */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px", marginBottom:20 }}>
              <SectionTitle>{t("adm.a.countries")}</SectionTitle>
              {countryEntries.length === 0 && <Muted>{t("adm.a.no_data")}</Muted>}
              {countryEntries.map(([country, count], i) => (
                <HBar key={country} label={country} value={count} max={maxCountry} total={totalStudents}
                  color={[C.info, C.gold, C.success, C.warning, C.purple, "#f472b6"][i % 6]} />
              ))}
            </div>

            {/* Exam performance */}
            <ExamPerfTable exams={exams} results={results} />
          </>
        )}

        {/* ── Tab: Cities ───────────────────────────────────────────────────── */}
        {tab === "cities" && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px" }}>
            <SectionTitle>{t("adm.a.city_stats")}</SectionTitle>
            <CityStatsTable cities={cityStats} />
          </div>
        )}

        {/* ── Tab: Students ─────────────────────────────────────────────────── */}
        {tab === "students" && (
          <TopStudentsTable students={students} results={results} />
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:C.text, fontWeight:600, marginBottom:14 }}>{children}</div>;
}
function Muted({ children }) {
  return <div style={{ color:C.muted, fontSize:13, padding:"8px 0" }}>{children}</div>;
}
