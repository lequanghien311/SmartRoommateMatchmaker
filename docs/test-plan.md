# Test plan

| ID | Nhóm | Tình huống | Kết quả mong đợi |
|---:|---|---|---|
| 01 | Auth | Đăng ký tenant hợp lệ | 201, hash password, token |
| 02 | Auth | Đăng ký landlord hợp lệ | 201, role landlord |
| 03 | Auth | Email sai định dạng | 422 tiếng Việt |
| 04 | Auth | Email trùng | 409 |
| 05 | Auth | Phone trùng | 409 |
| 06 | Auth | Mật khẩu dưới 8 ký tự | 422 |
| 07 | Auth | Mật khẩu thiếu chữ hoặc số | 422 |
| 08 | Auth | Đăng nhập hợp lệ | 200, access/refresh token |
| 09 | Auth | Sai mật khẩu | 401 |
| 10 | Auth | Tài khoản locked | 403 |
| 11 | Auth | Refresh hợp lệ | token rotation |
| 12 | Auth | Refresh revoked | 401 |
| 13 | Auth | Đổi mật khẩu sai hiện tại | 400 |
| 14 | RBAC | Tenant gọi API tạo phòng | 403 |
| 15 | RBAC | Chưa login gọi favorites | 401 |
| 16 | User | Cập nhật hồ sơ hợp lệ | 200 |
| 17 | User | Phone cập nhật bị trùng | 409 |
| 18 | Room | Landlord tạo draft | 201 + RoomCreated |
| 19 | Room | Giá bằng 0 | 422 |
| 20 | Room | Diện tích âm | 422 |
| 21 | Room | Mô tả dưới 20 ký tự | 422 |
| 22 | Room | Gửi duyệt chưa có ảnh | 422 |
| 23 | Room | Admin duyệt pending | active + notification |
| 24 | Room | Landlord sửa phòng người khác | 404/403 |
| 25 | Search | Lọc khoảng giá | chỉ giá trong khoảng |
| 26 | Search | Lọc quận và tiện ích | đúng giao điều kiện |
| 27 | Search | Sort price ascending | thứ tự tăng dần |
| 28 | Search | Pagination trang 2 | meta đúng |
| 29 | Media | Upload JPEG hợp lệ | metadata + file/blob |
| 30 | Media | Upload MIME lạ | bị từ chối |
| 31 | Media | Upload ảnh thứ 11 | 422 |
| 32 | Favorite | Thêm yêu thích | 201 + tăng count |
| 33 | Favorite | Lưu trùng | 409 |
| 34 | Favorite | Xóa yêu thích | 204 + giảm count |
| 35 | Profile | Scale sạch sẽ ngoài 1–5 | 422 |
| 36 | Matching | Hồ sơ giống nhau | 100 điểm |
| 37 | Matching | Không ghép chính mình | không có trong danh sách |
| 38 | Matching | Bỏ ứng viên locked | không có trong danh sách |
| 39 | Matching | Azure lỗi | fallback rule-based |
| 40 | Chat | Tạo conversation hai thành viên | 201 |
| 41 | Chat | Người ngoài đọc message | 403 |
| 42 | Chat | Gửi nội dung rỗng | 422 |
| 43 | Chat | Gửi message hợp lệ | lưu + realtime event |
| 44 | Chat | Mark read | unread về 0 |
| 45 | Notification | Đánh dấu một mục đã đọc | read_at được đặt |
| 46 | Notification | Đọc tất cả | badge về 0 |
| 47 | Report | Tạo báo cáo hợp lệ | 201 + event |
| 48 | Report | Spam báo cáo trong 1 giờ | 429 |
| 49 | Admin | Khóa tenant | audit log |
| 50 | Admin | Không khóa admin | 404 |
| 51 | Admin | Resolve report và ẩn phòng | transaction hoàn tất |
| 52 | Health | Basic health | 200, không secret |
| 53 | Health | Database mất kết nối | 500 có response chuẩn |
| 54 | Security | SQL injection qua keyword | không thực thi SQL |
| 55 | Security | XSS trong bio/message | HTML bị loại |
| 56 | Frontend | API lỗi | hiện error state |
| 57 | Frontend | 360px | menu và form không tràn |
| 58 | Docker | compose up --build | web/API/DB healthy |

