import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────────────────
// Transport
// Configure via .env:
//   SMTP_HOST  SMTP_PORT  SMTP_USER  SMTP_PASS  SMTP_SECURE
//   EMAIL_FROM   e.g. "ArmExam <noreply@armexam.am>"
//   APP_BASE_URL e.g. "https://armexam.am"
//
// Without SMTP_HOST → falls back to Ethereal (test preview) for development.
// ─────────────────────────────────────────────────────────────────────────────
let _transport;

async function transport() {
  if (_transport) return _transport;

  if (process.env.SMTP_HOST) {
    _transport = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const acct = await nodemailer.createTestAccount();
    _transport = nodemailer.createTransport({
      host: "smtp.ethereal.email", port: 587, secure: false,
      auth: { user: acct.user, pass: acct.pass },
    });
    console.log("[mailer] Ethereal test account:", acct.user);
  }
  return _transport;
}

const FROM     = () => process.env.EMAIL_FROM ?? "ArmExam <noreply@armexam.am>";
const BASE_URL = () => process.env.APP_BASE_URL ?? "http://localhost:5173";

// ─────────────────────────────────────────────────────────────────────────────
// Base HTML template
// ─────────────────────────────────────────────────────────────────────────────
function html({ preheader, body }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Helvetica Neue',Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0"
    style="background:#1a1d27;border-radius:20px;border:1px solid #2a2d3a;overflow:hidden;max-width:560px;width:100%;">

    <!-- Logo -->
    <tr><td style="padding:26px 36px;border-bottom:1px solid #2a2d3a;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:24px;color:#e8d5a3;font-weight:700;letter-spacing:2px;">
        Հ&nbsp;&nbsp;ArmExam
      </div>
      <div style="font-size:10px;color:#3a3f52;letter-spacing:3px;text-transform:uppercase;margin-top:3px;">
        Armenian Language Testing
      </div>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:32px 36px;">${body}</td></tr>

    <!-- Footer -->
    <tr><td style="padding:18px 36px 26px;border-top:1px solid #2a2d3a;text-align:center;">
      <div style="font-size:11px;color:#3a3f52;line-height:1.7;">
        © ${new Date().getFullYear()} ArmExam &middot; Armenian Language Testing Platform<br/>
        <a href="${BASE_URL()}" style="color:#5a5f7a;text-decoration:none;">${BASE_URL()}</a>
      </div>
    </td></tr>
  </table>
  </td></tr>
</table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Level badge
// ─────────────────────────────────────────────────────────────────────────────
function levelBadge(level) {
  const c = { A1:"#4ade80",A2:"#86efac",B1:"#60a5fa",B2:"#93c5fd",C1:"#f59e0b",C2:"#fbbf24" }[level] ?? "#94a3b8";
  return `<span style="display:inline-block;background:${c}22;color:${c};
    border:2px solid ${c}66;border-radius:10px;padding:7px 22px;
    font-size:32px;font-weight:800;letter-spacing:3px;font-family:Georgia,serif;">${level}</span>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA button
// ─────────────────────────────────────────────────────────────────────────────
function ctaBtn(text, href) {
  return `<div style="text-align:center;margin:24px 0 8px;">
    <a href="${href}" style="display:inline-block;
      background:linear-gradient(135deg,#e8d5a3,#c8a96e);
      color:#1a1d27;font-weight:700;font-size:15px;text-decoration:none;
      border-radius:12px;padding:14px 38px;letter-spacing:.4px;">${text} &rarr;</a>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// send() helper
// ─────────────────────────────────────────────────────────────────────────────
async function send({ to, subject, preheader, body }) {
  const t    = await transport();
  const info = await t.sendMail({ from: FROM(), to, subject,
    html: html({ preheader, body }) });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log("[mailer] Preview:", preview);
  return info;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sendResultsReady — called after examiner clicks "Publish results".
 * @param {{ student, exam, result }}
 */
export async function sendResultsReady({ student, exam, result }) {
  const level    = result.detectedLevel ?? exam.level ?? null;
  const passed   = result.passed === true;
  const pct      = result.pct ?? 0;
  const preheader = level
    ? `Ваш итоговый уровень: ${level}`
    : passed ? "Поздравляем! Вы сдали экзамен" : "Результаты вашего экзамена готовы";

  const scoreBlock = level
    ? `<div style="background:#0f1117;border-radius:14px;padding:24px;text-align:center;
         border:1px solid #2a2d3a;margin-bottom:28px;">
         <div style="font-size:11px;color:#5a5f7a;letter-spacing:2px;
           text-transform:uppercase;margin-bottom:14px;">Ваш уровень</div>
         ${levelBadge(level)}
         <p style="color:#5a5f7a;font-size:12px;margin:16px 0 0;line-height:1.6;">
           Детальная разбивка по навыкам, комментарии<br/>
           экзаменатора и сертификат — в личном кабинете.
         </p>
       </div>`
    : `<div style="background:#0f1117;border-radius:14px;padding:24px;text-align:center;
         border:1px solid #2a2d3a;margin-bottom:28px;">
         <div style="font-size:42px;font-weight:900;
           color:${passed?"#4ade80":"#f87171"};">${pct}%</div>
         <div style="font-size:14px;color:${passed?"#4ade80":"#f87171"};margin-top:6px;">
           ${passed?"✓ Зачтено":"✕ Не зачтено"}</div>
         <p style="color:#5a5f7a;font-size:12px;margin:14px 0 0;line-height:1.6;">
           Полный отчёт и сертификат — в личном кабинете.
         </p>
       </div>`;

  const body = `
    <h2 style="color:#e8d5a3;font-family:Georgia,serif;font-size:22px;margin:0 0 10px;">
      Результаты готовы
    </h2>
    <p style="color:#8891aa;font-size:14px;margin:0 0 26px;line-height:1.7;">
      Здравствуйте, <strong style="color:#c8cfe8;">${student.name}</strong>!<br/>
      Экзамен <strong style="color:#c8cfe8;">${exam.title}</strong> проверен.
    </p>
    ${scoreBlock}
    ${ctaBtn("Посмотреть результаты", `${BASE_URL()}/dashboard`)}
    <p style="color:#2a2d3a;font-size:11px;text-align:center;margin-top:16px;">
      Если вы не ожидали это письмо, просто проигнорируйте его.
    </p>`;

  return send({
    to:       student.email,
    subject:  `${exam.title} — результаты готовы`,
    preheader, body,
  });
}

/**
 * sendRegistrationConfirm — called when student is assigned to an exam.
 * @param {{ student, exam, pin }}
 */
export async function sendRegistrationConfirm({ student, exam, pin }) {
  const body = `
    <h2 style="color:#e8d5a3;font-family:Georgia,serif;font-size:22px;margin:0 0 10px;">
      Вы зарегистрированы
    </h2>
    <p style="color:#8891aa;font-size:14px;margin:0 0 26px;line-height:1.7;">
      Здравствуйте, <strong style="color:#c8cfe8;">${student.name}</strong>!<br/>
      Вы успешно зарегистрированы на экзамен
      <strong style="color:#c8cfe8;">${exam.title}</strong>.
    </p>

    <div style="background:#0f1117;border-radius:14px;padding:24px;text-align:center;
      border:1px solid #2a2d3a;margin-bottom:24px;">
      <div style="font-size:11px;color:#5a5f7a;letter-spacing:2.5px;
        text-transform:uppercase;margin-bottom:12px;">Ваш PIN-код</div>
      <div style="font-size:40px;font-weight:900;color:#e8d5a3;letter-spacing:10px;
        font-family:'Courier New',monospace;">${pin}</div>
      <p style="color:#5a5f7a;font-size:12px;margin:14px 0 0;line-height:1.6;">
        Введите этот код на терминале в экзаменационном центре.<br/>
        Не передавайте его третьим лицам.
      </p>
    </div>

    ${exam.startDate ? `
    <div style="background:#1e2235;border-radius:10px;padding:14px 18px;
      border:1px solid #2a2d3a;margin-bottom:20px;">
      <div style="font-size:11px;color:#5a5f7a;margin-bottom:4px;">Дата и место</div>
      <div style="color:#c8cfe8;font-size:14px;">
        ${new Date(exam.startDate).toLocaleDateString("ru-RU",
          { day:"numeric", month:"long", year:"numeric" })}
        ${exam.examCenter?.name ? ` &middot; ${exam.examCenter.name}` : ""}
      </div>
    </div>` : ""}

    ${ctaBtn("Личный кабинет", `${BASE_URL()}/dashboard`)}`;

  return send({
    to:       student.email,
    subject:  `Регистрация: ${exam.title} — PIN: ${pin}`,
    preheader: `Ваш PIN для экзамена: ${pin}`,
    body,
  });
}
