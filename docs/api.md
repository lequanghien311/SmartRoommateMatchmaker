# API

Response thành công:

```json
{ "success": true, "message": "Thao tác thành công", "data": {}, "meta": {} }
```

Response lỗi:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [{ "field": "email", "message": "Email đã tồn tại" }]
}
```

JWT được gửi bằng `Authorization: Bearer <token>`. Role được kiểm tra ở backend. Status dùng theo chuẩn: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429 và 500.

## Endpoint

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/change-password`.
- Users: `GET /users/me`, `PUT /users/me`, `GET /users/me/activity`, `GET /users/:id`.
- Rooms: `GET /rooms`, `GET /rooms/:id`, `POST /rooms`, `PUT /rooms/:id`, `PATCH /rooms/:id/status`, `DELETE /rooms/:id`, `GET /rooms/mine`.
- Media: `POST /media/rooms/:roomId/images`, `DELETE /media/images/:imageId`, `PATCH /media/rooms/:roomId/images/:imageId/cover`, `PATCH /media/rooms/:roomId/images/reorder`.
- Amenities: `GET /amenities`, `POST /amenities`, `PUT /amenities/:id`.
- Favorites: `GET /favorites`, `POST /favorites/:roomId`, `DELETE /favorites/:roomId`.
- Roommate: `GET /roommate-profile`, `PUT /roommate-profile`.
- Matches: `GET /matches`, `GET /matches/:candidateId`.
- Chat: `GET/POST /conversations`, `GET/POST /conversations/:id/messages`, `PATCH /conversations/:id/read`, `DELETE /conversations/messages/:messageId`.
- Notifications: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`.
- Reports: `GET/POST /reports`.
- Admin: `GET /admin/dashboard`, `GET /admin/users`, `PATCH /admin/users/:id/status`, `GET /admin/rooms`, `PATCH /admin/rooms/:id/status`, `GET /admin/reports`, `PATCH /admin/reports/:id/status`.
- Health: `GET /health`, `/health/database`, `/health/storage`, `/health/messaging`, `/health/realtime`, `/health/cache`.

Toàn bộ schema tương tác được phục vụ tại `/api/docs`.

