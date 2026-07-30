# Triển khai

## Local

1. Sao chép `.env.example` thành `.env`.
2. Khởi động PostgreSQL.
3. Trong `backend`: `npm ci`, `npm run migrate`, `npm run seed`, `npm start`.
4. Kiểm tra `/api/health`, `/api/health/database`, `/api/docs`.

## Docker Compose

`docker compose up --build` dựng PostgreSQL và image production. Backend tự migration/seed sau khi DB healthy. Dừng bằng `docker compose down`; thêm `-v` chỉ khi chủ động muốn xóa dữ liệu local.

## Production

- Không dùng secret mẫu; lưu secret trong Key Vault/GitHub Environments.
- Bật TLS, PostgreSQL SSL, private networking, backup và point-in-time restore.
- Chạy migration như deployment job trước khi đổi traffic.
- Dùng Blob, Service Bus, Web PubSub, Redis và Application Insights bằng biến provider.
- Health probe cơ bản không tiết lộ secret.

Chi tiết thao tác Azure nằm ở `cloud/README-AZURE.md`.

