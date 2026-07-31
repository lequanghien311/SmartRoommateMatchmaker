# ☁️ SMART ROOMMATE MATCHMAKER — BÀI TẬP LỚN MÔN ĐIỆN TOÁN ĐÁM MÂY (IN4526)

> **Môn học:** IN4526 — Điện toán đám mây  
> **Ứng dụng:** Nền tảng Tìm phòng trọ & Ghép bạn ở thông minh cho sinh viên (SmartRoomie)  
> **Website Production:** [https://app-smartroommate-ea.azurewebsites.net](https://app-smartroommate-ea.azurewebsites.net)  
> **Trang Audit 20 Dịch vụ Cloud:** [https://app-smartroommate-ea.azurewebsites.net/cloud-services.html](https://app-smartroommate-ea.azurewebsites.net/cloud-services.html)  
> **Nguồn sự thật kiểm toán (Canonical Report):** [`docs/AZURE-SERVICES-FINAL-REPORT.md`](docs/AZURE-SERVICES-FINAL-REPORT.md)  
> **Hướng dẫn Demo trực tiếp:** [`docs/AZURE-SERVICES-DEMO.md`](docs/AZURE-SERVICES-DEMO.md)

---

## 📌 1. GIỚI THIỆU ỨNG DỤNG

**SmartRoomie** là giải pháp nền tảng web toàn diện giải quyết 2 bài toán thiết thực cho sinh viên: **Tìm phòng trọ phù hợp** và **Ghép bạn ở hợp lối sống**. 
Hệ thống được phát triển trên kiến trúc đám mây Cloud-Native (Microsoft Azure Cloud) đáp ứng khả năng mở rộng, độ tin cậy cao và an toàn bảo mật.

### ✨ Các Tính Năng Nổi Bật:
- **Đăng nhập Nhanh Đa Vai Trò (Quick Login Demo):** Hỗ trợ nút chọn 1-Click đăng nhập nhanh các vai trò Demo (Tenant 1, Tenant 2, Landlord, Admin) tại trang `/login`.
- **Tìm kiếm phòng trọ thông minh:** Bộ lọc theo khu vực, mức giá, tiện ích kết hợp công nghệ tìm kiếm siêu tốc **Azure AI Search** & **Azure Maps Geocoding**.
- **Ghép bạn ở ghép theo thuật toán lối sống:** Tính toán điểm số tương thích (100 điểm) kèm phân tích điểm chung, điểm xung đột giữa các sinh viên.
- **Trò chuyện thời gian thực (Real-time Chat):** Kết nối qua **Azure Web PubSub** cho phép chat tức thì, thông báo trạng thái online/offline.
- **AI Moderation & Đa ngôn ngữ:** Tự động lọc nội dung xấu qua **Azure AI Content Safety**, phân tích sắc thái bài viết qua **Azure AI Language**, chuyển đổi Tiếng Việt $\rightarrow$ Tiếng Anh qua **Azure AI Translator**, tổng hợp giọng nói qua **Azure AI Speech (Text-To-Speech)** và phân tích ảnh phòng trọ qua **Azure AI Vision**.

---

## ☁️ 2. DANH SÁCH 20 DỊCH VỤ AZURE CLOUD HOẠT ĐỘNG THỰC TẾ (WORKING)

Hệ thống tích hợp **20 dịch vụ Azure Cloud hoạt động thật trực tiếp (100% WORKING)**, không sử dụng dữ liệu giả (mock) hay fallback.

| STT | Tên Dịch Vụ Cloud (Azure Service) | Loại Khái Niệm / Mục Đích Sử Dụng | Trạng Thái Runtime | Bằng Chứng Chạy Thực Tế (Runtime Evidence) |
|---|---|---|:---:|---|
| 1 | **Azure App Service (Web App)** | Hosting Web App Node.js 22 Linux | **WORKING** | Phản hồi `HTTP 200` tại `/api/health` |
| 2 | **Azure App Service Plan** | Hạ tầng Compute B1 Basic hosting cho Web App | **WORKING** | Đảm bảo tài nguyên CPU/RAM vận hành ứng dụng |
| 3 | **Azure Database for PostgreSQL** | Cơ sở dữ liệu Flexible Server | **WORKING** | Truy vấn SQL dữ liệu phòng trọ, người dùng, chat |
| 4 | **Azure Storage Account (Blob Storage)** | Lưu trữ tập tin / hình ảnh phòng trọ | **WORKING** | Đọc/ghi ảnh trực tiếp container `room-images` |
| 5 | **Azure Web PubSub** | WebSocket Messaging Realtime Chat | **WORKING** | Cấp token WebSocket kết nối chat thời gian thực |
| 6 | **Application Insights** | APM Telemetry & Monitoring | **WORKING** | Thu thập log request, latency và exception |
| 7 | **Log Analytics Workspace** | Quản lý & lưu trữ log tập trung | **WORKING** | Lưu trữ telemetry từ Application Insights |
| 8 | **Azure Function App Plan** | Compute Plan Serverless (Consumption Y1) | **WORKING** | Hosting runtime cho Azure Functions |
| 9 | **Azure App Configuration** | Quản lý cấu hình ứng dụng động | **WORKING** | Đọc key `SmartRoommate:Features:CloudDemoEnabled` |
| 10 | **Azure AI Content Safety** | Kiểm duyệt nội dung mô tả tin đăng | **WORKING** | API Moderation kiểm tra vi phạm văn bản |
| 11 | **Azure AI Language** | Phân tích sắc thái (Sentiment Analysis) | **WORKING** | Phân tích thái độ tích cực/tiêu cực đánh giá |
| 12 | **Azure AI Translator** | Dịch thuật đa ngôn ngữ (Việt $\rightarrow$ Anh) | **WORKING** | Dịch thuật mô tả phòng tự động |
| 13 | **Azure AI Vision** | Phân tích hình ảnh phòng trọ | **WORKING** | Computer Vision v3.2 phân tích buffer ảnh |
| 14 | **Azure Maps** | Chuyển đổi tọa độ GPS & địa chỉ | **WORKING** | Geocoding chuyển địa chỉ thành Lat/Long |
| 15 | **Azure AI Search** | Tìm kiếm ngữ nghĩa siêu tốc | **WORKING** | Search Index `rooms-index` trả về `@search.score` |
| 16 | **Azure AI Speech** | Tổng hợp giọng nói (Text-To-Speech) | **WORKING** | Phát âm thanh MP3 mô tả phòng (HoaiMyNeural) |
| 17 | **Azure Monitor Action Group** | Nhóm nhận thông báo sự cố | **WORKING** | Alert Rule `alert-smartroommate-http5xx` |
| 18 | **Azure Function App** | Microservice Serverless độc lập | **WORKING** | Trigger `health-check` phản hồi `HTTP 200` |
| 19 | **Azure Service Bus** | Hàng đợi tin nhắn AMQP 1.0 (Message Queue)| **WORKING** | Publisher & PeekLock Event Verification |
| 20 | **Azure Key Vault** | Bảo mật Secret & Mật khẩu kết nối | **WORKING** | Managed Identity Secret Read (`demo-secret`) |

---

## 🏗️ 3. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

```text
[ Trình duyệt Client / SPA ]
         │
         ├──► Azure App Service (Node.js Express REST API) ──► PostgreSQL Flexible Server
         │         │
         │         ├──► Azure Storage Account (Blob: room-images)
         │         ├──► Azure Web PubSub (Realtime Chat WebSockets)
         │         ├──► Azure Key Vault (Managed Identity Secrets)
         │         ├──► Azure App Configuration (Dynamic Feature Flags)
         │         ├──► Azure AI Services (Vision, Search, Content Safety, Language, Translator, Speech, Maps)
         │         └──► Azure Service Bus (AMQP 1.0 Event Publishing)
         │
         ├──► Azure Function App (Serverless Microservices)
         └──► Azure Monitor & Application Insights ──► Log Analytics Workspace
```

---

## ⚡ 4. HƯỚNG DẪN DEMO NHANH CHO GIẢNG VIÊN IN4526

### 🔑 Bước 1: Thao tác Đăng nhập Nhanh 1-Click (`/login`)
Mở trang [`https://app-smartroommate-ea.azurewebsites.net/login`](https://app-smartroommate-ea.azurewebsites.net/login), chọn một trong 4 nút vai trò:
- **👤 Người thuê 1:** `tenant1@smartroommate.vn` / `Demo@123`
- **👤 Người thuê 2:** `tenant2@smartroommate.vn` / `Demo@123`
- **🏠 Chủ trọ:** `landlord1@smartroommate.vn` / `Demo@123`
- **🛡️ Quản trị viên:** `admin@smartroommate.vn` / `Demo@123`

### 📊 Bước 2: Kiểm thử Trực tiếp 20 Dịch vụ Cloud (`/cloud-services.html`)
Mở trang [`https://app-smartroommate-ea.azurewebsites.net/cloud-services.html`](https://app-smartroommate-ea.azurewebsites.net/cloud-services.html). Mỗi dịch vụ đều có nút **"Test Endpoint"** giúp gọi trực tiếp API Azure Cloud và trả về kết quả JSON thời gian thực trước mặt giảng viên.

---

## 🚀 5. CÀI ĐẶT VÀ CHẠY DỰ ÁN Ở MÔI TRƯỜNG LOCAL

### Yêu cầu môi trường:
- Node.js 20 LTS trở lên
- PostgreSQL 16
- Docker & Docker Compose (Tùy chọn)

### Chạy trực tiếp qua Node.js:
```bash
# 1. Clone repository
git clone https://github.com/lequanghien311/SmartRoommateMatchmaker.git
cd SmartRoommateMatchmaker

# 2. Tạo file cấu hình môi trường
copy .env.example .env

# 3. Cài đặt dependencies và khởi tạo DB
cd backend
npm install
npm run migrate
npm run seed

# 4. Khởi chạy server development
npm run dev
```
Mở trình duyệt tại `http://localhost:3000`. Tài liệu API Swagger tại `http://localhost:3000/api/docs`.

### Chạy bằng Docker Compose:
```bash
docker compose up --build
```

---

## 🛡️ 6. CAM KẾT BẢO MẬT & QUY ĐỊNH HỌC VỤ
- 🔒 **Không hardcode secret:** Tất cả Secret Key, Mật khẩu DB và API Token được bảo mật qua biến môi trường hoặc **Azure Key Vault (Managed Identity)**.
- 📜 **Đã kiểm toán & nghiệm thu:** Hệ thống vượt qua 100% các bài test tự động (`npm test`) và kiểm tra chuẩn cú pháp (`npm run lint`).
