# Quy tắc cộng tác

- Chỉ dùng HTML5, CSS3 và JavaScript thuần cho frontend; không dùng React, Vue, Angular hoặc TypeScript.
- Backend dùng Node.js, Express, CommonJS và PostgreSQL; không đổi công nghệ khi chưa được yêu cầu.
- Không xóa migration cũ; migration mới phải có thứ tự và có thể chạy lặp an toàn ở cấp trình triển khai.
- Không ghi secret, token, mật khẩu thật hoặc connection string thật vào repository.
- Không push thẳng lên `main`.
- Hạn chế sửa module của thành viên khác nếu không cần thiết.
- Luôn chạy `npm run lint` và `npm test` trước khi bàn giao.
- Không tuyên bố hoàn thành khi còn lỗi hoặc chưa kiểm chứng.
- Không bỏ qua lỗi để tiếp tục; phải phân tích, sửa và chạy lại.
- Không tạo mock thay cho nghiệp vụ bắt buộc trong mã production.
- Không tự chạy lệnh cloud có thể phát sinh phí như `terraform apply`, `az deployment create` hoặc `kubectl apply`.
- Không tự thay đổi toàn bộ kiến trúc khi dự án đã hoạt động.

## Quy tắc xác minh trạng thái dịch vụ Azure Cloud
Khi có bất kỳ câu hỏi nào về số lượng hoặc trạng thái các dịch vụ Azure Cloud hiện hành của dự án, Agent BẮT BUỘC thực hiện đúng quy trình 7 bước sau:
1. Đọc file hướng dẫn tài liệu [docs/README.md](docs/README.md).
2. Đọc Nguồn Sự Thật Duy Nhất (Canonical Report) tại [docs/AZURE-SERVICES-FINAL-REPORT.md](docs/AZURE-SERVICES-FINAL-REPORT.md).
3. Kiểm tra git HEAD đảm bảo đã có đủ các commit tích hợp kích hoạt (`6ecfa4a`, `3c98ff3`, `f779e68`, `611db3d`).
4. Kiểm tra Production Health Endpoint `GET https://app-smartroommate-ea.azurewebsites.net/api/health`.
5. Kiểm tra Production Cloud Services Status Endpoint `GET https://app-smartroommate-ea.azurewebsites.net/api/cloud/services/status`.
6. Nếu phát hiện mâu thuẫn do cache bộ nhớ Web App, kiểm tra các endpoint runtime riêng biệt (`/api/cloud/storage/status`, `/api/cloud/vision/analyze`, `/api/cloud/search/rooms`, `/api/cloud/functions/status`).
7. Tuyệt đối KHÔNG dùng các file trong `docs/archive/` hoặc `artifacts/archive/` làm nguồn thông tin cho trạng thái hiện hành.
