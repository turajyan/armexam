// ── Date / Time formatting utility ────────────────────────────────────────────
// Reads format settings saved by AdminSettings → General tab.
// All pages should use these helpers instead of raw toLocaleDateString calls.

const SETTINGS_KEY = "armexam_general_settings";

export function getDateSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      dateFormat: s.dateFormat || "DD.MM.YYYY",
      timeFormat: s.timeFormat || "HH:mm",
      timezone:   s.timezone   || "Asia/Yerevan",
      language:   s.language   || "hy",
    };
  } catch {
    return { dateFormat: "DD.MM.YYYY", timeFormat: "HH:mm", timezone: "Asia/Yerevan", language: "hy" };
  }
}

function pad(n) { return String(n).padStart(2, "0"); }

export function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d)) return "—";
  const { dateFormat } = getDateSettings();
  const day   = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year  = d.getFullYear();
  switch (dateFormat) {
    case "MM/DD/YYYY": return `${month}/${day}/${year}`;
    case "YYYY-MM-DD": return `${year}-${month}-${day}`;
    default:           return `${day}.${month}.${year}`;
  }
}

export function formatTime(dateInput) {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d)) return "—";
  const { timeFormat } = getDateSettings();
  const hours24 = d.getHours();
  const mins    = pad(d.getMinutes());
  if (timeFormat === "hh:mm A") {
    const ampm = hours24 >= 12 ? "PM" : "AM";
    return `${pad(hours24 % 12 || 12)}:${mins} ${ampm}`;
  }
  if (timeFormat === "HH:mm:ss") {
    return `${pad(hours24)}:${mins}:${pad(d.getSeconds())}`;
  }
  return `${pad(hours24)}:${mins}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return "—";
  return `${formatDate(dateInput)}, ${formatTime(dateInput)}`;
}
