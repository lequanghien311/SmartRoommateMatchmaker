# HƯỚNG DẪN KIỂM THỬ VÀ DEMO DỊCH VỤ AZURE CLOUD

**Dự án:** SmartRoommateMatchmaker  
**Website Production:** `https://app-smartroommate-ea.azurewebsites.net`  
**Giao diện Admin Dashboard:** `https://app-smartroommate-ea.azurewebsites.net/cloud-services.html`  

---

## 1. CÁCH KIỂM THỬ QUA GIAO DIỆN ADMIN DASHBOARD

 TRUY CẬP TRỰC TIẾP:  
[https://app-smartroommate-ea.azurewebsites.net/cloud-services.html](https://app-smartroommate-ea.azurewebsites.net/cloud-services.html)

Giao diện hiển thị:
- Các ô thống kê trực quan số lượng dịch vụ theo từng trạng thái (**14 WORKING**, **6 CONFIGURED**, **2 BLOCKED**, **3 RESOURCE_ONLY**).
- Bảng danh sách chi tiết toàn bộ 26 tài nguyên Azure kèm bằng chứng runtime thực tế.
- Mỗi hàng có nút **"Test Endpoint"** giúp kiểm thử ngay lập tức từng dịch vụ cloud mà không cần dùng cURL hoặc Postman.

---

## 2. CÁCH KIỂM THỬ QUA CURL / REST API (PRODUCTION EVIDENCE)

### 1. Azure App Configuration
```bash
curl -s https://app-smartroommate-ea.azurewebsites.net/api/cloud/app-configuration/status
```
*Kết quả:* Trả về `keyLoaded: true` và `featureEnabled: true` đọc trực tiếp từ `appcs-smartroommate-ea`.

### 2. Azure AI Content Safety
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/content-safety/test \
  -H "Content-Type: application/json" \
  -d '{"text": "Phòng trọ đẹp, sạch sẽ, an ninh tốt."}'
```
*Kết quả:* Trả về `allowed: true`, danh sách categories và severity score kiểm duyệt nội dung.

### 3. Azure AI Language (Phân tích Sentiment)
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/language/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Phòng rộng rãi, chủ nhà rất nhiệt tình và thân thiện."}'
```
*Kết quả:* Trả về `sentiment: "positive"`, điểm tin cậy `confidence: 0.9` và danh sách key phrases.

### 4. Azure AI Translator (Dịch thuật mô tả)
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/translator/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Phòng trọ cho thuê giá rẻ tại Quận 1", "targetLanguage": "en"}'
```
*Kết quả:* Trả về bản dịch tiếng Anh thực tế từ Azure Translator: `"Cheap room for rent in District 1"`.

### 5. Azure Maps (Geocoding Địa chỉ)
```bash
curl -s "https://app-smartroommate-ea.azurewebsites.net/api/cloud/maps/geocode?query=Quận+1,+Hồ+Chí+Minh"
```
*Kết quả:* Trả về địa chỉ chuẩn hóa `normalizedAddress` và tọa độ thực `latitude: 10.7769`, `longitude: 106.7009`.

### 6. Azure AI Speech (Text-To-Speech Synthesis)
```bash
curl -s -X POST https://app-smartroommate-ea.azurewebsites.net/api/cloud/speech/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Chào mừng bạn đến với ứng dụng Smart Roommate Matchmaker"}'
```
*Kết quả:* Trả về `status: "success"` và kích thước file âm thanh MP3 tổng hợp từ giọng nói AI HoaiMyNeural.

### 7. Azure Monitor Action Group (Alert Rule HTTP 5xx)
```bash
curl -s https://app-smartroommate-ea.azurewebsites.net/api/cloud/monitor/status
```
*Kết quả:* Trả về thông tin Alert Rule `alert-smartroommate-http5xx` đã được liên kết trực tiếp tới Action Group `Application Insights Smart Detection`.

---

## 3. TÀI LIỆU VÀ BẰNG CHỨNG HỆ THỐNG

- **Báo cáo kiểm toán trước tích hợp (PHA 1):** [`docs/AZURE-SERVICE-AUDIT-BEFORE.md`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/docs/AZURE-SERVICE-AUDIT-BEFORE.md)
- **Báo cáo nghiệm thu sản phẩm (PHA 20):** [`docs/AZURE-SERVICES-FINAL-REPORT.md`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/docs/AZURE-SERVICES-FINAL-REPORT.md)
- **File bằng chứng định dạng JSON:** [`artifacts/azure-services-verification.json`](file:///d:/Hien/dai%20hoc/Hoc%20ki%20he/Dientoandammay/SmartRoommateMatchmaker/artifacts/azure-services-verification.json)
