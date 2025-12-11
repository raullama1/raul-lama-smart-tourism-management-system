// server/models/userModel.js
import { db } from "../db.js";

// Find user by email
export async function findUserByEmail(email) {
  const [rows] = await db.query(
    `SELECT id, name, email, password_hash, role
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

// Find user by id (for reset password)
export async function findUserById(id) {
  const [rows] = await db.query(
    `SELECT id, name, email, password_hash, role
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Create new user
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
  };
}

// Update user password hash (for reset password)
export async function updateUserPasswordHash(userId, passwordHash) {
  await db.query(
    `UPDATE users
     SET password_hash = ?
     WHERE id = ?`,
    [passwordHash, userId]
  );
}