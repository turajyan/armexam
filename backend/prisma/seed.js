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
// 4 SECTIONS ONLY
// READING  — free navigation, text/image questions
// LISTENING — linear navigation, audio/video with play limits
// SPEAKING  — automated timers (prep + record), MediaRecorder
// WRITING   — word counter, clipboard & spellcheck disabled
// ═════════════════════════════════════════════════════════════════════════════
const SECTIONS = [
  { name: "READING",   category: "READING"   },
  { name: "LISTENING", category: "LISTENING" },
  { name: "SPEAKING",  category: "SPEAKING"  },
  { name: "WRITING",   category: "WRITING"   },
];

const PTS = { A1:1, A2:1, B1:2, B2:3, C1:4, C2:5 };

const R  = "READING";
const L  = "LISTENING";
const SP = "SPEAKING";
const W  = "WRITING";

const QUESTIONS = [

  // ══════════════════════════════════════════════════════════════════════════
  // READING — SINGLE_CHOICE
  // ══════════════════════════════════════════════════════════════════════════
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "A1", points: PTS.A1,
    contextText: "Tom is eight years old. He lives with his mother and father. He has one sister. Her name is Lucy. She is six years old. Tom likes football. Lucy likes cats.",
    prompt: "How old is Lucy?",
    content: { options: ["Six years old", "Eight years old", "Ten years old", "Five years old"], correct: 0 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "A1", points: PTS.A1,
    contextText: "The library opens at nine o'clock every morning. It closes at six o'clock in the evening. On Sundays it is closed.",
    prompt: "When does the library close on weekdays?",
    content: { options: ["At five o'clock", "At nine o'clock", "At six o'clock", "At noon"], correct: 2 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    contextText: "Anna works in a hospital. She is a nurse. She starts work at seven in the morning and finishes at three in the afternoon. She usually takes the bus to work but sometimes she walks when the weather is good.",
    prompt: "How does Anna usually travel to work?",
    content: { options: ["By car", "By bus", "On foot", "By train"], correct: 1 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    contextText: "The new shopping centre opened last month. It has more than 80 shops, three restaurants, and a cinema. It is open every day from ten in the morning until nine at night. Parking is free for the first two hours.",
    prompt: "What is true about the shopping centre?",
    content: { options: ["It opened last year", "It has five restaurants", "Parking is always free", "It has more than 80 shops"], correct: 3 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    contextText: "A recent study found that people who spend more than three hours a day on social media are more likely to feel lonely and depressed. However, researchers stress that the relationship is complex. Some people use social media to maintain friendships and this can have a positive effect on their wellbeing.",
    prompt: "What do the researchers conclude about social media and mental health?",
    content: { options: ["Social media always causes depression", "Social media always improves wellbeing", "The effect of social media on wellbeing is not straightforward", "People should stop using social media"], correct: 2 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    contextText: "Scientists have found that regular physical activity reduces the risk of heart disease, stroke, and certain cancers. Even moderate exercise, such as a 30-minute walk five days a week, can significantly improve long-term health outcomes. Despite this evidence, many adults in developed countries remain sedentary.",
    prompt: "According to the text, how much exercise is described as beneficial?",
    content: { options: ["One hour of intense exercise daily", "30 minutes of walking five days a week", "Light stretching for 10 minutes each morning", "Swimming for one hour three times a week"], correct: 1 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "B2", points: PTS.B2,
    contextText: "The concept of 'nudge theory', developed by Thaler and Sunstein, suggests that positive reinforcement and indirect suggestions can influence people's behaviour without restricting their freedom of choice. Governments have increasingly adopted nudge strategies in public health campaigns, for instance by making healthy food options more prominent in cafeterias.",
    prompt: "What is the key principle behind nudge theory?",
    content: { options: [
      "Forcing people to make healthy choices through legislation",
      "Using financial penalties to change behaviour",
      "Influencing decisions without removing individual freedom",
      "Restricting access to unhealthy options",
    ], correct: 2 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "B2", points: PTS.B2,
    contextText: "Urban heat islands occur when cities experience significantly higher temperatures than surrounding rural areas. Dark surfaces such as asphalt and rooftops absorb solar radiation, while the absence of vegetation reduces evaporative cooling. This phenomenon increases energy consumption as residents rely more heavily on air conditioning.",
    prompt: "Which factor does NOT contribute to urban heat islands according to the text?",
    content: { options: [
      "Dark road surfaces absorbing heat",
      "Lack of vegetation",
      "High rainfall in urban centres",
      "Increased use of air conditioning",
    ], correct: 2 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "C1", points: PTS.C1,
    contextText: "Critics of globalization argue that the free movement of capital leads to a 'race to the bottom', whereby nations compete by lowering labour standards and environmental regulations to attract foreign investment. Proponents counter that integration into global markets ultimately raises living standards by generating growth and transferring technology to developing economies.",
    prompt: "What does the 'race to the bottom' argument claim about globalization?",
    content: { options: [
      "Countries improve standards to attract investors",
      "Nations weaken regulations to compete for investment",
      "Technology transfer benefits developing nations",
      "Economic growth equalises living standards globally",
    ], correct: 1 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "C2", points: PTS.C2,
    contextText: "The Sapir-Whorf hypothesis, in its strong form, holds that language does not merely reflect thought but determines it — that speakers of different languages inhabit fundamentally different conceptual universes. While the strong version has largely been discredited, the weaker relativity hypothesis, which posits that language influences but does not wholly constrain cognition, retains empirical support, particularly in domains such as colour perception and spatial reasoning.",
    prompt: "What distinction does the passage draw between the strong and weak forms of the Sapir-Whorf hypothesis?",
    content: { options: [
      "The strong form has empirical support; the weak form does not",
      "The strong form claims language shapes thought partially; the weak form claims it does so entirely",
      "The strong form claims language determines thought; the weak form claims it merely influences it",
      "Both forms are considered equally valid by contemporary linguists",
    ], correct: 2 },
  },

  // ── READING — MULTIPLE_CHOICE ─────────────────────────────────────────────
  {
    sectionName: R, type: "MULTIPLE_CHOICE", level: "B1", points: PTS.B1,
    contextText: "Regular physical exercise has many well-documented benefits. It strengthens the cardiovascular system and helps maintain a healthy weight. Exercise also releases endorphins, which can reduce stress and improve mood. Additionally, it can lower the risk of type 2 diabetes and some forms of cancer.",
    prompt: "Which TWO benefits of exercise are mentioned in the passage? (Choose 2)",
    content: { options: ["Improves memory directly", "Reduces stress", "Eliminates the risk of all cancers", "Strengthens the heart"], correct: [1, 3], requiredCount: 2 },
  },
  {
    sectionName: R, type: "MULTIPLE_CHOICE", level: "B2", points: PTS.B2,
    contextText: "Remote working has transformed the modern workplace. Employees report greater flexibility and reduced commuting time. However, companies face challenges maintaining team cohesion and monitoring productivity. Some workers struggle with isolation, blurring of work-life boundaries, and inadequate home office setups.",
    prompt: "Which THREE challenges of remote working are mentioned? (Choose 3)",
    content: { options: ["Reduced flexibility", "Difficulty maintaining team cohesion", "Higher commuting costs", "Isolation among workers", "Blurring of work-life boundaries"], correct: [1, 3, 4], requiredCount: 3 },
  },

  // ── READING — FILL_IN_THE_BLANKS ──────────────────────────────────────────
  {
    sectionName: R, type: "FILL_IN_THE_BLANKS", level: "A2", points: PTS.A2,
    prompt: "Complete the text with the missing words.",
    content: {
      segments: [
        { type: "text",  value: "Every morning, David " },
        { type: "blank", id: 1, answer: "wakes" },
        { type: "text",  value: " up at seven o'clock. He " },
        { type: "blank", id: 2, answer: "has" },
        { type: "text",  value: " breakfast and then " },
        { type: "blank", id: 3, answer: "goes" },
        { type: "text",  value: " to work by bus." },
      ],
    },
  },
  {
    sectionName: R, type: "FILL_IN_THE_BLANKS", level: "B1", points: PTS.B1,
    prompt: "Complete the passage with the correct words.",
    content: {
      segments: [
        { type: "text",  value: "Climate change is one of the most " },
        { type: "blank", id: 1, answer: "serious" },
        { type: "text",  value: " challenges facing humanity. Scientists agree that global temperatures are " },
        { type: "blank", id: 2, answer: "rising" },
        { type: "text",  value: " due to greenhouse gas " },
        { type: "blank", id: 3, answer: "emissions" },
        { type: "text",  value: "." },
      ],
    },
  },
  {
    sectionName: R, type: "FILL_IN_THE_BLANKS", level: "B2", points: PTS.B2,
    prompt: "Complete the text with appropriate words.",
    content: {
      segments: [
        { type: "text",  value: "Although the economy has shown signs of recovery, many households continue to " },
        { type: "blank", id: 1, answer: "struggle" },
        { type: "text",  value: " with the cost of living. Inflation has " },
        { type: "blank", id: 2, answer: "eroded" },
        { type: "text",  value: " real wages, making it harder for families to " },
        { type: "blank", id: 3, answer: "afford" },
        { type: "text",  value: " basic necessities." },
      ],
    },
  },

  // ── READING — DRAG_TO_TEXT ────────────────────────────────────────────────
  {
    sectionName: R, type: "DRAG_TO_TEXT", level: "A2", points: PTS.A2,
    prompt: "Drag the correct word into each gap.",
    content: {
      text: "The sun {slot_1} in the east and {slot_2} in the west every day.",
      wordBank: ["rises", "sets", "sleeps", "falls"],
      slots: { slot_1: "rises", slot_2: "sets" },
    },
  },
  {
    sectionName: R, type: "DRAG_TO_TEXT", level: "B1", points: PTS.B1,
    prompt: "Drag the correct form into each gap. (Grammar: Past Perfect)",
    content: {
      text: "By the time she arrived, he {slot_1} already {slot_2} the report.",
      wordBank: ["had", "has", "finished", "finishing", "finish"],
      slots: { slot_1: "had", slot_2: "finished" },
    },
  },
  {
    sectionName: R, type: "DRAG_TO_TEXT", level: "B2", points: PTS.B2,
    prompt: "Drag the correct words to complete the sentence. (Grammar: Inversion)",
    content: {
      text: "Not only {slot_1} she pass the exam, but she {slot_2} the highest score in the class.",
      wordBank: ["did", "had", "also achieved", "was achieving", "achieve"],
      slots: { slot_1: "did", slot_2: "also achieved" },
    },
  },

  // ── READING — TEXT_INSERTION ──────────────────────────────────────────────
  {
    sectionName: R, type: "TEXT_INSERTION", level: "B2", points: PTS.B2,
    contextText: "The internet has revolutionised how we access information. [1] Libraries still play an important role in communities. [2] Digital literacy has become an essential skill for all age groups. [3]",
    prompt: "Choose which sentence best fits each gap.",
    content: {
      passages: [
        "However, not everyone has reliable access to online resources.",
        "They provide free access to books and quiet study spaces.",
        "Schools and employers increasingly require basic computer skills.",
      ],
      markers: [{ id: 1, correct: 0 }, { id: 2, correct: 1 }, { id: 3, correct: 2 }],
    },
  },

  // ── READING — DRAG_AND_DROP_TABLE ─────────────────────────────────────────
  {
    sectionName: R, type: "DRAG_AND_DROP_TABLE", level: "B1", points: PTS.B1,
    prompt: "Sort the items into the correct columns.",
    content: {
      columns: [
        { id: "col_adv", title: "Advantages" },
        { id: "col_dis", title: "Disadvantages" },
      ],
      items: [
        { id: "i1", text: "Saves travel time" },
        { id: "i2", text: "Feeling isolated from colleagues" },
        { id: "i3", text: "More flexibility in working hours" },
        { id: "i4", text: "Difficulty separating work from home life" },
      ],
      correct: { i1: "col_adv", i2: "col_dis", i3: "col_adv", i4: "col_dis" },
    },
  },
  {
    sectionName: R, type: "DRAG_AND_DROP_TABLE", level: "C1", points: PTS.C1,
    prompt: "Classify the following statements under the correct heading.",
    content: {
      columns: [
        { id: "col_re", title: "Renewable Energy" },
        { id: "col_fo", title: "Fossil Fuels" },
        { id: "col_bo", title: "Both" },
      ],
      items: [
        { id: "i1", text: "Contributes to energy security" },
        { id: "i2", text: "Produces carbon dioxide emissions" },
        { id: "i3", text: "Requires significant infrastructure investment" },
        { id: "i4", text: "Powered by solar or wind sources" },
      ],
      correct: { i1: "col_bo", i2: "col_fo", i3: "col_bo", i4: "col_re" },
    },
  },

  // ── READING — Grammar questions (now in READING section) ──────────────────
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "A1", points: PTS.A1,
    prompt: "Grammar: Choose the correct form: 'There ___ a cat in the garden.'",
    content: { options: ["are", "is", "am", "be"], correct: 1 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    prompt: "Grammar: Choose the correct form: 'She ___ to school every day.'",
    content: { options: ["go", "goes", "going", "gone"], correct: 1 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    prompt: "Grammar: Choose the correct form: 'If I ___ you, I would apologise immediately.'",
    content: { options: ["am", "was", "were", "will be"], correct: 2 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "B2", points: PTS.B2,
    prompt: "Grammar: Choose the correct form: 'The report ___ by the committee before the deadline.'",
    content: { options: ["was submitted", "submitted", "had submitted", "has been submitting"], correct: 0 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "C1", points: PTS.C1,
    prompt: "Grammar: Choose the correct form: '___ he to resign, the board would face a serious crisis.'",
    content: { options: ["If", "Were", "Should", "Had"], correct: 1 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "C2", points: PTS.C2,
    prompt: "Grammar: Which sentence is correct for formal academic writing?",
    content: { options: [
      "The data shows that there is a big difference.",
      "The data indicate a statistically significant divergence.",
      "The data is showing us a very different picture.",
      "As the data shows, things are quite different.",
    ], correct: 1 },
  },

  // ── READING — Vocabulary questions (now in READING section) ───────────────
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "A1", points: PTS.A1,
    prompt: "Vocabulary: What does the word 'big' mean?",
    content: { options: ["Small", "Fast", "Large", "Slow"], correct: 2 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    prompt: "Vocabulary: Which word is a synonym of 'happy'?",
    content: { options: ["Sad", "Angry", "Joyful", "Tired"], correct: 2 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    prompt: "Vocabulary: Choose the correct collocation: 'The medicine had several unexpected ___.'",
    content: { options: ["side effects", "side causes", "after effects", "by-products"], correct: 0 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "B2", points: PTS.B2,
    prompt: "Vocabulary: Which word is closest in meaning to 'ameliorate'?",
    content: { options: ["Worsen", "Improve", "Ignore", "Measure"], correct: 1 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "C1", points: PTS.C1,
    prompt: "Vocabulary: Choose the most precise word: 'The politician's speech was deliberately ___, designed to mean different things to different audiences.'",
    content: { options: ["verbose", "ambiguous", "concise", "inflammatory"], correct: 1 },
  },
  {
    sectionName: R, type: "SINGLE_CHOICE", level: "C2", points: PTS.C2,
    prompt: "Vocabulary: Choose the best word: 'The critic's ___ review dismantled the author's central thesis with surgical precision.'",
    content: { options: ["perfunctory", "trenchant", "sycophantic", "laconic"], correct: 1 },
  },

  // ── READING — IMAGE_CLICK ─────────────────────────────────────────────────
  {
    sectionName: R, type: "IMAGE_CLICK", level: "B1", points: PTS.B1,
    media: [
      { type: "image", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/800px-Good_Food_Display_-_NCI_Visuals_Online.jpg" },
    ],
    prompt: "Look at the image. Click on the area that shows vegetables.",
    content: {
      hotspots: [
        { id: "hs1", x: 20.0, y: 30.0, width: 20.0, height: 20.0, correct: true  },
        { id: "hs2", x: 60.0, y: 50.0, width: 20.0, height: 20.0, correct: false },
        { id: "hs3", x: 70.0, y: 10.0, width: 15.0, height: 15.0, correct: false },
      ],
    },
  },
  {
    sectionName: R, type: "DRAG_AND_DROP_IMAGE", level: "C1", points: PTS.C1,
    media: [{ type: "image", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Aras_river_basin_map.png/640px-Aras_river_basin_map.png" }],
    prompt: "Drag the country labels to the correct locations on the map.",
    content: {
      labels: [
        { id: "lbl1", text: "Armenia" },
        { id: "lbl2", text: "Turkey" },
        { id: "lbl3", text: "Azerbaijan" },
      ],
      hotspots: [
        { id: "hs1", x: 55.0, y: 40.0, correct: "lbl1" },
        { id: "hs2", x: 25.0, y: 35.0, correct: "lbl2" },
        { id: "hs3", x: 75.0, y: 45.0, correct: "lbl3" },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LISTENING — linear navigation, audio/video with play limits
  // ══════════════════════════════════════════════════════════════════════════
  {
    sectionName: L, type: "SINGLE_CHOICE", level: "A2", points: PTS.A2,
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Sainte-M%C3%A8re-%C3%89glise_p1020648.ogg", maxPlays: 2 }],
    prompt: "Listen to the recording (max 2 plays). What is the main sound you can hear?",
    content: { options: ["Traffic noise", "Nature sounds", "A conversation", "Music"], correct: 1 },
  },
  {
    sectionName: L, type: "SINGLE_CHOICE", level: "B1", points: PTS.B1,
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/1/19/MiniSunflower.ogg", maxPlays: 2 }],
    prompt: "Listen and choose the best description of the audio. (max 2 plays)",
    content: { options: ["A news report", "A piece of music", "A weather forecast", "A sports commentary"], correct: 1 },
  },
  {
    sectionName: L, type: "MULTIPLE_CHOICE", level: "B2", points: PTS.B2,
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Vespers_of_Holy_Saturday_%28sample%29.ogg", maxPlays: 1 }],
    prompt: "Listen ONCE and select the TWO correct statements. (Choose 2)",
    content: {
      options: ["It is performed in a religious context", "It is a solo instrument piece", "It involves vocal performance", "It uses electronic sound effects"],
      correct: [0, 2], requiredCount: 2,
    },
  },
  {
    sectionName: L, type: "SINGLE_CHOICE", level: "B2", points: PTS.B2,
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/1/19/MiniSunflower.ogg", maxPlays: 1 }],
    prompt: "Listen ONCE. The speaker's main point is that healthy eating…",
    content: { options: [
      "requires expensive ingredients",
      "can be achieved on a budget",
      "is only possible in cities",
      "needs professional guidance",
    ], correct: 1 },
  },
  {
    sectionName: L, type: "SINGLE_CHOICE", level: "C1", points: PTS.C1,
    media: [{ type: "video", url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e6/Bison_at_Yellowstone.ogv/Bison_at_Yellowstone.ogv.360p.ogv", maxPlays: 1 }],
    prompt: "Watch the video ONCE. What is the primary subject?",
    content: { options: ["Wildlife in a natural habitat", "Industrial activity", "Urban environment", "Marine research"], correct: 0 },
  },
  {
    sectionName: L, type: "IMAGE_CLICK", level: "B1", points: PTS.B1,
    media: [
      { type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Sainte-M%C3%A8re-%C3%89glise_p1020648.ogg", maxPlays: 2 },
      { type: "image", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/800px-Good_Food_Display_-_NCI_Visuals_Online.jpg" },
    ],
    prompt: "Listen and click on the area of the image that is described. (max 2 plays)",
    content: {
      hotspots: [
        { id: "hs1", x: 20.0, y: 30.0, width: 20.0, height: 20.0, correct: true  },
        { id: "hs2", x: 60.0, y: 50.0, width: 20.0, height: 20.0, correct: false },
        { id: "hs3", x: 70.0, y: 10.0, width: 15.0, height: 15.0, correct: false },
      ],
    },
  },
  {
    sectionName: L, type: "DRAG_AND_DROP_IMAGE", level: "C1", points: PTS.C1,
    media: [{ type: "image", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Aras_river_basin_map.png/640px-Aras_river_basin_map.png" }],
    prompt: "Drag the country labels to the correct locations on the map.",
    content: {
      labels: [
        { id: "lbl1", text: "Armenia" },
        { id: "lbl2", text: "Turkey" },
        { id: "lbl3", text: "Azerbaijan" },
      ],
      hotspots: [
        { id: "hs1", x: 55.0, y: 40.0, correct: "lbl1" },
        { id: "hs2", x: 25.0, y: 35.0, correct: "lbl2" },
        { id: "hs3", x: 75.0, y: 45.0, correct: "lbl3" },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SPEAKING — automated timers, MediaRecorder, no manual control
  // ══════════════════════════════════════════════════════════════════════════
  {
    sectionName: SP, type: "SPEAKING_INDEPENDENT", level: "A1", points: PTS.A1,
    prompt: "Introduce yourself. Say your name, your age, and where you live.",
    content: {
      prepSeconds: 15, recordSeconds: 45, maxAttempts: 2,
      rubrics: [
        { id: "fluency",       label: "Fluency & Coherence",  maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation",        maxScore: 5 },
      ],
    },
  },
  {
    sectionName: SP, type: "SPEAKING_INDEPENDENT", level: "B1", points: PTS.B1,
    prompt: "Describe your hometown. What do you like and dislike about it?",
    content: {
      prepSeconds: 30, recordSeconds: 90, maxAttempts: 1,
      rubrics: [
        { id: "fluency",       label: "Fluency & Coherence",  maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation",        maxScore: 5 },
      ],
    },
  },
  {
    sectionName: SP, type: "SPEAKING_INDEPENDENT", level: "B2", points: PTS.B2,
    prompt: "Do you think social media has a positive or negative effect on society? Give reasons and examples to support your view.",
    content: {
      prepSeconds: 45, recordSeconds: 120, maxAttempts: 1,
      rubrics: [
        { id: "fluency",       label: "Fluency & Coherence",  maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation",        maxScore: 5 },
      ],
    },
  },
  {
    sectionName: SP, type: "SPEAKING_INTEGRATED", level: "C1", points: PTS.C1,
    contextText: "Read the following passage:\n\nThe rapid adoption of artificial intelligence in the workplace is transforming employment patterns. Some economists predict that automation will displace millions of routine jobs, while others argue that new technologies historically create more jobs than they destroy.",
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Vespers_of_Holy_Saturday_%28sample%29.ogg", maxPlays: 1 }],
    prompt: "Using both the text and the audio, explain how technological change affects employment and society.",
    content: {
      prepSeconds: 45, recordSeconds: 120, maxAttempts: 1,
      rubrics: [
        { id: "fluency",       label: "Fluency & Coherence",  maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation",        maxScore: 5 },
      ],
    },
  },
  {
    sectionName: SP, type: "SPEAKING_INDEPENDENT", level: "C2", points: PTS.C2,
    prompt: "To what extent is democracy compatible with technocratic governance? Develop a reasoned argument drawing on specific examples.",
    content: {
      prepSeconds: 60, recordSeconds: 180, maxAttempts: 1,
      rubrics: [
        { id: "fluency",       label: "Fluency & Coherence",  maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
        { id: "pronunciation", label: "Pronunciation",        maxScore: 5 },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // WRITING — word counter, clipboard & spellcheck disabled
  // ══════════════════════════════════════════════════════════════════════════
  {
    sectionName: W, type: "WRITING_INDEPENDENT", level: "B1", points: PTS.B1,
    prompt: "Write about a person who has influenced your life. Who are they and why are they important to you? (100–150 words)",
    content: {
      minWords: 100, maxWords: 150,
      rubrics: [
        { id: "task_response", label: "Task Response",        maxScore: 5 },
        { id: "coherence",     label: "Coherence & Cohesion", maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
      ],
    },
  },
  {
    sectionName: W, type: "WRITING_INDEPENDENT", level: "B2", points: PTS.B2,
    prompt: "'The benefits of living in a city outweigh the disadvantages.' To what extent do you agree? Give reasons and examples. (150–200 words)",
    content: {
      minWords: 150, maxWords: 200,
      rubrics: [
        { id: "task_response", label: "Task Response",        maxScore: 5 },
        { id: "coherence",     label: "Coherence & Cohesion", maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
      ],
    },
  },
  {
    sectionName: W, type: "WRITING_INTEGRATED", level: "C1", points: PTS.C1,
    contextText: "Read the following passage:\n\nThe integration of AI into education offers opportunities for personalised learning pathways. Adaptive systems can identify gaps in student knowledge and adjust content accordingly. Critics, however, argue that reducing the role of human teachers risks undermining the social and emotional dimensions of education.",
    media: [{ type: "audio", url: "https://upload.wikimedia.org/wikipedia/commons/1/19/MiniSunflower.ogg", maxPlays: 2 }],
    prompt: "Drawing on both the text and the audio, write an essay discussing the role and limitations of AI in education. (200–250 words)",
    content: {
      minWords: 200, maxWords: 250,
      rubrics: [
        { id: "task_response", label: "Task Response",        maxScore: 5 },
        { id: "coherence",     label: "Coherence & Cohesion", maxScore: 5 },
        { id: "lexical",       label: "Lexical Resource",     maxScore: 5 },
        { id: "grammar",       label: "Grammatical Range",    maxScore: 5 },
      ],
    },
  },
  {
    sectionName: W, type: "WRITING_INDEPENDENT", level: "C2", points: PTS.C2,
    prompt: "Critically evaluate the claim that economic growth and environmental sustainability are fundamentally incompatible goals. Use evidence and reasoned argument. (250–350 words)",
    content: {
      minWords: 250, maxWords: 350,
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
// PLACEMENT TEMPLATE — 4 sections only
// ═════════════════════════════════════════════════════════════════════════════
const PLACEMENT_TEMPLATE = [
  { level: "A1", pointsEach: 1, subpools: [{ section: R, count: 4 }, { section: L, count: 1 }] },
  { level: "A2", pointsEach: 1, subpools: [{ section: R, count: 3 }, { section: L, count: 2 }] },
  { level: "B1", pointsEach: 2, subpools: [{ section: R, count: 2 }, { section: L, count: 2 }, { section: W, count: 1 }] },
  { level: "B2", pointsEach: 2, subpools: [{ section: R, count: 2 }, { section: L, count: 2 }, { section: W, count: 1 }] },
  { level: "C1", pointsEach: 3, subpools: [{ section: R, count: 2 }, { section: L, count: 2 }, { section: SP, count: 1 }] },
  { level: "C2", pointsEach: 3, subpools: [{ section: R, count: 2 }, { section: SP, count: 1 }, { section: W, count: 1 }] },
];
const PLACEMENT_THRESHOLDS = { A1: 60, A2: 60, B1: 65, B2: 65, C1: 70, C2: 70 };

// ═════════════════════════════════════════════════════════════════════════════
// STUDENTS
// ═════════════════════════════════════════════════════════════════════════════
const STUDENTS_DATA = [
  { name: "Mariam Karapetyan",  email: "mariam@example.am",  gender: "female", country: "Armenia", documentType: "passport", documentNumber: "AA123456", level: "B1" },
  { name: "Vazgen Sargsyan",    email: "vazgen@example.am",  gender: "male",   country: "Armenia", documentType: "id_card",  documentNumber: "ID789012", level: "A2" },
  { name: "Narine Grigoryan",   email: "narine@example.am",  gender: "female", country: "Armenia", documentType: "passport", documentNumber: "AA345678", level: "B2" },
  { name: "Davit Petrosyan",    email: "davit@example.am",   gender: "male",   country: "Armenia", documentType: "passport", documentNumber: "AA001234", level: "C1" },
  { name: "Ani Hakobyan",       email: "ani@example.am",     gender: "female", country: "Armenia", documentType: "id_card",  documentNumber: "ID556677", level: "A2" },
  { name: "Hayk Avagyan",       email: "hayk@example.am",    gender: "male",   country: "Armenia", documentType: "id_card",  documentNumber: "ID111222", level: "B2" },
  { name: "Lusine Mkrtchyan",   email: "lusine@example.am",  gender: "female", country: "Armenia", documentType: "passport", documentNumber: "AA667788", level: "A1" },
  { name: "Artur Poghosyan",    email: "artur@example.am",   gender: "male",   country: "Armenia", documentType: "passport", documentNumber: "AA333444", level: "B1" },
  { name: "Sona Hovhannisyan",  email: "sona@example.am",    gender: "female", country: "Armenia", documentType: "passport", documentNumber: "AA778899", level: "A1" },
  { name: "Karen Galstyan",     email: "karen@example.am",   gender: "male",   country: "Armenia", documentType: "id_card",  documentNumber: "ID223344", level: "A2" },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log("🌱 Seeding...\n");

  await prisma.result.deleteMany();
  await prisma.examAssignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.examCenter.deleteMany();
  await prisma.city.deleteMany();
  await prisma.question.deleteMany();
  await prisma.section.deleteMany();

  // ── Sections ─────────────────────────────────────────────────────────────
  const sectionMap = {};
  for (const s of SECTIONS) {
    const sec = await prisma.section.create({ data: { name: s.name, category: s.category } });
    sectionMap[s.name] = sec.id;
  }
  console.log(`✅ ${SECTIONS.length} sections: ${SECTIONS.map(s=>s.name).join(", ")}`);

  // ── Questions ─────────────────────────────────────────────────────────────
  for (const q of QUESTIONS) {
    const { sectionName, ...rest } = q;
    await prisma.question.create({ data: { ...rest, sectionId: sectionMap[sectionName] } });
  }
  console.log(`✅ ${QUESTIONS.length} questions`);

  // ── Cities & Centers ──────────────────────────────────────────────────────
  const cityData = [
    { name: "Yerevan",  center: { name: "ArmExam Center Yerevan",  address: "Baghramyan 24", phone: "+374 10 123456", email: "yerevan@armexam.am"  } },
    { name: "Gyumri",   center: { name: "ArmExam Center Gyumri",   address: "Arevmtyan 1",   phone: "+374 312 12345", email: "gyumri@armexam.am"   } },
    { name: "Vanadzor", center: { name: "ArmExam Center Vanadzor", address: "Kirovi 5",       phone: "+374 322 12345", email: "vanadzor@armexam.am" } },
  ];
  const centers = [];
  for (const { name, center } of cityData) {
    const city = await prisma.city.create({ data: { name, centers: { create: [center] } }, include: { centers: true } });
    centers.push(city.centers[0]);
  }
  console.log(`✅ ${centers.length} centers`);

  // ── Placement exams ───────────────────────────────────────────────────────
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
        examCenterId: centers[i].id, status: "active", isOpen: true,
        startDate: new Date("2026-04-15"), endDate: new Date("2026-04-15"),
        startTime: "10:00",
      },
    });
    placementExams.push(ex);
  }
  console.log(`✅ ${placementExams.length} placement exams`);

  // ── Fixed exams ───────────────────────────────────────────────────────────
  const fixedDefs = [
    { title: "Armenian Language Certificate A1", level: "A1", passingScore: 60,
      subpools: [{ section: R, count: 4 }, { section: L, count: 2 }, { section: W, count: 1 }] },
    { title: "Armenian Language Certificate A2", level: "A2", passingScore: 60,
      subpools: [{ section: R, count: 4 }, { section: L, count: 2 }, { section: W, count: 1 }] },
    { title: "Armenian Language Certificate B1", level: "B1", passingScore: 65,
      subpools: [{ section: R, count: 3 }, { section: L, count: 2 }, { section: W, count: 1 }, { section: SP, count: 1 }] },
  ];
  const fixedExams = [];
  for (const fd of fixedDefs) {
    const ex = await prisma.exam.create({
      data: {
        title: fd.title, examType: "fixed", level: fd.level,
        duration: 60, passingScore: fd.passingScore, shuffle: true,
        showResults: true, showQuestionLevel: true, showQuestionPoints: true,
        subpools: fd.subpools, examCenterId: centers[0].id,
        status: "active", isOpen: true,
        startDate: new Date("2026-04-01"), endDate: new Date("2026-06-30"),
        startTime: "09:00",
      },
    });
    fixedExams.push(ex);
  }
  console.log(`✅ ${fixedExams.length} fixed exams`);

  // ── Students ──────────────────────────────────────────────────────────────
  const usedPins = new Set();
  const createdStudents = [];
  for (let i = 0; i < STUDENTS_DATA.length; i++) {
    const s = STUDENTS_DATA[i];
    const exam = placementExams[i % placementExams.length];
    const pin  = randPin(usedPins);
    const student = await prisma.student.create({
      data: { ...s, passwordHash: hashPassword("demo1234", s.email), exams: { create: [{ examId: exam.id, pin }] } },
    });
    createdStudents.push(student);
    console.log(`  👤 ${s.name.padEnd(24)} → PIN: ${pin}`);
  }
  console.log(`✅ ${createdStudents.length} students`);

  // ── Demo results ──────────────────────────────────────────────────────────
  const [mariam, vazgen, narine, davit, ani, hayk, lusine, artur] = createdStudents;

  // Mariam passed A1, A2, B1
  for (let i = 0; i < 3; i++) {
    const exam = fixedExams[i];
    const pct  = [82, 76, 65][i];
    const pin  = randPin(usedPins);
    const ea = await prisma.examAssignment.findUnique({ where: { examId_studentId: { examId: exam.id, studentId: mariam.id } } });
    if (!ea) await prisma.examAssignment.create({ data: { examId: exam.id, studentId: mariam.id, pin } });
    await prisma.result.create({ data: { examId: exam.id, studentId: mariam.id, score: pct, totalPoints: 100, pct, passed: true, gradingStatus: "auto", submittedAt: new Date(`2025-0${2 + i * 2}-15`) } });
  }

  // Vazgen failed A1
  {
    const pin = randPin(usedPins);
    const ea = await prisma.examAssignment.findUnique({ where: { examId_studentId: { examId: fixedExams[0].id, studentId: vazgen.id } } });
    if (!ea) await prisma.examAssignment.create({ data: { examId: fixedExams[0].id, studentId: vazgen.id, pin } });
    await prisma.result.create({ data: { examId: fixedExams[0].id, studentId: vazgen.id, score: 47, totalPoints: 100, pct: 47, passed: false, gradingStatus: "auto", submittedAt: new Date("2025-03-10") } });
  }

  // Placement results
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
    const ea = await prisma.examAssignment.findUnique({ where: { examId_studentId: { examId: exam.id, studentId: rd.student.id } } });
    if (!ea) await prisma.examAssignment.create({ data: { examId: exam.id, studentId: rd.student.id, pin: randPin(usedPins) } });
    await prisma.result.create({ data: { examId: exam.id, studentId: rd.student.id, score: earnedPts, totalPoints: totalPts, pct, passed: rd.passed, detectedLevel: rd.detectedLevel, levelStats: rd.levelStats, gradingStatus: "auto", submittedAt: new Date(rd.date) } });
    console.log(`  🎯 ${rd.student.name} → ${rd.detectedLevel ?? "below min"} | ${pct}%`);
  }

  // Narine → pending manual grading
  {
    const exam = fixedExams[1];
    const pin  = randPin(usedPins);
    const ea = await prisma.examAssignment.findUnique({ where: { examId_studentId: { examId: exam.id, studentId: narine.id } } });
    if (!ea) await prisma.examAssignment.create({ data: { examId: exam.id, studentId: narine.id, pin } });
    const manualQs = await prisma.question.findMany({ where: { type: { in: ["SPEAKING_INDEPENDENT","SPEAKING_INTEGRATED","WRITING_INDEPENDENT","WRITING_INTEGRATED"] } }, take: 2 });
    const pendingAnswers = {};
    for (const q of manualQs) { pendingAnswers[q.id] = q.type.startsWith("SPEAKING") ? "/voice/demo-narine.webm" : "I believe that..."; }
    await prisma.result.create({ data: { examId: exam.id, studentId: narine.id, score: 0, totalPoints: manualQs.reduce((s,q)=>s+q.points,0), pct: 0, passed: null, answers: pendingAnswers, gradingStatus: "pending", submittedAt: new Date("2025-03-01") } });
    console.log(`  ⏳ Narine → pending manual grading`);
  }

  // Davit & Hayk → graded
  {
    const exam = fixedExams[1];
    const manualQs = await prisma.question.findMany({ where: { type: { in: ["SPEAKING_INDEPENDENT","SPEAKING_INTEGRATED","WRITING_INDEPENDENT","WRITING_INTEGRATED"] } }, take: 3 });
    const examinerAdmin = await prisma.admin.findUnique({ where: { email: "examiner@armexam.am" } });
    const graderId = examinerAdmin?.id ?? null;
    const gradedDefs = [
      { student: davit, scores: [4, 3, 7], date: "2025-01-20", label: "Davit" },
      { student: hayk,  scores: [5, 4, 8], date: "2025-01-28", label: "Hayk"  },
    ];
    for (const gd of gradedDefs) {
      if (!manualQs.length) break;
      const answers = {}; const manualGrades = {}; let totalPts = 0; let scoredPts = 0;
      for (let i = 0; i < manualQs.length; i++) {
        const q = manualQs[i];
        const raw = gd.scores[i] ?? 3;
        const max = q.content?.rubrics?.reduce((s, r) => s + r.maxScore, 0) ?? 10;
        const scaled = Math.round((raw / Math.max(max, 1)) * q.points);
        answers[q.id] = q.type.startsWith("SPEAKING") ? "/voice/demo.webm" : "Sample graded writing answer.";
        manualGrades[q.id] = { rawScore: raw, maxRawScore: max, scaledScore: scaled, feedback: "Good effort.", gradedAt: new Date(gd.date).toISOString() };
        totalPts += q.points; scoredPts += scaled;
      }
      const pct = totalPts > 0 ? Math.round((scoredPts / totalPts) * 100) : 0;
      const ea = await prisma.examAssignment.findUnique({ where: { examId_studentId: { examId: exam.id, studentId: gd.student.id } } });
      if (!ea) await prisma.examAssignment.create({ data: { examId: exam.id, studentId: gd.student.id, pin: randPin(usedPins) } });
      await prisma.result.create({ data: { examId: exam.id, studentId: gd.student.id, score: scoredPts, totalPoints: totalPts, pct, passed: pct >= 60, answers, manualGrades, gradingStatus: "graded", gradedById: graderId, gradedAt: new Date(gd.date), submittedAt: new Date(gd.date) } });
      console.log(`  ✏️  ${gd.label} → graded ${scoredPts}/${totalPts} (${pct}%)`);
    }
  }
  console.log("✅ Demo results");

  // ── Admins ────────────────────────────────────────────────────────────────
  const adminDefs = [
    { name: "Super Admin",  email: "admin@armexam.am",    password: "admin1234", role: "super_admin",  centerId: null         },
    { name: "Center Admin", email: "center@armexam.am",   password: "demo1234",  role: "center_admin", centerId: centers[0].id },
    { name: "Moderator",    email: "moder@armexam.am",    password: "demo1234",  role: "moderator",    centerId: null         },
    { name: "Examiner",     email: "examiner@armexam.am", password: "demo1234",  role: "examiner",     centerId: null         },
  ];
  for (const a of adminDefs) {
    await prisma.admin.create({ data: { name: a.name, email: a.email, role: a.role, centerId: a.centerId, status: "active", passwordHash: hashPassword(a.password, a.email) } });
  }
  console.log(`✅ ${adminDefs.length} admins`);

  console.log("\n🎉 Seed complete!");
  console.log("   Admin:    admin@armexam.am / admin1234");
  console.log("   Students: demo1234");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
