import { useState, useEffect, useRef } from "react";

// ── Armenian flag palette — pastel & refined ──────────────────────────────────
const P = {
  red:    "#E8002D",   redPale:   "#FFF0F3",   redSoft:  "#FFD6DE",
  blue:   "#1A4FBF",  bluePale:  "#EEF3FF",   blueSoft: "#C8D8FF",
  orange: "#F5A623",  orangePale:"#FFF8EC",   orangeSoft:"#FFE4A8",
  bg:     "#FAFBFF",
  text:   "#1A2140",
  sub:    "#4A5480",
  muted:  "#8A92B0",
  white:  "#FFFFFF",
  card:   "#FFFFFF",
  border: "#E8EBF8",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');`;

const LANGS = { en: "EN", ru: "RU", hy: "ՀԱՅ" };

const COPY = {
  en: {
    nav:    ["About", "Exams", "Results", "FAQ"],
    hero:   ["The Standard for", "Armenian Language", "Certification"],
    heroSub:"Internationally recognized proficiency exams for A1–C2. Trusted by universities, employers, and government institutions across Armenia.",
    cta:    "Register Now",
    login:  "Sign In",
    stats:  [["12,400+","Certified graduates"],["94%","Pass rate 2024"],["6","Proficiency levels"],["48","Exam centers"]],
    aboutTitle: "What is ArmExam?",
    aboutText:  "ArmExam is Armenia's premier Armenian language proficiency testing platform. Our computer-based exams evaluate Reading, Listening, Writing, and Speaking across the full CEFR scale — from beginner A1 to advanced C2.",
    levelsTitle:"Proficiency Levels",
    levels: [
      {code:"A1",name:"Beginner",    desc:"Basic words and phrases",       color:P.orange},
      {code:"A2",name:"Elementary",  desc:"Simple everyday expressions",   color:P.orange},
      {code:"B1",name:"Intermediate",desc:"Clear standard language",       color:P.blue},
      {code:"B2",name:"Upper-Inter.",desc:"Complex texts and discussion",  color:P.blue},
      {code:"C1",name:"Advanced",    desc:"Fluent, spontaneous use",       color:P.red},
      {code:"C2",name:"Mastery",     desc:"Full command of the language",  color:P.red},
    ],
    statsTitle: "2024 Statistics",
    statsChart: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    materialsTitle:"Study Materials",
    materials:[
      {icon:"📖", title:"Sample Tests",    desc:"Official practice exams for each level"},
      {icon:"🎧", title:"Listening Bank",  desc:"Audio materials for Listening prep"},
      {icon:"✍",  title:"Writing Guides",  desc:"Essay templates and scoring rubrics"},
      {icon:"🎤", title:"Speaking Tips",   desc:"Preparation strategies and sample tasks"},
    ],
    faqTitle:"Frequently Asked Questions",
    faqs:[
      {q:"How long is the exam?",          a:"Exams range from 60 to 120 minutes depending on the level. All sections — Reading, Listening, Writing, and Speaking — are completed in one session."},
      {q:"Where can I take the exam?",     a:"Exams are held at certified ArmExam centers across Armenia. Check our centers page for locations and schedules."},
      {q:"How soon are results available?",a:"Automated sections (Reading, Listening) are graded instantly. Writing and Speaking results are available within 5 business days."},
      {q:"Is the certificate recognized?", a:"ArmExam certificates are recognized by universities, public institutions, and employers throughout Armenia and the Armenian diaspora."},
      {q:"Can I retake the exam?",         a:"Yes. You may retake the exam after a 30-day waiting period. There is no limit on the number of attempts."},
    ],
    contactTitle:"Contact Us",
    contactSub:  "Have a question? Our team responds within 24 hours.",
    namePh:"Your full name", emailPh:"Email address", msgPh:"Your message…",
    send:"Send Message",
    footer:"© 2025 ArmExam. All rights reserved.",
  },
  ru: {
    nav:    ["О нас", "Экзамены", "Результаты", "FAQ"],
    hero:   ["Стандарт армянского", "языкового", "сертифицирования"],
    heroSub:"Международно признанные экзамены по уровням A1–C2. Результатам доверяют университеты, работодатели и государственные учреждения Армении.",
    cta:    "Зарегистрироваться",
    login:  "Войти",
    stats:  [["12 400+","Сертифицировано"],["94%","Успешных в 2024"],["6","Уровней знаний"],["48","Центров"]],
    aboutTitle:"Что такое ArmExam?",
    aboutText: "ArmExam — ведущая платформа тестирования армянского языка. Наши экзамены оценивают чтение, аудирование, письмо и говорение по всей шкале CEFR — от начального A1 до продвинутого C2.",
    levelsTitle:"Уровни владения языком",
    levels:[
      {code:"A1",name:"Начинающий",    desc:"Базовые слова и фразы",          color:P.orange},
      {code:"A2",name:"Элементарный",  desc:"Простые повседневные выражения", color:P.orange},
      {code:"B1",name:"Средний",       desc:"Понятный стандартный язык",      color:P.blue},
      {code:"B2",name:"Выше среднего", desc:"Сложные тексты и обсуждения",    color:P.blue},
      {code:"C1",name:"Продвинутый",   desc:"Свободное спонтанное общение",   color:P.red},
      {code:"C2",name:"Мастерство",    desc:"Полное владение языком",         color:P.red},
    ],
    statsTitle:"Статистика 2024",
    statsChart:["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"],
    materialsTitle:"Учебные материалы",
    materials:[
      {icon:"📖", title:"Образцы тестов",    desc:"Официальные практические экзамены"},
      {icon:"🎧", title:"Аудиотека",          desc:"Материалы для подготовки к аудированию"},
      {icon:"✍",  title:"Руководства",        desc:"Шаблоны эссе и критерии оценивания"},
      {icon:"🎤", title:"Советы по говорению",desc:"Стратегии подготовки и примеры задач"},
    ],
    faqTitle:"Часто задаваемые вопросы",
    faqs:[
      {q:"Сколько длится экзамен?",          a:"От 60 до 120 минут в зависимости от уровня. Все разделы проходят в одной сессии."},
      {q:"Где можно сдать экзамен?",         a:"Экзамены проводятся в сертифицированных центрах ArmExam по всей Армении."},
      {q:"Когда готовы результаты?",          a:"Автоматические разделы оцениваются мгновенно. Результаты письма и говорения — в течение 5 рабочих дней."},
      {q:"Признается ли сертификат?",        a:"Сертификаты ArmExam признаются университетами и работодателями по всей Армении."},
      {q:"Можно ли пересдать экзамен?",      a:"Да, повторная сдача возможна через 30 дней. Количество попыток не ограничено."},
    ],
    contactTitle:"Свяжитесь с нами",
    contactSub:  "Наша команда отвечает в течение 24 часов.",
    namePh:"Ваше имя", emailPh:"Электронная почта", msgPh:"Ваше сообщение…",
    send:"Отправить",
    footer:"© 2025 ArmExam. Все права защищены.",
  },
  hy: {
    nav:    ["Մեր մասին", "Քննություններ", "Արդյունքներ", "ՀՏՀ"],
    hero:   ["Հայերենի", "գնահատման", "ստանդարտ"],
    heroSub:"Միջազգայնորեն ճանաչված A1–C2 մակարդակի քննություններ։ Վստահում են Հայաստանի համալսարանները, գործատուները եւ պետական կառույցները։",
    cta:    "Գրանցվել",
    login:  "Մուտք",
    stats:  [["12 400+","Հավաստագրված"],["94%","Հաջողություն 2024"],["6","Մակարդակ"],["48","Կենտրոն"]],
    aboutTitle:"Ի՞նչ է ArmExam-ը",
    aboutText: "ArmExam-ը Հայաստանի հայերենի իմացության գնահատման առաջատար հարթակն է։ Մեր քննություններն արժևորում են ընթերցումը, լսումը, գրելը եւ խոսելը CEFR-ի ամբողջ սանդղակով՝ A1-ից C2:",
    levelsTitle:"Տիրապետման մակարդակները",
    levels:[
      {code:"A1",name:"Սկսնակ",        desc:"Հիմնական բառեր եւ արտահայտություններ", color:P.orange},
      {code:"A2",name:"Տարրական",      desc:"Պարզ առօրյա արտահայտություններ",       color:P.orange},
      {code:"B1",name:"Միջին",          desc:"Հստակ ստանդարտ լեզու",                color:P.blue},
      {code:"B2",name:"Բարձր-միջին",   desc:"Բարդ տեքստեր եւ քննարկումներ",        color:P.blue},
      {code:"C1",name:"Առաջադեմ",      desc:"Ազատ ինքնաբուխ հաղորդակցություն",    color:P.red},
      {code:"C2",name:"Տիրապետում",    desc:"Լեզվի լրիվ տիրապետում",               color:P.red},
    ],
    statsTitle:"2024 թ. վիճակագրություն",
    statsChart:["Հնվ","Փտр","Մրտ","Ապр","Մյс","Հնս","Հлс","Ogs","ספт","Հкт","Nvb","Dkт"],
    materialsTitle:"Ուսումնական նյութեր",
    materials:[
      {icon:"📖", title:"Նմուշ թեստեր",      desc:"Պաշտոնական գործնական քննություններ"},
      {icon:"🎧", title:"Լսողականի բանկ",    desc:"Լսողականի նախապատրաստման նյութեր"},
      {icon:"✍",  title:"Ուղեցույցներ",      desc:"Շարադրության ձեւանմուշ եւ չափանիշ"},
      {icon:"🎤", title:"Խոսքի խorհուրդներ", desc:"Պատրաստման ռազմավarություններ"},
    ],
    faqTitle:"Հաճախ տrվarող հarцеры",
    faqs:[
      {q:"Ինչq-ее длиtsya qnnutyunuh?", a:"60-idan 120 r. kerp aman katarelu."},
      {q:"Vortegh es кkatum qnnutyune?", a:"Bazmabнevam kentronnerum ev pahanjnakum ARMEXAM:"},
      {q:"Erb en patarastakume?",         a:"Avtomatacved bazhnerum anmijapes, grelu ev khoseluh ardhyunknere 5 aashat or:"},
      {q:"Chapavoragir-e cheratsvu?",     a:"Amenayn Hayastanum grancvum e:"},
      {q:"Kareli e kazmin qnnutyune?",    a:"Aye, 30 or kazmum. Qanakey skhmanvum e:"},
    ],
    contactTitle:"Կапс կацեq пенк",
    contactSub:  "Мер хамаратакутюне pataskhanume e 24 ерес intum:",
    namePh:"Анун Азганун", emailPh:"Электронаин фоста", msgPh:"Хогабанутюн…",
    send:"Ушарkel",
    footer:"© 2025 ArmExam. Бардзаграна парасовутюннере паhпанвад ен:",
  },
};

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const num = parseInt(target.replace(/[^0-9]/g, ""));
    const suffix = target.replace(/[0-9,\s]/g, "");
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
  return <span>{val || "0"}</span>;
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
const CHART_DATA = [42, 58, 71, 65, 83, 94, 88, 102, 118, 134, 127, 156];

function BarChart({ labels }) {
  const max = Math.max(...CHART_DATA);
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:120 }}>
      {CHART_DATA.map((v, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{
            flex: "none", width:"100%",
            height: Math.round((v / max) * 90) + "px",
            background: i % 3 === 0 ? P.red+"cc" : i % 3 === 1 ? P.blue+"cc" : P.orange+"cc",
            borderRadius:"4px 4px 0 0",
            transition:"height .8s cubic-bezier(.34,1.56,.64,1)",
            animationDelay: i * 50 + "ms",
          }} />
          <span style={{ fontSize:9, color:P.muted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a, delay }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom:`1px solid ${P.border}`,
      overflow:"hidden",
      animationDelay: delay + "ms",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"20px 0", background:"transparent", border:"none", cursor:"pointer",
        textAlign:"left",
      }}>
        <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:600,
          color:P.text, paddingRight:24 }}>{q}</span>
        <span style={{ fontSize:18, color:P.blue, flexShrink:0,
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          transition:"transform .3s ease", fontWeight:300 }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? "300px" : "0",
        overflow:"hidden",
        transition:"max-height .4s ease",
      }}>
        <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:P.sub,
          lineHeight:1.7, paddingBottom:20, margin:0 }}>{a}</p>
      </div>
    </div>
  );
}

// ── Section wrapper with fade-in ──────────────────────────────────────────────
function Section({ id, children, style = {} }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section id={id} ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(32px)",
      transition: "opacity .7s ease, transform .7s ease",
      ...style
    }}>
      {children}
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PublicLanding({ onLogin, onRegister }) {
  const [lang, setLang] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const T = COPY[lang] || COPY.en;

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });
    setMenuOpen(false);
  };

  return (
    <div style={{ background:P.bg, color:P.text, fontFamily:"'Plus Jakarta Sans',sans-serif",
      overflowX:"hidden", minHeight:"100vh" }}>
      <style>{FONTS}{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: ${P.blueSoft}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${P.bg}; }
        ::-webkit-scrollbar-thumb { background: ${P.blueSoft}; border-radius: 3px; }

        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-12px) rotate(-2deg); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(40px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .hero-title span {
          background: linear-gradient(135deg, ${P.red}, ${P.blue}, ${P.orange}, ${P.red});
          background-size: 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .nav-link {
          color: ${P.sub};
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: color .2s;
          padding: 6px 0;
        }
        .nav-link:hover { color: ${P.blue}; }
        .card-hover {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 48px rgba(26,79,191,0.12);
        }
        .btn-primary {
          background: linear-gradient(135deg, ${P.blue}, ${P.red});
          color: white;
          border: none;
          border-radius: 50px;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 8px 24px rgba(26,79,191,0.25);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(26,79,191,0.35);
        }
        .btn-outline {
          background: transparent;
          color: ${P.blue};
          border: 1.5px solid ${P.blue};
          border-radius: 50px;
          padding: 13px 28px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all .2s;
        }
        .btn-outline:hover {
          background: ${P.bluePale};
        }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .levels-grid { grid-template-columns: 1fr 1fr !important; }
          .materials-grid { grid-template-columns: 1fr 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav style={{
        position:"sticky", top:0, zIndex:100,
        background:"rgba(250,251,255,0.85)",
        backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${P.border}`,
        padding:"0 max(24px, calc((100vw - 1200px)/2))",
        display:"flex", alignItems:"center",
        height:64,
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
          <div style={{ display:"flex", gap:3, height:22 }}>
            {[P.red, P.blue, P.orange].map((c,i) => (
              <div key={i} style={{ width:7, height:"100%", borderRadius:2, background:c, opacity:.85 }} />
            ))}
          </div>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:P.text, letterSpacing:-.3 }}>
            Arm<span style={{ color:P.red }}>Exam</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display:"flex", alignItems:"center", gap:32 }}>
          {T.nav.map((n,i) => (
            <span key={i} className="nav-link" onClick={() => scrollTo(["about","levels","stats","faq"][i])}>
              {n}
            </span>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:32 }}>
          {/* Lang switcher */}
          <div style={{ display:"flex", gap:2, background:P.border, borderRadius:20, padding:3 }}>
            {Object.entries(LANGS).map(([k,v]) => (
              <button key={k} onClick={() => setLang(k)} style={{
                background: lang===k ? P.white : "transparent",
                color: lang===k ? P.blue : P.muted,
                border:"none", borderRadius:16, padding:"4px 10px",
                fontSize:11, fontWeight:600, cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                transition:"all .2s",
                boxShadow: lang===k ? "0 1px 4px rgba(0,0,0,.08)" : "none",
              }}>{v}</button>
            ))}
          </div>

          <button className="btn-outline" style={{ padding:"8px 18px", fontSize:13 }}
            onClick={onLogin}>{T.login}</button>
          <button className="btn-primary" style={{ padding:"9px 20px", fontSize:13 }}
            onClick={onRegister}>{T.cta}</button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div style={{ padding:"80px max(24px, calc((100vw - 1200px)/2)) 0",
        position:"relative", overflow:"hidden" }}>

        {/* Background decorations */}
        <div style={{ position:"absolute", top:-80, right:-120, width:500, height:500,
          borderRadius:"50%", background:`radial-gradient(circle, ${P.bluePale} 0%, transparent 70%)`,
          pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, left:-80, width:400, height:400,
          borderRadius:"50%", background:`radial-gradient(circle, ${P.orangePale} 0%, transparent 70%)`,
          pointerEvents:"none" }} />

        {/* Floating flag stripes */}
        <div style={{ position:"absolute", top:60, right:80, animation:"float 6s ease-in-out infinite",
          display:"flex", flexDirection:"column", gap:4, opacity:.25 }}>
          {[P.red, P.blue, P.orange].map((c,i) => (
            <div key={i} style={{ width:120, height:8, borderRadius:4, background:c }} />
          ))}
        </div>
        <div style={{ position:"absolute", bottom:100, left:40, animation:"floatB 8s ease-in-out infinite",
          display:"flex", flexDirection:"column", gap:3, opacity:.15 }}>
          {[P.orange, P.blue, P.red].map((c,i) => (
            <div key={i} style={{ width:80, height:6, borderRadius:3, background:c }} />
          ))}
        </div>

        <div className="hero-grid" style={{ display:"flex", alignItems:"center", gap:60, paddingBottom:80 }}>
          {/* Left */}
          <div style={{ flex:1, animation:"fadeUp .8s ease both" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:P.bluePale,
              border:`1px solid ${P.blueSoft}`, borderRadius:20, padding:"6px 14px",
              fontSize:12, fontWeight:600, color:P.blue, marginBottom:24 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:P.blue,
                display:"inline-block", animation:"floatB 2s infinite" }} />
              A1 · A2 · B1 · B2 · C1 · C2
            </div>

            <h1 className="hero-title" style={{ fontFamily:"'Fraunces',serif", lineHeight:1.1,
              fontSize:"clamp(40px, 5.5vw, 72px)", fontWeight:700, marginBottom:24,
              letterSpacing:-1 }}>
              {T.hero[0]}<br/>
              <span>{T.hero[1]}</span><br/>
              {T.hero[2]}
            </h1>

            <p style={{ fontSize:16, color:P.sub, lineHeight:1.75, maxWidth:520, marginBottom:36 }}>
              {T.heroSub}
            </p>

            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              <button className="btn-primary" onClick={onRegister}>{T.cta}</button>
              <button className="btn-outline" onClick={() => scrollTo("about")}>
                {lang === "hy" ? "More" : lang === "ru" ? "Узнать больше" : "Learn more"} →
              </button>
            </div>
          </div>

          {/* Right — stats cards */}
          <div style={{ flex:"0 0 400px", display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:16, animation:"fadeUp .8s .2s ease both", opacity:0,
            animationFillMode:"forwards" }}>
            {T.stats.map(([num, label], i) => {
              const colors = [[P.red, P.redPale], [P.blue, P.bluePale], [P.orange, P.orangePale], [P.blue, P.bluePale]];
              const [c, bg] = colors[i];
              return (
                <div key={i} className="card-hover" style={{
                  background:bg, borderRadius:20, padding:"24px 20px",
                  border:`1px solid ${c}22`,
                }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700,
                    color:c, lineHeight:1, marginBottom:6 }}>
                    <Counter target={num} />
                  </div>
                  <div style={{ fontSize:12, color:P.sub, lineHeight:1.4 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 1440 60" style={{ display:"block", marginBottom:-2 }}>
          <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
            fill={P.white} />
        </svg>
      </div>

      {/* ── About ───────────────────────────────────────────────────────── */}
      <Section id="about" style={{ background:P.white, padding:"80px max(24px, calc((100vw - 1200px)/2))" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase",
              color:P.red, marginBottom:12 }}>About ArmExam</div>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:700,
              lineHeight:1.2, marginBottom:20, color:P.text }}>{T.aboutTitle}</h2>
            <p style={{ fontSize:15, color:P.sub, lineHeight:1.8, marginBottom:28 }}>{T.aboutText}</p>

            {/* Skills row */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {["📖 Reading","🎧 Listening","✍ Writing","🎤 Speaking"].map((s,i) => (
                <span key={i} style={{ background:P.bluePale, border:`1px solid ${P.blueSoft}`,
                  borderRadius:20, padding:"7px 16px", fontSize:13, color:P.blue, fontWeight:500 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Visual — CEFR bar */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[["A1","Beginner",15,P.orange],["A2","Elementary",28,P.orange],
              ["B1","Intermediate",48,P.blue],["B2","Upper-Inter.",65,P.blue],
              ["C1","Advanced",82,P.red],["C2","Mastery",100,P.red]
            ].map(([code,name,pct,col]) => (
              <div key={code} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:700,
                  color:col, width:24, flexShrink:0 }}>{code}</span>
                <div style={{ flex:1, height:8, background:col+"18", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:pct+"%", background:col,
                    borderRadius:4, transition:"width 1.2s ease" }} />
                </div>
                <span style={{ fontSize:12, color:P.muted, width:90, textAlign:"right" }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Levels ──────────────────────────────────────────────────────── */}
      <Section id="levels" style={{ padding:"80px max(24px, calc((100vw - 1200px)/2))",
        background:P.bg }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase",
            color:P.blue, marginBottom:12 }}>CEFR Scale</div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:700, color:P.text }}>
            {T.levelsTitle}
          </h2>
        </div>
        <div className="levels-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
          {T.levels.map((lv, i) => (
            <div key={lv.code} className="card-hover" style={{
              background:P.white, borderRadius:20, padding:"28px 24px",
              border:`1px solid ${lv.color}22`,
              borderTop:`3px solid ${lv.color}`,
              animationDelay: i*80 + "ms",
            }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:700,
                color:lv.color, marginBottom:4 }}>{lv.code}</div>
              <div style={{ fontSize:15, fontWeight:600, color:P.text, marginBottom:6 }}>{lv.name}</div>
              <div style={{ fontSize:13, color:P.sub, lineHeight:1.6 }}>{lv.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Stats chart ─────────────────────────────────────────────────── */}
      <Section id="stats" style={{ background:P.white, padding:"80px max(24px, calc((100vw - 1200px)/2))" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase",
            color:P.orange, marginBottom:12 }}>Data</div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:700, color:P.text }}>
            {T.statsTitle}
          </h2>
        </div>

        <div style={{ background:P.bg, borderRadius:24, padding:"36px 40px", border:`1px solid ${P.border}` }}>
          <div style={{ marginBottom:8, fontSize:13, color:P.muted }}>
            Monthly exam sessions in 2024
          </div>
          <BarChart labels={T.statsChart} />

          {/* Mini stat pills */}
          <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
            gap:16, marginTop:32 }}>
            {[
              {label:"Total Exams", val:"1,842", color:P.blue},
              {label:"Passed",      val:"1,731", color:P.red},
              {label:"Avg Score",   val:"74%",   color:P.orange},
              {label:"New Centers", val:"6",      color:P.blue},
            ].map((s,i) => (
              <div key={i} style={{ textAlign:"center", background:P.white, borderRadius:16,
                padding:"20px 12px", border:`1px solid ${P.border}` }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:700,
                  color:s.color }}>{s.val}</div>
                <div style={{ fontSize:12, color:P.muted, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Study Materials ──────────────────────────────────────────────── */}
      <Section style={{ background:P.bg, padding:"80px max(24px, calc((100vw - 1200px)/2))" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase",
            color:P.red, marginBottom:12 }}>Preparation</div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:700, color:P.text }}>
            {T.materialsTitle}
          </h2>
        </div>
        <div className="materials-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20 }}>
          {T.materials.map((m,i) => {
            const accent = [P.blue, P.red, P.orange, P.blue][i];
            return (
              <div key={i} className="card-hover" style={{ background:P.white, borderRadius:20,
                padding:"28px 24px", border:`1px solid ${P.border}`, textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:14 }}>{m.icon}</div>
                <div style={{ fontSize:15, fontWeight:600, color:P.text, marginBottom:8 }}>{m.title}</div>
                <div style={{ fontSize:13, color:P.sub, lineHeight:1.6 }}>{m.desc}</div>
                <div style={{ marginTop:16, height:3, borderRadius:2, background:accent+"44" }} />
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" style={{ background:P.white, padding:"80px max(24px, calc((100vw - 1200px)/2))" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:64, alignItems:"start" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase",
              color:P.blue, marginBottom:12 }}>FAQ</div>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700,
              color:P.text, lineHeight:1.2 }}>{T.faqTitle}</h2>
            <div style={{ marginTop:28, display:"flex", flexDirection:"column", gap:8 }}>
              {[P.red, P.blue, P.orange].map((c,i) => (
                <div key={i} style={{ width:40, height:4, borderRadius:2, background:c, opacity:.6 }} />
              ))}
            </div>
          </div>
          <div>
            {T.faqs.map((f,i) => <FaqItem key={i} q={f.q} a={f.a} delay={i*60} />)}
          </div>
        </div>
      </Section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <Section style={{ background:P.bg, padding:"80px max(24px, calc((100vw - 1200px)/2))" }}>
        <div style={{ background:`linear-gradient(135deg, ${P.bluePale}, ${P.redPale})`,
          borderRadius:32, padding:"60px 48px", border:`1px solid ${P.border}` }}>
          <div className="contact-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:64 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase",
                color:P.red, marginBottom:12 }}>Contact</div>
              <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:700,
                color:P.text, marginBottom:16 }}>{T.contactTitle}</h2>
              <p style={{ fontSize:14, color:P.sub, lineHeight:1.7, marginBottom:28 }}>{T.contactSub}</p>

              {[["📧","info@armexam.am"],["📞","+374 10 00 00 00"],["📍","Yerevan, Armenia"]].map(([ic,v],i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                  marginBottom:12, fontSize:14, color:P.text }}>
                  <span style={{ fontSize:18 }}>{ic}</span>{v}
                </div>
              ))}
            </div>

            <div>
              {contactSent ? (
                <div style={{ background:P.white, borderRadius:20, padding:"48px 32px",
                  textAlign:"center", boxShadow:"0 8px 32px rgba(26,79,191,.08)" }}>
                  <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, color:P.blue }}>
                    Message sent!
                  </div>
                  <div style={{ fontSize:13, color:P.sub, marginTop:8 }}>We'll be in touch soon.</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[T.namePh, T.emailPh].map((ph,i) => (
                    <input key={i} placeholder={ph} style={{
                      background:P.white, border:`1.5px solid ${P.border}`,
                      borderRadius:12, padding:"14px 18px", fontSize:14,
                      fontFamily:"'Plus Jakarta Sans',sans-serif", color:P.text,
                      outline:"none", transition:"border-color .2s",
                    }} onFocus={e=>e.target.style.borderColor=P.blue}
                       onBlur={e=>e.target.style.borderColor=P.border} />
                  ))}
                  <textarea placeholder={T.msgPh} rows={4} style={{
                    background:P.white, border:`1.5px solid ${P.border}`,
                    borderRadius:12, padding:"14px 18px", fontSize:14,
                    fontFamily:"'Plus Jakarta Sans',sans-serif", color:P.text,
                    outline:"none", resize:"vertical", transition:"border-color .2s",
                  }} onFocus={e=>e.target.style.borderColor=P.blue}
                     onBlur={e=>e.target.style.borderColor=P.border} />
                  <button className="btn-primary" style={{ alignSelf:"flex-start" }}
                    onClick={() => setContactSent(true)}>{T.send}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ background:P.text, padding:"32px max(24px, calc((100vw - 1200px)/2))",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", gap:3 }}>
            {[P.red, P.blue, P.orange].map((c,i) => (
              <div key={i} style={{ width:6, height:18, borderRadius:2, background:c, opacity:.8 }} />
            ))}
          </div>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:16, color:"rgba(255,255,255,.9)" }}>
            ArmExam
          </span>
        </div>
        <span style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          {T.footer}
        </span>
        <div style={{ display:"flex", gap:16 }}>
          {T.nav.map((n,i) => (
            <span key={i} style={{ fontSize:12, color:"rgba(255,255,255,.5)", cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif" }}
              onClick={() => scrollTo(["about","levels","stats","faq"][i])}>
              {n}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
