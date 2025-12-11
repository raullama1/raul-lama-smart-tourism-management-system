// server/models/emailVerificationModel.js
import { db } from "../db.js";

// Mark old codes as used, then insert a new one
export async function createEmailVerification(email, code, expiresAt) {
  await db.query(
    `UPDATE email_verifications
     SET used = 1
     WHERE email = ?`,
    [email]
  );

  const [result] = await db.query(
    `INSERT INTO email_verifications (email, code, expires_at)
     VALUES (?, ?, ?)`,
    [email, code, expiresAt]
  );

  return {
    id: result.insertId,
    email,
    code,
    expires_at: expiresAt,
  };
}

// Find a valid (not used, not expired) code
export async function findValidEmailVerification(email, code) {
  const [rows] = await db.query(
    `SELECT *
     FROM email_verifications
     WHERE email = ?
       AND code = ?
       AND used = 0
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code]
  );
  return rows[0] || null;
}

// Mark the specific record as used
export async function markVerificationUsed(id) {
  await db.query(
    `UPDATE email_verifications
     SET used = 1
     WHERE id = ?`,
    [id]
  );
}
