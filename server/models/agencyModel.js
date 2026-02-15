// server/models/agencyModel.js
import { db } from "../db.js";

export async function findAgencyByEmail(email) {
  const [rows] = await db.query(
    `SELECT id, name, email, phone, address, pan_vat, password_hash
     FROM agencies
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function findAgencyByPhone(phone) {
  const [rows] = await db.query(
    `SELECT id, name, email, phone, address, pan_vat
     FROM agencies
     WHERE phone = ?
     LIMIT 1`,
    [phone]
  );
  return rows[0] || null;
}

export async function findAgencyByPanVat(panVat) {
  const [rows] = await db.query(
    `SELECT id, name, email, phone, address, pan_vat
     FROM agencies
     WHERE pan_vat = ?
     LIMIT 1`,
    [panVat]
  );
  return rows[0] || null;
}

export async function findAgencyByName(name) {
  const [rows] = await db.query(
    `SELECT id, name, email, phone, address, pan_vat
     FROM agencies
     WHERE name = ?
     LIMIT 1`,
    [name]
  );
  return rows[0] || null;
}

export async function findAgencyById(id) {
  const [rows] = await db.query(
    `SELECT id, name, email, phone, address, pan_vat
     FROM agencies
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function createAgency({
  name,
  email,
  phone,
  address,
  pan_vat,
  passwordHash,
}) {
  const [result] = await db.query(
    `INSERT INTO agencies (name, email, phone, address, pan_vat, password_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, phone, address, pan_vat, passwordHash]
  );

  return {
    id: result.insertId,
    name,
    email,
    phone,
    address,
    pan_vat,
  };
}

export async function checkAgencyUniqueness({ name, email, phone, pan_vat }) {
  const taken = {
    name: false,
    email: false,
    phone: false,
    pan_vat: false,
  };

  if (email) {
    const [rows] = await db.query(`SELECT id FROM agencies WHERE email = ? LIMIT 1`, [email]);
    taken.email = rows.length > 0;
  }

  if (phone) {
    const [rows] = await db.query(`SELECT id FROM agencies WHERE phone = ? LIMIT 1`, [phone]);
    taken.phone = rows.length > 0;
  }

  if (pan_vat) {
    const [rows] = await db.query(`SELECT id FROM agencies WHERE pan_vat = ? LIMIT 1`, [pan_vat]);
    taken.pan_vat = rows.length > 0;
  }

  if (name) {
    const [rows] = await db.query(`SELECT id FROM agencies WHERE name = ? LIMIT 1`, [name]);
    taken.name = rows.length > 0;
  }

  return taken;
}
