/**
 * Read exam content typography settings from localStorage.
 * Falls back to sensible defaults if not set.
 * Used by StudentPreview and ExamScreen (terminal reads its own copy).
 */
export function getExamTypography() {
  try {
    const s = JSON.parse(localStorage.getItem("armexam_appearance") || "{}");
    return {
      contextFontSize: +(s.contextFontSize ?? 17),
      contextColor:     s.contextColor    ?? "#e2e8f0",
      promptFontSize:  +(s.promptFontSize  ?? 20),
      promptColor:      s.promptColor     ?? "#e2e8f0",
      answerFontSize:  +(s.answerFontSize  ?? 15),
      answerColor:      s.answerColor     ?? "#e2e8f0",
    };
  } catch {
    return {
      contextFontSize: 17, contextColor: "#e2e8f0",
      promptFontSize:  20, promptColor:  "#e2e8f0",
      answerFontSize:  15, answerColor:  "#e2e8f0",
    };
  }
}
