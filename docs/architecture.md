# Kiến trúc

## Local

```mermaid
flowchart LR
  UI["Vanilla SPA"] --> API["Express modular monolith"]
  API --> PG["PostgreSQL"]
  API --> FS["Local uploads"]
  API --> EVT["EventEmitter"]
  API --> IO["Socket.IO"]
  API --> MEM["Memory cache"]
```

## Cloud

```mermaid
flowchart LR
  User["Browser"] --> FD["Front Door (optional)"]
  FD --> App["App Service / AKS"]
  App --> PG["Azure PostgreSQL"]
  App --> Blob["Blob Storage"]
  App --> SB["Service Bus"]
  App --> WPS["Web PubSub"]
  App --> Redis["Azure Redis"]
  App --> AOAI["Azure OpenAI"]
  SB --> Fn["Azure Functions"]
  App --> AI["Application Insights"]
  KV["Key Vault + Managed Identity"] --> App
```

Controller không biết provider cụ thể. Factory chọn implementation bằng biến môi trường. Azure matching tự fallback về rule-based khi lỗi.

## Luồng đăng phòng

```mermaid
sequenceDiagram
  participant L as Landlord
  participant API
  participant DB
  participant Bus
  L->>API: POST /rooms
  API->>DB: transaction room + amenities
  DB-->>API: committed
  API->>Bus: RoomCreated
  API-->>L: 201
```

Nếu publish lỗi, room đã commit không rollback và lỗi được ghi log.

## Upload ảnh

Client → Multer memory (MIME/size/count) → MediaService kiểm quyền → StorageProvider → metadata PostgreSQL. Azure chỉ thay provider.

## Matching

Profile → lọc chính mình/locked/not-looking → MatchingProvider → 10 tiêu chí trọng số 100 → lưu snapshot → sắp giảm dần → giải thích tiếng Việt.

## Chat và notification

REST/Socket.IO xác thực JWT → kiểm tra conversation member → lưu message → broadcast room → tạo notification người nhận → cập nhật unread/read state.

## CI/CD

```mermaid
flowchart LR
  PR --> CI["npm ci → lint → test/coverage"]
  CI -->|pass| Main
  Main --> Image["Docker build"]
  Image --> App["App Service hoặc ACR/AKS"]
```

