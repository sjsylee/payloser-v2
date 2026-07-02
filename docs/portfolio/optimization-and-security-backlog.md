# 최적화와 보안 보완 목록 / Optimization And Security Backlog

이 문서는 MVP 이후 바로 챙겨야 할 성능, 운영, 보안 작업을 모아두는 목록이다. 기능 소개보다 “배포한 서비스를 계속 믿고 쓸 수 있게 만드는 작업”에 초점을 둔다.

This backlog tracks performance, operations, and security work after MVP. The focus is keeping a deployed service reliable and safe to use.

## 성능과 사용감 / Performance And UX

### 모바일 입력 속도 / Mobile Input Speed

상태: 일부 보강됨 / Status: Partially Hardened

- 6-8명이 7판을 입력하는 흐름을 기준 시나리오로 둔다.
  - Use a 6-8 member, 7-game session as the baseline scenario.
- 팀 배정, 점수 입력, 결과 확인까지 손이 덜 움직이게 만든다.
  - Reduce movement across team assignment, score input, and result review.
- iOS 숫자 입력 포커스에서 화면이 확대되지 않도록 입력 폰트 기준을 맞춘다.
  - Keep numeric input font sizes high enough to avoid iOS focus zoom.
- 자주 누르는 버튼은 엄지 영역 안에 둔다.
  - Keep high-frequency controls within thumb reach.
- 작은 카드 안 스크롤은 의도된 경우만 남긴다.
  - Avoid inner scrollbars unless the area is intentionally scrollable.

### 계산 로직 성능 / Calculator Performance

상태: 관찰 / Status: Monitor

- 계산기는 순수 함수 형태를 유지해 테스트와 벤치마크를 쉽게 한다.
  - Keep calculators pure so tests and benchmarks stay simple.
- 커스텀 스택, 개인전, 독박 룰, 팀전 보정 점수는 회귀 테스트로 묶는다.
  - Cover custom stacks, solo games, penalty rules, and team handicap scores with regression tests.
- 결과 금액은 표시 전 단계에서 반올림 정책을 통일한다.
  - Apply one rounding policy before rendering settlement amounts.

### 번들, 애니메이션, 이미지 / Bundle, Motion, And Images

상태: 열림 / Status: Open

- Lottie와 장식 모션은 첫 입력 화면을 막지 않게 지연 로드한다.
  - Lazy-load Lottie and decorative motion so they do not block the first input screen.
- 홈, 로그인, 공유 화면의 이미지는 모바일 네트워크에서도 빠르게 떠야 한다.
  - Home, login, and share images should load quickly on mobile networks.
- 실제 제품 화면에서 쓰는 애니메이션만 남기고 임시 자산은 제거한다.
  - Keep production-use motion assets only and remove temporary assets.

### 공개 링크 렌더링 / Public Link Rendering

상태: 열림 / Status: Open

- 공개 정산 결과 페이지는 앱 셸을 최소화한다.
  - Keep public result pages lighter than the full app shell.
- 카카오톡 공유 미리보기를 위한 제목, 설명, 이미지를 별도로 둔다.
  - Add dedicated title, description, and image metadata for KakaoTalk share previews.
- 공유 링크가 오래 열려 있어도 내부 상태나 세션 정보가 새지 않게 한다.
  - Ensure public links never expose private session or app state.

## 보안과 개인정보 / Security And Privacy

### 공개 정산 링크 / Public Share Tokens

상태: MVP 기준 보강됨 / Status: Hardened For MVP

- 충분히 긴 랜덤 토큰을 사용한다.
  - Use high-entropy tokens.
- 공개 링크는 읽기 전용으로만 동작한다.
  - Public links are read-only.
- 대표가 링크를 취소할 수 있어야 한다.
  - Owners can revoke share links.
- 검색 엔진 수집을 막는다.
  - Prevent search indexing.
- 내부 사용자 ID와 원본 토큰을 응답에 포함하지 않는다.
  - Do not expose internal user IDs or raw tokens.
- 현재 공개 read model은 정리된 데이터만 내려주고 `X-Robots-Tag: noindex, nofollow`를 사용한다.
  - The current public read model is sanitized and uses `X-Robots-Tag: noindex, nofollow`.

### 초대 링크 / Invite Tokens

상태: MVP 기준 보강됨 / Status: Hardened For MVP

- 초대 링크도 충분히 긴 랜덤 토큰을 사용한다.
  - Invite links also use high-entropy tokens.
- 만료와 취소를 지원한다.
  - Support expiration and revocation.
- 승인 전에는 그룹명처럼 필요한 최소 정보만 보여준다.
  - Show only minimal group information before approval.
- 이미 그룹에 들어간 사용자가 다시 링크를 타면 중복 가입 요청을 만들지 않는다.
  - Do not create duplicate join requests for existing group members.

### 멤버 연결과 권한 / Member Claiming And Roles

상태: 열림 / Status: Open

- 초대받은 사용자는 임시 멤버를 직접 고르지 않고 가입 요청을 만든다.
  - Invitees create join requests instead of selecting temporary members directly.
- 대표가 요청을 보고 임시 멤버와 연결하거나 새 멤버로 승인한다.
  - The owner links the requester to a temporary member or approves them as new.
- 잘못 연결한 멤버는 대표가 해제할 수 있어야 한다.
  - Owners can unlink incorrectly approved members.
- 탈퇴, 비활성화, 표시 이름 변경은 과거 정산 기록을 깨지 않아야 한다.
  - Leaving, deactivation, and display-name edits must not break historical settlements.
- 대표 권한 변경은 감사 가능한 기록을 남긴다.
  - Owner transfer should leave an auditable record.

### 인증과 세션 / Authentication And Sessions

상태: 일부 보강됨 / Status: Partially Hardened

- 운영 환경은 카카오 OAuth와 HTTP-only 쿠키를 사용한다.
  - Production uses Kakao OAuth and HTTP-only cookies.
- 개발 로그인은 운영에서 닫혀 있어야 한다.
  - Development login must be disabled in production.
- `SESSION_COOKIE_SECRET`이 없으면 운영 서버는 실패해야 한다.
  - Production should fail closed without `SESSION_COOKIE_SECRET`.
- 상태 변경 요청은 허용된 웹 origin에서 온 요청만 받는다.
  - State-changing requests are checked against the configured web origin.
- 로그아웃은 서버 세션도 함께 폐기한다.
  - Logout revokes server-side sessions.
- 카카오 콜백 실패는 사용자가 이해할 수 있는 메시지로 돌아와야 한다.
  - Kakao callback failures should return visible user-facing feedback.

### 이미지 업로드 / Image Uploads

상태: 일부 보강됨 / Status: Partially Hardened

- MVP에서는 NAS Docker volume에 업로드 파일을 저장하고, DB에는 공개 URL만 저장한다.
  - For MVP, store uploaded files in a NAS-backed Docker volume and keep only public URLs in the database.
- 업로드 저장소 운영 기준은 `docs/operations/upload-storage.md`에 둔다.
  - Keep upload storage operations in `docs/operations/upload-storage.md`.
- 여러 API 인스턴스가 필요해지면 S3 또는 Cloudflare R2 같은 object storage로 옮긴다.
  - Move to S3, Cloudflare R2, or similar object storage when multiple API instances are needed.
- 파일 크기, magic byte, 이미지 해상도 제한을 유지한다.
  - Keep file size, magic-byte, and image dimension limits.
- 운영 업로드 URL은 요청 host가 아니라 `PUBLIC_API_ORIGIN`을 기준으로 만든다.
  - Production upload URLs must use `PUBLIC_API_ORIGIN`, not request host headers.

### 카카오 플랫폼 권한 / Kakao Platform Permissions

상태: MVP 공유 연결됨 / Status: MVP Share Connected

- MVP는 카카오 로그인과 카카오톡 공유만 사용한다.
  - MVP uses Kakao Login and KakaoTalk Share only.
- 그룹 초대와 정산 결과 공유는 카카오톡 공유 SDK를 먼저 시도하고, 실패하면 복사 fallback으로 이어진다.
  - Group invites and settlement shares try KakaoTalk Share first, then fall back to clipboard copy.
- 친구 API와 직접 메시지는 별도 제품 판단이 필요하므로 보류한다.
  - Friends API and direct messages stay deferred because they are a separate product decision.
- 카카오톡 공유는 사용자가 대상을 고르는 흐름으로 설계한다.
  - Design KakaoTalk Share as a user-selected recipient flow.
- 직접 발송이 필요해지면 사용 목적, 대체 경로, 쿼터, 심사 범위를 먼저 정리한다.
  - Before direct messaging, document user value, fallback behavior, quotas, and review scope.

### 로그와 비밀값 / Logs And Secrets

상태: 열림 / Status: Open

- OAuth code, access token, refresh token, 세션 쿠키, 초대 토큰 원문은 로그에 남기지 않는다.
  - Never log OAuth codes, access tokens, refresh tokens, session cookies, or raw invite tokens.
- 운영 로그에는 요청 ID, 사용자 ID 해시, 실패 원인 코드 정도만 남긴다.
  - Production logs should keep request IDs, hashed user identifiers, and failure reason codes.
- GitHub Actions, Vercel, NAS `.env`의 키 이름과 용도를 운영 문서에 맞춰 유지한다.
  - Keep GitHub Actions, Vercel, and NAS environment variable names aligned with operations docs.

### 데이터 백업과 복구 / Data Backup And Restore

상태: 열림 / Status: Open

- PostgreSQL 백업 주기와 보관 기간을 정한다.
  - Define PostgreSQL backup cadence and retention.
- NAS 장애 시 복구 순서를 문서화한다.
  - Document the recovery sequence for NAS failures.
- 마이그레이션 적용 전 백업 여부를 배포 체크리스트에 넣는다.
  - Add pre-migration backup checks to the release checklist.

## 배포 전 체크리스트 / Release Readiness Checklist

환경 / Environment:

- [ ] 공개 웹 origin 설정
  - [ ] Public web origin configured
- [ ] 공개 API origin 설정
  - [ ] Public API origin configured
- [ ] 운영 `SESSION_COOKIE_SECRET` 설정
  - [ ] Production `SESSION_COOKIE_SECRET` configured
- [ ] 운영 개발 로그인 비활성화
  - [ ] Development login disabled in production

카카오 / Kakao:

- [ ] 카카오 JavaScript 도메인 등록
  - [ ] Kakao JavaScript domains registered
- [ ] 카카오 Redirect URI 등록
  - [ ] Kakao redirect URI registered
- [ ] 카카오 제품 링크 도메인 등록
  - [ ] Kakao product link domains registered
- [x] 그룹 초대 공유 연결
  - [x] Group invite share connected
- [x] 정산 결과 공유 연결
  - [x] Settlement result share connected
- [ ] 실제 모바일 카카오톡 공유 확인
  - [ ] Real mobile KakaoTalk share verified

데이터와 권한 / Data And Roles:

- [x] 공개 결과 링크 `noindex` 적용
  - [x] Public result links use noindex
- [x] 초대 링크 취소 가능
  - [x] Invite links can be revoked
- [ ] 대표가 멤버 연결 해제 가능
  - [ ] Owner can unlink member claims
- [ ] 대표가 멤버 비활성화 가능
  - [ ] Owner can deactivate members
- [ ] 정산 삭제 방어 문구 확인
  - [ ] Settlement deletion guard phrase verified

업로드와 계산 / Uploads And Calculations:

- [x] 업로드 크기와 타입 제한
  - [x] Upload size/type limits enforced
- [x] 업로드 이미지 해상도 제한
  - [x] Upload image dimension limits enforced
- [ ] NAS 업로드 volume 백업 확인
  - [ ] NAS upload volume backup verified
- [ ] 스택, 반올림, 개인전, 팀전, 독박 룰 회귀 테스트
  - [ ] Regression tests cover stacks, rounding, solo/team games, and penalty rules

운영 / Operations:

- [ ] GitHub Actions API 배포 성공 확인
  - [ ] GitHub Actions API deployment verified
- [ ] Vercel 웹 배포 환경변수 확인
  - [ ] Vercel web deployment environment variables verified
- [ ] DB 백업과 복구 절차 확인
  - [ ] Database backup and restore process verified
