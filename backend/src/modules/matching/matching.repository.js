class MatchingRepository {
  constructor(db) {
    this.db = db;
  }

  async profile(userId) {
    const result = await this.db.query(
      `SELECT rp.*,u.full_name,u.gender,u.avatar_url,u.status FROM roommate_profiles rp
       JOIN users u ON u.id=rp.user_id WHERE rp.user_id=$1`,
      [userId],
    );
    return result.rows[0] || null;
  }

  async candidates(userId) {
    const result = await this.db.query(
      `SELECT rp.*,u.full_name,u.gender,u.avatar_url,u.status FROM roommate_profiles rp
       JOIN users u ON u.id=rp.user_id
       WHERE rp.user_id<>$1 AND rp.is_looking=TRUE AND u.status='active' AND u.deleted_at IS NULL`,
      [userId],
    );
    return result.rows;
  }

  async save(userId, candidateId, result) {
    await this.db.query(
      `INSERT INTO matching_results(user_id,candidate_id,total_score,breakdown,similarities,conflicts,explanation)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT(user_id,candidate_id) DO UPDATE SET total_score=EXCLUDED.total_score,
       breakdown=EXCLUDED.breakdown,similarities=EXCLUDED.similarities,conflicts=EXCLUDED.conflicts,
       explanation=EXCLUDED.explanation,created_at=NOW()`,
      [userId, candidateId, result.totalScore, result.breakdown, JSON.stringify(result.similarities), JSON.stringify(result.conflicts), result.explanation],
    );
  }
}

module.exports = MatchingRepository;

