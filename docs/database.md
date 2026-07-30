# Database

PostgreSQL là nguồn dữ liệu chính. Mọi query nhận dữ liệu bên ngoài dùng placeholder `$1...$n`.

| Bảng | Mục đích | Constraint/index đáng chú ý |
|---|---|---|
| users | tài khoản và hồ sơ | unique email/phone, role/status check |
| refresh_tokens | vòng đời refresh token | unique token hash, revoke timestamp |
| rooms | tin phòng | price/area check, status/location/price index |
| room_images | metadata file | một cover/phòng, soft delete |
| amenities | danh mục tiện ích | unique name |
| room_amenities | N-N room/amenity | composite PK |
| favorites | phòng đã lưu | unique user-room |
| roommate_profiles | lối sống | scale 1–5, unique user |
| matching_results | snapshot điểm | total 0–100, JSONB breakdown |
| conversations | hội thoại | soft delete |
| conversation_members | thành viên/read state | composite PK |
| messages | tin nhắn | content non-empty, pagination index |
| notifications | thông báo | user-created index |
| reports | vi phạm | reason/status check |
| audit_logs | thao tác admin | created_at index |

Nghiệp vụ nhiều câu lệnh dùng helper `transaction`: tạo phòng + tiện ích, tạo hội thoại + thành viên, điều tiết admin + audit log. Dữ liệu quan trọng dùng `deleted_at` thay vì hard delete.

