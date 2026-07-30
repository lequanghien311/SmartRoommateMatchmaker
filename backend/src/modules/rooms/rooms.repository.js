class RoomsRepository {
  constructor(db) {
    this.db = db;
  }

  buildSearch(query) {
    const values = [];
    const where = ["r.status='active'", 'r.deleted_at IS NULL'];
    const add = (value) => {
      values.push(value);
      return `$${values.length}`;
    };
    if (query.keyword) {
      const placeholder = add(`%${query.keyword}%`);
      where.push(`(r.title ILIKE ${placeholder} OR r.description ILIKE ${placeholder} OR r.address ILIKE ${placeholder})`);
    }
    if (query.minPrice) where.push(`r.monthly_price >= ${add(Number(query.minPrice))}`);
    if (query.maxPrice) where.push(`r.monthly_price <= ${add(Number(query.maxPrice))}`);
    if (query.minArea) where.push(`r.area >= ${add(Number(query.minArea))}`);
    if (query.province) where.push(`r.province = ${add(query.province)}`);
    if (query.district) where.push(`r.district = ${add(query.district)}`);
    if (query.roomType) where.push(`r.room_type = ${add(query.roomType)}`);
    if (query.hasMezzanine === 'true') where.push('r.has_mezzanine = TRUE');
    if (query.allowsPets === 'true') where.push('r.allows_pets = TRUE');
    if (query.amenities) {
      const names = String(query.amenities).split(',').filter(Boolean);
      where.push(`(
        SELECT COUNT(DISTINCT a.name) FROM room_amenities ra
        JOIN amenities a ON a.id=ra.amenity_id
        WHERE ra.room_id=r.id AND a.name = ANY(${add(names)})
      ) = ${add(names.length)}`);
    }
    const sortMap = {
      price_asc: 'r.monthly_price ASC',
      price_desc: 'r.monthly_price DESC',
      popular: 'r.view_count DESC, r.favorite_count DESC',
      newest: 'r.created_at DESC',
    };
    return { values, where: where.join(' AND '), order: sortMap[query.sort] || sortMap.newest };
  }

  async search(query, limit, offset) {
    const built = this.buildSearch(query);
    const total = await this.db.query(`SELECT COUNT(*)::int AS count FROM rooms r WHERE ${built.where}`, built.values);
    const rows = await this.db.query(
      `SELECT r.*,
        COALESCE((SELECT json_agg(json_build_object('id',ri.id,'url',ri.url,'isCover',ri.is_cover)
          ORDER BY ri.sort_order) FROM room_images ri WHERE ri.room_id=r.id AND ri.deleted_at IS NULL),'[]') images,
        COALESCE((SELECT json_agg(a.name ORDER BY a.name) FROM room_amenities ra
          JOIN amenities a ON a.id=ra.amenity_id WHERE ra.room_id=r.id),'[]') amenities
       FROM rooms r WHERE ${built.where} ORDER BY ${built.order}
       LIMIT $${built.values.length + 1} OFFSET $${built.values.length + 2}`,
      [...built.values, limit, offset],
    );
    return { rows: rows.rows, total: total.rows[0].count };
  }

  async findById(id, includeInactive = false) {
    const result = await this.db.query(
      `SELECT r.*,
        json_build_object('id',u.id,'fullName',u.full_name,'avatarUrl',u.avatar_url,'phone',u.phone) landlord,
        COALESCE((SELECT json_agg(json_build_object('id',ri.id,'url',ri.url,'isCover',ri.is_cover,'sortOrder',ri.sort_order)
          ORDER BY ri.sort_order) FROM room_images ri WHERE ri.room_id=r.id AND ri.deleted_at IS NULL),'[]') images,
        COALESCE((SELECT json_agg(json_build_object('id',a.id,'name',a.name,'icon',a.icon) ORDER BY a.name)
          FROM room_amenities ra JOIN amenities a ON a.id=ra.amenity_id WHERE ra.room_id=r.id),'[]') amenities
       FROM rooms r JOIN users u ON u.id=r.landlord_id
       WHERE r.id=$1 AND r.deleted_at IS NULL ${includeInactive ? '' : "AND r.status='active'"}`,
      [id],
    );
    return result.rows[0] || null;
  }

  async create(client, userId, input) {
    const result = await client.query(
      `INSERT INTO rooms(
        landlord_id,title,description,monthly_price,deposit,area,address,province,district,ward,
        room_type,max_occupants,available_rooms,has_mezzanine,allows_pets,status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        userId, input.title, input.description, input.monthlyPrice, input.deposit || 0, input.area,
        input.address, input.province, input.district, input.ward, input.roomType,
        input.maxOccupants || 1, input.availableRooms || 1, Boolean(input.hasMezzanine),
        Boolean(input.allowsPets), input.status || 'draft',
      ],
    );
    if (input.amenityIds?.length) {
      await client.query(
        `INSERT INTO room_amenities(room_id,amenity_id)
         SELECT $1, unnest($2::uuid[]) ON CONFLICT DO NOTHING`,
        [result.rows[0].id, input.amenityIds],
      );
    }
    return result.rows[0];
  }

  async update(id, user, input) {
    const fields = {
      title: 'title', description: 'description', monthlyPrice: 'monthly_price', deposit: 'deposit',
      area: 'area', address: 'address', province: 'province', district: 'district', ward: 'ward',
      roomType: 'room_type', maxOccupants: 'max_occupants', availableRooms: 'available_rooms',
      hasMezzanine: 'has_mezzanine', allowsPets: 'allows_pets',
    };
    const sets = [];
    const values = [id];
    for (const [key, column] of Object.entries(fields)) {
      if (input[key] !== undefined) {
        values.push(input[key]);
        sets.push(`${column}=$${values.length}`);
      }
    }
    if (!sets.length) return this.findById(id, true);
    values.push(user.id);
    const owner = user.role === 'admin' ? 'TRUE' : `landlord_id=$${values.length}`;
    const result = await this.db.query(
      `UPDATE rooms SET ${sets.join(',')},updated_at=NOW()
       WHERE id=$1 AND ${owner} AND deleted_at IS NULL RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  }

  async transition(id, user, status, reason) {
    const owner = user.role === 'admin' ? 'TRUE' : 'landlord_id=$3';
    const result = await this.db.query(
      `UPDATE rooms SET status=$2,rejection_reason=$4,updated_at=NOW()
       WHERE id=$1 AND ${owner} AND deleted_at IS NULL RETURNING *`,
      [id, status, user.id, reason || null],
    );
    return result.rows[0] || null;
  }

  async countImages(id) {
    const result = await this.db.query(
      'SELECT COUNT(*)::int count FROM room_images WHERE room_id=$1 AND deleted_at IS NULL',
      [id],
    );
    return result.rows[0].count;
  }

  async mine(userId, limit, offset) {
    const result = await this.db.query(
      `SELECT * FROM rooms WHERE landlord_id=$1 AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows;
  }

  async softDelete(id, user) {
    const result = await this.db.query(
      `UPDATE rooms SET status='deleted',deleted_at=NOW(),updated_at=NOW()
       WHERE id=$1 AND (landlord_id=$2 OR $3='admin') AND deleted_at IS NULL RETURNING id`,
      [id, user.id, user.role],
    );
    return result.rowCount > 0;
  }

  async incrementView(id) {
    await this.db.query('UPDATE rooms SET view_count=view_count+1 WHERE id=$1', [id]);
  }
}

module.exports = RoomsRepository;

