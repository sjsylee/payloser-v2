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

## 기록된 트러블슈팅 / Recorded Cases

### Synology NAS 배포에서 Compose 버전과 Docker 권한이 어긋남 / Docker Compose mismatch on Synology NAS

Date: 2026-06-30
Status: Mitigated
Area: Deployment | CI/CD | NAS Operations

#### 배경 / Context

Payloser API는 GitHub Actions에서 Docker image를 빌드하고, NAS가 GHCR image를 pull한 뒤 migration과 container restart를 수행하는 구조로 배포됩니다. NAS는 Synology DSM 환경이며, 로컬 개발 환경이나 GitHub Actions runner와 달리 Docker Compose 명령과 Docker daemon 권한 정책이 다를 수 있습니다.

#### 문제 / Problem

NAS에서 compose 실행 중 아래 두 증상이 함께 발생했습니다.

```plain text
WARNING: The POSTGRES_PASSWORD variable is not set. Defaulting to a blank string.
```

```plain text
PermissionError: [Errno 13] Permission denied
```

이후 수동 migration 확인 과정에서는 아래 경로 오류도 확인되었습니다.

```plain text
Could not load `--schema` from provided path `apps/api/prisma/schema.prisma`
```

빈 DB에서 migration을 다시 실행하는 과정에서는 초기 테이블이 없는 상태에서 증분 migration이 먼저 실행되는 문제도 확인되었습니다.

```plain text
ERROR: relation "Group" does not exist
```

API container 시작 단계에서는 shared package export 조건 문제도 확인되었습니다.

```plain text
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in @payloser/shared/package.json
```

GitHub Actions SSH deploy 단계에서는 Docker image build와 NAS `git pull`이 성공한 뒤 아래 오류가 발생했습니다.

```plain text
sh: line 7: docker: command not found
```

이후 Docker binary 경로를 찾도록 보완한 뒤에는, 배포 계정이 Docker daemon에 접근하지 못하는 권한 문제가 남아 있음을 확인했습니다.

```plain text
Docker is installed at /usr/local/bin/docker, but <user> cannot access the Docker daemon.
Grant Docker access to the deploy user or configure passwordless sudo for Docker commands.
```

첫 번째 증상은 DB 비밀번호와 Cloudflare Tunnel token 같은 운영 secret이 container에 제대로 전달되지 않을 수 있다는 신호입니다. 두 번째 증상은 배포 계정이 Docker daemon에 접근하지 못한다는 뜻이므로, GitHub Actions의 SSH 배포 단계도 같은 지점에서 실패할 수 있습니다. schema 오류는 monorepo root와 package context가 섞일 때 발생하며, migration command가 컨테이너 안에서 어떤 작업 디렉터리를 기준으로 실행되는지 확인해야 합니다. `Group` relation 오류는 빈 DB에 적용할 초기 schema migration이 빠져 있으면 발생합니다. shared export 오류는 Web 번들러의 ESM import와 NestJS runtime의 CommonJS require 조건이 다를 때 발생합니다. Docker command 오류는 DSM에 직접 로그인한 shell과 GitHub Actions가 여는 non-login SSH shell의 `PATH`가 다를 때 발생합니다.

#### 원인 후보 / Root Cause Hypothesis

- Synology NAS의 Compose 환경이 `docker compose` v2가 아니라 legacy `docker-compose` v1일 수 있습니다.
- `docker-compose` v1은 `env_file` 값을 container runtime에는 전달하지만, `${POSTGRES_PASSWORD}` 같은 compose 변수 치환에는 project root의 `.env` 파일을 사용합니다.
- SSH 접속 계정이 `/var/run/docker.sock`에 접근할 권한이 없으면 compose가 Docker daemon version 조회 단계에서 실패합니다.
- Cloudflare Tunnel container는 API container와 같은 Docker network 안에서 동작하므로, tunnel target은 `localhost:3001`이 아니라 service name 기반의 `http://api:3001`이어야 합니다.
- `pnpm --filter @payloser/api exec`는 command를 API package context에서 실행하므로, Prisma schema 경로는 `apps/api/prisma/schema.prisma`가 아니라 `prisma/schema.prisma`입니다.
- 개발 DB가 `db push` 또는 수동 schema 변경으로 먼저 만들어진 경우, 증분 migration만 남아 새 운영 DB에서 초기 테이블을 만들 수 없습니다.
- `@payloser/shared`가 ESM import 조건만 제공하면 CommonJS로 빌드된 NestJS dist가 package root를 require할 수 없습니다.
- Synology DSM의 Docker binary가 `/usr/local/bin`에 있어도 GitHub Actions SSH 세션에서 해당 경로가 PATH에 없을 수 있습니다.

#### 해결 / Solution

배포 설정과 문서를 함께 조정했습니다.

- API CD에서 `docker compose` v2와 `docker-compose` v1을 순서대로 감지하도록 변경했습니다.
- Compose 예시에서 `cloudflared`가 `TUNNEL_TOKEN`을 명시적으로 받아 실행되도록 수정했습니다.
- NAS 운영 문서에 `.env.production`을 `.env`로 연결하는 단계를 추가했습니다.
- 수동 배포에서는 `sudo docker-compose ...`로 Docker socket 권한 문제를 먼저 확인하도록 정리했습니다.
- migration command의 Prisma schema 경로를 package context 기준으로 수정했습니다.
- 빈 DB에서 전체 migration chain이 재생 가능하도록 초기 schema migration을 추가했습니다.
- shared package를 ESM/CJS dual build로 구성하고 Docker runner image에 CJS 산출물을 포함하도록 수정했습니다.
- API CD script에서 `/usr/local/bin`을 PATH에 추가하고 `docker`, `docker-compose` binary를 명시적으로 탐색하도록 수정했습니다.
- 자동 배포 계정은 Docker 명령을 실행할 수 있는 권한 또는 제한된 passwordless sudo 정책이 필요하다는 점을 문서화했습니다.
- GitHub Actions의 non-interactive SSH 세션에서는 sudo password prompt를 처리할 수 없으므로, `sudo -n docker info`가 통과하는지 사전 확인하도록 운영 문서에 반영했습니다.

관련 파일:

- `.github/workflows/api-deploy.yml`
- `infra/deploy/compose.api.example.yaml`
- `docs/operations/github-actions-cicd.md`

#### 검증 / Verification

- workflow와 compose YAML parse check를 수행했습니다.
- 변경 파일에 Prettier formatting을 적용했습니다.
- Prisma schema validation을 수행했습니다.
- API package directory에서 `require("@payloser/shared")`와 `require("./dist/auth/auth.schemas.js")`를 직접 확인했습니다.
- NAS 수동 실행 기준으로는 아래 순서를 확인 포인트로 정리했습니다.

```bash
cd /volume1/docker/payloser
ln -sfn .env.production .env
sudo docker-compose up -d postgres cloudflared
sudo docker-compose ps
sudo docker-compose logs -f cloudflared
sudo docker-compose run --rm api sh -lc "pnpm --filter @payloser/api exec prisma migrate deploy --schema=prisma/schema.prisma"
```

#### 기술적으로 남길 점 / Technical Takeaway

배포 자동화는 Docker image build만으로 끝나지 않습니다. 실제 운영 대상이 NAS처럼 vendor OS와 legacy toolchain을 가진 환경이면, runner에서 통과한 명령이 서버에서 그대로 동작하지 않을 수 있습니다. 따라서 배포 스크립트는 도구 버전 차이를 감지하고, 운영 문서는 secret 주입 방식과 daemon 권한 경계를 명확히 남겨야 합니다.

#### 후속 과제 / Follow-up

- GitHub Actions 배포 계정이 Docker 명령을 비밀번호 없이 실행할 수 있는 최소 권한 정책을 정합니다.
- Synology DSM 업데이트 또는 Container Manager 버전에 따라 `docker compose` v2 전환 가능성을 확인합니다.
- Cloudflare Tunnel health check와 API `/health` endpoint를 배포 검증 단계에 연결합니다.
- NAS 외부 SSH 접근은 방화벽, 포트포워딩, 접근 IP 제한 정책을 별도로 점검합니다.

### Web CD에서 shared package를 찾지 못함 / Shared package not resolved during Web CD

Date: 2026-06-30
Status: Resolved
Area: CI/CD | Frontend Build | Monorepo

#### 배경 / Context

Payloser Web은 Next.js 앱이고, 볼링 계산 계약과 공통 스키마는 `@payloser/shared` package에서 가져옵니다. 로컬 개발에서는 shared package를 한 번 빌드한 산출물이 남아 있어 Web build가 자연스럽게 통과할 수 있지만, GitHub Actions runner는 매번 비어 있는 workspace에서 시작합니다.

#### 문제 / Problem

Web CD의 Vercel build 단계에서 아래 오류가 발생했습니다.

```plain text
Module not found: Can't resolve '@payloser/shared'
```

오류는 `apps/web/src/modules/bowling/model/bowling-draft.ts`, `apps/web/src/modules/bowling/model/bowling-session.ts`에서 shared package root import를 해석하는 단계에서 발생했습니다. PR/로컬 빌드가 통과하더라도 CD runner에서 shared package 산출물을 만들지 않으면 배포만 실패할 수 있습니다.

#### 원인 후보 / Root Cause Hypothesis

- `web-deploy.yml`이 `pnpm install` 후 바로 `vercel build --cwd apps/web`를 실행했습니다.
- Vercel CLI는 `apps/web`의 `pnpm run build`를 실행하지만, workspace sibling package인 `packages/shared`의 build를 자동으로 선행하지 않습니다.
- `@payloser/shared`는 package root export가 `dist`/`dist-cjs` 산출물을 바라보므로, 깨끗한 CI 환경에서는 shared build 없이 module resolution이 실패합니다.

#### 해결 / Solution

Web CD에서 Vercel environment pull과 build 전에 shared package를 명시적으로 빌드하도록 변경했습니다.

```yaml
- name: Build shared package
  run: pnpm --filter @payloser/shared build
```

관련 파일:

- `.github/workflows/web-deploy.yml`
- `docs/operations/github-actions-cicd.md`

#### 검증 / Verification

- GitHub Actions 실패 로그에서 Web CD의 실제 실패 지점을 확인했습니다.
- 로컬에서 shared build와 Web production build를 다시 실행해 같은 순서가 통과하는지 확인합니다.
- YAML parse check로 workflow 문법을 확인합니다.

#### 기술적으로 남길 점 / Technical Takeaway

monorepo에서는 “앱 빌드”와 “의존 package 빌드”를 같은 것으로 보면 안 됩니다. 특히 Vercel CLI를 하위 앱 디렉터리 기준으로 실행하면 workspace 전체 build graph가 자동 실행되지 않을 수 있으므로, CD workflow 안에 필요한 package build 순서를 명시해야 합니다.

#### 후속 과제 / Follow-up

- Turborepo pipeline을 CD에도 연결해 app/package build graph를 더 일관되게 실행할 수 있는지 검토합니다.
- Vercel Project의 root directory 설정과 GitHub Actions `--cwd apps/web` 전략 중 어느 쪽이 장기적으로 단순한지 비교합니다.

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
