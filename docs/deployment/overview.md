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
| `insyte-frontend` | Next.js coordinator dashboard |
| `insyte-mobile` | Flutter officer app |
| `kariba-cleaning` | Cleaning and model notebooks, `clean_kariba.py` |
| `vesper-docs` | This documentation (VitePress) |

- Work happens on `feature/<name>` branches.
- Pull requests go into `develop`. Only the trainer merges into `develop`.
- `develop` is merged into `main` for releases.
- A pull request needs passing CI: Ruff and pytest for the backend; ESLint, Prettier and the build for the web.

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

::: tip Zone data when deployed
`ZONES_SOURCE` and `BASINS_SOURCE` accept an `https://` URL, so the hosted API can read the zone files from a raw GitHub Gist or storage link. Use a raw link **without** a commit ID so it always serves the latest version.
:::

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



### Frontend Conventions

- Plain CSS: one `.css` file next to each `.jsx` component, no inline styles, no Tailwind.
- JavaScript only (no TypeScript).
- No hard-coded values: URLs, thresholds and map settings come from `.env.local`.


## Frontend Web

### Run locally

```bash
cd insyte-frontend
npm install
npm run dev
```

Create `.env.local` with the variables listed in [Frontend Web](/frontend-web/overview#configuration) first.

### Deploy on Vercel

1. Import the `insyte-frontend` repository in Vercel. It detects Next.js.
2. Add every `NEXT_PUBLIC_*` variable from `.env.local` in **Project Settings → Environment Variables**, with `NEXT_PUBLIC_API_URL` set to the hosted API.
3. Add the Vercel domain to the API's `CORS_ALLOWED_ORIGINS`.
4. Every push to `main` deploys to production; pull requests get preview links.

## Frontend Mobile

```bash
cd insyte-mobile
flutter pub get
flutter run --dart-define=API_URL=https://<api-host>/vesper
```

Release build for Android:

```bash
flutter build apk --release --dart-define=API_URL=https://<api-host>/vesper
```

## Data and Model

```bash
cd ~/kariba-cleaning
env/bin/python -m notebook
```

1. Run `kariba_data_cleaning.ipynb`. It writes `out/kariba_clean_points.csv`, `out/kariba_nightly_qc.csv` and `out/kariba_cleaning_log.csv`.
2. Run `kariba_dbscan_model.ipynb`. It writes the readings, baselines, alerts and `kariba_model_settings.json` to `model/`.

## This Documentation

```bash
cd vesper-docs
npm install
npm run docs:dev
```

Deploy on Vercel with:

| Setting | Value |
|---|---|
| Framework preset | VitePress |
| Build command | `npm run docs:build` |
| Output directory | `.vitepress/dist` |

## Release Checklist

- [ ] Ruff and all backend tests pass
- [ ] Web lint, format check and build pass
- [ ] Migrations applied to the production database
- [ ] `ENVIRONMENT=production`, HTTPS only, CORS limited to the dashboard domain
- [ ] Secrets set in the host, none in the repository
- [ ] Zone and basin sources reachable from the host
- [ ] Coordinator account created and its password changed