# Phân công nhóm

| Thành viên | Phạm vi | Điểm tích hợp |
|---|---|---|
| Giang | Auth và User Management | JWT middleware, user identity |
| Lộc | Room, Media, Amenities, Favorites | ownership, storage, cache invalidation |
| Hiền | Frontend chung, Search, Filter, Testing, Documentation | API contract và trải nghiệm responsive |
| Trường | Chat, Realtime, Notifications | conversation membership, Socket.IO |
| Linh | Matching, Admin, Cloud, Docker, CI/CD | events, moderation, provider factory |

Quy trình: nhánh tính năng → lint/test → pull request → review chủ module → merge. Thay đổi schema cần migration mới và thông báo cả nhóm. API contract cập nhật OpenAPI và frontend service cùng pull request.

