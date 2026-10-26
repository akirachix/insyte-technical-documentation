# Deployment

This page explains how to run each part of Vesper locally and how it is set up for hosting.

## Environments

| Environment | Backend | Database | Web | Purpose |
|---|---|---|---|---|
| Development | `uvicorn` on a laptop | SQLite (`vesper_local.db`) | `npm run dev` | Building and testing features |
| Test | pytest | SQLite test database | — | Automated tests |
| Production | Container on a cloud host | Managed PostgreSQL | Vercel | Real use |

## Repositories and Branches

| Repository | Contents |
|---|---|
| `insyte-backend` | FastAPI API, models, services, tests |

- Work happens on `feature/<name>` branches.
- Pull requests go into `develop`. Only the trainer merges into `develop`.
- `develop` is merged into `main` for releases.

## Backend

### Run locally

```bash
cd insyte-backend
uv sync
alembic upgrade head
uvicorn main:app --reload --port 8001
```

Create `.env` with the variables in [Configuration](#configuration) first. Swagger is at `http://127.0.0.1:8001/docs`.

### Configuration

All settings come from environment variables (or `.env` locally). Nothing secret is written in the code.

| Variable | Purpose | Default |
|---|---|---|
| `ENVIRONMENT` | `development`, `test` or `production` | `development` |
| `DATABASE_URL` | Database connection; `postgres://` is converted to the psycopg driver | `sqlite:///./vesper.db` |
| `JWT_SECRET` | Token signing secret, at least 32 characters | required |
| `ACCESS_TOKEN_TTL_MINUTES` | Access token lifetime | `15` |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh token lifetime | `7` |
| `CORS_ALLOWED_ORIGINS` | Web origins allowed to call the API | `["http://localhost:3000"]` |
| `ALLOWED_HOSTS` | Host names the API answers to | `localhost`, `127.0.0.1` |
| `MAX_REQUEST_BYTES` | Largest request body | `1000000` |
| `API_RATE_LIMIT_PER_MINUTE` | Requests per minute per client | `120` |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCKOUT_MINUTES` | Sign-in lockout | `5`, `15` |
| `ASSIGNMENT_REPORT_TIMEOUT_MINUTES` | Time an officer has to report on an assignment | `30` |
| `BASELINE_LOOKBACK_NIGHTS`, `BASELINE_MIN_NIGHTS` | Baseline recalculation window and minimum nights | `90`, `5` |
| `ZONES_SOURCE` | Path or https URL of the zones JSON | required for import without a file |
| `BASINS_SOURCE` | Path or https URL of the basins JSON | required |
| `SEED_COORDINATOR_*` | The first coordinator, created on first start | empty |



### Production checks

The API refuses to start in `production` if:

- `DATABASE_URL` is SQLite;
- `CORS_ALLOWED_ORIGINS` contains `*`;
- tables would be created automatically instead of by migrations.

### Hosting

1. Build a container with `uv` and run `uvicorn main:app --host 0.0.0.0 --port $PORT`.
2. Create a managed PostgreSQL database and set `DATABASE_URL`.
3. Set every variable above in the host's secret settings, with `ENVIRONMENT=production`.
4. Run `alembic upgrade head` on each release.
5. Serve over HTTPS only. HSTS switches on automatically in production.

## Branching and CI

- Work happens on `feature/<name>` branches.
- Pull requests go into `develop`. Only the trainer merges into `develop`.
- `develop` is merged into `main` for releases.
- A pull request needs passing CI: Ruff and pytest for the backend; ESLint, Prettier and the build for the web.


> [!TIP]
> Both `ZONES_SOURCE` and `BASINS_SOURCE` accept either local file paths or full `https://` URLs when pulling down the required JSON layers during system imports.

## Release Checklist

Before releasing a new version of the backend to production, ensure the following steps are met:
1. All database migrations are packaged via Alembic (`alembic revision --autogenerate`).
2. Run all backend tests locally using `pytest` to confirm zero regressions.
3. Ensure the `.env` configuration file on the production environment contains valid, production-grade keys (especially a high-entropy `JWT_SECRET` string).
