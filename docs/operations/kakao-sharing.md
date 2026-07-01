# 카카오톡 공유와 초대 설계 / Kakao Sharing And Invitation Setup

이 문서는 Payloser에서 카카오톡 공유를 어떻게 붙일지 정리한 운영 메모다. 구현 범위와 설정값을 확인하는 용도로 둔다.

This note is for Payloser's KakaoTalk Share implementation. It focuses on scope, settings, and release checks.

## 공식 문서에서 확인한 기준 / Verified From Official Docs

참고 문서:

- [카카오톡 공유 이해하기](https://developers.kakao.com/docs/ko/kakaotalk-share/common)
- [카카오톡 공유 웹훅](https://developers.kakao.com/docs/ko/kakaotalk-share/callback)
- [JavaScript SDK Share reference](https://developers.kakao.com/sdk/reference/js/release/Kakao.Share.html)

확인한 기준:

- 카카오톡 공유는 사용자가 직접 공유 대상을 고르는 기능이다. 서비스 서버가 특정 친구에게 직접 전송하는 구조가 아니다.
  - KakaoTalk Share is a user-initiated picker flow, not a server-side direct-send feature.
- 카카오톡 공유는 Kakao SDK로 사용한다. 공식 문서 기준 REST API 방식은 지원하지 않는다.
  - KakaoTalk Share is SDK-based; the common guide states that REST API is not supported for this product.
- 공유 버튼을 누르면 카카오톡이 실행되고, 친구 또는 채팅방 목록에서 사용자가 대상을 선택한다.
  - The share button opens KakaoTalk, then the user selects a friend or chat room.
- 친구 목록을 앱 안에서 직접 보여주거나 특정 친구에게 직접 발송하려면 카카오톡 메시지, 친구 API 트랙으로 넘어간다.
  - In-app friend lists and direct messages belong to KakaoTalk Message/Friends API, which should remain a separate track.
- 공유 성공 여부가 필요하면 카카오톡 공유 웹훅을 둔다. 이때 `serverCallbackArgs`로 Payloser 내부 식별값을 넘겨야 한다.
  - Use KakaoTalk Share webhook plus `serverCallbackArgs` when Payloser needs delivery-success signals.

## Payloser 적용 방향 / Payloser Direction

### 1. 그룹 초대 / Group Invite

- 대표가 초대 링크를 만들면 API가 초대 토큰을 발급한다.
  - The API issues an invite token when the owner creates an invite link.
- 웹은 해당 링크를 카카오톡 공유 SDK로 보낸다.
  - The web client sends the invite link through KakaoTalk Share.
- 초대받은 사용자는 로그인 후 가입 요청을 만든다.
  - Invitees sign in and create a group join request.
- 대표가 요청을 승인하며 기존 임시 멤버와 연결하거나 새 멤버로 승인한다.
  - The owner links the requester to a temporary member or approves them as a new member.

### 2. 정산 결과 공유 / Settlement Share

- 정산 저장 후 공유용 읽기 전용 링크를 만든다.
  - After saving a settlement, Payloser creates a read-only share link.
- 카카오톡 본문에는 요약만 담고, 세부 계산 근거는 링크에서 본다.
  - KakaoTalk message bodies should stay concise; detailed calculation evidence lives behind the link.
- 공유 링크는 `noindex`, 읽기 전용, 취소 가능 토큰을 기본으로 한다.
  - Share links should be read-only, noindexed, and revocable.

### 3. 공유 성공 추적 / Share Success Tracking

- MVP 직후에는 공유 버튼 클릭과 복사 fallback까지만 먼저 안정화한다.
  - Right after MVP, stabilize share click and clipboard fallback first.
- 실제 카톡 발송 성공 여부가 필요해지면 카카오톡 공유 웹훅을 붙인다.
  - Add KakaoTalk Share webhook only when delivery-success tracking is needed.
- 웹훅에는 내부 DB ID를 그대로 넣지 않고, 공유 기록 ID 또는 nonce를 `serverCallbackArgs`로 보낸다.
  - Do not expose raw DB IDs; use a share event ID or nonce in `serverCallbackArgs`.

## 구현 분리 / Implementation Split

### Web

- Kakao JavaScript SDK를 지연 로드한다.
  - Lazy-load the Kakao JavaScript SDK.
- `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`가 없거나 도메인 설정이 맞지 않으면 복사 fallback을 바로 보여준다.
  - If the JavaScript key or domain setup is missing, fall back to clipboard copy.
- 초기 구현은 `Kakao.Share.sendDefault`로 시작한다.
  - Start with `Kakao.Share.sendDefault`.
- 문구와 썸네일이 안정되면 `sendCustom`과 메시지 템플릿으로 이동한다.
  - Move to `sendCustom` and Kakao message templates once copy and thumbnail design are stable.

### API

- 초대 토큰, 공유 토큰, 공개 결과 read model을 만든다.
  - Create invite tokens, share tokens, and public result read models.
- 공유 본문에 들어갈 요약값은 API에서 계산해서 내려준다.
  - The API should prepare the share summary used by the web client.
- 웹훅을 붙일 경우 같은 콜백이 여러 번 와도 한 번만 반영되도록 처리한다.
  - Webhook handling must be idempotent.

## 카카오 개발자 콘솔 체크 / Kakao Developer Console Checklist

- JavaScript 키를 웹 배포 환경에 넣는다.
  - Set the JavaScript key in the web deployment environment.
- 로컬, 스테이징, 운영 웹 도메인을 Web 플랫폼에 등록한다.
  - Register local, staging, and production web domains.
- 카카오톡 공유 메시지에 들어가는 링크 도메인을 제품 링크 도메인에 등록한다.
  - Register link domains used in KakaoTalk Share messages.
- 공유 웹훅을 사용할 경우 콜백 URL을 등록하고 HTTPS로만 운영한다.
  - Register an HTTPS callback URL before enabling the share webhook.
- 카카오 스크랩 서버가 썸네일 이미지를 가져갈 수 있도록 공개 이미지 URL을 사용한다.
  - Use publicly reachable image URLs so Kakao can scrape thumbnails.

## 보안과 개인정보 기준 / Security And Privacy Rules

- 카카오톡 메시지 본문에는 이름, 금액, 세부 점수 같은 민감한 정보를 과하게 넣지 않는다.
  - Avoid putting excessive names, amounts, and detailed scores directly into KakaoTalk messages.
- 정산 세부 내용은 Payloser 링크에서만 확인한다.
  - Detailed settlement data should live behind Payloser links.
- 공개 링크 응답은 내부 사용자 ID, 세션 정보, 원본 토큰을 노출하지 않는다.
  - Public share responses must not expose internal user IDs, session data, or raw tokens.
- 공유 실패는 정산 저장 실패가 아니다. 저장은 유지하고 공유만 다시 시도하게 한다.
  - Share failure must not undo settlement save; allow users to retry sharing.
- 클립보드 복사는 항상 fallback으로 유지한다.
  - Clipboard copy remains the fallback.

## MVP 이후 작업 순서 / Post-MVP Work Order

1. 웹에 `kakaoShareClient` 래퍼를 만든다.
   - Add a `kakaoShareClient` wrapper on the web.
2. 그룹 초대 공유를 먼저 연결한다.
   - Connect group invite sharing first.
3. 정산 결과 공유를 연결한다.
   - Connect settlement result sharing next.
4. 공유 실패/미설정/미설치 fallback을 정리한다.
   - Finalize fallback states for failure, missing config, and unsupported environments.
5. 공유 웹훅은 실제 발송 성공 추적이 필요해진 시점에 붙인다.
   - Add the share webhook only when delivery-success tracking becomes useful.
