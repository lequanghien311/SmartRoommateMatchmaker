class AuthRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const result = await this.db.query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [
      email.toLowerCase(),
    ]);
    return result.rows[0] || null;
  }

  async findById(id) {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [
      id,
    ]);
    return result.rows[0] || null;
  }

  async findDuplicate(email, phone) {
    const result = await this.db.query(
      'SELECT email, phone FROM users WHERE (email = $1 OR phone = $2) AND deleted_at IS NULL',
      [email.toLowerCase(), phone],
    );
    return result.rows[0] || null;
  }

  async create({ email, phone, passwordHash, fullName, role }) {
    const result = await this.db.query(
      `INSERT INTO users(email,phone,password_hash,full_name,role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id,email,phone,full_name,role,status,created_at`,
      [email.toLowerCase(), phone, passwordHash, fullName, role],
    );
    return result.rows[0];
  }

  async saveRefreshToken(userId, tokenHash, expiresAt) {
    await this.db.query(
      'INSERT INTO refresh_tokens(user_id,token_hash,expires_at) VALUES ($1,$2,$3)',
      [userId, tokenHash, expiresAt],
    );
  }

  async consumeRefreshToken(tokenHash) {
    const result = await this.db.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash],
    );
    return result.rows[0] || null;
  }

  async revokeToken(tokenHash) {
    await this.db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
      [tokenHash],
    );
  }

  async updatePassword(userId, passwordHash) {
    await this.db.query('UPDATE users SET password_hash=$2,updated_at=NOW() WHERE id=$1', [
      userId,
      passwordHash,
    ]);
    await this.db.query(
      'UPDATE refresh_tokens SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL',
      [userId],
    );
  }

  async markLogin(userId) {
    await this.db.query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [userId]);
  }
}

module.exports = AuthRepository;
