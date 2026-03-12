import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password, email) {
  return crypto.createHash("sha256").update(password + email.toLowerCase()).digest("hex");
}

// ─── QUESTION BANKS: 5 per section per level ─────────────────────────────────
// Points: A1=1, A2=1, B1=2, B2=3, C1=4, C2=5
const PTS = { A1:1, A2:1, B1:2, B2:3, C1:4, C2:5 };

// =============================================================================
// ԱՐԵՎԵԼԱՀԱՅԵՐԵՆԻ ԹԵՍՏԱՅԻՆ ՀԱՐՑԱՇԱՐ (Eastern Armenian Test Database)
// =============================================================================

// ── READING (single_choice) ───────────────────────────────────────────────────
const READING = {
  A1: [
    { text:"Ընթերցե՛ք տեքստը. Ի՞նչ է անում աշակերտը:", 
      options:["Աշակերտը կարդում է գիրք","Մարդիկ գնում են խանութ","Աշխատողները գալիս են գրասենյակ","Մանկիկները խաղում են բակում"], 
      correct:0 },
    { text:"Ո՞րն է ճիշտ թարգմանությունը՝ «Բարև» բառի համար:", 
      options:["Hello","Goodbye","Thanks","Sorry"], correct:0 },
    { text:"Ո՞ր թիվն է 5-ից (հինգից) հետո:", 
      options:["չորս","վեց","յոթ","ութ"], correct:1 },
    { text:"«Կանաչ» գույնը համապատասխանում է՝", 
      options:["Խոտի գույնին","Արևի գույնին","Արևածաղկի գույնին","Երկնքի գույնին"], correct:0 },
    { text:"Ո՞ր բառն է նշանակում «mother»:", 
      options:["Հայր","Մայր","Քույր","Բարեկամ"], correct:1 },
  ],
  A2: [
    { text:"«Երեկ» բառը նշանակում է՝", options:["Այսօր","Նախորդ օրը","Վաղը","Հետո"], correct:1 },
    { text:"Ո՞ր բայն է նշանակում «սնվել»:", options:["Խմել","Ուտել","Խաղալ","Քնել"], correct:1 },
    { text:"Ընտրե՛ք ճիշտ ձևը՝ «Ամառ» բառի սեռական հոլովը", options:["Ամառի","Ամառով","Ամռան","Ամառից"], correct:2 },
    { text:"Ի՞նչ է նշանակում «դպրոց» բառը", options:["Ուսումնական հաստատություն","Մարզադաշտ","Առևտրի կենտրոն","Հիվանդանոց"], correct:0 },
    { text:"«Վաղը» բառը վերաբերում է՝", options:["Անցած օրվան","Այսօրվան","Հաջորդ օրվան","Երեկվան"], correct:2 },
  ],
  B1: [
    { text:"Ընտրե՛ք ճիշտ պատասխանը «Ուրախ եմ ձեզ տեսնել» նախադասության համար",
      options:["Ցտեսություն","Փոխադարձ է","Շնորհակալություն","Ներողություն"], correct:1 },
    { text:"Ի՞նչ է նշանակում «Երեխաները զբաղված են խաղով»",
      options:["Նրանք կարդում են","Նրանք խաղում են","Նրանք աշխատում են","Նրանք քնում են"], correct:1 },
    { text:"Ընտրե՛ք ճիշտ սահմանումը՝ «Գրադարան»",
      options:["Մարզադաշտ","Գրքերի պահոց","Դպրոցական բակ","Խանութ"], correct:1 },
    { text:"Ո՞րն է տարվա ամենատապ եղանակը",
      options:["Ձմեռը","Ամառը","Գարունը","Աշունը"], correct:1 },
    { text:"«Նախաճաշ» բառը նշանակում է՝",
      options:["Երեկոյան սնունդ","Կեսօրվա սնունդ","Առավոտյան սնունդ","Զովացուցիչ խմիչք"], correct:2 },
  ],
  B2: [
    { text:"Ի՞նչ է արտահայտում «Ես կողմ եմ այդ որոշմանը» արտահայտությունը:",
      options:["Կատարյալ համաձայնություն","Մասնակի համաձայնություն","Հակառակ կարծիք","Անորոշ վերաբերմունք"], correct:0 },
    { text:"«Չնայած արգելքին, նա շարունակեց աշխատել» — Ի՞նչ ենք հասկանում:",
      options:["Նա դադարեց աշխատել","Արգելքը կրկնվեց","Նա անտեսեց արգելքը","Արգելքը հաջողեց"], correct:2 },
    { text:"Ո՞ր տարբերակն է ճիշտ «Լուծել հիմնախնդիրը» արտահայտության փոխարեն:",
      options:["Հաղթահարել ձախողությունը","Հաղթահարել խնդիրը","Հրաժարվել խնդրից","Ստեղծել խնդիր"], correct:1 },
    { text:"«Մոտ ապագայում» արտահայտությունը նշանակում է՝",
      options:["Շատ ուշ","Երբևէ","Շուտով","Անցյալում"], correct:2 },
    { text:"Ի՞նչ հասկացություն է «Բնապահպանական ճգնաժամ» արտահայտությունը:",
      options:["Ֆինանսական դժվարություն","Բնության պաշտպանության անհրաժեշտ ճգնաժամ","Բնության ոչնչացում ու էկոլոգիական խնդիրներ","Մշակութային ճգնաժամ"], correct:2 },
  ],
  C1: [
    { text:"«Հասարակության մեջ ձևավորված կարծրատիպերը» — ի՞նչ է նշանակում:",
      options:["Ձևավորված ու հաստատուն կարծիքներ","Անձնական հայացք","Բազմազան կարծիքներ","Անհատական նախընտրություն"], correct:0 },
    { text:"«Անուղղակի ազդեցություն ունենալ» — ո՞ր բառն է հոմանիշ:",
      options:["Ուղղակի ճնշում","Թաքնված ներգործություն","Բացահայտ ղեկավարում","Ֆիզիկական ազդեցություն"], correct:1 },
    { text:"Ո՞ր արտահայտությունն է ճիշտ «Խիստ սկզբունք» բառակապակցության համար:",
      options:["Ճկուն կանոն","Անփոփոխ կանոն","Կամայական կանոն","Ժամանակավոր կանոն"], correct:1 },
    { text:"«Ժողովրդավարական արժեքները» — ի՞նչ ենք հասկանում:",
      options:["Անձի ազատությունն ու իրավունքները","Կենտրոնացված իշխանությունը","Ֆինանսական կայունությունը","Ռազմական ուժը"], correct:0 },
    { text:"«Նախաձեռնություն ցուցաբերել» արտահայտության իմաստը:",
      options:["Սպասել հրամանի","Ինքնուրույն քայլ կատարել","Ուրիշի հետ քննարկել","Հրաժարվել պատասխանատվությունից"], correct:1 },
  ],
  C2: [
    { text:"«Անտագոնիստական հակասություններ» — ո՞ր բնութագիրն է ճիշտ:",
      options:["Հաշտեցնելի տարաձայնություններ","Հաշտեցման ենթակա հակամարտություններ","Անհաշտ, արմատական հակամարտություններ","Ժամանակավոր անհամաձայնություն"], correct:2 },
    { text:"«Էքսիստենցիալ ռիսկ» — ի՞նչ է նշանակում:",
      options:["Անձի ֆինանսական ռիսկ","Ամբողջ գոյությանը սպառնացող վտանգ","Ճամփորդության ռիսկ","Մրցակցային ճնշում"], correct:1 },
    { text:"Ո՞ր հոմանիշն է ամենամոտ «Պարադիգմատիկ փոփոխություն» հասկացությանը:",
      options:["Աննշան բարեփոխում","Հիմնային ու կրկնվող վերափոխում","Արտաքին ձևափոխություն","Ժամանակավոր հարմարեցում"], correct:1 },
    { text:"«Հեգեմոնիա» հասկացությունը նշանակում է՝",
      options:["Ռազմական ուժ","Տնտեսական անկայունություն","Գերիշխանություն ու ազդեցություն","Ժողովրդական ապստամբություն"], correct:2 },
    { text:"«Ռեդուկցիոնիստական մոտեցում» — ի՞նչ ենք հասկանում:",
      options:["Բարդ երևույթը պարզ բաղադրիչների վերածելը","Ամբողջական ու համապարփակ դիտարկումը","Ստեղծագործական մտածողությունը","Հակասական դիրքորոշումը"], correct:0 },
  ],
};

// ── GRAMMAR (fill_blank for A1,B1,C1; single_choice for A2,B2,C2) ─────────────
const GRAMMAR = {
  A1: [
    { type:"fill_blank", text:"Լրացրե՛ք. «Ես համալսարանի ___ եմ»:", answer:"ուսանող" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա դպրոցի ___ է»:", answer:"ուսուցիչ" },
    { type:"single_choice", text:"Ընտրե՛ք ճիշտ տարբերակը.", options:["Ես գրում եմ","Ես եմ","Գրում եմ","Ես գրում"], correct:0 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա գնում է ___»:", answer:"դպրոց" },
    { type:"single_choice", text:"Ընտրե՛ք ճիշտ օժանդակ բայը. «Ես ___ հայ»:", options:["է","եմ","են","ես"], correct:1 },
  ],
  A2: [
    { type:"single_choice", text:"Ընտրե՛ք ճիշտ ձևը. «Ես նամակ ___»:", options:["գրել","գրում եմ","կարդալ","գրելու"], correct:1 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա ամեն օր ___ է ուտում»:", answer:"նախաճաշ" },
    { type:"single_choice", text:"Ընտրե՛ք անցյալ ժամանակը. «Ես ___»:", options:["գնալ","գնացի","կգնամ","գնում"], correct:1 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա հիվանդանոցի ___ է»:", answer:"բժիշկ" },
    { type:"single_choice", text:"Լրացրե՛ք. «Նա ___ է դասի գալիս»:", options:["դանդաղ","միշտ","կանաչ","հաց"], correct:1 },
  ],
  B1: [
    { type:"fill_blank", text:"Լրացրե՛ք. «Եթե անձրև ___, մենք տանը կմնանք»:", answer:"գա" },
    { type:"single_choice", text:"Ընտրե՛ք ճիշտ բայաձևը. «Երբ նա ___, մենք կսկսենք»:", options:["ուտել","ուտում է","գա","եկավ"], correct:2 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Երբ կարդաս, ___ դուրս կգաս»:", answer:"դու" },
    { type:"single_choice", text:"Ո՞ր նախադասությունն է սխալ:", options:["Ես գնում եմ","Նա գնում է","Նա գնում են","Մենք գնում ենք"], correct:2 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա ասաց, որ ___ կգա»:", answer:"ինքը" },
  ],
  B2: [
    { type:"single_choice", text:"Ընտրե՛ք ճիշտ ձևը. «Եթե նա ___»:", options:["ծնվեր","ծնվել է","ծնված լիներ","ծնվում էր"], correct:2 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Սա շատ ___ նորություն էր»:", answer:"սպասված" },
    { type:"single_choice", text:"Ո՞րն է «կարդում է» բայի կրավորական ձևը:", options:["Ուսանում է","Անվանվում է","Կարդացվում է","Լսվում է"], correct:2 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա ___ շուտ եկավ, քան ես»:", answer:"ավելի" },
    { type:"single_choice", text:"Ընտրե՛ք հարցական նախադասությունը.", options:["Նա գնում է","Դու գալիս ես","Ե՞րբ կգաս","Նա կարդում էր"], correct:2 },
  ],
  C1: [
    { type:"fill_blank", text:"Լրացրե՛ք դարձվածքը. «Ոսկե ___ ունի նա»:", answer:"ձեռքեր" },
    { type:"single_choice", text:"Ո՞րն է ճիշտ ոճական ձևը.", options:["Եկա","Կարդացի","Կարծում եմ՝ դուք սխալվում եք","Լավն է"], correct:2 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Թեև նա ___, շարունակեց աշխատել»:", answer:"հոգնած էր" },
    { type:"single_choice", text:"Ընտրե՛ք ճիշտ կառույցը.", options:["Ժամանակն է","Ժամանակը ունեմ","Ժամանակով է","Ժամանակի նման"], correct:0 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա հանդես եկավ հրապարակային ___»:", answer:"ելույթով" },
  ],
  C2: [
    { type:"single_choice", text:"Ո՞րն է ճիշտ ասույթը.", options:["Ով ջուրն ընկնի, հույսը ձեռքից կկտրի","Ով ջուրն ընկնի հաց կուտի","Անձրևը ջուր է","Անձը հույս է"], correct:0 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Եթե ես այդ մասին ___, ավելի զգույշ կլինեի»:", answer:"կիմանայի" },
    { type:"single_choice", text:"Ո՞րն է ենթադրական անցյալ ժամանակաձևը:", options:["Ներկա","Անցյալ կատարյալ","Կգնայի","Անցյալ անկատար"], correct:2 },
    { type:"fill_blank", text:"Լրացրե՛ք. «Չկա մի ___ , որ բնությունը չսիրի»:", answer:"մարդ" },
    { type:"single_choice", text:"Ո՞րն է «ինքնաբուխ» բառի իմաստը:", options:["Նախապես ծրագրված","Անկանխատեսելի","Փոփոխական","Գիտակցված"], correct:1 },
  ],
};

// ── VOCABULARY (multi_choice A1-A2; multi_select B1-C2) ──────────────────────
const VOCABULARY = {
  A1: [
    { type:"multi_choice", text:"Ո՞ր բառերն են կապված շաբաթվա օրերի հետ:", options:["Երկուշաբթի","Կարմիր","Հինգշաբթի","Մեծ","Ուրբաթ"], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ր բառերն են գույներ:", options:["Կապույտ","Վազել","Կանաչ","Այսօր","Դեղին"], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ր բառերն են մարմնի մասեր:", options:["Ձեռք","Տուն","Ոտք","Դուռ","Գլուխ"], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ր բառերն են կապված ընտանիքի հետ:", options:["Եղբայր","Հեռախոս","Որդի","Ձյուն","Կին"], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ր բառերն են կենդանիներ:", options:["Կատու","Ծառ","Շուն","Ծաղիկ","Ձի"], correct:[0,2,4] },
  ],
  A2: [
    { type:"multi_choice", text:"Ո՞ր բառերն են մրգեր:", options:["Մանդարին","Սունկ","Հավ","Լիմոն","Տանձ"], correct:[0,3,4] },
    { type:"multi_choice", text:"Ո՞ր բառերն են խմիչքներ:", options:["Հյութ","Աղցան","Ջուր","Ուտեստ","Կաթ"], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ր բառերն են եղանակային երևույթներ:", options:["Ամպրոպ","Ձյուն","Ընկեր","Նամակ","Անձրև"], correct:[0,1,4] },
    { type:"multi_choice", text:"Ո՞ր բառերն են ուտեստներ:", options:["Ձվածեղ","Աղցան","Նարինջ","Պանիր","Փլավ"], correct:[0,1,3,4] },
    { type:"multi_choice", text:"Ո՞ր բառն է կապված կրթության հետ:", options:["Այգի","Աշակերտ","Կոշիկ","Երկինք"], correct:[1] },
  ],
  B1: [
    { type:"multi_select", text:"Ընտրե՛ք «երջանիկ» բառի հոմանիշները.", options:["Անհոգ","Բարկացած","Անսահման ուրախ","Ձանձրացած","Գոհ","Քաղցած"], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ր բառերն են «ուրախություն» բառի հետ կապված:", options:["Ուրախանալ","Տխրել","Երջանկություն","Հիասթափվել","Երջանկանալ","Ծիծաղել"], correct:[0,2,4,5] },
    { type:"multi_select", text:"Ընտրե՛ք «հին» բառի հականիշները (opposite).", options:["Արդիական","Նախնական","Ժամանակակից","Սովորական","Քայքայված","Նորաձև"], correct:[0,2,5] },
    { type:"multi_select", text:"Ո՞ր բառերն են կապված արվեստի հետ:", options:["Ուսուցիչ","Անվանի","Ֆիլմ","Ռեժիսոր","Նկարիչ","Րոպե"], correct:[2,3,4] },
    { type:"multi_select", text:"Ընտրե՛ք «կոշտ» բառի անտոնիմները.", options:["Երկար","Ջրիկ","Ամուր","Անուշ ջուր","Նուրբ","Ցածր"], correct:[1,4] },
  ],
  B2: [
    { type:"multi_select", text:"Ո՞ր բառերն են կապված «ճշմարիտ» բառի հետ.", options:["Իրական","Բարդ","Կեղծ","Ճշգրիտ","Դժվար","Անվիճելի"], correct:[0,3,5] },
    { type:"multi_select", text:"Ո՞ր բառերն են «նոր» բառի հոմանիշները.", options:["Արդի","Ուրիշ","Նորագույն","Նոր կառուցված","Նախկին","Նախապատմական"], correct:[0,2,3] },
    { type:"multi_select", text:"Ո՞ր բառերն են «ղեկավարել» բառի իմաստով:", options:["Հրամայել","Առաջնորդել","Անտեսել","Կառավարել","Ղեկավարման փուլ","Ղեկին նստած"], correct:[0,1,3] },
    { type:"multi_select", text:"Ո՞ր բառերն են «ազատություն» բառի հետ կապված:", options:["Ինքնիշխանություն","Քաղաքական","Նկարագրություն","Ֆինանսական","Անկախություն","Նկարիչ"], correct:[0,4] },
    { type:"multi_select", text:"Ո՞ր բառերն են «բարի» բառի հոմանիշները:", options:["Անկեղծ","Նենգ","Ազնվասիրտ","Նուրբ հոգի","Նողկալի","Նմանակ"], correct:[0,2,3] },
  ],
  C1: [
    { type:"multi_select", text:"Ո՞ր բառերն են բնորոշ գիտական ոճին:", options:["Աբստրակցիա","Ուտել","Հիպոթեզ","Արագ կատարվող","Հիմնավորում","Ճիշտ"], correct:[0,2,4] },
    { type:"multi_select", text:"Ընտրե՛ք «եռանդուն» բառի հոմանիշները.", options:["Նպատակասլաց","Նվազ","Նախաձեռնող","Նկուն","Նախանձախնդիր","Նուրբ"], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ր բառերն են «ազդեցություն» բառի հետ կապված:", options:["Ազդակ","Ներգործություն","Նվաճում","Նպատակ","Ներշնչանք","Ներգաղթ"], correct:[0,1,4] },
    { type:"multi_select", text:"Ո՞ր բառերն են գրական ոճին պատկանում:", options:["Նշանակալի","Նմանվել","Ներբող","Նուրբիկ","Նվիրական","Նորեկ"], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ր բառերն են արտացոլում բարձր ոճ:", options:["Արարում","Անցնել","Ազնվական","Ակնառու","Աղքատ","Անբասիր"], correct:[0,3,5] },
  ],
  C2: [
    { type:"multi_select", text:"Ո՞ր բառերն են արխաիկ (հնացած):", options:["Շուտով","Որովհետև","Յուրաքանչյուր","Նույնն","Այսուհետև","Եվս"], correct:[2,4] },
    { type:"multi_select", text:"Ո՞ր արտահայտություններն ունեն փոխաբերական իմաստ:", options:["Սարեր շրջել","Ջուր խմել","Ձեռք մեկնել","Հաց ուտել"], correct:[0,2] },
    { type:"multi_select", text:"Ո՞ր բառերն են ակադեմիական 2-րդ մակարդակի:", options:["Նկարագրություն","Ներդաշնակություն","Նախապատմություն","Ներգործունություն","Նախաձեռնություն","Նվազագույն"], correct:[1,3,4] },
    { type:"multi_select", text:"Ո՞ր արտահայտություններն են աֆորիզմներ:", options:["Ամեն ինչ անցողիկ է","Այսօր լավ օր է","Անտուն մարդը չունի տանիք","Աշխատանքը գեղեցկացնում է մարդուն","Այնտեղ լավ է, որտեղ մենք չկանք","Այսօր գնացի"], correct:[0,3,4] },
    { type:"multi_select", text:"Ո՞ր բառերն ունեն փիլիսոփայական իմաստ:", options:["Նեցուկ","Ներհայեցողություն","Նախապատվություն","Նյութականություն","Նախախնամություն","Նորարարություն"], correct:[1,3,4] },
  ],
};

// ── WRITING (fill_blank A1-B1; writing B2-C2) ─────────────────────────────────
const WRITING = {
  A1: [
    { type:"fill_blank", text:"Լրացրե՛ք. «Ես շատ ___ եմ այսօր»:", answer:"ուրախ" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա իմ ___ է»:", answer:"ուսուցիչը" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Ես սիրում եմ իմ ___»:", answer:"հայրենիքը" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Մեր ___ շատ բարի է»:", answer:"բժիշկը" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Ես ունեմ մեծ ___»:", answer:"ընտանիք" },
  ],
  A2: [
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա ամեն առավոտ ___ է ուտում»:", answer:"նախաճաշ" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Ես գնում եմ ___ միրգ գնելու»:", answer:"շուկա" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա գեղեցիկ ___ է հագել»:", answer:"հագուստ" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Ես ուզում եմ ___ խմել»:", answer:"ջուր" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա սիրում է ___ խաղալ»:", answer:"ֆուտբոլ" },
  ],
  B1: [
    { type:"fill_blank", text:"Լրացրե՛ք. «Եթե անձրև ___, տանը կմնանք»:", answer:"գա" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա կատարեց իր ___»:", answer:"կատարած աշխատանքը" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա ասաց, որ ___ կանի դա»:", answer:"ինքը" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա ___ եկավ»:", answer:"արդեն" },
    { type:"fill_blank", text:"Լրացրե՛ք. «Նա ___ չունի»:", answer:"ժամանակ" },
  ],
  B2: [
    { type:"writing", text:"Գրե՛ք 80-100 բառ «Իմ կյանքի փոփոխությունները քաղաքում» թեմայով:", minWords:80, maxWords:120 },
    { type:"writing", text:"Գրե՛ք 80-100 բառ «Նոր նպատակներ ու ձգտումներ» թեմայով:", minWords:80, maxWords:120 },
    { type:"writing", text:"Գրե՛ք 80-100 բառ «Իմ կյանքի փոփոխությունները այս տարի» թեմայով:", minWords:80, maxWords:120 },
    { type:"writing", text:"Գրե՛ք 80-100 բառ «Նոր կրթական բարեփոխումներ» թեմայով:", minWords:80, maxWords:120 },
    { type:"writing", text:"Գրե՛ք 80-100 բառ «Իմ կյանքի ընթացքը» թեմայով:", minWords:80, maxWords:120 },
  ],
  C1: [
    { type:"writing", text:"Գրե՛ք 120-150 բառ «Ժամանակակից հասարակության մարտահրավերները» թեմայով:", minWords:120, maxWords:180 },
    { type:"writing", text:"Գրե՛ք 120-150 բառ «Լեզվի դերը աշխարհում» թեմայով:", minWords:120, maxWords:180 },
    { type:"writing", text:"Գրե՛ք 120-150 բառ «Արվեստի իմաստը կյանքում» թեմայով:", minWords:120, maxWords:180 },
    { type:"writing", text:"Գրե՛ք 120-150 բառ «Անհատի ու հասարակության կապը» թեմայով:", minWords:120, maxWords:180 },
    { type:"writing", text:"Գրե՛ք 120-150 բառ «Երաժշտության ուժն ու ազդեցությունը» թեմայով:", minWords:120, maxWords:180 },
  ],
  C2: [
    { type:"writing", text:"Գրե՛ք 150-200 բառ «Գլոբալիզացիան և ազգային ինքնությունը» թեմայով:", minWords:150, maxWords:220 },
    { type:"writing", text:"Գրե՛ք 150-200 բառ «Հայոց լեզվի անցյալն ու ներկան» թեմայով:", minWords:150, maxWords:220 },
    { type:"writing", text:"Գրե՛ք 150-200 բառ «Ազգային նոր գաղափարախոսություն» թեմայով:", minWords:150, maxWords:220 },
    { type:"writing", text:"Գրե՛ք 150-200 բառ «Քաղաքակրթությունների ու մշակույթների կապը» թեմայով:", minWords:150, maxWords:220 },
    { type:"writing", text:"Գրե՛ք 150-200 բառ «Երիտասարդության ուժն ու ապագայի ղեկը» թեմայով:", minWords:150, maxWords:220 },
  ],
};

// ── LISTENING (single_choice, text-based) ────────────────────────────────────
const LISTENING = {
  A1: [
    { text:"Ասացեք ողջույնի ձևը. ի՞նչ են ասում առավոտյան:", options:["Բարի լույս","Ցտեսություն","Կարմիր","Շնորհակալություն"], correct:0 },
    { text:"«Բարի գալուստ» ե՞րբ են ասում:", options:["Երեկոյան","Կեսօրին","Այցելուի գալու ժամանակ","Գնալուց"], correct:2 },
    { text:"Ի՞նչ է նշանակում «կանաչ» գույնը բնության մեջ:", options:["Արև","Նոր խոտ","Քար","Նարինջ"], correct:1 },
    { text:"«Առավոտ» բառի թարգմանությունը:", options:["Good morning","Goodbye","Thank you","Please"], correct:0 },
    { text:"Ի՞նչ է նշանակում «ջուր» բառը:", options:["Water","Fire","Earth","Air"], correct:0 },
  ],
  A2: [
    { text:"«Նա ամեն առավոտ նախաճաշում է» — ե՞րբ է նա սնվում:", options:["Ձմռանը","Առավոտյան","Նախորդ օրը","Երեկոյան"], correct:1 },
    { text:"Ի՞նչ է նշանակում «8 ժամ քնել»:", options:["Նա քնում է","Նա քնում է 8 ժամ","Նա աշխատում է","Նա խաղում է"], correct:1 },
    { text:"«Նա կարդում է ֆուտբոլի մասին» — ի՞նչ է նա անում:", options:["Նա բժիշկ է","Նա կարդում է","Նա երգում է","Նա մարզվում է"], correct:1 },
    { text:"Ի՞նչ է նշանակում «ուտել»:", options:["To drink","To eat","To sleep","To run"], correct:1 },
    { text:"«Նա այսօր երկար է քայլել» — ե՞րբ է նա քայլել:", options:["Երեկ առավոտյան","Այսօր","Երկու օր առաջ","Նախորդ շաբաթ"], correct:1 },
  ],
  B1: [
    { text:"Ի՞նչ է նշանակում «նա աշխատում է գործարանում»:", options:["Նա կառավարում է","Նա աշխատում է","Նա հանգստանում է","Նա խաղում է"], correct:1 },
    { text:"Ի՞նչ է նշանակում «նա սովորում է համալսարանում»:", options:["Նա աշակերտ է","Նա երեխա է","Նա ուսանող է","Նա ուսուցիչ է"], correct:2 },
    { text:"«30 տարեկան տղամարդ» — քանի՞ տարեկան է նա:", options:["Երիտասարդ","Նորածին","30","40"], correct:2 },
    { text:"Ի՞նչ է նշանակում «ուրախ լուր»:", options:["Լավ նորություն","Վատ նորություն","Տխուր լուր","Նոր տեղեկություն"], correct:0 },
    { text:"Ի՞նչ է նշանակում «այցելություն»:", options:["Անցնել","Այցելել","Անել","Գնալ հյուր"], correct:3 },
  ],
  B2: [
    { text:"Ի՞նչ է նշանակում «ուղևորվել»:", options:["Նստել","Ճանապարհ ընկնել","Նայել","Նկարել"], correct:1 },
    { text:"Ի՞նչ է նշանակում «արագ ուտել»:", options:["Արագ","Արագությամբ","Կամաց","Միայն"], correct:0 },
    { text:"Ի՞նչ է նշանակում «ուժեղ լույս»:", options:["Նուրբ","Պայծառ","Մութ","Նոր"], correct:1 },
    { text:"Ի՞նչ է նշանակում «նոր աշխատանք»:", options:["Անցյալ","Այսօրվա","Նոր ձեռնարկած","Նախորդ"], correct:2 },
    { text:"Ի՞նչ է նշանակում «նախապես ասել»:", options:["Նույն պահին","Նախօրոք","Նախորդ","Նախնական"], correct:1 },
  ],
  C1: [
    { text:"Ի՞նչ է նշանակում «անձնական լեզու»:", options:["Նոր լեզու","Յուրահատուկ ոճ","Նախընտրելի","Նախնական"], correct:1 },
    { text:"«Ազատ լեզու» նշանակում է՝", options:["Նոր բառեր","Նուրբ ոճ","Անկաշկանդ խոսք","Նախադասություն"], correct:2 },
    { text:"Ի՞նչ է նշանակում «ազգային դիմագիծ»:", options:["Ազգի ինքնությունը","Նկարագրություն","Նախապատվություն","Նախախնամություն"], correct:0 },
    { text:"Ի՞նչ է նշանակում «նախնական աշխատանք»:", options:["Նոր","Նախկին","Նախապատրաստական","Վերջնական"], correct:2 },
    { text:"Ի՞նչ է նշանակում «3 աստիճան»:", options:["Երեք փուլ","Նոր փուլ","Նախորդ փուլ","Նախնական փուլ"], correct:0 },
  ],
  C2: [
    { text:"Ի՞նչ է նշանակում «քննական հայացք»:", options:["Նուրբ","Նոր","Վերլուծական","Նախնական"], correct:2 },
    { text:"Ի՞նչ է նշանակում «արմատական փոփոխություն»:", options:["Նոր","Հիմնավոր","Նուրբ","Նախնական"], correct:1 },
    { text:"Ի՞նչ է նշանակում «անհեռատես»:", options:["Նոր","Նուրբ","Նախնական","Առանց ապագան հաշվի առնելու"], correct:3 },
    { text:"Ի՞նչ է նշանակում «նախապաշարմունք»:", options:["Կանխակալ կարծիք","Նոր կարծիք","Նուրբ կարծիք","Նախնական կարծիք"], correct:0 },
    { text:"Ի՞նչ է նշանակում «ցուցամոլություն»:", options:["Նորություն","Նուրբ","Ձևամոլություն","Նախնական"], correct:2 },
  ],
};

// ── SPEAKING (voice) ──────────────────────────────────────────────────────────
const SPEAKING = {
  A1:[
    { text:"Պատմե՛ք ձեր մասին (10-30 վ.):",           maxSeconds:30,  minSeconds:10, maxAttempts:3 },
    { text:"Պատմե՛ք ձեր ընտանիքի մասին (10-30 վ.):",        maxSeconds:30,  minSeconds:10, maxAttempts:3 },
    { text:"Պատմե՛ք ձեր սիրելի գույնի մասին (10-30 վ.):",         maxSeconds:30,  minSeconds:10, maxAttempts:3 },
    { text:"Պատմե՛ք ձեր քաղաքի մասին (10-30 վ.):",         maxSeconds:30,  minSeconds:10, maxAttempts:3 },
    { text:"Պատմե՛ք ձեր բարեկամների մասին (10-30 վ.):",         maxSeconds:30,  minSeconds:10, maxAttempts:3 },
  ],
  A2:[
    { text:"Պատմե՛ք ձեր ամենօրյա աշխատանքի մասին (15-45 վ.):",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
    { text:"Պատմե՛ք ձեր հագուստի մասին (15-45 վ.):",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
    { text:"Պատմե՛ք ձեր երեկվա օրվա մասին (15-45 վ.):",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
    { text:"Պատմե՛ք ձեր օրվա ռեժիմի մասին (15-45 վ.):",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
    { text:"Պատմե՛ք ձեր տան մասին (15-45 վ.):",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
  ],
  B1:[
    { text:"Ներկայացրե՛ք ձեր սիրելի տոնը (30-60 վ.):",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
    { text:"Ներկայացրե՛ք ձեր սիրելի ժամանցը (30-60 վ.):",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
    { text:"Ներկայացրե՛ք ձեր կրթության մասին (30-60 վ.):",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
    { text:"Ներկայացրե՛ք ձեր ապագա անելիքները (30-60 վ.):",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
    { text:"Ներկայացրե՛ք ձեր երազանքները (30-60 վ.):",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
  ],
  B2:[
    { text:"Արդյո՞ք երջանիկ եք ձեր աշխատանքով (45-90 վ.):",         maxSeconds:90,  minSeconds:45, maxAttempts:2 },
    { text:"Ի՞նչ է ձեզ համար կրթությունը (45-90 վ.):",            maxSeconds:90,  minSeconds:45, maxAttempts:2 },
    { text:"Ի՞նչ է ձեզ համար բարեկամությունը (45-90 վ.):",            maxSeconds:90,  minSeconds:45, maxAttempts:2 },
    { text:"Ի՞նչ է ձեզ համար ղեկավարությունը (45-90 վ.):",            maxSeconds:90,  minSeconds:45, maxAttempts:2 },
    { text:"Ի՞նչ է ձեզ համար նպատակը (45-90 վ.):",            maxSeconds:90,  minSeconds:45, maxAttempts:2 },
  ],
  C1:[
    { text:"Ժամանակակից հասարակության մարտահրավերները (60-120 վ.):",        maxSeconds:120, minSeconds:60, maxAttempts:2 },
    { text:"Լեզվի դերը աշխարհում և մեր կյանքում (60-120 վ.):",        maxSeconds:120, minSeconds:60, maxAttempts:2 },
    { text:"Արվեստի իմաստը և նշանակությունը (60-120 վ.):",        maxSeconds:120, minSeconds:60, maxAttempts:2 },
    { text:"Անհատի ու հասարակության փոխհարաբերությունը (60-120 վ.):",       maxSeconds:120, minSeconds:60, maxAttempts:2 },
    { text:"Երաժշտության ուժն ու ազդեցությունը (60-120 վ.):",       maxSeconds:120, minSeconds:60, maxAttempts:2 },
  ],
  C2:[
    { text:"Գլոբալիզացիայի դրական ու բացասական կողմերը (90-180 վ.):",        maxSeconds:180, minSeconds:90, maxAttempts:1 },
    { text:"Հայոց ինքնության պահպանման հիմնախնդիրները (90-180 վ.):",        maxSeconds:180, minSeconds:90, maxAttempts:1 },
    { text:"Ազգային նոր գաղափարախոսության անհրաժեշտությունը (90-180 վ.):",        maxSeconds:180, minSeconds:90, maxAttempts:1 },
    { text:"Քաղաքակրթությունների երկխոսության ապագան (90-180 վ.):",       maxSeconds:180, minSeconds:90, maxAttempts:1 },
    { text:"Երիտասարդության դերը պետականության ամրապնդման գործում (90-180 վ.):",       maxSeconds:180, minSeconds:90, maxAttempts:1 },
  ],
};

// ── WATCHING (single_choice) ─────────────────────────────────────────────────
const WATCHING = {
  A1:[
    { text:"Նայե՛ք նկարին. ի՞նչ կա սեղանին:", options:["Ափսե","Նամակ","Բաժակ","Ընկեր"], correct:0 },
    { text:"Նայե՛ք նկարին. ո՞վ է սենյակում:", options:["Նկարիչ","Ուսանող","Բժիշկ","Ընտանիք"], correct:1 },
    { text:"Նայե՛ք նկարին. ի՞նչ գույնի է սեղանը:", options:["Նարնջագույն","Կապույտ","Սպիտակ","Սև"], correct:2 },
    { text:"Նայե՛ք նկարին. ո՞ւր է գնում տղան:", options:["Դպրոց","Նկուղ","Խանութ","Այգի"], correct:3 },
    { text:"Նայե՛ք նկարին. ի՞նչ կա բակում:", options:["Ծառեր","Նստարան","Բազմոց","Ավտոմեքենա"], correct:0 },
  ],
  A2:[
    { text:"Նայե՛ք նկարին. ի՞նչ է հագել աղջիկը:", options:["Վերնաշապիկ","Շրջազգեստ","Նոր կոշիկներ","Հագուստ"], correct:1 },
    { text:"Նայե՛ք նկարին. ժամը քանի՞սն է:", options:["Նախաճաշի ժամն է","Ժամը 5-ն է","Ժամը 8-ն է","Ժամը 10-ն է"], correct:2 },
    { text:"Նայե՛ք նկարին. ի՞նչ օր է այսօր:", options:["Նույն օրն է","Անձրևոտ օր","Շոգ օր","Արևոտ օր"], correct:3 },
    { text:"Նայե՛ք նկարին. ո՞վ է գալիս:", options:["Ուսուցիչը","Նախարարը","Կատուն","Ընկերը"], correct:0 },
    { text:"Նայե՛ք նկարին. ի՞նչ է անում շունը:", options:["Քնած է","Վազում է","Հաչում է","Խաղում է"], correct:1 },
  ],
  B1:[
    { text:"Նայե՛ք նկարին. ի՞նչ բնության տեսարան է:", options:["Բարձր սարեր","Անտառ","Գետ","Դաշտավայր"], correct:0 },
    { text:"Նայե՛ք նկարին. ո՞րտեղ է գտնվում մարդը:", options:["Այգում","Բակում","Գրասենյակում","Դպրոցում"], correct:1 },
    { text:"Նայե՛ք նկարին. ի՞նչ եղանակ է:", options:["Աշուն","Բուք","Գարուն","Դադար"], correct:2 },
    { text:"Նայե՛ք նկարին. ո՞ր կենդանին է պատկերված:", options:["Աղվես","Բազե","Գայլ","Դելֆին"], correct:3 },
    { text:"Նայե՛ք նկարին. ի՞նչ է անում մարդը:", options:["Աշխատում է","Բժշկում է","Գրում է","Դասավանդում է"], correct:0 },
  ],
  B2:[
    { text:"Նայե՛ք նկարին. ի՞նչ բիզնես կենտրոն է:", options:["Բանկ","Ապահովագրական","Կենտրոնական","Մասնավոր"], correct:0 },
    { text:"Նայե՛ք նկարին. ո՞ր տրանսպորտն է պատկերված:", options:["Ավտոբուս","Բեռնատար","Կառք","Մետրո"], correct:1 },
    { text:"Նայե՛ք նկարին. ի՞նչ կառույց է սա:", options:["Ամրոց","Բնակելի շենք","Կամուրջ","Մատուռ"], correct:2 },
    { text:"Նայե՛ք նկարին. ո՞վ է այս մարդը:", options:["Արվեստագետ","Բժիշկ","Կոմպոզիտոր","Մարզիկ"], correct:3 },
    { text:"Նայե՛ք նկարին. ի՞նչ է պատկերված:", options:["Աշտարակ","Բուրգ","Կոթող","Մեդալ"], correct:0 },
  ],
  C1:[
    { text:"Նայե՛ք նկարին. ի՞նչ արվեստի գործ է:", options:["Լանդշաֆտային պաննո","Տեսարան","Կոմպոզիցիա","Մանրանկար"], correct:0 },
    { text:"Նայե՛ք նկարին. ո՞ր պատմական դարաշրջանն է:", options:["Անտիկ","Բարոկկո","Կլասիցիզմ","Մոդեռն"], correct:1 },
    { text:"Նայե՛ք նկարին. ի՞նչ երևույթ է պատկերված:", options:["Ավանդույթ","Բարեփոխում","Կոնֆլիկտ","Միավորում"], correct:2 },
    { text:"Նայե՛ք նկարին. ո՞ր ճարտարապետական ոճն է:", options:["Արևելյան","Բյուզանդական","Գոթական","Մինիմալիստական"], correct:3 },
    { text:"Նայե՛ք նկարին. ի՞նչ նշանակություն ունի սա:", options:["Ազգային","Բարոյական","Կրոնական","Մշակութային"], correct:0 },
  ],
  C2:[
    { text:"Նայե՛ք նկարին. ի՞նչ աբստրակցիա է:", options:["Անորոշ","Բարդ","Կոնցեպտուալ","Միստիկ"], correct:2 },
    { text:"Նայե՛ք նկարին. ո՞ր հոգեբանական վիճակն է:", options:["Անտարբերություն","Բերկրանք","Կասկած","Մենություն"], correct:1 },
    { text:"Նայե՛ք նկարին. ի՞նչ երևույթ է:", options:["Անկախություն","Բարգավաճում","Կայունություն","Մտահայեցողություն"], correct:3 },
    { text:"Նայե՛ք նկարին. ո՞րն է գլխավոր խորհրդանիշը:", options:["Ազատություն","Բարեկամություն","Կյանքի անիվ","Մահ"], correct:0 },
    { text:"Նայե՛ք նկարին. ի՞նչ նշանակություն ունի:", options:["Ազգային","Բարոյական","Կրոնական","Մշակութային"], correct:2 },
  ],
};

// ── FREE WRITING (writing) ───────────────────────────────────────────────────
const FREE_WRITING = {
  A1:[ { text:"Գրե՛ք 15-25 բառ ձեր մասին:",                  minWords:15, maxWords:30 },
       { text:"Գրե՛ք 15-25 բառ ձեր երազանքի մասին:",           minWords:15, maxWords:30 },
       { text:"Գրե՛ք 15-25 բառ ձեր ընտանիքի մասին:",           minWords:15, maxWords:30 },
       { text:"Գրե՛ք 15-25 բառ ձեր տան մասին:",               minWords:15, maxWords:30 },
       { text:"Գրե՛ք 15-25 բառ ձեր սիրելի գույնի մասին:",      minWords:15, maxWords:30 } ],
  A2:[ { text:"Գրե՛ք 40-60 բառ ձեր երեկվա օրվա մասին:",        minWords:40, maxWords:70 },
       { text:"Գրե՛ք 40-60 բառ ձեր ամենօրյա օրվա մասին:",      minWords:40, maxWords:70 },
       { text:"Գրե՛ք 40-60 բառ ձեր հագուստի մասին:",          minWords:40, maxWords:70 },
       { text:"Գրե՛ք 40-60 բառ ձեր երազած տան մասին:",        minWords:40, maxWords:70 },
       { text:"Գրե՛ք 40-60 բառ ձեր սիրելի երաժշտության մասին:", minWords:40, maxWords:70 } ],
  B1:[ { text:"Գրե՛ք 70-90 բառ ձեր կրթության մասին:",         minWords:70, maxWords:100 },
       { text:"Գրե՛ք 70-90 բառ ձեր կատարած աշխատանքի մասին:",  minWords:70, maxWords:100 },
       { text:"Գրե՛ք 70-90 բառ ձեր երազանքների մասին:",        minWords:70, maxWords:100 },
       { text:"Գրե՛ք 70-90 բառ ձեր կյանքի նպատակների մասին:",   minWords:70, maxWords:100 },
       { text:"Գրե՛ք 70-90 բառ ձեր կյանքի բարդությունների մասին:", minWords:70, maxWords:100 } ],
  B2:[ { text:"Գրե՛ք 80-100 բառ քաղաքային կյանքի փոփոխությունների մասին:", minWords:80, maxWords:120 },
       { text:"Գրե՛ք 80-100 բառ նոր կրթական ալիքի ու ազդեցության մասին:", minWords:80, maxWords:120 },
       { text:"Գրե՛ք 80-100 բառ ապագայի ձեր նպատակների մասին:",           minWords:80, maxWords:120 },
       { text:"Գրե՛ք 80-100 բառ ինտերնետի ազդեցության մասին:",           minWords:80, maxWords:120 },
       { text:"Գրե՛ք 80-100 բառ առողջ ապրելակերպի իմաստի մասին:",        minWords:80, maxWords:120 } ],
  C1:[ { text:"Գրե՛ք 120-150 բառ ժամանակակից հասարակության մարտահրավերների մասին:", minWords:120, maxWords:180 },
       { text:"Գրե՛ք 120-150 բառ լեզվի դերի ու ազդեցության մասին:",       minWords:120, maxWords:180 },
       { text:"Գրե՛ք 120-150 բառ արվեստի իմաստի ու ազդեցության մասին:",   minWords:120, maxWords:180 },
       { text:"Գրե՛ք 120-150 բառ անհատի ու հասարակության իմաստի մասին:", minWords:120, maxWords:180 },
       { text:"Գրե՛ք 120-150 բառ երաժշտության ուժի ու ազդեցության մասին:", minWords:120, maxWords:180 } ],
  C2:[ { text:"Գրե՛ք 150-200 բառ գլոբալիզացիայի ու ազգային ինքնության մասին:", minWords:150, maxWords:220 },
       { text:"Գրե՛ք 150-200 բառ հայոց լեզվի անցյալի ու ներկայի մասին:",      minWords:150, maxWords:220 },
       { text:"Գրե՛ք 150-200 բառ ազգային նոր գաղափարախոսության իմաստի մասին:", minWords:150, maxWords:220 },
       { text:"Գրե՛ք 150-200 բառ քաղաքակրթության ու մշակույթի իմաստի մասին:",  minWords:150, maxWords:220 },
       { text:"Գրե՛ք 150-200 բառ երիտասարդության ու պետության ղեկի մասին:",   minWords:150, maxWords:220 } ],
};

// ─── Assemble QUESTIONS array ─────────────────────────────────────────────────
const QUESTIONS = [];
const LEVELS = ["A1","A2","B1","B2","C1","C2"];

for (const lvl of LEVELS) {
  const pts = PTS[lvl];
  if (READING[lvl])    for (const q of READING[lvl])    QUESTIONS.push({ type:"single_choice", level:lvl, section:"Reading",            points:pts, ...q });
  if (GRAMMAR[lvl])    for (const q of GRAMMAR[lvl])    QUESTIONS.push({ level:lvl, section:"Grammar",           points:pts, ...q });
  if (VOCABULARY[lvl]) for (const q of VOCABULARY[lvl]) QUESTIONS.push({ level:lvl, section:"Vocabulary",         points:pts, ...q });
  if (WRITING[lvl])    for (const q of WRITING[lvl])    QUESTIONS.push({ level:lvl, section:"Writing",            points:pts, ...q });
  if (LISTENING[lvl])  for (const q of LISTENING[lvl])  QUESTIONS.push({ type:"single_choice", level:lvl, section:"Listening",          points:pts, ...q });
  if (SPEAKING[lvl])   for (const q of SPEAKING[lvl])   QUESTIONS.push({ type:"voice",         level:lvl, section:"Speaking",           points:pts, ...q });
  if (WATCHING[lvl])   for (const q of WATCHING[lvl])   QUESTIONS.push({ type:"single_choice", level:lvl, section:"Listening / Watching", points:pts, ...q });
  if (FREE_WRITING[lvl])for (const q of FREE_WRITING[lvl])QUESTIONS.push({ type:"writing",       level:lvl, section:"Free Writing",       points:pts, ...q });
}

// ─── MEDIA QUESTIONS (image / audio / video / voice) ─────────────────────────
// Public-domain media URLs for demo/testing
const MEDIA_QUESTIONS = [
  // ── Image-based reading (single_choice) ──────────────────────────────────
  {
    type: "single_choice", level: "A1", section: "Reading", points: PTS.A1,
    text: "Նայե՛ք նկարին: Ի՞նչ կա սեղանի վրա:",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/800px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
    options: ["Գրքեր և թղթեր", "Մրգեր և բանջարեղեն", "Համակարգիչ և ստեղնաշար", "Բաժակ և ափսե"],
    correct: 1,
  },
  {
    type: "single_choice", level: "B1", section: "Reading", points: PTS.B1,
    text: "Ուշադիր կերպով նայե՛ք գծապատկերին: Ո՞ր ամիսն ունի ամենաբարձր ջերմաստիճան:",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Avg_temperature_in_Iran.png/640px-Avg_temperature_in_Iran.png",
    options: ["Հունվար", "Ապրիլ", "Հուլիս", "Հոկտեմբեր"],
    correct: 2,
  },
  {
    type: "single_choice", level: "B2", section: "Reading", points: PTS.B2,
    text: "Ուշադիր ուսումնասիրե՛ք քարտեզը: Ո՞ր ուղղությամբ է հոսում Արաքս գետը:",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Aras_river_basin_map.png/640px-Aras_river_basin_map.png",
    options: ["Հյուսիսից հարավ", "Արևմուտքից արևելք", "Արևելքից արևմուտք", "Հարավից հյուսիս"],
    correct: 1,
  },

  // ── Audio listening (single_choice with audioSrc) ─────────────────────────
  {
    type: "single_choice", level: "A2", section: "Listening", points: PTS.A2,
    text: "Լսե՛ք ձայնագրությունը: Ի՞նչ են պատվիրում մարդիկ:",
    audioSrc: "https://upload.wikimedia.org/wikipedia/commons/4/40/Sainte-Mère-Église_p1020648.ogg",
    maxPlays: 2,
    options: ["Սուրճ և թխվածք", "Թեյ և կիտրոն", "Հյութ և բլիթ", "Ջուր և հաց"],
    correct: 0,
  },
  {
    type: "single_choice", level: "B1", section: "Listening", points: PTS.B1,
    text: "Լսե՛ք հաղորդումը: Ի՞նչ թեմայի մասին է խոսքը:",
    audioSrc: "https://upload.wikimedia.org/wikipedia/commons/1/19/MiniSunflower.ogg",
    maxPlays: 2,
    options: ["Բնություն և բույսեր", "Երաժշտություն", "Սպորտ", "Ճամփորդություն"],
    correct: 0,
  },
  {
    type: "single_choice", level: "C1", section: "Listening", points: PTS.C1,
    text: "Լսե՛ք բանախոսին: Ի՞նչ հիմնական գաղափար է արտահայտվում:",
    audioSrc: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Vespers_of_Holy_Saturday_%28sample%29.ogg",
    maxPlays: 1,
    options: [
      "Կրթության դերը հասարակության մեջ",
      "Տեխնոլոգիաների ազդեցությունը",
      "Բնապահպանության անհրաժեշտությունը",
      "Ավանդույթների պահպանումը",
    ],
    correct: 3,
  },

  // ── Video listening/watching (single_choice with videoSrc) ────────────────
  {
    type: "single_choice", level: "A2", section: "Listening / Watching", points: PTS.A2,
    text: "Դիտե՛ք տեսանյութը: Ի՞նչ եղանակ է ցուցադրված:",
    videoSrc: "https://upload.wikimedia.org/wikipedia/commons/transcoded/4/47/Wikipedia_Edit_2014.webm/Wikipedia_Edit_2014.webm.360p.webm",
    maxPlays: 2,
    options: ["Արևոտ", "Անձրևոտ", "Ձնավոր", "Ամպամած"],
    correct: 0,
  },
  {
    type: "single_choice", level: "B2", section: "Listening / Watching", points: PTS.B2,
    text: "Դիտե՛ք հատվածը: Ո՞ր թեման է գերակշռում:",
    videoSrc: "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e6/Bison_at_Yellowstone.ogv/Bison_at_Yellowstone.ogv.360p.ogv",
    maxPlays: 1,
    options: [
      "Կենդանիների կյանքը բնության մեջ",
      "Արդյունաբերական արտադրություն",
      "Քաղաքային կյանքը",
      "Ծովային հետազոտություններ",
    ],
    correct: 0,
  },

  // ── Voice / Speaking (voice type) ─────────────────────────────────────────
  {
    type: "voice", level: "A1", section: "Speaking", points: PTS.A1,
    text: "Ձայնագրե՛ք ձեր ողջույնը: Ներկայացե՛ք հայերեն (անուն, տարիք, ձեր քաղաքը):",
    minSeconds: 10, maxSeconds: 60, maxAttempts: 3,
  },
  {
    type: "voice", level: "B1", section: "Speaking", points: PTS.B1,
    text: "Պատմե՛ք ձեր սիրած եղանակի մասին: Ի՞նչ կարող եք անել այդ եղանակին: (30-90 վ)",
    minSeconds: 30, maxSeconds: 90, maxAttempts: 2,
  },
  {
    type: "voice", level: "C1", section: "Speaking", points: PTS.C1,
    text: "Արտահայտե՛ք ձեր կարծիքը. «Թվային տեխնոլոգիաները դրական ազդեցություն ունե՞ն կրթության վրա»: Հիմնավորե՛ք (60-120 վ):",
    minSeconds: 60, maxSeconds: 120, maxAttempts: 2,
  },
];

// ─── CITIES & CENTERS ────────────────────────────────────────────────────────
const CITIES_DATA = [
  { name:"Երևան",  center:{ name:"ArmExam Կ. Երևան",   address:"Բաղրամյան 24, Երևան 0019",  phone:"+374 10 123456",  email:"yerevan@armexam.am" } },
  { name:"Գյումրի",center:{ name:"ArmExam Կ. Գյումրի", address:"Արևմտյան 1, Գյումրի 3101",  phone:"+374 312 12345",  email:"gyumri@armexam.am"  } },
  { name:"Վանաձոր",center:{ name:"ArmExam Կ. Վանաձոր", address:"Կիրովի 5, Վանաձոր 2001",   phone:"+374 322 12345",  email:"vanadzor@armexam.am"} },
];

// ─── PLACEMENT TEMPLATE ───────────────────────────────────────────────────────
const PLACEMENT_TEMPLATE = [
  { level:"A1", pointsEach:1, subpools:[{ section:"Reading", count:3 },{ section:"Grammar", count:2 }] },
  { level:"A2", pointsEach:1, subpools:[{ section:"Reading", count:3 },{ section:"Vocabulary", count:2 }] },
  { level:"B1", pointsEach:2, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Grammar", count:1 }] },
  { level:"B2", pointsEach:2, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Writing", count:1 }] },
  { level:"C1", pointsEach:3, subpools:[{ section:"Reading", count:2 },{ section:"Listening", count:2 },{ section:"Writing", count:1 }] },
  { level:"C2", pointsEach:3, subpools:[{ section:"Reading", count:2 },{ section:"Grammar", count:2 },{ section:"Writing", count:1 }] },
];
const PLACEMENT_THRESHOLDS = { A1:60, A2:60, B1:60, B2:60, C1:60, C2:60 };

// ─── STUDENTS (10, mix of genders & countries) ────────────────────────────────
const STUDENTS_DATA = [
  { name:"Անի Հակոբյան",      email:"ani@example.am",     gender:"female", country:"Armenia", documentType:"passport", documentNumber:"AA123456" },
  { name:"Արամ Պետրոսյան",    email:"aram@example.am",    gender:"male",   country:"Armenia", documentType:"id_card",  documentNumber:"ID789012" },
  { name:"Մարինե Գրիգորյան",  email:"marine@example.am",  gender:"female", country:"Georgia", documentType:"passport", documentNumber:"GE345678" },
  { name:"Դավիթ Սարգսյան",    email:"davit@example.am",   gender:"male",   country:"Armenia", documentType:"passport", documentNumber:"AA001234" },
  { name:"Նատաշա Կ.",          email:"natasha@example.am", gender:"female", country:"Russia",  documentType:"passport", documentNumber:"RU998877" },
  { name:"Հայկ Ավագյան",      email:"hayk@example.am",    gender:"male",   country:"Armenia", documentType:"id_card",  documentNumber:"ID111222" },
  { name:"Սոֆյա Ադամյան",     email:"sofia@example.am",   gender:"female", country:"France",  documentType:"passport", documentNumber:"FR556677" },
  { name:"Արտուր Մկրտչյան",   email:"artur@example.am",   gender:"male",   country:"Armenia", documentType:"passport", documentNumber:"AA333444" },
  { name:"Ալինա Ն.",           email:"alina@example.am",   gender:"female", country:"USA",     documentType:"passport", documentNumber:"US223344" },
  { name:"Կարեն Հ.",           email:"karen@example.am",   gender:"male",   country:"Armenia", documentType:"id_card",  documentNumber:"ID667788" },
];

const PIN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PIN_LENGTH = 8;

function randPin(used) {
  let p;
  do {
    p = Array.from({ length: PIN_LENGTH }, () =>
      PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)]
    ).join("");
  } while (used.has(p));
  used.add(p);
  return p;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding database...");

  await prisma.result.deleteMany();
  await prisma.examAssignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.student.deleteMany();
  await prisma.question.deleteMany();
  await prisma.section.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.examCenter.deleteMany();
  await prisma.city.deleteMany();

  // Sections
  const SECTION_NAMES = ["Reading", "Grammar", "Vocabulary", "Writing", "Listening", "Speaking", "Listening / Watching", "Free Writing"];
  const sectionMap = {};
  for (const name of SECTION_NAMES) {
    const sec = await prisma.section.create({ data: { name } });
    sectionMap[name] = sec.id;
  }
  console.log(`✅ ${SECTION_NAMES.length} sections`);

  // Questions
  for (const q of QUESTIONS) {
    const { section, ...rest } = q;
    await prisma.question.create({ data: { ...rest, sectionId: sectionMap[section] } });
  }
  console.log(`✅ ${QUESTIONS.length} questions (5 × 8 sections × 6 levels)`);

  // Media questions (image / audio / video / voice)
  const createdMediaQs = [];
  for (const q of MEDIA_QUESTIONS) {
    const { section, imageUrl, ...rest } = q;
    const created = await prisma.question.create({
      data: {
        ...rest,
        ...(imageUrl ? { imageSrc: imageUrl } : {}),
        sectionId: sectionMap[section] ?? sectionMap["Reading"],
      },
    });
    createdMediaQs.push({ ...q, id: created.id });
  }
  console.log(`✅ ${createdMediaQs.length} media questions (image/audio/video/voice)`);

  // Cities & Centers
  const centers = [];
  for (const { name, center } of CITIES_DATA) {
    const city = await prisma.city.create({
      data: { name, centers: { create: [center] } },
      include: { centers: true },
    });
    centers.push(city.centers[0]);
  }
  console.log(`✅ ${CITIES_DATA.length} cities, ${centers.length} centers`);

  // Placement exams (one per center)
  const examTitles = ["Placement Test — Երևան", "Placement Test — Գյումրի", "Placement Test — Վանաձոր"];
  const exams = [];
  for (let i = 0; i < centers.length; i++) {
    const exam = await prisma.exam.create({
      data: {
        title: examTitles[i], examType:"placement", level:null,
        duration:60, passingScore:null, shuffle:true,
        showResults:true, showQuestionLevel:true, showQuestionPoints:true,
        placementTemplate:PLACEMENT_TEMPLATE, placementThresholds:PLACEMENT_THRESHOLDS,
        showPlacementThreshold:true,
        status:"active", isOpen:true,
        examCenterId:centers[i].id,
        startDate:new Date("2026-01-01"), endDate:new Date("2026-12-31"),
      },
    });
    exams.push(exam);
  }
  console.log(`✅ ${exams.length} placement exams`);

  // Fixed-level exams (for certificates) - Armenian language exams
  const fixedExams = [
    { title: "Հայոց լեզու A1", level: "A1", passingScore: 60 },
    { title: "Հայոց լեզու A2", level: "A2", passingScore: 60 },
    { title: "Հայոց լեզու B1", level: "B1", passingScore: 60 },
  ];
  const createdFixedExams = [];
  for (const fe of fixedExams) {
    const exam = await prisma.exam.create({
      data: {
        title: fe.title, examType: "fixed", level: fe.level,
        duration: 60, passingScore: fe.passingScore, shuffle: true,
        showResults: true, showQuestionLevel: true, showQuestionPoints: true,
        status: "active", isOpen: false,  // Closed - past exams
        examCenterId: centers[0].id,
        startDate: new Date("2024-01-01"), endDate: new Date("2024-12-31"),  // Past dates
      },
    });
    createdFixedExams.push(exam);
  }
  console.log(`✅ ${createdFixedExams.length} fixed exams (A1, A2, B1)`);

  // Students with PINs
  const usedPins = new Set();
  for (let i = 0; i < STUDENTS_DATA.length; i++) {
    const s   = STUDENTS_DATA[i];
    const exam = exams[i % exams.length];
    const pin  = randPin(usedPins);
    await prisma.student.create({
      data: {
        ...s,
        passwordHash: hashPassword("demo1234", s.email),
        status:"active",
        exams: { create: [{ examId:exam.id, pin }] },
      },
    });
    console.log(`  👤 ${s.name.padEnd(22)} → ${exam.title} | PIN: ${pin}`);
  }
  console.log(`✅ ${STUDENTS_DATA.length} students`);

  // ─── DEMO RESULTS ─────────────────────────────────────────────────────────
  console.log("📊 Creating demo results...");

  // Helper to make a fake answers object for auto-graded questions
  function fakeAnswers(questionList, pctTarget) {
    const ans = {};
    for (const q of questionList) {
      const hit = Math.random() * 100 < pctTarget;
      if (q.type === "single_choice") {
        ans[q.id] = hit ? q.correct : (q.correct + 1) % (q.options?.length || 4);
      } else if (q.type === "multi_choice" || q.type === "multi_select") {
        ans[q.id] = hit ? q.correct : [];
      } else if (q.type === "fill_blank") {
        ans[q.id] = hit ? (q.answer || "") : "wrong answer";
      } else if (q.type === "writing") {
        ans[q.id] = "Ուսանողի գրավոր պատասխան (demo):  Ես կարծում եմ, որ...";
      } else if (q.type === "voice") {
        ans[q.id] = "/media/demo-voice.webm";
      }
    }
    return ans;
  }

  // ── 1. Fixed exam results (Անի — passed, Արամ — failed, Մարինե — passed) ──
  const [aniStudent, aramStudent, marineStudent, davitStudent, haikStudent, artурStudent] =
    await Promise.all([
      prisma.student.findUnique({ where: { email: "ani@example.am" } }),
      prisma.student.findUnique({ where: { email: "aram@example.am" } }),
      prisma.student.findUnique({ where: { email: "marine@example.am" } }),
      prisma.student.findUnique({ where: { email: "davit@example.am" } }),
      prisma.student.findUnique({ where: { email: "hayk@example.am" } }),
      prisma.student.findUnique({ where: { email: "artur@example.am" } }),
    ]);

  const fixedResultDefs = [
    // Անի — passed A1, A2, B1
    { student: aniStudent,   examIdx: 0, pct: 82, passed: true,  date: "2025-02-10" },
    { student: aniStudent,   examIdx: 1, pct: 76, passed: true,  date: "2025-04-05" },
    { student: aniStudent,   examIdx: 2, pct: 65, passed: true,  date: "2025-06-20" },
    // Արամ — failed A1
    { student: aramStudent,  examIdx: 0, pct: 47, passed: false, date: "2025-03-15" },
    // Մարինե — passed A1
    { student: marineStudent,examIdx: 0, pct: 91, passed: true,  date: "2025-03-22" },
  ];

  for (const rd of fixedResultDefs) {
    if (!rd.student) continue;
    const exam = createdFixedExams[rd.examIdx];
    if (!exam) continue;
    const pin = randPin(usedPins);
    // Check assignment doesn't already exist
    const existingAssign = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId: exam.id, studentId: rd.student.id } },
    });
    if (!existingAssign) {
      await prisma.examAssignment.create({
        data: { studentId: rd.student.id, examId: exam.id, pin },
      });
    }
    await prisma.result.create({
      data: {
        examId: exam.id,
        studentId: rd.student.id,
        score: rd.pct,
        totalPoints: 100,
        pct: rd.pct,
        passed: rd.passed,
        gradingStatus: "auto",
        submittedAt: new Date(rd.date),
      },
    });
    console.log(`  📝 Fixed  ${rd.student.name} → ${exam.title} | ${rd.pct}% | ${rd.passed ? "✓ passed" : "✗ failed"}`);
  }

  // ── 2. Placement results (multiple scenarios) ─────────────────────────────
  const placementExam = exams[0]; // Երևան placement exam
  if (placementExam) {
    const placementResultDefs = [
      // Դավիթ — placed at B2
      {
        student: davitStudent,
        levelStats: {
          A1: { earnedPts: 5, maxPts: 5, pct: 100, passed: true },
          A2: { earnedPts: 5, maxPts: 5, pct: 100, passed: true },
          B1: { earnedPts: 8, maxPts: 10, pct: 80,  passed: true },
          B2: { earnedPts: 6, maxPts: 10, pct: 60,  passed: true },
          C1: { earnedPts: 7, maxPts: 15, pct: 47,  passed: false },
          C2: { earnedPts: 5, maxPts: 15, pct: 33,  passed: false },
        },
        detectedLevel: "B2", passed: true, date: "2025-01-18",
      },
      // Հայկ — placed at C1
      {
        student: haikStudent,
        levelStats: {
          A1: { earnedPts: 5, maxPts: 5,  pct: 100, passed: true },
          A2: { earnedPts: 5, maxPts: 5,  pct: 100, passed: true },
          B1: { earnedPts: 9, maxPts: 10, pct: 90,  passed: true },
          B2: { earnedPts: 8, maxPts: 10, pct: 80,  passed: true },
          C1: { earnedPts: 10,maxPts: 15, pct: 67,  passed: true },
          C2: { earnedPts: 6, maxPts: 15, pct: 40,  passed: false },
        },
        detectedLevel: "C1", passed: true, date: "2025-02-03",
      },
      // Արտուր — below minimum (A1 not passed)
      {
        student: artурStudent,
        levelStats: {
          A1: { earnedPts: 2, maxPts: 5,  pct: 40,  passed: false },
          A2: { earnedPts: 1, maxPts: 5,  pct: 20,  passed: false },
          B1: { earnedPts: 2, maxPts: 10, pct: 20,  passed: false },
          B2: { earnedPts: 1, maxPts: 10, pct: 10,  passed: false },
          C1: { earnedPts: 1, maxPts: 15, pct: 7,   passed: false },
          C2: { earnedPts: 0, maxPts: 15, pct: 0,   passed: false },
        },
        detectedLevel: null, passed: false, date: "2025-02-14",
      },
    ];

    for (const rd of placementResultDefs) {
      if (!rd.student) continue;
      // Compute totals from levelStats
      const totalPts  = Object.values(rd.levelStats).reduce((s, l) => s + l.maxPts,   0);
      const earnedPts = Object.values(rd.levelStats).reduce((s, l) => s + l.earnedPts, 0);
      const pct       = Math.round((earnedPts / totalPts) * 100);

      const existingAssign = await prisma.examAssignment.findUnique({
        where: { examId_studentId: { examId: placementExam.id, studentId: rd.student.id } },
      });
      if (!existingAssign) {
        await prisma.examAssignment.create({
          data: { studentId: rd.student.id, examId: placementExam.id, pin: randPin(usedPins) },
        });
      }
      await prisma.result.create({
        data: {
          examId: placementExam.id,
          studentId: rd.student.id,
          score: earnedPts,
          totalPoints: totalPts,
          pct,
          passed: rd.passed,
          detectedLevel: rd.detectedLevel,
          levelStats: rd.levelStats,
          gradingStatus: "auto",
          submittedAt: new Date(rd.date),
        },
      });
      console.log(`  🎯 Placement ${rd.student.name} → ${rd.detectedLevel ?? "below minimum"} | ${pct}% | ${rd.passed ? "✓ placed" : "✗ below min"}`);
    }
  }

  // ── 3. Pending manual grading (voice + writing) ───────────────────────────
  const voiceQs   = await prisma.question.findMany({ where: { type: "voice" },   take: 2 });
  const writingQs = await prisma.question.findMany({ where: { type: "writing" }, take: 2 });
  const manualQs  = [...voiceQs, ...writingQs];
  const pendingStudent = marineStudent;
  const pendingExam    = createdFixedExams[1] ?? createdFixedExams[0]; // A2

  if (pendingStudent && pendingExam && manualQs.length > 0) {
    const existingAssign = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId: pendingExam.id, studentId: pendingStudent.id } },
    });
    if (!existingAssign) {
      await prisma.examAssignment.create({
        data: { studentId: pendingStudent.id, examId: pendingExam.id, pin: randPin(usedPins) },
      });
    }
    const pendingAnswers = {};
    for (const q of manualQs) {
      pendingAnswers[q.id] = q.type === "voice"
        ? "/media/demo-voice-marine.webm"
        : "Ես կարծում եմ, որ հայոց լեզուն ունի հարուստ պատմություն: Դա արտահայտվում է...";
    }
    const totalPts = manualQs.reduce((s, q) => s + q.points, 0);
    await prisma.result.create({
      data: {
        examId: pendingExam.id,
        studentId: pendingStudent.id,
        score: 0, totalPoints: totalPts, pct: 0,
        passed: null,
        answers: pendingAnswers,
        gradingStatus: "pending",
        submittedAt: new Date("2025-03-01"),
      },
    });
    console.log(`  ⏳ Pending  ${pendingStudent.name} → ${pendingExam.title} | awaiting manual grading`);
  }
  console.log("✅ Demo results created");

  // Admins
  const adminSeeds = [

  const aniStudent = await prisma.student.findUnique({ where: { email: "ani@example.am" } });
  if (aniStudent) {
    // Create exam assignments and results for A1, A2, B1 exams
    const certificateResults = [
      { examIndex: 0, score: 80, totalPoints: 100, pct: 80, passed: true },  // A1 - 80%
      { examIndex: 1, score: 76, totalPoints: 100, pct: 76, passed: true },  // A2 - 76%
      { examIndex: 2, score: 68, totalPoints: 100, pct: 68, passed: true },  // B1 - 68%
    ];
    
    for (let i = 0; i < certificateResults.length; i++) {
      const cr = certificateResults[i];
      const exam = createdFixedExams[cr.examIndex];
      const pin = randPin(usedPins);
      
      // Create exam assignment
      const assignment = await prisma.examAssignment.create({
        data: {
          studentId: aniStudent.id,
          examId: exam.id,
          pin: pin,
        },
      });
      
      // Create result
      await prisma.result.create({
        data: {
          examId: exam.id,
          studentId: aniStudent.id,
          score: cr.score,
          totalPoints: cr.totalPoints,
          pct: cr.pct,
          passed: cr.passed,
          gradingStatus: "auto",
          submittedAt: new Date(`2024-${6 + i * 2}-15`), // Different dates: June, Aug, Oct
        },
      });
      console.log(`  📜 ${aniStudent.name} → ${exam.title} | ${cr.pct}% | PIN: ${pin}`);
    }
    console.log(`✅ Added ${certificateResults.length} certificates for ${aniStudent.name}`);
  }

  // Demo results for manual grading (writing / speaking) so ExaminerDashboard has data
  console.log("📝 Creating demo results for manual grading preview...");
  // Pick a couple of writing and speaking questions
  const demoWritingQs = await prisma.question.findMany({
    where: { type: "writing" },
    take: 2,
  });
  const demoVoiceQs = await prisma.question.findMany({
    where: { type: "voice" },
    take: 1,
  });
  const demoQuestions = [...demoWritingQs, ...demoVoiceQs];

  if (demoQuestions.length > 0) {
    // Choose any existing student (not Ani, чтобы видеть разные профили)
    const demoStudent =
      (await prisma.student.findUnique({ where: { email: "davit@example.am" } })) ||
      (await prisma.student.findFirst());
    const demoExam = exams[0] ?? createdFixedExams[0];

    if (demoStudent && demoExam) {
      // Pending result with unanswered manual questions
      const pendingAnswers = {};
      for (const q of demoQuestions) {
        if (q.type === "writing") {
          pendingAnswers[q.id] = "Սա օրինակային գրավոր պատասխան է ուսանողի կողմից՝ դիտարկման համար:";
        } else if (q.type === "voice") {
          // In real system this would be a blob URL or file path
          pendingAnswers[q.id] = "/media/demo-voice-answer.mp3";
        }
      }

      await prisma.result.create({
        data: {
          examId: demoExam.id,
          studentId: demoStudent.id,
          score: 0,
          totalPoints: demoQuestions.reduce((s, q) => s + q.points, 0),
          pct: 0,
          passed: null,
          answers: pendingAnswers,
          gradingStatus: "pending",
          submittedAt: new Date(),
        },
      });

      // Already graded result with manualGrades filled
      const gradedAnswers = {};
      const manualGrades = {};
      let manualEarned = 0;
      let manualTotal = 0;

      for (const q of demoQuestions) {
        if (q.type === "writing") {
          gradedAnswers[q.id] =
            "Սա արդեն ստուգված գրավոր պատասխան է, որը պետք է երևա որպես пример «уже проверенных» работ.";
        } else if (q.type === "voice") {
          gradedAnswers[q.id] = "/media/demo-voice-graded.mp3";
        }
        const maxPts = q.points;
        const earned = Math.max(1, Math.round(maxPts * 0.7));
        manualGrades[q.id] = {
          earnedPoints: earned,
          maxPoints: maxPts,
          status: "approved",
          notes: "Demo graded in seed",
        };
        manualEarned += earned;
        manualTotal += maxPts;
      }

      const gradedPct = manualTotal > 0 ? Math.round((manualEarned / manualTotal) * 100) : 0;

      await prisma.result.create({
        data: {
          examId: demoExam.id,
          studentId: demoStudent.id,
          score: manualEarned,
          totalPoints: manualTotal,
          pct: gradedPct,
          passed: gradedPct >= 60,
          answers: gradedAnswers,
          gradingStatus: "graded",
          manualGrades,
          gradingStatus: "graded",
          submittedAt: new Date(),
        },
      });

      console.log("✅ Demo pending and graded results created for manual grading UI");
    }
  }

  // Admins
  const adminSeeds = [
    { name:"Super Admin",    email:"admin@armexam.am",    password:"admin1234", role:"super_admin",   centerId:null },
    { name:"Center Admin",   email:"center@armexam.am",   password:"demo1234",  role:"center_admin",  centerId:centers[0].id },
    { name:"Moderator",      email:"moder@armexam.am",    password:"demo1234",  role:"moderator",     centerId:null },
    { name:"Examiner",       email:"examiner@armexam.am", password:"demo1234",  role:"examiner",      centerId:null },
  ];
  for (const a of adminSeeds) {
    await prisma.admin.create({
      data: {
        name:         a.name,
        email:        a.email,
        passwordHash: hashPassword(a.password, a.email),
        role:         a.role,
        status:       "active",
        ...(a.centerId ? { centerId: a.centerId } : {}),
      },
    });
    console.log(`✅ ${a.role.padEnd(14)} ${a.email} / ${a.password}`);
  }

  console.log("\n🎉 Seed complete! Password for all students: demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
