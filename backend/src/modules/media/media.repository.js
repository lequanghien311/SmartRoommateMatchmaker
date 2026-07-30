class MediaRepository {
  constructor(db) {
    this.db = db;
  }

  async roomOwnedBy(roomId, user) {
    const result = await this.db.query(
      "SELECT id FROM rooms WHERE id=$1 AND deleted_at IS NULL AND (landlord_id=$2 OR $3='admin')",
      [roomId, user.id, user.role],
    );
    return result.rowCount > 0;
  }

  async count(roomId) {
    const result = await this.db.query(
      'SELECT COUNT(*)::int count FROM room_images WHERE room_id=$1 AND deleted_at IS NULL',
      [roomId],
    );
    return result.rows[0].count;
  }

  async create(roomId, file, stored, sortOrder) {
    const result = await this.db.query(
      `INSERT INTO room_images(room_id,storage_key,url,mime_type,size_bytes,is_cover,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [roomId, stored.key, stored.url, file.mimetype, file.size, sortOrder === 0, sortOrder],
    );
    return result.rows[0];
  }

  async find(id) {
    const result = await this.db.query(
      'SELECT * FROM room_images WHERE id=$1 AND deleted_at IS NULL',
      [id],
    );
    return result.rows[0] || null;
  }

  async remove(id) {
    await this.db.query('UPDATE room_images SET deleted_at=NOW(),is_cover=FALSE WHERE id=$1', [id]);
  }

  async cover(roomId, imageId) {
    await this.db.query('UPDATE room_images SET is_cover=FALSE WHERE room_id=$1', [roomId]);
    const result = await this.db.query(
      'UPDATE room_images SET is_cover=TRUE WHERE id=$1 AND room_id=$2 AND deleted_at IS NULL RETURNING *',
      [imageId, roomId],
    );
    return result.rows[0] || null;
  }

  async reorder(roomId, imageIds) {
    for (let index = 0; index < imageIds.length; index += 1) {
      await this.db.query(
        'UPDATE room_images SET sort_order=$1 WHERE id=$2 AND room_id=$3 AND deleted_at IS NULL',
        [index, imageIds[index], roomId],
      );
    }
  }
}

module.exports = MediaRepository;

