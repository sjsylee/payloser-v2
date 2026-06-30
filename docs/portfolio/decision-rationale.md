# 판단 근거 기록 / Decision Rationale Log

## 전역 친구 목록보다 그룹 멤버를 먼저 모델링 / Use Group Members Instead Of App-wide Friends

Date: 2026-06-29  
Status: Accepted

### 문제 / Problem

Payloser에 필요한 관계는 “앱 안의 모든 친구”가 아니라 “같은 그룹에서 정산을 함께 하는 사람들”입니다. 카카오 친구 목록을 먼저 가져오면 권한 부담이 커지고, 실제 카카오 단톡방 멤버 전체를 안정적으로 표현하지도 못합니다.

The product relationship is not a global friend graph. It is the set of people who settle costs inside the same group.

### 결정 / Decision

MVP의 관계 모델은 `GroupMember`를 중심으로 둡니다. 멤버는 카카오 로그인 `User`와 연결될 수도 있고, 아직 가입하지 않은 임시 멤버로 남을 수도 있습니다.

### 이유 / Rationale

친구 그룹에는 과거 기록, 별명, 아직 가입하지 않은 사람이 자연스럽게 섞입니다. 임시 멤버를 허용하면 모든 친구가 가입하기 전에도 정산을 시작할 수 있고, 이후 계정 연결로 기록을 이어갈 수 있습니다.

### 트레이드오프 / Trade-offs

- MVP에는 앱 전체 친구 목록이 없습니다.
- 한 사용자가 여러 그룹에서 각각 다른 `GroupMember`로 나타날 수 있습니다.
- 그룹 간 중복 신원 정리는 후속 과제로 둡니다.

### 기술적으로 남길 점 / Technical Takeaway

소셜 네트워크 구조를 그대로 가져오지 않고, 정산이라는 실제 도메인에 맞는 관계 모델을 먼저 세운 판단을 보여줍니다.

### 후속 과제 / Follow-up

- 대표 전용 연결 해제와 비활성 멤버 관리
- 반복 사용 데이터가 쌓인 뒤 cross-group identity 계층 검토

## 초대는 대표 승인 기반 가입 요청으로 처리 / Invite Flow Uses Owner-approved Join Requests

Date: 2026-06-29  
Status: Accepted

### 문제 / Problem

초대받은 사용자가 직접 임시 멤버를 선택하게 하면 실수나 장난으로 다른 사람의 이름을 claim할 수 있습니다. 이 경우 과거 정산 기록과 실제 사용자가 잘못 연결됩니다.

If invitees directly claim temporary members, mistakes or abuse can connect records to the wrong user.

### 결정 / Decision

초대 링크는 그룹 단위로 유지합니다. 초대받은 사용자는 로그인 후 `GroupJoinRequest`를 만들고, 그룹 대표가 기존 임시 멤버에 연결하거나 새 멤버를 만들어 승인합니다.

### 이유 / Rationale

링크 구조는 단톡방 공유와 1:1 공유에서 동일하게 유지하면서, 실제 신원 매칭은 그룹 맥락을 아는 대표가 처리합니다. 승인 전에는 멤버 목록을 과하게 노출하지 않는 장점도 있습니다.

### 트레이드오프 / Trade-offs

- 가입 완료까지 대표 승인이라는 한 단계가 추가됩니다.
- 대표에게 요청 관리 UI가 필요합니다.
- 대기 중 사용자는 승인 전까지 제한된 상태를 보게 됩니다.

### 기술적으로 남길 점 / Technical Takeaway

가입 편의성만 보지 않고, 잘못된 기록 연결이라는 현실적인 리스크를 권한과 UX 흐름으로 줄인 점을 보여줍니다.

### 후속 과제 / Follow-up

- 가입 요청 취소와 거절 상태 메시지
- 대표에게 대기 요청 알림
- 잘못 승인된 멤버의 연결 해제와 비활성화

## 카카오 친구 API와 직접 메시지는 MVP에서 보류 / Defer Kakao Friends API And Direct Messages

Date: 2026-06-29  
Status: Accepted

### 문제 / Problem

사용자는 “카카오 친구를 고른다”는 경험을 기대할 수 있지만, 일반 웹앱이 카카오 단톡방 멤버 목록을 자유롭게 가져올 수 있는 것은 아닙니다. 친구 목록과 직접 메시지 API는 추가 권한, 심사, 사용자 동의, 쿼터 처리가 필요합니다.

Kakao APIs do not provide arbitrary group chat membership to a normal web app.

### 결정 / Decision

MVP는 카카오 로그인을 신원 확인에 사용하고, 초대와 결과 공유는 KakaoTalk Share를 중심으로 설계합니다. 친구 목록과 직접 메시지 발송은 후속 검토로 둡니다.

### 이유 / Rationale

실제 사용 흐름은 단톡방에 링크를 올리는 방식에 가깝습니다. KakaoTalk Share는 이 행동과 잘 맞고, 권한 부담이 큰 연락처 기반 UI를 섣불리 만들지 않아도 됩니다.

### 트레이드오프 / Trade-offs

- MVP에서 앱이 특정 카카오 친구에게 직접 메시지를 보내지는 않습니다.
- 초대와 공유는 사용자가 올바른 채팅방에 링크를 보내는 방식에 의존합니다.

### 기술적으로 남길 점 / Technical Takeaway

외부 플랫폼의 제약을 무시하지 않고, 실제 사용자 행동과 맞는 API 범위를 선택한 점을 보여줍니다.

### 후속 과제 / Follow-up

- 초대 링크 사용률과 불편 사례를 본 뒤 Friends API 재검토
- 추가 권한 요청 전 사용자 가치, fallback, 쿼터 영향 문서화

## 결과 공유는 읽기 전용 공개 링크로 처리 / Public Read-only Result Links

Date: 2026-06-29  
Status: Accepted

### 문제 / Problem

정산 결과는 단톡방에서 공유됩니다. 모든 사람이 로그인해야 결과를 볼 수 있다면 공유 경험이 느리고 답답해집니다.

If every viewer must log in before seeing a result, the sharing flow becomes slow.

### 결정 / Decision

토큰 기반 읽기 전용 결과 링크를 사용합니다. 비로그인 사용자는 요약과 송금 정보를 볼 수 있고, 수정/관리/누적 통계는 로그인 후 접근합니다.

### 이유 / Rationale

송금 목록은 애초에 단톡방 공유를 전제로 합니다. 첫 확인은 가볍게 열려야 하고, 민감한 행위는 인증 뒤 처리하는 편이 UX와 보안의 균형이 좋습니다.

### 트레이드오프 / Trade-offs

- 토큰을 가진 사람은 읽기 전용 결과를 볼 수 있습니다.
- 공개 배포 전에는 링크 만료, 폐기, noindex 처리가 필요합니다.

### 기술적으로 남길 점 / Technical Takeaway

읽기 편의성과 관리 권한을 분리해, 공유 UX와 개인정보 리스크 사이의 균형을 잡은 점을 보여줍니다.

### 후속 과제 / Follow-up

- 공유 링크 폐기
- noindex metadata
- 링크 만료 옵션

## 볼링 계산은 스택을 먼저 배정 / Stack-based Bowling Calculator

Date: 2026-06-29  
Status: Accepted

### 문제 / Problem

볼링비 내기는 단순 분배가 아닙니다. 무제한 볼링은 총액을 스택 단가로 바꿔야 하고, 팀 크기와 순위가 판마다 바뀌며, 개인전과 로컬룰이 부담액을 다시 바꿀 수 있습니다.

Bowling settlement needs a domain model before money can be calculated.

### 결정 / Decision

금액을 바로 나누지 않고, 먼저 멤버별 스택을 배정합니다. 이후 스택을 돈으로 변환하고, 반올림과 대표 결제 복구를 계산합니다.

### 이유 / Rationale

스택은 실제 그룹이 사용하는 언어입니다. 계산 단위를 도메인 언어와 맞추면 UI 설명, 테스트, 로컬룰 override, 결과 공유가 모두 쉬워집니다.

### 트레이드오프 / Trade-offs

- 입력 UI에서 스택 개념을 충분히 설명해야 합니다.
- 반올림 후 총액 보정이 반드시 필요합니다.

### 기술적으로 남길 점 / Technical Takeaway

현실적인 로컬룰을 계산 가능한 모델로 바꾸고, 공정성·설명 가능성·정확성을 함께 다룬 점을 보여줍니다.

### 후속 과제 / Follow-up

- 공개 계산 근거 페이지
- 로컬룰 override와 반올림 엣지 케이스 테스트 확대
- 큰 세션에 대한 계산 성능 측정

## Web과 API는 공유 계약과 순수 계산기를 사용 / Shared TypeScript Contracts And Pure Domain Logic

Date: 2026-06-29  
Status: Accepted

### 문제 / Problem

Web은 즉시 미리보기를 제공해야 하고, API는 저장 결과의 기준점이어야 합니다. 둘이 계산이나 validation을 따로 구현하면 시간이 지날수록 결과가 어긋날 수 있습니다.

Preview and persistence can drift if calculation logic is duplicated.

### 결정 / Decision

pnpm monorepo 안의 `packages/shared`에 Zod 계약과 순수 계산기를 둡니다. Web과 API는 같은 계약과 계산기를 사용합니다.

### 이유 / Rationale

복잡한 도메인 규칙을 한 번 테스트하고, 브라우저 미리보기와 서버 저장에서 재사용할 수 있습니다. Prisma 모델은 API 내부에 남겨 DB 구조와 클라이언트 계약을 분리합니다.

### 트레이드오프 / Trade-offs

- shared package의 책임 범위를 계속 관리해야 합니다.
- DB record와 shared contract 사이의 명시적 mapping이 필요합니다.

### 기술적으로 남길 점 / Technical Takeaway

복잡한 계산을 UI와 인프라에서 분리해 테스트 가능하고 재사용 가능한 구조로 만든 점을 보여줍니다.

### 후속 과제 / Follow-up

- shared package를 schemas, types, pure logic 중심으로 유지
- 공개 공유 링크와 초대 흐름의 contract test 추가
