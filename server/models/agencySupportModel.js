// server/models/agencySupportModel.js
import { db } from "../db.js";

export async function createAgencySupportTicket({ fullName, email, subject, message }) {
  const [result] = await db.query(
    `INSERT INTO agency_support_tickets (full_name, email, subject, message)
     VALUES (?, ?, ?, ?)`,
    [fullName, email, subject, message]
  );

  return {
    id: result.insertId,
    full_name: fullName,
    email,
    subject,
    message,
    status: "open",
  };
}
