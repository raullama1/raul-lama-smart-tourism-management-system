// server/models/agencyEmailVerificationModel.js
import { db } from "../db.js";

export async function createAgencyEmailVerification(email, code, expiresAt) {
  await db.query(
    `UPDATE agency_email_verifications
     SET used = 1
     WHERE email = ?`,
    [email]
  );

  const [result] = await db.query(
    `INSERT INTO agency_email_verifications (email, code, expires_at)
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

export async function findValidAgencyEmailVerification(email, code) {
  const [rows] = await db.query(
    `SELECT *
     FROM agency_email_verifications
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

export async function markAgencyEmailVerificationUsed(id) {
  await db.query(
    `UPDATE agency_email_verifications
     SET used = 1
     WHERE id = ?`,
    [id]
  );
}
