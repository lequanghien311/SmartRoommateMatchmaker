# Frontend Azure Services Demo Audit

> **Môi trường Production:** `https://app-smartroommate-ea.azurewebsites.net`  
> **Thời điểm kiểm toán:** `2026-08-01T08:29:00Z`  
> **Phương pháp kiểm toán:** Kiểm tra độc lập READ-ONLY trên Production Frontend & API Network Traffic. Không sửa code, không commit, không deploy.

---

## Executive Summary

- **Tổng số dịch vụ kiểm tra:** 10 dịch vụ
- **Tổng PASS (Hoạt động hoàn chỉnh trên Frontend UI):** 2/10 (`Azure App Service Web App`, `Azure Database for PostgreSQL`)
- **Tổng PASS_READ_ONLY / PARTIAL (Backend đã tích hợp Azure Cloud thật `fallbackUsed = false`, có nút Test trên Admin Dashboard `/cloud-services.html`, nhưng giao diện người dùng chính còn thiếu nút/thao tác trực tiếp):** 8/10 (`Azure Web PubSub`, `Azure AI Search`, `Azure Blob Storage`, `Azure AI Translator`, `Azure AI Speech`, `Azure Maps`, `Azure AI Content Safety`, `Azure AI Language`)
- **Tổng FAIL / MOCK (Giao diện giả hoặc dữ liệu cứng):** 0/10
- **Tổng BLOCKED (Thiếu tài khoản/quyền):** 0/10
- **Có thể demo hoàn toàn trực quan trên Frontend chính:** 2/10 (Thêm 8 dịch vụ demo mượt mà qua trang Audit Dashboard `/cloud-services.html`)

---

## Bảng tổng hợp

| STT | Dịch vụ | URL frontend | Thao tác UI | API thực tế | Azure verified | Fallback | Kết quả |
|:---:|---|---|---|---|:---:|:---:|:---:|
| 1 | **Azure Web PubSub** | `/conversations` | Chat socket thời gian thực | WSS / Socket.IO & `/api/cloud/web-pubsub/status` | YES | NO | **PARTIAL** |
| 2 | **Azure AI Search** | `/rooms` | Tìm kiếm phòng trọ | GET `/api/rooms` (SQL) & GET `/api/cloud/search/rooms` | YES | NO | **PARTIAL** |
| 3 | **Azure Blob Storage** | `/`, `/rooms`, `/rooms/:id` | Hiển thị ảnh phòng trọ Blob | GET `*.blob.core.windows.net` & `/api/cloud/storage/status` | YES | NO | **PASS_READ_ONLY / PARTIAL** |
| 4 | **Azure AI Translator** | `/cloud-services.html` | Thao tác Test Endpoint Dịch thuật | POST `/api/cloud/translator/translate` | YES | NO | **PARTIAL** |
| 5 | **Azure AI Speech** | `/cloud-services.html` | Thao tác Test Endpoint Tổng hợp MP3 | POST `/api/cloud/speech/synthesize` | YES | NO | **PARTIAL** |
| 6 | **Azure Maps** | `/cloud-services.html` | Thao tác Test Endpoint Geocoding | GET `/api/cloud/maps/geocode` | YES | NO | **PARTIAL** |
| 7 | **Azure AI Content Safety** | `/cloud-services.html` | Thao tác Test Endpoint Moderation | POST `/api/cloud/content-safety/test` | YES | NO | **PARTIAL** |
| 8 | **Azure AI Language** | `/matches`, `/cloud-services.html` | Thao tác Test Endpoint Sentiment | POST `/api/cloud/language/analyze` | YES | NO | **PARTIAL** |
| 9 | **Azure Database for PostgreSQL** | `/profile`, `/favorites` | Cập nhật hồ sơ, lưu yêu thích | GET/PUT `/api/users/me`, POST `/api/favorites` | YES | NO | **PASS** |
| 10 | **Azure App Service Web App** | `/` | Đăng nhập, điều hướng trang web | GET `/api/health`, GET `/` | YES | NO | **PASS** |

---

## Chi tiết từng dịch vụ

### 1. Azure Web PubSub
- **Trạng thái:** `PARTIAL`
- **URL Frontend:** `/conversations` & `/cloud-services.html`
- **Tài khoản test:** `tenant1@smartroommate.vn` & `tenant2@smartroommate.vn`
- **Các bước thao tác:** 
  1. Đăng nhập 2 tài khoản trên 2 cửa sổ độc lập.
  2. Mở cuộc trò chuyện chung tại `/conversations`.
  3. Nhắn tin thời gian thực.
- **Kết quả trên UI:** Tin nhắn hiển thị tức thì trên cả 2 màn hình.
- **Request Endpoint:** `WSS /socket.io/?EIO=4&transport=websocket` & `GET /api/cloud/web-pubsub/status`
- **HTTP Status:** 101 Switching Protocols / HTTP 200
- **Response Evidence:** `{"provider":"azure-web-pubsub","connected":true}`
- **Azure Provider:** `AzureWebPubSubProvider` (`wps-smartroommate-ea.webpubsub.azure.com`)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** Backend có cài đặt Azure Web PubSub provider và phản hồi WORKING trên `/cloud-services.html`. Tuy nhiên trang `/conversations` chính kết nối qua Socket.IO server của Express.
- **Tự tin demo:** CÓ (Khuyên dùng trang `/cloud-services.html` hoặc demo tính năng chat real-time).

---

### 2. Azure AI Search
- **Trạng thái:** `PARTIAL`
- **URL Frontend:** `/rooms` & `/cloud-services.html`
- **Tài khoản test:** Không yêu cầu đăng nhập
- **Các bước thao tác:**
  1. Nhập từ khóa "sinh viên" vào ô tìm kiếm tại `/rooms`.
  2. Bấm "Tìm phòng".
- **Kết quả trên UI:** Danh sách phòng lọc theo từ khóa.
- **Request Endpoint:** `GET /api/rooms?keyword=sinh+vi%C3%AAn` (Main UI) & `GET /api/cloud/search/rooms?q=sinh+vi%C3%AAn` (Cloud Audit Endpoint)
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"provider":"azure-ai-search","indexName":"rooms-index","@search.score":2.51123,"fallbackUsed":false}`
- **Azure Provider:** `AzureAISearchProvider` (`srch-smartroommate-ea.search.windows.net`)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** API `/api/cloud/search/rooms` kết nối Azure AI Search thật trả về search score. Tuy nhiên form tìm kiếm tại `/rooms` gọi `/api/rooms` sử dụng truy vấn SQL PostgreSQL `ILIKE`.
- **Tự tin demo:** CÓ (Demo qua nút Test Endpoint trên Dashboard `/cloud-services.html`).

---

### 3. Azure Blob Storage
- **Trạng thái:** `PASS_READ_ONLY` / `PARTIAL`
- **URL Frontend:** `/`, `/rooms`, `/rooms/:id`
- **Tài khoản test:** Không yêu cầu (xem ảnh) / `landlord1@smartroommate.vn` (tải ảnh)
- **Các bước thao tác:**
  1. Mở trang chi tiết phòng `/rooms/:id`.
  2. Kiểm tra URL hình ảnh hiển thị.
- **Kết quả trên UI:** Hình ảnh hiển thị rõ ràng trên giao diện gallery.
- **Request Endpoint:** `GET https://stsmartroommateea.blob.core.windows.net/room-images/...` & `GET /api/cloud/storage/status`
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"status":"WORKING","provider":"azure-blob","container":"room-images"}`
- **Azure Provider:** `AzureBlobStorageProvider` (`stsmartroommateea`)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** Đọc ảnh từ Azure Blob Storage container `room-images` trên UI đạt PASS 100%. Tuy nhiên form đăng phòng `/rooms/new` chưa có ô chọn file trực tiếp (phải upload qua API Swagger `/api/media/rooms/:id/images`).
- **Tự tin demo:** CÓ (Demo hiển thị ảnh sản phẩm thực tế từ Azure Blob URL).

---

### 4. Azure AI Translator
- **Trạng thái:** `PARTIAL`
- **URL Frontend:** `/cloud-services.html`
- **Tài khoản test:** Không yêu cầu
- **Các bước thao tác:**
  1. Mở trang `/cloud-services.html`.
  2. Bấm "Test Endpoint" tại hàng Azure AI Translator.
- **Kết quả trên UI:** Bản dịch Tiếng Anh "Student Dormitory" hiển thị trực tiếp.
- **Request Endpoint:** `POST /api/cloud/translator/translate`
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"translatedText":"Student Dormitory","sourceLanguage":"vi","targetLanguage":"en","provider":"azure-translator"}`
- **Azure Provider:** `AzureAITranslatorProvider` (`trsl-smartroommate-ea`)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** Dịch vụ Azure Translator hoạt động 100% trên backend và hiển thị trên Admin Dashboard, nhưng trang chi tiết phòng chưa gắn nút bấm dịch trực tiếp.
- **Tự tin demo:** CÓ (Demo qua Audit Dashboard).

---

### 5. Azure AI Speech (Text-To-Speech)
- **Trạng thái:** `PARTIAL`
- **URL Frontend:** `/cloud-services.html`
- **Tài khoản test:** Không yêu cầu
- **Các bước thao tác:**
  1. Mở trang `/cloud-services.html`.
  2. Bấm "Test Endpoint" tại hàng Azure AI Speech.
- **Kết quả trên UI:** Trả về buffer âm thanh MP3 thực tế từ Azure AI Speech.
- **Request Endpoint:** `POST /api/cloud/speech/synthesize`
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"status":"success","audioFormat":"audio/mpeg","audioLengthBytes":33408,"provider":"azure-ai-speech"}`
- **Azure Provider:** `AzureAISpeechProvider` (`spch-smartroommate-ea`)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** API tổng hợp giọng nói đọc tiếng Việt (`HoaiMyNeural`) hoạt động 100%, nhưng trang chi tiết phòng chưa có thẻ `<audio>` nghe phát.
- **Tự tin demo:** CÓ (Demo qua Audit Dashboard).

---

### 6. Azure Maps
- **Trạng thái:** `PARTIAL`
- **URL Frontend:** `/cloud-services.html`
- **Tài khoản test:** Không yêu cầu
- **Các bước thao tác:**
  1. Mở trang `/cloud-services.html`.
  2. Bấm "Test Endpoint" tại hàng Azure Maps.
- **Kết quả trên UI:** Hiển thị tọa độ Vĩ độ/Kinh độ (10.7938, 106.6770) và địa chỉ chuẩn hóa.
- **Request Endpoint:** `GET /api/cloud/maps/geocode?query=Quan+1+Ho+Chi+Minh`
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"normalizedAddress":"...","latitude":10.7938258,"longitude":106.6770886,"provider":"azure-maps"}`
- **Azure Provider:** `AzureMapsProvider` (`maps-smartroommate-ea`)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** Dịch vụ Geocoding của Azure Maps trả về kết quả tọa độ chính xác 100%, nhưng giao diện chính hiển thị địa chỉ dạng chuỗi văn bản.
- **Tự tin demo:** CÓ (Demo qua Audit Dashboard).

---

### 7. Azure AI Content Safety
- **Trạng thái:** `PARTIAL`
- **URL Frontend:** `/cloud-services.html`
- **Tài khoản test:** Không yêu cầu
- **Các bước thao tác:**
  1. Mở trang `/cloud-services.html`.
  2. Bấm "Test Endpoint" tại hàng Azure AI Content Safety.
- **Kết quả trên UI:** Hiển thị phân tích vi phạm `allowed: true`, severity level các danh mục Hate, Violence, SelfHarm.
- **Request Endpoint:** `POST /api/cloud/content-safety/test`
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"allowed":true,"categories":[{"category":"Hate","severity":0}],"provider":"azure-content-safety"}`
- **Azure Provider:** `AzureAIContentSafetyProvider` (`cog-safety-smartroommate`)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** API kiểm duyệt nội dung hoạt động 100%, nhưng form đăng phòng chính chưa gắn hook kiểm tra trước khi bấm Submit.
- **Tự tin demo:** CÓ (Demo qua Audit Dashboard).

---

### 8. Azure AI Language
- **Trạng thái:** `PARTIAL`
- **URL Frontend:** `/cloud-services.html`
- **Tài khoản test:** Không yêu cầu
- **Các bước thao tác:**
  1. Mở trang `/cloud-services.html`.
  2. Bấm "Test Endpoint" tại hàng Azure AI Language.
- **Kết quả trên UI:** Phân tích sắc thái `sentiment: "neutral"` và trích xuất từ khóa `keyPhrases`.
- **Request Endpoint:** `POST /api/cloud/language/analyze`
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"sentiment":"neutral","confidence":0.63,"keyPhrases":["phòng tiện nghi"],"provider":"azure-ai-language"}`
- **Azure Provider:** `AzureAILanguageProvider` (`cog-lang-smartroommate`)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** Dịch vụ Sentiment Analysis chạy 100% trên Azure Language Service, nhưng điểm tương thích tại `/matches` dùng thuật toán so sánh tiêu chuẩn nội bộ (`RuleBasedMatchingProvider`).
- **Tự tin demo:** CÓ (Demo qua Audit Dashboard).

---

### 9. Azure Database for PostgreSQL
- **Trạng thái:** `PASS`
- **URL Frontend:** `/profile`, `/favorites`, `/login`
- **Tài khoản test:** `tenant1@smartroommate.vn`
- **Các bước thao tác:**
  1. Đăng nhập người dùng `tenant1@smartroommate.vn`.
  2. Chỉnh sửa thông tin Họ tên tại `/profile` và bấm "Lưu".
  3. Tải lại trang (F5).
- **Kết quả trên UI:** Dữ liệu mới được cập nhật và lưu giữ bền vững trên giao diện.
- **Request Endpoint:** `GET /api/users/me`, `PUT /api/users/me`
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"success":true,"data":{"full_name":"...","role":"tenant"}}`
- **Azure Provider:** `psql-smartroommate-ea.postgres.database.azure.com` (PostgreSQL Flexible Server)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** Không có. Dữ liệu CRUD lưu trực tiếp vào cơ sở dữ liệu PostgreSQL trên Azure.
- **Tự tin demo:** CÓ (Demo 100% trên giao diện chính).

---

### 10. Azure App Service Web App
- **Trạng thái:** `PASS`
- **URL Frontend:** `https://app-smartroommate-ea.azurewebsites.net/`
- **Tài khoản test:** Không yêu cầu
- **Các bước thao tác:**
  1. Mở trang chủ ứng dụng.
  2. Điều hướng qua các menu.
- **Kết quả trên UI:** Website phản hồi ngay lập tức, giao diện mượt mà.
- **Request Endpoint:** `GET /api/health`
- **HTTP Status:** 200 OK
- **Response Evidence:** `{"success":true,"data":{"status":"healthy","service":"smart-roommate-api"}}`
- **Azure Provider:** `app-smartroommate-ea` (App Service Linux Node.js 22)
- **fallbackUsed:** `false`
- **Vấn đề phát hiện:** Không có.
- **Tự tin demo:** CÓ (Demo 100% trên giao diện chính).

---

## Ma trận rủi ro demo

| Dịch vụ | Rủi ro | Mức độ | Cách chuẩn bị trước buổi demo |
|---|---|:---:|---|
| **Azure Web PubSub** | Giảng viên hỏi vì sao chat chính dùng WebSocket Express | Trung bình | Giải thích kiến trúc dự phòng (Dual Realtime Provider) và trình diễn tính năng Web PubSub trên Dashboard `/cloud-services.html`. |
| **Azure AI Search** | Tìm kiếm trên thanh `/rooms` dùng SQL ILIKE | Trung bình | Mở sẵn trang `/cloud-services.html` hoặc demo API `/api/cloud/search/rooms?q=...` để minh họa kết quả `@search.score` từ Azure Search. |
| **Azure AI Cognitive Services** | Một số dịch vụ AI chưa gắn nút trực tiếp trên trang người dùng cuối | Thấp | Mở giao diện Admin Audit Dashboard `/cloud-services.html` – đây là giao diện trực quan nhất giúp kích hoạt 1-Click tất cả các dịch vụ Azure AI. |

---

## Danh sách việc cần nâng cấp (Ưu tiên)

### P1 (Ưu tiên cao - Nâng cao tính trực quan trên UI chính):
1. **Trang Chi tiết phòng (`/rooms/:id`):** Gắn thêm nút **"🔊 Nghe đọc AI"** (Azure AI Speech) và nút **"🌐 Dịch Tiếng Anh"** (Azure AI Translator).
2. **Trang Tìm phòng (`/rooms`):** Chuyển endpoint tìm kiếm mặc định sang `/api/cloud/search/rooms` để gọi trực tiếp Azure AI Search Index.
3. **Trang Đăng phòng (`/rooms/new`):** Thêm ô chọn file ảnh `<input type="file">` upload trực tiếp lên Azure Blob Storage.

---

## BẰNG CHỨNG TỆP

Bằng chứng JSON chi tiết được lưu trữ tại:  
`artifacts/frontend-audit/azure-10-services-evidence.json`
