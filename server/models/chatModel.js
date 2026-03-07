// server/models/chatModel.js
import { db } from "../db.js";

/* Tourist-side: agencies list */
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
    SELECT id, name, address, profile_image
    FROM agencies
    ${where}
    ORDER BY name ASC
    LIMIT ?
    `,
    params
  );

  return rows;
}

/* Agency-side: tourists list */
export async function getChatTourists({ search = "", limit = 50 } = {}) {
  const params = [];
  let where = "";

  if (search && String(search).trim()) {
    where = `WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
    const s = `%${String(search).trim()}%`;
    params.push(s, s, s);
  }

  params.push(Number(limit) || 50);

  const [rows] = await db.query(
    `
    SELECT id, name, email, phone, profile_image
    FROM users
    ${where}
    ORDER BY name ASC
    LIMIT ?
    `,
    params
  );

  return rows;
}

/* Tourist: conversations list */
export async function getMyConversations(userId) {
  const [rows] = await db.query(
    `
    SELECT
      c.id AS conversation_id,
      c.created_at AS conversation_created_at,

      a.id AS agency_id,
      a.name AS agency_name,
      a.address AS agency_address,
      a.profile_image AS agency_profile_image,

      CASE
        WHEN lm.is_deleted = 1 THEN 'This message was deleted'
        ELSE lm.message
      END AS last_message,

      lm.created_at AS last_message_at,
      lm.is_deleted AS last_message_deleted,
      lm.sender_role AS last_message_sender_role,

      (
        SELECT COUNT(*)
        FROM chat_messages m
        WHERE m.conversation_id = c.id
          AND m.sender_role = 'agency'
          AND m.read_at IS NULL
          AND m.id > COALESCE(c.tourist_cleared_after_message_id, 0)
      ) AS unread_count

    FROM chat_conversations c
    JOIN agencies a ON a.id = c.agency_id

    LEFT JOIN chat_messages lm
      ON lm.id = (
        SELECT m2.id
        FROM chat_messages m2
        WHERE m2.conversation_id = c.id
          AND m2.id > COALESCE(c.tourist_cleared_after_message_id, 0)
        ORDER BY m2.created_at DESC, m2.id DESC
        LIMIT 1
      )

    WHERE c.tourist_id = ?
      AND COALESCE(c.deleted_for_tourist, 0) = 0
    ORDER BY COALESCE(lm.created_at, c.created_at) DESC, c.id DESC
    `,
    [userId]
  );

  return rows;
}

/* Agency: conversations list */
export async function getAgencyConversations(agencyId) {
  const [rows] = await db.query(
    `
    SELECT
      c.id AS conversation_id,
      c.created_at AS conversation_created_at,

      u.id AS tourist_id,
      u.name AS tourist_name,
      u.email AS tourist_email,
      u.phone AS tourist_phone,
      u.profile_image AS tourist_profile_image,

      CASE
        WHEN lm.is_deleted = 1 THEN 'This message was deleted'
        ELSE lm.message
      END AS last_message,

      lm.created_at AS last_message_at,
      lm.is_deleted AS last_message_deleted,
      lm.sender_role AS last_message_sender_role,

      (
        SELECT COUNT(*)
        FROM chat_messages m
        WHERE m.conversation_id = c.id
          AND m.sender_role = 'tourist'
          AND m.read_at IS NULL
          AND m.id > COALESCE(c.agency_cleared_after_message_id, 0)
      ) AS unread_count

    FROM chat_conversations c
    JOIN users u ON u.id = c.tourist_id

    LEFT JOIN chat_messages lm
      ON lm.id = (
        SELECT m2.id
        FROM chat_messages m2
        WHERE m2.conversation_id = c.id
          AND m2.id > COALESCE(c.agency_cleared_after_message_id, 0)
        ORDER BY m2.created_at DESC, m2.id DESC
        LIMIT 1
      )

    WHERE c.agency_id = ?
      AND COALESCE(c.deleted_for_agency, 0) = 0
    ORDER BY COALESCE(lm.created_at, c.created_at) DESC, c.id DESC
    `,
    [agencyId]
  );

  return rows;
}

/* Shared: create or get */
export async function createOrGetConversation(
  touristId,
  agencyId,
  { restoreForRole = "" } = {}
) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `
      INSERT IGNORE INTO chat_conversations (tourist_id, agency_id)
      VALUES (?, ?)
      `,
      [touristId, agencyId]
    );

    const [existingRows] = await conn.query(
      `
      SELECT
        id,
        tourist_id,
        agency_id,
        created_at,
        deleted_for_tourist,
        deleted_for_agency,
        tourist_cleared_after_message_id,
        agency_cleared_after_message_id
      FROM chat_conversations
      WHERE tourist_id = ? AND agency_id = ?
      LIMIT 1
      `,
      [touristId, agencyId]
    );

    const convo = existingRows[0];
    if (!convo) {
      await conn.commit();
      return null;
    }

    const [[{ maxId }]] = await conn.query(
      `
      SELECT COALESCE(MAX(id), 0) AS maxId
      FROM chat_messages
      WHERE conversation_id = ?
      `,
      [convo.id]
    );

    if (restoreForRole === "tourist") {
      await conn.query(
        `
        UPDATE chat_conversations
        SET deleted_for_tourist = 0,
            tourist_cleared_after_message_id = ?
        WHERE id = ?
        `,
        [Number(maxId || 0), convo.id]
      );
    }

    if (restoreForRole === "agency") {
      await conn.query(
        `
        UPDATE chat_conversations
        SET deleted_for_agency = 0,
            agency_cleared_after_message_id = ?
        WHERE id = ?
        `,
        [Number(maxId || 0), convo.id]
      );
    }

    const [rows] = await conn.query(
      `
      SELECT
        id,
        tourist_id,
        agency_id,
        created_at,
        deleted_for_tourist,
        deleted_for_agency,
        tourist_cleared_after_message_id,
        agency_cleared_after_message_id
      FROM chat_conversations
      WHERE id = ?
      LIMIT 1
      `,
      [convo.id]
    );

    await conn.commit();
    return rows[0] || null;
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

/* Conversation details */
export async function getConversationById(conversationId) {
  const [rows] = await db.query(
    `
    SELECT
      c.id,
      c.tourist_id,
      c.agency_id,
      c.created_at,
      c.deleted_for_tourist,
      c.deleted_for_agency,
      c.tourist_cleared_after_message_id,
      c.agency_cleared_after_message_id,

      a.name AS agency_name,
      a.address AS agency_address,
      a.profile_image AS agency_profile_image,

      u.name AS tourist_name,
      u.email AS tourist_email,
      u.phone AS tourist_phone,
      u.profile_image AS tourist_profile_image

    FROM chat_conversations c
    JOIN agencies a ON a.id = c.agency_id
    JOIN users u ON u.id = c.tourist_id
    WHERE c.id = ?
    LIMIT 1
    `,
    [conversationId]
  );

  return rows[0] || null;
}

export async function getMessages(conversationId, { page = 1, limit = 20, viewerRole = "" }) {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const [convoRows] = await db.query(
    `
    SELECT tourist_cleared_after_message_id, agency_cleared_after_message_id
    FROM chat_conversations
    WHERE id = ?
    LIMIT 1
    `,
    [conversationId]
  );

  const convo = convoRows[0];
  const clearedAfterId =
    viewerRole === "tourist"
      ? Number(convo?.tourist_cleared_after_message_id || 0)
      : viewerRole === "agency"
      ? Number(convo?.agency_cleared_after_message_id || 0)
      : 0;

  const [rows] = await db.query(
    `
    SELECT id, conversation_id, sender_id, sender_role, message, created_at, read_at, is_deleted
    FROM chat_messages
    WHERE conversation_id = ?
      AND id > ?
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
    `,
    [conversationId, clearedAfterId, limitNum, offset]
  );

  const [[{ total }]] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM chat_messages
    WHERE conversation_id = ?
      AND id > ?
    `,
    [conversationId, clearedAfterId]
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
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `
      INSERT INTO chat_messages (conversation_id, sender_id, sender_role, message)
      VALUES (?, ?, ?, ?)
      `,
      [conversationId, senderId, senderRole, message]
    );

    if (senderRole === "tourist") {
      await conn.query(
        `
        UPDATE chat_conversations
        SET deleted_for_tourist = 0,
            deleted_for_agency = 0
        WHERE id = ?
        `,
        [conversationId]
      );
    } else if (senderRole === "agency") {
      await conn.query(
        `
        UPDATE chat_conversations
        SET deleted_for_agency = 0,
            deleted_for_tourist = 0
        WHERE id = ?
        `,
        [conversationId]
      );
    }

    const [rows] = await conn.query(
      `
      SELECT id, conversation_id, sender_id, sender_role, message, created_at, read_at, is_deleted
      FROM chat_messages
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    await conn.commit();
    return rows[0] || null;
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

/* Tourist reads: mark agency messages read */
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

/* Agency reads: mark tourist messages read */
export async function markTouristMessagesRead(conversationId) {
  await db.query(
    `
    UPDATE chat_messages
    SET read_at = NOW()
    WHERE conversation_id = ?
      AND sender_role = 'tourist'
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

/* Tourist delete */
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

  const [[{ total, maxId }]] = await db.query(
    `
    SELECT COUNT(*) AS total, COALESCE(MAX(id), 0) AS maxId
    FROM chat_messages
    WHERE conversation_id = ?
    `,
    [conversationId]
  );

  if (onlyIfEmpty && Number(total) > 0) return { ok: false, reason: "not_empty" };

  if (Number(total) === 0) {
    await db.query(`DELETE FROM chat_conversations WHERE id = ?`, [conversationId]);
    return { ok: true, mode: "deleted" };
  }

  await db.query(
    `
    UPDATE chat_conversations
    SET deleted_for_tourist = 1,
        tourist_cleared_after_message_id = ?
    WHERE id = ?
    `,
    [Number(maxId || 0), conversationId]
  );

  return { ok: true, mode: "hidden" };
}

/* Agency delete */
export async function deleteConversationForAgency({ conversationId, agencyId, onlyIfEmpty }) {
  if (!conversationId || !agencyId) return { ok: false, reason: "bad_request" };

  const [convos] = await db.query(
    `
    SELECT id, agency_id
    FROM chat_conversations
    WHERE id = ?
    LIMIT 1
    `,
    [conversationId]
  );

  const convo = convos[0];
  if (!convo) return { ok: false, reason: "not_found" };
  if (Number(convo.agency_id) !== Number(agencyId)) return { ok: false, reason: "not_allowed" };

  const [[{ total, maxId }]] = await db.query(
    `
    SELECT COUNT(*) AS total, COALESCE(MAX(id), 0) AS maxId
    FROM chat_messages
    WHERE conversation_id = ?
    `,
    [conversationId]
  );

  if (onlyIfEmpty && Number(total) > 0) return { ok: false, reason: "not_empty" };

  if (Number(total) === 0) {
    await db.query(`DELETE FROM chat_conversations WHERE id = ?`, [conversationId]);
    return { ok: true, mode: "deleted" };
  }

  await db.query(
    `
    UPDATE chat_conversations
    SET deleted_for_agency = 1,
        agency_cleared_after_message_id = ?
    WHERE id = ?
    `,
    [Number(maxId || 0), conversationId]
  );

  return { ok: true, mode: "hidden" };
}