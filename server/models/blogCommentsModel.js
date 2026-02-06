import { db } from "../db.js";

export async function getBlogCommentsPaged(blogId, { page = 1, limit = 6 } = {}) {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 6;
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await db.query(
    `
    SELECT 
      bc.id,
      bc.blog_id,
      bc.user_id,
      u.name AS user_name,
      bc.comment,
      bc.created_at
    FROM blog_comments bc
    JOIN users u ON u.id = bc.user_id
    WHERE bc.blog_id = ?
    ORDER BY bc.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [blogId, limitNum, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM blog_comments WHERE blog_id = ?`,
    [blogId]
  );

  return {
    data: rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: offset + rows.length < total,
    },
  };
}

export async function addBlogComment({ blogId, userId, comment }) {
  const [result] = await db.query(
    `INSERT INTO blog_comments (blog_id, user_id, comment) VALUES (?, ?, ?)`,
    [blogId, userId, comment]
  );

  const insertedId = result.insertId;

  const [rows] = await db.query(
    `
    SELECT 
      bc.id,
      bc.blog_id,
      bc.user_id,
      u.name AS user_name,
      bc.comment,
      bc.created_at
    FROM blog_comments bc
    JOIN users u ON u.id = bc.user_id
    WHERE bc.id = ?
    LIMIT 1
    `,
    [insertedId]
  );

  return rows[0];
}

export async function deleteBlogCommentOwn({ blogId, commentId, userId }) {
  const [res] = await db.query(
    `DELETE FROM blog_comments WHERE id = ? AND blog_id = ? AND user_id = ?`,
    [commentId, blogId, userId]
  );
  return res.affectedRows;
}
