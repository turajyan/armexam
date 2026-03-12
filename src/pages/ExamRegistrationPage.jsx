import { useState, useEffect } from "react";
import { api } from "../api.js";
import { formatDate } from "../dateUtils.js";
import { useTranslation } from "react-i18next";

// Steps: city → center → exam → pin
export default function ExamRegistrationPage({ theme: T, onBack, onDone }) {
  const { t } = useTranslation();
  const [step, setStep]       = useState(1); // 1=city, 2=center, 3=exams, 4=pin
  const [cities, setCities]   = useState([]);
  const [centers, setCenters] = useState([]);
  const [exams, setExams]     = useState([]);
  const [city, setCity]       = useState(null);
  const [center, setCenter]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [pinResult, setPinResult] = useState(null); // { pin, examTitle }

  const STEPS = [t("ereg.city"), t("ereg.center"), t("ereg.exam"), t("ereg.pin")];

  // Load cities on mount
  useEffect(() => {
    setLoading(true);
    api.getCities()
      .then(data => setCities(data))
      .catch(() => setError(t("ereg.err.cities")))
      .finally(() => setLoading(false));
  }, []);

  const selectCity = async (c) => {
    setCity(c);
    setError("");
    setLoading(true);
    try {
      const data = await api.getCenters(c.id);
      setCenters(data);
      setStep(2);
    } catch {
      setError(t("ereg.err.centers"));
    } finally {
      setLoading(false);
    }
  };

  const selectCenter = async (c) => {
    setCenter(c);
    setError("");
    setLoading(true);
    try {
      const data = await api.getCenterExams(c.id);
      setExams(data);
      setStep(3);
    } catch {
      setError(t("ereg.err.exams"));
    } finally {
      setLoading(false);
    }
  };

  const registerForExam = async (exam) => {
    setError("");
    setLoading(true);
    try {
      const result = await api.registerForExam(exam.id);
      setPinResult({
        ...result,
        examTitle:    result.examTitle   || exam.title,
        examType:     exam.examType,
        level:        exam.level,
        duration:     exam.duration,
        passingScore: exam.passingScore,
        startDate:    result.startDate   || exam.startDate,
        endDate:      result.endDate     || exam.endDate,
        center:       exam.examCenter    || null,
      });
      setStep(4);
    } catch (e) {
      setError(e.message || t("ereg.err.reg"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: "'DM Sans', sans-serif", padding: 24,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 600, paddingTop: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{
            background: "transparent", border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "6px 12px", color: T.muted,
            fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>{t("ereg.back")}</button>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: T.text, fontWeight: 700 }}>
            {t("ereg.title")}
          </h2>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: step > i + 1 ? T.gold : step === i + 1 ? T.gold : T.border,
                  color: step >= i + 1 ? "white" : T.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, transition: "all .2s",
                }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, color: step === i + 1 ? T.text : T.muted, fontWeight: step === i + 1 ? 500 : 400 }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > i + 1 ? T.gold : T.border, margin: "0 8px", transition: "all .3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Breadcrumb */}
        {step > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {city && <Crumb T={T}>{city.name}</Crumb>}
            {center && step > 2 && <><span style={{ color: T.muted }}>›</span><Crumb T={T}>{center.name}</Crumb></>}
          </div>
        )}

        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>

          {loading && <div style={{ textAlign: "center", color: T.muted, padding: "32px 0" }}>{t("ereg.loading")}</div>}

          {error && <p style={{ color: T.danger, fontSize: 13, marginBottom: 16 }}>{error}</p>}

          {/* Step 1: Cities */}
          {step === 1 && !loading && (
            <>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{t("ereg.select_city")}</h3>
              {cities.length === 0
                ? <Empty T={T} text={t("ereg.no_cities")} />
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {cities.map(c => (
                      <SelectCard key={c.id} T={T} onClick={() => selectCity(c)}>
                        <div style={{ color: T.text, fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                        <div style={{ color: T.muted, fontSize: 12 }}>{t("ereg.centers_count", { n: c.centers?.length || 0 })}</div>
                      </SelectCard>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {/* Step 2: Centers */}
          {step === 2 && !loading && (
            <>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{t("ereg.select_center")}</h3>
              {centers.length === 0
                ? <Empty T={T} text={t("ereg.no_centers")} />
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {centers.map(c => (
                      <SelectCard key={c.id} T={T} onClick={() => selectCenter(c)}>
                        <div style={{ color: T.text, fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                        <div style={{ color: T.muted, fontSize: 12 }}>{city.name}</div>
                      </SelectCard>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {/* Step 3: Calendar */}
          {step === 3 && !loading && (
            <ExamCalendar
              exams={exams} T={T} t={t}
              onRegister={registerForExam}
              loading={loading}
            />
          )}

          {/* Step 4: PIN success */}
          {step === 4 && pinResult && (
            <PinSuccessCard T={T} pinResult={pinResult} onBack={onBack} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const LEVEL_COLOR = {
  A1:'#4ade80', A2:'#86efac', B1:'#60a5fa', B2:'#93c5fd', C1:'#f59e0b', C2:'#fbbf24',
};
const MONTHS_EN = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function isoDate(d) {
  // returns "YYYY-MM-DD" in local time
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

// ── ExamCalendar ───────────────────────────────────────────────────────────────
function ExamCalendar({ exams, T, t, onRegister }) {
  const today    = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());    // 0-based
  const [picked, setPicked] = useState(null);              // "YYYY-MM-DD"

  // Build map: "YYYY-MM-DD" → exam[]
  const byDate = {};
  for (const ex of exams) {
    if (!ex.startDate) continue;
    const key = isoDate(ex.startDate);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(ex);
  }

  // Calendar grid
  const firstDay  = new Date(year, month, 1).getDay();   // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setPicked(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setPicked(null);
  };

  const pickedExams = picked ? (byDate[picked] || []) : [];
  const totalExams  = Object.values(byDate).reduce((s, a) => s + a.length, 0);

  if (exams.length === 0) return (
    <div style={{ textAlign:'center', padding:'48px 0', color:T.muted, fontSize:14 }}>
      No open exams at this center yet.
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:13, color:T.muted, marginBottom:16 }}>
        {totalExams} exam session{totalExams !== 1 ? 's' : ''} available — select a date to register
      </div>

      {/* Month navigator */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:16 }}>
        <button onClick={prevMonth} style={navBtn(T)}>‹</button>
        <span style={{ fontFamily:"'Cormorant Garamond',serif",
          fontSize:20, fontWeight:700, color:T.text }}>
          {MONTHS_EN[month]} {year}
        </span>
        <button onClick={nextMonth} style={navBtn(T)}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)',
        marginBottom:6, gap:2 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11,
            color:T.muted, fontWeight:600, padding:'4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:20 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;

          const key      = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const hasExams = !!byDate[key];
          const isToday  = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isPicked = key === picked;
          const isPast   = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <div key={key}
              onClick={() => hasExams && !isPast && setPicked(isPicked ? null : key)}
              style={{
                aspectRatio:'1', borderRadius:10,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                cursor: hasExams && !isPast ? 'pointer' : 'default',
                position:'relative',
                background: isPicked ? T.gold
                  : hasExams && !isPast ? T.gold+'15'
                  : 'transparent',
                border: isPicked ? `2px solid ${T.gold}`
                  : isToday ? `2px solid ${T.gold}55`
                  : hasExams && !isPast ? `1.5px solid ${T.gold}40`
                  : `1px solid transparent`,
                opacity: isPast ? 0.35 : 1,
                transition:'all .15s',
              }}>
              <span style={{
                fontSize:14, fontWeight: isToday || hasExams ? 700 : 400,
                color: isPicked ? '#1a1200'
                  : hasExams && !isPast ? T.gold
                  : T.muted,
              }}>{day}</span>

              {/* Exam count dot */}
              {hasExams && !isPast && (
                <div style={{ display:'flex', gap:2, marginTop:2 }}>
                  {(byDate[key] || []).slice(0,3).map((_, di) => (
                    <div key={di} style={{
                      width:4, height:4, borderRadius:'50%',
                      background: isPicked ? '#1a1200' : T.gold,
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day exams */}
      {picked && (
        <div>
          <div style={{ fontSize:12, color:T.muted, marginBottom:10,
            letterSpacing:0.5, textTransform:'uppercase', fontWeight:600 }}>
            {new Date(picked + 'T12:00:00').toLocaleDateString('en-US',
              { weekday:'long', day:'numeric', month:'long' })}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pickedExams.map(exam => (
              <ExamSlotCard key={exam.id} exam={exam} T={T} t={t}
                onRegister={() => onRegister(exam)} />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {!picked && (
        <div style={{ display:'flex', gap:16, fontSize:11, color:T.muted, marginTop:4 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:3,
              background:T.gold+'15', border:`1.5px solid ${T.gold}40` }} />
            Has exams
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:3,
              border:`2px solid ${T.gold}55` }} />
            Today
          </span>
        </div>
      )}
    </div>
  );
}

function ExamSlotCard({ exam, T, onRegister }) {
  const lc = LEVEL_COLOR[exam.level] || T.muted;

  return (
    <div style={{
      background:T.card, border:`1.5px solid ${T.border}`,
      borderRadius:14, padding:'16px 18px',
      display:'flex', alignItems:'center', gap:16,
      transition:'border-color .15s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = T.gold+'66'}
    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      {/* Time block */}
      <div style={{ textAlign:'center', flexShrink:0,
        background:T.gold+'10', border:`1px solid ${T.gold}30`,
        borderRadius:10, padding:'10px 14px', minWidth:58 }}>
        {exam.startTime
          ? <>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18,
                fontWeight:700, color:T.gold, lineHeight:1 }}>{exam.startTime}</div>
              <div style={{ fontSize:10, color:T.muted, marginTop:3 }}>start</div>
            </>
          : <div style={{ fontSize:22 }}>📅</div>
        }
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:600, color:T.text,
          marginBottom:6, overflow:'hidden', textOverflow:'ellipsis',
          whiteSpace:'nowrap' }}>{exam.title}</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {exam.level && (
            <span style={{ fontSize:11, color:lc,
              background:lc+'18', borderRadius:5, padding:'2px 7px',
              fontWeight:700 }}>{exam.level}</span>
          )}
          <span style={{ fontSize:11, color:T.muted,
            background:T.border+'44', borderRadius:5, padding:'2px 7px' }}>
            {exam.examType === 'placement' ? '📊 Placement' : '📝 Fixed'}
          </span>
          <span style={{ fontSize:11, color:T.muted,
            background:T.border+'44', borderRadius:5, padding:'2px 7px' }}>
            ⏱ {exam.duration} min
          </span>
          {exam.passingScore && (
            <span style={{ fontSize:11, color:'#4ade80',
              background:'#4ade8018', borderRadius:5, padding:'2px 7px' }}>
              pass {exam.passingScore}%
            </span>
          )}
        </div>
      </div>

      {/* Register button */}
      <button onClick={onRegister} style={{
        background:`linear-gradient(135deg,${T.gold},${T.gold}bb)`,
        border:'none', borderRadius:10, padding:'10px 20px',
        color:'#1a1200', fontWeight:700, fontSize:13, cursor:'pointer',
        fontFamily:"'DM Sans',sans-serif", flexShrink:0,
        boxShadow:`0 2px 12px ${T.gold}33`,
        transition:'opacity .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}
      >
        Register →
      </button>
    </div>
  );
}

function navBtn(T) {
  return {
    background:'transparent', border:`1px solid ${T.border}`,
    borderRadius:8, width:32, height:32, cursor:'pointer',
    color:T.text, fontSize:18, display:'flex',
    alignItems:'center', justifyContent:'center',
  };
}

function SelectCard({ T, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.card, border: `1.5px solid ${T.border}`,
        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "border-color .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#b8943f"}
      onMouseLeave={e => e.currentTarget.style.borderColor = ""}
    >
      <div>{children}</div>
      <span style={{ color: "#b8943f", fontSize: 18 }}>›</span>
    </div>
  );
}

function Crumb({ T, children }) {
  return (
    <span style={{
      background: T.gold + "18", color: T.gold,
      borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 500,
    }}>{children}</span>
  );
}

function Tag({ T, color, children }) {
  return (
    <span style={{ fontSize: 11, color, background: color + "22", borderRadius: 5, padding: "2px 7px" }}>{children}</span>
  );
}

function Empty({ T, text }) {
  return (
    <div style={{ textAlign: "center", color: T.muted, padding: "32px 0", fontSize: 14 }}>{text}</div>
  );
}

function fmtDate(d) { return d ? formatDate(d) : ""; }

// ── PIN Success Card ──────────────────────────────────────────────────────────
function PinSuccessCard({ T, pinResult, onBack, t }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(pinResult.pin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const print = () => {
    const w = window.open('', '_blank', 'width=520,height=700');
    w.document.write(`
      <html><head><title>ArmExam PIN</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@700&display=swap');
        body { font-family:'DM Sans',sans-serif; margin:0; padding:32px; background:#fff; color:#111; }
        .card { border:2px solid #c8a96e; border-radius:16px; padding:32px; max-width:400px; margin:0 auto; }
        .logo { font-size:13px; color:#888; margin-bottom:24px; }
        .title { font-size:22px; font-weight:700; margin-bottom:4px; }
        .subtitle { font-size:13px; color:#666; margin-bottom:24px; }
        .pin-label { font-size:11px; color:#888; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
        .pin { font-family:'DM Mono',monospace; font-size:40px; font-weight:700; color:#c8a96e; letter-spacing:8px; background:#fff8ee; border:2px solid #c8a96e55; border-radius:12px; padding:16px 24px; display:inline-block; margin-bottom:24px; }
        .row { display:flex; gap:12px; margin-bottom:8px; font-size:13px; }
        .row-label { color:#888; min-width:100px; }
        .row-val { color:#111; font-weight:500; }
        .note { font-size:12px; color:#888; border-top:1px solid #eee; padding-top:16px; margin-top:16px; line-height:1.6; }
        @media print { body { padding:0; } }
      </style></head><body>
      <div class="card">
        <div class="logo">🎓 ArmExam · Exam Admission Card</div>
        <div class="title">${pinResult.examTitle || ''}</div>
        <div class="subtitle">${pinResult.alreadyRegistered ? 'Previously registered' : 'Registration confirmed'}</div>
        <div class="pin-label">Your Exam PIN Code</div>
        <div class="pin">${pinResult.pin}</div>
        <div class="row"><span class="row-label">Student</span><span class="row-val">${pinResult.studentName || ''}</span></div>
        ${pinResult.examType ? `<div class="row"><span class="row-label">Type</span><span class="row-val">${pinResult.examType === 'placement' ? 'Placement Test' : 'Fixed Exam'}</span></div>` : ''}
        ${pinResult.level ? `<div class="row"><span class="row-label">Level</span><span class="row-val">${pinResult.level}</span></div>` : ''}
        ${pinResult.duration ? `<div class="row"><span class="row-label">Duration</span><span class="row-val">${pinResult.duration} minutes</span></div>` : ''}
        ${pinResult.startDate ? `<div class="row"><span class="row-label">Date</span><span class="row-val">${new Date(pinResult.startDate).toLocaleDateString('hy-AM', {day:'numeric',month:'long',year:'numeric'})}</span></div>` : ''}
        ${pinResult.startTime ? `<div class="row"><span class="row-label">Time</span><span class="row-val">${pinResult.startTime}${pinResult.endTime ? ' – ' + pinResult.endTime : ''}</span></div>` : ''}
        ${pinResult.center ? `<div class="row"><span class="row-label">Center</span><span class="row-val">${pinResult.center.name}${pinResult.center.city ? ', ' + pinResult.center.city : ''}</span></div>` : ''}
        <div class="note">
          ⚠ Keep this PIN confidential. Present it at the examination center terminal.<br>
          One-time use per session. Do not share with others.
        </div>
      </div>
      <script>window.onload=()=>window.print();</script>
      </body></html>
    `);
    w.document.close();
  };

  const InfoRow = ({ label, value }) => value ? (
    <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.muted, minWidth:110, paddingTop:1 }}>{label}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.text, fontWeight:500, lineHeight:1.4 }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{ padding:'4px 0' }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:44, marginBottom:10 }}>{pinResult.alreadyRegistered ? '🔄' : '🎉'}</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:T.text, marginBottom:4 }}>
          {pinResult.alreadyRegistered ? t('ereg.already') : t('ereg.confirmed')}
        </div>
        <div style={{ fontSize:13, color:T.muted }}>{pinResult.examTitle}</div>
      </div>

      {/* PIN display */}
      <div style={{
        background:`linear-gradient(135deg,${T.gold}10,${T.gold}06)`,
        border:`2px solid ${T.gold}55`, borderRadius:16,
        padding:'20px 24px', marginBottom:20, textAlign:'center',
      }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>
          {t('ereg.your_pin')}
        </div>
        <div style={{
          fontFamily:"'DM Mono',monospace", fontSize:44, fontWeight:700,
          color:T.gold, letterSpacing:10, userSelect:'all',
          lineHeight:1, marginBottom:14,
        }}>
          {pinResult.pin}
        </div>
        {/* Copy / Print buttons */}
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button onClick={copy} style={{
            background: copied ? T.success+'22' : T.card,
            border:`1px solid ${copied ? T.success+'55' : T.border2}`,
            borderRadius:8, padding:'7px 18px', cursor:'pointer',
            color: copied ? T.success : T.muted,
            fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
            display:'flex', alignItems:'center', gap:6,
            transition:'all .2s',
          }}>
            {copied ? '✓ Copied' : '⎘ Copy PIN'}
          </button>
          <button onClick={print} style={{
            background:T.card, border:`1px solid ${T.border2}`,
            borderRadius:8, padding:'7px 18px', cursor:'pointer',
            color:T.muted, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
            display:'flex', alignItems:'center', gap:6,
          }}>
            🖨 Print Card
          </button>
        </div>
      </div>

      {/* Exam details */}
      <div style={{
        background:T.card, border:`1px solid ${T.border}`,
        borderRadius:14, padding:'16px 20px', marginBottom:16,
      }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>
          Exam Details
        </div>
        <InfoRow label="Exam" value={pinResult.examTitle} />
        <InfoRow label="Type" value={pinResult.examType === 'placement' ? 'Placement Test' : pinResult.examType === 'fixed' ? 'Fixed Exam' : pinResult.examType} />
        <InfoRow label="Level" value={pinResult.level} />
        <InfoRow label="Duration" value={pinResult.duration ? `${pinResult.duration} min` : null} />
        <InfoRow label="Passing score" value={pinResult.passingScore ? `${pinResult.passingScore}%` : null} />
        <InfoRow label="Date"
          value={pinResult.startDate
            ? new Date(pinResult.startDate).toLocaleDateString('hy-AM', { day:'numeric', month:'long', year:'numeric' })
            + (pinResult.endDate ? ' — ' + new Date(pinResult.endDate).toLocaleDateString('hy-AM', { day:'numeric', month:'long', year:'numeric' }) : '')
            : null}
        />
        <InfoRow label="Time"
          value={pinResult.startTime
            ? pinResult.startTime + (pinResult.endTime ? ' – ' + pinResult.endTime : '')
            : null}
        />
        <InfoRow label="Center"
          value={pinResult.center
            ? pinResult.center.name + (pinResult.center.city ? ', ' + pinResult.center.city : '')
            : null}
        />
      </div>

      {/* Security note */}
      <div style={{
        background:T.gold+'0a', border:`1px solid ${T.gold}28`,
        borderRadius:10, padding:'12px 16px', marginBottom:20,
        fontSize:12, color:T.muted, lineHeight:1.7,
      }}>
        🔐 <strong style={{ color:T.text }}>Keep your PIN confidential.</strong><br/>
        Present it at the examination center terminal on the day of the exam.
        Do not share it with anyone.
      </div>

      <button onClick={onBack} style={{
        width:'100%', padding:'12px 0', borderRadius:10,
        background:'transparent', border:`1px solid ${T.border}`,
        color:T.muted, fontWeight:500, fontSize:14, cursor:'pointer',
        fontFamily:"'DM Sans', sans-serif",
      }}>
        {t('ereg.back_dashboard')}
      </button>
    </div>
  );
}
