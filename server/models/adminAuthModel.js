// server/models/adminAuthModel.js
import { db } from "../db.js";

export async function findAdminByIdentifier(identifier) {
  const value = String(identifier || "").trim();

  const [rows] = await db.query(
    `
      SELECT id, name, email, password_hash, role, profile_image, created_at
      FROM users
      WHERE role = 'admin'
        AND (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?))
      LIMIT 1
    `,
    [value, value]
  );

  return rows[0] || null;
}

export async function findAdminById(id) {
  const [rows] = await db.query(
    `
      SELECT id, name, email, role, profile_image, created_at
      FROM users
      WHERE id = ? AND role = 'admin'
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

export async function findAnyAdmin() {
  const [rows] = await db.query(
    `
      SELECT id, name, email, password_hash, role, profile_image, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY id ASC
      LIMIT 1
    `
  );

  return rows[0] || null;
}

export async function updateAdminPasswordById(id, passwordHash) {
  const [result] = await db.query(
    `
      UPDATE users
      SET password_hash = ?
      WHERE id = ? AND role = 'admin'
      LIMIT 1
    `,
    [passwordHash, id]
  );

  return result;
}