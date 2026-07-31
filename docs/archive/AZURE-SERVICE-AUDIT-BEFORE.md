> [!WARNING]
> **TÀI LIỆU ĐÃ ĐƯỢC LƯU TRỮ (ARCHIVED DOCUMENT)**  
> Tài liệu này mang giá trị lịch sử kiểm toán ban đầu. Để xem trạng thái dịch vụ Azure Cloud hiện hành chính thức (18 WORKING), vui lòng tham chiếu Nguồn Sự Thật Duy Nhất tại: [AZURE-SERVICES-FINAL-REPORT.md](../AZURE-SERVICES-FINAL-REPORT.md).

---

# BÁO CÁO KIỂM TOÁN DỊCH VỤ AZURE (TRƯỚC TÍCH HỢP - PHA 1)

**Dự án:** SmartRoommateMatchmaker  
**Resource Group:** `rg-smartroommate-eastasia`  
**Thời gian kiểm toán:** 2026-07-30  
**Người thực hiện:** Senior Azure Cloud Engineer / Node.js Backend Engineer / QA Automation Engineer  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM TOÁN

| Trạng thái | Số lượng | Danh sách dịch vụ / Tài nguyên |
|---|---|---|
| **WORKING** | 8 | App Service Web App (`app-smartroommate-ea`), App Service Plan (`asp-smartroommate`), PostgreSQL Flexible Server (`psql-smartroommate-ea`), Storage Account Blob (`stsmartroommateea`), Web PubSub (`wps-smartroommate-ea`), Application Insights (`appi-smartroommate`), Log Analytics Workspace (`law-smartroommate-ea`), Function App Plan (`EastAsiaPlan`) |
| **CONFIGURED** | 3 | Function App (`func-smartroommate-ea`), Azure Service Bus (`sb-smartroommate-ea`), Azure OpenAI (`oai-smartroommate-ea`) |
| **RESOURCE_ONLY** | 15 | App Configuration (`appcs-smartroommate-ea`), AI Content Safety (`cog-safety-smartroommate`), AI Language (`cog-lang-smartroommate`), AI Translator (`trsl-smartroommate-ea`), AI Vision (`cog-vision-smartroommate`), Azure Maps (`maps-smartroommate-ea`), AI Search (`srch-smartroommate-ea`), Communication Services (`acs-smartroommate-ea`), Notification Hubs (`ns-notify-smartroommate/nh-smartroommate`), AI Speech (`spch-smartroommate-ea`), Custom Vision Prediction (`cvis-smartroommate-ea`), Action Group (`Application Insights Smart Detection`), Container Registry (`acrsmartroommateea`), NSG (`nsg-smartroommate-ea`), Key Vault (`kv-smartroommate-ea`) |
| **NOT_FOUND** | 1 | Azure Cache for Redis (Không có trong Resource Group) |
| **BLOCKED / FAILED** | 0 | Không có |
| **TỔNG TÀI NGUYÊN AZURE** | **26** | **26 resources thực tế trong `rg-smartroommate-eastasia`** |

---

## 2. BẢNG CHI TIẾT KIỂM TOÁN TÀI NGUYÊN (PHA 1)

| STT | Service | Resource | Code | App Setting | Runtime Evidence | Current Status | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Azure App Service Web App | `app-smartroommate-ea` | Có (`server.js`, `app.js`) | Có (`DATABASE_URL`, `AZURE_STORAGE_*`, `AZURE_WEB_PUBSUB_*`, `APPLICATIONINSIGHTS_*`) | Production website phản hồi HTTP 200 tại `https://app-smartroommate-ea.azurewebsites.net` | WORKING | Node.js 22 Linux runtime chính |
| 2 | Azure App Service Plan | `asp-smartroommate` | N/A (Hạ tầng Compute) | N/A | Cung cấp compute B1 Basic cho `app-smartroommate-ea` | WORKING | Hạ tầng compute phục vụ Web App |
| 3 | Azure Database for PostgreSQL | `psql-smartroommate-ea` | Có (`pg` client, migrations) | Có (`DATABASE_URL`) | Database hoạt động, phục vụ truy vấn dữ liệu phòng, user, chat | WORKING | Cơ sở dữ liệu quan hệ chính |
| 4 | Azure Storage Account (Blob) | `stsmartroommateea` | Có (`@azure/storage-blob`, `AzureBlobStorageProvider.js`) | Có (`AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER`) | Container `room-images` hoạt động, upload và trả URL ảnh phòng | WORKING | Lưu trữ tệp tin và ảnh đại diện/ảnh phòng |
| 5 | Azure Web PubSub | `wps-smartroommate-ea` | Có (`@azure/web-pubsub`, `AzureWebPubSubProvider.js`) | Có (`REALTIME_PROVIDER`, `AZURE_WEB_PUBSUB_CONNECTION_STRING`, `AZURE_WEB_PUBSUB_HUB`) | WebSocket kết nối thực tế cho tính năng trò chuyện thời gian thực | WORKING | Dịch vụ truyền tin thời gian thực |
| 6 | Application Insights | `appi-smartroommate` | Có (`applicationinsights`, `ApplicationInsightsProvider.js`) | Có (`APPLICATIONINSIGHTS_CONNECTION_STRING`) | Ingest telemetry, HTTP requests, exceptions trên production | WORKING | Giám sát hiệu năng và lỗi ứng dụng |
| 7 | Log Analytics Workspace | `law-smartroommate-ea` | N/A (Hạ tầng Log) | N/A | Lưu trữ log và telemetry gửi từ Application Insights | WORKING | Log workspace phục vụ App Insights |
| 8 | Azure Function App Plan | `EastAsiaPlan` | N/A (Hạ tầng Compute) | N/A | Cung cấp compute Consumption (Y1) cho Function App | WORKING | Hạ tầng compute cho Function App |
| 9 | Azure Function App | `func-smartroommate-ea` | Có (Khung Function App) | N/A | Resource trạng thái Succeeded, chưa tích hợp API chính | CONFIGURED | Serverless functions container |
| 10 | Azure Service Bus | `sb-smartroommate-ea` | Có (`@azure/service-bus`, `AzureServiceBusProvider.js`) | Chưa bật (`MESSAGING_PROVIDER` mặc định `local`) | Chưa có message queue chạy trên production Web App | CONFIGURED | SDK & provider code sẵn sàng, chưa active trên App Settings |
| 11 | Azure OpenAI | `oai-smartroommate-ea` | Có (`openai`, `AzureOpenAIMatchingProvider.js`) | Chưa có credentials trên Web App | Production mặc định dùng rule-based matching | CONFIGURED | Code provider sẵn sàng, chưa thêm endpoint/key vào Web App |
| 12 | Azure App Configuration | `appcs-smartroommate-ea` | Chưa có SDK (`@azure/app-configuration`) | Chưa có | Chưa được backend đọc cấu hình | RESOURCE_ONLY | Free SKU configuration store |
| 13 | Azure AI Content Safety | `cog-safety-smartroommate` | Chưa có SDK/provider | Chưa có | Chưa được ứng dụng gọi để kiểm duyệt nội dung | RESOURCE_ONLY | S0 SKU Content Safety resource |
| 14 | Azure AI Language | `cog-lang-smartroommate` | Chưa có SDK/provider | Chưa có | Chưa phân tích sentiment / key phrases | RESOURCE_ONLY | S SKU Text Analytics resource |
| 15 | Azure AI Translator | `trsl-smartroommate-ea` | Chưa có SDK/provider | Chưa có | Chưa dịch thuật mô tả phòng | RESOURCE_ONLY | F0 Free SKU Text Translation resource |
| 16 | Azure AI Vision | `cog-vision-smartroommate` | Chưa có SDK/provider | Chưa có | Chưa phân tích hình ảnh phòng | RESOURCE_ONLY | S1 SKU Computer Vision resource |
| 17 | Azure Maps | `maps-smartroommate-ea` | Chưa có SDK/provider | Chưa có | Chưa geocode địa chỉ phòng | RESOURCE_ONLY | G2 SKU Azure Maps resource |
| 18 | Azure AI Search | `srch-smartroommate-ea` | Chưa có SDK/provider | Chưa có | Chưa có index `rooms-index` và truy vấn tìm kiếm | RESOURCE_ONLY | Free SKU Azure AI Search service |
| 19 | Azure Communication Services | `acs-smartroommate-ea` | Chưa có SDK/provider | Chưa có | Chưa gửi email thử nghiệm qua ACS Email | RESOURCE_ONLY | Communication service resource |
| 20 | Azure Notification Hubs | `ns-notify-smartroommate/nh-smartroommate` | Chưa có SDK/provider | Chưa có | Chưa có FCM/APNS credentials và registration | RESOURCE_ONLY | Free SKU Notification Hub namespace & hub |
| 21 | Azure AI Speech | `spch-smartroommate-ea` | Chưa có SDK/provider | Chưa có | Chưa chuyển đổi Speech-to-Text / Text-to-Speech | RESOURCE_ONLY | F0 Free SKU Speech resource |
| 22 | Azure Custom Vision Prediction | `cvis-smartroommate-ea` | Chưa có SDK/provider | Chưa có | Chưa có trained/published model iteration | RESOURCE_ONLY | S0 SKU Prediction resource; chưa có trained model |
| 23 | Azure Monitor Action Group | `Application Insights Smart Detection` | N/A | Chưa có | Chưa có Alert Rule nào liên kết tới Action Group này | RESOURCE_ONLY | Action Group tồn tại nhưng chưa có Alert Rule |
| 24 | Azure Container Registry | `acrsmartroommateea` | N/A | Chưa có | Web App deploy qua ZIP package, không pull Docker image từ ACR | RESOURCE_ONLY | ACR Basic SKU tồn tại độc lập |
| 25 | Network Security Group | `nsg-smartroommate-ea` | N/A | Chưa có | NSG không gắn vào Subnet/NIC nào, Web App không có VNet Integration | RESOURCE_ONLY | NSG độc lập không nằm trên luồng mạng của app |
| 26 | Azure Key Vault | `kv-smartroommate-ea` | Chưa có SDK (`@azure/keyvault-secrets`) | Chưa có | App Settings ghi trực tiếp trên Web App, chưa qua Key Vault References | RESOURCE_ONLY | Key Vault tồn tại độc lập |
| 27 | Azure Cache for Redis | Non-existent | Có (`AzureRedisProvider.js`) | Không có | Tài nguyên Redis không tồn tại trong Resource Group | NOT_FOUND | Báo cáo cũ nhầm lẫn; không có tài nguyên Redis |

---

## 3. PHÂN TÍCH VẤN ĐỀ BẤT THƯỜNG VÀ ĐIỀU CHỈNH ĐẾM TÀI NGUYÊN

1. **Azure Cache for Redis (NOT_FOUND):**
   - Kiểm tra `az resource list` không tìm thấy bất kỳ instance Redis nào trong `rg-smartroommate-eastasia`.
   - Loại khỏi danh sách tài nguyên ACTIVE/WORKING. Không tự tạo Redis mới theo yêu cầu.

2. **Azure Container Registry (RESOURCE_ONLY):**
   - Web App `app-smartroommate-ea` đang chạy theo mô hình Node.js 22 Linux Zip Deployment.
   - ACR không chứa container image được sử dụng bởi App Service, nên phân loại chuẩn xác là `RESOURCE_ONLY`.

3. **Network Security Group (RESOURCE_ONLY):**
   - Kết quả `az network nsg show` trả về `subnets: null` và `networkInterfaces: null`.
   - Web App không bật VNet Integration. NSG không nằm trên tuyến mạng của ứng dụng.

4. **App Service Plan (Hạ tầng Compute):**
   - `asp-smartroommate` (B1) và `EastAsiaPlan` (Y1) được ghi nhận là hạ tầng compute phục vụ chạy Web App và Function App.

5. **Azure Monitor Action Group (RESOURCE_ONLY):**
   - Kết quả `az monitor metrics alert list` và `activity-log alert list` đều trả về `[]`.
   - Action Group chưa có bất kỳ Alert Rule nào liên kết, phân loại đúng quy tắc là `RESOURCE_ONLY`.

6. **Chỉnh lý đếm nhóm STANDBY / RESOURCE_ONLY:**
   - Số lượng chính xác dịch vụ/tài nguyên ở trạng thái `RESOURCE_ONLY` trước khi tích hợp là **15** tài nguyên.
