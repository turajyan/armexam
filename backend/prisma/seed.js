import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password, email) {
  return crypto.createHash("sha256").update(password + email.toLowerCase()).digest("hex");
}

// ─── QUESTION BANKS: 5 per section per level ─────────────────────────────────
// Points: A1=1, A2=1, B1=2, B2=3, C1=4, C2=5
const PTS = { A1:1, A2:1, B1:2, B2:3, C1:4, C2:5 };

// ── READING (single_choice) ───────────────────────────────────────────────────
const READING = {
  A1: [
    { text:"«Բարև» բառի հոմանիշն է", options:["Ցտեսություն","Ողջո՜ւն","Կներեք","Շնորհակալ եմ"], correct:1 },
    { text:"«Ես ուսանող եմ» — ո՞ ր թ-ն է ճ.", options:["I am a teacher","I am a student","I go to school","I study here"], correct:1 },
    { text:"Ո՞ ր բ. է կ. ա.", options:["Սեղան","Շուն","Պատ","Գիրք"], correct:1 },
    { text:"«Ինն» — ո՞ ր թ. է", options:["7","8","9","10"], correct:2 },
    { text:"«Կարմիր» բ. կ. ցույց տա", options:["Թ.","Բ.","Ա.","Մ."], correct:2 },
  ],
  A2: [
    { text:"«Ամռանը» — ե՞ ր ե.", options:["Ձ.","Ա.","Գ.","Ա. 4"], correct:1 },
    { text:"«Ես ամ. օ. դ. եմ գ. ա.» — ե՞ կ. գ.", options:["Ոտ.","Ա.","Մ.","Հ."], correct:1 },
    { text:"«Երեկ» — ե՞ ր ժ.", options:["Ա.","Վ.","Ա. 3","Ա. 4"], correct:2 },
    { text:"«Ուտ.» = ?", options:["To drink","To eat","To sleep","To play"], correct:1 },
    { text:"«Ն. կ. գ. գ.» — ո՞ վ ա.", options:["Ե.","Ն.","Մ.","Ն. 4"], correct:1 },
  ],
  B1: [
    { text:"«Ջ. ք. փ.» — ի՞ ն ա.", options:["Ու. ա. կ.","Հ. հ. կ.","Ջ. վտ. է","Ք. կ."], correct:1 },
    { text:"«Ուրախ» բ. հ. է", options:["Տ.","Ե.","Հ.","Բ."], correct:1 },
    { text:"«Ե. կ., ե. ժ. ու.» — ձ.", options:["Ե.","Ս.","Պ.","Հ."], correct:2 },
    { text:"Ո՞ ր ն. է կ. ս.", options:["Ն. գ. ն.","Ն. գ.","Գ. ն.","Ն. ու."], correct:1 },
    { text:"«Հ.» բ. ա. է", options:["Ծ.","Ու.","Ե.","Հ."], correct:2 },
  ],
  B2: [
    { text:"«Ա.» բ. ի. է", options:["Մ.","Ան.","Կ.","Ու."], correct:1 },
    { text:"«Ն. ա., որ կ.» — ձ.", options:["Ու. ե.","Ան. ե.","Հ.","Ե."], correct:1 },
    { text:"«Ա.» բ. ա. է", options:["Բ.","Ու.","Լ.","Ա."], correct:2 },
    { text:"«Ժ.» բ. ա. ունի", options:["ժ-","ժ-ա-","ժա-","ժ-ան-"], correct:0 },
    { text:"Ո՞ ր շ. է հ.", options:["ու.-տ.","գ.-գ.","ա.-դ.","մ.-փ."], correct:1 },
  ],
  C1: [
    { text:"«Ոս. ձ. ու.» — ի՞ ն ա.", options:["Ոս. ու.","Վ. ա. է","Ա. է","Ձ. ոս. են"], correct:1 },
    { text:"«Հ. լ. ընդ մ.» — ոճ", options:["Ժ.","Գ.-բ.","Բ.","Ժ.-խ."], correct:1 },
    { text:"Ո՞ ա. ու. փ. ի.", options:["Ս. ջ. խ.","Ս. կ.","Դ. բ.","Ճ. գ."], correct:1 },
    { text:"«Ճ. ձ.» — ի՞ ոճ. հ.", options:["Փ.","Ձ.","Հ.","Հ. 4"], correct:2 },
    { text:"«Ա.» և «ու.» տ.", options:["Ն. ի.","«Ա.»-ն բ. ո. է","«Ու.»-ն պ.","Ե. ա. են"], correct:1 },
  ],
  C2: [
    { text:"«Յ.» բ. ժ. հ.", options:["Ընդ. է","Ա. է","Ժ.-խ.","Բ."], correct:1 },
    { text:"«Փ.» ոճ — ի՞ ա.", options:["Ու. ա.","Մ. բ. ա.","Կ.","Հ."], correct:1 },
    { text:"Ո՞ ր շ. ա. բ. են", options:["ե., ն., մ.","յ., ա., ո.","գ., բ., ն.","լ., ձ., բ."], correct:1 },
    { text:"«Ստ.» բ. ա. է", options:["ստ-","ստ.-","ստ.-","ստ. 4"], correct:2 },
    { text:"«Ա. ի.» — ոճ", options:["Խ.","Գ.-հ.","Գ.","Կ."], correct:1 },
  ],
};

// ── GRAMMAR (fill_blank for A1,B1,C1; single_choice for A2,B2,C2) ─────────────
const GRAMMAR = {
  A1: [
    { type:"fill_blank", text:"Լ. «Ես ___ եմ» (ուս.)", answer:"ուսանող" },
    { type:"fill_blank", text:"Լ. «Ն. ___ է» (ուս.)", answer:"ուսուցիչ" },
    { type:"single_choice", text:"Ճ. ն.", options:["Ես գ. եմ","Ես եմ","Գ. ե.","Ե. ես"], correct:0 },
    { type:"fill_blank", text:"Լ. «Ն. ___ է գ.» (դ.)", answer:"դպրոց" },
    { type:"single_choice", text:"Ճ. «Ես ___ հ.»", options:["ե.","եմ","են","ե. 4"], correct:1 },
  ],
  A2: [
    { type:"single_choice", text:"Ճ. «Ես ___ դ.»", options:["գ.","գ. ե.","կ.","ե. գ."], correct:1 },
    { type:"fill_blank", text:"Լ. «Ն. ամ. օ. ___ է ու.» (ն.)", answer:"նախաճաշ" },
    { type:"single_choice", text:"«Ես գ.» — ձ.", options:["Ն.","Ա. կ.","Ա.","Հ."], correct:1 },
    { type:"fill_blank", text:"Լ. «Ն. ___ է» (բ.)", answer:"բժիշկ" },
    { type:"single_choice", text:"Ճ. «___ դ. ամ. օ.»", options:["դ.","մ.","կ.","հ."], correct:0 },
  ],
  B1: [
    { type:"fill_blank", text:"Լ. «Ե. ան. ___, կ. մ.» (գ.)", answer:"գա" },
    { type:"single_choice", text:"Ճ. «Ե. ժ. ___, կ.»", options:["ու.","ու. 2","ու.","ու. ե."], correct:2 },
    { type:"fill_blank", text:"Լ. «Ե. կ., ե. ___ գ.» (դ.)", answer:"դու" },
    { type:"single_choice", text:"Ո՞ ր ն. կ. ս.", options:["Ե. գ.","Ն. գ.","Ն. գ. ե.","Գ."], correct:1 },
    { type:"fill_blank", text:"Լ. «Ն. ա., որ ___ կ.» (ի.)", answer:"ինքը" },
  ],
  B2: [
    { type:"single_choice", text:"Ճ. «Ե. ___ կ.»", options:["ծ.","ծ. ե.","ծ. լ.","ծ. կ."], correct:2 },
    { type:"fill_blank", text:"Լ. «Չ. ___ ն. ու.» (ս.)", answer:"սպասված" },
    { type:"single_choice", text:"«Ն. ա. կ.» — ձ.", options:["Ու. ե.","Ան. ե.","Հ.","Հ. 4"], correct:1 },
    { type:"fill_blank", text:"Լ. «Ե. ___ կ., ե. ժ. ու.» (ա.)", answer:"ավելի" },
    { type:"single_choice", text:"Ճ. ե. կ.", options:["Ե. կ.","Ե. ու.","Ե. կ. 3","Ե. ու. ե."], correct:2 },
  ],
  C1: [
    { type:"fill_blank", text:"Լ. «Ոս. ___ ու.» (ձ.)", answer:"ձեռքեր" },
    { type:"single_choice", text:"Ոճ. ճ.", options:["Ե.","Կ.","Կ. ձ.","Կ. 4"], correct:2 },
    { type:"fill_blank", text:"Լ. «Թ. ___, շ. կ.» (հ.)", answer:"հոգնած" },
    { type:"single_choice", text:"Ճ. «Ժ. տ. ու.»", options:["ժ. կ.","ժ. ու.","ժ. ե.","ժ. ն."], correct:0 },
    { type:"fill_blank", text:"Լ. «___ ու. խ.» (ե.)", answer:"ելույթ" },
  ],
  C2: [
    { type:"single_choice", text:"Ճ. կ.", options:["Ով ջ.","Ով ջ. հ.","Ան. ջ.","Ան. հ."], correct:0 },
    { type:"fill_blank", text:"Լ. «Ե. ա. կ. ___ ա. բ. կ.» (ի.)", answer:"կիմանայի" },
    { type:"single_choice", text:"Ձ. — ո՞ ժ", options:["Ն.","Ան. կ.","Ն. կ.","Ան. ան."], correct:1 },
    { type:"fill_blank", text:"Լ. «___ չ., ով բ. հ.» (մ.)", answer:"մարդ" },
    { type:"single_choice", text:"Ճ. «Ի. ա. ___ ոս.»", options:["ն. բ.","ան. բ.","փ. բ.","գ. բ."], correct:1 },
  ],
};

// ── VOCABULARY (multi_choice A1-A2; multi_select B1-C2) ──────────────────────
const VOCABULARY = {
  A1: [
    { type:"multi_choice", text:"Ո՞ ր բ. են թ.", options:["Երկ.","Կ.","Հ.","Մ.","Ու."], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ ր բ. են գ.", options:["Կ.","Վ.","Կ. 3","Ա.","Կ. 5"], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ ր բ. են մ. մ.", options:["Ձ.","Տ.","Ո.","Դ.","Գ."], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ ր բ. են շ. օ.", options:["Ե.","Հ.","Ու.","Ձ.","Կ."], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ ր բ. են կ.", options:["Կ.","Ծ.","Շ.","Ծ. 4","Ձ."], correct:[0,2,4] },
  ],
  A2: [
    { type:"multi_choice", text:"Ո՞ ր բ. են ըն.", options:["Մ.","Ս.","Հ.","Լ.","Ք."], correct:[0,2,4] },
    { type:"multi_choice", text:"Ո՞ ր բ. են ու. / կ.", options:["Հ.","Ա.","Ջ.","Ու.","Կ."], correct:[0,2] },
    { type:"multi_choice", text:"Ո՞ ր բ. ցուցաբ. գ.", options:["Ամ.","Ձ.","Ըն.","Ն.","Ա."], correct:[0,1,4] },
    { type:"multi_choice", text:"Ո՞ ր բ. են ու. / ճ.", options:["Ձ.","Ա.","Ն.","Պ.","Փ."], correct:[0,1,3,4] },
    { type:"multi_choice", text:"Ո՞ ր բ. կ. կ.", options:["Ա.","Ա. 2","Կ.","Ե."], correct:[1] },
  ],
  B1: [
    { type:"multi_select", text:"Ո՞ ր բ. կ. «ե.»-ի հ.", options:["Ա.","Բ.","Ան.","Ձ.","Գ.","Ք."], correct:[0,2,3,5] },
    { type:"multi_select", text:"Ո՞ ր բ. «ուր.»-ի հ.", options:["Ու.","Տ.","Ե.","Հ.","Ե. 5","Ծ."], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ ր բ. «հ.»-ի ա.", options:["Ա.","Ն.","Ծ.","Ս.","Ք.","Ն. 6"], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ ր բ. «ա.»-ի հ.", options:["Ու.","Ա.","Ֆ.","Ռ.","Ն.","Ր."], correct:[0,1,3] },
    { type:"multi_select", text:"Ո՞ ր բ. «կ.»-ի ա.", options:["Ե.","Ջ.","Ա.","Ա. ջ.","Ն.","Ց."], correct:[1,3] },
  ],
  B2: [
    { type:"multi_select", text:"Ո՞ ր բ. կ. «ճ.»-ի հ.", options:["Ի.","Բ.","Կ.","Ճ.","Դ.","Ան."], correct:[0,2,3,5] },
    { type:"multi_select", text:"Ո՞ ր բ. «ն.»-ի հ.", options:["Ա.","Ու.","Ն.","Ն. կ.","Ն. 5","Ն. 6"], correct:[0,1,2] },
    { type:"multi_select", text:"Ո՞ ր բ. «ղ.»-ի", options:["Հ.","Ա.","Ան.","Կ.","Ղ. 5","Ղ. 6"], correct:[0,1,2] },
    { type:"multi_select", text:"Ո՞ ր բ. «ա.»-ի", options:["Ի.","Ք.","Ն.","Ֆ.","Ա.","Ն. 6"], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ ր բ. «բ.»-ի հ.", options:["Ա.","Ն.","Ա. 3","Ն. 4","Ն. 5","Ն. 6"], correct:[0,2] },
  ],
  C1: [
    { type:"multi_select", text:"Ո՞ ր բ. բ. ոճ", options:["Ա.","Ու.","Հ.","Ա. 4","Հ. 5","Ճ."], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ ր բ. «ե.»-ի հ.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4","Ն. 5","Ն. 6"], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ ր բ. «ա.»-ի", options:["Ա.","Ն.","Ն. 3","Ն. 4","Ն. 5","Ն. 6"], correct:[0,1] },
    { type:"multi_select", text:"Ո՞ ր բ. գ. ոճ", options:["Ն.","Ն. 2","Ն. 3","Ն. 4","Ն. 5","Ն. 6"], correct:[1,3,5] },
    { type:"multi_select", text:"Ո՞ ր ա. բ. ոճ", options:["Ա.","Ա. 2","Ա. 3","Ա. 4","Ա. 5","Ա. 6"], correct:[0,2,4] },
  ],
  C2: [
    { type:"multi_select", text:"Ո՞ ր բ. ա.", options:["Շ.","Ո.","Յ.","Ն.","Ա.","Ե."], correct:[2] },
    { type:"multi_select", text:"Ո՞ ր ա. փ. ի.", options:["Ս. կ.","Ջ. խ.","Ձ. մ.","Հ. ու."], correct:[0,2] },
    { type:"multi_select", text:"Ո՞ ր բ. ա. 2", options:["Ն.","Ն. 2","Ն. 3","Ն. 4","Ն. 5","Ն. 6"], correct:[1,3] },
    { type:"multi_select", text:"Ո՞ ր ա. ա.", options:["Ա.","Ա. 2","Ա. 3","Ա. 4","Ա. 5","Ա. 6"], correct:[0,2,4] },
    { type:"multi_select", text:"Ո՞ ր բ. փ. ի.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4","Ն. 5","Ն. 6"], correct:[0,3] },
  ],
};

// ── WRITING (fill_blank A1-B1; writing B2-C2) ─────────────────────────────────
const WRITING = {
  A1: [
    { type:"fill_blank", text:"Լ. «Ես ___ եմ» (ուր.)", answer:"ուրախ" },
    { type:"fill_blank", text:"Լ. «Ն. ___ է» (ուս.)", answer:"ուսուցիչ" },
    { type:"fill_blank", text:"Լ. «Ես ___ ե. ս.» (հ.)", answer:"հայրենիք" },
    { type:"fill_blank", text:"Լ. «Մ. ___ է» (բ.)", answer:"բժիշկ" },
    { type:"fill_blank", text:"Լ. «Ես ___ ու.» (ըն.)", answer:"ընտանիք" },
  ],
  A2: [
    { type:"fill_blank", text:"Լ. «Ն. ամ. ___ ու.» (ն.)", answer:"նախաճաշ" },
    { type:"fill_blank", text:"Լ. «Ես ___ ե. գ.» (շ.)", answer:"շուկա" },
    { type:"fill_blank", text:"Լ. «Ն. ___ ե. հ.» (հ.)", answer:"հագուստ" },
    { type:"fill_blank", text:"Լ. «Ես ___ ե. ու.» (ջ.)", answer:"ջուր" },
    { type:"fill_blank", text:"Լ. «Ն. ___ ե. խ.» (ֆ.)", answer:"ֆուտբոլ" },
  ],
  B1: [
    { type:"fill_blank", text:"Լ. «Ե. ան. ___, կ. մ.» (գ.)", answer:"գա" },
    { type:"fill_blank", text:"Լ. «Ն. ___ շ. ա.» (կ.)", answer:"կատ." },
    { type:"fill_blank", text:"Լ. «Ն. ա., ի. ___ կ.» (ի.)", answer:"ինք" },
    { type:"fill_blank", text:"Լ. «Ն. ___ ա.» (արդ.)", answer:"արդ." },
    { type:"fill_blank", text:"Լ. «Ն. ___ ու.» (ժ.)", answer:"ժամ." },
  ],
  B2: [
    { type:"writing", text:"Գ. 80-100 բ. «Ի. կ. փ. ք.»", minWords:80, maxWords:120 },
    { type:"writing", text:"Գ. 80-100 բ. «Ն. ն. ու. ձ.»", minWords:80, maxWords:120 },
    { type:"writing", text:"Գ. 80-100 բ. «Ի. կ. փ. ա.»", minWords:80, maxWords:120 },
    { type:"writing", text:"Գ. 80-100 բ. «Ն. կ. բ.»", minWords:80, maxWords:120 },
    { type:"writing", text:"Գ. 80-100 բ. «Ի. կ. ըն.»", minWords:80, maxWords:120 },
  ],
  C1: [
    { type:"writing", text:"Գ. 120-150 բ. «Ժ. հ. մ.»", minWords:120, maxWords:180 },
    { type:"writing", text:"Գ. 120-150 բ. «Լ. դ. ա.»", minWords:120, maxWords:180 },
    { type:"writing", text:"Գ. 120-150 բ. «Ա. ի. ե.»", minWords:120, maxWords:180 },
    { type:"writing", text:"Գ. 120-150 բ. «Ա. ու. ի.»", minWords:120, maxWords:180 },
    { type:"writing", text:"Գ. 120-150 բ. «Ե. ու. ի.»", minWords:120, maxWords:180 },
  ],
  C2: [
    { type:"writing", text:"Գ. 150-200 բ. «Գ. դ. ազ.»", minWords:150, maxWords:220 },
    { type:"writing", text:"Գ. 150-200 բ. «Հ. լ. ա.»", minWords:150, maxWords:220 },
    { type:"writing", text:"Գ. 150-200 բ. «Ա. ն. ի.»", minWords:150, maxWords:220 },
    { type:"writing", text:"Գ. 150-200 բ. «Ք. ու. ի.»", minWords:150, maxWords:220 },
    { type:"writing", text:"Գ. 150-200 բ. «Ե. ու. ղ.»", minWords:150, maxWords:220 },
  ],
};

// ── LISTENING (single_choice, text-based) ────────────────────────────────────
const LISTENING = {
  A1: [
    { text:"Ա. ողջ. — ե՞ ն ա.", options:["Բ. լ.","Ց.","Կ.","Շ."], correct:0 },
    { text:"«Բ. գ.» ե՞ ր ա.", options:["Ե.","Կ.","Ա.","Գ."], correct:2 },
    { text:"Ի՞ ն ա. «կ.» ռ-ն", options:["Ա.","Ն.","Ք.","Ն. 4"], correct:1 },
    { text:"«Ա.» = ?", options:["Good morning","Goodbye","Thank you","Please"], correct:0 },
    { text:"Ի՞ ն ա. «ջ.» ռ-ն", options:["Water","Fire","Earth","Air"], correct:0 },
  ],
  A2: [
    { text:"«Ն. ա. ամ.» — ե՞ ն ա.", options:["Ձ.","Ա.","Ն.","Ե."], correct:1 },
    { text:"Ի՞ ն կ. «8 ժ. ե. ք.»", options:["Ն. ա. ե.","Ն. ա. ե. 8 ժ.","Ն. 3","Ն. 4"], correct:1 },
    { text:"«Ն. կ. ֆ.» — ի՞ ն ա.", options:["Ն. բ.","Ն. ֆ.","Ն. ե.","Ն. մ."], correct:1 },
    { text:"Ի՞ ն ա. «ու.»", options:["To drink","To eat","To sleep","To run"], correct:1 },
    { text:"«Ն. ա. ե. շ.» — ե՞ ն ա.", options:["Ե. ա.","Ն. ա.","Ե. 3","Ն. 4"], correct:0 },
  ],
  B1: [
    { text:"Ի՞ ն ա. «ն. ա. ե. ա.»", options:["Ն. կ.","Ն. ա.","Ն. 3","Ն. 4"], correct:1 },
    { text:"Ի՞ ն կ. «ն. ա. ե. ա. ու.»", options:["Ն. ա.","Ն. 2","Ն. 3","Ն. 4"], correct:2 },
    { text:"«30 ա. ա.» — ե՞ ն ա.", options:["Ե.","Ն.","30","4"], correct:2 },
    { text:"Ի՞ ն ա. «ու. լ.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:0 },
    { text:"Ի՞ ն կ. «ա.»", options:["Ա.","Ա. 2","Ա. 3","Ա. 4"], correct:3 },
  ],
  B2: [
    { text:"Ի՞ ն կ. «ու.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:1 },
    { text:"Ի՞ ն ա. «ա. ու.»", options:["Ա.","Ա. 2","Ա. 3","Ա. 4"], correct:0 },
    { text:"Ի՞ ն ա. «ու. լ.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:1 },
    { text:"Ի՞ ն կ. «ն. ա.»", options:["Ա.","Ա. 2","Ա. 3","Ա. 4"], correct:2 },
    { text:"Ի՞ ն ա. «ն. ա. ա.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:3 },
  ],
  C1: [
    { text:"Ի՞ ն ա. «ան. լ.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:1 },
    { text:"«Ա. լ.» = ?", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:2 },
    { text:"Ի՞ ն ա. «ա. դ.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:0 },
    { text:"Ի՞ ն կ. «ն. ա.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:3 },
    { text:"Ի՞ ն ա. «3 ա.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:0 },
  ],
  C2: [
    { text:"Ի՞ ն ա. «ϲ. ն.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:2 },
    { text:"Ի՞ ն կ. «ա. ϲ.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:1 },
    { text:"Ի՞ ն ա. «ան.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:3 },
    { text:"Ի՞ ն ա. «ն.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:0 },
    { text:"Ի՞ ն կ. «ϲ.»", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:2 },
  ],
};

// ── SPEAKING (voice) ──────────────────────────────────────────────────────────
const SPEAKING = {
  A1:[
    { text:"Ձ. 10-30 վ. «Ն. ք.»",           maxSeconds:30,  minSeconds:10, maxAttempts:3 },
    { text:"Ձ. 10-30 վ. «Ն. ք. ըն.»",        maxSeconds:30,  minSeconds:10, maxAttempts:3 },
    { text:"Ձ. 10-30 վ. «Ն. ք. ս.»",         maxSeconds:30,  minSeconds:10, maxAttempts:3 },
    { text:"Ձ. 10-30 վ. «Ն. ք. գ.»",         maxSeconds:30,  minSeconds:10, maxAttempts:3 },
    { text:"Ձ. 10-30 վ. «Ն. ք. բ.»",         maxSeconds:30,  minSeconds:10, maxAttempts:3 },
  ],
  A2:[
    { text:"Ձ. 15-45 վ. «Ն. ք. ա.»",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
    { text:"Ձ. 15-45 վ. «Ն. ք. հ.»",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
    { text:"Ձ. 15-45 վ. «Ն. ք. ե.»",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
    { text:"Ձ. 15-45 վ. «Ն. ք. օ.»",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
    { text:"Ձ. 15-45 վ. «Ն. ք. տ.»",         maxSeconds:45,  minSeconds:15, maxAttempts:3 },
  ],
  B1:[
    { text:"Ձ. 30-60 վ. «Ն. ս. տ.»",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
    { text:"Ձ. 30-60 վ. «Ն. ս. ժ.»",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
    { text:"Ձ. 30-60 վ. «Ն. ս. կ.»",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
    { text:"Ձ. 30-60 վ. «Ն. ս. ա.»",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
    { text:"Ձ. 30-60 վ. «Ն. ս. ե.»",         maxSeconds:60,  minSeconds:30, maxAttempts:2 },
  ],
  B2:[
    { text:"Ձ. 45-90 վ. «Ա. ե. ե.»",         maxSeconds:90,  minSeconds:45, maxAttempts:2 },
    { text:"Ձ. 45-90 վ. «Կ. ե.»",            maxSeconds:90,  minSeconds:45, maxAttempts:2 },
    { text:"Ձ. 45-90 վ. «Բ. ե.»",            maxSeconds:90,  minSeconds:45, maxAttempts:2 },
    { text:"Ձ. 45-90 վ. «Ղ. ե.»",            maxSeconds:90,  minSeconds:45, maxAttempts:2 },
    { text:"Ձ. 45-90 վ. «Ն. ե.»",            maxSeconds:90,  minSeconds:45, maxAttempts:2 },
  ],
  C1:[
    { text:"Ձ. 60-120 վ. «Ժ. հ. մ.»",        maxSeconds:120, minSeconds:60, maxAttempts:2 },
    { text:"Ձ. 60-120 վ. «Լ. դ. ա.»",        maxSeconds:120, minSeconds:60, maxAttempts:2 },
    { text:"Ձ. 60-120 վ. «Ա. ի. ե.»",        maxSeconds:120, minSeconds:60, maxAttempts:2 },
    { text:"Ձ. 60-120 վ. «Ա. ու. ի.»",       maxSeconds:120, minSeconds:60, maxAttempts:2 },
    { text:"Ձ. 60-120 վ. «Ե. ու. ի.»",       maxSeconds:120, minSeconds:60, maxAttempts:2 },
  ],
  C2:[
    { text:"Ձ. 90-180 վ. «Գ. դ. ա.»",        maxSeconds:180, minSeconds:90, maxAttempts:1 },
    { text:"Ձ. 90-180 վ. «Հ. ի. ն.»",        maxSeconds:180, minSeconds:90, maxAttempts:1 },
    { text:"Ձ. 90-180 վ. «Ա. ն. ի.»",        maxSeconds:180, minSeconds:90, maxAttempts:1 },
    { text:"Ձ. 90-180 վ. «Ք. ու. ի.»",       maxSeconds:180, minSeconds:90, maxAttempts:1 },
    { text:"Ձ. 90-180 վ. «Ե. ու. ղ.»",       maxSeconds:180, minSeconds:90, maxAttempts:1 },
  ],
};

// ── LISTENING / WATCHING (single_choice) ─────────────────────────────────────
const WATCHING = {
  A1:[
    { text:"Ն. ն. ու. — ի՞ ն կ.", options:["Ա.","Ն.","Բ.","Ը."], correct:0 },
    { text:"Ն. ն. ա. — ո՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:1 },
    { text:"Ն. ն. ս. — ի՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:2 },
    { text:"Ն. ն. ե. — ո՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:3 },
    { text:"Ն. ն. բ. — ի՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:0 },
  ],
  A2:[
    { text:"Ն. ն. հ. — ի՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:1 },
    { text:"Ն. ն. ժ. — ո՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:2 },
    { text:"Ն. ն. ո. — ի՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:3 },
    { text:"Ն. ն. ն. — ո՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:0 },
    { text:"Ն. ն. ե. — ի՞ ն ա.", options:["Ն.","Ն. 2","Ն. 3","Ն. 4"], correct:1 },
  ],
  B1:[
    { text:"Ն. ն. ա. բ. — ի՞ ն ա.", options:["Բ.","Ա.","Գ.","Դ."], correct:0 },
    { text:"Ն. ն. ա. — ո՞ ն ա.",    options:["Ա.","Բ.","Գ.","Դ."], correct:1 },
    { text:"Ն. ն. ե. — ի՞ ն ա.",    options:["Ա.","Բ.","Գ.","Դ."], correct:2 },
    { text:"Ն. ն. կ. — ո՞ ն ա.",    options:["Ա.","Բ.","Գ.","Դ."], correct:3 },
    { text:"Ն. ն. ն. — ի՞ ն ա.",    options:["Ա.","Բ.","Գ.","Դ."], correct:0 },
  ],
  B2:[
    { text:"Ն. ն. բ. — ի՞ ն ա.", options:["Բ.","Ա.","Կ.","Մ."], correct:0 },
    { text:"Ն. ն. տ. — ո՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:1 },
    { text:"Ն. ն. կ. — ի՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:2 },
    { text:"Ն. ն. մ. — ո՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:3 },
    { text:"Ն. ն. ա. — ի՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:0 },
  ],
  C1:[
    { text:"Ն. ն. ա. — ի՞ ն ա.", options:["Լ. պ.","Տ.","Կ.","Մ."], correct:0 },
    { text:"Ն. ն. հ. — ո՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:1 },
    { text:"Ն. ն. ե. — ի՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:2 },
    { text:"Ն. ն. կ. — ո՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:3 },
    { text:"Ն. ն. ն. — ի՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:0 },
  ],
  C2:[
    { text:"Ն. ն. ա. — ի՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:2 },
    { text:"Ն. ն. հ. — ո՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:1 },
    { text:"Ն. ն. ե. — ի՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:3 },
    { text:"Ն. ն. կ. — ո՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:0 },
    { text:"Ն. ն. ն. — ի՞ ն ա.", options:["Ա.","Բ.","Կ.","Մ."], correct:2 },
  ],
};

// ── FREE WRITING (writing) ────────────────────────────────────────────────────
const FREE_WRITING = {
  A1:[ { text:"Գ. 15-25 բ. «Ն. ք.»",         minWords:15, maxWords:30 },
       { text:"Գ. 15-25 բ. «Ի. ե.»",          minWords:15, maxWords:30 },
       { text:"Գ. 15-25 բ. «Ն. ք. ըն.»",      minWords:15, maxWords:30 },
       { text:"Գ. 15-25 բ. «Ն. ք. տ.»",       minWords:15, maxWords:30 },
       { text:"Գ. 15-25 բ. «Ն. ք. ս.»",       minWords:15, maxWords:30 } ],
  A2:[ { text:"Գ. 40-60 բ. «Ի. ե.»",          minWords:40, maxWords:70 },
       { text:"Գ. 40-60 բ. «Ն. ա. օ.»",       minWords:40, maxWords:70 },
       { text:"Գ. 40-60 բ. «Ն. ք. հ.»",       minWords:40, maxWords:70 },
       { text:"Գ. 40-60 բ. «Ն. ք. ե.»",       minWords:40, maxWords:70 },
       { text:"Գ. 40-60 բ. «Ի. ս. ե.»",       minWords:40, maxWords:70 } ],
  B1:[ { text:"Գ. 70-90 բ. «Ի. կ. ե.»",       minWords:70, maxWords:100 },
       { text:"Գ. 70-90 բ. «Ն. կ. ա.»",       minWords:70, maxWords:100 },
       { text:"Գ. 70-90 բ. «Ն. կ. ե.»",       minWords:70, maxWords:100 },
       { text:"Գ. 70-90 բ. «Ի. կ. ն.»",       minWords:70, maxWords:100 },
       { text:"Գ. 70-90 բ. «Ն. կ. բ.»",       minWords:70, maxWords:100 } ],
  B2:[ { text:"Գ. 80-100 բ. «Ի. կ. փ. ք.»",   minWords:80, maxWords:120 },
       { text:"Գ. 80-100 բ. «Ն. կ. ա. ե.»",   minWords:80, maxWords:120 },
       { text:"Գ. 80-100 բ. «Ի. կ. ն.»",      minWords:80, maxWords:120 },
       { text:"Գ. 80-100 բ. «Ի. կ. ա.»",      minWords:80, maxWords:120 },
       { text:"Գ. 80-100 բ. «Ա. ե. ի.»",      minWords:80, maxWords:120 } ],
  C1:[ { text:"Գ. 120-150 բ. «Ժ. հ. մ.»",     minWords:120, maxWords:180 },
       { text:"Գ. 120-150 բ. «Լ. դ. ա.»",     minWords:120, maxWords:180 },
       { text:"Գ. 120-150 բ. «Ա. ի. ե.»",     minWords:120, maxWords:180 },
       { text:"Գ. 120-150 բ. «Ա. ու. ի.»",    minWords:120, maxWords:180 },
       { text:"Գ. 120-150 բ. «Ե. ու. ի.»",    minWords:120, maxWords:180 } ],
  C2:[ { text:"Գ. 150-200 բ. «Գ. դ. ազ.»",    minWords:150, maxWords:220 },
       { text:"Գ. 150-200 բ. «Հ. լ. ա.»",     minWords:150, maxWords:220 },
       { text:"Գ. 150-200 բ. «Ա. ն. ի.»",     minWords:150, maxWords:220 },
       { text:"Գ. 150-200 բ. «Ք. ու. ի.»",    minWords:150, maxWords:220 },
       { text:"Գ. 150-200 բ. «Ե. ու. ղ.»",    minWords:150, maxWords:220 } ],
};

// ─── Assemble QUESTIONS array ─────────────────────────────────────────────────
const QUESTIONS = [];
const LEVELS = ["A1","A2","B1","B2","C1","C2"];

for (const lvl of LEVELS) {
  const pts = PTS[lvl];
  for (const q of READING[lvl])       QUESTIONS.push({ type:"single_choice", level:lvl, section:"Reading",            points:pts, ...q });
  for (const q of GRAMMAR[lvl])       QUESTIONS.push({ level:lvl, section:"Grammar",           points:pts, ...q });
  for (const q of VOCABULARY[lvl])    QUESTIONS.push({ level:lvl, section:"Vocabulary",         points:pts, ...q });
  for (const q of WRITING[lvl])       QUESTIONS.push({ level:lvl, section:"Writing",            points:pts, ...q });
  for (const q of LISTENING[lvl])     QUESTIONS.push({ type:"single_choice", level:lvl, section:"Listening",          points:pts, ...q });
  for (const q of SPEAKING[lvl])      QUESTIONS.push({ type:"voice",         level:lvl, section:"Speaking",           points:pts, ...q });
  for (const q of WATCHING[lvl])      QUESTIONS.push({ type:"single_choice", level:lvl, section:"Listening / Watching", points:pts, ...q });
  for (const q of FREE_WRITING[lvl])  QUESTIONS.push({ type:"writing",       level:lvl, section:"Free Writing",       points:pts, ...q });
}

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

  // Admins
  const adminSeeds = [
    { name:"Super Admin",    email:"admin@armexam.am",    password:"admin1234", role:"super_admin",   centerId:null },
    { name:"Center Admin",   email:"center@armexam.am",   password:"demo1234",  role:"center_admin",  centerId:centers[0].id },
    { name:"Moderator",      email:"moder@armexam.am",    password:"demo1234",  role:"moderator",     centerId:null },
    { name:"Examiner",       email:"examiner@armexam.am", password:"demo1234",  role:"examiner",      centerId:centers[0].id },
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
