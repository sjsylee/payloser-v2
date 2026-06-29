# Payloser

친구들과 볼링을 치고 나면 계산이 늘 애매했습니다.  
누가 몇 스택을 먹었는지, 2명 팀이 졌을 때 1등 팀 몫은 어떻게 나누는지, 신발값과 음료수 게임은 따로 봐야 하는지. Payloser는 이런 친구들만의 복잡한 내기 룰을 빠르게 계산하고, 단톡방에 바로 공유할 수 있게 만든 모바일 중심 정산 서비스입니다.

Payloser is a mobile-first settlement service built from a simple real-life pain point: bowling fees among friends can become surprisingly hard to calculate when local loser-pays rules get involved.

## 프로젝트 한 줄 소개 / One-liner

**오늘 진 사람, 계산은 깔끔하게.**  
친구들과의 볼링비 내기를 스택 단위로 계산하고, 대표 결제자가 받을 금액까지 깔끔하게 정리합니다.

**Clean settlement for messy bowling rules.**  
The service turns friend-group bowling rules into explainable stacks, payment amounts, and shareable results.

## 문제 정의 / Problem

Payloser의 출발점은 작은 불편함입니다. 볼링장에서 게임은 재미있게 끝났는데, 계산 시간이 길어지는 순간이 자주 생깁니다. 무제한 볼링은 총 결제액을 스택 단가로 바꿔야 하고, 판마다 팀이 바뀌며, 2팀/3팀/개인전/특수 룰에 따라 부담자가 달라집니다. 여기에 한 명이 일괄 결제한 경우, 그 사람이 손해 보지 않도록 송금 목록까지 만들어야 합니다.

The project starts from a lightweight but very real problem: after bowling with friends, the game is over, but the calculation is not. Unlimited bowling requires deriving a stack unit price from total payment, team composition changes every game, and local rules can redirect burdens. The payer also needs a clear recovery list.

## 핵심 기능 / Core Features

- **그룹 기반 정산**: 같이 치는 친구 그룹을 만들고, 아직 가입하지 않은 친구는 임시 멤버로 먼저 기록합니다.
- **볼링 스택 계산**: 무제한 볼링, 팀전, 개인전, 커스텀 스택, 100점 미만 독박 같은 로컬룰을 계산합니다.
- **대표 결제 복구**: 총액과 스택을 기준으로 각 멤버의 부담액과 대표 결제자가 받을 금액을 산출합니다.
- **결과 기록과 재공유**: 저장된 기록을 다시 열어 참여자, 스택 순위, 비용 순위, 평균 점수, 공유 메시지를 확인합니다.
- **카카오 중심 초대/공유**: 단톡방에 익숙한 사용 흐름에 맞춰 카카오 로그인과 공유를 중심으로 설계합니다.

## 기술 스택 / Tech Stack

| 영역     | 선택                                                                        | 이유                                                 |
| -------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| Monorepo | pnpm workspace, Turborepo                                                   | Web/API/shared 계약과 계산 로직을 한 저장소에서 관리 |
| Web      | Next.js, TypeScript, Zustand, Tailwind CSS, Radix UI, Framer Motion, Lottie | 모바일 앱 같은 입력 흐름과 반응형 UI를 빠르게 구성   |
| API      | NestJS, TypeScript                                                          | 인증, 그룹, 정산 도메인을 모듈 단위로 분리           |
| Database | PostgreSQL, Prisma                                                          | 관계형 그룹/멤버/정산 기록 모델링에 적합             |
| Shared   | Zod, pure TypeScript calculators                                            | Web 미리보기와 API 저장 계산의 규칙 드리프트 방지    |
| Test     | Vitest, Jest, Playwright                                                    | 계산 로직, 상태 흐름, 핵심 E2E를 계층별 검증         |

## 아키텍처 / Architecture

```text
apps/
  web/        Next.js mobile-first client
  api/        NestJS REST API
packages/
  shared/     Zod contracts and pure domain calculators
  config/     Shared TypeScript/tooling configuration
docs/
  adr/        Architecture decision records
  domain/     Domain glossary and bowling rules
  portfolio/  Portfolio rationale and troubleshooting harness
  testing/    Testing strategy
```

### 설계 핵심 / Design Highlights

- **Shared calculator first**: 볼링 스택 계산은 `packages/shared`의 순수 함수로 구현해 Web preview와 API persistence가 같은 규칙을 사용합니다.
- **GroupMember identity model**: 앱 전체 친구 목록보다 그룹 안의 멤버를 중심으로 모델링합니다. 임시 멤버는 나중에 카카오 계정과 연결됩니다.
- **Owner-approved join request**: 초대 링크를 탄 사용자가 임시 멤버를 직접 선택하지 않고, 그룹 대표가 승인하며 연결합니다.
- **Public read-only result link**: 단톡방 공유 흐름을 위해 결과는 읽기 전용 토큰 링크로 확인하고, 수정/관리 권한은 로그인 뒤 처리합니다.
- **Portfolio harness**: 기술 선택, 트레이드오프, 최적화/보안 후속 과제를 문서로 누적합니다.

## 볼링 계산 모델 / Bowling Calculation Model

Payloser의 핵심 도메인은 스택입니다.

1. 무제한 볼링 총액을 총 스택으로 나눠 스택 단가를 계산합니다.
2. 각 판의 팀 구성, 점수, 순위, 로컬룰을 바탕으로 멤버별 스택을 배정합니다.
3. 스택 단가와 멤버별 스택을 곱해 부담액을 계산합니다.
4. 반올림 후 총액이 대표 결제 금액과 일치하도록 보정합니다.
5. 대표 결제자가 실제로 받을 송금 목록을 생성합니다.

The stack model keeps the local rule explainable: first allocate stacks, then convert stacks to money, then adjust rounding so the payer recovers the exact paid amount.

## 트러블슈팅 중심 설계 / Troubleshooting-driven Design

아래 항목은 실제 서비스 구현 과정에서 중요하게 검증해야 하는 문제 유형과 해결 방향입니다. 채용 관점에서는 단순 기능 구현보다, 복잡한 입력과 돈 계산을 어떻게 신뢰 가능한 구조로 만들었는지에 초점을 둡니다.

| 문제 상황                                                     | 해결 방향                                                                                | 포트폴리오 신호                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Web 미리보기와 API 저장 결과가 다를 수 있음                   | 순수 계산기를 shared package로 분리하고 동일 테스트를 기준으로 사용                      | 중복 로직 제거, 계약 중심 설계                  |
| 2팀/3팀/개인전 스택 규칙이 계속 바뀜                          | 스택 배정 이유(reason)를 함께 저장하고, 커스텀 스택과 로컬룰 override를 별도 모델로 표현 | 변경 가능한 도메인 규칙을 확장 가능하게 모델링  |
| 대표 결제자가 반올림 때문에 손해 볼 수 있음                   | 반올림 후 총액 보정 로직을 계산 계층에 포함                                              | 금액 도메인의 정확성 우선순위                   |
| 친구가 아직 가입하지 않은 상태에서 과거 기록을 남겨야 함      | `User`와 `GroupMember`를 분리하고 임시 멤버를 나중에 계정과 연결                         | 현실적인 사용자 온보딩 설계                     |
| 초대받은 사용자가 다른 사람 이름을 잘못 선택할 수 있음        | 직접 claim 대신 owner-approved join request로 변경                                       | 오남용 가능성을 UX/권한 모델로 완화             |
| 카카오 친구 목록/직접 메시지 API가 기대와 다르게 제한적임     | Kakao Login + KakaoTalk Share를 MVP 범위로 채택                                          | 외부 플랫폼 제약을 제품 흐름에 맞게 재해석      |
| 모바일 입력 카드 안쪽 스크롤이 사용성을 해침                  | 판 추가, 팀 배정, 옵션 선택을 단계형/모달형 흐름으로 분리                                | 실제 입력 환경 중심의 UX 개선                   |
| 이미지 업로드를 DB에 저장하면 배포 시 비용/성능 리스크가 있음 | MVP에서는 DB 저장을 허용하되, 배포 전 object storage 전환을 문서화                       | MVP 속도와 운영 안정성 사이의 트레이드오프 인식 |

더 자세한 트러블슈팅 기록 형식은 [docs/portfolio/troubleshooting-harness.md](./docs/portfolio/troubleshooting-harness.md)에 누적합니다.

## 테스트 전략 / Testing Strategy

- `packages/shared`: 볼링 계산, 팀 점수 보정, 커스텀 스택, 반올림, 대표 결제 복구를 Vitest로 검증합니다.
- `apps/api`: 인증, 그룹, 초대, 정산 저장/조회 흐름을 NestJS/Jest 기반으로 검증합니다.
- `apps/web`: Zustand 상태 흐름, 볼링 draft model, 주요 UI 흐름을 Vitest와 Playwright로 검증합니다.

```bash
pnpm test
pnpm test:shared
pnpm test:api
pnpm test:web
pnpm e2e
```

## 로컬 실행 / Local Development

```bash
pnpm install
docker compose -f infra/docker/compose.yaml up -d
pnpm dev
```

주요 포트:

- Web: `http://localhost:3002` 또는 실행 시 지정한 Next.js 포트
- API: `http://localhost:3001`
- Kakao OAuth local redirect: `http://localhost:3001/auth/kakao/callback`

## 문서 / Documentation

- [Context](./CONTEXT.md): 제품과 도메인 맥락
- [Bowling Rules](./docs/domain/bowling-rules.md): 볼링 계산 규칙
- [Decision Rationale](./docs/portfolio/decision-rationale.md): 기술/제품 판단 근거
- [Troubleshooting Harness](./docs/portfolio/troubleshooting-harness.md): 포트폴리오용 문제 해결 기록 형식
- [Optimization & Security Backlog](./docs/portfolio/optimization-and-security-backlog.md): 배포 전 최적화/보안 체크리스트
- [Testing Strategy](./docs/testing/strategy.md): 테스트 계층과 우선순위

## 현재 MVP 범위 / MVP Scope

현재 MVP는 볼링 정산 완성도에 집중합니다. 스크린야구, 스크린골프, RPS 기록은 확장 가능한 활동 도메인으로 남기되, 핵심 포트폴리오 시그널은 복잡한 볼링 정산과 그룹 기반 사용자 관리에 둡니다.

The current MVP focuses on bowling settlement quality. Other activities can be added later, but the primary engineering signal is complex settlement logic plus group-based identity management.
