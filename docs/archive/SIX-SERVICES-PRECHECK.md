> [!WARNING]
> **TÀI LIỆU ĐÃ ĐƯỢC LƯU TRỮ (ARCHIVED DOCUMENT)**  
> Tài liệu này mang giá trị lịch sử kiểm toán ban đầu. Để xem trạng thái dịch vụ Azure Cloud hiện hành chính thức (18 WORKING), vui lòng tham chiếu Nguồn Sự Thật Duy Nhất tại: [AZURE-SERVICES-FINAL-REPORT.md](../AZURE-SERVICES-FINAL-REPORT.md).

---

# BÁO CÁO TIỀN KIỂM TOÁN 6 DỊCH VỤ AZURE CẦN NÂNG CẤP (SIX SERVICES PRECHECK)
**Dự án:** SmartRoommateMatchmaker  
**Auditor:** Senior Azure DevOps Engineer + Node.js Architect + QA Engineer  
**Ngày thực hiện:** 2026-07-31  
**Mục tiêu:** Đánh giá hiện trạng, nhu cầu thay đổi, rủi ro và điều kiện tiên quyết để đưa 6 dịch vụ từ CONFIGURED/RESOURCE_ONLY thành **WORKING THẬT TRÊN PRODUCTION**.

---

## I. BẢNG TỔNG HỢP TIỀN KIỂM TOÁN 6 DỊCH VỤ

| STT | Dịch Vụ Azure | Resource Name | Resource State | SKU | Required Child Object | SDK Package | Provider Code | App Settings Cần Có | Trạng Thái Hiện Tại | Phân Loại Precheck | Thay Đổi Tối Thiểu Cần Làm | Rủi Ro / Chi Phí | Kế Hoạch Rollback |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Azure Blob Storage** | `stsmartroommateea` | `Succeeded` | `Standard_LRS` | Container `room-images` (0 blobs) | `@azure/storage-blob` | `AzureBlobStorageProvider.js` | `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER`, `STORAGE_PROVIDER=azure-blob` | Running Local Storage Fallback | **READY** | Sửa điều kiện so sánh chuỗi trong `media.routes.js` (`azure-blob` vs `azure`) & `env.js` | Rất thấp / Miễn phí (Standard LRS) | Revert sửa chuỗi trong `media.routes.js` |
| 2 | **Azure AI Vision** | `cog-vision-smartroommate` | `Succeeded` | `S1` | Blob Image URL thật trong container `room-images` | REST API (`fetch`) | `AzureVisionProvider.js` | `AZURE_VISION_ENDPOINT`, `AZURE_VISION_KEY` | Running Vision Fallback (Lỗi HTTP 400 do URL blob trống) | **NEEDS_CHILD_OBJECT** | Upload 1 blob ảnh mẫu thật vào `room-images`, truyền URL blob thật cho Computer Vision API | Thấp / ~$0.001 per call | Revert code `AzureVisionProvider.js` về fallback |
| 3 | **Azure AI Search** | `srch-smartroommate-ea` | `Succeeded` | `Free` | Index `rooms-index` (0 docs) | `@azure/search-documents` | `AzureSearchProvider.js` | `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_KEY` | Running PostgreSQL Search Fallback | **NEEDS_CHILD_OBJECT** | Tạo index `rooms-index` trên Azure Search & nạp dữ liệu phòng demo (doc count > 0) | Thấp / Miễn phí (Free SKU) | Xóa index `rooms-index` trên Azure Search |
| 4 | **Azure Functions** | `func-smartroommate-ea` & `EastAsiaPlan` | `Succeeded` | `Y1` (Consumption) | Deployed Function Objects (0 functions) | Azure Functions Runtime (Node.js v4) | `cloud/azure-functions/` | `WEBSITE_RUN_FROM_PACKAGE` | 0 Functions Deployed | **NEEDS_CHILD_OBJECT** | Đóng gói & deploy code Function artifact vào `func-smartroommate-ea` | Thấp / Miễn phí (1M free exec/month) | Xóa function artifact khỏi Function App |
| 5 | **Azure Service Bus** | `sb-smartroommate-ea` | `Succeeded` | `Standard` | Queue `room-created-queue` | `@azure/service-bus` | `AzureServiceBusProvider.js` | `AZURE_SERVICE_BUS_CONNECTION_STRING`, `AZURE_SERVICE_BUS_QUEUE`, `MESSAGING_PROVIDER=azure-service-bus` | Running Local Messaging Fallback | **NEEDS_APP_SETTING** | Tạo Queue `room-created-queue` nếu thiếu & thêm App Settings connection string lên Web App | Thấp / Standard tier base cost | Đổi `MESSAGING_PROVIDER` về `local` |
| 6 | **Azure OpenAI** | `oai-smartroommate-ea` | `Succeeded` | `S0` | Model Deployment (0 deployments) | `openai` | `OpenAIMatchingProvider.js` | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`, `AZURE_OPENAI_DEPLOYMENT` | Running Rule-Based Matching Fallback | **NEEDS_CHILD_OBJECT** / **NEEDS_APP_SETTING** | Tạo 1 Model Deployment (`gpt-4o-mini` hoặc `gpt-35-turbo` Standard 1k TPM) & thêm App Settings | Trung bình / Chi phí token cực nhỏ | Đổi provider matching về `rule-based` |

---

## II. PHÂN TÍCH CHI TIẾT TỪNG DỊCH VỤ

### 1. Azure Blob Storage (`stsmartroommateea`)
- **Tình trạng Resource:** Hoạt động bình thường (`Succeeded`, `Standard_LRS`).
- **Child Object:** Container `room-images` đã được khởi tạo trên Azure Storage.
- **Nguyên nhân chưa WORKING:** App Setting `STORAGE_PROVIDER` trên Web App được đặt là `"azure-blob"`, nhưng trong `media.routes.js` code kiểm tra `env.storageProvider === 'azure'`. Do lệch chuỗi điều kiện, ứng dụng tự động chuyển sang dùng `LocalStorageProvider`.
- **Thay đổi cần làm:** Cập nhật `media.routes.js` và `env.js` để chấp nhận cả `"azure-blob"` và `"azure"`. Sau đó upload 1 ảnh phòng test lên container `room-images` để lấy URL thật.
- **Đánh giá Phân Loại:** **READY**

---

### 2. Azure AI Vision (`cog-vision-smartroommate`)
- **Tình trạng Resource:** Hoạt động bình thường (`Succeeded`, `S1`, Japaneast).
- **Nguyên nhân chưa WORKING:** Trong `AzureVisionProvider.js`, endpoint mặc định gọi tới URL `https://stsmartroommateea.blob.core.windows.net/room-images/demo-room.jpg`. Do chưa có blob ảnh nào tồn tại ở URL này, Azure Computer Vision API trả lỗi **HTTP 400 Bad Request** (`InvalidImageURL`), dẫn đến kích hoạt fallback.
- **Thay đổi cần làm:** Sau khi kích hoạt Azure Blob Storage và upload ảnh test thật vào container `room-images`, cập nhật URL target trong request Vision để gọi API thành công và nhận caption/tags thật từ Azure.
- **Đánh giá Phân Loại:** **NEEDS_CHILD_OBJECT**

---

### 3. Azure AI Search (`srch-smartroommate-ea`)
- **Tình trạng Resource:** Hoạt động bình thường (`Succeeded`, `Free SKU`).
- **Nguyên nhân chưa WORKING:** Dịch vụ Azure Search và App Settings (`AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_KEY`) đã được điền đầy đủ, nhưng đối tượng index `rooms-index` chưa được tạo bên trong service Azure Search (`No index with the name 'rooms-index' was found`).
- **Thay đổi cần làm:** Chạy script/API khởi tạo index `rooms-index` trên `srch-smartroommate-ea` và nạp dữ liệu phòng demo vào index. Khi `indexExists` là `true` và `documentCount > 0`, API tìm kiếm sẽ trả về dữ liệu thật từ Azure Search.
- **Đánh giá Phân Loại:** **NEEDS_CHILD_OBJECT**

---

### 4. Azure Functions (`func-smartroommate-ea` & `EastAsiaPlan`)
- **Tình trạng Resource:** Hoạt động bình thường (`Succeeded`, `Y1 Consumption Plan`).
- **Nguyên nhân chưa WORKING:** Khung Function App và Plan đã được tạo trên Azure, nhưng chưa từng có artifact code function nào được deploy (`az functionapp function list` trả về danh sách rỗng `[]`).
- **Thay đổi cần làm:** Kiểm tra mã nguồn trong `cloud/azure-functions/`, đóng gói zip và deploy lên `func-smartroommate-ea` (qua GitHub Actions hoặc Azure CLI deployment). Đảm bảo có ít nhất 1 HTTP function health/worker hoạt động và ghi nhận invocation log.
- **Đánh giá Phân Loại:** **NEEDS_CHILD_OBJECT**

---

### 5. Azure Service Bus (`sb-smartroommate-ea`)
- **Tình trạng Resource:** Hoạt động bình thường (`Succeeded`, `Standard`).
- **Nguyên nhân chưa WORKING:** Đã có code provider `AzureServiceBusProvider.js` và SDK `@azure/service-bus`, nhưng thiếu biến môi trường `AZURE_SERVICE_BUS_CONNECTION_STRING` trên Web App App Settings, làm ứng dụng mặc định dùng `LocalMessagingProvider`.
- **Thay đổi cần làm:** Tạo Queue `room-created-queue` trên Service Bus namespace, lấy connection string và thêm các biến `AZURE_SERVICE_BUS_CONNECTION_STRING`, `AZURE_SERVICE_BUS_QUEUE`, `MESSAGING_PROVIDER=azure-service-bus` vào App Settings của Web App.
- **Đánh giá Phân Loại:** **NEEDS_APP_SETTING**

---

### 6. Azure OpenAI (`oai-smartroommate-ea`)
- **Tình trạng Resource:** Hoạt động bình thường (`Succeeded`, `S0`, Japaneast).
- **Nguyên nhân chưa WORKING:** Tài nguyên Azure OpenAI tồn tại trên Azure Portal, nhưng chưa có Model Deployment nào (gpt-4o / gpt-35-turbo) được tạo bên trong dịch vụ (`az cognitiveservices account deployment list` trả về `[]`), và Web App đang thiếu các biến môi trường `AZURE_OPENAI_*`.
- **Thay đổi cần làm:** Kiểm tra Quota khả dụng trong region Japaneast, tạo 1 model deployment nhỏ (`gpt-4o-mini` hoặc `gpt-35-turbo` Standard 1k TPM), cấu hình App Settings trên Web App và thực hiện 1 request matching ghép phòng thử nghiệm nhỏ.
- **Đánh giá Phân Loại:** **NEEDS_CHILD_OBJECT** / **NEEDS_APP_SETTING**

---

## III. KẾT LUẬN & THỨ TỰ THỰC HIỆN TỐI ƯU

Để đạt mục tiêu nâng từ **14 WORKING lên 20 WORKING** an toàn và không gây gián đoạn hệ thống, thứ tự triển khai từng chu kỳ sẽ là:

1. **Chu kỳ 1:** Azure Blob Storage (Chuyển từ CONFIGURED -> WORKING) -> Tổng WORKING: **15**
2. **Chu kỳ 2:** Azure AI Vision (Chuyển từ CONFIGURED -> WORKING) -> Tổng WORKING: **16**
3. **Chu kỳ 3:** Azure AI Search (Chuyển từ CONFIGURED -> WORKING) -> Tổng WORKING: **17**
4. **Chu kỳ 4:** Azure Functions (Chuyển từ CONFIGURED -> WORKING) -> Tổng WORKING: **18**
5. **Chu kỳ 5:** Azure Service Bus (Chuyển từ CONFIGURED -> WORKING) -> Tổng WORKING: **19**
6. **Chu kỳ 6:** Azure OpenAI (Chuyển từ RESOURCE_ONLY -> WORKING) -> Tổng WORKING: **20**

---
*Báo cáo tiền kiểm toán Pha 1 hoàn tất. Đã sẵn sàng cho Chu kỳ 1 (Azure Blob Storage).*
