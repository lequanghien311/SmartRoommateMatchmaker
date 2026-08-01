# Báo Cáo Nghiệm Thu Production Độc Lập — Phase 1 (P0)

> **Môi trường Production:** `https://app-smartroommate-ea.azurewebsites.net`  
> **Thời điểm kiểm tra:** `2026-08-01T01:43:00Z`  
> **Quy tắc tuân thủ:** Kiểm tra độc lập READ-ONLY trên Production website. Không sửa mã nguồn, không commit, không deploy, không thay đổi tài nguyên Azure.

---

## 📌 1. BÁO CÁO THÔNG SỐ WORKFLOW TRIỂN KHAI (CI/CD VERIFICATION)

| Thông Số Kiểm Tra | Giá Trị Thực Tế | Trạng Thái Xác Minh |
|---|---|:---:|
| **GitHub Actions Workflow Run ID** | `30678280045` | **VERIFIED** |
| **Workflow Status & Conclusion** | Status: `completed` / Conclusion: `success` | **VERIFIED** |
| **Deployed Commit SHA** | `bcd6bfc138bb3a718dc52cd297ea0916ae911f1e` | **VERIFIED** |
| **Production Deployment Time** | `2026-08-01T01:42:24Z` | **VERIFIED** |
| **Xác nhận Workflow Hàng đợi/Đang chạy** | **0 queued / 0 in_progress** (Tất cả 5 run gần nhất đã completed) | **VERIFIED** |

---

## 🔍 2. KẾT QUẢ NGHIỆM THU CHI TIẾT 2 DỊCH VỤ P0

### 1️⃣ Azure AI Search

- **Giao diện Frontend kiểm tra:** `/rooms`
- **Các từ khóa tìm kiếm kiểm thử:**
  1. Từ khóa `sinh viên`: Trả về `@search.score = 2.51123`, tiêu đề *"Phòng trọ sinh viên tiện nghi số 1"*.
  2. Từ khóa `Bình Thạnh`: Trả về `resultCount = 0` (Mảng trống), `fallbackUsed = false`.
  3. Từ khóa `rộng rãi`: Trả về `@search.score = 1.4204769`, tiêu đề *"Căn hộ chung cư ở ghép Quận 7"*.
- **Network Request thực tế:**
  - `GET https://app-smartroommate-ea.azurewebsites.net/api/cloud/search/rooms?q=sinh%20vi%C3%AAn`
  - `HTTP Status: 200 OK`
- **Response Evidence rút gọn:**
  ```json
  {
    "provider": "azure-ai-search",
    "source": "azure-ai-search",
    "indexName": "rooms-index",
    "documentCount": 1,
    "query": "sinh viên",
    "results": [
      {
        "@search.score": 2.51123,
        "id": "6c78d8e1-87f0-4b76-b292-badc2b30b21c",
        "title": "Phòng trọ sinh viên tiện nghi số 1"
      }
    ],
    "fallbackUsed": false
  }
  ```
- **Xác minh Provider & Fallback:**
  - `provider`: `azure-ai-search`
  - `fallbackUsed`: `false`
  - Chỉ số `@search.score` thật từ Azure AI Search SDK: `2.51123`
- **Kiểm tra Giao diện UI:**  
  Mỗi card phòng trọ hiển thị thẻ badge điểm tìm kiếm **`[🔍 2.51]`** khi tìm kiếm có từ khóa.
- **Trạng thái Nghiệm thu Azure AI Search:** **PASS**

---

### 2️⃣ Azure Web PubSub

- **Giao diện Frontend kiểm tra:** `/conversations` & `/api/conversations/pubsub-token`
- **Kiểm tra API Token:**
  - `GET https://app-smartroommate-ea.azurewebsites.net/api/conversations/pubsub-token`
  - **Kết quả thu được:** `HTTP 404` (`{"success": false, "message": "Không tìm thấy GET /api/conversations/pubsub-token"}`).
- **Phân tích Nguyên nhân Kỹ thuật (Root Cause Analysis):**
  - Trong tệp `chat.routes.js`, tuyến đường `router.get('/:id/messages', ...)` được khai báo trước hoặc khớp tuyến đường `router.get('/pubsub-token', ...)`. Do đó Express router hiểu `pubsub-token` là tham số `:id` của cuộc trò chuyện và truy vấn PostgreSQL trả về lỗi không tìm thấy ID.
  - Phía Frontend `chat.service.js` nhận lỗi 404 từ `getPubSubToken()`, tự động rơi vào khối `catch` và **chuyển hướng dự phòng sử dụng Socket.IO (`window.io`)** thay vì mở kết nối WebSocket trực tiếp tới `*.webpubsub.azure.com`.
- **Cơ chế Message hiện tại:**
  - Luồng chat chính phía người dùng hiện đang truyền phát qua Socket.IO server của Express local.
  - Azure Web PubSub đã có SDK backend và phản hồi `WORKING` tại `/cloud-services.html` (`/api/cloud/web-pubsub/status`), nhưng giao diện chat người dùng chưa kết nối được Cloud WebSocket token.
- **Trạng thái Nghiệm thu Azure Web PubSub:** **PARTIAL_CONNECTION_ONLY** *(Theo quy định nghiêm ngặt của chỉ thị nghiệm thu: Không ghi nhận PASS khi luồng chat chính chưa truyền tải message qua Azure Web PubSub WebSocket thật)*.

---

## 🧪 3. KIỂM TRA REGRESSION CÁC CHỨC NĂNG HỆ THỐNG

| Chức Năng Hệ Thống | Endpoint / Route Kiểm Tra | Kết Quả Thực Tế | Trạng Thái |
|---|---|---|:---:|
| **1. System Health** | `GET /api/health` | `HTTP 200 OK` (`status: healthy`) | **PASS** |
| **2. User Authentication** | `POST /api/auth/login` | `HTTP 200 OK` (Token được cấp cho `tenant1@smartroommate.vn`) | **PASS** |
| **3. Rooms Listing** | `GET /api/rooms` | `HTTP 200 OK` (Trả về 12 phòng trọ active) | **PASS** |
| **4. Room Detail** | `GET /api/rooms/6c78d8e1-...` | `HTTP 200 OK` (*Phòng trọ sinh viên tiện nghi số 1*) | **PASS** |
| **5. Favorites List** | `GET /api/favorites` | `HTTP 200 OK` (Trả về danh sách phòng yêu thích) | **PASS** |
| **6. Conversations List** | `GET /api/conversations` | `HTTP 200 OK` (Trả về 4 cuộc trò chuyện) | **PASS** |

---

## 📊 4. TỔNG KẾT VÀ HƯỚNG XỬ LÝ (RECOMMENDATIONS)

1. **Azure AI Search (`PASS`)**: Đã hoạt động hoàn chỉnh, kết quả tìm kiếm ngữ nghĩa hiển thị trực quan kèm badge điểm `@search.score` trên giao diện `/rooms`.
2. **Azure Web PubSub (`PARTIAL_CONNECTION_ONLY`)**: Cần điều chỉnh thứ tự khai báo route `router.get('/pubsub-token')` lên trước `router.get('/:id')` trong `chat.routes.js` ở đợt cập nhật tiếp theo để mở kết nối Cloud WebSocket hoàn chỉnh cho giao diện người dùng.

> 🛑 **XÁC NHẬN DỪNG:** Đã hoàn thành báo cáo nghiệm thu độc lập. Không sửa mã nguồn, không commit, không deploy thêm.
