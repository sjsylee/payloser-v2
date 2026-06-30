# 포트폴리오 문서 하네스 / Portfolio Documentation Harness

이 디렉터리는 Payloser의 제품 판단, 기술 선택, 트러블슈팅, 최적화/보안 과제를 포트폴리오 문서로 정리하기 위한 공간입니다.  
This directory keeps product decisions, technical rationale, troubleshooting notes, and release-hardening items in a portfolio-ready format.

목표는 작업 메모를 쌓는 것이 아니라, 처음 보는 사람도 프로젝트의 문제 정의, 해결 방식, 트레이드오프를 빠르게 이해할 수 있게 만드는 것입니다.

## 사용 방식 / How To Use

새로운 판단이나 문제 해결 사례가 생기면 아래 문서 중 하나를 갱신합니다.

- `decision-rationale.md`: 기술, 제품, 도메인 판단 근거를 기록합니다. / Records product, technical, and domain decisions.
- `case-study-notes.md`: 추후 공개 사례 글로 다듬을 내용을 모읍니다. / Collects raw material for a future case study.
- `troubleshooting-harness.md`: 문제 해결 기록을 같은 형식으로 남기기 위한 템플릿입니다. / Provides a reusable troubleshooting note format.
- `optimization-and-security-backlog.md`: 배포 전 최적화, 보안, 개인정보, 운영 과제를 관리합니다. / Tracks performance, security, privacy, and release-readiness items.

## 판단 근거 기록 형식 / Decision Entry Format

```md
## 결정 제목 / Decision Title

Date: YYYY-MM-DD
Status: Accepted | Trial | Deferred | Revisit

### 문제 / Problem

무엇이 불명확했거나, 제품 품질과 유지보수성에 어떤 위험이 있었는지 적습니다.

### 결정 / Decision

어떤 방향을 선택했는지 적습니다.

### 이유 / Rationale

왜 지금 이 제품에 이 선택이 적합한지 적습니다.

### 트레이드오프 / Trade-offs

무엇을 얻고, 무엇을 의도적으로 미뤘는지 적습니다.

### 기술적으로 남길 점 / Technical Takeaway

이 결정이 구조적으로 어떤 의미가 있었는지 짧게 정리합니다.

### 후속 과제 / Follow-up

추가 측정, 테스트, 보안, 성능, UX 개선 과제를 적습니다.
```

## 문서의 중심 / Documentation Focus

Payloser의 문서에서 가장 중요하게 보여줄 내용은 단순 CRUD가 아니라 아래 문제를 어떻게 서비스 구조로 풀었는지입니다.

- 복잡한 볼링 로컬룰을 설명 가능한 계산 모델로 만든 과정
- 임시 멤버와 실제 카카오 로그인 사용자를 안전하게 연결하는 구조
- 카카오 플랫폼 제약을 고려한 초대와 공유 흐름
- Web/API가 같은 계산 규칙을 사용하도록 만든 shared TypeScript 계약
- 모바일 입력 피로도를 줄이기 위한 단계형 UX 개선
