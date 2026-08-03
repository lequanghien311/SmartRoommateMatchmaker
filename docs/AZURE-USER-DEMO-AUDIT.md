# Azure User Demo Audit

**Production:** `https://app-smartroommate-ea.azurewebsites.net`
**Thời điểm kiểm toán:** 2026-08-01
**Source HEAD:** `1880c0d543699641f9e66cf65e04a3c2dea5bc68`
**Chế độ:** read-only; không sửa code, dữ liệu hay Azure.

## Kết luận ngắn

- **USER-DEMO PASS: 3/20**
- **ADMIN-DEMO PASS: 0/20**
- **PORTAL-ONLY: 4/20**
- **PARTIAL: 11/20**
- **FAIL/BLOCKED: 2/20** (`FAIL: 1`, `BLOCKED: 1`)

Dashboard kỹ thuật hiện hiển thị `17 WORKING`, nhưng con số đó **không phải** số dịch vụ có thể demo qua thao tác người dùng. Theo tiêu chí nghiêm ngặt của nhiệm vụ này, chỉ ba dịch vụ vượt qua đầy đủ: **Azure App Service Web App**, **Azure Database for PostgreSQL** và **Azure AI Search**.

Không có dịch vụ nào đạt `ADMIN-DEMO PASS`. `/cloud-services.html` là trang audit công khai, không nằm trong menu quản trị của ứng dụng; giao diện chủ yếu là các nút **Test Endpoint**, và nhiều nút không có mapping riêng nên gọi mặc định `/api/health`.

## Con số trả lời trực tiếp

> **Hiện có 3 dịch vụ thực sự demo được qua thao tác người dùng, 0 dịch vụ demo được qua giao diện quản trị, và 4 dịch vụ chỉ có thể chứng minh bằng Azure Portal.**

Ngoài ra có 11 dịch vụ tích hợp một phần/technical-only và 2 dịch vụ fail hoặc bị chặn khi kiểm chứng end-to-end.

## Phương pháp và giới hạn

- Đã đọc source frontend/backend, route thực tế và lựa chọn provider production.
- Đã kiểm tra trực tiếp UI trang chủ, tìm phòng, kết quả tìm kiếm, chi tiết phòng và dashboard cloud.
- Đã gọi các endpoint GET read-only, truy vấn resource inventory, Application Insights, Log Analytics và Action Group.
- Không tin badge `WORKING`: từng tuyên bố được đối chiếu với route, UI, response provider/fallback và Azure resource type.
- Không gọi riêng các POST test có thể phát sinh chi phí Azure. `/api/cloud/services/status` đã cung cấp aggregate runtime cho các provider đó.
- Các tài khoản demo được quảng bá trên trang login đều trả `401`; sau đó login limiter trả `429`. Kiểm toán dừng thử đăng nhập, không đoán mật khẩu và không tạo tài khoản mới.
- Vì đăng nhập bị chặn, profile, favorites, create/edit room, upload, conversations và admin pages không thể kiểm thử UI có xác thực. Chúng được đối chiếu thêm bằng source và ghi `BLOCKED` khi cần.
- Không lưu screenshot; bằng chứng UI là DOM production đã quan sát. Evidence machine-readable đặt tại `artifacts/user-demo-audit/azure-user-demo-evidence.json`.

## Kết quả kiểm thử production

| Luồng/trang | URL hoặc thao tác | Request quan sát | HTTP | Kết quả UI/runtime |
|---|---|---|---:|---|
| Trang chủ | `/` | `GET /` | 200 | Trang SmartRoomie render đầy đủ |
| Health | `/api/health` | `GET /api/health` | 200 | `status=healthy` |
| Danh sách phòng | `/rooms` | `GET /api/rooms` | 200 | 14 phòng production; card hiển thị từ DB |
| Tìm phòng Azure | nhập `sinh vien` → **Áp dụng** | `GET /api/cloud/search/rooms?q=sinh%20vien` | 200 | UI hiển thị 1 card và “Điểm phù hợp từ Azure AI Search: 1.26” |
| Chi tiết phòng | `/rooms/6c78d8e1-87f0-4b76-b292-badc2b30b21c` | `GET /api/rooms/:id` | 200 | Mô tả/giá/tiện ích hiển thị; không có dịch/nghe/bản đồ/AI analysis |
| Login | các nút demo trên `/login` | `POST /api/auth/login` | 401, sau đó 429 | BLOCKED; không có session tenant/landlord/admin |
| Tạo/sửa phòng | `/rooms/new` | redirect về `/login` | 200 page | BLOCKED do login; source form không có upload/geocode/moderation |
| Upload ảnh | không có control frontend | backend có `POST /api/media/rooms/:roomId/images` | chưa gọi | 14/14 phòng không có image; không thể demo từ UI |
| Dịch mô tả | chi tiết phòng | không có request | — | Không có nút dịch |
| Nghe mô tả | chi tiết phòng | không có request | — | Không có nút nghe/audio player |
| Geocoding | form phòng | không có request | — | Chỉ input địa chỉ text, không có xác minh tọa độ |
| Content moderation | tạo phòng/báo cáo/admin | không có request nghiệp vụ | — | Chỉ technical test endpoint |
| Language analysis | phòng/profile | không có request nghiệp vụ | — | Không có sentiment/key phrases trên UI |
| Chat hai tài khoản | `/conversations/:id` | token/message APIs yêu cầu auth | BLOCKED | Không thể chứng minh hai tài khoản nhận realtime Azure |
| Profile/favorites | `/profile`, `/favorites` | yêu cầu auth | BLOCKED | Không tạo dữ liệu mới để né lỗi credential |
| Admin/cloud operations | `/cloud-services.html` | `GET /api/cloud/services/status` | 200 | Trang kỹ thuật công khai, 17 WORKING/5 CONFIGURED/2 BLOCKED/2 RESOURCE_ONLY |

## Bảng tổng hợp

| STT | Dịch vụ | Người dùng / vai trò | URL demo và thao tác thật | API và HTTP | Azure verified | Fallback / UI | Vai trò trong bài toán | Trạng thái |
|---:|---|---|---|---|---|---|---|---|
| 1 | Azure App Service Web App | public, tenant, landlord, admin | `/` → mở ứng dụng; `/rooms` → xem nghiệp vụ | `GET /` 200; `GET /api/health` 200 | `Microsoft.Web/sites/app-smartroommate-ea`; domain `*.azurewebsites.net` | Không fallback; kết quả thấy trực tiếp | Host chính, bắt buộc cho toàn bộ Smart Roommate | **USER-DEMO PASS** |
| 2 | Azure App Service Plan | hệ thống nền | Không có UI/flow riêng | `GET /api/cloud/services/status` 200 chỉ là row mô tả | `Microsoft.Web/serverFarms/asp-smartroommate` | Không áp dụng; không thấy trên UI | Compute hosting, không phải tính năng người dùng | **PORTAL-ONLY** |
| 3 | Azure Database for PostgreSQL | public, tenant, landlord, admin | `/rooms` → mở card → chi tiết | `GET /api/rooms?limit=3` 200; `GET /api/health/database` 200 | `Microsoft.DBforPostgreSQL/flexibleServers/psql-smartroommate-ea`; `provider=postgresql`, query 14 phòng, latency 71 ms | Không fallback; dữ liệu thấy trên UI | Persistence cốt lõi cho phòng, user, favorites, chat | **USER-DEMO PASS** |
| 4 | Azure Storage Account / Blob Storage | landlord, tenant | Dự kiến upload/xem ảnh tại room form/detail, nhưng UI không có upload và production không có ảnh phòng | `GET /api/health/storage` 200; backend upload route chưa gọi | `Microsoft.Storage/storageAccounts/stsmartroommateea`; `provider=azure-blob`, container `room-images` | Provider thật nhưng UI không có kết quả; 0/14 phòng có ảnh | Đúng bài toán media nhưng mới ở backend/demo blob | **PARTIAL** |
| 5 | Azure Web PubSub | tenant, landlord | Dự kiến `/conversations/:id` → gửi/nhận realtime | `GET /api/health/realtime` 200 chỉ trả health tĩnh; token API bị chặn bởi login | `Microsoft.SignalRService/WebPubSub/wps-smartroommate-ea`; setting `REALTIME_PROVIDER=azure-web-pubsub`, hub `smart-roommate` | Frontend có fallback Socket.IO; không chứng minh group/two-account delivery | Đúng bài toán chat nhưng end-to-end chưa chứng minh | **BLOCKED** |
| 6 | Application Insights | hệ thống nền | Không có tính năng user/admin thật trong app | Azure query `requests` thành công | `Microsoft.Insights/components/appi-smartroommate`; 152 requests/1h, 150 success, 2 failure | Dashboard app chỉ hardcode claim; telemetry không hiện cho user | Observability production | **PORTAL-ONLY** |
| 7 | Log Analytics Workspace | hệ thống nền | Không có UI | Query `law-smartroommate-ea/AppRequests` trả 0 trong 1h | Resource tồn tại nhưng `appi-smartroommate.workspaceResourceId` trỏ sang `managed-appi-smartroommate-ws`, không phải `law-smartroommate-ea` | Claim “receiving workspace logs” không khớp linkage thật | Resource rời, chưa phục vụ app hiện tại | **FAIL** |
| 8 | Azure Function App Plan | hệ thống nền | Không có UI/flow riêng | Dashboard row mô tả, không có user API | `Microsoft.Web/serverFarms/EastAsiaPlan` | Không áp dụng; chỉ Portal | Compute hosting cho Function App | **PORTAL-ONLY** |
| 9 | Azure App Configuration | hệ thống nền | `/cloud-services.html` → Test Endpoint; không nằm menu admin | `GET /api/cloud/app-configuration/status` 200 | `Microsoft.AppConfiguration/configurationStores/appcs-smartroommate-ea`; `provider=azure-app-configuration`, `keyLoaded=true` | `fallback=false`; chỉ modal/JSON kỹ thuật | Chỉ đọc flag CloudDemo; không điều khiển nghiệp vụ | **PARTIAL** |
| 10 | Azure AI Content Safety | landlord/admin tiềm năng | Không gắn vào tạo tin, gửi duyệt hoặc report; chỉ Test Endpoint | Aggregate `GET /api/cloud/services/status` 200; dedicated POST không gọi riêng | `Microsoft.CognitiveServices/accounts/cog-safety-smartroommate`; aggregate chọn provider Azure | Không có kết quả kiểm duyệt trên UI; fallbackUsed không được expose | Phù hợp bài toán nhưng chưa nối luồng thật | **PARTIAL** |
| 11 | Azure AI Language | tenant/landlord tiềm năng | Không có sentiment/key phrases trên room/profile UI | Aggregate GET 200; `POST /api/cloud/language/analyze` chỉ technical | `Microsoft.CognitiveServices/accounts/cog-lang-smartroommate`; provider Azure trong aggregate | UI không thấy; source hardcode `keyPhrases` ngay cả khi Azure thành công | Chủ yếu thêm để demo endpoint | **PARTIAL** |
| 12 | Azure AI Translator | tenant | Chi tiết phòng không có nút dịch, không gửi mô tả hiện tại | Aggregate GET 200; `POST /api/cloud/translator/translate` chỉ test | `Microsoft.CognitiveServices/accounts/trsl-smartroommate-ea`; aggregate chọn `azure-translator` | Không có kết quả trên UI | Có ích cho listing đa ngôn ngữ nhưng chưa tích hợp | **PARTIAL** |
| 13 | Azure AI Vision | landlord/tenant tiềm năng | Không có upload→analyze; không render caption/tags | `GET /api/cloud/services/status` 200 nhưng trạng thái `CONFIGURED`; POST riêng không gọi | `Microsoft.CognitiveServices/accounts/cog-vision-smartroommate` | Chỉ đọc allowlisted `demo-room.jpg`; chưa xác minh `fallbackUsed=false` sau restart | Demo ảnh mẫu, không phải luồng ảnh phòng | **PARTIAL** |
| 14 | Azure Maps | landlord/tenant | Form địa chỉ không có nút xác minh; detail chỉ hiện text | `GET /api/cloud/maps/geocode?...` 200 | `Microsoft.Maps/accounts/maps-smartroommate-ea`; `provider=azure-maps`, lat/lon thật | `fallback=false`; chỉ JSON/modal kỹ thuật | Đúng bài toán địa chỉ nhưng chưa dùng trong nghiệp vụ | **PARTIAL** |
| 15 | Azure AI Search | public, tenant | `/rooms` → nhập `sinh vien` → **Áp dụng** | `GET /api/cloud/search/rooms?q=sinh%20vien` 200 | `Microsoft.Search/searchServices/srch-smartroommate-ea`; `provider/source=azure-ai-search`, `fallbackUsed=false`, `@search.score=1.255615` | UI hiển thị card + score 1.26 | Luồng tìm phòng thật; index chỉ 2 docs và giá đang lệch PostgreSQL | **USER-DEMO PASS** |
| 16 | Azure AI Speech | tenant tiềm năng | Room detail không có nút nghe/audio player | Aggregate GET 200; POST synthesize chỉ technical | `Microsoft.CognitiveServices/accounts/spch-smartroommate-ea`; aggregate chọn Azure, báo `audio/mpeg` | Endpoint trả JSON metadata/length, không trả audio bytes cho UI | Tính năng accessibility chưa hoàn thiện | **PARTIAL** |
| 17 | Azure Monitor Action Group | hệ thống nền | Không có UI app | Azure config query thành công | `microsoft.insights/actiongroups/Application Insights Smart Detection`; alert `Http5xx > 5` enabled và linked | Chỉ Portal; action group có 0 receiver | Monitoring, không phải chức năng người dùng | **PORTAL-ONLY** |
| 18 | Azure Function App | hệ thống nền | Dashboard kỹ thuật; không có business button | `GET /api/cloud/functions/status` 200; direct `GET https://func-smartroommate-ea.azurewebsites.net/api/health-check` 200 | `Microsoft.Web/sites/func-smartroommate-ea`; `provider=azure-functions`, `fallbackUsed=false` | Chỉ health-check JSON | Resource thật nhưng chưa xử lý nghiệp vụ Smart Roommate | **PARTIAL** |
| 19 | Azure Service Bus | hệ thống nền | Source publish event cho auth/room/favorite/chat/admin; UI test không mapping tới publish-test | `GET /api/health/messaging` 200 với `status=configured`; admin POST chưa gọi | `Microsoft.ServiceBus/namespaces/sb-smartroommate-ea`; `MESSAGING_PROVIDER=azure-service-bus` | Publish/receive chưa runtime-verified; không thấy trên UI | Kiến trúc event có ý nghĩa nhưng demo hiện chỉ configured | **PARTIAL** |
| 20 | Azure Key Vault | hệ thống nền/admin | Dashboard kỹ thuật; nút mặc định không gọi read-test | `GET /api/cloud/keyvault/status` 200 `configured`; admin POST chưa gọi | `Microsoft.KeyVault/vaults/kv-smartroommate-ea`; provider code dùng Managed Identity | Dashboard nói secrets vẫn ở App Settings; chưa có app UI/runtime read hiện hành | Demo-secret test, chưa là nguồn secret thật của app | **PARTIAL** |

## Phân tích các dịch vụ dễ bị tuyên bố sai

### Azure Web PubSub

- Production chọn `REALTIME_PROVIDER=azure-web-pubsub`, nhưng `GET /api/health/realtime` không mở socket; `health()` chỉ trả object `WORKING` tĩnh.
- Frontend `backend/public/services/chat.service.js` thử token Azure trước rồi fallback sang Socket.IO.
- Token được cấp không thấy role join group; frontend gửi `joinGroup` tới `conversation:<id>`, trong khi source không chứng minh quyền join. Cấu trúc message protocol cũng không khớp trực tiếp với check `message.conversation_id` ở view.
- Không đăng nhập được hai tài khoản nên không chứng minh kết nối tới `*.webpubsub.azure.com`, group isolation hay nhận tin hai chiều.
- Kết luận: **BLOCKED**, tuyệt đối chưa được tuyên bố realtime Azure end-to-end.

### Azure AI Search

- Đây là tích hợp duy nhất trong nhóm AI đi thẳng vào nghiệp vụ người dùng.
- `room.service.js` gọi `/api/cloud/search/rooms` khi có keyword; chỉ fallback PostgreSQL khi Azure lỗi hoặc không có kết quả.
- Production trả `provider=azure-ai-search`, `source=azure-ai-search`, `fallbackUsed=false`, `@search.score=1.255615`.
- UI hiển thị “Điểm phù hợp từ Azure AI Search: 1.26”.
- Caveat demo: index chỉ có 2 documents; card search hiển thị giá 3.500.000đ nhưng detail PostgreSQL cùng room ID là 2.325.000đ. Cần nói rõ index đang stale.

### Blob Storage

- Provider production là `azure-blob` và container health thành công.
- Tuy nhiên API phòng trả 14 phòng, **0 phòng có ảnh**; room form frontend không có input upload.
- Blob `demo-room.jpg` phục vụ kiểm tra Vision nội bộ, không phải ảnh được người dùng upload và gắn với tin phòng.
- Kết luận: backend thật nhưng UI chưa demo được, **PARTIAL**.

### Translator, Speech, Maps, Content Safety, Language và Vision

- Room detail không có nút dịch/nghe/bản đồ; room form không có geocode, upload-analyze hay moderation.
- Content Safety không nằm trong `rooms.create`, submit-for-review hay `reports.create`.
- Language không hiển thị sentiment/key phrases; `keyPhrases` trong successful provider path hiện là chuỗi hardcode.
- Speech chỉ trả JSON mô tả `audioFormat` và `audioLengthBytes`, không trả stream/file cho audio player.
- Vision chỉ phân tích blob allowlist `demo-room.jpg`, không phân tích file vừa upload.
- Vì vậy tất cả chỉ **PARTIAL**, không được demo như chức năng người dùng.

### Service Bus, Function App, Key Vault và App Configuration

- Service Bus có wiring publish domain events trong source, nhưng health chỉ `configured`; publish/receive chưa được chứng minh ở lần kiểm toán này.
- Function App gọi Azure thật và trả 200, nhưng function duy nhất là `health-check`, không phải nghiệp vụ.
- Key Vault chỉ có admin `read-test`; dashboard hiện xác nhận secret ứng dụng vẫn quản lý bằng App Settings.
- App Configuration chỉ đọc `SmartRoommate:Features:CloudDemoEnabled`; source không dùng flag này để điều khiển feature nghiệp vụ.
- Trang cloud là dashboard kỹ thuật công khai, không phải trang admin được bảo vệ. Do đó không dịch vụ nào trong nhóm này đạt `ADMIN-DEMO PASS`.

### Application Insights, Log Analytics, Plans và Action Group

- Application Insights có telemetry thật: 152 requests trong 1 giờ, nhưng chỉ demo được bằng Azure monitoring tools.
- `law-smartroommate-ea` không phải workspace mà Application Insights đang liên kết. App Insights trỏ tới `managed-appi-smartroommate-ws`; query `AppRequests` trên `law-smartroommate-ea` trả 0.
- Hai App Service Plan chỉ là compute infrastructure.
- Alert `alert-smartroommate-http5xx` enabled, scope đúng Web App và linked tới Action Group, nhưng Action Group có 0 receiver.

## Kịch bản demo 15 phút

Chỉ dùng ba dịch vụ `USER-DEMO PASS`; không mở dashboard 20 nút để gọi chúng là tính năng người dùng.

1. **Mở ứng dụng trên Azure App Service — 2 phút**
   - Mở production `/`.
   - Chỉ ra domain `app-smartroommate-ea.azurewebsites.net`, trang chủ và điều hướng hoạt động.

2. **Duyệt dữ liệu phòng thật từ PostgreSQL — 4 phút**
   - Chọn **Tìm phòng**.
   - Cho thấy danh sách nhiều phòng, giá, khu vực và tiện ích.
   - Mở chi tiết một phòng để chứng minh dữ liệu nghiệp vụ nhất quán từ API PostgreSQL.

3. **Tìm phòng bằng Azure AI Search — 4 phút**
   - Nhập `sinh vien` vào ô **Từ khóa**, bấm **Áp dụng**.
   - Cho thấy chỉ một kết quả và badge score `1.26`.
   - Mở DevTools/response nếu giảng viên yêu cầu: `provider=azure-ai-search`, `fallbackUsed=false`, `@search.score` có thật.

4. **Đối chiếu Search với tìm kiếm PostgreSQL — 3 phút**
   - Xóa keyword để quay lại danh sách PostgreSQL.
   - Giải thích rõ: có keyword thì gọi Azure Search; không keyword/bộ lọc thường thì dùng API rooms/PostgreSQL.
   - Chủ động nêu caveat index mới có 2 docs và giá đang stale để tránh bị bắt lỗi.

5. **Kết luận trung thực — 2 phút**
   - Chốt 3 dịch vụ user-demo pass.
   - Nếu cần chứng minh hạ tầng/telemetry, chuyển sang Portal cho 4 dịch vụ `PORTAL-ONLY`, không trộn vào số tính năng người dùng.

## Danh sách tuyên bố sai hoặc phóng đại

1. **“17 WORKING” = 17 dịch vụ demo được:** sai. Đây là trạng thái kỹ thuật tổng hợp, nhiều row hardcode hoặc test endpoint.
2. **Blob “upload & URL serving active”:** phóng đại ở góc nhìn người dùng; 0/14 phòng có ảnh và frontend không có upload.
3. **Web PubSub “real-time WebSocket chat active”:** chưa đủ bằng chứng; health tĩnh, có fallback Socket.IO, không test được hai tài khoản/group isolation.
4. **Log Analytics `law-smartroommate-ea` “Receiving workspace logs”:** sai linkage; App Insights dùng managed workspace khác.
5. **Content Safety trong kiểm duyệt tin:** sai; không được gọi từ create/submit/report/admin moderation.
6. **AI Language key phrases thật:** phóng đại; successful path hardcode key phrases.
7. **Translator trên chi tiết phòng:** sai; không có nút và không dùng description hiện tại.
8. **Speech phát mô tả:** sai; không có nút/audio player, API chỉ trả metadata JSON.
9. **Maps xác minh địa chỉ người dùng nhập:** sai; form chỉ lưu text, không geocode.
10. **Vision tự phân tích ảnh upload:** sai; chỉ dùng demo blob allowlist và không render caption/tags.
11. **Function App là nghiệp vụ serverless:** phóng đại; chỉ có health-check.
12. **Service Bus đã publish/receive runtime trong demo hiện tại:** chưa chứng minh; health chỉ configured.
13. **Key Vault quản lý secret production:** sai theo chính dashboard; App Settings vẫn là nguồn secret, Key Vault chỉ read-test.
14. **Cloud dashboard là admin UI:** sai; trang public, không nằm trong app admin menu, nhiều nút mặc định gọi generic `/api/health`.

## Danh sách sửa tối thiểu

### P0 — sửa tuyên bố sai hoặc luồng chính không dùng Azure

- Sửa linkage/claim của `law-smartroommate-ea`, hoặc nối Application Insights vào đúng workspace rồi chứng minh ingestion.
- Khôi phục tài khoản demo production và tránh hiển thị credential không còn hợp lệ; kiểm tra login trước buổi demo.
- Hoàn thiện Web PubSub roles, group join, protocol parsing và test hai tài khoản + outsider isolation; bỏ badge WORKING tĩnh.
- Đồng bộ Azure AI Search index với PostgreSQL, đặc biệt giá và toàn bộ 14 phòng.
- Không tuyên bố Blob upload, Content Safety moderation, Vision upload analysis, Translator/Speech/Maps UI khi các control chưa tồn tại.

### P1 — backend đã có nhưng thiếu frontend nghiệp vụ

- Thêm upload ảnh vào form landlord và hiển thị Blob URL trên room card/detail.
- Gọi Content Safety khi lưu/gửi duyệt phòng; hiển thị trạng thái kiểm duyệt cho landlord/admin.
- Geocode địa chỉ từ form bằng Azure Maps và hiển thị tọa độ/bản đồ xác nhận.
- Thêm nút dịch description hiện tại và nút nghe trả audio có thể phát.
- Chạy Vision sau upload và lưu/hiển thị caption/tags.
- Hiển thị Language sentiment/key phrases thật; bỏ key phrases hardcode.
- Đưa Service Bus/App Config/Key Vault vào trang Cloud Operations admin được bảo vệ nếu vẫn muốn demo vận hành.

### P2 — cải thiện khả năng trình bày/demo

- Tách rõ `User Features`, `Admin Operations`, `Portal Evidence` trên dashboard.
- Mỗi nút phải hiển thị endpoint thật, provider, fallback, timestamp và correlation/request ID; không fallback về generic health.
- Thêm indicator “Azure verified / fallback” ngay trên UI nghiệp vụ Search, Blob, Translator, Speech, Maps và moderation.
- Thêm receiver test an toàn cho Action Group và tài liệu Portal demo ngắn.

## Kết luận cuối

Con số có thể bảo vệ trước giảng viên dưới góc nhìn người dùng hiện tại là **3/20**, không phải 17 hay 20. Bốn dịch vụ khác chỉ nên chứng minh qua Azure Portal; phần còn lại phải trình bày trung thực là partial, fail hoặc blocked cho tới khi có UI nghiệp vụ và bằng chứng end-to-end.
