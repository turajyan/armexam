import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const QUESTIONS = [
  { type:"single_choice", level:"A1", section:"Reading",    points:1, text:"Ընտրի՛ր ճիշտ պատասխանը. «Ես ___ եմ»", options:["ուսանող","ուսանողի","ուսանողը","ուսանողին"], correct:0 },
  { type:"single_choice", level:"A1", section:"Reading",    points:1, text:"«Բարի լույս» — ե՞րբ ենք ասում", options:["երեկոյան","գիշերը","առավոտյան","կեսօրին"], correct:2 },
  { type:"fill_blank",    level:"A1", section:"Writing",    points:1, text:"Լրացրո՛ւ բաց թողածը. «Նա ___ է գնում» (դպրոց)", answer:"դպրոց" },
  { type:"single_choice", level:"A1", section:"Grammar",    points:1, text:"Ո՞ր բառն է անուն", options:["վազել","կանաչ","տուն","արագ"], correct:2 },
  { type:"multi_choice",  level:"A1", section:"Vocabulary", points:1, text:"Ո՞ր բառերն են թվեր", options:["երկու","կարմիր","հինգ","մեծ","ութ"], correct:[0,2,4] },

  { type:"single_choice", level:"A2", section:"Reading",    points:1, text:"Ընտրի՛ր ճիշտ ձևը. «Ես ___ դպրոց եմ գնում ամեն օր»", options:["դեպի","մոտ","կողքին","առաջ"], correct:0 },
  { type:"single_choice", level:"A2", section:"Grammar",    points:1, text:"Ո՞ր նախադասությունն է ճիշտ", options:["Ես գնացի խանութ","Ես խանութ եմ գնացի","Ես խանութ գնացի եմ","Ես եմ խանութ գնացի"], correct:0 },
  { type:"fill_blank",    level:"A2", section:"Writing",    points:1, text:"Լրացրո՛ւ. «Նա ամեն օր ___ է ուտում» (նախաճաշ)", answer:"նախաճաշ" },
  { type:"multi_choice",  level:"A2", section:"Vocabulary", points:2, text:"Ո՞ր բառերն են կապված ընտանիքի հետ", options:["մայր","սեղան","հայր","լուսամուտ","քույր"], correct:[0,2,4] },
  { type:"single_choice", level:"A2", section:"Reading",    points:1, text:"«Ես սիրում եմ երաժշտություն» — ի՞նչ է նշանակում", options:["I hate music","I love music","I hear music","I play music"], correct:1 },

  { type:"multi_choice",  level:"B1", section:"Grammar",    points:2, text:"Ո՞ր նախադասություններն են քերականորեն ճիշտ", options:["Նա գրքեր է կարդում","Ես երեկ կինո գնացի","Նրանք վաղը կգնան","Դու ճաշ ուտում ես արդեն"], correct:[0,1,2] },
  { type:"single_choice", level:"B1", section:"Reading",    points:2, text:"Ո՞ր բառն է հոմանիշ «ուրախ»-ի", options:["տխուր","երջանիկ","հոգնած","բարկացած"], correct:1 },
  { type:"fill_blank",    level:"B1", section:"Writing",    points:2, text:"Լրացրո՛ւ. «Եթե վաղը անձրև ___, ես տանը կմնամ» (գա)", answer:"գա" },
  { type:"multi_select",  level:"B1", section:"Vocabulary", points:2, text:"Ընտրի՛ր բոլոր բառերը, որոնք կապված են «եղանակ»-ի հետ", options:["արև","բժիշկ","անձրև","ձյուն","գիրք","քամի"], correct:[0,2,3,5] },
  { type:"single_choice", level:"B1", section:"Grammar",    points:2, text:"Ո՞ր ձևն է ճիշտ. «Եթե ես ժամանակ ___, կկարդայի»", options:["ունեմ","ունենամ","ունեի","ունեցել եմ"], correct:2 },

  { type:"multi_select",  level:"B2", section:"Vocabulary", points:3, text:"Ընտրի՛ր բոլոր բառերը, որոնք կապված են «ճամփորդություն»-ի հետ", options:["ինքնաթիռ","բժիշկ","կայարան","ճամպրուկ","դպրոց","անձնագիր"], correct:[0,2,3,5] },
  { type:"single_choice", level:"B2", section:"Reading",    points:3, text:"Ո՞ր բառն է հականիշ «աղմկոտ»-ի", options:["բարձրաձայն","լուռ","ուժեղ","արագ"], correct:1 },
  { type:"multi_choice",  level:"B2", section:"Grammar",    points:3, text:"Ո՞ր ձևերն են ճիշտ", options:["Նա ասաց, որ կգա","Ես չգիտեի, թե ինչ անեմ","Երբ տեսա, ուրախացա","Կուզեի, եթե կարողanayir"], correct:[0,1,2] },
  { type:"fill_blank",    level:"B2", section:"Writing",    points:3, text:"Լրացրո՛ւ. «Չ___ կողմից ստացված նամակը հասավ ուշ» (սպաս)", answer:"սպասված" },
  { type:"writing",       level:"B2", section:"Free Writing", points:5, text:"Գրի՛ր 80-100 բառ թեմայով. «Ի՞նչ կփոխեի իմ քաղաքում»", minWords:80, maxWords:120 },

  { type:"single_choice", level:"C1", section:"Reading",    points:4, text:"Ո՞ր արտահայտությունն է ճիշտ գործածված", options:["Ջուրը քարը կոտրեց","Ջուրը քարը փորեց","Ջուրը քար կտրեց","Ջուրը քարին ծակ արեց"], correct:1 },
  { type:"multi_choice",  level:"C1", section:"Grammar",    points:4, text:"Ո՞ր նախադասություններն են ոճական առումով ճիշտ", options:["Հանդիպումը կայացավ երեկ","Ժողովը տեղի ունեցավ","Նա ելույթ ունեցավ","Ես ասացի"], correct:[0,1,2] },
  { type:"fill_blank",    level:"C1", section:"Writing",    points:4, text:"Լրացրո՛ւ դարձվածքը. «Ոսկե ___ ունի» (ձեռքեր)", answer:"ձեռքեր" },
  { type:"multi_select",  level:"C1", section:"Vocabulary", points:4, text:"Ո՞ր բառերն են բարձր ոճի", options:["ակնկալել","ուզել","հայցել","ասել","հայտնել","ճռճռալ"], correct:[0,2,4] },
  { type:"writing",       level:"C1", section:"Free Writing", points:8, text:"Գրի՛ր 120-150 բառ. «Ժամանակակից հայերենի մարտահրավերները»", minWords:120, maxWords:180 },

  { type:"single_choice", level:"C2", section:"Reading",    points:5, text:"Ո՞ր բառն է ճշգրիտ. «Հեղինակը ___ ոճ է գործածել» (պատկերավոր)", options:["փոխաբերական","ուղիղ","բառացի","զգացմունքային"], correct:0 },
  { type:"multi_choice",  level:"C2", section:"Grammar",    points:5, text:"Ո՞ր նախադասություններն են ճիշտ կազմված", options:["Այն, ինչ ասացիր, ճշմարիտ է","Ով ջանա՝ կհասնի","Ուր գնաս, ես կգամ","Թեեւ հոգնած էր, շարունակեց"], correct:[0,1,2,3] },
  { type:"fill_blank",    level:"C2", section:"Writing",    points:5, text:"Լրացրո՛ւ. «___ չէ, ով բոլորին հաճոյանա» (մարդ)", answer:"մարդ" },
  { type:"multi_select",  level:"C2", section:"Vocabulary", points:5, text:"Ո՞ր բառերն են արխաիզմներ", options:["շնորհ","ոգի","յուր","նա","ահա","ես"], correct:[2] },
  { type:"writing",       level:"C2", section:"Free Writing", points:10, text:"Գրի՛ր 150-200 բառ. «Գրականության դերը ազգային ինքնության պահպանման մեջ»", minWords:150, maxWords:220 },

  { type:"fill_wordbank", level:"A2", section:"Grammar", points:2, text:"Տեղադրի՛ր բառերը ճիշտ տեղերում:", segments:[{type:"text",content:"Ես ամեն օր "},{type:"blank",id:0},{type:"text",content:" դպրոց եմ գնում "},{type:"blank",id:1},{type:"text",content:" ավտոբուսով:"}], wordBank:["առավոտյան","դեպի","երեկոյան","կողքին"], correct:[1,0] },
  { type:"fill_wordbank", level:"B1", section:"Vocabulary", points:3, text:"Լրացրո՛ւ նախադասությունները ճիշտ բառերով:", segments:[{type:"text",content:"Երկիրը "},{type:"blank",id:0},{type:"text",content:" ունի, իսկ մայրաքաղաքը "},{type:"blank",id:1},{type:"text",content:" է:"}], wordBank:["Երևան","լեռներ","ծով","Թբիլիսի"], correct:[1,0] },

  { type:"audio", level:"A2", section:"Listening", points:2, text:"Լսի՛ր ձայնագրությունը և ընտրի՛ր ճիշտ պատասխանը. Ո՞ւր է գնում խոսողը:", audioSrc:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", maxPlays:2, pauseSeconds:10, options:["Դպրոց","Խանութ","Բժիշկ","Կայարան"], correct:0 },
  { type:"audio", level:"B1", section:"Listening", points:3, text:"Լսի՛ր երկխոսությունը. Ի՞նչ է ուզում գնել Արամը:", audioSrc:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", maxPlays:2, pauseSeconds:15, options:["Գիրք","Հագուստ","Սնունդ","Նվեր"], correct:2 },

  { type:"video", level:"B2", section:"Listening / Watching", points:4, text:"Դիտի՛ր հատվածը. Ո՞ր թեմայի մասին է պատմում բանախոսը:", videoSrc:"https://www.w3schools.com/html/mov_bbb.mp4", maxPlays:1, options:["Բնապահպանություն","Տնտեսություն","Կրթություն","Մշակույթ"], correct:0 },
  { type:"video", level:"C1", section:"Listening / Watching", points:5, text:"Դիտի՛ր հարցազրույցը. Ի՞նչ խնդիր է բարձրացնում հյուրը:", videoSrc:"https://www.w3schools.com/html/movie.mp4", maxPlays:1, options:["Լեզվի պահպանում","Տեխնոլոգիա","Սպորտ","Արվեստ"], correct:0 },

  { type:"voice", level:"B1", section:"Speaking", points:3, text:"Ձայնագրի՛ր պատասխանդ. «Պատմի՛ր քո սիրած տոնի մասին» (30–60 վրկյան).", maxSeconds:60, minSeconds:15, maxAttempts:2 },
  { type:"voice", level:"C1", section:"Speaking", points:5, text:"Ձայնագրի՛ր. «Ի՞նչ կմտածեիր ժամանակակից հայերենի զարգացման մասին» (45–90 վրկյան).", maxSeconds:90, minSeconds:30, maxAttempts:2 },

  { type:"single_choice", level:"A1", section:"Reading",    points:1, text:"Ո՞ր բառն է ճիշտ. «Ես ___ եմ»", options:["ուրախ","ուրախ են","ուրախ ենք","ուրախ է"], correct:0 },
  { type:"single_choice", level:"A1", section:"Grammar",    points:1, text:"Ո՞ր նախադասությունն է ճիշտ կազմված", options:["Ես գնում եմ","Ես եմ","Գնում ես","Եմ գնում"], correct:0 },
  { type:"single_choice", level:"A2", section:"Reading",    points:1, text:"«Նա ամեն օր վաղ արթնանում է» — ի՞նչ է նշանակում", options:["Ուշ քնում է","Ուշ արթնանում է","Վաղ արթնանում է","Երբեք չի քնում"], correct:2 },
  { type:"single_choice", level:"A2", section:"Vocabulary", points:1, text:"«Շուկա» բառի հոմանիշն է", options:["Այգի","Bazaar","Դպրոց","Հիվանդանոց"], correct:1 },
  { type:"single_choice", level:"B1", section:"Reading",    points:2, text:"Ո՞ր նախադասությունն է կրավորական սեռով", options:["Նա գրեց նամակ","Նամակը գրվեց","Գրեց նամակ","Նամակ գրեցին"], correct:1 },
  { type:"single_choice", level:"B1", section:"Listening",  points:2, text:"Ո՞ր արտահայտությունն է ճիշտ՝ հարցնելու համար ուղղություն", options:["Ո՞ւր է գնում","Ո՞ւր կգնաս","Ինչ՞ կանես","Ե՞րբ կտեսնեք"], correct:0 },
  { type:"multi_choice",  level:"B2", section:"Reading",    points:3, text:"Ո՞ր բառերն են բնութագրում լավ ղեկավարի հատկությունները", options:["Համբերատար","Ազնիվ","Ագրեսիվ","Կազմակերպված"], correct:[0,1,3] },
  { type:"single_choice", level:"B2", section:"Listening",  points:3, text:"Ո՞ր հոմանիշն է ճիշտ «լսել» բային", options:["Տեսնել","Ընկալել","Խոսել","Կարդալ"], correct:1 },
  { type:"single_choice", level:"B2", section:"Listening",  points:3, text:"«Ուշադիր լսել» — ի՞նչ է նշանակում", options:["Ուշադիր լսել","Անտեսել","Պատասխանել","Հարցնել"], correct:0 },
  { type:"multi_select",  level:"C1", section:"Reading",    points:4, text:"Ո՞ր հատկանիշներն են բնորոշ գիտական ոճին", options:["Ճշգրտություն","Հուզականություն","Օբյեկտիվություն","Պատկերավորություն"], correct:[0,2] },
  { type:"single_choice", level:"C1", section:"Listening",  points:4, text:"Ո՞ր բառն է հոմանիշ «ընկալել»-ի", options:["Տեսնել","Հասկանալ","Կարդալ","Խոսել"], correct:1 },
  { type:"single_choice", level:"C1", section:"Listening",  points:4, text:"Ի՞նչ է նշանակում «ականջ դնել»", options:["Ուշադիր լսել","Ձայն հանել","Երգ երգել","Հեռախոս վերցնել"], correct:0 },
  { type:"multi_select",  level:"C2", section:"Reading",    points:5, text:"Ո՞ր արտահայտություններն ունեն փոխաբերական իմաստ", options:["Սիրտ կտրել","Ջուր խմել","Ձեռք մեկնել","Հաց ուտել"], correct:[0,2] },
  { type:"fill_blank",    level:"C2", section:"Grammar",    points:5, text:"Լրացրո՛ւ. «Եթե ավելի շատ կարդայի, ___ ավելի շատ բան» (իմանալ — անցյալ կատարյալ)", answer:"կիմանայի" },
];

const STUDENTS = [
  { name:"Անի Հակոբյան",   email:"ani@example.am",    group:"Խ-101", level:"B1", status:"active" },
  { name:"Արամ Պետրոսյան", email:"aram@example.am",   group:"Խ-101", level:"A2", status:"active" },
  { name:"Մարինե Գ.",      email:"marine@example.am", group:"Խ-102", level:"B2", status:"active" },
  { name:"Դավիթ Ս.",       email:"davit@example.am",  group:"Խ-102", level:"C1", status:"active" },
  { name:"Նարեկ Ավ.",      email:"narek@example.am",  group:"Խ-103", level:"A1", status:"inactive" },
  { name:"Լուսինե Կ.",     email:"lusine@example.am", group:"Խ-103", level:"B1", status:"active" },
  { name:"Վահե Մ.",        email:"vahe@example.am",   group:"Խ-101", level:"A2", status:"active" },
  { name:"Հայկ Ա.",        email:"hayk@example.am",   group:"Խ-102", level:"B2", status:"active" },
];

async function main() {
  console.log("Seeding database...");

  await prisma.result.deleteMany();
  await prisma.examAssignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.student.deleteMany();
  await prisma.question.deleteMany();

  // Questions
  for (const q of QUESTIONS) {
    await prisma.question.create({ data: q });
  }
  console.log(`Created ${QUESTIONS.length} questions`);

  // Students
  const students = [];
  for (const s of STUDENTS) {
    const student = await prisma.student.create({ data: s });
    students.push(student);
  }
  console.log(`Created ${students.length} students`);

  // Exams
  const exams = [
    {
      title: "Summer B1 Examination",
      examType: "fixed",
      level: "B1",
      duration: 45,
      passingScore: 70,
      shuffle: true,
      showResults: true,
      showQuestionLevel: true,
      showQuestionPoints: true,
      subpools: [{ section:"Reading", count:3 },{ section:"Grammar", count:2 },{ section:"Vocabulary", count:2 }],
      status: "active",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-09-30"),
      assignedTo: [0,1,6], // indices in students array
    },
    {
      title: "A2 Entrance Test",
      examType: "fixed",
      level: "A2",
      duration: 30,
      passingScore: 60,
      shuffle: false,
      showResults: true,
      showQuestionLevel: true,
      showQuestionPoints: true,
      subpools: [{ section:"Reading", count:3 },{ section:"Grammar", count:2 }],
      status: "active",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-09-30"),
      assignedTo: [1,6],
    },
    {
      title: "C1–C2 Final Examination",
      examType: "fixed",
      level: "C1",
      duration: 60,
      passingScore: 80,
      shuffle: true,
      showResults: true,
      showQuestionLevel: true,
      showQuestionPoints: true,
      subpools: [{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Writing", count:1 }],
      status: "active",
      startDate: new Date("2025-04-10"),
      endDate: new Date("2025-12-31"),
      assignedTo: [2,3,7],
    },
    {
      title: "Language Placement Test",
      examType: "placement",
      level: null,
      duration: 60,
      passingScore: null,
      shuffle: true,
      showResults: true,
      showQuestionLevel: true,
      showQuestionPoints: true,
      status: "active",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-12-31"),
      placementTemplate: [
        { level:"A1", pointsEach:1, subpools:[{ section:"Reading", count:3 },{ section:"Grammar", count:2 }] },
        { level:"A2", pointsEach:1, subpools:[{ section:"Reading", count:3 },{ section:"Vocabulary", count:2 }] },
        { level:"B1", pointsEach:2, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Grammar", count:1 }] },
        { level:"B2", pointsEach:2, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Writing", count:1 }] },
        { level:"C1", pointsEach:3, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Writing", count:1 }] },
        { level:"C2", pointsEach:3, subpools:[{ section:"Reading", count:2 },{ section:"Grammar", count:2 },{ section:"Writing", count:1 }] },
      ],
      placementThresholds: { A1:60, A2:60, B1:60, B2:60, C1:60, C2:60 },
      showPlacementThreshold: true,
      assignedTo: [0,1,2,3,4,5,6,7],
    },
  ];

  for (const { assignedTo, ...examData } of exams) {
    await prisma.exam.create({
      data: {
        ...examData,
        assignedStudents: {
          create: assignedTo.map((i) => ({ studentId: students[i].id })),
        },
      },
    });
  }
  console.log(`Created ${exams.length} exams`);

  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
