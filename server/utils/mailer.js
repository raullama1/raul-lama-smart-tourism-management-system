// server/utils/mailer.js
import axios from "axios";

const { RESEND_API_KEY, SMTP_FROM } = process.env;

const fromEmail = SMTP_FROM || "Tourism Nepal <onboarding@resend.dev>";

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log("📧 [NO RESEND_API_KEY] Email not sent.");
    console.log("To:", to);
    console.log("Subject:", subject);
    return;
  }

  try {
    const res = await axios.post(
      "https://api.resend.com/emails",
      {
        from: fromEmail,
        to: [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log("📧 Email sent:", res.data?.id || "success");
    return res.data;
  } catch (err) {
    console.error("📧 Resend email error:", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });

    throw err;
  }
}

// ---------- Password reset email ----------
export async function sendPasswordResetEmail(to, resetLink) {
  await sendEmail({
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
  await sendEmail({
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