/**
 * Read exam content typography SIZE settings from localStorage.
 * Colors always come from the active theme (T.text) — not stored here.
 */
export function getExamTypography() {
  try {
    const s = JSON.parse(localStorage.getItem("armexam_appearance") || "{}");
    return {
      contextFontSize: +(s.contextFontSize ?? 17),
      promptFontSize:  +(s.promptFontSize  ?? 20),
      answerFontSize:  +(s.answerFontSize  ?? 15),
    };
  } catch {
    return { contextFontSize: 17, promptFontSize: 20, answerFontSize: 15 };
  }
}
