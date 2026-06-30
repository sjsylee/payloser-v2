# 트러블슈팅 하네스 / Troubleshooting Harness

이 문서는 Payloser에서 반복해서 마주칠 수 있는 문제를 같은 형식으로 정리하기 위한 기록 방식입니다.  
This document defines a reusable troubleshooting format for portfolio-ready engineering notes.

목표는 작업 메모를 남기는 것이 아니라, 제품 품질과 기술 판단을 설명할 수 있는 사례를 정리하는 것입니다.

## 작성 원칙 / Writing Principles

- 한국어를 중심으로 작성하고, 핵심 제목이나 요약에는 영어 병기를 허용합니다.
- “무엇을 만들었는가”보다 “왜 문제가 되었고, 어떤 구조로 해결했는가”를 먼저 적습니다.
- 개인적인 의사 표현이나 대화체를 피하고, 프로젝트/제품 관점으로 서술합니다.
- 실제 코드와 문서 링크를 붙여 검증 가능한 기록으로 남깁니다.
- 해결하지 않은 문제는 숨기지 않고, 명확한 후속 계획으로 분리합니다.

## 기록 템플릿 / Entry Template

```md
## 문제 제목 / Issue Title

Date: YYYY-MM-DD
Status: Resolved | Mitigated | Monitoring | Deferred
Area: Domain Logic | UX | Auth | API | Data | Performance | Security

### 배경 / Context

사용자 경험, 도메인 규칙, 기술 구조 중 어떤 부분에서 문제가 발생할 수 있었는지 설명합니다.

### 문제 / Problem

단순 증상이 아니라, 방치했을 때 제품 신뢰도나 유지보수성에 어떤 영향을 주는지 적습니다.

### 원인 후보 / Root Cause Hypothesis

가능한 원인을 정리합니다. 확정된 원인과 가설은 구분합니다.

### 해결 / Solution

구조, 코드, UX, 정책 중 무엇을 변경했는지 적습니다.

### 검증 / Verification

실행한 테스트, 타입체크, 수동 QA, 남은 리스크를 적습니다.

### 기술적으로 남길 점 / Technical Takeaway

이 문제가 왜 단순 버그가 아니라 구조적으로 의미 있는 문제였는지 정리합니다.

### 후속 과제 / Follow-up

성능, 보안, 운영, UX 개선 과제를 기록합니다.
```

## 대표 트러블슈팅 후보 / Candidate Cases

### Web/API 계산 규칙이 어긋날 수 있음 / Web/API calculation drift

웹 미리보기와 서버 저장 계산이 다르면 돈 계산 서비스의 신뢰가 무너집니다. 계산 로직을 shared pure calculator로 분리하고, Web과 API가 같은 입력 계약과 테스트를 기준으로 사용하도록 유지합니다.

### 반올림과 총액 보정이 틀어질 수 있음 / Rounding and total reconciliation

정산 금액을 10원 또는 100원 단위로 반올림하면 전체 합계가 대표 결제 금액과 달라질 수 있습니다. 계산 계층에서 반올림 후 총액 보정 로직을 포함하고, 대표 결제 복구 금액을 별도 결과로 산출합니다.

### Prisma Decimal 응답 타입이 흔들릴 수 있음 / Prisma Decimal response consistency

Prisma의 금액 필드는 Decimal-like 객체로 내려올 수 있고, API 응답에서는 JavaScript number가 기대됩니다. 금액 요약과 정산 조회에서 변환 방식이 흩어지지 않도록 공통 변환 계층을 둡니다.

### shared package가 런타임마다 다르게 해석될 수 있음 / Shared package resolution across runtimes

Next.js 번들러와 NestJS `NodeNext` 타입체커는 ESM export를 다르게 해석할 수 있습니다. shared package는 dist 산출물, export 경로, 타입 선언이 API/Web 양쪽에서 같은 방식으로 resolve되는지 확인해야 합니다.

### OAuth state와 redirect 설정이 어긋날 수 있음 / OAuth state and redirect mismatch

Kakao OAuth는 state cookie, callback URI, returnTo cookie, SameSite 설정이 맞물립니다. 로컬과 배포 환경에서 redirect URI가 달라지므로 실패 시에도 세션이 오염되지 않도록 명확한 에러 복귀 경로가 필요합니다.

### 인증 확인 전 화면 노출이 생길 수 있음 / Protected screen flash before session check

클라이언트에서 세션을 확인하는 동안 보호된 그룹 화면이 잠깐 렌더링될 수 있습니다. session bootstrap이 끝나기 전에는 앱 shell 대신 로딩 상태를 보여주고, URL의 auth error도 초기화 흐름에서 정리합니다.

### 공개 결과 링크의 데이터 경계가 모호해질 수 있음 / Public share token data boundary

정산 결과는 단톡방 공유를 위해 바로 열려야 하지만, 수정과 관리 권한까지 열리면 안 됩니다. read-only token link에서 보여줄 데이터와 로그인 후 가능한 액션을 분리하고, noindex/revocation/expiry를 배포 전 과제로 관리합니다.

### DB 기반 이미지 업로드는 MVP 제약으로만 적합함 / DB-backed image upload is acceptable only as an MVP constraint

그룹 이미지 업로드를 DB 기반으로 처리하면 MVP 개발 속도는 빠르지만, 배포 환경에서는 저장 비용과 응답 성능 문제가 생길 수 있습니다. 배포 전 object storage 전환 여부, 파일 크기 제한, MIME 검증을 반드시 점검합니다.
