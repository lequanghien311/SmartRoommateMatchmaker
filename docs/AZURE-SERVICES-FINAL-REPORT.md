# BÁO CÁO KIỂM TOÁN VÀ TÍCH HỢP DỊCH VỤ AZURE (BẢN CHÍNH THỨC NỘP GIẢNG VIÊN)

**Dự án:** SmartRoommateMatchmaker  
**Môi trường:** Production (`https://app-smartroommate-ea.azurewebsites.net`)  
**Dashboard nghiệm thu:** `https://app-smartroommate-ea.azurewebsites.net/cloud-services.html`  
**Resource Group:** `rg-smartroommate-eastasia`  
**Thời gian kiểm toán:** 2026-07-30  

---

## 1. PHÂN BIỆT RÕ 3 CẤP ĐỘ KIỂM TOÁN TÀI NGUYÊN

1. **Cấp độ 1: Tài nguyên Vật lý Azure (Resource Instances):**  
   Có **26 resources** thực tế được liệt kê trong Azure Portal thuộc Resource Group `rg-smartroommate-eastasia`.
2. **Cấp độ 2: Loại Dịch vụ Azure (Azure Service Products):**  
   Có **22 loại dịch vụ Azure** riêng biệt (sau khi gộp 2 App Service Plan `asp-smartroommate` và `EastAsiaPlan` thành 1 nhóm Hạ tầng Compute).
3. **Cấp độ 3: Dịch vụ / Tính năng Tích hợp Thực tế (App Functional Integration):**  
   Ứng dụng đã tích hợp và phân loại đúng **25 mục nghiệp vụ** (gồm 14 WORKING, 6 CONFIGURED, 2 BLOCKED, 3 RESOURCE_ONLY) và 1 mục NOT_FOUND.

---

## 2. KẾT LUẬN SỐ LƯỢNG CHÍNH THỨC TRÌNH BÀY GIẢNG VIÊN

| Phân loại Trạng thái | Số lượng | Diễn giải Chi tiết |
|---|---|---|
| **WORKING** | **14** | Dịch vụ đã tích hợp code/SDK, chạy thực tế trên Production và có Runtime Evidence thành công. |
| **CONFIGURED** | **6** | Dịch vụ đã cài đặt SDK/Provider/App Settings sẵn sàng, đang chạy chế độ demo hoặc fallback an toàn. |
| **BLOCKED** | **2** | Dịch vụ bị vướng điều kiện bên ngoài (Domain Email, Model Custom Vision) — giữ nguyên không phát sinh chi phí. |
| **RESOURCE_ONLY** | **3** | Tài nguyên hạ tầng đứng độc lập, không gắn trên đường chạy của Web App (ACR, NSG, Key Vault). |
| **NOT_FOUND** | **1** | Tài nguyên Azure Cache for Redis không tồn tại trong Resource Group (Báo cáo cũ nhầm lẫn). |
| **TỔNG DỊCH VỤ CLOUD DEMO** | **22** | **22 Dịch vụ / Tính năng Azure Cloud đủ điều kiện báo cáo và demo với Giảng viên (WORKING + CONFIGURED + BLOCKED)** |
| **TỔNG RESOURCE AZURE** | **26** | **26 Tài nguyên vật lý Azure trong Resource Group `rg-smartroommate-eastasia`** |

---

## 3. BẢNG CHI TIẾT 22 DỊCH VỤ CLOUD TRÌNH BÀY GIẢNG VIÊN

| STT | Dịch vụ Azure | Trạng thái | Runtime Evidence (Bằng chứng Chạy thực tế) |
|---|---|---|---|
| 1 | **Azure App Service Web App** | **WORKING** | Web App Node.js 22 Linux phản hồi HTTP 200 tại `https://app-smartroommate-ea.azurewebsites.net/api/health` |
| 2 | **Azure Compute Infrastructure** | **WORKING** | Cung cấp hạ tầng compute B1 Basic (`asp-smartroommate`) & Consumption Y1 (`EastAsiaPlan`) nuôi Web App & Function |
| 3 | **Azure Database for PostgreSQL** | **WORKING** | Cơ sở dữ liệu quan hệ PostgreSQL Flexible Server phản hồi truy vấn dữ liệu phòng trọ & user thực tế |
| 4 | **Azure Storage Account (Blob)** | **WORKING** | Container `room-images` hoạt động, lưu trữ và trả URL công khai cho ảnh phòng trọ |
| 5 | **Azure Web PubSub** | **WORKING** | WebSocket thời gian thực hoạt động, cấp token kết nối phục vụ chat giữa người thuê & chủ phòng |
| 6 | **Application Insights** | **WORKING** | APM Telemetry Ingestion thu thập log HTTP request, exception và hiệu năng ứng dụng |
| 7 | **Log Analytics Workspace** | **WORKING** | Workspace `law-smartroommate-ea` tiếp nhận và lưu trữ log tập trung từ Application Insights |
| 8 | **Azure App Configuration** | **WORKING** | SDK đọc thành công key `SmartRoommate:Features:CloudDemoEnabled=true` từ store `appcs-smartroommate-ea` |
| 9 | **Azure AI Content Safety** | **WORKING** | API Text Moderation phân tích nội dung mô tả phòng, trả về `allowed: true` và severity score |
| 10 | **Azure AI Language** | **WORKING** | API Phân tích Cảm xúc (Sentiment Analysis) mô tả phòng trả về `positive`/`neutral` và score tin cậy |
| 11 | **Azure AI Translator** | **WORKING** | API Dịch thuật tự động chuyển đổi văn bản mô tả phòng từ Tiếng Việt sang Tiếng Anh thực tế |
| 12 | **Azure Maps** | **WORKING** | API Geocoding chuyển đổi địa chỉ chuỗi (vd: "Quận 1") thành tọa độ địa lý (Latitude/Longitude) |
| 13 | **Azure AI Speech** | **WORKING** | API Text-To-Speech tổng hợp văn bản Tiếng Việt thành file âm thanh MP3 buffer (`audio/mpeg`) |
| 14 | **Azure Monitor Action Group** | **WORKING** | Alert Rule `alert-smartroommate-http5xx` được khởi tạo và liên kết trực tiếp tới Action Group |
| 15 | **Azure AI Vision** | **CONFIGURED** | Provider code & App Settings sẵn sàng, đang chạy chế độ captioning fallback cho ảnh Blob |
| 16 | **Azure AI Search** | **CONFIGURED** | SDK `@azure/search-documents` & Provider sẵn sàng, phản hồi status index `rooms-index` |
| 17 | **Azure Function App** | **CONFIGURED** | Tài nguyên Serverless `func-smartroommate-ea` trạng thái Succeeded, sẵn sàng cho background job |
| 18 | **Azure Service Bus** | **CONFIGURED** | SDK `@azure/service-bus` & Provider code sẵn sàng, hiện chạy local queue fallback |
| 19 | **Azure OpenAI** | **CONFIGURED** | SDK `openai` & Provider matching code sẵn sàng, hiện chạy rule-based matching fallback |
| 20 | **Azure Notification Hubs** | **CONFIGURED** | Namespace & Hub (`nh-smartroommate`) Succeeded (Free SKU), phản hồi status chờ FCM/APNS key |
| 21 | **ACS Email** | **BLOCKED** | Tích hợp status endpoint: Bị chặn do chưa cấu hình Domain/Sender identity (không tạo domain trả phí) |
| 22 | **Custom Vision Prediction** | **BLOCKED** | Tích hợp status endpoint: Bị chặn do resource Prediction tồn tại nhưng chưa có trained/published model |

---

## 4. TÀI NGUYÊN HẠ TẦNG ĐỘC LẬP (RESOURCE_ONLY & NOT_FOUND)

| STT | Resource Name | Loại Tài nguyên | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 23 | `acrsmartroommateea` | Azure Container Registry | **RESOURCE_ONLY** | App Service chạy Node 22 ZIP Deployment, không pull Docker image từ ACR. |
| 24 | `nsg-smartroommate-ea` | Network Security Group | **RESOURCE_ONLY** | NSG độc lập không gán Subnet (`subnets: null`), Web App không bật VNet Integration. |
| 25 | `kv-smartroommate-ea` | Azure Key Vault | **RESOURCE_ONLY** | Key Vault tồn tại độc lập, mật khẩu/key được quản lý trực tiếp qua App Settings. |
| 26 | `Azure Cache for Redis` | Redis Cache Instance | **NOT_FOUND** | Không có tài nguyên Redis trong Resource Group `rg-smartroommate-eastasia`. |
