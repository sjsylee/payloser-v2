# GitHub Actions CI/CD

Payloser의 배포 흐름은 기존 프로젝트와 같은 결로 가져갑니다. PR에서는 검증만 수행하고, `main`에 merge되어 push가 발생하면 Web과 API 배포가 실행됩니다.

## Workflow

| 파일                               | 트리거              | 역할                                      |
| ---------------------------------- | ------------------- | ----------------------------------------- |
| `.github/workflows/shared-ci.yml`  | push, pull_request  | `packages/shared` 타입체크, 테스트, 빌드  |
| `.github/workflows/web-ci.yml`     | push, pull_request  | Next.js 테스트와 빌드 검증                |
| `.github/workflows/api-ci.yml`     | push, pull_request  | API 테스트/빌드, Docker image build check |
| `.github/workflows/web-deploy.yml` | `main` push, manual | Vercel production 배포                    |
| `.github/workflows/api-deploy.yml` | `main` push, manual | GHCR image push 후 NAS에서 pull/restart   |

## Required GitHub Secrets

API image platform은 기본 `linux/amd64`입니다. NAS가 ARM 계열이면 repository variable `API_IMAGE_PLATFORMS`에 `linux/arm64` 또는 `linux/amd64,linux/arm64`를 설정합니다.

### Web deploy

| Secret              | 설명                    |
| ------------------- | ----------------------- |
| `VERCEL_TOKEN`      | Vercel 배포 토큰        |
| `VERCEL_ORG_ID`     | Vercel team/user id     |
| `VERCEL_PROJECT_ID` | Payloser Web project id |

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`가 없으면 Web CD job은 배포를 건너뜁니다. `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` 같은 Web runtime 값은 Vercel project environment에 설정합니다.

### API deploy

| Secret        | 설명                                   |
| ------------- | -------------------------------------- |
| `NAS_HOST`    | NAS SSH host                           |
| `NAS_PORT`    | NAS SSH port. 비우면 22 사용           |
| `NAS_USER`    | NAS SSH user                           |
| `NAS_SSH_KEY` | NAS에 접속할 private key               |
| `NAS_APP_DIR` | NAS 안의 Payloser repo 경로            |
| `GHCR_PAT`    | NAS에서 GHCR image를 pull하기 위한 PAT |

API image build/push는 `GITHUB_TOKEN`으로 처리합니다. NAS secret이 비어 있으면 image push까지만 수행하고 서버 배포는 건너뜁니다.

## NAS Setup

NAS에는 repo가 한 번 clone되어 있어야 합니다.

```bash
git clone https://github.com/<owner>/<repo>.git /volume1/docker/payloser
cd /volume1/docker/payloser
cp infra/deploy/compose.api.example.yaml docker-compose.yaml
```

NAS의 `.env.production`에는 API 런타임 값과 PostgreSQL 값을 둡니다.

```dotenv
POSTGRES_DB=payloser
POSTGRES_USER=payloser
POSTGRES_PASSWORD=change-me
DATABASE_URL=postgresql://payloser:change-me@postgres:5432/payloser?schema=public

SESSION_COOKIE_SECRET=change-me-to-long-random-secret
WEB_ORIGIN=https://payloser.example.com
PUBLIC_API_ORIGIN=https://api.payloser.example.com

KAKAO_REST_API_KEY=change-me
KAKAO_REDIRECT_URI=https://api.payloser.example.com/auth/kakao/callback
KAKAO_LOGIN_SUCCESS_REDIRECT_URL=https://payloser.example.com
```

Cloudflare Tunnel은 `PUBLIC_API_ORIGIN`이 가리키는 외부 HTTPS origin을 NAS의 `api:3001` 또는 host `3001`로 연결합니다.

## API Release Flow

`main`에 push되면 다음 순서로 배포됩니다.

1. GitHub Actions가 `apps/api/Dockerfile`로 API image를 빌드합니다.
2. GHCR에 `latest`와 `sha-*` 태그를 함께 push합니다.
3. Actions가 NAS에 SSH로 접속합니다.
4. NAS repo에서 `git pull --ff-only origin main`을 수행합니다.
5. NAS가 GHCR에 로그인하고 최신 API image를 pull합니다.
6. `docker compose run --rm api ... prisma migrate deploy`로 migration을 적용합니다.
7. `docker compose up -d --no-deps api`로 API container를 교체합니다.
8. 미사용 image를 정리합니다.

## Before Production

- GitHub repository `Settings > Actions > General`에서 workflow 권한이 package write를 허용하는지 확인합니다.
- GHCR image가 private이면 `GHCR_PAT`에 package read 권한을 부여합니다.
- `production` environment에 필요한 reviewer rule을 걸 수 있습니다.
- NAS에서 Docker Compose v2가 동작하는지 확인합니다.
- Cloudflare Tunnel health와 Kakao redirect URI를 같이 확인합니다.
