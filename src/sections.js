import { api } from "./api.js";

// Returns array of section name strings sorted by server-defined sortOrder
export async function getSections() {
  try {
    const sections = await api.getSections(); // already sorted by sortOrder asc
    return sections.map((s) => s.name);
  } catch {
    return ["READING", "LISTENING", "WRITING", "SPEAKING"]; // minimal fallback
  }
}

// Returns full section objects [{id, name, sortOrder, category}]
export async function getSectionObjects() {
  try {
    return await api.getSections();
  } catch {
    return [];
  }
}
