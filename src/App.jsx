import { useState } from "react";
import ExamPage       from "./pages/ExamPage";
import AdminQuestions from "./pages/AdminQuestions";
import AdminExams     from "./pages/AdminExams";
import AdminStudents  from "./pages/AdminStudents";
import AdminMedia     from "./pages/AdminMedia";
import AdminSettings  from "./pages/AdminSettings";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const C = { bg:"#04080f", panel:"#080f1a", border:"#1a2540", gold:"#c8a96e", muted:"#475569" };

const NAV = [
  { id:"exam",      icon:"🎓", label:"Exam",      component:ExamPage },
  { id:"questions", icon:"📋", label:"Questions", component:AdminQuestions },
  { id:"exams",     icon:"🗂",  label:"Exams",     component:AdminExams },
  { id:"students",  icon:"👤", label:"Students",  component:AdminStudents },
  { id:"media",     icon:"📁", label:"Media",     component:AdminMedia },
  { id:"settings",  icon:"⚙️",  label:"Settings",  component:AdminSettings },
];

export default function App() {
  const [page, setPage] = useState("exam");
  const current = NAV.find(p=>p.id===page);

  return (
    <>
      <style>{FONTS}{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.bg};color:#e2e8f0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#243050;border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        button:active{transform:scale(.97)}
        select option{background:${C.panel}}
        input[type=date],input[type=time],input[type=color]{color-scheme:dark}
      `}</style>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:C.bg }}>
        {/* Sidebar */}
        <aside style={{ width:72, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:14, gap:3, flexShrink:0 }}>
          {/* Logo */}
          <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${C.gold},#7c5830)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:20, color:"white", marginBottom:18 }}>Հ</div>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} title={n.label}
              style={{ width:50, height:50, borderRadius:12, background:page===n.id?C.gold+"18":"transparent", border:`1px solid ${page===n.id?C.gold+"55":"transparent"}`, cursor:"pointer", fontSize:19, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, transition:"all .15s" }}>
              {n.icon}
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:page===n.id?C.gold:C.muted, letterSpacing:.2 }}>{n.label}</span>
            </button>
          ))}
          {/* Bottom spacer + version */}
          <div style={{ flex:1 }} />
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"#1e293b", marginBottom:12, letterSpacing:.5 }}>v1.0</div>
        </aside>

        {/* Page */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Top bar */}
          <div style={{ background:C.panel+"cc", backdropFilter:"blur(12px)", borderBottom:`1px solid ${C.border}`, padding:"10px 24px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <span style={{ fontSize:18 }}>{current?.icon}</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#e2e8f0", fontWeight:600 }}>
              ArmExam
            </span>
            <span style={{ color:"#1e293b", fontSize:16 }}>·</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:C.muted }}>{current?.label}</span>
            <div style={{ flex:1 }} />
            <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,#243050,#1a2540)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>👤</div>
          </div>

          {/* Content */}
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
            {current?.component && <current.component />}
          </div>
        </div>
      </div>
    </>
  );
}
