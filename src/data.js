// ── Shared data store ─────────────────────────────────────────────────────────
// Single source of truth for questions, exams, students across all pages

export const LEVELS = ["A1","A2","B1","B2","C1","C2"];
export const LEVEL_COLORS = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" };

export const QUESTIONS = [
  // A1
  { id:1,  type:"single_choice", level:"A1", section:"Կարդալ",        points:1, text:"Ընտրի՛ր ճիշտ պատասխանը. «Ես ___ եմ»",
    options:["ուսանող","ուսանողի","ուսանողը","ուսանողին"], correct:0 },
  { id:2,  type:"single_choice", level:"A1", section:"Կարդալ",        points:1, text:"«Բարի լույս» — ե՞րբ ենք ասում",
    options:["երեկոյան","գիշերը","առավոտյան","կեսօրին"], correct:2 },
  { id:3,  type:"fill_blank",    level:"A1", section:"Գրել",           points:1, text:"Լրացրո՛ւ բաց թողածը. «Նա ___ է գնում» (դպրոց)", answer:"դպրոց" },
  { id:4,  type:"single_choice", level:"A1", section:"Քերականություն", points:1, text:"Ո՞ր բառն է անուն",
    options:["վազել","կանաչ","տուն","արագ"], correct:2 },
  { id:5,  type:"multi_choice",  level:"A1", section:"Բառապաշար",     points:1, text:"Ո՞ր բառերն են թվեր",
    options:["երկու","կարմիր","հինգ","մեծ","ութ"], correct:[0,2,4] },

  // A2
  { id:6,  type:"single_choice", level:"A2", section:"Կարդալ",        points:1, text:"Ընտրի՛ր ճիշտ ձևը. «Ես ___ դպրոց եմ գնում ամեն օր»",
    options:["դեպի","մոտ","կողքին","առաջ"], correct:0 },
  { id:7,  type:"single_choice", level:"A2", section:"Քերականություն", points:1, text:"Ո՞ր նախադասությունն է ճիշտ",
    options:["Ես գնացի խանութ","Ես խանութ եմ գնացի","Ես խանութ գնացի եմ","Ես եմ խանութ գնացի"], correct:0 },
  { id:8,  type:"fill_blank",    level:"A2", section:"Գրել",           points:1, text:"Լրացրո՛ւ. «Նա ամեն օր ___ է ուտում» (նախաճաշ)", answer:"նախաճաշ" },
  { id:9,  type:"multi_choice",  level:"A2", section:"Բառապաշար",     points:2, text:"Ո՞ր բառերն են կապված ընտանիքի հետ",
    options:["մայր","սեղան","հայր","լուսամուտ","քույր"], correct:[0,2,4] },
  { id:10, type:"single_choice", level:"A2", section:"Կարդալ",        points:1, text:"«Ես սիրում եմ երաժշտություն» — ի՞նչ է նշանակում",
    options:["I hate music","I love music","I hear music","I play music"], correct:1 },

  // B1
  { id:11, type:"multi_choice",  level:"B1", section:"Քերականություն", points:2, text:"Ո՞ր նախադասություններն են քերականորեն ճիշտ",
    options:["Նա գրքեր է կարդում","Ես երեկ կինո գնացի","Նրանք վաղը կգնան","Դու ճաշ ուտում ես արդեն"], correct:[0,1,2] },
  { id:12, type:"single_choice", level:"B1", section:"Կարդալ",        points:2, text:"Ո՞ր բառն է հոմանիշ «ուրախ»-ի",
    options:["տխուր","երջանիկ","հոգնած","բարկացած"], correct:1 },
  { id:13, type:"fill_blank",    level:"B1", section:"Գրել",           points:2, text:"Լրացրո՛ւ. «Եթե վաղը անձրև ___, ես տանը կմնամ» (գա)", answer:"գա" },
  { id:14, type:"multi_select",  level:"B1", section:"Բառապաշար",     points:2, text:"Ընտրի՛ր բոլոր բառերը, որոնք կապված են «եղանակ»-ի հետ",
    options:["արև","բժիշկ","անձրև","ձյուն","գիրք","քամի"], correct:[0,2,3,5] },
  { id:15, type:"single_choice", level:"B1", section:"Քերականություն", points:2, text:"Ո՞ր ձևն է ճիշտ. «Եթե ես ժամանակ ___, կկարդայի»",
    options:["ունեմ","ունենամ","ունեի","ունեցել եմ"], correct:2 },

  // B2
  { id:16, type:"multi_select",  level:"B2", section:"Բառապաշար",     points:3, text:"Ընտրի՛ր բոլոր բառերը, որոնք կապված են «ճամփորդություն»-ի հետ",
    options:["ինքնաթիռ","բժիշկ","կայարան","ճամպրուկ","դպրոց","անձնագիր"], correct:[0,2,3,5] },
  { id:17, type:"single_choice", level:"B2", section:"Կարդալ",        points:3, text:"Ո՞ր բառն է հականիշ «աղմկոտ»-ի",
    options:["բարձրաձայն","լուռ","ուժեղ","արագ"], correct:1 },
  { id:18, type:"multi_choice",  level:"B2", section:"Քերականություն", points:3, text:"Ո՞ր ձևերն են ճիշտ",
    options:["Նա ասաց, որ կգա","Ես չգիտեի, թե ինչ անեմ","Երբ տեսա, ուրախացա","Կուզեի, եթե կарողanayir"], correct:[0,1,2] },
  { id:19, type:"fill_blank",    level:"B2", section:"Գրել",           points:3, text:"Լրացրո՛ւ. «Չ___ կողմից ստացված նամակը հասավ ուշ» (սպաս)", answer:"սպասված" },
  { id:20, type:"writing",       level:"B2", section:"Ազատ շարադրություն", points:5, text:"Գրի՛ր 80-100 բառ թեմայով. «Ի՞նչ կփոխեի իմ քաղաքում»",
    minWords:80, maxWords:120 },

  // C1
  { id:21, type:"single_choice", level:"C1", section:"Կարդալ",        points:4, text:"Ո՞ր արտահայտությունն է ճիշտ գործածված",
    options:["Ջուրը քարը կոտրեց","Ջուրը քարը փորեց","Ջուրը քար կտրեց","Ջուրը քարին ծակ արեց"], correct:1 },
  { id:22, type:"multi_choice",  level:"C1", section:"Քերականություն", points:4, text:"Ո՞ր նախադասություններն են ոճական առումով ճիշտ",
    options:["Հանդիպումը կայացավ երեկ","Ժողովը տեղի ունեցավ","Նա ելույթ ունեցավ","Ես ասացի"], correct:[0,1,2] },
  { id:23, type:"fill_blank",    level:"C1", section:"Գրել",           points:4, text:"Լրացրո՛ւ դարձվածքը. «Ոսկե ___ ունի» (ձեռքեր)", answer:"ձեռքեր" },
  { id:24, type:"multi_select",  level:"C1", section:"Բառապաշար",     points:4, text:"Ո՞ր բառերն են բարձր ոճի",
    options:["ակնկալել","ուզել","հայցել","ասել","հայտնել","ճռճռալ"], correct:[0,2,4] },
  { id:25, type:"writing",       level:"C1", section:"Ազատ շարադրություն", points:8, text:"Գրի՛ր 120-150 բառ. «Ժամանակակից հայերենի մարտահրավերները»",
    minWords:120, maxWords:180 },

  // C2
  { id:26, type:"single_choice", level:"C2", section:"Կարդալ",        points:5, text:"Ո՞ր բառն է ճշգրիտ. «Հեղինակը ___ ոճ է գործածել» (պատկերավոր)",
    options:["փոխաբերական","ուղիղ","բառացի","զգացմունքային"], correct:0 },
  { id:27, type:"multi_choice",  level:"C2", section:"Քերականություն", points:5, text:"Ո՞ր նախադասություններն են ճիշտ կազմված",
    options:["Այն, ինչ ասացիր, ճշմարիտ է","Ով ջանա՝ կհասնի","Ուր գնաս, ես կգամ","Թեեւ հոգնած էր, շարունակեց"], correct:[0,1,2,3] },
  { id:28, type:"fill_blank",    level:"C2", section:"Գրել",           points:5, text:"Լրացրո՛ւ. «___ չէ, ով բոլորին հաճոյանա» (մարդ)", answer:"մարդ" },
  { id:29, type:"multi_select",  level:"C2", section:"Բառապաշար",     points:5, text:"Ո՞ր բառերն են արխաիզմներ",
    options:["շնորհ","ոգի","յուր","նա","ահա","ես"], correct:[2] },
  { id:30, type:"writing",       level:"C2", section:"Ազատ շարադրություն", points:10, text:"Գրի՛ր 150-200 բառ. «Գրականության դերը ազգային ինքնության պահպանման մեջ»",
    minWords:150, maxWords:220 },

  // Word Bank examples
  { id:31, type:"fill_wordbank", level:"A2", section:"Քերականություն", points:2,
    text:"Տեղադրի՛ր բառերը ճիշտ տեղերում:",
    segments:[
      { type:"text",  content:"Ես ամեն օր " },
      { type:"blank", id:0 },
      { type:"text",  content:" դպրոց եմ գնում " },
      { type:"blank", id:1 },
      { type:"text",  content:" ավտոբուսով:" },
    ],
    wordBank:["առավոտյան","դեպի","երեկոյան","կողքին"],
    correct:[1, 0],
  },
  { id:32, type:"fill_wordbank", level:"B1", section:"Բառապաշար", points:3,
    text:"Լրացրո՛ւ նախադասությունները ճիշտ բառերով:",
    segments:[
      { type:"text",  content:"Երկիրը " },
      { type:"blank", id:0 },
      { type:"text",  content:" ունի, իսկ մայրաքաղաքը " },
      { type:"blank", id:1 },
      { type:"text",  content:" է:" },
    ],
    wordBank:["Երևան","լեռներ","ծով","Թբիլիսի"],
    correct:[1, 0],
  },
  // ── Audio questions ──────────────────────────────────────────────────────────
  { id:33, type:"audio", level:"A2", section:"Լսել", points:2,
    text:"Լսի՛ր ձայնագրությունը և ընտրի՛ր ճիշտ պատասխանը. Ո՞ւր է գնում խոսողը:",
    audioSrc:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    maxPlays:2, pauseSeconds:10,
    options:["Դպրոց","Խանութ","Բժիշկ","Կայարան"],
    correct:0, status:"published", createdAt:"2025-04-01" },

  { id:34, type:"audio", level:"B1", section:"Լսել", points:3,
    text:"Լսի՛ր երկխոսությունը. Ի՞նչ է ուզում գնել Արամը:",
    audioSrc:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    maxPlays:2, pauseSeconds:15,
    options:["Գիրք","Հագուստ","Սնունդ","Նվեր"],
    correct:2, status:"published", createdAt:"2025-04-02" },

  // ── Video questions ──────────────────────────────────────────────────────────
  { id:35, type:"video", level:"B2", section:"Լսել / Տեսնել", points:4,
    text:"Դիտի՛ր հատվածը. Ո՞ր թեմայի մասին է պատմում բանախոսը:",
    videoSrc:"https://www.w3schools.com/html/mov_bbb.mp4",
    maxPlays:1,
    options:["Բնապահպանություն","Տնտեսություն","Կրթություն","Մշակույթ"],
    correct:0, status:"published", createdAt:"2025-04-03" },

  { id:36, type:"video", level:"C1", section:"Լսել / Տեսնել", points:5,
    text:"Դիտի՛ր հարցազրույցը. Ի՞նչ խնդիր է բարձրացնում հյուրը:",
    videoSrc:"https://www.w3schools.com/html/movie.mp4",
    maxPlays:1,
    options:["Լեզվի պահպանում","Տեխնոլոգիա","Սպորտ","Արվեստ"],
    correct:0, status:"published", createdAt:"2025-04-04" },

  // ── Voice (recording) questions ──────────────────────────────────────────────
  { id:37, type:"voice", level:"B1", section:"Խոսել", points:3,
    text:"Ձայնագրի՛ր պատասխանդ. «Պատմի՛ր քո սիրած տոնի մասին» (30–60 վրկյան).",
    maxSeconds:60, minSeconds:15, maxAttempts:2,
    status:"published", createdAt:"2025-04-05" },

  { id:38, type:"voice", level:"C1", section:"Խոսել", points:5,
    text:"Ձայնագրի՛ր. «Ի՞նչ կմնտեիր զամանակակիչ հայերենի զարգացման մասին» (45–90 վրկյան).",
    maxSeconds:90, minSeconds:30, maxAttempts:2,
    status:"published", createdAt:"2025-04-06" },
];

export const STUDENTS = [
  { id:1, name:"Անի Հակոբյան",   email:"ani@example.am",    group:"Խ-101", level:"B1", status:"active" },
  { id:2, name:"Արամ Պետրոսյան", email:"aram@example.am",   group:"Խ-101", level:"A2", status:"active" },
  { id:3, name:"Մարինե Գ.",      email:"marine@example.am", group:"Խ-102", level:"B2", status:"active" },
  { id:4, name:"Դավիթ Ս.",       email:"davit@example.am",  group:"Խ-102", level:"C1", status:"active" },
  { id:5, name:"Նարեկ Ավ.",      email:"narek@example.am",  group:"Խ-103", level:"A1", status:"inactive" },
  { id:6, name:"Լուսինե Կ.",     email:"lusine@example.am", group:"Խ-103", level:"B1", status:"active" },
  { id:7, name:"Վահե Մ.",        email:"vahe@example.am",   group:"Խ-101", level:"A2", status:"active" },
  { id:8, name:"Հայկ Ա.",        email:"hayk@example.am",   group:"Խ-102", level:"B2", status:"active" },
];

export const EXAMS = [
  { id:1, title:"Summer B1 Examination",  examType:"fixed",     level:"B1", duration:45,  passingScore:70, shuffle:true,  showResults:true,  questionIds:[11,12,13,14,15,6,7], assignedTo:[1,2,7], status:"active",    startDate:"2025-06-01", endDate:"2025-09-30", createdAt:"2025-05-15" },
  { id:2, title:"A2 Entrance Test",        examType:"fixed",     level:"A2", duration:30,  passingScore:60, shuffle:false, showResults:true,  questionIds:[6,7,8,9,10],          assignedTo:[2,7],   status:"active",    startDate:"2025-07-01", endDate:"2025-09-30", createdAt:"2025-05-20" },
  { id:3, title:"C1–C2 Final Examination", examType:"fixed",     level:"C1", duration:60,  passingScore:80, shuffle:true,  showResults:true,  questionIds:[21,22,23,24,25],      assignedTo:[3,4,8], status:"active",    startDate:"2025-04-10", endDate:"2025-12-31", createdAt:"2025-04-01" },
  { id:4, title:"Language Placement Test", examType:"placement", level:null, duration:60,  passingScore:null, shuffle:true, showResults:true, questionIds:[],                    assignedTo:[1,2,3,4,5,6,7,8], status:"active", startDate:"2025-09-01", endDate:"2025-12-31", createdAt:"2025-08-01",
    placementTemplate:[
      { level:"A1", count:3, pointsEach:1 },
      { level:"A2", count:3, pointsEach:1 },
      { level:"B1", count:3, pointsEach:2 },
      { level:"B2", count:3, pointsEach:2 },
      { level:"C1", count:3, pointsEach:3 },
      { level:"C2", count:3, pointsEach:3 },
    ],
    placementThresholds:{ A1:60, A2:60, B1:60, B2:60, C1:60, C2:60 },
    showQuestionLevel:true, showPlacementThreshold:true,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// Build question list for an exam (fixed or placement)
export function buildExamQuestions(exam) {
  if (exam.examType === "placement") {
    const result = [];
    for (const row of exam.placementTemplate || []) {
      const pool = QUESTIONS.filter(q => q.level === row.level);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      result.push(...shuffled.slice(0, row.count));
    }
    return result;
  }
  // fixed — return questions in order, shuffle if enabled
  const qs = exam.questionIds.map(id => QUESTIONS.find(q => q.id === id)).filter(Boolean);
  return exam.shuffle ? [...qs].sort(() => Math.random() - 0.5) : qs;
}

// Compute placement result from answers — per-level scoring
export function computePlacementLevel(exam, questions, answers) {
  const thresholds = exam.placementThresholds || {};
  const LEVELS_ORDER = ["A1","A2","B1","B2","C1","C2"];

  // 1. Score each level separately
  const levelStats = {};
  for (const lvl of LEVELS_ORDER) {
    const lvlQuestions = questions.filter(q => q.level === lvl);
    if (lvlQuestions.length === 0) continue;

    let earned = 0;
    let maxPts = 0;

    for (const q of lvlQuestions) {
      const a = answers[q.id];
      maxPts += q.points;
      if (a === undefined || a === null || a === "" || (Array.isArray(a) && !a.length)) continue;

      if (q.type === "single_choice") {
        if (a === q.correct) earned += q.points;
      } else if (q.type === "multi_choice" || q.type === "multi_select") {
        if ([...(a||[])].sort().join() === [...(q.correct||[])].sort().join()) earned += q.points;
      } else if (q.type === "fill_blank") {
        if ((a||"").toLowerCase().trim() === (q.answer||"").toLowerCase()) earned += q.points;
      } else if (q.type === "fill_wordbank") {
        // partial credit: 1 point per correctly placed word
        const correct = q.correct || [];
        let hits = 0;
        correct.forEach((wi, blankId) => {
          if (a[blankId] === (q.wordBank||[])[wi]) hits++;
        });
        earned += Math.round((hits / (correct.length || 1)) * q.points);
      }
      // writing/voice: skipped (manual grading)
    }

    const pct = maxPts > 0 ? Math.round((earned / maxPts) * 100) : 0;
    levelStats[lvl] = { earned, maxPts, pct };
  }

  // 2. Determine highest level where student meets the threshold
  // AND all lower levels are also met (no gaps — must pass A1 before B1 etc.)
  let detectedLevel = "Below A1";
  for (const lvl of LEVELS_ORDER) {
    if (!levelStats[lvl]) continue;
    const threshold = thresholds[lvl] ?? 60; // default 60% per level
    if (levelStats[lvl].pct >= threshold) {
      detectedLevel = lvl;
    } else {
      break; // gap found — stop here
    }
  }

  // 3. Overall totals for display
  const totalEarned = Object.values(levelStats).reduce((s, l) => s + l.earned, 0);
  const totalPts    = Object.values(levelStats).reduce((s, l) => s + l.maxPts, 0);
  const pct = totalPts > 0 ? Math.round((totalEarned / totalPts) * 100) : 0;

  return { earned: totalEarned, totalPts, pct, detectedLevel, levelStats };
}
