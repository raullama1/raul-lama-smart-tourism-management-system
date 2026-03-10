// server/models/userModel.js
import { db } from "../db.js";

export async function findUserByEmail(email) {
  const [rows] = await db.query(
    `SELECT id, name, email, password_hash, role, COALESCE(is_blocked, 0) AS is_blocked
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await db.query(
    `SELECT id, name, email, password_hash, role, COALESCE(is_blocked, 0) AS is_blocked
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ name, email, passwordHash, role = "tourist" }) {
  const [result] = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, role]
  );

  return {
    id: result.insertId,
    name,
    email,
    role,
    is_blocked: 0,
  };
}

export async function updateUserPasswordHash(userId, passwordHash) {
  await db.query(
    `UPDATE users
     SET password_hash = ?
     WHERE id = ?`,
    [passwordHash, userId]
  );
}