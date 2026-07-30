class NotificationsRepository {
  constructor(db) { this.db = db; }
  async create(userId, type, title, body, link, data = {}) {
    const result = await this.db.query(
      'INSERT INTO notifications(user_id,type,title,body,link,data) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [userId, type, title, body, link, data],
    );
    return result.rows[0];
  }
  async list(userId, limit, offset) {
    const result = await this.db.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset],
    );
    return result.rows;
  }
  async unread(userId) {
    const result = await this.db.query('SELECT COUNT(*)::int count FROM notifications WHERE user_id=$1 AND read_at IS NULL', [userId]);
    return result.rows[0].count;
  }
  async read(userId, id) {
    const result = await this.db.query('UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND user_id=$2 RETURNING *', [id, userId]);
    return result.rows[0] || null;
  }
  async readAll(userId) {
    await this.db.query('UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL', [userId]);
  }
}
module.exports = NotificationsRepository;

