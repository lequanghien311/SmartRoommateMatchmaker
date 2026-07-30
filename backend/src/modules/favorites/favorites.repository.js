class FavoritesRepository {
  constructor(db) {
    this.db = db;
  }

  async add(userId, roomId) {
    const result = await this.db.query(
      `WITH inserted AS (
        INSERT INTO favorites(user_id,room_id) VALUES ($1,$2)
        ON CONFLICT DO NOTHING RETURNING *
      ), bumped AS (
        UPDATE rooms SET favorite_count=favorite_count+1
        WHERE id=$2 AND EXISTS(SELECT 1 FROM inserted)
      ) SELECT * FROM inserted`,
      [userId, roomId],
    );
    return result.rows[0] || null;
  }

  async remove(userId, roomId) {
    const result = await this.db.query(
      `WITH removed AS (
        DELETE FROM favorites WHERE user_id=$1 AND room_id=$2 RETURNING *
      ), bumped AS (
        UPDATE rooms SET favorite_count=GREATEST(0,favorite_count-1)
        WHERE id=$2 AND EXISTS(SELECT 1 FROM removed)
      ) SELECT * FROM removed`,
      [userId, roomId],
    );
    return result.rows[0] || null;
  }

  async list(userId, limit, offset) {
    const result = await this.db.query(
      `SELECT f.created_at AS favorited_at,r.* FROM favorites f
       JOIN rooms r ON r.id=f.room_id WHERE f.user_id=$1 AND r.deleted_at IS NULL
       ORDER BY f.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows;
  }
}

module.exports = FavoritesRepository;

