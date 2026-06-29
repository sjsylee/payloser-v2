# Troubleshooting Harness

이 문서는 Payloser를 포트폴리오로 설명할 때 사용할 문제 해결 기록 형식입니다.  
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

### 포트폴리오 신호 / Portfolio Signal

이 사례가 보여주는 개발 역량을 한두 문장으로 정리합니다.

### 후속 과제 / Follow-up

성능, 보안, 운영, UX 개선 과제를 기록합니다.
```

## 대표 트러블슈팅 후보 / Candidate Cases

### Web preview and API persistence can drift

웹 미리보기와 서버 저장 계산이 다르면 돈 계산 서비스의 신뢰가 무너집니다. 계산 로직을 shared pure calculator로 분리하고, Web과 API가 같은 입력 계약과 테스트를 기준으로 사용하도록 유지합니다.

### Rounding can make the representative payer lose money

정산 금액을 10원 또는 100원 단위로 반올림하면 전체 합계가 대표 결제 금액과 달라질 수 있습니다. 계산 계층에서 반올림 후 총액 보정 로직을 포함하고, 대표 결제 복구 금액을 별도 결과로 산출합니다.

### Temporary members need safe account linking

친구가 가입하기 전에도 정산 기록은 만들어져야 합니다. `User`와 `GroupMember`를 분리하고, 초대 링크를 통한 가입 요청은 대표가 승인해 임시 멤버와 연결합니다. 이 방식은 잘못된 claim과 장난성 연결을 줄입니다.

### Kakao APIs do not equal Kakao group chat membership

카카오 로그인, 친구 목록, 공유 API는 각각 권한과 제약이 다릅니다. MVP는 사용자가 실제로 단톡방에 링크를 올리는 행동에 맞춰 KakaoTalk Share를 중심으로 설계하고, 친구 목록/직접 메시지는 후속 검토로 분리합니다.

### Mobile-first input can fail through small scroll traps

볼링장에서 6-8명의 팀과 점수를 여러 판 입력해야 하므로, 작은 카드 내부 스크롤은 입력 피로도를 높입니다. 단계형 정산 흐름, 팀 선택 모달, 옵션 popover, 저장 완료 피드백으로 고빈도 입력을 나눕니다.

### DB-backed image upload is acceptable only as an MVP constraint

그룹 이미지 업로드를 DB 기반으로 처리하면 MVP 개발 속도는 빠르지만, 배포 환경에서는 저장 비용과 응답 성능 문제가 생길 수 있습니다. 배포 전 object storage 전환 여부, 파일 크기 제한, MIME 검증을 반드시 점검합니다.
