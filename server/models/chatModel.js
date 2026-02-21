// server/models/chatModel.js
import { db } from "../db.js";

export async function getChatAgencies({ search = "", limit = 50 } = {}) {
  const params = [];
  let where = "";

  if (search && String(search).trim()) {
    where = `WHERE (name LIKE ? OR address LIKE ?)`;
    const s = `%${String(search).trim()}%`;
    params.push(s, s);
  }

  params.push(Number(limit) || 50);

  const [rows] = await db.query(
    `
    SELECT id, name, address
    FROM agencies
    ${where}
    ORDER BY name ASC
    LIMIT ?
    `,
    params
  );

  return rows;
}

export async function getMyConversations(userId) {
  const [rows] = await db.query(
    `
    SELECT
      c.id AS conversation_id,
      c.created_at AS conversation_created_at,

      a.id AS agency_id,
      a.name AS agency_name,
      a.address AS agency_address,

      /* Persist deleted-preview after refresh */
      CASE
        WHEN lm.is_deleted = 1 THEN 'This message was deleted'
        ELSE lm.message
      END AS last_message,

      lm.created_at AS last_message_at,
      lm.is_deleted AS last_message_deleted,

      (
        SELECT COUNT(*)
        FROM chat_messages m
        WHERE m.conversation_id = c.id
          AND m.sender_role = 'agency'
          AND m.read_at IS NULL
      ) AS unread_count

    FROM chat_conversations c
    JOIN agencies a ON a.id = c.agency_id

    LEFT JOIN chat_messages lm
      ON lm.id = (
        SELECT m2.id
        FROM chat_messages m2
        WHERE m2.conversation_id = c.id
        ORDER BY m2.created_at DESC
        LIMIT 1
      )

    WHERE c.tourist_id = ?
    ORDER BY COALESCE(lm.created_at, c.created_at) DESC
    `,
    [userId]
  );

  return rows;
}

export async function createOrGetConversation(touristId, agencyId) {
  await db.query(
    `
    INSERT IGNORE INTO chat_conversations (tourist_id, agency_id)
    VALUES (?, ?)
    `,
    [touristId, agencyId]
  );

  const [rows] = await db.query(
    `
    SELECT id, tourist_id, agency_id, created_at
    FROM chat_conversations
    WHERE tourist_id = ? AND agency_id = ?
    LIMIT 1
    `,
    [touristId, agencyId]
  );

  return rows[0] || null;
}

export async function getConversationById(conversationId) {
  const [rows] = await db.query(
    `
    SELECT 
      c.id, c.tourist_id, c.agency_id, c.created_at,
      a.name AS agency_name,
      a.address AS agency_address
    FROM chat_conversations c
    JOIN agencies a ON a.id = c.agency_id
    WHERE c.id = ?
    LIMIT 1
    `,
    [conversationId]
  );
  return rows[0] || null;
}

export async function getMessages(conversationId, { page = 1, limit = 20 }) {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await db.query(
    `
    SELECT id, conversation_id, sender_id, sender_role, message, created_at, read_at, is_deleted
    FROM chat_messages
    WHERE conversation_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
    `,
    [conversationId, limitNum, offset]
  );

  const [[{ total }]] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM chat_messages
    WHERE conversation_id = ?
    `,
    [conversationId]
  );

  const data = rows.slice().reverse();

  return {
    messages: data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: offset + rows.length < total,
    },
  };
}

export async function addMessage(conversationId, { senderId, senderRole, message }) {
  const [result] = await db.query(
    `
    INSERT INTO chat_messages (conversation_id, sender_id, sender_role, message)
    VALUES (?, ?, ?, ?)
    `,
    [conversationId, senderId, senderRole, message]
  );

  const [rows] = await db.query(
    `
    SELECT id, conversation_id, sender_id, sender_role, message, created_at, read_at, is_deleted
    FROM chat_messages
    WHERE id = ?
    LIMIT 1
    `,
    [result.insertId]
  );

  return rows[0] || null;
}

export async function markAgencyMessagesRead(conversationId) {
  await db.query(
    `
    UPDATE chat_messages
    SET read_at = NOW()
    WHERE conversation_id = ?
      AND sender_role = 'agency'
      AND read_at IS NULL
    `,
    [conversationId]
  );
}

export async function deleteMessageForAll(conversationId, messageId, userId, role) {
  const [rows] = await db.query(
    `
    SELECT id, sender_id, sender_role
    FROM chat_messages
    WHERE id = ? AND conversation_id = ?
    LIMIT 1
    `,
    [messageId, conversationId]
  );

  const msg = rows[0];
  if (!msg) return { ok: false, reason: "not_found" };

  if (Number(msg.sender_id) !== Number(userId) || String(msg.sender_role) !== String(role)) {
    return { ok: false, reason: "not_allowed" };
  }

  await db.query(
    `
    UPDATE chat_messages
    SET is_deleted = 1, message = ''
    WHERE id = ? AND conversation_id = ?
    `,
    [messageId, conversationId]
  );

  return { ok: true };
}

export async function deleteConversationForTourist({ conversationId, touristId, onlyIfEmpty }) {
  if (!conversationId || !touristId) return { ok: false, reason: "bad_request" };

  const [convos] = await db.query(
    `
    SELECT id, tourist_id
    FROM chat_conversations
    WHERE id = ?
    LIMIT 1
    `,
    [conversationId]
  );

  const convo = convos[0];
  if (!convo) return { ok: false, reason: "not_found" };
  if (Number(convo.tourist_id) !== Number(touristId)) return { ok: false, reason: "not_allowed" };

  const [[{ total }]] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM chat_messages
    WHERE conversation_id = ?
    `,
    [conversationId]
  );

  if (onlyIfEmpty && Number(total) > 0) return { ok: false, reason: "not_empty" };

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`DELETE FROM chat_messages WHERE conversation_id = ?`, [conversationId]);
    await conn.query(`DELETE FROM chat_conversations WHERE id = ?`, [conversationId]);

    await conn.commit();
    return { ok: true };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      // ignore
    }
    throw e;
  } finally {
    conn.release();
  }
}