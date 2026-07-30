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

