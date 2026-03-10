import { api } from "./api.js";

const DEFAULT_SECTIONS = ["Reading","Writing","Listening","Grammar","Vocabulary","Watching","Free Writing"];

// Returns array of section name strings, falling back to defaults on error
export async function getSections() {
  try {
    const sections = await api.getSections();
    return sections.map((s) => s.name);
  } catch {
    return DEFAULT_SECTIONS;
  }
}
