const DEFAULT_SECTIONS = ["Reading","Writing","Listening","Grammar","Vocabulary","Watching","Free Writing"];
const KEY = "armexam_sections";

export function getSections() {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SECTIONS;
  } catch { return DEFAULT_SECTIONS; }
}

export function saveSections(sections) {
  try { localStorage.setItem(KEY, JSON.stringify(sections)); } catch {}
}
