import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(p, email) {
  return crypto.createHash("sha256").update(p + email.toLowerCase()).digest("hex");
}

const PIN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function randPin(used) {
  let p;
  do { p = Array.from({ length: 8 }, () => PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)]).join(""); }
  while (used.has(p));
  used.add(p);
  return p;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION DEFINITIONS  (name → category)
// ═════════════════════════════════════════════════════════════════════════════
const SECTIONS = [
  { name: "Reading",   category: "READING"   },
  { name: "Listening", category: "LISTENING" },
  { name: "Speaking",  category: "SPEAKING"  },
  { name: "Writing",   category: "WRITING"   },
  { name: "Grammar",   category: "READING"   },  // free-nav like READING
  { name: "Vocabulary",category: "READING"   },  // free-nav like READING
];

// ═════════════════════════════════════════════════════════════════════════════
// QUESTION BANK
// Each entry maps to one Question row.
// Fields: sectionName, type, level, points, prompt,
//         contextText?, media?, content, config?
// ═════════════════════════════════════════════════════════════════════════════

const PTS = { A1:1, A2:1, B1:2, B2:3, C1:4, C2:5 };

const QUESTIONS = [

  // ── READING › SINGLE_CHOICE ──────────────────────────────────────────────
  {
    sectionName: "Reading", type: "SINGLE_CHOICE", level: "A1", points: PTS.A1,
    contextText: "Անի սիրում է կարդալ գրքեր: Ամեն երեկո նա նստում է բազկաթոռին և կարդում:",
    prompt: "Ի՞նչ է սիրում Անին:",
    content: { options: ["Երգել", "Կարդալ գրքեր", "Խաղալ", "Քնել"], correct: 1 },
  },
  {
    sectionName: "Reading", type: "SINGLE_CHOICE", level: "A1", points: PTS.A1,
    contextText: "Այսօր երկուշաբթի է: Վաղը երեքշաբթի կլինի:",
    prompt: "Ո՞ր օրն է վաղը:",
    content: { options: ["Կիրակի", "Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի"], correct: 2 },
  },
  {
    sectionName: "Reading", type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    contextText: "Մարկոն ուսանող է: Նա ամեն օր գնում է համալսարան ավտոբուսով: Տուն վերադառնալիս նա ոտքով է գնում:",
    prompt: "Ինչպե՞ս է Մարկոն գնում տուն:",
    content: { options: ["Ավտոբուսով", "Մեքենայով", "Ոտքով", "Հեծանիվով"], correct: 2 },
  },
  {
    sectionName: "Reading", type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    contextText: "Չնայած ծախսերի ավելացմանը, ընկերությունը որոշեց ընդլայնել արտադրությունը: Ղեկավարությունը վստահ էր, որ շուկայի պահանջարկը կբավարարի ծախսերը:",
    prompt: "Ո՞ւ ինչու ընկերությունը որոշեց ընդլայնվել:",
    content: { options: ["Կառավարության ճնշման պատճառով", "Շուկայական պահանջարկի հույսով", "Ծախսերը կրճատելու համար", "Մրցակցությունը վերացնելու համար"], correct: 1 },
  },
  {
    sectionName: "Reading", type: "SINGLE_CHOICE", level: "B2", points: PTS.B2,
    contextText: "Կլիմայի փոփոխությունը ոչ միայն բնապահպանական, այլև սոցիալ-տնտեսական մարտահրավեր է: Զարգացող երկրները, որոնք ամենաքիչն են պատասխանատու արտանետումների համար, կրում են ամենամեծ հետևանքները:",
    prompt: "Ո՞ր հիմնական հակասությունն է ընդգծված հատվածում:",
    content: { options: ["Տնտեսական աճ vs. բնապահպանություն", "Պատասխանատվություն vs. հետևանքների կրում", "Արդյունաբերություն vs. գյուղատնտեսություն", "Կառավարություն vs. հասարակություն"], correct: 1 },
  },
  {
    sectionName: "Reading", type: "SINGLE_CHOICE", level: "C1", points: PTS.C1,
    contextText: "Պոստմոդեռնիզմը մերժում է մետա-ռոպիտիվ մեծ պատմություններն ու կոնսենսուսային ճշմարտությունը՝ փոխարինելով դրանք փոքր, մասնավոր ու հակասական ձայներով: Լիոտարը պնդում է, որ «Ի՞նչ է արդարություն» հարցը ոչ թե ունիվերսալ, այլ խաղի-կանոններ-կախված պատասխան ունի:",
    prompt: "Ըստ հատվածի՝ ի՞նչ է հատկանշում պոստմոդեռն մոտեցումը արդարությանը:",
    content: { options: ["Ունիվերսալ բարոյական համակարգի կիրառում", "Կոնտեքստային և հարաբերական սահմանում", "Ավանդական արժեքների վերաիմաստավորում", "Ռացիոնալ-բանականության գերակայություն"], correct: 1 },
  },
  {
    sectionName: "Reading", type: "SINGLE_CHOICE", level: "C2", points: PTS.C2,
    contextText: "Ժամանակակից նյարդագիտությունը ցույց է տալիս, որ ազատ կամքի ֆենոմենոլոգիական փորձը կարող է ուղեղի պատճառական գործընթացների ռետրոսպեկտիվ ռացիոնալացում լինել: Libet-ի փորձերը ցույց են տալիս, որ շարժման գիտակցված «որոշումը» հաջորդում է ուղեղի ակտիվությանը:",
    prompt: "Ի՞նչ է հուշում Libet-ի հետազոտությունը ազատ կամքի վերաբերյալ:",
    content: { options: ["Ազատ կամքը ուղեղային ֆիզիոլոգիայից անկախ է", "Գիտակցված որոշումը կարող է ուղեղային գործընթացներին հետևել", "Կամքը ամբողջությամբ դետերմինիստական է", "Նյարդային ֆիզիոլոգիան բավարար բացատրություն է"], correct: 1 },
  },

  // ── READING › MULTIPLE_CHOICE ─────────────────────────────────────────────
  {
    sectionName: "Reading", type: "MULTIPLE_CHOICE", level: "B1", points: PTS.B1,
    contextText: "Հայաստանը լեռնային երկիր է: Այն ունի հարուստ պատմություն, հնագույն եկեղեցիներ, բնական արգելոցներ և համաշխարհային ճանաչում ստացած խոհանոց:",
    prompt: "Ո՞ր երկուսն են ճիշտ Հայաստանի մասին: (Ընտրեք 2)",
    content: { options: ["Ծովային երկիր է", "Հնագույն եկեղեցիներ ունի", "Անապատային լանդշաֆտ ունի", "Ունի հայտնի ազգային խոհանոց"], correct: [1, 3], requiredCount: 2 },
  },
  {
    sectionName: "Reading", type: "MULTIPLE_CHOICE", level: "B2", points: PTS.B2,
    contextText: "Արհեստական բանականությունը փոխում է աշխատաշուկան: Որոշ մասնագիտություններ կվերանան, նորերը կստեղծվեն: Կրթությունը, ադaptivность-ը և ստեղծականությունը կդառնան առանցքային:",
    prompt: "Ո՞ր երեք գործոններ կլինեն կարևոր AI-ի դարաշրջանում: (Ընտրեք 3)",
    content: { options: ["Կրթություն", "Ֆիզիկական ուժ", "Ադaptivность", "Ավտոմատիզացված հմտություններ", "Ստեղծականություն"], correct: [0, 2, 4], requiredCount: 3 },
  },

  // ── READING › FILL_IN_THE_BLANKS ──────────────────────────────────────────
  {
    sectionName: "Reading", type: "FILL_IN_THE_BLANKS", level: "A2", points: PTS.A2,
    prompt: "Լրացրե՛ք բաց թողած բառերը:",
    content: {
      segments: [
        { type: "text",  value: "Ես ամեն առավոտ " },
        { type: "blank", id: 1, answer: "արթնանում" },
        { type: "text",  value: " եմ ժամը ութին և " },
        { type: "blank", id: 2, answer: "նախաճաշում" },
        { type: "text",  value: " եմ տանը:" },
      ],
    },
  },
  {
    sectionName: "Reading", type: "FILL_IN_THE_BLANKS", level: "B1", points: PTS.B1,
    prompt: "Լրացրե՛ք բաց թողած բառերը՝ ըստ տեքստի:",
    content: {
      segments: [
        { type: "text",  value: "Շրջակա միջավայրի " },
        { type: "blank", id: 1, answer: "պաշտպանությունը" },
        { type: "text",  value: " ժամանակակից հասարակության " },
        { type: "blank", id: 2, answer: "պատասխանատվությունն" },
        { type: "text",  value: " է:" },
      ],
    },
  },

  // ── READING › DRAG_TO_TEXT ────────────────────────────────────────────────
  {
    sectionName: "Reading", type: "DRAG_TO_TEXT", level: "A2", points: PTS.A2,
    prompt: "Քաշե՛ք ճիշտ բառը յուրաքանչյուր բաց տեղ:",
    content: {
      text: "The sun {slot_1} in the east and {slot_2} in the west every day.",
      wordBank: ["rises", "sets", "sleeps", "runs"],
      slots: { slot_1: "rises", slot_2: "sets" },
    },
  },
  {
    sectionName: "Grammar", type: "DRAG_TO_TEXT", level: "B1", points: PTS.B1,
    prompt: "Քաշե՛ք ճիշտ ձևն յուրաքանչյուր բաց տեղ:",
    content: {
      text: "By the time she arrived, he {slot_1} already {slot_2} the report.",
      wordBank: ["had", "has", "finished", "finishing", "finish"],
      slots: { slot_1: "had", slot_2: "finished" },
    },
  },

  // ── READING › TEXT_INSERTION ──────────────────────────────────────────────
  {
    sectionName: "Reading", type: "TEXT_INSERTION", level: "B2", points: PTS.B2,
    contextText: "Կլիմայական ճգնաժամի լուծումը բազմաբնույթ մոտեցում է պահանջում: [1] Պետությունները պետք է ընդունեն խիստ օրենսդրություն: [2] Անհատական վարքագծի փոփոխությունն անհրաժեշտ է: [3]",
    prompt: "Ո՞ր նախադասությունը լավագույնս տեղավորվում է [2] նշանի մոտ:",
    content: {
      passages: [
        "Արդյունաբերական ձեռնարկությունները պետք է կրճատեն արտանետումները:",
        "Բնապահպանական կրթությունը պետք է ներառվի դպրոցական ծրագրերում:",
        "Միջազգային հաստատությունները ֆինանսավորում են հետազոտությունները:",
      ],
      markers: [{ id: 1, correct: 0 }, { id: 2, correct: 1 }, { id: 3, correct: 2 }],
    },
  },

  // ── READING › DRAG_AND_DROP_TABLE ────────────────────────────────────────
  {
    sectionName: "Reading", type: "DRAG_AND_DROP_TABLE", level: "B1", points: PTS.B1,
    prompt: "Բաժանե՛ք հետևյալ փաստերը ճիշտ սյունակներում:",
    content: {
      columns: [
        { id: "col_adv", title: "Առավելություններ" },
        { id: "col_dis", title: "Թերություններ" },
      ],
      items: [
        { id: "i1", text: "Ժամանակի խնայողություն" },
        { id: "i2", text: "Կախվածություն տեխնոլոգիաներից" },
        { id: "i3", text: "Հաղորդակցության բարելավում" },
        { id: "i4", text: "Անձնական շփման կրճատում" },
      ],
      correct: { i1: "col_adv", i2: "col_dis", i3: "col_adv", i4: "col_dis" },
    },
  },
  {
    sectionName: "Reading", type: "DRAG_AND_DROP_TABLE", level: "C1", points: PTS.C1,
    prompt: "Դասակարգե՛ք հետևյալ գաղափարները:",
    content: {
      columns: [
        { id: "col_mod", title: "Մոդեռնիզմ" },
        { id: "col_post", title: "Պոստմոդեռնիզմ" },
        { id: "col_both", title: "Երկուսն էլ" },
      ],
      items: [
        { id: "i1", text: "Ունիվերսալ ճշմարտության հավատ" },
        { id: "i2", text: "Ոճերի բազմազանություն" },
        { id: "i3", text: "Ռեflексivность" },
        { id: "i4", text: "Մեծ ռոպիտիվ մերժում" },
      ],
      correct: { i1: "col_mod", i2: "col_both", i3: "col_both", i4: "col_post" },
    },
  },

  // ── GRAMMAR › SINGLE_CHOICE ───────────────────────────────────────────────
  {
    sectionName: "Grammar", type: "SINGLE_CHOICE", level: "A1", points: PTS.A1,
    prompt: "Ընտրե՛ք ճիշտ ձևը: «Ես ___ ուսանող եմ»",
    content: { options: ["մի", "այս", "կ", ""], correct: 3 },
  },
  {
    sectionName: "Grammar", type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    prompt: "Ո՞ր ձևն է ճիշտ: She ___ to school every day.",
    content: { options: ["go", "goes", "going", "gone"], correct: 1 },
  },
  {
    sectionName: "Grammar", type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    prompt: "Ո՞ր ձևն է ճիշտ: If I ___ you, I would apologise.",
    content: { options: ["am", "was", "were", "be"], correct: 2 },
  },
  {
    sectionName: "Grammar", type: "SINGLE_CHOICE", level: "B2", points: PTS.B2,
    prompt: "Ընտրե՛ք ճիշտ ձևը: The report ___ by the committee before the deadline.",
    content: { options: ["was submitted", "submitted", "had submitted", "has been submitting"], correct: 0 },
  },
  {
    sectionName: "Grammar", type: "SINGLE_CHOICE", level: "C1", points: PTS.C1,
    prompt: "Ընտրե՛ք ճիշտ ձևը: ___ he to resign, the company would face a leadership crisis.",
    content: { options: ["If", "Were", "Should", "Had"], correct: 1 },
  },
  {
    sectionName: "Grammar", type: "SINGLE_CHOICE", level: "C2", points: PTS.C2,
    prompt: "Ո՞ր նախադասությունն է ոճականորեն ճիշտ ֆորմալ ակադեմիական գրի համար:",
    content: { options: [
      "The data shows that there is a big difference.",
      "The data indicates a statistically significant divergence.",
      "The data is showing us a very different picture.",
      "As the data shows, things are quite different.",
    ], correct: 1 },
  },

  // ── VOCABULARY › SINGLE_CHOICE ────────────────────────────────────────────
  {
    sectionName: "Vocabulary", type: "SINGLE_CHOICE", level: "A1", points: PTS.A1,
    prompt: "«Բարև» բառի անգլերեն թարգմանությունն է:",
    content: { options: ["Goodbye", "Hello", "Sorry", "Please"], correct: 1 },
  },
  {
    sectionName: "Vocabulary", type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    prompt: "Ո՞ր բառն է «happy»-ի հոմանիշը:",
    content: { options: ["Sad", "Angry", "Joyful", "Tired"], correct: 2 },
  },
  {
    sectionName: "Vocabulary", type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    prompt: "Ո՞ր բառն է ճիշտ: The medicine had several unexpected ___.",
    content: { options: ["side effects", "side causes", "after effects", "by-products"], correct: 0 },
  },
  {
    sectionName: "Vocabulary", type: "SINGLE_CHOICE", level: "B2", points: PTS.B2,
    prompt: "Ո՞ր բառն է «ameliorate»-ի ամենամոտ իմաստը:",
    content: { options: ["Worsen", "Improve", "Ignore", "Measure"], correct: 1 },
  },
  {
    sectionName: "Vocabulary", type: "SINGLE_CHOICE", level: "C1", points: PTS.C1,
    prompt: "Ո՞ր բառն է ամենաճշգրիտ: The politician's speech was deliberately ___, designed to mean different things to different audiences.",
    content: { options: ["verbose", "ambiguous", "concise", "inflammatory"], correct: 1 },
  },
  {
    sectionName: "Vocabulary", type: "SINGLE_CHOICE", level: "C2", points: PTS.C2,
    prompt: "Ո՞ր բառն է լրացնում նախադասությունը: The critic's ___ review dismantled the author's central thesis with surgical precision.",
    content: { options: ["perfunctory", "trenchant", "sycophantic", "laconic"], correct: 1 },
  },

  // ── LISTENING › SINGLE_CHOICE (with audio) ────────────────────────────────
  {
    sectionName: "Listening", type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Sainte-Mère-Église_p1020648.ogg", maxPlays: 2 }],
    prompt: "Լսե՛ք ձայնագրությունը: Ի՞նչ են պատվիրում:",
    content: { options: ["Սուրճ", "Թեյ", "Հյութ", "Ջուր"], correct: 0 },
  },
  {
    sectionName: "Listening", type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/1/19/MiniSunflower.ogg", maxPlays: 2 }],
    prompt: "Լսե՛ք և ընտրե՛ք հիմնական թեման:",
    content: { options: ["Բնություն", "Երաժշտություն", "Սպորտ", "Ճամփորդություն"], correct: 0 },
  },
  {
    sectionName: "Listening", type: "MULTIPLE_CHOICE", level: "B2", points: PTS.B2,
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Vespers_of_Holy_Saturday_%28sample%29.ogg", maxPlays: 1 }],
    prompt: "Լսե՛ք: Ո՞ր երկու պնդումն են ճիշտ: (Ընտրեք 2)",
    content: {
      options: ["Կատարվում է եկեղեցում", "Ձայնը մենակատար է", "Դա կրոնական երաժշտություն է", "Ձայնն էլեկտրոնային է"],
      correct: [0, 2], requiredCount: 2,
    },
  },
  {
    sectionName: "Listening", type: "SINGLE_CHOICE", level: "C1", points: PTS.C1,
    media: [{ type: "video", url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e6/Bison_at_Yellowstone.ogv/Bison_at_Yellowstone.ogv.360p.ogv", maxPlays: 1 }],
    prompt: "Դիտե՛ք տեսանյութը: Ո՞ր թեման է գերակշռում:",
    content: { options: ["Կենդանիների կյանքը բնության մեջ", "Արդյունաբերություն", "Քաղաքային կյանք", "Ծովային հետազոտություն"], correct: 0 },
  },

  // ── LISTENING › IMAGE_CLICK ───────────────────────────────────────────────
  {
    sectionName: "Listening", type: "IMAGE_CLICK", level: "B1", points: PTS.B1,
    media: [
      { type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Sainte-Mère-Église_p1020648.ogg", maxPlays: 2 },
      { type: "image", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/800px-Good_Food_Display_-_NCI_Visuals_Online.jpg" },
    ],
    prompt: "Լսե՛ք: Կlikkerez el a la zona de la imagen que mencionan.",
    content: {
      hotspots: [
        { id: "hs1", x: 20.0, y: 30.0, width: 20.0, height: 20.0, correct: true  },
        { id: "hs2", x: 60.0, y: 50.0, width: 20.0, height: 20.0, correct: false },
        { id: "hs3", x: 70.0, y: 10.0, width: 15.0, height: 15.0, correct: false },
      ],
    },
  },

  // ── LISTENING › DRAG_AND_DROP_IMAGE ──────────────────────────────────────
  {
    sectionName: "Listening", type: "DRAG_AND_DROP_IMAGE", level: "C1", points: PTS.C1,
    media: [{ type: "image", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Aras_river_basin_map.png/640px-Aras_river_basin_map.png" }],
    prompt: "Քաշե՛ք երկրների անունները քարտեզի ճիշտ տեղերը:",
    content: {
      labels: [
        { id: "lbl1", text: "Հայաստան" },
        { id: "lbl2", text: "Թուրքիա" },
        { id: "lbl3", text: "Ադրբեջան" },
      ],
      hotspots: [
        { id: "hs1", x: 55.0, y: 40.0, correct: "lbl1" },
        { id: "hs2", x: 25.0, y: 35.0, correct: "lbl2" },
        { id: "hs3", x: 75.0, y: 45.0, correct: "lbl3" },
      ],
    },
  },

  // ── SPEAKING ──────────────────────────────────────────────────────────────
  {
    sectionName: "Speaking", type: "SPEAKING_INDEPENDENT", level: "A1", points: PTS.A1,
    prompt: "Ներկայացե՛ք հայերեն: Ասե՛ք ձեր անունը, տարիքը և ապրելու վայրը:",
    content: {
      prepSeconds: 15,
      recordSeconds: 45,
      maxAttempts: 2,
      rubrics: [
        { id: "fluency",       label: "Fluency & Coherence",  maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation",        maxScore: 5 },
      ],
    },
  },
  {
    sectionName: "Speaking", type: "SPEAKING_INDEPENDENT", level: "B1", points: PTS.B1,
    prompt: "Պատմե՛ք ձեր սիրած եղանակի մասին: Ինչ կարող եք անել այդ եղանակին: (30-90 վ)",
    content: {
      prepSeconds: 30,
      recordSeconds: 90,
      maxAttempts: 1,
      rubrics: [
        { id: "fluency",       label: "Fluency & Coherence",  maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation",        maxScore: 5 },
      ],
    },
  },
  {
    sectionName: "Speaking", type: "SPEAKING_INTEGRATED", level: "C1", points: PTS.C1,
    contextText: "Կարդացե՛ք հետևյալ տեքստը, ապա լսե՛ք ձայնագրությունը և ձեր պատասխանում համեմատե՛ք երկու աղբյուրի տեսակետները:",
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Vespers_of_Holy_Saturday_%28sample%29.ogg", maxPlays: 1 }],
    prompt: "Ելնելով տեքստից և ձայնագրությունից՝ բացատրե՛ք, թե ինչպես է ժամանակակից տեխնոլոգիան ազդում մշակութային ավանդույթների վրա:",
    content: {
      prepSeconds: 45,
      recordSeconds: 120,
      maxAttempts: 1,
      rubrics: [
        { id: "fluency",       label: "Fluency & Coherence",  maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation",        maxScore: 5 },
      ],
    },
  },

  // ── WRITING ───────────────────────────────────────────────────────────────
  {
    sectionName: "Writing", type: "WRITING_INDEPENDENT", level: "B1", points: PTS.B1,
    prompt: "Գրե՛ք 100-150 բառ ձեր սիրած ժամանցի մասին: Ինչու՞ եք սիրում այն:",
    content: {
      minWords: 100,
      maxWords: 150,
      rubrics: [
        { id: "task_response", label: "Task Response",        maxScore: 5 },
        { id: "coherence",     label: "Coherence & Cohesion", maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
      ],
    },
  },
  {
    sectionName: "Writing", type: "WRITING_INDEPENDENT", level: "B2", points: PTS.B2,
    prompt: "«Տեխնոլոգիաները ժամանակակից կյանքն ավելի հեշտ են դարձնում»: Համաձա՞յն եք: Հիմնավորե՛ք ձեր կարծիքը 150-200 բառով:",
    content: {
      minWords: 150,
      maxWords: 200,
      rubrics: [
        { id: "task_response", label: "Task Response",        maxScore: 5 },
        { id: "coherence",     label: "Coherence & Cohesion", maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
      ],
    },
  },
  {
    sectionName: "Writing", type: "WRITING_INTEGRATED", level: "C1", points: PTS.C1,
    contextText: "Կարդացե՛ք հետևյալ հատվածը արհեստական բանականության ազդեցության մասին կրթության ոլորտում:\n\nԱրհեստական բանականության ներդրումը կրթության մեջ ստեղծում է հնարավորություններ անհատականացված ուսուցման համար: Այնուամենայնիվ, քննադատները կարծում են, որ մարդ-ուսուցչի դերը կրճատելը կհանգեցնի հուզական-սոցիալական կրթության անկման:",
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/1/19/MiniSunflower.ogg", maxPlays: 2 }],
    prompt: "Ելնելով ինչպես տեքստից, այնպես էլ ձայնագրությունից՝ գրե՛ք 200-250 բառ արհեստական բանականության դերի և սահմանափակումների մասին կրթության ոլորտում:",
    content: {
      minWords: 200,
      maxWords: 250,
      rubrics: [
        { id: "task_response", label: "Task Response",        maxScore: 5 },
        { id: "coherence",     label: "Coherence & Cohesion", maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
      ],
    },
  },
  {
    sectionName: "Writing", type: "WRITING_INDEPENDENT", level: "C2", points: PTS.C2,
    prompt: "Ըստ Ֆուկոյի իշխանություն-գիտելիք հարաբերության տեսության՝ վերլուծե՛ք, թե ինչպես է կրթական ինստիտուտը վերարտադրում հեգեմոն դիսկուրսները: (250-350 բառ)",
    content: {
      minWords: 250,
      maxWords: 350,
      rubrics: [
        { id: "task_response", label: "Task Response",        maxScore: 5 },
        { id: "coherence",     label: "Coherence & Cohesion", maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
      ],
    },
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// PLACEMENT TEMPLATE  (referenced by Exam rows)
// ═════════════════════════════════════════════════════════════════════════════
const PLACEMENT_TEMPLATE = [
  { level: "A1", pointsEach: 1, subpools: [{ section: "Reading", count: 3 }, { section: "Grammar", count: 2 }] },
  { level: "A2", pointsEach: 1, subpools: [{ section: "Reading", count: 3 }, { section: "Vocabulary", count: 2 }] },
  { level: "B1", pointsEach: 2, subpools: [{ section: "Reading", count: 2 }, { section: "Listening", count: 2 }, { section: "Grammar", count: 1 }] },
  { level: "B2", pointsEach: 2, subpools: [{ section: "Reading", count: 2 }, { section: "Listening", count: 2 }, { section: "Writing", count: 1 }] },
  { level: "C1", pointsEach: 3, subpools: [{ section: "Reading", count: 2 }, { section: "Listening", count: 2 }, { section: "Speaking", count: 1 }] },
  { level: "C2", pointsEach: 3, subpools: [{ section: "Reading", count: 2 }, { section: "Grammar", count: 2 }, { section: "Writing", count: 1 }] },
];
const PLACEMENT_THRESHOLDS = { A1: 60, A2: 60, B1: 65, B2: 65, C1: 70, C2: 70 };

// ═════════════════════════════════════════════════════════════════════════════
// STUDENTS
// ═════════════════════════════════════════════════════════════════════════════
const STUDENTS_DATA = [
  { name: "Անի Հակոբյան",     email: "ani@example.am",    gender: "female", country: "Armenia", documentType: "passport", documentNumber: "AA123456" },
  { name: "Արամ Պետրոսյան",   email: "aram@example.am",   gender: "male",   country: "Armenia", documentType: "id_card",  documentNumber: "ID789012" },
  { name: "Մарine Grigoryan",  email: "marine@example.am", gender: "female", country: "Georgia", documentType: "passport", documentNumber: "GE345678" },
  { name: "Դавит Саргсян",     email: "davit@example.am",  gender: "male",   country: "Armenia", documentType: "passport", documentNumber: "AA001234" },
  { name: "Наташа К.",         email: "natasha@example.am",gender: "female", country: "Russia",  documentType: "passport", documentNumber: "RU998877" },
  { name: "Հайк Авагян",       email: "hayk@example.am",   gender: "male",   country: "Armenia", documentType: "id_card",  documentNumber: "ID111222" },
  { name: "Софья Адамян",      email: "sofia@example.am",  gender: "female", country: "France",  documentType: "passport", documentNumber: "FR556677" },
  { name: "Артур Мкртчян",     email: "artur@example.am",  gender: "male",   country: "Armenia", documentType: "passport", documentNumber: "AA333444" },
  { name: "Алина Н.",          email: "alina@example.am",  gender: "female", country: "USA",     documentType: "passport", documentNumber: "US223344" },
  { name: "Карен Г.",          email: "karen@example.am",  gender: "male",   country: "Armenia", documentType: "id_card",  documentNumber: "ID667788" },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log("🌱 Seeding...\n");

  // Wipe in safe order
  await prisma.result.deleteMany();
  await prisma.examAssignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.examCenter.deleteMany();
  await prisma.city.deleteMany();
  await prisma.question.deleteMany();
  await prisma.section.deleteMany();

  // ── Sections ────────────────────────────────────────────────────────────
  const sectionMap = {};
  for (const s of SECTIONS) {
    const sec = await prisma.section.create({ data: { name: s.name, category: s.category } });
    sectionMap[s.name] = sec.id;
  }
  console.log(`✅ ${SECTIONS.length} sections`);

  // ── Questions ───────────────────────────────────────────────────────────
  for (const q of QUESTIONS) {
    const { sectionName, ...rest } = q;
    await prisma.question.create({
      data: { ...rest, sectionId: sectionMap[sectionName] },
    });
  }
  console.log(`✅ ${QUESTIONS.length} questions`);

  // ── Cities & Centers ────────────────────────────────────────────────────
  const cityData = [
    { name: "Երևан",   center: { name: "ArmExam Կ. Երևան",   address: "Բաղрамян 24",  phone: "+374 10 123456", email: "yerevan@armexam.am"  } },
    { name: "Гюмри",   center: { name: "ArmExam Կ. Гюмри",   address: "Арևмтян 1",    phone: "+374 312 12345", email: "gyumri@armexam.am"   } },
    { name: "Вانаձор", center: { name: "ArmExam Կ. Вانаձор", address: "Кирови 5",     phone: "+374 322 12345", email: "vanadzor@armexam.am" } },
  ];
  const centers = [];
  for (const { name, center } of cityData) {
    const city = await prisma.city.create({
      data: { name, centers: { create: [center] } },
      include: { centers: true },
    });
    centers.push(city.centers[0]);
  }
  console.log(`✅ ${centers.length} centers`);

  // ── Placement exams ─────────────────────────────────────────────────────
  const placementExams = [];
  for (let i = 0; i < centers.length; i++) {
    const ex = await prisma.exam.create({
      data: {
        title: `Placement Test — ${cityData[i].name}`,
        examType: "placement", level: null,
        duration: 90, shuffle: true,
        showResults: true, showQuestionLevel: true, showQuestionPoints: true,
        placementTemplate: PLACEMENT_TEMPLATE,
        placementThresholds: PLACEMENT_THRESHOLDS,
        examCenterId: centers[i].id, status: "active",
      },
    });
    placementExams.push(ex);
  }
  console.log(`✅ ${placementExams.length} placement exams`);

  // ── Fixed exams ─────────────────────────────────────────────────────────
  const fixedDefs = [
    { title: "Հайоц Лезу A1", level: "A1", passingScore: 60,
      subpools: [{ section: "Reading", count: 3 }, { section: "Grammar", count: 2 }, { section: "Vocabulary", count: 2 }] },
    { title: "Հайоц Лезу A2", level: "A2", passingScore: 60,
      subpools: [{ section: "Reading", count: 3 }, { section: "Listening", count: 2 }, { section: "Grammar", count: 2 }] },
    { title: "Հайоц Лезу B1", level: "B1", passingScore: 65,
      subpools: [{ section: "Reading", count: 2 }, { section: "Listening", count: 2 }, { section: "Writing", count: 1 }, { section: "Grammar", count: 2 }] },
  ];
  const fixedExams = [];
  for (const fd of fixedDefs) {
    const ex = await prisma.exam.create({
      data: {
        title: fd.title, examType: "fixed", level: fd.level,
        duration: 60, passingScore: fd.passingScore, shuffle: true,
        showResults: true, showQuestionLevel: true, showQuestionPoints: true,
        subpools: fd.subpools,
        examCenterId: centers[0].id,
        status: "active",
        startDate: new Date("2025-01-01"), endDate: new Date("2025-12-31"),
      },
    });
    fixedExams.push(ex);
  }
  console.log(`✅ ${fixedExams.length} fixed exams`);

  // ── Students + PIN assignments ──────────────────────────────────────────
  const usedPins = new Set();
  const createdStudents = [];
  for (let i = 0; i < STUDENTS_DATA.length; i++) {
    const s = STUDENTS_DATA[i];
    const exam = placementExams[i % placementExams.length];
    const pin  = randPin(usedPins);
    const student = await prisma.student.create({
      data: {
        ...s,
        passwordHash: hashPassword("demo1234", s.email),
        exams: { create: [{ examId: exam.id, pin }] },
      },
    });
    createdStudents.push(student);
    console.log(`  👤 ${s.name.padEnd(22)} → PIN: ${pin}`);
  }
  console.log(`✅ ${createdStudents.length} students`);

  // ── Demo results ─────────────────────────────────────────────────────────
  const [ani, aram, marine, davit, hayk, artur] = createdStudents;

  // Fixed: Ani passed A1, A2, B1
  for (let i = 0; i < 3; i++) {
    const exam = fixedExams[i];
    const pct  = [82, 76, 65][i];
    const pin  = randPin(usedPins);
    const existingAssign = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId: exam.id, studentId: ani.id } },
    });
    if (!existingAssign) {
      await prisma.examAssignment.create({ data: { examId: exam.id, studentId: ani.id, pin } });
    }
    await prisma.result.create({
      data: { examId: exam.id, studentId: ani.id, score: pct, totalPoints: 100, pct, passed: true, gradingStatus: "auto", submittedAt: new Date(`2025-0${2 + i * 2}-15`) },
    });
  }
  // Fixed: Aram failed A1
  {
    const pin = randPin(usedPins);
    const existingAssign = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId: fixedExams[0].id, studentId: aram.id } },
    });
    if (!existingAssign) {
      await prisma.examAssignment.create({ data: { examId: fixedExams[0].id, studentId: aram.id, pin } });
    }
    await prisma.result.create({
      data: { examId: fixedExams[0].id, studentId: aram.id, score: 47, totalPoints: 100, pct: 47, passed: false, gradingStatus: "auto", submittedAt: new Date("2025-03-10") },
    });
  }
  // Placement: Davit → B2, Hayk → C1, Artur → below minimum
  const placementResultDefs = [
    { student: davit, levelStats: { A1:{earnedPts:5,maxPts:5,pct:100,passed:true}, A2:{earnedPts:5,maxPts:5,pct:100,passed:true}, B1:{earnedPts:8,maxPts:10,pct:80,passed:true}, B2:{earnedPts:7,maxPts:10,pct:70,passed:true}, C1:{earnedPts:6,maxPts:15,pct:40,passed:false}, C2:{earnedPts:4,maxPts:15,pct:27,passed:false} }, detectedLevel:"B2", passed:true,  date:"2025-02-01" },
    { student: hayk,  levelStats: { A1:{earnedPts:5,maxPts:5,pct:100,passed:true}, A2:{earnedPts:5,maxPts:5,pct:100,passed:true}, B1:{earnedPts:9,maxPts:10,pct:90,passed:true}, B2:{earnedPts:8,maxPts:10,pct:80,passed:true}, C1:{earnedPts:11,maxPts:15,pct:73,passed:true}, C2:{earnedPts:6,maxPts:15,pct:40,passed:false} }, detectedLevel:"C1", passed:true,  date:"2025-02-14" },
    { student: artur, levelStats: { A1:{earnedPts:2,maxPts:5,pct:40,passed:false}, A2:{earnedPts:1,maxPts:5,pct:20,passed:false}, B1:{earnedPts:2,maxPts:10,pct:20,passed:false}, B2:{earnedPts:1,maxPts:10,pct:10,passed:false}, C1:{earnedPts:1,maxPts:15,pct:7,passed:false}, C2:{earnedPts:0,maxPts:15,pct:0,passed:false} }, detectedLevel:null, passed:false, date:"2025-02-20" },
  ];
  for (const rd of placementResultDefs) {
    const exam = placementExams[0];
    const totalPts  = Object.values(rd.levelStats).reduce((s, l) => s + l.maxPts, 0);
    const earnedPts = Object.values(rd.levelStats).reduce((s, l) => s + l.earnedPts, 0);
    const pct = Math.round((earnedPts / totalPts) * 100);
    const existingAssign = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId: exam.id, studentId: rd.student.id } },
    });
    if (!existingAssign) {
      await prisma.examAssignment.create({ data: { examId: exam.id, studentId: rd.student.id, pin: randPin(usedPins) } });
    }
    await prisma.result.create({
      data: { examId: exam.id, studentId: rd.student.id, score: earnedPts, totalPoints: totalPts, pct, passed: rd.passed, detectedLevel: rd.detectedLevel, levelStats: rd.levelStats, gradingStatus: "auto", submittedAt: new Date(rd.date) },
    });
    console.log(`  🎯 ${rd.student.name} → ${rd.detectedLevel ?? "below min"} | ${pct}%`);
  }
  // Pending manual grading: Marine
  {
    const exam = fixedExams[1];
    const pin  = randPin(usedPins);
    const existingAssign = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId: exam.id, studentId: marine.id } },
    });
    if (!existingAssign) {
      await prisma.examAssignment.create({ data: { examId: exam.id, studentId: marine.id, pin } });
    }
    const speakingQs = await prisma.question.findMany({ where: { type: { in: ["SPEAKING_INDEPENDENT","SPEAKING_INTEGRATED","WRITING_INDEPENDENT","WRITING_INTEGRATED"] } }, take: 2 });
    const pendingAnswers = {};
    for (const q of speakingQs) {
      pendingAnswers[q.id] = q.type.startsWith("SPEAKING") ? "/voice/demo-marine.webm" : "Ես կարծում եմ, որ...";
    }
    await prisma.result.create({
      data: { examId: exam.id, studentId: marine.id, score: 0, totalPoints: speakingQs.reduce((s,q)=>s+q.points,0), pct: 0, passed: null, answers: pendingAnswers, gradingStatus: "pending", submittedAt: new Date("2025-03-01") },
    });
    console.log(`  ⏳ Marine → pending manual grading`);
  }
  console.log("✅ Demo results");

  // ── Admins ──────────────────────────────────────────────────────────────
  const adminDefs = [
    { name: "Super Admin",  email: "admin@armexam.am",    password: "admin1234", role: "super_admin",  centerId: null        },
    { name: "Center Admin", email: "center@armexam.am",   password: "demo1234",  role: "center_admin", centerId: centers[0].id },
    { name: "Moderator",    email: "moder@armexam.am",    password: "demo1234",  role: "moderator",    centerId: null        },
    { name: "Examiner",     email: "examiner@armexam.am", password: "demo1234",  role: "examiner",     centerId: null        },
  ];
  for (const a of adminDefs) {
    await prisma.admin.create({
      data: { name: a.name, email: a.email, role: a.role, centerId: a.centerId, status: "active", passwordHash: hashPassword(a.password, a.email) },
    });
  }
  console.log(`✅ ${adminDefs.length} admins`);

  console.log("\n🎉 Seed complete!");
  console.log("   Admin:    admin@armexam.am / admin1234");
  console.log("   Students: demo1234");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
