class UsersRepository {
  constructor(db) {
    this.db = db;
  }

  async getPublic(id) {
    const result = await this.db.query(
      `SELECT id,full_name,role,school,bio,avatar_url,created_at
       FROM users WHERE id=$1 AND status='active' AND deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] || null;
  }

  async getPrivate(id) {
    const result = await this.db.query(
      `SELECT id,email,phone,full_name,role,status,birth_date,gender,school,bio,avatar_url,
              last_login_at,created_at,updated_at
       FROM users WHERE id=$1 AND deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] || null;
  }

  async update(id, input) {
    const result = await this.db.query(
      `UPDATE users SET full_name=COALESCE($2,full_name),phone=COALESCE($3,phone),
        birth_date=COALESCE($4,birth_date),gender=COALESCE($5,gender),
        school=COALESCE($6,school),bio=COALESCE($7,bio),
        avatar_url=COALESCE($8,avatar_url),updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING id,email,phone,full_name,role,status,birth_date,gender,school,bio,avatar_url,updated_at`,
      [id, input.fullName, input.phone, input.birthDate, input.gender, input.school, input.bio, input.avatarUrl],
    );
    return result.rows[0] || null;
  }

  async activity(id, limit, offset) {
    const result = await this.db.query(
      `SELECT action,entity_type,entity_id,metadata,created_at
       FROM audit_logs WHERE actor_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [id, limit, offset],
    );
    return result.rows;
  }
}

module.exports = UsersRepository;

