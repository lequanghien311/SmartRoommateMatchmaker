const bcrypt = require('bcryptjs');
const { pool, transaction } = require('./connection');

const people = [
  ['admin@smartroommate.vn', '0900000001', 'Quản trị viên', 'admin'],
  ['landlord1@smartroommate.vn', '0900000011', 'Nguyễn Minh Anh', 'landlord'],
  ['landlord2@smartroommate.vn', '0900000012', 'Trần Quốc Bảo', 'landlord'],
  ['landlord3@smartroommate.vn', '0900000013', 'Lê Thanh Hà', 'landlord'],
  ['tenant1@smartroommate.vn', '0900000021', 'Phạm Gia Huy', 'tenant'],
  ['tenant2@smartroommate.vn', '0900000022', 'Võ Hoàng Lan', 'tenant'],
  ['tenant3@smartroommate.vn', '0900000023', 'Đặng Nhật Nam', 'tenant'],
  ['tenant4@smartroommate.vn', '0900000024', 'Bùi Thu Trang', 'tenant'],
  ['tenant5@smartroommate.vn', '0900000025', 'Mai Anh Tú', 'tenant'],
  ['tenant6@smartroommate.vn', '0900000026', 'Đỗ Khánh Linh', 'tenant'],
  ['tenant7@smartroommate.vn', '0900000027', 'Ngô Minh Khang', 'tenant'],
  ['tenant8@smartroommate.vn', '0900000028', 'Huỳnh Ngọc Mai', 'tenant'],
];

const amenityNames = [
  ['Wifi tốc độ cao', 'wifi'],
  ['Máy lạnh', 'snowflake'],
  ['Chỗ để xe', 'bike'],
  ['Máy giặt', 'washer'],
  ['Bếp riêng', 'cooking'],
  ['Camera an ninh', 'camera'],
  ['Ban công', 'balcony'],
  ['Thang máy', 'elevator'],
];

async function seed() {
  const passwordHash = await bcrypt.hash('Demo@123', 10);
  await transaction(async (client) => {
    for (const [email, phone, fullName, role] of people) {
      await client.query(
        `INSERT INTO users(email, phone, full_name, role, password_hash, school, bio)
         VALUES ($1,$2,$3,$4,$5,'Đại học Công nghệ TP.HCM','Tài khoản minh họa cho môi trường local')
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name`,
        [email, phone, fullName, role, passwordHash],
      );
    }
    for (const [name, icon] of amenityNames) {
      await client.query(
        `INSERT INTO amenities(name, icon) VALUES ($1,$2)
         ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon`,
        [name, icon],
      );
    }
    const landlords = await client.query(
      "SELECT id FROM users WHERE role = 'landlord' ORDER BY email",
    );
    const roomCount = await client.query('SELECT COUNT(*)::int AS count FROM rooms');
    if (roomCount.rows[0].count === 0) {
      const districts = ['Bình Thạnh', 'Gò Vấp', 'Quận 7', 'Thủ Đức', 'Quận 10'];
      for (let index = 1; index <= 20; index += 1) {
        const landlord = landlords.rows[(index - 1) % landlords.rowCount];
        const status = index <= 14 ? 'active' : index <= 18 ? 'pending' : 'draft';
        const room = await client.query(
          `INSERT INTO rooms(
            landlord_id,title,description,monthly_price,deposit,area,address,province,district,
            ward,room_type,max_occupants,available_rooms,has_mezzanine,allows_pets,status,view_count
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,'TP. Hồ Chí Minh',$8,$9,$10,$11,$12,$13,$14,$15,$16)
          RETURNING id`,
          [
            landlord.id,
            `Phòng trọ sinh viên tiện nghi số ${index}`,
            `Không gian sáng thoáng, an ninh, gần trường và đầy đủ tiện ích cho sinh viên số ${index}.`,
            2200000 + index * 125000,
            1500000,
            18 + (index % 9),
            `${20 + index} đường Nguyễn Văn Mẫu`,
            districts[index % districts.length],
            `Phường ${1 + (index % 12)}`,
            index % 3 === 0 ? 'studio' : 'private',
            1 + (index % 3),
            1 + (index % 2),
            index % 2 === 0,
            index % 4 === 0,
            status,
            index * 17,
          ],
        );
        const amenities = await client.query(
          'SELECT id FROM amenities ORDER BY name LIMIT $1',
          [2 + (index % 4)],
        );
        for (const amenity of amenities.rows) {
          await client.query(
            'INSERT INTO room_amenities(room_id, amenity_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [room.rows[0].id, amenity.id],
          );
        }
      }
    }
    const tenants = await client.query("SELECT id FROM users WHERE role = 'tenant' ORDER BY email");
    for (let index = 0; index < tenants.rowCount; index += 1) {
      const user = tenants.rows[index];
      await client.query(
        `INSERT INTO roommate_profiles(
          user_id,budget_min,budget_max,preferred_province,preferred_district,sleep_time,wake_time,
          smoking,has_pets,cleanliness,noise_tolerance,cooking_frequency,preferred_gender,school,habits
        ) VALUES ($1,$2,$3,'TP. Hồ Chí Minh',$4,$5,$6,$7,$8,$9,$10,$11,'any',
          'Đại học Công nghệ TP.HCM',$12)
        ON CONFLICT (user_id) DO NOTHING`,
        [
          user.id,
          2000000,
          4500000 + index * 100000,
          ['Bình Thạnh', 'Gò Vấp', 'Thủ Đức'][index % 3],
          `${22 + (index % 2)}:00`,
          `0${6 + (index % 2)}:30`,
          index === 6,
          index % 4 === 0,
          3 + (index % 3),
          2 + (index % 4),
          1 + (index % 5),
          'Thích không gian gọn gàng, học nhóm, thể thao và nấu ăn cuối tuần.',
        ],
      );
    }
    const activeRooms = await client.query("SELECT id FROM rooms WHERE status='active' ORDER BY created_at LIMIT 3");
    if (activeRooms.rowCount && tenants.rowCount >= 2) {
      await client.query(
        'INSERT INTO favorites(user_id,room_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [tenants.rows[0].id, activeRooms.rows[0].id],
      );
      await client.query(
        `INSERT INTO matching_results(user_id,candidate_id,total_score,breakdown,similarities,conflicts,explanation)
         VALUES ($1,$2,86.5,$3,$4,$5,$6)
         ON CONFLICT(user_id,candidate_id) DO NOTHING`,
        [
          tenants.rows[0].id,
          tenants.rows[1].id,
          JSON.stringify({ sleepWake: 18, cleanliness: 15, noise: 8, smoking: 10, pets: 5, budget: 8.5, area: 10, gender: 5, school: 5, keywords: 2 }),
          JSON.stringify(['Giờ giấc tương đồng', 'Cùng khu vực mong muốn']),
          JSON.stringify(['Nên trao đổi thêm về việc nấu ăn']),
          'Hai bạn có mức độ tương thích cao và nên bắt đầu trò chuyện.',
        ],
      );
      const conversationCount = await client.query('SELECT COUNT(*)::int count FROM conversations');
      if (conversationCount.rows[0].count === 0) {
        const conversation = await client.query(
          "INSERT INTO conversations(room_id,type) VALUES ($1,'room') RETURNING id",
          [activeRooms.rows[0].id],
        );
        await client.query(
          'INSERT INTO conversation_members(conversation_id,user_id) SELECT $1,unnest($2::uuid[])',
          [conversation.rows[0].id, [tenants.rows[0].id, tenants.rows[1].id]],
        );
        await client.query(
          `INSERT INTO messages(conversation_id,sender_id,content) VALUES
           ($1,$2,'Chào bạn, mình thấy hồ sơ của chúng ta khá phù hợp!'),
           ($1,$3,'Chào bạn, mình cũng muốn trao đổi thêm về khu vực thuê phòng.')`,
          [conversation.rows[0].id, tenants.rows[0].id, tenants.rows[1].id],
        );
      }
      const reportCount = await client.query('SELECT COUNT(*)::int count FROM reports');
      if (reportCount.rows[0].count === 0) {
        await client.query(
          `INSERT INTO reports(reporter_id,room_id,reason,description)
           VALUES ($1,$2,'wrong_price','Giá trong mô tả có điểm cần chủ trọ xác nhận lại.')`,
          [tenants.rows[2].id, activeRooms.rows[1]?.id || activeRooms.rows[0].id],
        );
      }
      await client.query(
        `INSERT INTO notifications(user_id,type,title,body,link)
         SELECT $1,'match_found','Có người ở ghép phù hợp','Một ứng viên có điểm tương thích trên 80.','/matches'
         WHERE NOT EXISTS(SELECT 1 FROM notifications WHERE user_id=$1 AND type='match_found')`,
        [tenants.rows[0].id],
      );
    }
  });
  console.log('Seed hoàn tất. Mật khẩu demo: Demo@123');
}

seed()
  .catch((error) => {
    const details = error.errors?.map((item) => item.message).join('; ') || error.message || String(error);
    console.error(`Seed thất bại: ${details}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
