class AmenitiesRepository {
  constructor(db) {
    this.db = db;
  }

  async list() {
    const result = await this.db.query('SELECT * FROM amenities WHERE active=TRUE ORDER BY name');
    return result.rows;
  }

  async create(input) {
    const result = await this.db.query(
      'INSERT INTO amenities(name,icon) VALUES ($1,$2) RETURNING *',
      [input.name, input.icon || null],
    );
    return result.rows[0];
  }

  async update(id, input) {
    const result = await this.db.query(
      `UPDATE amenities SET name=COALESCE($2,name),icon=COALESCE($3,icon),
       active=COALESCE($4,active),updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id, input.name, input.icon, input.active],
    );
    return result.rows[0] || null;
  }
}

module.exports = AmenitiesRepository;

