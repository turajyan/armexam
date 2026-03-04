import { useState } from "react";
import ExamPage        from "./pages/ExamPage";
import AdminQuestions  from "./pages/AdminQuestions";
import AdminExams      from "./pages/AdminExams";
import AdminStudents   from "./pages/AdminStudents";
import AdminAnalytics  from "./pages/AdminAnalytics";
import AdminMedia      from "./pages/AdminMedia";
import AdminSettings   from "./pages/AdminSettings";
import { THEMES, DEFAULT_THEME, THEME_KEY } from "./theme.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const NAV = [
  { id:"exam",      icon:"🎓", label:"Exam"      },
  { id:"questions", icon:"📋", label:"Questions" },
  { id:"exams",     icon:"🗂",  label:"Exams"     },
  { id:"students",  icon:"👤", label:"Students"  },
  { id:"analytics", icon:"📊", label:"Analytics" },
  { id:"media",     icon:"📁", label:"Media"     },
  { id:"settings",  icon:"⚙️",  label:"Settings"  },
];

const PAGE_MAP = {
  exam:      ExamPage,
  questions: AdminQuestions,
  exams:     AdminExams,
  students:  AdminStudents,
  analytics: AdminAnalytics,
  media:     AdminMedia,
  settings:  AdminSettings,
};

export default function App() {
  const [page, setPage] = useState("exam");
  const [themeId, setThemeId] = useState(
    () => { try { return localStorage.getItem(THEME_KEY) || DEFAULT_THEME; } catch { return DEFAULT_THEME; } }
  );

  const T = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const current = NAV.find(n => n.id === page);
  const CurrentPage = PAGE_MAP[page];

  const handleThemeChange = (id) => {
    setThemeId(id);
    try { localStorage.setItem(THEME_KEY, id); } catch {}
  };

  return (
    <>
      <style>{FONTS}{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.bg};color:${T.text}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
        select option{background:${T.panel};color:${T.text}}
        input[type=date],input[type=time],input[type=color]{color-scheme:${themeId==="light"?"light":"dark"}}
      `}</style>

      <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:T.bg }}>

        {/* Sidebar */}
        <aside style={{ width:72, background:T.sidebarBg, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:14, gap:3, flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${T.gold},${T.goldDim})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:20, color:"white", marginBottom:18 }}>Հ</div>

          {NAV.map(n => (
            <button key={n.id} onClick={()=>setPage(n.id)} title={n.label}
              style={{ width:50, height:50, borderRadius:12, background:page===n.id?T.gold+"22":"transparent", border:`1px solid ${page===n.id?T.gold+"66":"transparent"}`, cursor:"pointer", fontSize:19, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, transition:"all .15s" }}>
              {n.icon}
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:page===n.id?T.gold:T.muted, letterSpacing:.2 }}>{n.label}</span>
            </button>
          ))}

          <div style={{ flex:1 }} />

          {/* Theme switcher */}
          <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8, alignItems:"center" }}>
            {Object.values(THEMES).map(th => (
              <button key={th.id} onClick={() => handleThemeChange(th.id)} title={th.label}
                style={{ width:30, height:30, borderRadius:8, background:themeId===th.id?T.gold+"22":"transparent", border:`1.5px solid ${themeId===th.id?T.gold:T.border}`, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                {th.id==="dark"?"🌙":th.id==="medium"?"🌆":"☀️"}
              </button>
            ))}
          </div>

          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.muted, marginBottom:12, letterSpacing:.5, opacity:.4 }}>v1.0</div>
        </aside>

        {/* Main column */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Top bar */}
          <div style={{ background:T.topbarBg, backdropFilter:"blur(12px)", borderBottom:`1px solid ${T.border}`, padding:"10px 24px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <span style={{ fontSize:18 }}>{current?.icon}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:T.text, fontWeight:600 }}>ArmExam</span>
            <span style={{ color:T.border2, fontSize:16 }}>·</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.muted }}>{current?.label}</span>
            <div style={{ flex:1 }} />
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.muted, opacity:.5 }}>{T.label}</span>
            <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${T.border2},${T.dim})`, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>👤</div>
          </div>

          {/* Content */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
            {CurrentPage && <CurrentPage theme={T} onThemeChange={handleThemeChange} currentTheme={themeId} />}
          </div>
        </div>
      </div>
    </>
  );
}
