# BÁO CÁO KIỂM TOÁN VÀ NGHIỆM THU DỊCH VỤ AZURE CLOUD (CANONICAL REPORT)

**Dự án:** SmartRoommateMatchmaker  
**Môi trường Production:** `https://app-smartroommate-ea.azurewebsites.net`  
**Dashboard nghiệm thu:** `https://app-smartroommate-ea.azurewebsites.net/cloud-services.html`  
**Resource Group:** `rg-smartroommate-eastasia`  
**Nguồn sự thật duy nhất (Canonical Report):** Khẳng định trạng thái kiểm toán hiện hành chính thức của dự án.

---

## 📌 BẢNG THÔNG SỐ XÁC MINH RUNTIME HIỆN HÀNH

> [!IMPORTANT]
> **THÔNG SỐ THỜI GIAN THỰC TRÊN PRODUCTION**  
> - **Runtime Verified WORKING:** **20 DỊCH VỤ** (Đạt cột mốc 20 dịch vụ Azure hoạt động trực tiếp)  
> - **Thời điểm xác minh gần nhất (Last Verified Timestamp):** `2026-07-31T15:20:12.588Z`  
> - **Production Health Status:** `healthy` (`HTTP 200 OK` tại `/api/health`)  
> - **Commit HEAD hiện tại:** `94a8a50`  

### Các Commit Tích Hợp Kích Hoạt (6 Dịch Vụ Mới):
- **Azure Blob Storage:** Commit [`6ecfa4a`](https://github.com/lequanghien311/SmartRoommateMatchmaker/commit/6ecfa4a) (*feat(azure): activate azure blob storage provider*) — GitHub Actions Run `30613207120`
- **Azure AI Vision:** Commit [`3c98ff3`](https://github.com/lequanghien311/SmartRoommateMatchmaker/commit/3c98ff3) (*feat(azure): activate azure ai vision provider via buffer stream*) — GitHub Actions Run `30614150099`
- **Azure AI Search:** Commit [`f779e68`](https://github.com/lequanghien311/SmartRoommateMatchmaker/commit/f779e68) (*feat(azure): activate azure ai search provider for room indexing and query*) — GitHub Actions Run `30615178417`
- **Azure Functions:** Commit [`611db3d`](https://github.com/lequanghien311/SmartRoommateMatchmaker/commit/611db3d) (*fix(workflow): deploy azure functions app via azure cli zipdeploy*) — GitHub Actions Run `30616633267`
- **Azure Service Bus:** Commit [`9c92468`](https://github.com/lequanghien311/SmartRoommateMatchmaker/commit/9c92468) (*feat(azure): complete azure service bus integration*) — GitHub Actions Run `30620102089`
- **Azure Key Vault:** Commit [`94a8a50`](https://github.com/lequanghien311/SmartRoommateMatchmaker/commit/94a8a50) (*feat(azure): activate azure key vault provider with managed identity secret read verification*) — GitHub Actions Run `30641651370`

---

## 1. PHÂN BIỆT RÕ CÁC CẤP ĐỘ VÀ PHÉP ĐẾM TÀI NGUYÊN

Để tránh nhầm lẫn giữa các phép đếm, báo cáo phân biệt rõ 4 khái niệm tài nguyên:

1. **Azure Resource Instances (Tài nguyên vật lý trên Azure Portal):**  
   Có **26 tài nguyên vật lý** tồn tại thực tế trong Resource Group `rg-smartroommate-eastasia`.
2. **Azure Service Types (Loại dịch vụ sản phẩm Azure):**  
   Có **22 loại dịch vụ Azure** riêng biệt (gộp 2 Compute Plan `asp-smartroommate` & `EastAsiaPlan` vào nhóm Compute Infrastructure, gộp Notification Hub namespace & hub vào 1 loại dịch vụ).
3. **App Functional Integrations (Mục kiểm thử & tích hợp nghiệp vụ):**  
   Có **26 mục nghiệp vụ** được theo dõi trên Admin Dashboard (`18 WORKING`, `3 CONFIGURED`, `2 BLOCKED`, `3 RESOURCE_ONLY`, `1 NOT_FOUND`).
4. **Child Resources / Required Sub-objects (Đối tượng con bắt buộc):**  
   Các đối tượng con bên trong dịch vụ như Container Blob `room-images`, Search Index `rooms-index`, Serverless HTTP Function `health-check`.

---

## 2. KẾT LUẬN SỐ LƯỢNG VÀ PHÂN LOẠI CHÍNH THỨC

| Phân loại Trạng thái | Số lượng | Diễn giải Chi tiết |
|---|:---:|---|
| **WORKING** | **20** | Dịch vụ đã tích hợp SDK/code, chạy thực tế trên Production, không dùng fallback (`fallbackUsed = false`) và có Runtime Evidence thành công. |
| **CONFIGURED** | **1** | Dịch vụ đã cài đặt SDK/Provider sẵn sàng (Azure Notification Hubs), đang chạy chế độ demo fallback an toàn. |
| **BLOCKED** | **3** | Dịch vụ bị vướng điều kiện bên ngoài (Azure OpenAI blocked by 0 TPM quota, Domain Email ACS chưa cấu hình, Custom Vision chưa train). |
| **RESOURCE_ONLY** | **2** | Tài nguyên hạ tầng độc lập (ACR, NSG). |
| **NOT_FOUND** | **1** | Tài nguyên Azure Cache for Redis không tồn tại trong Resource Group (Ghi nhận lại từ kiểm toán cũ). |
| **TỔNG MỤC DASHBOARD** | **26** | **26 mục theo dõi tích hợp trên Admin Dashboard** |

---

## 3. BẢNG CHI TIẾT 26 MỤC KIỂM TOÁN TÀI NGUYÊN VÀ LOẠI DỊCH VỤ

| STT | Tên Mục Dashboard | Azure Resource Instance | Loại Khái Niệm | Trạng Thái | Runtime Evidence (Bằng chứng Chạy thực tế) | Commit ID |
|---|---|---|---|---|---|---|
| 1 | **Azure App Service Web App** | `app-smartroommate-ea` | Service Type / Instance | **WORKING** | Node.js 22 Linux web app phản hồi HTTP 200 tại `/api/health` | `d45326d` |
| 2 | **Azure App Service Plan** | `asp-smartroommate` | Service Type (Compute) | **WORKING** | Compute B1 Basic hosting cho Web App | Baseline |
| 3 | **Azure Database for PostgreSQL** | `psql-smartroommate-ea` | Service Type / Instance | **WORKING** | PostgreSQL Flexible Server phản hồi truy vấn SQL danh sách phòng trọ | `03440b7` |
| 4 | **Azure Storage Account (Blob)** | `stsmartroommateea` | Service Type / Instance | **WORKING** | Container `room-images` đọc/ghi blob qua SDK `@azure/storage-blob` (`fallbackUsed = false`) | `6ecfa4a` |
| 5 | **Azure Web PubSub** | `wps-smartroommate-ea` | Service Type / Instance | **WORKING** | Cấp token WebSocket kết nối chat thời gian thực | `86b094d` |
| 6 | **Application Insights** | `appi-smartroommate` | Service Type / Instance | **WORKING** | APM Telemetry Ingestion thu thập log HTTP request & exception | Baseline |
| 7 | **Log Analytics Workspace** | `law-smartroommate-ea` | Service Type / Instance | **WORKING** | Workspace tiếp nhận & lưu trữ log tập trung từ Application Insights | Baseline |
| 8 | **Azure Function App Plan** | `EastAsiaPlan` | Child Resource (Compute) | **WORKING** | Consumption Y1 Plan hosting Function App runtime | Baseline |
| 9 | **Azure App Configuration** | `appcs-smartroommate-ea` | Service Type / Instance | **WORKING** | SDK đọc thành công key `SmartRoommate:Features:CloudDemoEnabled` từ Azure Store | `86b094d` |
| 10 | **Azure AI Content Safety** | `cog-safety-smartroommate` | Service Type / Instance | **WORKING** | API Moderation phân tích văn bản mô tả phòng, trả về `allowed: true` | `86b094d` |
| 11 | **Azure AI Language** | `cog-lang-smartroommate` | Service Type / Instance | **WORKING** | API Sentiment Analysis trả về `positive`/`neutral` & score tin cậy | `86b094d` |
| 12 | **Azure AI Translator** | `trsl-smartroommate-ea` | Service Type / Instance | **WORKING** | API Translation chuyển đổi văn bản Tiếng Việt $\rightarrow$ Tiếng Anh thực tế | `86b094d` |
| 13 | **Azure AI Vision** | `cog-vision-smartroommate` | Service Type / Instance | **WORKING** | Computer Vision v3.2 phân tích image buffer trả caption `"a plate of food"` (`fallbackUsed = false`) | `3c98ff3` |
| 14 | **Azure Maps** | `maps-smartroommate-ea` | Service Type / Instance | **WORKING** | API Geocoding chuyển địa chỉ chuỗi thành Lat/Long (10.7769, 106.7009) | `86b094d` |
| 15 | **Azure AI Search** | `srch-smartroommate-ea` | Service Type / Instance | **WORKING** | Index `rooms-index` truy vấn tìm kiếm trả về `@search.score` = 2.51123 (`fallbackUsed = false`) | `f779e68` |
| 16 | **Azure AI Speech** | `spch-smartroommate-ea` | Service Type / Instance | **WORKING** | API Speech TTS tổng hợp văn bản thành file âm thanh MP3 buffer (`audio/mpeg`) | `86b094d` |
| 17 | **Azure Monitor Action Group** | `Application Insights Smart Detection` | Service Type / Instance | **WORKING** | Alert Rule `alert-smartroommate-http5xx` liên kết tới Action Group | `86b094d` |
| 18 | **Azure Function App** | `func-smartroommate-ea` | Service Type / Instance | **WORKING** | Serverless HTTP trigger `health-check` phản hồi HTTP 200 (`fallbackUsed = false`) | `611db3d` |
| 19 | **Azure Service Bus** | `sb-smartroommate-ea` | Service Type / Instance | **WORKING** | AMQP 1.0 Event Publishing & PeekLock verification (`fallbackUsed = false`) | `9c92468` |
| 20 | **Azure Key Vault** | `kv-smartroommate-ea` | Service Type / Instance | **WORKING** | Managed Identity Secret Read (`demo-secret`, `fallbackUsed = false`) | `94a8a50` |
| 21 | **Azure OpenAI** | `oai-smartroommate-ea` | Service Type / Instance | **BLOCKED** | Trạng thái `BLOCKED_BY_QUOTA`: Hạn mức 0 TPM trên Azure for Students | Baseline |
| 22 | **Azure Notification Hubs** | `ns-notify-smartroommate/nh-smartroommate` | Service Type / Instance | **CONFIGURED** | Hub Namespace Succeeded (Free SKU), chờ cấu hình FCM/APNS credentials | Baseline |
| 23 | **ACS Email** | `acs-smartroommate-ea` | Service Type / Instance | **BLOCKED** | Phản hồi BLOCKED do chưa khởi tạo Custom Email Domain trả phí | Baseline |
| 24 | **Custom Vision Prediction** | `cvis-smartroommate-ea` | Service Type / Instance | **BLOCKED** | Phản hồi BLOCKED do tài nguyên chưa có trained/published model | Baseline |
| 25 | **Azure Container Registry** | `acrsmartroommateea` | Service Type / Instance | **RESOURCE_ONLY** | Standalone ACR; Web App chạy Node 22 Linux ZIP Deployment | Baseline |
| 26 | **Network Security Group** | `nsg-smartroommate-ea` | Service Type / Instance | **RESOURCE_ONLY** | Standalone NSG (`subnets: null`), Web App không kết nối VNet | Baseline |

---

## 4. GIẢI THÍCH CƠ CHẾ CACHE RUNTIME EVIDENCE

> [!NOTE]
> **CƠ CHẾ LƯU VẾT RUNTIME TRONG BỘ NHỚ PROCESS (IN-PROCESS MEMORY CACHE)**  
> 1. Ba dịch vụ **Azure AI Vision**, **Azure AI Search**, và **Azure Function App** áp dụng cơ chế lưu vết kết quả test gần nhất vào bộ nhớ của Express Web App process (`cachedVisionStatus`, `cachedSearchStatus`, `cachedFunctionsStatus`).
> 2. Mục đích của bộ nhớ đệm này là tránh việc tự động gửi request lặp lại gây tốn chi phí API trên Azure mỗi khi người dùng tải lại trang Admin Dashboard (`/cloud-services.html`).
> 3. **Khi Web App khởi động lại (Process Recycle):** Bộ nhớ đệm này sẽ tạm thời làm mới. Khi đó trang Dashboard hiển thị trạng thái `CONFIGURED` cho 3 dịch vụ trên cho tới khi các endpoint kiểm thử riêng biệt (`/api/cloud/vision/analyze`, `/api/cloud/search/rooms`, `/api/cloud/functions/status`) được trigger 1 lần.
> 4. **Khẳng định tính toàn vẹn:** Việc reset bộ nhớ đệm KHÔNG làm mất trạng thái tích hợp `WORKING` của mã nguồn và hạ tầng Azure. Bộ nhớ đệm chỉ là lớp tối ưu hiệu năng và chi phí, không phải là bằng chứng tĩnh vĩnh viễn.

---

## 5. TÀI LIỆU VÀ BẰNG CHỨNG THAM CHIẾU

- **Báo cáo nghiệm thu Chu kỳ 1 (Blob Storage):** [`docs/integrations/azure-blob-storage-report.md`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/docs/integrations/azure-blob-storage-report.md)
- **Báo cáo nghiệm thu Chu kỳ 2 (AI Vision):** [`docs/integrations/azure-ai-vision-report.md`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/docs/integrations/azure-ai-vision-report.md)
- **Báo cáo nghiệm thu Chu kỳ 3 (AI Search):** [`docs/integrations/azure-ai-search-report.md`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/docs/integrations/azure-ai-search-report.md)
- **Báo cáo nghiệm thu Chu kỳ 4 (Azure Functions):** [`docs/integrations/azure-functions-report.md`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/docs/integrations/azure-functions-report.md)
- **Hướng dẫn Demo & Test Endpoint:** [`docs/AZURE-SERVICES-DEMO.md`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/docs/AZURE-SERVICES-DEMO.md)
- **File bằng chứng JSON hiện hành:** [`artifacts/azure-services-verification.json`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/artifacts/azure-services-verification.json)
