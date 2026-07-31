# HƯỚNG DẪN KIỂM THỬ VÀ DEMO DỊCH VỤ AZURE CLOUD

**Dự án:** SmartRoommateMatchmaker  
**Website Production:** `https://app-smartroommate-ea.azurewebsites.net`  
**Giao diện Admin Dashboard:** `https://app-smartroommate-ea.azurewebsites.net/cloud-services.html`  
**Canonical Report:** [`docs/AZURE-SERVICES-FINAL-REPORT.md`](AZURE-SERVICES-FINAL-REPORT.md)

---

## 1. CÁCH KIỂM THỬ QUA GIAO DIỆN ADMIN DASHBOARD

TRUY CẬP TRỰC TIẾP:  
[https://app-smartroommate-ea.azurewebsites.net/cloud-services.html](https://app-smartroommate-ea.azurewebsites.net/cloud-services.html)

Giao diện hiển thị:
- Các ô thống kê trực quan số lượng dịch vụ theo từng trạng thái (**18 WORKING**, **3 CONFIGURED**, **2 BLOCKED**, **3 RESOURCE_ONLY**).
- Bảng danh sách chi tiết toàn bộ 26 mục tài nguyên Azure kèm bằng chứng runtime thực tế.
- Mỗi hàng có nút **"Test Endpoint"** giúp kiểm thử ngay lập tức từng dịch vụ cloud trực tiếp từ trình duyệt.

---

## 2. CÁCH KIỂM THỬ QUA cURL / REST API (PRODUCTION EVIDENCE)

### 1. Azure App Service (Web App & Health Check)
```bash
curl -s https://app-smartroommate-ea.azurewebsites.net/api/health
```
*Kết quả:* Trả về `{"success": true, "data": {"status": "healthy", "service": "smart-roommate-api"}}`.

### 2. Azure Storage Account (Blob Storage)
```bash
curl -s https://app-smartroommate-ea.azurewebsites.net/api/cloud/storage/status
```
*Kết quả:* Trả về `status: "WORKING"`, `provider: "azure-blob"`, `container: "room-images"`.

### 3. Azure AI Vision (Computer Vision Image Analysis)
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/vision/analyze
```
*Kết quả:* Trả về `httpStatus: 200`, `provider: "azure-ai-vision"`, `caption: "a plate of food"`, `fallbackUsed: false`.

### 4. Azure AI Search (Room Indexing & Query)
```bash
curl -s "https://app-smartroommate-ea.azurewebsites.net/api/cloud/search/rooms?q=sinh%20vi%C3%AAn"
```
*Kết quả:* Trả về `provider: "azure-ai-search"`, `indexName: "rooms-index"`, `@search.score: 2.51123`, `fallbackUsed: false`.

### 5. Azure Function App (Serverless Health Check)
```bash
curl -s https://func-smartroommate-ea.azurewebsites.net/api/health-check
```
*Kết quả:* Trả về `{"service":"smart-roommate-function","status":"healthy"}`.

### 6. Azure App Configuration
```bash
curl -s https://app-smartroommate-ea.azurewebsites.net/api/cloud/app-configuration/status
```
*Kết quả:* Trả về `connected: true` và đọc được key `SmartRoommate:Features:CloudDemoEnabled`.

### 7. Azure AI Content Safety
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/content-safety/test \
  -H "Content-Type: application/json" \
  -d '{"text": "Phòng trọ đẹp, sạch sẽ, an ninh tốt."}'
```
*Kết quả:* Trả về `allowed: true`, danh sách categories và severity score kiểm duyệt nội dung.

### 8. Azure AI Language (Phân tích Sentiment)
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/language/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Phòng rộng rãi, chủ nhà rất nhiệt tình và thân thiện."}'
```
*Kết quả:* Trả về `sentiment: "positive"`, điểm tin cậy `confidenceScores` và danh sách key phrases.

### 9. Azure AI Translator (Dịch thuật mô tả)
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/translator/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Phòng trọ cho thuê giá rẻ tại Quận 1", "targetLanguage": "en"}'
```
*Kết quả:* Trả về bản dịch tiếng Anh thực tế: `"Cheap room for rent in District 1"`.

### 10. Azure Maps (Geocoding Địa chỉ)
```bash
curl -s "https://app-smartroommate-ea.azurewebsites.net/api/cloud/maps/geocode?query=Quận+1,+Hồ+Chí+Minh"
```
*Kết quả:* Trả về địa chỉ chuẩn hóa `normalizedAddress` và tọa độ thực `latitude: 10.7769`, `longitude: 106.7009`.

### 11. Azure AI Speech (Text-To-Speech Synthesis)
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/speech/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Chào mừng bạn đến với ứng dụng Smart Roommate Matchmaker"}'
```
*Kết quả:* Trả về `status: "success"` và kích thước file âm thanh MP3 tổng hợp từ giọng nói AI HoaiMyNeural (`audio/mpeg`).

### 12. Azure Monitor Action Group (Alert Rule HTTP 5xx)
```bash
curl -s https://app-smartroommate-ea.azurewebsites.net/api/cloud/monitor/status
```
*Kết quả:* Trả về thông tin Alert Rule `alert-smartroommate-http5xx` đã được liên kết trực tiếp tới Action Group.

---

## 3. TÀI LIỆU VÀ BẰNG CHỨNG HỆ THỐNG

- **Nguồn sự thật duy nhất (Canonical Report):** [`docs/AZURE-SERVICES-FINAL-REPORT.md`](AZURE-SERVICES-FINAL-REPORT.md)
- **Báo cáo nghiệm thu Chu kỳ 1 (Blob Storage):** [`docs/integrations/azure-blob-storage-report.md`](integrations/azure-blob-storage-report.md)
- **Báo cáo nghiệm thu Chu kỳ 2 (AI Vision):** [`docs/integrations/azure-ai-vision-report.md`](integrations/azure-ai-vision-report.md)
- **Báo cáo nghiệm thu Chu kỳ 3 (AI Search):** [`docs/integrations/azure-ai-search-report.md`](integrations/azure-ai-search-report.md)
- **Báo cáo nghiệm thu Chu kỳ 4 (Azure Functions):** [`docs/integrations/azure-functions-report.md`](integrations/azure-functions-report.md)
- **Báo cáo kiểm toán lưu trữ (Archived):** [`docs/archive/AZURE-SERVICE-AUDIT-BEFORE.md`](archive/AZURE-SERVICE-AUDIT-BEFORE.md)
- **File bằng chứng định dạng JSON:** [`artifacts/azure-services-verification.json`](../artifacts/azure-services-verification.json)
