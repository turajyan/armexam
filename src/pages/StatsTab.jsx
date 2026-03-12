import { useEffect, useState, useRef } from "react";
import { api } from "../api.js";
import { formatDate } from "../dateUtils.js";

const LEVEL_COLOR = {
  A1:"#4ade80", A2:"#86efac", B1:"#60a5fa",
  B2:"#93c5fd", C1:"#f59e0b", C2:"#fbbf24",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function StatsTab({ theme: T, user }) {
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [dlLoading, setDlLoading] = useState({});  // { [resultId]: bool }
  const [activeResult, setActiveResult] = useState(null); // expanded result card

  useEffect(() => {
    api.studentStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const downloadCert = async (resultId) => {
    setDlLoading(p => ({ ...p, [resultId]: true }));
    try { await api.downloadCertificate(resultId); }
    catch (e) { alert("Could not download: " + e.message); }
    finally { setDlLoading(p => ({ ...p, [resultId]: false })); }
  };

  if (loading) return (
    <div style={{ padding:40, color:T.muted, fontFamily:"'DM Sans',sans-serif" }}>
      Loading…
    </div>
  );
  if (!stats) return null;

  const currentLevel  = user?.level ?? stats.certificates?.[0]?.level ?? null;
  const levelColor    = LEVEL_COLOR[currentLevel] ?? T.gold;
  const hasFeedback   = stats.feedbackList?.length > 0;

  return (
    <div style={{ padding:"32px 40px", paddingBottom:80,
      fontFamily:"'DM Sans',sans-serif", maxWidth:1200, margin:"0 auto" }}>

      {/* ── Hero row ───────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
        gap:16, marginBottom:28 }}>
        <StatCard label="Total exams"   value={stats.totalExams}  color={T.gold}   T={T} />
        <StatCard label="Passed"        value={stats.passedExams} color="#4ade80"  T={T} />
        <StatCard label="Avg score"     value={`${stats.avgScore}%`} color={levelColor} T={T} />
        <StatCard label="Current level"
          value={currentLevel ?? "—"}
          color={levelColor} T={T} large />
      </div>

      {/* ── Main 2-column grid ─────────────────────────────────────────────── */}
      <div style={{ display:"grid",
        gridTemplateColumns: hasFeedback ? "1fr 380px" : "1fr",
        gap:24, alignItems:"start" }}>

        {/* LEFT column */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

          {/* Radar chart */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`,
            borderRadius:18, padding:"24px 28px" }}>
            <SectionHeader T={T} icon="📊">Skill breakdown</SectionHeader>
            <div style={{ display:"flex", alignItems:"center", gap:32,
              flexWrap:"wrap" }}>
              <RadarChart data={stats.skillBreakdown} T={T} />
              <SkillBars data={stats.skillBreakdown} T={T} />
            </div>
          </div>

          {/* Result history */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`,
            borderRadius:18, padding:"24px 28px" }}>
            <SectionHeader T={T} icon="📋">Exam history</SectionHeader>
            {(stats.results ?? []).length === 0 ? (
              <EmptyState T={T} text="No exams yet" />
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {stats.results.map(r => (
                  <ResultRow key={r.id} r={r} T={T}
                    expanded={activeResult === r.id}
                    onToggle={() => setActiveResult(activeResult===r.id ? null : r.id)}
                    onDownload={() => downloadCert(r.id)}
                    downloading={dlLoading[r.id]} />
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {stats.ranking?.length > 0 && (
            <div style={{ background:T.card, border:`1px solid ${T.border}`,
              borderRadius:18, padding:"24px 28px" }}>
              <SectionHeader T={T} icon="🏆">Leaderboard</SectionHeader>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {stats.ranking.map((entry, i) => {
                  const isMe = entry.id === user?.id;
                  return (
                    <div key={entry.id} style={{ display:"flex", alignItems:"center",
                      gap:12, padding:"9px 12px", borderRadius:10,
                      background: isMe ? T.gold+"15" : "transparent",
                      border: isMe ? `1px solid ${T.gold}44` : "1px solid transparent" }}>
                      <div style={{ width:24, height:24, borderRadius:"50%",
                        background: i<3 ? T.gold : T.panel,
                        color: i<3 ? "#1a1d27" : T.muted,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:11, fontWeight:700 }}>{i+1}</div>
                      <span style={{ flex:1, fontSize:13, color:T.text,
                        fontWeight: isMe ? 700 : 400 }}>{entry.name}</span>
                      <span style={{ fontSize:12, color:T.muted }}>{entry.examCount} exams</span>
                      <span style={{ fontSize:13, fontWeight:700, color:T.gold }}>{entry.avgScore}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT column — feedback + certificates */}
        <div style={{ display:"flex", flexDirection:"column", gap:20,
          position:"sticky", top:24 }}>

          {/* Examiner feedback */}
          {hasFeedback && (
            <div style={{ background:T.card, border:`1px solid ${T.border}`,
              borderRadius:18, padding:"22px 24px" }}>
              <SectionHeader T={T} icon="💬">Examiner feedback</SectionHeader>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {stats.feedbackList.map((f, i) => (
                  <div key={i} style={{ background:T.panel, borderRadius:12,
                    padding:"12px 14px",
                    borderLeft:`3px solid ${T.gold}66` }}>
                    <div style={{ fontSize:10, color:T.muted, marginBottom:6 }}>
                      {f.examTitle} · {formatDate(f.gradedAt)}
                    </div>
                    <div style={{ fontSize:13, color:T.text, lineHeight:1.65 }}>
                      {f.feedback}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {stats.certificates?.length > 0 && (
            <div style={{ background:T.card, border:`1px solid ${T.border}`,
              borderRadius:18, padding:"22px 24px" }}>
              <SectionHeader T={T} icon="🎓">Certificates</SectionHeader>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {stats.certificates.map(cert => {
                  const lc = LEVEL_COLOR[cert.level] ?? T.gold;
                  return (
                    <div key={cert.id} style={{ display:"flex", alignItems:"center",
                      gap:12, padding:"12px 14px",
                      background:T.panel, borderRadius:12,
                      border:`1px solid ${T.border}` }}>
                      <div style={{ width:40, height:40, borderRadius:10,
                        background:lc+"18", display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:18,
                        border:`1px solid ${lc}44` }}>
                        ✓
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, color:T.text, fontWeight:600,
                          overflow:"hidden", textOverflow:"ellipsis",
                          whiteSpace:"nowrap" }}>
                          {cert.examTitle}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                          {cert.level && (
                            <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px",
                              borderRadius:4, background:lc, color:"#fff" }}>
                              {cert.level}
                            </span>
                          )}
                          <span style={{ fontSize:11, color:T.muted }}>
                            {formatDate(cert.submittedAt)}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:18, fontWeight:700, color:lc,
                          fontFamily:"'Cormorant Garamond',serif" }}>
                          {cert.score}%
                        </div>
                        {cert.canDownload ? (
                          <button
                            onClick={() => downloadCert(cert.id)}
                            disabled={dlLoading[cert.id]}
                            style={{ marginTop:4, padding:"4px 10px",
                              background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,
                              border:"none", borderRadius:6, color:"#1a1d27",
                              fontSize:11, fontWeight:700, cursor:"pointer",
                              opacity: dlLoading[cert.id] ? .6 : 1 }}>
                            {dlLoading[cert.id] ? "…" : "⬇ PDF"}
                          </button>
                        ) : (
                          <span style={{ fontSize:10, color:T.muted, display:"block",
                            marginTop:4 }}>pending review</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Radar chart (SVG, no deps)
// ─────────────────────────────────────────────────────────────────────────────
const SKILLS = ["Reading","Listening","Speaking","Writing"];

function RadarChart({ data = {}, T }) {
  const cx = 100, cy = 100, r = 72;
  const N  = SKILLS.length;

  const pts = SKILLS.map((_, i) => {
    const angle = (2 * Math.PI * i / N) - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const gridPcts = [25, 50, 75, 100];

  const dataPath = SKILLS.map((s, i) => {
    const angle  = (2 * Math.PI * i / N) - Math.PI / 2;
    const pct    = (data[s] ?? 0) / 100;
    return `${cx + r * pct * Math.cos(angle)},${cy + r * pct * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg width={200} height={200} viewBox="0 0 200 200"
      style={{ flexShrink:0 }}>
      {/* Grid rings */}
      {gridPcts.map(p => {
        const gPts = SKILLS.map((_, i) => {
          const angle = (2 * Math.PI * i / N) - Math.PI / 2;
          const rr    = r * p / 100;
          return `${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={p} points={gPts} fill="none"
          stroke={T.border} strokeWidth={.8} />;
      })}

      {/* Axis lines */}
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
          stroke={T.border} strokeWidth={.8} />
      ))}

      {/* Data polygon */}
      <polygon points={dataPath} fill={T.gold+"33"}
        stroke={T.gold} strokeWidth={2} />

      {/* Data dots */}
      {SKILLS.map((s, i) => {
        const angle = (2 * Math.PI * i / N) - Math.PI / 2;
        const pct   = (data[s] ?? 0) / 100;
        return <circle key={i}
          cx={cx + r * pct * Math.cos(angle)}
          cy={cy + r * pct * Math.sin(angle)}
          r={3.5} fill={T.gold} />;
      })}

      {/* Labels */}
      {pts.map((p, i) => {
        const lx = cx + (r + 16) * Math.cos((2 * Math.PI * i / N) - Math.PI / 2);
        const ly = cy + (r + 16) * Math.sin((2 * Math.PI * i / N) - Math.PI / 2);
        return <text key={i} x={lx} y={ly} textAnchor="middle"
          dominantBaseline="middle" fontSize={9} fontWeight={600}
          fill={T.muted} fontFamily="'DM Sans',sans-serif">
          {SKILLS[i]}
        </text>;
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skill bars (alongside radar)
// ─────────────────────────────────────────────────────────────────────────────
function SkillBars({ data = {}, T }) {
  return (
    <div style={{ flex:1, minWidth:160 }}>
      {SKILLS.map(s => {
        const pct = data[s] ?? 0;
        const c   = pct>=70?"#4ade80":pct>=50?T.gold:"#f87171";
        return (
          <div key={s} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              marginBottom:4 }}>
              <span style={{ fontSize:12, color:T.muted }}>{s}</span>
              <span style={{ fontSize:12, fontWeight:700, color:c,
                fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
            </div>
            <div style={{ height:5, background:T.border, borderRadius:99,
              overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:c,
                borderRadius:99, transition:"width .4s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Result row (exam history)
// ─────────────────────────────────────────────────────────────────────────────
function ResultRow({ r, T, expanded, onToggle, onDownload, downloading }) {
  const lc = LEVEL_COLOR[r.level] ?? T.muted;
  const statusColor = {
    auto:"#94a3b8", pending:"#f59e0b", grading:"#60a5fa",
    completed:"#4ade80", published:"#4ade80", graded:"#4ade80",
  }[r.gradingStatus] ?? T.muted;

  return (
    <div style={{ background:T.panel, border:`1px solid ${T.border}`,
      borderRadius:12, overflow:"hidden" }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center",
        gap:12, padding:"12px 16px", cursor:"pointer" }}>
        {/* Level badge */}
        <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px",
          borderRadius:5, background:lc+"18", color:lc, border:`1px solid ${lc}44`,
          minWidth:28, textAlign:"center" }}>
          {r.level ?? "—"}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, color:T.text, fontWeight:500,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {r.examTitle}
          </div>
          <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>
            {formatDate(r.submittedAt)}
            {r.centerName ? ` · ${r.centerName}` : ""}
          </div>
        </div>
        {/* Score */}
        <span style={{ fontSize:14, fontWeight:700,
          color: r.passed===true ? "#4ade80" : r.passed===false ? "#f87171" : T.muted,
          fontFamily:"'DM Mono',monospace" }}>
          {r.pct}%
        </span>
        {/* Status pill */}
        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px",
          borderRadius:5, background:statusColor+"18", color:statusColor,
          border:`1px solid ${statusColor}44` }}>
          {r.gradingStatus}
        </span>
        {/* Expand arrow */}
        <span style={{ fontSize:11, color:T.muted, transition:"transform .2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </div>

      {/* Expanded: per-level stats for placement / download button */}
      {expanded && (
        <div style={{ padding:"0 16px 14px",
          borderTop:`1px solid ${T.border}` }}>
          {r.levelStats && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:12,
              marginBottom:10 }}>
              {["A1","A2","B1","B2","C1","C2"].map(lvl => {
                const ls = r.levelStats[lvl];
                if (!ls) return null;
                const c = LEVEL_COLOR[lvl] ?? T.muted;
                return (
                  <div key={lvl} style={{ background: lvl===r.level ? c+"18" : T.card,
                    border:`1px solid ${lvl===r.level ? c+"55" : T.border}`,
                    borderRadius:8, padding:"6px 10px", minWidth:70 }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", marginBottom:3 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:c }}>{lvl}</span>
                      <span style={{ fontSize:9,
                        color: ls.passed ? "#4ade80" : "#f87171" }}>
                        {ls.passed ? "✓" : "✗"}
                      </span>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:c,
                      fontFamily:"'DM Mono',monospace" }}>{ls.pct}%</div>
                    <div style={{ fontSize:9, color:T.muted }}>
                      {ls.earnedPts}/{ls.maxPts}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {r.passed && r.gradingStatus === "published" && (
            <button onClick={onDownload} disabled={downloading}
              style={{ marginTop:8, padding:"7px 16px",
                background:`linear-gradient(135deg,${LEVEL_COLOR[r.level]||"#e8d5a3"},${LEVEL_COLOR[r.level]||"#c8a96e"}99)`,
                border:"none", borderRadius:8, color:"#1a1d27",
                fontSize:12, fontWeight:700, cursor:"pointer",
                opacity: downloading ? .6 : 1 }}>
              {downloading ? "Generating…" : "⬇ Download Certificate PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small shared components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, T, large=false }) {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`,
      borderRadius:16, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-10, right:-10, width:56, height:56,
        borderRadius:"50%", background:color+"15" }} />
      <div style={{ fontSize:12, color:T.muted, marginBottom:8, fontWeight:500 }}>{label}</div>
      <div style={{ fontSize: large ? 28 : 34, color,
        fontWeight:700, fontFamily:"'Cormorant Garamond',serif", lineHeight:1 }}>
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ T, icon, children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <h4 style={{ margin:0, fontSize:15, color:T.text, fontWeight:600 }}>{children}</h4>
    </div>
  );
}

function EmptyState({ T, text }) {
  return (
    <div style={{ textAlign:"center", padding:"28px 0", color:T.muted, fontSize:13 }}>
      {text}
    </div>
  );
}
