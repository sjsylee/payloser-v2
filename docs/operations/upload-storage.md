# 이미지 업로드 저장소 / Image Upload Storage

Payloser는 그룹 사진과 홈 카드 배경 이미지를 API 서버에 업로드하고, PostgreSQL에는 공개 이미지 URL만 저장한다.

Payloser uploads group profile and cover images to the API server. PostgreSQL stores only the public image URL.

## MVP 권장안 / MVP Recommendation

MVP에서는 별도 스토리지 서비스 없이 NAS의 Docker volume을 업로드 저장소로 사용한다.

For the MVP, use a NAS-backed Docker volume instead of an external object storage service.

- API 컨테이너의 `UPLOADS_DIR`를 영속 volume에 연결한다.
- `PUBLIC_API_ORIGIN`은 외부에서 접근 가능한 API origin으로 고정한다.
- DB에는 이미지 바이너리를 넣지 않고 `Group.imageUrl`, `Group.coverImageUrl`만 저장한다.
- NAS 백업 정책에 업로드 volume을 포함한다.

Example:

```yaml
services:
  api:
    environment:
      UPLOADS_DIR: /app/apps/api/uploads
      PUBLIC_API_ORIGIN: https://api.example.com
    volumes:
      - payloser-api-uploads:/app/apps/api/uploads

volumes:
  payloser-api-uploads:
```

## 왜 DB에 파일을 넣지 않는가 / Why Not Store Files In PostgreSQL

PostgreSQL에 이미지 원본을 bytea/base64로 저장하는 것도 가능은 하다. 다만 이 서비스에서는 이미지가 정산 데이터보다 훨씬 크고, 브라우저가 매번 직접 읽어야 하므로 DB 백업 크기와 API 응답 비용이 빠르게 커진다.

Storing image bytes in PostgreSQL is possible, but uploaded images are much larger than settlement metadata. Keeping files in the database would increase backup size and API response cost without giving much benefit for this use case.

## 이후 전환 지점 / Later Migration Point

사용자가 늘거나 여러 API 인스턴스를 띄우게 되면 S3, Cloudflare R2 같은 object storage로 `UploadsService` 구현만 교체한다. 도메인 모델은 이미 URL 메타데이터만 바라보므로, DB schema 변경 없이 저장소를 바꿀 수 있다.

When traffic grows or multiple API instances are introduced, replace the `UploadsService` implementation with S3, Cloudflare R2, or another object storage provider. The domain model already stores URLs only, so the migration does not require a schema change.

## 배포 체크 / Deployment Check

- `UPLOADS_DIR`가 컨테이너 내부 임시 경로가 아니라 영속 volume을 가리키는지 확인한다.
- `PUBLIC_API_ORIGIN`이 예시값이나 localhost로 남아 있지 않은지 확인한다.
- `/uploads/groups/{file}` URL이 HTTPS로 직접 열리는지 확인한다.
- API 재배포 후에도 기존 업로드 이미지가 남아 있는지 확인한다.
