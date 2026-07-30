class AdminRepository {
  constructor(db, transaction) { this.db = db; this.transaction = transaction; }
  async dashboard() {
    const counts = await this.db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL) total_users,
        (SELECT COUNT(*)::int FROM users WHERE role='tenant' AND deleted_at IS NULL) total_tenants,
        (SELECT COUNT(*)::int FROM users WHERE role='landlord' AND deleted_at IS NULL) total_landlords,
        (SELECT COUNT(*)::int FROM rooms WHERE deleted_at IS NULL) total_rooms,
        (SELECT COUNT(*)::int FROM rooms WHERE status='active') active_rooms,
        (SELECT COUNT(*)::int FROM rooms WHERE status='pending') pending_rooms,
        (SELECT COUNT(*)::int FROM rooms WHERE status='rented') rented_rooms,
        (SELECT COUNT(*)::int FROM roommate_profiles) roommate_profiles,
        (SELECT COUNT(*)::int FROM conversations WHERE deleted_at IS NULL) conversations,
        (SELECT COUNT(*)::int FROM messages WHERE deleted_at IS NULL) messages,
        (SELECT COUNT(*)::int FROM reports WHERE status IN ('open','reviewing')) unresolved_reports
    `);
    const charts = await this.db.query(`
      WITH days AS (SELECT generate_series(CURRENT_DATE-INTERVAL '6 days',CURRENT_DATE,'1 day')::date day)
      SELECT d.day,
        (SELECT COUNT(*)::int FROM users u WHERE u.created_at::date=d.day) new_users,
        (SELECT COUNT(*)::int FROM rooms r WHERE r.created_at::date=d.day) new_rooms
      FROM days d ORDER BY d.day
    `);
    const activity = await this.db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 12');
    return { ...counts.rows[0], chart: charts.rows, recentActivity: activity.rows };
  }
  async users(query, limit, offset) {
    const values = [];
    const where = ['deleted_at IS NULL'];
    const add = (value) => { values.push(value); return `$${values.length}`; };
    if (query.keyword) where.push(`(email ILIKE ${add(`%${query.keyword}%`)} OR full_name ILIKE $${values.length})`);
    if (query.role) where.push(`role=${add(query.role)}`);
    if (query.status) where.push(`status=${add(query.status)}`);
    const result = await this.db.query(
      `SELECT id,email,phone,full_name,role,status,created_at FROM users WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    return result.rows;
  }
  async setUserStatus(actorId, userId, status, requestId) {
    return this.transaction(async (client) => {
      const result = await client.query(
        `UPDATE users SET status=$2,updated_at=NOW() WHERE id=$1 AND role<>'admin' AND deleted_at IS NULL
         RETURNING id,email,full_name,role,status`,
        [userId, status],
      );
      if (!result.rowCount) return null;
      await client.query(
        `INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata,request_id)
         VALUES ($1,'USER_STATUS_CHANGED','user',$2,$3,$4)`,
        [actorId, userId, { status }, requestId],
      );
      return result.rows[0];
    });
  }
  async rooms(status, limit, offset) {
    const result = await this.db.query(
      `SELECT r.*,u.full_name AS landlord_name FROM rooms r JOIN users u ON u.id=r.landlord_id
       WHERE r.deleted_at IS NULL AND ($1::text IS NULL OR r.status=$1)
       ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
      [status || null, limit, offset],
    );
    return result.rows;
  }
  async moderateRoom(actorId, roomId, status, reason, requestId) {
    return this.transaction(async (client) => {
      const result = await client.query(
        `UPDATE rooms SET status=$2,rejection_reason=$3,updated_at=NOW()
         WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        [roomId, status, reason || null],
      );
      if (!result.rowCount) return null;
      await client.query(
        `INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata,request_id)
         VALUES ($1,'ROOM_MODERATED','room',$2,$3,$4)`,
        [actorId, roomId, { status, reason }, requestId],
      );
      return result.rows[0];
    });
  }
  async reports(status, limit, offset) {
    const result = await this.db.query(
      `SELECT rp.*,r.title,u.full_name AS reporter_name FROM reports rp
       JOIN rooms r ON r.id=rp.room_id JOIN users u ON u.id=rp.reporter_id
       WHERE ($1::text IS NULL OR rp.status=$1) ORDER BY rp.created_at DESC LIMIT $2 OFFSET $3`,
      [status || null, limit, offset],
    );
    return result.rows;
  }
  async resolveReport(actorId, reportId, input, requestId) {
    return this.transaction(async (client) => {
      const report = await client.query(
        `UPDATE reports SET status=$2,admin_note=$3,resolved_by=$1,
         resolved_at=CASE WHEN $2 IN ('resolved','rejected') THEN NOW() ELSE NULL END,updated_at=NOW()
         WHERE id=$4 RETURNING *`,
        [actorId, input.status, input.adminNote || null, reportId],
      );
      if (!report.rowCount) return null;
      if (input.hideRoom) await client.query("UPDATE rooms SET status='hidden',updated_at=NOW() WHERE id=$1", [report.rows[0].room_id]);
      await client.query(
        `INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata,request_id)
         VALUES ($1,'REPORT_RESOLVED','report',$2,$3,$4)`,
        [actorId, reportId, input, requestId],
      );
      return report.rows[0];
    });
  }
}
module.exports = AdminRepository;

