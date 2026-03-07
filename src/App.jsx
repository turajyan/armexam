import { useState, useEffect } from "react";
import ExamPage              from "./pages/ExamPage";
import AdminQuestions        from "./pages/AdminQuestions";
import AdminExams            from "./pages/AdminExams";
import AdminStudents         from "./pages/AdminStudents";
import AdminAnalytics        from "./pages/AdminAnalytics";
import AdminCenters          from "./pages/AdminCenters";
import AdminMedia            from "./pages/AdminMedia";
import AdminSettings         from "./pages/AdminSettings";
import AdminManagement       from "./pages/AdminManagement";
import ExaminerDashboard     from "./pages/ExaminerDashboard";
import RegisterPage          from "./pages/RegisterPage";
import LoginPage             from "./pages/LoginPage";
import AdminLogin            from "./pages/AdminLogin";
import UserDashboard         from "./pages/UserDashboard";
import ExamRegistrationPage  from "./pages/ExamRegistrationPage";
import { THEMES, DEFAULT_THEME, THEME_KEY } from "./theme.js";
import { api } from "./api.js";
import { t } from "./translations.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`;

// NAV items with required roles
const ALL_NAV = [
  { id:"questions", glyph:"Q",  label:"Questions", roles:["super_admin","center_admin","moderator","examiner"] },
  { id:"exams",     glyph:"E",  label:"Exams",     roles:["super_admin","center_admin"] },
  { id:"students",  glyph:"S",  label:"Students",  roles:["super_admin","center_admin"] },
  { id:"centers",   glyph:"C",  label:"Centers",   roles:["super_admin"] },
  { id:"grading",   glyph:"✓",  label:"Grading",   roles:["super_admin","center_admin","examiner"] },
  { id:"analytics", glyph:"∑",  label:"Analytics", roles:["super_admin","center_admin"] },
  { id:"admins",    glyph:"⊕",  label:"Admins",    roles:["super_admin"] },
  { id:"media",     glyph:"M",  label:"Media",     roles:["super_admin"] },
  { id:"settings",  glyph:"⚙",  label:"Settings",  roles:["super_admin"] },
];

const PAGE_MAP = {
  questions: AdminQuestions,
  exams:     AdminExams,
  students:  AdminStudents,
  centers:   AdminCenters,
  grading:   ExaminerDashboard,
  analytics: AdminAnalytics,
  admins:    AdminManagement,
  media:     AdminMedia,
  settings:  AdminSettings,
};

const ROLE_LABELS = {
  super_admin:  t("role.super_admin"),
  center_admin: t("role.center_admin"),
  moderator:    t("role.moderator"),
  examiner:     t("role.examiner"),
};

const ROLE_COLORS = {
  super_admin:  "#c9a84c",
  center_admin: "#4c9ac9",
  moderator:    "#4cc98a",
  examiner:     "#c94c6f",
};

export default function App() {
  const [themeId, setThemeId] = useState(
    () => { try { return localStorage.getItem(THEME_KEY) || DEFAULT_THEME; } catch { return DEFAULT_THEME; } }
  );
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Student auth
  const [user,        setUser]        = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userPage,    setUserPage]    = useState("dashboard");

  useEffect(() => {
    const token = localStorage.getItem("armexam_token");
    if (token) {
      api.me()
        .then(d => setUser(d))
        .catch(() => localStorage.removeItem("armexam_token"))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Admin auth
  const [admin,        setAdmin]        = useState(null);
  const [adminChecked, setAdminChecked] = useState(false);

  const defaultPageForRole = (role) => {
    if (role === "moderator") return "questions";
    if (role === "examiner")  return "grading";
    return "exams";
  };

  const [page, setPage] = useState(
    () => { try { return localStorage.getItem("armexam_admin_page") || "exams"; } catch { return "exams"; } }
  );
  const gotoPage = (p) => { setPage(p); try { localStorage.setItem("armexam_admin_page", p); } catch {} };

  useEffect(() => {
    const token = localStorage.getItem("armexam_admin_token");
    if (token) {
      api.adminMe()
        .then(d => {
          setAdmin(d);
          // restore saved page only if valid for this role, else use role default
          const saved = (() => { try { return localStorage.getItem("armexam_admin_page"); } catch { return null; } })();
          const allowed = ALL_NAV.filter(n => n.roles.includes(d.role)).map(n => n.id);
          gotoPage(saved && allowed.includes(saved) ? saved : defaultPageForRole(d.role));
        })
        .catch(() => localStorage.removeItem("armexam_admin_token"))
        .finally(() => setAdminChecked(true));
    } else {
      setAdminChecked(true);
    }
  }, []);

  const T = THEMES[themeId] || THEMES[DEFAULT_THEME];

  const globalStyle = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${T.bg};color:${T.text}}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:3px}
    ::-webkit-scrollbar-track{background:transparent}
    @keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    button:active{transform:scale(.97)}
    select option{background:${T.panel};color:${T.text}}
    input[type=date],input[type=time],input[type=color]{color-scheme:${themeId==="light"?"light":"dark"}}
  `;

  const handleThemeChange = (id) => {
    setThemeId(id);
    try { localStorage.setItem(THEME_KEY, id); } catch {}
  };

  const handleAdminLogin = (a) => {
    setAdmin(a);
    gotoPage(defaultPageForRole(a.role));
    window.location.hash = "";
  };

  const handleAdminLogout = () => {
    api.adminLogout().catch(() => {});
    localStorage.removeItem("armexam_admin_token");
    setAdmin(null);
    window.location.hash = "#admin-login";
  };

  // ── Student-facing public routes ──────────────────────────────────────────────

  if (hash === "#register") {
    return (
      <>
        <style>{FONTS}{globalStyle}</style>
        <RegisterPage
          theme={T}
          onSuccess={(u) => { setUser(u); setUserPage("dashboard"); window.location.hash = "#dashboard"; }}
        />
        <div style={{ position:"fixed", bottom:16, right:16, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
          <a href="#login" style={{ color:T.gold, textDecoration:"none" }}>Already have an account? Sign in</a>
        </div>
      </>
    );
  }

  if (hash === "#login") {
    if (!authChecked) return null;
    if (user) { window.location.hash = "#dashboard"; return null; }
    return (
      <>
        <style>{FONTS}{globalStyle}</style>
        <LoginPage
          theme={T}
          onSuccess={(u) => { setUser(u); setUserPage("dashboard"); window.location.hash = "#dashboard"; }}
          onRegister={() => { window.location.hash = "#register"; }}
        />
      </>
    );
  }

  if (hash === "#dashboard") {
    if (!authChecked) return null;
    if (!user) { window.location.hash = "#login"; return null; }
    if (userPage === "register-exam") {
      return (
        <>
          <style>{FONTS}{globalStyle}</style>
          <ExamRegistrationPage
            theme={T}
            onBack={() => setUserPage("dashboard")}
            onDone={() => { setUserPage("dashboard"); api.me().then(setUser).catch(() => {}); }}
          />
        </>
      );
    }
    return (
      <>
        <style>{FONTS}{globalStyle}</style>
        <UserDashboard
          theme={T} user={user}
          onRegisterExam={() => setUserPage("register-exam")}
          onLogout={() => { setUser(null); window.location.hash = "#login"; }}
          onUserUpdate={(u) => setUser(u)}
        />
      </>
    );
  }

  // ── Admin login ───────────────────────────────────────────────────────────────

  if (hash === "#admin-login") {
    if (!adminChecked) return null;
    if (admin) { window.location.hash = ""; return null; }
    return (
      <>
        <style>{FONTS}{globalStyle}</style>
        <AdminLogin theme={T} onSuccess={handleAdminLogin} />
      </>
    );
  }

  // ── Admin shell (default route) ───────────────────────────────────────────────

  if (!adminChecked) return null;
  if (!admin) {
    return (
      <>
        <style>{FONTS}{globalStyle}</style>
        <AdminLogin theme={T} onSuccess={handleAdminLogin} />
      </>
    );
  }

  const nav         = ALL_NAV.filter(n => n.roles.includes(admin.role));
  const safePage    = nav.find(n => n.id === page) ? page : (nav[0]?.id ?? "exams");
  const currentNav  = nav.find(n => n.id === safePage);
  const CurrentPage = PAGE_MAP[safePage];

  return (
    <>
      <style>{FONTS}{globalStyle}</style>

      <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:T.bg }}>

        {/* Sidebar */}
        <aside style={{ width:72, background:T.sidebarBg, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:14, gap:3, flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${T.gold},${T.goldDim})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:20, color:"white", marginBottom:18 }}>Հ</div>

          {nav.map(n => {
            const active = safePage === n.id;
            const ic = active ? T.gold : T.muted;
            return (
              <button key={n.id} onClick={() => gotoPage(n.id)} title={n.label}
                style={{ width:50, height:50, borderRadius:12, background:active?T.gold+"22":"transparent", border:`1px solid ${active?T.gold+"66":"transparent"}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, transition:"all .15s" }}>
                <div style={{ width:26, height:26, borderRadius:7, background:ic+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", color:ic }}>{n.glyph}</div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:ic, letterSpacing:.2 }}>{n.label}</span>
              </button>
            );
          })}

          <div style={{ flex:1 }} />

          {/* Student portal link */}
          <a href="#login" title="Портал студентов"
            style={{ width:50, height:50, borderRadius:12, background:"transparent", border:`1px solid ${T.border}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, textDecoration:"none", marginBottom:4 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:T.info+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", color:T.info }}>P</div>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.muted, letterSpacing:.2 }}>Portal</span>
          </a>

          {/* Logout */}
          <button onClick={handleAdminLogout} title="Sign out"
            style={{ width:50, height:50, borderRadius:12, background:"transparent", border:`1px solid ${T.border}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, marginBottom:4 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:T.danger+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:T.danger }}>↩</div>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.muted, letterSpacing:.2 }}>Out</span>
          </button>

          {/* Theme switcher */}
          <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8, alignItems:"center" }}>
            {Object.values(THEMES).map(th => (
              <button key={th.id} onClick={() => handleThemeChange(th.id)} title={th.label}
                style={{ width:30, height:30, borderRadius:8, background:themeId===th.id?T.gold+"22":"transparent", border:`1.5px solid ${themeId===th.id?T.gold:T.border}`, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {th.id==="dark"?"🌙":th.id==="medium"?"🌆":"☀️"}
              </button>
            ))}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.muted, marginBottom:12, letterSpacing:.5, opacity:.4 }}>v2.0</div>
        </aside>

        {/* Main */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Topbar */}
          <div style={{ background:T.topbarBg, backdropFilter:"blur(12px)", borderBottom:`1px solid ${T.border}`, padding:"10px 24px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:24, height:24, borderRadius:6, background:T.gold+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", color:T.gold }}>{currentNav?.glyph}</div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:T.text, fontWeight:600 }}>ArmExam</span>
            <span style={{ color:T.border2, fontSize:16 }}>·</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.muted }}>{currentNav?.label}</span>
            <div style={{ flex:1 }} />
            <span style={{
              background: (ROLE_COLORS[admin.role] || T.gold) + "22",
              color: ROLE_COLORS[admin.role] || T.gold,
              border: `1px solid ${(ROLE_COLORS[admin.role] || T.gold)}44`,
              borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
            }}>
              {ROLE_LABELS[admin.role] || admin.role}
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.text, fontWeight:500 }}>{admin.name}</span>
            <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold}33,${T.gold}11)`, border:`1px solid ${T.gold}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", color:T.gold }}>
              {admin.name?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
            {CurrentPage && <CurrentPage theme={T} onThemeChange={handleThemeChange} currentTheme={themeId} admin={admin} />}
          </div>
        </div>
      </div>
    </>
  );
}
