# GitHub Actions

Các workflow chạy thật nằm trong `.github/workflows`. Thư mục này giải thích mục đích:

- `ci.yml`: cài dependency khóa bằng lockfile, lint, test và coverage.
- `deploy-app-service.yml`: deploy khi push `main`, chỉ hoạt động khi repository có secrets Azure.
- `docker.yml`: build image; push ACR chỉ khi được bật thủ công.

Không workflow nào chứa credential thật.

