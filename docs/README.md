# TÀI LIỆU DỰ ÁN SMART ROOMMATE MATCHMAKER (DOCUMENTATION HUB)

Chào mừng đến với thư mục tài liệu chính thức của dự án **SmartRoommateMatchmaker**.

---

## 🎯 NGUỒN SỰ THẬT DUY NHẤT (CANONICAL REPORT)

Khi cần tra cứu số lượng, trạng thái tích hợp, runtime evidence hoặc kết quả kiểm toán dịch vụ Azure Cloud, **mọi AI Agent và Thành viên dự án BẮT BUỘC tham chiếu file sau làm Nguồn Sự Thật Duy Nhất (Canonical Report):**

👉 **[`docs/AZURE-SERVICES-FINAL-REPORT.md`](AZURE-SERVICES-FINAL-REPORT.md)**

---

## 📂 CẤU TRÚC THƯ MỤC TÀI LIỆU (`docs/`)

| Đường Dẫn File / Thư Mục | Mô Tả Nội Dung | Trạng Thái |
|---|---|---|
| 📄 **[`AZURE-SERVICES-FINAL-REPORT.md`](AZURE-SERVICES-FINAL-REPORT.md)** | **Canonical Report:** Báo cáo kiểm toán & nghiệm thu chính thức hiện hành (**18 WORKING**, 3 CONFIGURED, 2 BLOCKED, 3 RESOURCE_ONLY). | **CURRENT (CANONICAL)** |
| 📄 **[`AZURE-SERVICES-DEMO.md`](AZURE-SERVICES-DEMO.md)** | Hướng dẫn chi tiết kiểm thử qua Admin Dashboard & lệnh cURL REST API cho 18 dịch vụ. | **CURRENT** |
| 📂 **[`integrations/`](integrations/)** | Thư mục chứa báo cáo nghiệm thu tích hợp từng chu kỳ: | **CURRENT** |
| ├─ [`azure-blob-storage-report.md`](integrations/azure-blob-storage-report.md) | Báo cáo tích hợp Chu kỳ 1: Azure Blob Storage (`6ecfa4a`) | CURRENT |
| ├─ [`azure-ai-vision-report.md`](integrations/azure-ai-vision-report.md) | Báo cáo tích hợp Chu kỳ 2: Azure AI Vision (`3c98ff3`) | CURRENT |
| ├─ [`azure-ai-search-report.md`](integrations/azure-ai-search-report.md) | Báo cáo tích hợp Chu kỳ 3: Azure AI Search (`f779e68`) | CURRENT |
| └─ [`azure-functions-report.md`](integrations/azure-functions-report.md) | Báo cáo tích hợp Chu kỳ 4: Azure Functions (`611db3d`) | CURRENT |
| 📄 [`api.md`](api.md) | Tài liệu thiết kế REST API của hệ thống. | CURRENT |
| 📄 [`architecture.md`](architecture.md) | Tài liệu kiến trúc tổng thể ứng dụng & cloud infrastructure. | CURRENT |
| 📄 [`database.md`](database.md) | Tài liệu thiết kế CSDL PostgreSQL & sơ đồ ERD. | CURRENT |
| 📄 [`deployment.md`](deployment.md) | Tài liệu hướng dẫn CI/CD GitHub Actions & deployment lên Azure Web App. | CURRENT |
| 📄 [`test-plan.md`](test-plan.md) | Kế hoạch kiểm thử tự động & E2E. | CURRENT |
| 📂 **[`archive/`](archive/)** | **Thư mục lưu trữ tài liệu lịch sử:** | **ARCHIVED** |
| ├─ [`AZURE-SERVICE-AUDIT-BEFORE.md`](archive/AZURE-SERVICE-AUDIT-BEFORE.md) | Báo cáo kiểm toán đợt 1 (trước khi tích hợp các chu kỳ mới). | ARCHIVED |
| ├─ [`AZURE-SERVICE-REALITY-AUDIT.md`](archive/AZURE-SERVICE-REALITY-AUDIT.md) | Báo cáo kiểm toán thực tế hạ tầng Azure đợt 1. | ARCHIVED |
| └─ [`SIX-SERVICES-PRECHECK.md`](archive/SIX-SERVICES-PRECHECK.md) | Kế hoạch tiền kiểm toán lộ trình 6 dịch vụ ban đầu. | ARCHIVED |

---

## ⚠️ QUY TẮC DÀNH CHO AI AGENT
1. Không sử dụng các file trong thư mục `docs/archive/` hoặc `artifacts/archive/` làm căn cứ đưa ra số lượng dịch vụ hiện hành.
2. Luôn đọc `docs/README.md` và `docs/AZURE-SERVICES-FINAL-REPORT.md` trước khi trả lời về dịch vụ Cloud.
3. Kiểm tra Production Endpoint `https://app-smartroommate-ea.azurewebsites.net/api/cloud/services/status` để đối chiếu với Canonical Report.
