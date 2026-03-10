// server/models/profileModel.js
import { db } from "../db.js";

function sanitizePhone(phone) {
  return String(phone || "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

export async function getMyProfile(userId) {
  const [rows] = await db.query(
    `
    SELECT id, name, email, phone, role, created_at, profile_image
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  );
  return rows[0] || null;
}

export async function updateMyProfile(userId, { name, phone }) {
  const safePhone =
    typeof phone === "undefined" || phone === null || String(phone).trim() === ""
      ? null
      : sanitizePhone(phone);

  await db.query(
    `
    UPDATE users
    SET name = ?, phone = ?
    WHERE id = ?
    `,
    [name, safePhone, userId]
  );
  return getMyProfile(userId);
}

export async function setProfileImage(userId, filename) {
  await db.query(
    `
    UPDATE users
    SET profile_image = ?
    WHERE id = ?
    `,
    [filename, userId]
  );
  return getMyProfile(userId);
}

export async function clearProfileImage(userId) {
  await db.query(
    `
    UPDATE users
    SET profile_image = NULL
    WHERE id = ?
    `,
    [userId]
  );
  return getMyProfile(userId);
}