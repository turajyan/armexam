import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.js";

// ── Armenian flag palette — pastel & refined ──────────────────────────────────
const P = {
  red:    "#E8002D",  redPale:   "#FFF0F3",  redSoft:   "#FFD6DE",
  blue:   "#1A4FBF",  bluePale:  "#EEF3FF",  blueSoft:  "#C8D8FF",
  orange: "#F5A623",  orangePale:"#FFF8EC",  orangeSoft:"#FFE4A8",
  bg:     "#FAFBFF",  white:     "#FFFFFF",
  text:   "#1A2140",  sub:       "#4A5480",  muted:     "#8A92B0",
  border: "#E8EBF8",  card:      "#FFFFFF",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');`;
const LANGS = { en:"EN", ru:"RU", hy:"ՀԱՅ" };
const LEVEL_COLORS = [P.orange, P.orange, P.blue, P.blue, P.red, P.red];
const CHART_DATA = [42,58,71,65,83,94,88,102,118,134,127,156];

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, duration = 1800 }) {
  const [val, setVal] = useState("0");
  const ref = useRef();
  useEffect(() => {
    const num = parseInt(String(target).replace(/[^0-9]/g, ""));
    const suffix = String(target).replace(/[0-9,\s]/g, "");
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * num) + suffix);
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target]);
  return <span>{val}</span>;
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ labels }) {
  const max = Math.max(...CHART_DATA);
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:120 }}>
      {CHART_DATA.map((v,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ flex:"none", width:"100%",
            height: Math.round((v/max)*90)+"px",
            background: i%3===0 ? P.red+"cc" : i%3===1 ? P.blue+"cc" : P.orange+"cc",
            borderRadius:"4px 4px 0 0", transition:"height .8s cubic-bezier(.34,1.56,.64,1)" }} />
          <span style={{ fontSize:9, color:P.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom:`1px solid ${P.border}` }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:"100%", display:"flex",
        justifyContent:"space-between", alignItems:"center", padding:"20px 0",
        background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15,
          fontWeight:600, color:P.text, paddingRight:24 }}>{q}</span>
        <span style={{ fontSize:18, color:P.blue, flexShrink:0,
          transform: open?"rotate(45deg)":"rotate(0deg)", transition:"transform .3s ease",
          fontWeight:300 }}>+</span>
      </button>
      <div style={{ maxHeight:open?"300px":"0", overflow:"hidden", transition:"max-height .4s ease" }}>
        <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:P.sub,
          lineHeight:1.7, paddingBottom:20, margin:0 }}>{a}</p>
      </div>
    </div>
  );
}

// ── Scroll-fade section ───────────────────────────────────────────────────────
function Section({ id, children, style={} }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold:0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section id={id} ref={ref} style={{
      opacity: vis?1:0, transform: vis?"translateY(0)":"translateY(32px)",
      transition:"opacity .7s ease, transform .7s ease", ...style }}>
      {children}
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PublicLanding({ onLogin, onRegister }) {
  const { t } = useTranslation();
  const [contactSent, setContactSent] = useState(false);

  const currentLang = i18n.language || "en";
  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    try {
      const s = JSON.parse(localStorage.getItem("armexam_general_settings")||"{}");
      s.language = lng;
      localStorage.setItem("armexam_general_settings", JSON.stringify(s));
    } catch {}
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });

  const nav     = t("landing.nav",          { returnObjects:true });
  const stats   = t("landing.stats",        { returnObjects:true });
  const levels  = t("landing.levels",       { returnObjects:true });
  const faqs    = t("landing.faqs",         { returnObjects:true });
  const mats    = t("landing.materials",    { returnObjects:true });
  const sCards  = t("landing.statsCards",   { returnObjects:true });
  const sMonths = t("landing.statsMonths",  { returnObjects:true });
  const cefr    = t("landing.cefr",         { returnObjects:true });
  const skills  = t("landing.skills",       { returnObjects:true });
  const hero    = t("landing.hero",         { returnObjects:true });

  return (
    <div style={{ background:P.bg, color:P.text, fontFamily:"'Plus Jakarta Sans',sans-serif",
      overflowX:"hidden", minHeight:"100vh" }}>
      <style>{FONTS}{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::selection{background:${P.blueSoft}}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:${P.bg}}
        ::-webkit-scrollbar-thumb{background:${P.blueSoft};border-radius:3px}
        @keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(3deg)}}
        @keyframes floatB{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(-2deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .hero-title span{
          background:linear-gradient(135deg,${P.red},${P.blue},${P.orange},${P.red});
          background-size:300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
          animation:shimmer 4s linear infinite}
        .nav-link{color:${P.sub};font-size:14px;font-weight:500;cursor:pointer;
          text-decoration:none;transition:color .2s;padding:6px 0}
        .nav-link:hover{color:${P.blue}}
        .card-hover{transition:transform .25s ease,box-shadow .25s ease}
        .card-hover:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(26,79,191,.12)}
        .btn-primary{background:linear-gradient(135deg,${P.blue},${P.red});color:white;border:none;
          border-radius:50px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;transition:transform .2s,box-shadow .2s;
          box-shadow:0 8px 24px rgba(26,79,191,.25)}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(26,79,191,.35)}
        .btn-outline{background:transparent;color:${P.blue};border:1.5px solid ${P.blue};
          border-radius:50px;padding:13px 28px;font-size:14px;font-weight:600;cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .btn-outline:hover{background:${P.bluePale}}
        @media(max-width:768px){
          .hero-grid{flex-direction:column!important}
          .hero-cards{display:none!important}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .levels-grid{grid-template-columns:1fr 1fr!important}
          .materials-grid{grid-template-columns:1fr 1fr!important}
          .contact-grid{grid-template-columns:1fr!important}
          .about-grid{grid-template-columns:1fr!important}
          .faq-grid{grid-template-columns:1fr!important}
          .desktop-nav{display:none!important}
        }
      `}</style>

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <nav style={{ position:"sticky",top:0,zIndex:100,
        background:"rgba(250,251,255,0.88)",backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${P.border}`,
        padding:"0 max(24px,calc((100vw - 1200px)/2))",
        display:"flex",alignItems:"center",height:64,gap:16 }}>

        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:10,flex:1 }}>
          <div style={{ display:"flex",gap:3,height:22 }}>
            {[P.red,P.blue,P.orange].map((c,i)=>(
              <div key={i} style={{ width:7,height:"100%",borderRadius:2,background:c,opacity:.85 }}/>
            ))}
          </div>
          <span style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,
            color:P.text,letterSpacing:-.3 }}>
            Arm<span style={{ color:P.red }}>Exam</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display:"flex",alignItems:"center",gap:28 }}>
          {Array.isArray(nav) && nav.map((n,i)=>(
            <span key={i} className="nav-link"
              onClick={()=>scrollTo(["about","levels","stats","faq"][i])}>
              {n}
            </span>
          ))}
        </div>

        {/* Lang + auth */}
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ display:"flex",gap:2,background:P.border,borderRadius:20,padding:3 }}>
            {Object.entries(LANGS).map(([k,v])=>(
              <button key={k} onClick={()=>setLang(k)} style={{
                background:currentLang===k?P.white:"transparent",
                color:currentLang===k?P.blue:P.muted,
                border:"none",borderRadius:16,padding:"4px 10px",
                fontSize:11,fontWeight:600,cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all .2s",
                boxShadow:currentLang===k?"0 1px 4px rgba(0,0,0,.08)":"none" }}>
                {v}
              </button>
            ))}
          </div>
          <button className="btn-outline" style={{ padding:"8px 18px",fontSize:13 }}
            onClick={onLogin}>{t("landing.login")}</button>
          <button className="btn-primary" style={{ padding:"9px 20px",fontSize:13 }}
            onClick={onRegister}>{t("landing.cta")}</button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{ padding:"80px max(24px,calc((100vw - 1200px)/2)) 0",
        position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-80,right:-120,width:500,height:500,borderRadius:"50%",
          background:`radial-gradient(circle,${P.bluePale} 0%,transparent 70%)`,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",bottom:-60,left:-80,width:400,height:400,borderRadius:"50%",
          background:`radial-gradient(circle,${P.orangePale} 0%,transparent 70%)`,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",top:60,right:80,animation:"float 6s ease-in-out infinite",
          display:"flex",flexDirection:"column",gap:4,opacity:.2 }}>
          {[P.red,P.blue,P.orange].map((c,i)=>(
            <div key={i} style={{ width:120,height:8,borderRadius:4,background:c }}/>
          ))}
        </div>

        <div className="hero-grid" style={{ display:"flex",alignItems:"center",gap:60,paddingBottom:80 }}>
          <div style={{ flex:1,animation:"fadeUp .8s ease both" }}>
            <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:P.bluePale,
              border:`1px solid ${P.blueSoft}`,borderRadius:20,padding:"6px 14px",
              fontSize:12,fontWeight:600,color:P.blue,marginBottom:24 }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:P.blue,
                display:"inline-block" }}/>
              A1 · A2 · B1 · B2 · C1 · C2
            </div>
            <h1 className="hero-title" style={{ fontFamily:"'Fraunces',serif",lineHeight:1.1,
              fontSize:"clamp(40px,5.5vw,72px)",fontWeight:700,marginBottom:24,letterSpacing:-1 }}>
              {Array.isArray(hero) ? <>
                {hero[0]}<br/>
                <span>{hero[1]}</span><br/>
                {hero[2]}
              </> : t("landing.hero.0")}
            </h1>
            <p style={{ fontSize:16,color:P.sub,lineHeight:1.75,maxWidth:520,marginBottom:36 }}>
              {t("landing.heroSub")}
            </p>
            <div style={{ display:"flex",gap:14,flexWrap:"wrap" }}>
              <button className="btn-primary" onClick={onRegister}>{t("landing.cta")}</button>
              <button className="btn-outline" onClick={()=>scrollTo("about")}>
                {t("landing.learnMore")} →
              </button>
            </div>
          </div>

          <div className="hero-cards" style={{ flex:"0 0 400px",display:"grid",
            gridTemplateColumns:"1fr 1fr",gap:16,
            animation:"fadeUp .8s .2s ease both",opacity:0,animationFillMode:"forwards" }}>
            {Array.isArray(stats) && stats.map(([num,label],i)=>{
              const colors=[[P.red,P.redPale],[P.blue,P.bluePale],[P.orange,P.orangePale],[P.blue,P.bluePale]];
              const [c,bg]=colors[i];
              return (
                <div key={i} className="card-hover" style={{ background:bg,borderRadius:20,
                  padding:"24px 20px",border:`1px solid ${c}22` }}>
                  <div style={{ fontFamily:"'Fraunces',serif",fontSize:36,fontWeight:700,
                    color:c,lineHeight:1,marginBottom:6 }}>
                    <Counter target={num}/>
                  </div>
                  <div style={{ fontSize:12,color:P.sub,lineHeight:1.4 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
        <svg viewBox="0 0 1440 60" style={{ display:"block",marginBottom:-2 }}>
          <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill={P.white}/>
        </svg>
      </div>

      {/* ── About ─────────────────────────────────────────────────────── */}
      <Section id="about" style={{ background:P.white,padding:"80px max(24px,calc((100vw - 1200px)/2))" }}>
        <div className="about-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
              color:P.red,marginBottom:12 }}>{t("landing.aboutBadge")}</div>
            <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:40,fontWeight:700,
              lineHeight:1.2,marginBottom:20,color:P.text }}>{t("landing.aboutTitle")}</h2>
            <p style={{ fontSize:15,color:P.sub,lineHeight:1.8,marginBottom:28 }}>
              {t("landing.aboutText")}
            </p>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {Array.isArray(skills) && skills.map((s,i)=>(
                <span key={i} style={{ background:P.bluePale,border:`1px solid ${P.blueSoft}`,
                  borderRadius:20,padding:"7px 16px",fontSize:13,color:P.blue,fontWeight:500 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {Array.isArray(cefr) && cefr.map(([code,name,pct],i)=>(
              <div key={code} style={{ display:"flex",alignItems:"center",gap:12 }}>
                <span style={{ fontFamily:"'Fraunces',serif",fontSize:13,fontWeight:700,
                  color:LEVEL_COLORS[i],width:24,flexShrink:0 }}>{code}</span>
                <div style={{ flex:1,height:8,background:LEVEL_COLORS[i]+"18",borderRadius:4,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:pct+"%",background:LEVEL_COLORS[i],
                    borderRadius:4,transition:"width 1.2s ease" }}/>
                </div>
                <span style={{ fontSize:12,color:P.muted,width:110,textAlign:"right" }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Levels ────────────────────────────────────────────────────── */}
      <Section id="levels" style={{ padding:"80px max(24px,calc((100vw - 1200px)/2))",background:P.bg }}>
        <div style={{ textAlign:"center",marginBottom:48 }}>
          <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
            color:P.blue,marginBottom:12 }}>{t("landing.levelsBadge")}</div>
          <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:40,fontWeight:700,color:P.text }}>
            {t("landing.levelsTitle")}
          </h2>
        </div>
        <div className="levels-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20 }}>
          {Array.isArray(levels) && levels.map((lv,i)=>(
            <div key={lv.code} className="card-hover" style={{ background:P.white,borderRadius:20,
              padding:"28px 24px",border:`1px solid ${LEVEL_COLORS[i]}22`,
              borderTop:`3px solid ${LEVEL_COLORS[i]}` }}>
              <div style={{ fontFamily:"'Fraunces',serif",fontSize:32,fontWeight:700,
                color:LEVEL_COLORS[i],marginBottom:4 }}>{lv.code}</div>
              <div style={{ fontSize:15,fontWeight:600,color:P.text,marginBottom:6 }}>{lv.name}</div>
              <div style={{ fontSize:13,color:P.sub,lineHeight:1.6 }}>{lv.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <Section id="stats" style={{ background:P.white,padding:"80px max(24px,calc((100vw - 1200px)/2))" }}>
        <div style={{ textAlign:"center",marginBottom:48 }}>
          <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
            color:P.orange,marginBottom:12 }}>{t("landing.statsBadge")}</div>
          <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:40,fontWeight:700,color:P.text }}>
            {t("landing.statsTitle")}
          </h2>
        </div>
        <div style={{ background:P.bg,borderRadius:24,padding:"36px 40px",border:`1px solid ${P.border}` }}>
          <div style={{ marginBottom:8,fontSize:13,color:P.muted }}>{t("landing.statsSub")}</div>
          <BarChart labels={Array.isArray(sMonths)?sMonths:[]}/>
          <div className="stats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",
            gap:16,marginTop:32 }}>
            {Array.isArray(sCards) && sCards.map((s,i)=>{
              const c=[P.blue,P.red,P.orange,P.blue][i];
              return (
                <div key={i} style={{ textAlign:"center",background:P.white,borderRadius:16,
                  padding:"20px 12px",border:`1px solid ${P.border}` }}>
                  <div style={{ fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:700,color:c }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize:12,color:P.muted,marginTop:4 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Materials ─────────────────────────────────────────────────── */}
      <Section style={{ background:P.bg,padding:"80px max(24px,calc((100vw - 1200px)/2))" }}>
        <div style={{ textAlign:"center",marginBottom:48 }}>
          <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
            color:P.red,marginBottom:12 }}>{t("landing.materialsBadge")}</div>
          <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:40,fontWeight:700,color:P.text }}>
            {t("landing.materialsTitle")}
          </h2>
        </div>
        <div className="materials-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20 }}>
          {Array.isArray(mats) && mats.map((m,i)=>{
            const c=[P.blue,P.red,P.orange,P.blue][i];
            return (
              <div key={i} className="card-hover" style={{ background:P.white,borderRadius:20,
                padding:"28px 24px",border:`1px solid ${P.border}`,textAlign:"center" }}>
                <div style={{ fontSize:36,marginBottom:14 }}>{m.icon}</div>
                <div style={{ fontSize:15,fontWeight:600,color:P.text,marginBottom:8 }}>{m.title}</div>
                <div style={{ fontSize:13,color:P.sub,lineHeight:1.6 }}>{m.desc}</div>
                <div style={{ marginTop:16,height:3,borderRadius:2,background:c+"44" }}/>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <Section id="faq" style={{ background:P.white,padding:"80px max(24px,calc((100vw - 1200px)/2))" }}>
        <div className="faq-grid" style={{ display:"grid",gridTemplateColumns:"1fr 2fr",gap:64,alignItems:"start" }}>
          <div>
            <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
              color:P.blue,marginBottom:12 }}>{t("landing.faqBadge")}</div>
            <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:36,fontWeight:700,
              color:P.text,lineHeight:1.2 }}>{t("landing.faqTitle")}</h2>
            <div style={{ marginTop:28,display:"flex",flexDirection:"column",gap:8 }}>
              {[P.red,P.blue,P.orange].map((c,i)=>(
                <div key={i} style={{ width:40,height:4,borderRadius:2,background:c,opacity:.6 }}/>
              ))}
            </div>
          </div>
          <div>
            {Array.isArray(faqs) && faqs.map((f,i)=>(
              <FaqItem key={i} q={f.q} a={f.a}/>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <Section style={{ background:P.bg,padding:"80px max(24px,calc((100vw - 1200px)/2))" }}>
        <div style={{ background:`linear-gradient(135deg,${P.bluePale},${P.redPale})`,
          borderRadius:32,padding:"60px 48px",border:`1px solid ${P.border}` }}>
          <div className="contact-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:64 }}>
            <div>
              <div style={{ fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
                color:P.red,marginBottom:12 }}>{t("landing.contactBadge")}</div>
              <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:36,fontWeight:700,
                color:P.text,marginBottom:16 }}>{t("landing.contactTitle")}</h2>
              <p style={{ fontSize:14,color:P.sub,lineHeight:1.7,marginBottom:28 }}>
                {t("landing.contactSub")}
              </p>
              {[["📧","info@armexam.am"],["📞","+374 10 00 00 00"],["📍","Yerevan, Armenia"]].map(([ic,v],i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:12,
                  marginBottom:12,fontSize:14,color:P.text }}>
                  <span style={{ fontSize:18 }}>{ic}</span>{v}
                </div>
              ))}
            </div>
            <div>
              {contactSent ? (
                <div style={{ background:P.white,borderRadius:20,padding:"48px 32px",
                  textAlign:"center",boxShadow:"0 8px 32px rgba(26,79,191,.08)" }}>
                  <div style={{ fontSize:52,marginBottom:16 }}>✅</div>
                  <div style={{ fontFamily:"'Fraunces',serif",fontSize:22,color:P.blue }}>
                    {t("landing.sent")}
                  </div>
                  <div style={{ fontSize:13,color:P.sub,marginTop:8 }}>{t("landing.sentSub")}</div>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  {[t("landing.namePh"),t("landing.emailPh")].map((ph,i)=>(
                    <input key={i} placeholder={ph} style={{ background:P.white,
                      border:`1.5px solid ${P.border}`,borderRadius:12,padding:"14px 18px",
                      fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif",color:P.text,
                      outline:"none",transition:"border-color .2s" }}
                      onFocus={e=>e.target.style.borderColor=P.blue}
                      onBlur={e=>e.target.style.borderColor=P.border}/>
                  ))}
                  <textarea placeholder={t("landing.msgPh")} rows={4} style={{ background:P.white,
                    border:`1.5px solid ${P.border}`,borderRadius:12,padding:"14px 18px",
                    fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif",color:P.text,
                    outline:"none",resize:"vertical",transition:"border-color .2s" }}
                    onFocus={e=>e.target.style.borderColor=P.blue}
                    onBlur={e=>e.target.style.borderColor=P.border}/>
                  <button className="btn-primary" style={{ alignSelf:"flex-start" }}
                    onClick={()=>setContactSent(true)}>
                    {t("landing.send")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ background:P.text,
        padding:"32px max(24px,calc((100vw - 1200px)/2))",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexWrap:"wrap",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ display:"flex",gap:3 }}>
            {[P.red,P.blue,P.orange].map((c,i)=>(
              <div key={i} style={{ width:6,height:18,borderRadius:2,background:c,opacity:.8 }}/>
            ))}
          </div>
          <span style={{ fontFamily:"'Fraunces',serif",fontSize:16,color:"rgba(255,255,255,.9)" }}>
            ArmExam
          </span>
        </div>
        <span style={{ fontSize:12,color:"rgba(255,255,255,.4)",
          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          {t("landing.footer")}
        </span>
        <div style={{ display:"flex",gap:16 }}>
          {Array.isArray(nav) && nav.map((n,i)=>(
            <span key={i} style={{ fontSize:12,color:"rgba(255,255,255,.5)",cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif" }}
              onClick={()=>scrollTo(["about","levels","stats","faq"][i])}>
              {n}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
