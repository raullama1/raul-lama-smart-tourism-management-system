import { db } from "../db.js";

export async function findAgencyByEmail(email) {
  const [rows] = await db.query(
    `SELECT id, name, email, phone, address, password_hash
     FROM agencies
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function findAgencyById(id) {
  const [rows] = await db.query(
    `SELECT id, name, email, phone, address
     FROM agencies
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}
