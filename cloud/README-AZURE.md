# Triển khai Azure từ số 0

Tài liệu này không giả định người đọc đã biết Azure. Không chạy lệnh tạo tài nguyên trước khi kiểm tra giá và subscription. Các tài nguyên AKS, Front Door, API Management, Azure OpenAI và Redis có thể tốn phí đáng kể.

## 1. Chuẩn bị

1. Tạo Azure subscription và resource budget/cost alert.
2. Cài Azure CLI, Terraform 1.6+, Docker và GitHub CLI nếu cần.
3. Đăng nhập `az login`, chọn đúng subscription bằng `az account set`.
4. Sao chép `cloud/terraform/terraform.tfvars.example` thành file không commit và đặt mật khẩu PostgreSQL an toàn.
5. Chạy an toàn: `terraform fmt -recursive`, `terraform init`, `terraform validate`, `terraform plan`.
6. Chỉ người có thẩm quyền mới chạy `terraform apply` sau khi duyệt plan.

## 2. Thứ tự triển khai

1. Resource Group, Log Analytics, Application Insights.
2. Storage Account/Blob container và PostgreSQL Flexible Server.
3. Service Bus queue, Key Vault, ACR.
4. Build/push image vào ACR.
5. App Service và Function App.
6. Chạy migration/seed có kiểm soát.
7. Cấu hình Web PubSub/Redis/Azure OpenAI nếu bật.
8. Cấu hình domain, TLS, Front Door/APIM nếu cần.
9. Smoke test health, auth, upload, event, chat.

## 3. App Service

- Dùng Linux Web App với managed identity.
- Image là Dockerfile production của repository.
- Đặt health path `/api/health`, Always On và HTTPS Only.
- App settings lấy secret qua Key Vault references, không dán secret vào source.
- Startup chạy `npm run migrate && npm start`; seed chỉ chạy ở demo/staging.

## 4. PostgreSQL Azure

- Tạo database `smart_roommate`, bật SSL.
- Production ưu tiên private endpoint/VNet; chỉ mở firewall IP quản trị tạm thời.
- `DATABASE_URL` có `sslmode=require`.
- Cấu hình backup retention và kiểm thử restore.

## 5. Blob Storage

Container `room-images` để private. App dùng managed identity với role `Storage Blob Data Contributor` hoặc connection string từ Key Vault. Đặt `STORAGE_PROVIDER=azure`.

## 6. Service Bus và Functions

Queue `smart-roommate-events`, dead-letter bật, max delivery 10. Đặt `MESSAGING_PROVIDER=azure-service-bus`. Deploy mã trong `cloud/azure-functions`; Function `roomCreated` nhận `RoomCreated`. Theo dõi dead-letter queue và retry.

## 7. Web PubSub, Azure OpenAI và Redis

- Web PubSub: tạo hub `smart-roommate`, đặt `REALTIME_PROVIDER=azure-web-pubsub`.
- Azure OpenAI: cần region/quota, deployment phù hợp; đặt `MATCHING_PROVIDER=azure-openai`. Mọi lỗi tự fallback rule-based.
- Azure Cache for Redis: đặt `CACHE_PROVIDER=azure-redis`; cân nhắc tier vì chi phí.

Cosmos DB chỉ cần khi tách chat storage khỏi PostgreSQL. Notification Hubs chỉ cần khi có mobile push.

## 8. Application Insights và OpenTelemetry

Đặt `APPLICATIONINSIGHTS_CONNECTION_STRING`. Log chứa request ID/correlation ID, không chứa password/token. Tạo alert cho 5xx, latency, App Service health, PostgreSQL connections, Service Bus dead-letter.

## 9. Key Vault và Managed Identity

Lưu `DATABASE_URL`, JWT secrets, Blob/Service Bus/Web PubSub/OpenAI/Redis secrets trong Key Vault. Gán managed identity quyền tối thiểu; không dùng access policy rộng hoặc credential dài hạn.

## 10. Container Registry và AKS

ACR Basic đủ cho demo. AKS mặc định `enable_aks=false`; chỉ bật khi thật sự cần orchestration. Nếu dùng AKS:

1. Thay image/tag và hostname trong manifests.
2. Tích hợp Workload Identity/Key Vault CSI.
3. Cài ingress controller và metrics-server.
4. Kiểm tra `kubectl diff -f cloud/kubernetes`; chỉ sau review mới apply.

## 11. Front Door, APIM và gateway

Các cờ `enable_gateway`, `enable_front_door`, `enable_api_management` mặc định false. Front Door hữu ích cho WAF/global entry; APIM cho quota/version/policy. Với đồ án/demo nhỏ, App Service trực tiếp thường đủ.

## 12. GitHub Actions

Tạo GitHub Environment `production`, cấu hình OIDC:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_WEBAPP_NAME`
- `ACR_NAME`
- Khi push ACR: `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD` (ưu tiên OIDC thay password)

CI chặn deploy nếu lint/test lỗi.

## 13. Biến môi trường production

Dùng toàn bộ khóa trong `.env.example`. Tối thiểu phải có `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `CORS_ORIGIN`; bật provider Azure thì thêm connection tương ứng. Không đưa secret vào ConfigMap, log hoặc health response.

## 14. Checklist

- [ ] Budget và cost alert đã bật.
- [ ] Terraform plan được review.
- [ ] Secret nằm trong Key Vault.
- [ ] Managed identity dùng least privilege.
- [ ] PostgreSQL SSL/private access/backup hoạt động.
- [ ] Migration chạy thành công; không seed demo production.
- [ ] `/api/health/*` healthy.
- [ ] Upload Blob và URL truy cập đúng chính sách.
- [ ] RoomCreated tới Service Bus/Function.
- [ ] Chat Web PubSub hoạt động.
- [ ] Azure OpenAI lỗi vẫn matching rule-based.
- [ ] Application Insights nhận trace, không lộ secret.
- [ ] CORS/domain/TLS đúng.
- [ ] Restore và rollback đã diễn tập.

## 15. Xem log và xử lý sự cố

- App Service: Log stream và Application Insights transaction search.
- Function: Monitor/Invocations và Service Bus dead-letter.
- PostgreSQL: metrics connections, CPU, storage, slow queries.
- AKS: pod events/logs và probe failures.
- Dùng correlation ID từ response header để nối log xuyên dịch vụ.

## 16. Xóa tài nguyên

Trước khi xóa: backup DB/blob, xác nhận đúng subscription/resource group, kiểm tra resource lock. `terraform destroy` hoặc xóa Resource Group là hành động phá hủy và có thể mất dữ liệu; chỉ chạy thủ công sau phê duyệt. Key Vault purge protection có thể giữ tên vault một thời gian.

## Cảnh báo chi phí

AKS node chạy liên tục, PostgreSQL tier cao, Azure OpenAI token/quota, APIM, Front Door Premium, Web PubSub unit, Redis Premium và Log Analytics ingestion là các nguồn chi phí lớn. Bản demo nên giữ AKS/APIM/Front Door/Redis/Azure OpenAI tắt, dùng App Service B1 và PostgreSQL burstable rồi tắt/xóa khi không dùng.
