class ReportsRepository {
  constructor(db) { this.db = db; }
  async duplicate(reporterId, roomId) {
    const result = await this.db.query(
      `SELECT id FROM reports WHERE reporter_id=$1 AND room_id=$2
       AND created_at > NOW() - INTERVAL '1 hour' AND status IN ('open','reviewing')`,
      [reporterId, roomId],
    );
    return result.rowCount > 0;
  }
  async create(reporterId, input) {
    const result = await this.db.query(
      `INSERT INTO reports(reporter_id,room_id,reason,description)
       SELECT $1,$2,$3,$4 WHERE EXISTS(SELECT 1 FROM rooms WHERE id=$2 AND deleted_at IS NULL)
       RETURNING *`,
      [reporterId, input.roomId, input.reason, input.description || null],
    );
    return result.rows[0] || null;
  }
  async list(userId, limit, offset) {
    const result = await this.db.query(
      `SELECT rp.*,r.title FROM reports rp JOIN rooms r ON r.id=rp.room_id
       WHERE rp.reporter_id=$1 ORDER BY rp.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows;
  }
}
module.exports = ReportsRepository;

