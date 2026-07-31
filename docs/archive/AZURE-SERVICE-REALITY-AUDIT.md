> [!WARNING]
> **TÀI LIỆU ĐÃ ĐƯỢC LƯU TRỮ (ARCHIVED DOCUMENT)**  
> Tài liệu này mang giá trị lịch sử kiểm toán ban đầu. Để xem trạng thái dịch vụ Azure Cloud hiện hành chính thức (18 WORKING), vui lòng tham chiếu Nguồn Sự Thật Duy Nhất tại: [AZURE-SERVICES-FINAL-REPORT.md](../AZURE-SERVICES-FINAL-REPORT.md).

---

# BÁO CÁO KIỂM TOÁN THỰC TẾ DỊCH VỤ AZURE CLOUD (REALITY AUDIT)
**Hệ thống:** SmartRoommateMatchmaker  
**Auditor:** Senior Azure Cloud Auditor + Node.js Architect + QA Engineer  
**Thời gian kiểm toán:** 2026-07-31  
**Resource Group:** `rg-smartroommate-eastasia`  
**Production Web App:** `app-smartroommate-ea` (`https://app-smartroommate-ea.azurewebsites.net`)  

---

## I. TỔNG QUAN VÀ BẢNG KẾT LUẬN CHÍNH THỨC

### 1. Bảng Kiểm Toán Chi Tiết Dịch Vụ Azure (Master Audit Table)

| STT | Azure Service | Resource Name | Exists | SDK / Package | Integration File | Production App Setting | Required Child Object | Runtime Evidence | Fallback Used | Final Status | Lý Do Chi Tiết |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Azure Database for PostgreSQL Flexible Server | `psql-smartroommate-ea` | Có | `pg` | `backend/src/database/connection.js` | `DATABASE_URL` | DB `smart_roommate` & bảng dữ liệu | HTTP 200 từ `/api/rooms` trả dữ liệu phòng thật từ SQL | Không | **WORKING** | Server chạy, kết nối DB thật, có seed data, API SQL trả dữ liệu hoạt động bình thường |
| 2 | Azure App Service Web App | `app-smartroommate-ea` | Có | Express 5 / Node 22 | `backend/src/server.js` | `NODE_ENV`, `WEBSITE_NODE_DEFAULT_VERSION` | Express App Deployment | HTTP 200 từ `/api/health` trả `status: healthy` | Không | **WORKING** | Web App chạy trực tiếp trên Linux Node.js 22 runtime |
| 3 | Azure App Service Plan | `asp-smartroommate` | Có | Infrastructure | `cloud/main.bicep` | N/A (Compute Plan) | Web App `app-smartroommate-ea` | Đang gánh tải cho `app-smartroommate-ea` ở SKU B1 | Không | **WORKING** | Hạ tầng tính toán (Compute Infrastructure) đang phục vụ Web App production |
| 4 | Application Insights | `appi-smartroommate` | Có | `applicationinsights` | `backend/src/shared/providers/logger/ApplicationInsightsProvider.js` | `APPLICATIONINSIGHTS_CONNECTION_STRING` | Telemetry Channel | SDK kết nối thành công, ghi nhận request/trace log tự động | Không | **WORKING** | APM SDK khởi tạo và đẩy telemetry trực tiếp về Azure App Insights |
| 5 | Log Analytics Workspace | `law-smartroommate-ea` | Có | Log Analytics | `cloud/main.bicep` | N/A (Linked via App Insights) | App Insights Linkage | Lưu trữ log tập trung từ `appi-smartroommate` | Không | **WORKING** | Workspace liên kết trực tiếp với App Insights lưu vết dữ liệu log |
| 6 | Azure App Configuration | `appcs-smartroommate-ea` | Có | `@azure/app-configuration` | `backend/src/shared/providers/cloud/AzureAppConfigProvider.js` | `AZURE_APPCONFIG_CONNECTION_STRING` | Key `SmartRoommate:Features:CloudDemoEnabled` | GET `/api/cloud/app-configuration/status` -> `keyLoaded: true` | Không | **WORKING** | Đọc key thật từ Azure App Config thành công qua SDK |
| 7 | Azure AI Content Safety | `cog-safety-smartroommate` | Có | `@azure-rest/ai-content-safety` | `backend/src/shared/providers/cloud/AzureContentSafetyProvider.js` | `AZURE_CONTENT_SAFETY_ENDPOINT`, `AZURE_CONTENT_SAFETY_KEY` | Text Moderation API | POST `/api/cloud/content-safety/test` -> APIM Request ID `a09cd3d8-e35e-4173-8a6d-8230b42c0034` | Không | **WORKING** | Kiểm duyệt nội dung gọi API Azure thật, trả requestId & danh mục kiểm duyệt |
| 8 | Azure AI Language | `cog-lang-smartroommate` | Có | REST API (`fetch`) | `backend/src/shared/providers/cloud/AzureLanguageProvider.js` | `AZURE_LANGUAGE_ENDPOINT`, `AZURE_LANGUAGE_KEY` | Sentiment Analysis Endpoint | POST `/api/cloud/language/analyze` -> `sentiment: positive`, `confidence: 0.9` | Không | **WORKING** | Phân tích sắc thái văn bản gọi Azure Text Analytics API thật thành công |
| 9 | Azure AI Translator | `trsl-smartroommate-ea` | Có | REST API (`fetch`) | `backend/src/shared/providers/cloud/AzureTranslatorProvider.js` | `AZURE_TRANSLATOR_ENDPOINT`, `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION` | Text Translation API | POST `/api/cloud/translator/translate` -> `Nice hostel room near the university` | Không | **WORKING** | Dịch thuật đa ngôn ngữ (VI -> EN) qua Azure Translator v3.0 REST API thật |
| 10 | Azure Maps | `maps-smartroommate-ea` | Có | REST API (`fetch`) | `backend/src/shared/providers/cloud/AzureMapsProvider.js` | `AZURE_MAPS_KEY` | Geocoding API Account | GET `/api/cloud/maps/geocode` -> `lat: 10.7938258`, `lon: 106.6770886` | Không | **WORKING** | Geocoding địa chỉ Việt Nam thành tọa độ GPS thật qua Azure Maps Search API |
| 11 | Azure AI Speech | `spch-smartroommate-ea` | Có | REST API (`fetch`) | `backend/src/shared/providers/cloud/AzureSpeechProvider.js` | `AZURE_SPEECH_ENDPOINT`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | TTS Audio Output | POST `/api/cloud/speech/synthesize` -> `audioFormat: audio/mpeg`, 32KB MP3 | Không | **WORKING** | Chuyển đổi văn bản thành giọng nói (TTS) sinh file MP3 âm thanh thật từ Azure |
| 12 | Azure Web PubSub | `wps-smartroommate-ea` | Có | `@azure/web-pubsub` | `backend/src/modules/chat/providers/AzureWebPubSubProvider.js` | `AZURE_WEB_PUBSUB_CONNECTION_STRING`, `AZURE_WEB_PUBSUB_HUB`, `REALTIME_PROVIDER=azure-web-pubsub` | Hub `chat` | WebPubSubServiceClient kết nối hub `chat`, `REALTIME_PROVIDER` active trên production | Không | **WORKING** | Mạng WebSocket thời gian thực hoạt động thật với hub `chat` |
| 13 | Azure Monitor Metric Alert Rule | `alert-smartroommate-http5xx` | Có | Azure Monitor Alert | `cloud/main.bicep` | Target `app-smartroommate-ea` | Criterion `Http5xx > 5` | Rule enabled `true`, window PT5M, liên kết Web App | Không | **WORKING** | Quy tắc cảnh báo lỗi HTTP 5xx đã kích hoạt và theo dõi Web App production |
| 14 | Azure Monitor Action Group | `Application Insights Smart Detection` | Có | Action Group | `cloud/main.bicep` | Linked in Alert Rule | Alert Rule Linkage | Được tham chiếu trực tiếp trong `alert-smartroommate-http5xx` | Không | **WORKING** | Nhóm hành động cảnh báo liên kết chặt chẽ với quy tắc Metric Alert |
| 15 | Azure Storage Account (Blob Storage) | `stsmartroommateea` | Có | `@azure/storage-blob` | `backend/src/shared/providers/storage/AzureBlobStorageProvider.js` | `AZURE_STORAGE_CONNECTION_STRING`, `STORAGE_PROVIDER=azure-blob` | Container `room-images` (0 blobs) | Container tồn tại nhưng `STORAGE_PROVIDER` so sánh chuỗi lệch (`azure-blob` vs `azure`) gây fallback local | Có | **CONFIGURED** | Container & connection string đã cấu hình, nhưng code production lệch chuỗi điều kiện nên đang fallback lưu ảnh local |
| 16 | Azure AI Search | `srch-smartroommate-ea` | Có | `@azure/search-documents` | `backend/src/shared/providers/cloud/AzureSearchProvider.js` | `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_KEY` | Index `rooms-index` (THIẾU) | GET `/api/cloud/search/status` -> `indexExists: false`, fallback sang PostgreSQL | Có | **CONFIGURED** | Dịch vụ và key có sẵn nhưng chưa tạo index `rooms-index` bên trong, production dùng PostgreSQL fallback |
| 17 | Azure Service Bus | `sb-smartroommate-ea` | Có | `@azure/service-bus` | `backend/src/shared/providers/messaging/AzureServiceBusProvider.js` | Missing `AZURE_SERVICE_BUS_CONNECTION_STRING` | Queue | Code provider đã viết, nhưng thiếu App Setting connection string nên fallback local | Có | **CONFIGURED** | Hàng chờ Service Bus có resource & code SDK nhưng thiếu biến môi trường connection string trên Web App |
| 18 | Azure AI Vision | `cog-vision-smartroommate` | Có | REST API (`fetch`) | `backend/src/shared/providers/cloud/AzureVisionProvider.js` | `AZURE_VISION_ENDPOINT`, `AZURE_VISION_KEY` | Computer Vision Endpoint | POST `/api/cloud/vision/analyze` trả HTTP 400 (do URL blob mẫu chưa có ảnh) -> fallback | Có | **CONFIGURED** | Resource & Key có sẵn, nhưng API trả 400 do blob mẫu trống, làm kích hoạt fallback mô phỏng |
| 19 | Azure Notification Hubs | `ns-notify-smartroommate/nh-smartroommate` | Có | REST API / SDK | `backend/src/modules/cloud/cloud.routes.js` | Missing `NOTIFICATION_HUB_*` | Hub `nh-smartroommate` | Endpoint `/api/cloud/notifications/status` trả status `CONFIGURED` | Có | **CONFIGURED** | Resource Namespace & Hub tồn tại nhưng chưa có credential FCM/APNS mobile |
| 20 | Azure Function App & Plan | `func-smartroommate-ea` & `EastAsiaPlan` | Có | Azure Functions Runtime | `cloud/main.bicep` | `WEBSITE_RUN_FROM_PACKAGE` | Deployed Functions (0 functions) | `az functionapp function list` trả `[]` (0 function) | N/A | **CONFIGURED** | Host Function App & Plan Y1 đã khởi tạo nhưng chưa deploy code function thực tế |
| 21 | Azure OpenAI | `oai-smartroommate-ea` | Có | `openai` | `backend/src/modules/matching/` | Missing `AZURE_OPENAI_*` | Model Deployments (0 deployments) | `az cognitiveservices account deployment list` trả `[]`, matching dùng rule-based | Có | **RESOURCE_ONLY** | Resource OpenAI tồn tại trên Portal nhưng 0 model deployment (gpt-4o) & thiếu App Settings |
| 22 | Azure Container Registry | `acrsmartroommateea` | Có | Docker / Registry | `Dockerfile` | N/A (Web App dùng ZIP deploy) | Repository / Image Tag | Web App deploy qua GitHub Actions ZIP artifact OIDC, không pull image từ ACR | N/A | **RESOURCE_ONLY** | Registry tồn tại độc lập, không được Web App hay pipeline deployment sử dụng |
| 23 | Azure Key Vault | `kv-smartroommate-ea` | Có | None | `cloud/main.bicep` | N/A | Secret Metadata | Web App đọc biến trực tiếp từ App Settings, không kết nối Key Vault | N/A | **RESOURCE_ONLY** | Resource Key Vault tồn tại trên Portal nhưng code backend và Web App không truy vấn secret từ Key Vault |
| 24 | Network Security Group | `nsg-smartroommate-ea` | Có | N/A | `cloud/main.bicep` | N/A | Subnet / NIC Association | `subnets: null, nics: null` (Không gắn vào subnet/VNet nào) | N/A | **RESOURCE_ONLY** | NSG được tạo nhưng đứng độc lập, không nằm trên đường mạng của Web App hay Database |
| 25 | Azure Communication Services Email | `acs-smartroommate-ea` | Có | None | `backend/src/modules/cloud/cloud.routes.js` | Missing `ACS_EMAIL_*` | Email Domain & Sender Identity | POST `/api/cloud/email/send-test` -> trả `status: BLOCKED` | N/A | **BLOCKED** | Chưa cấu hình Email Domain / Sender Identity (chặn theo nguyên tắc kiểm soát chi phí) |
| 26 | Azure Custom Vision Prediction | `cvis-smartroommate-ea` | Có | None | `backend/src/modules/cloud/cloud.routes.js` | Missing `CUSTOM_VISION_*` | Trained Iteration Model | GET `/api/cloud/custom-vision/status` -> trả `status: BLOCKED / RESOURCE_ONLY` | N/A | **BLOCKED** | Resource Prediction tồn tại nhưng chưa được train/publish model (Iteration) nào |
| 27 | Azure Cache for Redis | N/A | **Không** | `ioredis` | `backend/src/shared/providers/cache/AzureRedisProvider.js` | Missing `AZURE_REDIS_CONNECTION_STRING` | N/A | Resource không có trong RG `rg-smartroommate-eastasia`, runtime dùng MemoryCache | Có | **NOT_FOUND** | Code có provider `AzureRedisProvider.js` nhưng không hề có resource Redis nào trên Azure RG |

---

## II. KẾT QUẢ PHÂN LOẠI & THỐNG KÊ CHI TIẾT

```text
Azure Resource Instances: 29
Azure Service Types: 23

WORKING: 14
CONFIGURED: 6
RESOURCE_ONLY: 4
BLOCKED: 2
FAILED: 0
NOT_FOUND: 1
UNVERIFIED: 0

Website đang thực sự sử dụng được: 14 dịch vụ.
Đã triển khai hoặc cấu hình nhưng chưa có runtime evidence đầy đủ: 6 dịch vụ.
Chỉ mới tạo resource: 4 dịch vụ.
```

---

## III. DANH SÁCH CHI TIẾT THEO PHÂN LOẠI

### 1. Danh Sách Dịch Vụ WORKING (14 Dịch Vụ)
Các dịch vụ này **tồn tại trên Azure ARM, có SDK/Provider trong code, có App Settings tương ứng, có đối tượng dữ liệu cần thiết và có bằng chứng runtime thực tế (Response HTTP 200, API response thật từ Azure, telemetry thật)** mà không dùng fallback:

1. **Azure Database for PostgreSQL Flexible Server** (`psql-smartroommate-ea`) - Cơ sở dữ liệu quan hệ lưu trữ phòng trọ và sinh viên.
2. **Azure App Service Web App** (`app-smartroommate-ea`) - Hosting máy chủ ứng dụng Node.js 22 Linux.
3. **Azure App Service Plan** (`asp-smartroommate`) - Hạ tầng tính toán Compute B1 Tier phục vụ Web App.
4. **Application Insights** (`appi-smartroommate`) - Dịch vụ giám sát ứng dụng APM & Telemetry logging.
5. **Log Analytics Workspace** (`law-smartroommate-ea`) - Kho lưu trữ log tập trung liên kết với App Insights.
6. **Azure App Configuration** (`appcs-smartroommate-ea`) - Quản lý cấu hình tập trung và Feature Flag.
7. **Azure AI Content Safety** (`cog-safety-smartroommate`) - Kiểm duyệt nội dung bài đăng phòng trọ chống ngôn từ vi phạm.
8. **Azure AI Language** (`cog-lang-smartroommate`) - Phân tích sắc thái (Sentiment Analysis) đánh giá phòng trọ.
9. **Azure AI Translator** (`trsl-smartroommate-ea`) - Dịch thuật tự động mô tả phòng trọ đa ngôn ngữ.
10. **Azure Maps** (`maps-smartroommate-ea`) - Geocoding chuyển đổi địa chỉ thành tọa độ GPS bản đồ.
11. **Azure AI Speech** (`spch-smartroommate-ea`) - Tổng hợp giọng nói (Text-To-Speech) đọc mô tả phòng trọ (file MP3 thật).
12. **Azure Web PubSub** (`wps-smartroommate-ea`) - Hạ tầng WebSocket thời gian thực cho tính năng Chat ghép phòng.
13. **Azure Monitor Metric Alert Rule** (`alert-smartroommate-http5xx`) - Quy tắc cảnh báo lỗi HTTP 5xx tự động.
14. **Azure Monitor Action Group** (`Application Insights Smart Detection`) - Nhóm hành động xử lý thông báo sự cố.

---

### 2. Danh Sách Dịch Vụ CONFIGURED (6 Dịch Vụ)
Các dịch vụ đã tạo resource và có code/provider nhưng chưa đủ điều kiện tính là WORKING do thiếu child object, lỗi tham số hoặc đang chạy fallback local:

1. **Azure Storage Account (Blob Storage)** (`stsmartroommateea`) - Container `room-images` tồn tại nhưng lệch chuỗi so sánh `STORAGE_PROVIDER` (`azure-blob` vs `azure`), làm runtime rơi vào fallback `LocalStorageProvider`. Container hiện chứa 0 blobs.
2. **Azure AI Search** (`srch-smartroommate-ea`) - Resource & Keys tồn tại nhưng chưa khởi tạo index `rooms-index` bên trong, runtime tự động fallback tìm kiếm bằng PostgreSQL.
3. **Azure Service Bus** (`sb-smartroommate-ea`) - Resource Namespace & Code provider SDK đã có, nhưng chưa thêm App Setting connection string trên Web App.
4. **Azure AI Vision** (`cog-vision-smartroommate`) - Resource & Keys tồn tại nhưng request phân tích trả lỗi HTTP 400 do URL ảnh blob mẫu trống, kích hoạt fallback mô phỏng.
5. **Azure Notification Hubs** (`ns-notify-smartroommate/nh-smartroommate`) - Namespace & Hub Free SKU đã sẵn sàng nhưng chưa cấu hình chứng thư FCM/APNS cho ứng dụng di động.
6. **Azure Function App & Plan** (`func-smartroommate-ea` / `EastAsiaPlan`) - Runtime Function App & Consumption Plan đã khởi tạo nhưng chưa có mã nguồn Function (0 functions deployed).

---

### 3. Danh Sách Dịch Vụ RESOURCE_ONLY (4 Dịch Vụ)
Các tài nguyên chỉ mới được tạo trên Azure Portal/ARM mà chưa được tích hợp vào ứng dụng:

1. **Azure OpenAI** (`oai-smartroommate-ea`) - Tài nguyên Cognitive Service OpenAI tồn tại nhưng có 0 model deployment (chưa deploy `gpt-4o` hay `gpt-35-turbo`) và thiếu App Settings.
2. **Azure Container Registry** (`acrsmartroommateea`) - Registry tồn tại độc lập nhưng Web App triển khai trực tiếp qua file ZIP Node.js (GitHub Actions OIDC).
3. **Azure Key Vault** (`kv-smartroommate-ea`) - Vault tồn tại nhưng ứng dụng đọc bí mật trực tiếp từ App Settings, không có tích hợp Key Vault SDK.
4. **Network Security Group** (`nsg-smartroommate-ea`) - NSG tồn tại nhưng không gắn với bất kỳ Subnet hay NIC nào (`subnets: null`).

---

### 4. Danh Sách Dịch Vụ BLOCKED (2 Dịch Vụ)
1. **Azure Communication Services Email** (`acs-smartroommate-ea`) - Chưa tạo Email Domain & Sender Identity (chặn theo nguyên tắc kiểm soát chi phí).
2. **Azure Custom Vision Prediction** (`cvis-smartroommate-ea`) - Đã tạo tài nguyên Prediction nhưng chưa train hay publish phiên bản mô hình (Iteration) nào.

---

### 5. Danh Sách Dịch Vụ NOT_FOUND (1 Dịch Vụ)
1. **Azure Cache for Redis** - Trong code backend có file provider `AzureRedisProvider.js`, nhưng kiểm tra trên Azure Resource Group `rg-smartroommate-eastasia` hoàn toàn không có tài nguyên Redis nào.

---

## IV. KHUYẾN NGHỊ VÀ HƯỚNG DẪN TRÌNH BÀY VỚI GIẢNG VIÊN

### 1. Trả Lời Khi Giảng Viên Hỏi Số Lượng Dịch Vụ

- **Nếu Giảng viên hỏi: "Website đang thực sự hoạt động và sử dụng bao nhiêu dịch vụ Azure?"**  
  👉 **Trả lời trung thực: 14 DỊCH VỤ WORKING.** (Đây là số lượng có đầy đủ bằng chứng runtime, kết nối thật, không dùng mock hay fallback).

- **Nếu Giảng viên hỏi: "Nhóm đã triển khai và cấu hình bao nhiêu tài nguyên/dịch vụ trên Azure?"**  
  👉 **Trả lời: 26 DỊCH VỤ / TÀI NGUYÊN.** (Gồm 14 WORKING + 6 CONFIGURED + 4 RESOURCE_ONLY + 2 BLOCKED).

- **Nếu Giảng viên đếm số lượng Resource Instances trên Azure Portal:**  
  👉 **Số lượng hiển thị là: 29 RESOURCE INSTANCES.** (Do có tài nguyên con như Notification Hub con, App Insights riêng của Function App, v.v.).

---

### 2. Dịch Vụ Nào NÊN Demo Trực Tiếp Khi Báo Cáo?

Nhóm nên mở trang audit dashboard `/cloud-services.html` hoặc demo các API sau để minh chứng 14 dịch vụ WORKING:
1. **Azure Database for PostgreSQL & Web App:** Mở danh sách phòng trọ (`/api/rooms`) -> Dữ liệu thật từ PostgreSQL Flexible Server.
2. **Azure App Configuration:** Demo cấu hình feature flag đọc thật từ Azure.
3. **Azure AI Content Safety:** Demo kiểm duyệt văn bản bài đăng phòng trọ (`/api/cloud/content-safety/test`).
4. **Azure AI Language:** Demo phân tích cảm xúc đánh giá phòng trọ (`/api/cloud/language/analyze`).
5. **Azure AI Translator:** Demo dịch tự động mô tả phòng trọ sang tiếng Anh (`/api/cloud/translator/translate`).
6. **Azure Maps:** Demo chuyển đổi địa chỉ phòng trọ thành tọa độ GPS (`/api/cloud/maps/geocode`).
7. **Azure AI Speech:** Demo phát âm thanh giọng nói đọc bài đăng phòng trọ (`/api/cloud/speech/synthesize`).
8. **Azure Web PubSub:** Demo gửi nhận tin nhắn thời gian thực qua WebSocket.
9. **Azure Monitor & App Insights:** Mở Azure Portal hiển thị biểu đồ telemetry và Metric Alert Rule `alert-smartroommate-http5xx`.

---

### 3. Dịch Vụ Nào DỄ BỊ BẮT LỖI (CẦN GIẢI TRÌNH TRUNG THỰC)?

1. **Blob Storage:** Giải thích là tài nguyên đã khởi tạo container `room-images` sẵn sàng, nhưng ở môi trường demo nhóm để `STORAGE_PROVIDER=azure-blob` trong khi điều kiện code đòi hỏi `azure` nên tạm thời ảnh lưu local.
2. **Azure AI Search:** Dịch vụ Search Service đã kết nối, nhưng do hạn ngạch Free SKU chưa tạo `rooms-index` nên hệ thống tự động fallback sang tìm kiếm qua PostgreSQL.
3. **Azure OpenAI:** Đã khởi tạo Azure OpenAI resource, nhưng chưa deploy model `gpt-4o` do giới hạn Quota Azure for Students, hệ thống sử dụng thuật toán ghép phòng dựa trên luật (rule-based).
4. **ACS Email & Custom Vision:** Giải thích rõ đây là các dịch vụ ở trạng thái **BLOCKED** có chủ đích để tránh phát sinh chi phí phát sinh ngoài ý muốn.

---

## V. ĐỊNH DẠNG KẾT LUẬN BẮT BUỘC

Azure Resource Instances: 29  
Azure Service Types: 23  

WORKING: 14  
CONFIGURED: 6  
RESOURCE_ONLY: 4  
BLOCKED: 2  
FAILED: 0  
NOT_FOUND: 1  
UNVERIFIED: 0  

Website đang thực sự sử dụng được: 14 dịch vụ.  
Đã triển khai hoặc cấu hình nhưng chưa có runtime evidence đầy đủ: 6 dịch vụ.  
Chỉ mới tạo resource: 4 dịch vụ.  

Danh sách WORKING:
1. Azure Database for PostgreSQL Flexible Server (`psql-smartroommate-ea`)
2. Azure App Service Web App (`app-smartroommate-ea`)
3. Azure App Service Plan (`asp-smartroommate`)
4. Application Insights (`appi-smartroommate`)
5. Log Analytics Workspace (`law-smartroommate-ea`)
6. Azure App Configuration (`appcs-smartroommate-ea`)
7. Azure AI Content Safety (`cog-safety-smartroommate`)
8. Azure AI Language (`cog-lang-smartroommate`)
9. Azure AI Translator (`trsl-smartroommate-ea`)
10. Azure Maps (`maps-smartroommate-ea`)
11. Azure AI Speech (`spch-smartroommate-ea`)
12. Azure Web PubSub (`wps-smartroommate-ea`)
13. Azure Monitor Metric Alert Rule (`alert-smartroommate-http5xx`)
14. Azure Monitor Action Group (`Application Insights Smart Detection`)

Danh sách CONFIGURED:
1. Azure Storage Account (Blob Storage) (`stsmartroommateea`)
2. Azure AI Search (`srch-smartroommate-ea`)
3. Azure Service Bus (`sb-smartroommate-ea`)
4. Azure AI Vision (`cog-vision-smartroommate`)
5. Azure Notification Hubs (`ns-notify-smartroommate/nh-smartroommate`)
6. Azure Function App & Plan (`func-smartroommate-ea` / `EastAsiaPlan`)

Dịch vụ không nên tuyên bố đang hoạt động:
1. Azure OpenAI (`oai-smartroommate-ea`) - Resource Only (chưa deploy model gpt-4o, 0 deployments)
2. Azure Container Registry (`acrsmartroommateea`) - Resource Only (Web App deploy bằng ZIP artifact)
3. Azure Key Vault (`kv-smartroommate-ea`) - Resource Only (App Settings dùng trực tiếp, chưa qua Vault)
4. Network Security Group (`nsg-smartroommate-ea`) - Resource Only (NSG chưa gắn VNet/Subnet)
5. Azure Communication Services Email (`acs-smartroommate-ea`) - Blocked (chưa tạo domain sender)
6. Azure Custom Vision Prediction (`cvis-smartroommate-ea`) - Blocked (chưa train model)
7. Azure Cache for Redis - Not Found (không có resource trên Azure)
