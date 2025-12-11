// server/utils/mailer.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  FRONTEND_URL,
} = process.env;

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn("⚠️ No SMTP credentials found. Emails will not be sent.");
}

// ---------- Password reset email ----------
export async function sendPasswordResetEmail(to, resetLink) {
  if (!transporter) {
    console.log("📧 [NO SMTP] Cannot send reset email. Link:");
    console.log(resetLink);
    return;
  }

  const from = SMTP_FROM || SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Tourism Nepal - Reset your password",
    html: `
      <p>Hello,</p>
      <p>You requested a password reset for your Tourism Nepal account.</p>
      <p>
        Click the link below to reset your password (valid for 5 minutes):
      </p>
      <p>
        <a href="${resetLink}" target="_blank">
          Reset Password
        </a>
      </p>
      <br/>
      <p>If you did not request this, you can safely ignore this message.</p>
      <p>– Tourism Nepal Team</p>
    `,
  });

  console.log("📧 Reset email sent to:", to);
}

// ---------- Signup verification code email ----------
export async function sendSignupVerificationEmail(to, code) {
  if (!transporter) {
    console.log("📧 [NO SMTP] Cannot send signup code. Code:");
    console.log(code);
    return;
  }

  const from = SMTP_FROM || SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Tourism Nepal - Verify your email",
    html: `
      <p>Hello,</p>
      <p>Use the following verification code to complete your signup in Tourism Nepal:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">
        ${code}
      </p>
      <p>This code is valid for <strong>60 seconds</strong>.</p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>– Tourism Nepal Team</p>
    `,
  });

  console.log("📧 Signup verification code sent to:", to);
}
