# Smart Roommate Matchmaker

SmartRoomie là nền tảng responsive giúp sinh viên tìm phòng, lưu phòng yêu thích, tạo hồ sơ ở ghép, xem điểm tương thích minh bạch và trò chuyện thời gian thực. Chủ trọ quản lý vòng đời tin; admin kiểm duyệt phòng, người dùng và báo cáo.

## Công nghệ và kiến trúc

- Frontend: HTML5, CSS3, JavaScript ES Modules thuần, responsive từ 360px.
- Backend: Node.js LTS, Express, CommonJS, JWT, bcrypt, Multer, Socket.IO.
- Dữ liệu: PostgreSQL 16, migration SQL và seed có thể chạy lại.
- Chất lượng: Jest, Supertest, ESLint, Prettier, Swagger/OpenAPI.
- Vận hành: Docker Compose, GitHub Actions, Terraform modules, Kubernetes manifests.
- Kiến trúc: modular monolith; route → controller → service → repository; tích hợp bên ngoài đi qua provider.

## Cài và chạy local

Yêu cầu Node.js 20+ và PostgreSQL 16.

```bash
copy .env.example .env
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

Mở `http://localhost:3000`. Swagger ở `http://localhost:3000/api/docs`.

## Chạy bằng Docker

```bash
docker compose up --build
```

Compose chờ PostgreSQL healthy, chạy migration, seed và API. Website/API/Socket.IO dùng cổng `3000`; PostgreSQL dùng `5432`. Dữ liệu DB và upload nằm trong named volumes.

## Scripts

```bash
cd backend
npm run dev
npm start
npm run migrate
npm run seed
npm run lint
npm test
npm run test:watch
npm run test:coverage
npm run format
```

## Tài khoản demo

Mọi tài khoản chỉ dành cho local, mật khẩu chung: `Demo@123`.

| Vai trò | Email |
|---|---|
| Admin | `admin@smartroommate.vn` |
| Landlord | `landlord1@smartroommate.vn` |
| Landlord | `landlord2@smartroommate.vn` |
| Landlord | `landlord3@smartroommate.vn` |
| Tenant | `tenant1@smartroommate.vn` đến `tenant8@smartroommate.vn` |

## Module API

| Module | Prefix | Chức năng chính |
|---|---|---|
| Auth | `/api/auth` | đăng ký, đăng nhập, refresh, đăng xuất, đổi mật khẩu |
| Users | `/api/users` | hồ sơ công khai/cá nhân, hoạt động |
| Rooms | `/api/rooms` | CRUD, vòng đời tin, search/filter/sort/pagination |
| Media | `/api/media` | upload, xóa, ảnh bìa, thứ tự |
| Amenities | `/api/amenities` | danh sách/cache và quản trị |
| Favorites | `/api/favorites` | thêm, xóa, danh sách |
| Roommate profile | `/api/roommate-profile` | hồ sơ lối sống |
| Matching | `/api/matches` | xếp hạng và breakdown 100 điểm |
| Conversations | `/api/conversations` | hội thoại, message, read state |
| Notifications | `/api/notifications` | danh sách, badge, đọc |
| Reports | `/api/reports` | tạo và theo dõi báo cáo |
| Admin | `/api/admin` | dashboard, user, room, report moderation |
| Health | `/api/health` | API, DB, storage, messaging, realtime, cache |

## Cấu trúc chính

```text
.
├── frontend/                 # SPA vanilla, components, pages, services, utils
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── database/        # connection, migration, seed
│   │   ├── shared/          # errors, middleware, providers, responses
│   │   └── modules/         # 12 bounded modules
│   └── tests/
├── cloud/
│   ├── azure-functions/
│   ├── github-actions/
│   ├── terraform/
│   └── kubernetes/
├── docs/
├── uploads/
└── docker-compose.yml
```

## Provider local và Azure

| Capability | Local | Azure |
|---|---|---|
| Storage | `LocalStorageProvider` | `AzureBlobStorageProvider` |
| Messaging | `LocalMessagingProvider` | `AzureServiceBusProvider` |
| Realtime | `SocketIORealtimeProvider` | `AzureWebPubSubProvider` |
| Matching | `RuleBasedMatchingProvider` | `AzureOpenAIMatchingProvider` + fallback |
| Cache | `MemoryCacheProvider` | `AzureRedisProvider` |
| Logging | `ConsoleLoggerProvider` | `ApplicationInsightsProvider` |
| Notification | PostgreSQL | extension point cho Functions/Notification Hubs |

## Migration và seed

`001_initial_schema.sql` tạo 15 bảng, constraint, FK, unique và index. `npm run migrate` ghi lịch sử trong `schema_migrations`. Seed tạo 1 admin, 3 landlord, 8 tenant, 20 phòng, 8 tiện ích và 8 hồ sơ ở ghép; chạy lại không nhân đôi dữ liệu chính.

## Lỗi thường gặp

- `ECONNREFUSED 5432`: PostgreSQL chưa chạy hoặc `DATABASE_URL` sai.
- `Thiếu biến môi trường bắt buộc`: production cần `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`.
- `401`: thêm header `Authorization: Bearer <accessToken>`.
- Upload bị từ chối: chỉ JPEG/PNG/WebP, tối đa 5 MB mặc định và 10 ảnh/phòng.
- Không gửi duyệt được: phòng phải có ít nhất một ảnh.
- Socket không kết nối: truyền token qua `socket.auth.token` và kiểm tra CORS.

## Tài liệu

- [Kiến trúc](docs/architecture.md)
- [API](docs/api.md)
- [Database](docs/database.md)
- [Triển khai](docs/deployment.md)
- [Test plan](docs/test-plan.md)
- [Phân công nhóm](docs/team-work.md)
- [Azure từ số 0](cloud/README-AZURE.md)

