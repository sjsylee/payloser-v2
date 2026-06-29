# Local Docker

Start PostgreSQL:

```bash
docker compose -f infra/docker/compose.yaml up -d
```

Stop PostgreSQL:

```bash
docker compose -f infra/docker/compose.yaml down
```

Remove local DB data:

```bash
docker compose -f infra/docker/compose.yaml down -v
```

