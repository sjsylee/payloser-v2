# Payloser 사례 정리 노트 / Case Study Notes

## 한 줄 요약 / One-line Summary

Payloser는 친구들과의 볼링 내기처럼 로컬룰이 복잡한 정산을 모바일에서 빠르게 입력하고, 계산 근거까지 공유할 수 있게 만든 서비스입니다.  
Payloser is a mobile-first settlement app for friend-group games where messy local rules, temporary members, and Kakao sharing are treated as product constraints.

## 문제 배경 / Problem Frame

친구들과 볼링을 치면 계산은 영수증 하나를 나누는 일이 아닙니다. 실제로는 아래 조건이 한꺼번에 섞입니다.

- 판마다 팀이 바뀝니다.
- 로컬룰은 현장에서 합의되고 자주 바뀝니다.
- 한 사람이 먼저 결제하는 경우가 많습니다.
- 아직 앱에 가입하지 않은 친구도 기록에 남겨야 합니다.
- 결과는 카카오톡 단톡방에 바로 공유되어야 합니다.
- 각자 왜 그 금액을 내야 하는지 납득할 수 있어야 합니다.

In short, the hard part is not recording a receipt. The hard part is making changing local rules understandable and trustworthy.

## 제품 관점의 차별점 / Product Differentiator

Payloser는 로컬룰 정산을 부가 기능이 아니라 제품의 중심으로 봅니다. 볼링 스택 모델, 임시 멤버 연결, 카카오 공유 흐름은 모두 실제 친구 그룹이 계산하는 방식에서 출발합니다.

The app treats local-rule settlement as the core product, not an afterthought.

## 기술 관점의 차별점 / Technical Differentiator

- Monorepo와 shared TypeScript 계약으로 Web 미리보기와 API 저장 계산을 맞춥니다.
- 순수 계산기로 도메인 복잡도를 UI 상태와 분리합니다.
- Kakao OAuth는 로그인에, KakaoTalk Share는 실제 공유 흐름에 사용합니다.
- PostgreSQL/Prisma로 장기 누적 통계와 과거 기록을 보존합니다.
- 모바일 입력은 한 화면에 몰아넣지 않고 단계형 흐름으로 나눕니다.

## 기술적으로 보여줄 수 있는 부분 / Technical Angles

### 도메인 모델링 / Domain Modeling

금액을 바로 나누지 않고 스택을 먼저 배정합니다. 이는 실제 그룹이 사용하는 언어와 맞고, 계산 근거를 설명하기 쉽습니다.

### 사용자 연결 / Identity Linking

친구가 아직 가입하지 않아도 임시 멤버로 정산을 기록할 수 있습니다. 이후 카카오 로그인 사용자가 해당 멤버와 연결되면 과거 기록을 잃지 않습니다.

### 제품과 외부 API 경계 / Product/API Boundary

카카오 친구 목록 API에 무리하게 의존하지 않고, 실제 사용 행동에 가까운 단톡방 공유 흐름을 MVP 중심에 둡니다.

### UX 개선 / UX Iteration

단일 긴 입력 폼 대신 준비, 판 입력, 결과 확인으로 흐름을 나눴습니다. 볼링장에서 여러 판을 반복 입력하는 상황을 기준으로 설계했습니다.

### 신뢰성 / Trust

돈 계산 서비스는 최종 금액만 보여줘서는 부족합니다. Payloser는 계산 미리보기, 스택 이유, 저장된 결과 재확인, 공유 메시지를 함께 다룹니다.

## 추후 측정할 지표 / Metrics To Capture Later

- 6-8명이 7판을 입력하는 데 걸리는 시간
- 한 판을 추가하고 팀을 배정하는 탭 수
- 임시 멤버 연결 승인에서 발생하는 오류율
- 공유 링크를 비로그인 상태로 열어본 비율
- 임시 멤버가 실제 계정으로 연결되는 비율
- 계산기 테스트 커버리지와 엣지 케이스 수

## 추후 캡처할 화면 / Screenshots To Capture Later

- 로그인/온보딩 화면
- 로비와 그룹 선택
- 초대와 멤버 상태가 보이는 그룹 관리
- 볼링 정산 준비 단계
- 판별 팀 배정과 점수 입력
- 부담액 기준으로 정렬된 결과 페이지
- 공개 결과 링크
- 초대 승인 대기/승인 화면

## 추후 글로 풀어낼 흐름 / Story Spine For Future Write-up

1. 실제 문제: 친구 그룹은 일반 더치페이 앱이나 스프레드시트로 표현하기 어려운 로컬룰을 사용합니다.
2. 도메인 통찰: 공정함의 단위는 돈이 아니라 스택이며, 돈은 마지막 변환 결과입니다.
3. 제품 제약: 모든 친구가 처음부터 앱 사용자는 아니므로 멤버와 계정은 나중에 연결 가능해야 합니다.
4. 플랫폼 제약: 카카오는 공유 표면이지만, 자유로운 소셜 그래프 DB가 아닙니다.
5. 기술 대응: shared calculator, token link, temporary member, mobile-first entry로 흐름을 구성합니다.
6. 결과: 단발성 계산기를 넘어 장기 그룹 통계로 확장 가능한 서비스 MVP가 됩니다.
