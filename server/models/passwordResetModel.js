// server/models/passwordResetTokenModel.js
import { db } from "../db.js";

// Create a new reset token (one-time use)
export async function createPasswordResetToken(userId, token, expiresAt) {
  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES (?, ?, ?)`,
    [userId, token, expiresAt]
  );
}

// Find a valid token (not used, not expired)
export async function findValidPasswordResetToken(token) {
  const [rows] = await db.query(
    `SELECT id, user_id, token, expires_at, used_at
     FROM password_reset_tokens
     WHERE token = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

// Mark token as used (after successful reset)
export async function markResetTokenUsed(id) {
  await db.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = ?`,
    [id]
  );
}
