class ChatRepository {
  constructor(db, transaction) {
    this.db = db;
    this.transaction = transaction;
  }

  async create(userId, memberId, roomId) {
    return this.transaction(async (client) => {
      const conversation = await client.query(
        "INSERT INTO conversations(room_id,type) VALUES ($1,'direct') RETURNING *",
        [roomId || null],
      );
      await client.query(
        `INSERT INTO conversation_members(conversation_id,user_id)
         SELECT $1, unnest($2::uuid[])`,
        [conversation.rows[0].id, [userId, memberId]],
      );
      return conversation.rows[0];
    });
  }

  async canAccess(userId, conversationId) {
    const result = await this.db.query(
      `SELECT 1 FROM conversation_members cm JOIN conversations c ON c.id=cm.conversation_id
       WHERE cm.user_id=$1 AND cm.conversation_id=$2 AND c.deleted_at IS NULL`,
      [userId, conversationId],
    );
    return result.rowCount > 0;
  }

  async list(userId, limit, offset) {
    const result = await this.db.query(
      `SELECT c.*,COALESCE((
        SELECT json_agg(json_build_object('id',u.id,'fullName',u.full_name,'avatarUrl',u.avatar_url))
        FROM conversation_members x JOIN users u ON u.id=x.user_id
        WHERE x.conversation_id=c.id AND x.user_id<>$1
       ),'[]') members,
       (SELECT content FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) last_message,
       (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL
          AND m.sender_id<>$1 AND m.created_at>COALESCE(cm.last_read_at,'epoch')) unread_count
       FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id AND cm.user_id=$1
       WHERE c.deleted_at IS NULL ORDER BY c.updated_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows;
  }

  async messages(userId, conversationId, limit, offset) {
    if (!(await this.canAccess(userId, conversationId))) return null;
    const result = await this.db.query(
      `SELECT m.id,m.conversation_id,m.sender_id,
        CASE WHEN m.deleted_at IS NULL THEN m.content ELSE 'Tin nhắn đã được xóa' END content,
        m.created_at,m.deleted_at,u.full_name AS sender_name
       FROM messages m JOIN users u ON u.id=m.sender_id
       WHERE m.conversation_id=$1 ORDER BY m.created_at DESC LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset],
    );
    return result.rows.reverse();
  }

  async createMessage(userId, conversationId, content) {
    if (!(await this.canAccess(userId, conversationId))) return null;
    const result = await this.db.query(
      `WITH created AS (
        INSERT INTO messages(conversation_id,sender_id,content) VALUES ($1,$2,$3) RETURNING *
      ), bumped AS (
        UPDATE conversations SET updated_at=NOW() WHERE id=$1
      ) SELECT * FROM created`,
      [conversationId, userId, content],
    );
    return result.rows[0];
  }

  async markRead(userId, conversationId) {
    const result = await this.db.query(
      'UPDATE conversation_members SET last_read_at=NOW() WHERE conversation_id=$1 AND user_id=$2 RETURNING *',
      [conversationId, userId],
    );
    return result.rowCount > 0;
  }

  async removeMessage(userId, messageId) {
    const result = await this.db.query(
      'UPDATE messages SET deleted_at=NOW() WHERE id=$1 AND sender_id=$2 AND deleted_at IS NULL RETURNING *',
      [messageId, userId],
    );
    return result.rows[0] || null;
  }

  async otherMembers(conversationId, userId) {
    const result = await this.db.query(
      'SELECT user_id FROM conversation_members WHERE conversation_id=$1 AND user_id<>$2',
      [conversationId, userId],
    );
    return result.rows.map((row) => row.user_id);
  }
}
module.exports = ChatRepository;

