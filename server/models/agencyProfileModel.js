// server/models/agencyProfileModel.js
import { db } from "../db.js";

export async function getAgencyProfileById(agencyId) {
  const [rows] = await db.query(
    `
    SELECT id, name, email, phone, address, pan_vat, profile_image, created_at
    FROM agencies
    WHERE id = ?
    LIMIT 1
    `,
    [agencyId]
  );

  return rows[0] || null;
}

export async function findAgencyByName(name, excludeId) {
  const [rows] = await db.query(
    `
    SELECT id
    FROM agencies
    WHERE name = ? AND id <> ?
    LIMIT 1
    `,
    [name, excludeId]
  );

  return rows[0] || null;
}

export async function findAgencyByPhone(phone, excludeId) {
  const [rows] = await db.query(
    `
    SELECT id
    FROM agencies
    WHERE phone = ? AND id <> ?
    LIMIT 1
    `,
    [phone, excludeId]
  );

  return rows[0] || null;
}

export async function findAgencyByPanVat(panVat, excludeId) {
  const [rows] = await db.query(
    `
    SELECT id
    FROM agencies
    WHERE pan_vat = ? AND id <> ?
    LIMIT 1
    `,
    [panVat, excludeId]
  );

  return rows[0] || null;
}

export async function updateAgencyProfileById(
  agencyId,
  { name, phone, address, pan_vat }
) {
  await db.query(
    `
    UPDATE agencies
    SET name = ?, phone = ?, address = ?, pan_vat = ?
    WHERE id = ?
    `,
    [name, phone, address, pan_vat, agencyId]
  );

  return getAgencyProfileById(agencyId);
}

export async function setAgencyProfileImage(agencyId, profileImage) {
  await db.query(
    `
    UPDATE agencies
    SET profile_image = ?
    WHERE id = ?
    `,
    [profileImage, agencyId]
  );

  return getAgencyProfileById(agencyId);
}

export async function clearAgencyProfileImage(agencyId) {
  await db.query(
    `
    UPDATE agencies
    SET profile_image = NULL
    WHERE id = ?
    `,
    [agencyId]
  );

  return getAgencyProfileById(agencyId);
}

export async function getAgencyPasswordHashById(agencyId) {
  const [rows] = await db.query(
    `
    SELECT password_hash
    FROM agencies
    WHERE id = ?
    LIMIT 1
    `,
    [agencyId]
  );

  return rows[0]?.password_hash || null;
}

export async function updateAgencyPasswordHashById(agencyId, passwordHash) {
  await db.query(
    `
    UPDATE agencies
    SET password_hash = ?
    WHERE id = ?
    `,
    [passwordHash, agencyId]
  );
}