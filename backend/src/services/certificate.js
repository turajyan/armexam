import PDFDocument from "pdfkit";

// Level colors (hex without #)
const LEVEL_HEX = {
  A1:"4ade80", A2:"86efac", B1:"60a5fa",
  B2:"93c5fd", C1:"f59e0b", C2:"fbbf24",
};

function hex(h) {
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  return [r,g,b];
}

/**
 * Generate a PDF certificate and pipe it into `stream`.
 *
 * @param {Object} opts
 * @param {import('stream').Writable} opts.stream  - writable destination
 * @param {string} opts.studentName
 * @param {string} opts.examTitle
 * @param {string|null} opts.level               - "B2" or null for fixed exams
 * @param {number} opts.pct                      - 0-100
 * @param {boolean} opts.passed
 * @param {string} opts.submittedAt              - ISO date string
 * @param {string} opts.centerName               - exam center name
 * @param {number} opts.resultId
 */
export function generateCertificate({ stream, studentName, examTitle, level,
  pct, passed, submittedAt, centerName, resultId }) {

  const doc = new PDFDocument({
    size: "A4", layout: "landscape",
    margin: 0,
    info: {
      Title:   `ArmExam Certificate — ${studentName}`,
      Author:  "ArmExam",
      Subject: examTitle,
    },
  });

  doc.pipe(stream);

  const W = doc.page.width;   // 841.89
  const H = doc.page.height;  // 595.28

  // ── Background ─────────────────────────────────────────────────────────────
  doc.rect(0, 0, W, H).fill("#0f1117");

  // Subtle corner decorations
  const cornerSize = 80;
  doc.save()
     .rect(0, 0, cornerSize, cornerSize).fill("#1a1d27")
     .rect(W-cornerSize, 0, cornerSize, cornerSize).fill("#1a1d27")
     .rect(0, H-cornerSize, cornerSize, cornerSize).fill("#1a1d27")
     .rect(W-cornerSize, H-cornerSize, cornerSize, cornerSize).fill("#1a1d27")
     .restore();

  // Border
  doc.roundedRect(24, 24, W-48, H-48, 16)
     .lineWidth(1.5)
     .stroke("#2a2d3a");

  // Gold inner border line
  doc.roundedRect(30, 30, W-60, H-60, 12)
     .lineWidth(.5)
     .stroke("#e8d5a322");

  // ── Header ─────────────────────────────────────────────────────────────────
  // Logo "Հ"
  doc.font("Helvetica-Bold")
     .fontSize(42)
     .fillColor("#e8d5a3")
     .text("Հ", W/2 - 100, 52, { width: 200, align: "center" });

  // "ArmExam" wordmark
  doc.font("Helvetica-Bold")
     .fontSize(14)
     .fillColor("#e8d5a3")
     .text("ArmExam", W/2 - 100, 96, { width: 200, align: "center" });

  doc.font("Helvetica")
     .fontSize(7.5)
     .fillColor("#3a3f52")
     .text("ARMENIAN LANGUAGE TESTING PLATFORM", W/2 - 140, 112, { width: 280, align: "center" });

  // Divider
  doc.moveTo(W/2 - 120, 130).lineTo(W/2 + 120, 130).lineWidth(.5).stroke("#2a2d3a");

  // ── Title ──────────────────────────────────────────────────────────────────
  doc.font("Helvetica")
     .fontSize(10)
     .fillColor("#5a5f7a")
     .text("CERTIFICATE OF ACHIEVEMENT", W/2 - 200, 142, { width: 400, align: "center" });

  // ── Student name ───────────────────────────────────────────────────────────
  doc.font("Helvetica-Bold")
     .fontSize(32)
     .fillColor("#e8d5a3")
     .text(studentName, 60, 172, { width: W-120, align: "center" });

  // Subtitle line
  doc.font("Helvetica")
     .fontSize(11)
     .fillColor("#8891aa")
     .text(`has successfully completed the examination`, 60, 212, { width: W-120, align: "center" });

  doc.font("Helvetica-Bold")
     .fontSize(13)
     .fillColor("#c8cfe8")
     .text(examTitle, 60, 230, { width: W-120, align: "center" });

  // ── Level badge (placement) or Score badge (fixed) ─────────────────────────
  const badgeY = 272;

  if (level) {
    const lhex   = LEVEL_HEX[level] ?? "94a3b8";
    const [lr,lg,lb] = hex(lhex);
    const badgeW = 140, badgeH = 56, badgeX = W/2 - badgeW/2;

    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10)
       .fillOpacity(.12).fill(`rgb(${lr},${lg},${lb})`).fillOpacity(1);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10)
       .lineWidth(1.5).stroke(`rgb(${lr},${lg},${lb})`);

    doc.font("Helvetica-Bold")
       .fontSize(28)
       .fillColor(`rgb(${lr},${lg},${lb})`)
       .text(level, badgeX, badgeY + 12, { width: badgeW, align: "center" });

    doc.font("Helvetica")
       .fontSize(8.5)
       .fillColor("#5a5f7a")
       .text("CEFR Level", badgeX, badgeY + badgeH + 6, { width: badgeW, align: "center" });
  } else {
    // Fixed exam — show pct
    const scoreColor = passed ? "#4ade80" : "#f87171";
    doc.font("Helvetica-Bold")
       .fontSize(36)
       .fillColor(scoreColor)
       .text(`${pct}%`, W/2 - 60, badgeY, { width: 120, align: "center" });
    doc.font("Helvetica")
       .fontSize(10)
       .fillColor(scoreColor)
       .text(passed ? "✓  PASSED" : "✕  NOT PASSED", W/2 - 80, badgeY + 40, { width: 160, align: "center" });
  }

  // ── Footer meta ────────────────────────────────────────────────────────────
  const metaY = H - 90;

  doc.moveTo(60, metaY).lineTo(W-60, metaY).lineWidth(.5).stroke("#2a2d3a");

  const dateFmt = new Date(submittedAt).toLocaleDateString("en-GB",
    { day:"2-digit", month:"long", year:"numeric" });

  const cols = [
    { label:"Date",        value: dateFmt },
    { label:"Center",      value: centerName || "ArmExam" },
    { label:"Certificate", value: `#${String(resultId).padStart(6,"0")}` },
  ];

  const colW = (W - 120) / cols.length;
  cols.forEach(({ label, value }, i) => {
    const x = 60 + i * colW;
    doc.font("Helvetica").fontSize(8).fillColor("#3a3f52")
       .text(label.toUpperCase(), x, metaY + 12, { width: colW, align: "center" });
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#8891aa")
       .text(value, x, metaY + 24, { width: colW, align: "center" });
  });

  // ── Verify URL ─────────────────────────────────────────────────────────────
  const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:5173";
  doc.font("Helvetica").fontSize(7.5).fillColor("#2a2d3a")
     .text(`Verify: ${BASE_URL}/verify/${resultId}`,
           W/2 - 160, H - 32, { width: 320, align: "center" });

  doc.end();
}
