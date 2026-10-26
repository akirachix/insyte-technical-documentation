# API Reference

All routes are served under the **`/api`** prefix. The live, always up-to-date reference is the Swagger page the backend generates at **`/docs`**.

## Conventions

| Item | Rule |
|---|---|
| Base URL | `http://127.0.0.1:8001/docs` locally |
| Authentication | `Authorization: Bearer <access token>` on every route except sign in |
| Body format | JSON, except zone import (`multipart/form-data`, key `file`) |
| IDs | UUIDs |
| Dates and times | ISO 8601, stored in UTC |
| Pagination | `limit` and `offset` query parameters on list routes that grow over time |
| Roles | **C** = patrol coordinator, **O** = patrol officer, **Any** = either |

## Authentication

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Sign in with email and password; returns an access token and a refresh token |
| `GET` | `/auth/me` | Any | The signed-in user |
| `POST` | `/auth/forgot-password` | Public | Start a password reset |

## Users

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/users` | C | Create a user (officer) |
| `GET` | `/users` | C | List users |
| `GET` | `/users/me` | Any | Own profile |
| `POST` | `/users/me/password` | Any | Change own password (`204`) |
| `GET` | `/users/{user_id}` | Any | One user (officers can only see themselves; others return `404`) |
| `PATCH` | `/users/{user_id}` | Any | Update a user (officers only their own profile) |

## Zones

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/zones` | Any | List zones, sorted by name; `active_only=true` for active zones |
| `GET` | `/zones/basins` | Any | The Lake Kariba basins with their boundaries |
| `POST` | `/zones/import` | C | Import zones from an uploaded `.json` file, or from `ZONES_SOURCE` when no file is sent |
| `GET` | `/zones/{zone_id}` | Any | One zone |
| `PATCH` | `/zones/{zone_id}` | C | Update name, basin, type, boundary, boat cap, closure dates, active |
| `PUT` | `/zones/{zone_id}/settings` | C | Replace the detection settings |
| `POST` | `/zones/{zone_id}/confirm-rules` | C | Confirm the zone's rules |

### Zone import responses

| Case | Status | `detail` |
|---|---|---|
| First import | `201` | List of created zones |
| Every zone already exists | `409` | `All zones in the file already exist.` |
| Not a `.json` file (CSV, txt, PDF) | `415` | `Upload the zones as a .json file.` |
| Over 1 MB | `413` | `The zones file is too large.` |
| Not valid JSON | `400` | `The uploaded file is not valid JSON.` |
| JSON in the wrong shape | `400` | `The uploaded file is not in the expected zones format.` |
| Unknown basin | `400` | `Zone 9: Unknown basin. Choose one of: ...` |
| Outside its basin | `400` | `Zone 9: The zone must be inside the Binga basin.` |
| Boundary crosses itself | `400` | `Zone 9: The zone boundary crosses itself.` |
| Overlaps another zone | `409` | `Zone 9: The zone overlaps Zone 1.` |
| Officer | `403` | |
| No token | `401` | |

### Zones file format

```json
{
  "defaults": {
    "zone_type": "fishing_zone",
    "radiance_threshold": "10.0000",
    "cluster_radius_m": "1500.00",
    "min_cluster_points": 3,
    "confidence_threshold": "0.5000"
  },
  "zones": [
    {
      "name": "Zone 1",
      "basin": "Sanyati",
      "boundary": {
        "type": "Polygon",
        "coordinates": [[[28.70, -16.60], [28.80, -16.60], [28.80, -16.68], [28.70, -16.68], [28.70, -16.60]]]
      }
    }
  ]
}
```

### Detection settings limits

| Field | Rule |
|---|---|
| `radiance_threshold` | ≥ 0, up to 4 decimal places |
| `cluster_radius_m` | > 0 and ≤ 50,000, up to 2 decimal places |
| `min_cluster_points` | whole number from 1 to 1,000 |
| `confidence_threshold` | 0 to 1, up to 4 decimal places |

All four are required on `PUT /zones/{zone_id}/settings`. Unknown fields are rejected (`422`).

## Zone Setting History

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/zone-setting-history` | C | Settings changes, newest first; filter by `zone_id` or `changed_by` |
| `GET` | `/zone-setting-history/{history_id}` | C | One change |

## Zone Baselines

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/zone-baselines` | Any | Baselines; filter by `zone_id` or `moon_band` |
| `POST` | `/zone-baselines/recalculate` | C | Rebuild baselines from received readings over a look-back window |
| `GET` | `/zone-baselines/{baseline_id}` | Any | One baseline |

## Alerts

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/alerts` | Any | List alerts with filters; officers see only alerts they are, or were, assigned to |
| `GET` | `/alerts/{alert_id}` | Any | One alert |
| `POST` | `/alerts/{alert_id}/verify` | C | Close with `activity_confirmed` or `no_activity` |
| `POST` | `/alerts/{alert_id}/dismiss` | C | Dismiss the alert |

## Alert Assignments

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/alert-assignments` | C | Assign an alert to an officer (`201`) |
| `GET` | `/alert-assignments` | Any | List assignments |
| `GET` | `/alert-assignments/{assignment_id}` | Any | One assignment |
| `POST` | `/alert-assignments/{assignment_id}/acknowledge` | O | Officer accepts the assignment |
| `POST` | `/alert-assignments/{assignment_id}/fail` | C | Mark as failed so the alert can be reassigned |

## Inspections

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/inspections` | O | Record an inspection (`201`) |
| `GET` | `/inspections` | Any | List inspections |
| `GET` | `/inspections/{inspection_id}` | Any | One inspection |

## Violation Reports

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/violation-reports` | O | File a violation report (`201`) |
| `GET` | `/violation-reports` | Any | List reports |
| `GET` | `/violation-reports/{violation_id}` | Any | One report |
| `POST` | `/violation-reports/{violation_id}/review` | C | Mark the report reviewed |

## Catch Checks

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/catch-checks` | O | Record a catch check (`201`) |
| `GET` | `/catch-checks` | Any | List catch checks |
| `GET` | `/catch-checks/{catch_id}` | Any | One catch check |

## Detection 

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/detections/run` | C | Run cleaning and detection for one night (date or uploaded `.h5` file), save readings and alerts |
