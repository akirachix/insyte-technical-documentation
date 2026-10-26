# Backend Overview

The Vesper backend is a **FastAPI** service. It is the only place where business rules live: it validates every request, checks who is allowed to do what, stores the data and returns processed results to the web dashboard and the mobile app.

## Technology Stack

| Component | Technology | Why |
|---|---|---|
| API framework | FastAPI (Python 3.11) | Typed routes, automatic OpenAPI docs at `/docs` |
| Validation | Pydantic v2, pydantic-settings | Clear request and response contracts; settings from the environment |
| ORM | SQLAlchemy 2 | Models and queries independent of the database engine |
| Database | PostgreSQL (psycopg 3); SQLite for local development | Relational integrity, constraints, indexes |
| Migrations | Alembic | Versioned schema changes |
| Tokens | PyJWT (HS256, issuer and audience checked) | Short-lived signed access tokens |
| Passwords | argon2-cffi (Argon2id) | Memory-hard one-way hashing |
| Geometry | Shapely | Zone boundary, basin and overlap checks |
| File upload | python-multipart | Zone import from a `.json` file |
| Data science | NumPy, scikit-learn | DBSCAN clustering and scoring |
| Package manager | uv | Fast, locked installs (`uv.lock`) |
| Quality | pytest, Ruff (lint and format) | 416 automated tests; consistent style |

## Project Structure

```text
insyte-backend/
├── main.py                 app, middleware and routers
├── database.py             engine, session, Base, utcnow
├── core/
│   ├── config.py           settings from environment variables, JSON logging
│   └── security.py         passwords, tokens, roles, rate limits, headers, errors
├── models/                 SQLAlchemy tables
├── schemas/                Pydantic request and response models
├── repositories/           database access only, no logic
├── services/               validation, business rules, permissions, logging
├── routers/                HTTP routes, thin
├── alembic/                migrations
└── tests/                  one test_<table>.py per table
```

## Layered Design

Each request passes through the same layers. Each layer has one job.

| Layer | Does | Does not |
|---|---|---|
| Router | Declares the path, method, status code, schemas and the role required | Validate business rules or touch the database |
| Schema | Describes the shape and types of the data (Pydantic) | Hold business logic |
| Service | Validates, applies rules, checks permissions, raises `HTTPException`, logs with `logger` | Build SQL by hand |
| Repository | Reads and writes rows | Make decisions |
| Model | Defines the table, columns, constraints and relationships | Contain behaviour |

A router stays this thin:

```python
@router.post(
    "/import",
    response_model=List[ZoneRead],
    status_code=status.HTTP_201_CREATED,
)
def import_zones(
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator),
):
    return zone_service.import_zones(db, current_user, file)
```

## Modules

| Module | Prefix | What it does |
|---|---|---|
| Auth | `/vesper/auth` | Sign in, current user, password reset |
| Users | `/vesper/users` | Create and manage officers; own profile and password |
| Zones | `/vesper/zones` | Import zones, edit details, detection settings, confirm rules, basins |
| Zone setting history | `/vesper/zone-setting-history` | Every change to a zone's detection settings |
| Zone baselines | `/vesper/zone-baselines` | Normal light level per zone and moon band; recalculate |
| Alerts | `/vesper/alerts` | List, view, verify and dismiss alerts |
| Alert assignments | `/vesper/alert-assignments` | Assign, acknowledge and fail assignments |
| Inspections | `/vesper/inspections` | Field inspections with GPS and outcome |
| Violation reports | `/vesper/violation-reports` | Suspected violations and their review |
| Catch checks | `/vesper/catch-checks` | Catch weight and rig-nights |
| Detection | `/vesper/detections` | Run the nightly pipeline for a date  |

Full routes are in the [API Reference](/backend/api).

## Business Rules

### Zones

- Zones are imported from `ZONES_SOURCE` or an uploaded `.json` file. Only `.json` files are accepted (`415`), up to 1 MB (`413`).
- Each zone must be in a known basin, inside that basin, with a closed, non-crossing boundary that does not overlap another zone (`400` or `409`). Errors name the zone.
- The first import returns `201` with the zones created. Zones that already exist are skipped; if every zone already exists the API returns `409 All zones in the file already exist.`
- The import is all or nothing: one database commit after every zone has passed.
- Changing a zone's boundary or detection settings clears its rules confirmation; every settings change is written to the zone setting history.

### Alerts and Assignments

- Alert statuses: `new → in_progress → closed | dismissed`, and `new → closed | dismissed`. Other moves return `409`.
- Only active patrol officers can be assigned. Assigning a different officer marks the current assignment `reassigned`.
- An officer acknowledges only their own assignment. The coordinator can mark an assignment `failed` if the officer has not reported, so the alert can be reassigned.
- Timestamps are kept as history. A failed assignment still shows when it was acknowledged.

### Field Records

- Inspection types: `site`, `landing_site`, `zone`. Outcomes: `activity_consistent`, `no_activity`, `no_fishing_light`, `unable_to_verify`.
- Violation types: `unregistered_rig`, `missing_permit`, `fishing_in_closed_area`, `fishing_during_closure`, `rig_cap_exceeded`, `unauthorized_gear`.
- The officer is taken from the token, never from the request body.

## Error Responses

Errors use FastAPI's standard shape and a request ID that matches the logs:

```json
{ "detail": "All zones in the file already exist." }
```

| Code | Meaning in Vesper |
|---|---|
| `400` | The request is understood but breaks a rule (bad boundary, unknown basin, dates in the wrong order) |
| `401` | Not signed in, or the token is invalid or expired |
| `403` | Signed in, but this role or account cannot do this |
| `404` | The record does not exist |
| `409` | Conflicts with existing data (duplicate name, overlap, invalid status change, already exists) |
| `413` | Request or file too large |
| `415` | Wrong file type |
| `422` | The body or parameters have the wrong shape or type |
| `429` | Too many requests |

## Testing

```bash
ruff check . --fix && ruff format . && python -m pytest
```

- Tests live in `tests/test_<table>.py`, grouped into classes per feature.
- Each test uses a fresh database and stand-in users (coordinator, officer).
- Service tests check rules and messages; router tests check status codes, roles and response bodies.
- Manual API tests are kept in a Postman collection per module.
