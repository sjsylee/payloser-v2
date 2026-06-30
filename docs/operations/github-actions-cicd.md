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

## Web Release Flow

`main`에 push되면 Web CD는 다음 순서로 배포됩니다.

1. GitHub Actions가 pnpm workspace dependencies를 설치합니다.
2. `@payloser/shared`를 먼저 빌드해 Next.js가 shared package root를 해석할 수 있게 합니다.
3. Vercel production environment를 pull합니다.
4. `vercel build --prod`로 prebuilt output을 만듭니다.
5. `vercel deploy --prebuilt --prod`로 production에 배포합니다.

`Module not found: Can't resolve '@payloser/shared'`가 Web CD에서만 발생하면 Vercel 빌드 전에 shared 산출물이 만들어졌는지 확인합니다. 로컬에서는 이전 빌드 산출물이 남아 통과할 수 있지만, GitHub Actions runner는 매번 깨끗한 workspace에서 시작합니다.

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

TUNNEL_TOKEN=change-me
```

`docker-compose` v1은 `env_file` 값을 compose 변수 치환에 사용하지 않습니다. `${POSTGRES_PASSWORD}`, `${TUNNEL_TOKEN}` 같은 값은 project root의 `.env`에서 읽히므로 NAS에서는 `.env.production`을 만든 뒤 아래처럼 연결합니다.

```bash
ln -sfn .env.production .env
```

이미 `.env` 파일을 따로 쓰고 있다면 `.env.production`과 같은 값을 맞춰 둡니다.

## Cloudflare Tunnel

NAS API를 외부 HTTPS 주소로 열기 위해 Cloudflare Tunnel을 먼저 준비합니다.

1. Cloudflare Dashboard에서 도메인을 연결합니다.
2. `Zero Trust > Networks > Tunnels`에서 tunnel을 생성합니다.
3. Connector 타입은 Docker/cloudflared를 선택합니다.
4. 발급된 tunnel token을 NAS의 `.env.production`에 `TUNNEL_TOKEN`으로 저장합니다.
5. Public hostname을 추가합니다.

```plain text
Hostname: api.payloser.example.com
Service:  http://api:3001
```

`cloudflared`가 `docker-compose.yaml` 안에서 API container와 같은 네트워크에 있으므로 service target은 `localhost:3001`이 아니라 `http://api:3001`입니다. `localhost`를 쓰면 cloudflared container 자신을 바라보게 됩니다.

터널 준비 후 NAS에서 다음 명령으로 API, DB, tunnel을 함께 올립니다.

```bash
docker-compose up -d postgres cloudflared
```

API container는 GitHub Actions의 API CD가 최신 image를 pull한 뒤 교체합니다.

## API Release Flow

`main`에 push되면 다음 순서로 배포됩니다.

1. GitHub Actions가 `apps/api/Dockerfile`로 API image를 빌드합니다.
2. GHCR에 `latest`와 `sha-*` 태그를 함께 push합니다.
3. Actions가 NAS에 SSH로 접속합니다.
4. NAS repo에서 `git pull --ff-only origin main`을 수행합니다.
5. NAS가 GHCR에 로그인하고 최신 API image를 pull합니다.
6. `docker compose` 또는 `docker-compose`로 migration을 적용합니다.
7. 같은 Compose 명령으로 API container를 교체합니다.
8. 미사용 image를 정리합니다.

NAS에서 `PermissionError: [Errno 13] Permission denied`가 발생하면 SSH 사용자가 Docker socket에 접근하지 못하는 상태입니다. 수동 실행은 `sudo docker-compose ...`로 확인할 수 있고, GitHub Actions 배포 계정은 Docker 명령을 비밀번호 없이 실행할 수 있도록 권한을 맞춰야 합니다.

GitHub Actions 로그에서 아래 메시지가 나오면 image build와 GHCR push는 끝났지만, NAS deploy 계정이 Docker daemon에 접근하지 못해 중단된 상태입니다.

```plain text
Docker is installed at /usr/local/bin/docker, but <user> cannot access the Docker daemon.
Grant Docker access to the deploy user or configure passwordless sudo for Docker commands.
```

NAS에 직접 접속해 아래 명령으로 권한 상태를 먼저 확인합니다.

```bash
docker info
sudo -n docker info
docker-compose version
sudo -n docker-compose version
```

`sudo -n ...`도 실패하면 GitHub Actions의 non-interactive SSH 세션에서 sudo password prompt를 처리할 수 없습니다. 배포 계정에 Docker socket 접근 권한을 주거나, `/usr/local/bin/docker`와 `/usr/local/bin/docker-compose`에 한정한 passwordless sudo 정책을 설정해야 합니다.

GitHub Actions의 SSH 세션은 DSM에 직접 로그인한 터미널과 `PATH`가 다를 수 있습니다. Docker가 `/usr/local/bin/docker`에 있어도 non-login shell에서는 `docker: command not found`가 날 수 있으므로 workflow는 `/usr/local/bin`을 PATH에 추가하고 Docker binary를 명시적으로 탐색합니다.

수동으로 migration을 확인할 때는 API package 기준 schema 경로를 사용합니다. `pnpm --filter @payloser/api exec`는 command를 `apps/api` package context에서 실행하므로 schema는 `prisma/schema.prisma`가 맞습니다.

```bash
sudo docker-compose run --rm api sh -lc "pnpm --filter @payloser/api exec prisma migrate deploy --schema=prisma/schema.prisma"
```

빈 DB에서 `relation "Group" does not exist`가 발생하면 초기 테이블 생성 migration이 적용되지 않은 상태입니다. 초기 세팅 중이고 보존할 데이터가 없다면 failed migration 기록을 끌고 가지 말고 Postgres volume을 재생성한 뒤 다시 migration을 실행합니다.

```bash
sudo docker-compose down
sudo docker volume ls | grep payloser
sudo docker volume rm <postgres-volume-name>
sudo docker-compose up -d postgres
sudo docker-compose run --rm api sh -lc "pnpm --filter @payloser/api exec prisma migrate deploy --schema=prisma/schema.prisma"
```

이미 운영 데이터가 있다면 volume을 삭제하지 말고 `prisma migrate resolve` 절차로 실패 migration을 복구해야 합니다.

## Before Production

- GitHub repository `Settings > Actions > General`에서 workflow 권한이 package write를 허용하는지 확인합니다.
- GHCR image가 private이면 `GHCR_PAT`에 package read 권한을 부여합니다.
- `production` environment에 필요한 reviewer rule을 걸 수 있습니다.
- NAS에서 `docker compose` 또는 `docker-compose`가 동작하는지 확인합니다.
- Cloudflare Tunnel health와 Kakao redirect URI를 같이 확인합니다.
