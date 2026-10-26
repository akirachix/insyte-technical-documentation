# Database

Vesper keeps satellite measurements, alerts and field records in separate tables, so every alert can be traced back to the reading that created it and every field record to the officer who made it.

- **Engine:** PostgreSQL in production, SQLite for local development and tests and mobile offline capabilities.
- **Schema changes:** Alembic migrations.
- **Keys:** UUID primary keys on every table.
- **Time:** all timestamps are stored in UTC.

## Tables

| Table | Holds | Key fields |
|---|---|---|
| `users` | Coordinators and officers | `email`, `phone_number`, `password_hash`, `role`, `is_active` |
| `zone` | Fishing zones and restricted areas | `name`, `basin`, `zone_type`, `boundary` (GeoJSON), `boat_cap`, `closure_start`, `closure_end`, detection settings, `is_active`, `rules_confirmed_by`, `rules_confirmed_at` |
| `zone_setting_history` | Every change of a zone's detection settings | `zone_id`, the four settings, `changed_by`, `changed_at` |
| `zone_light_reading` | One zone on one night | `zone_id`, `observation_date`, `ingestion_status`, `light_index`, `valid_pixel_count`, `hotspot_pixel_count`, `cluster_count` |
| `zone_baseline` | Normal light level for a zone and moon band | `zone_id`, `moon_band`, `expected_light_index`, `nights_used`, `calculated_at` |
| `alert` | One cluster on an unusual zone-night | `zone_id`, `reading_id`, `cluster_label`, `point_count`, `confidence`, `centroid_latitude`, `centroid_longitude`, `status`, `verification_result`, assignment fields |
| `alert_assignment` | One officer's responsibility for an alert | `alert_id`, `officer_id`, `assigned_by`, `status`, `assigned_at`, `acknowledged_at`, `reported_at`, `ended_at` |
| `inspection` | A field inspection | `alert_id` (optional), `officer_id`, `zone_id`, `inspection_type`, `outcome`, `rigs_observed`, `latitude`, `longitude`, `notes`, `inspected_at`, `synced_at` |
| `violation_report` | One suspected violation for one rig | `inspection_id`, `violation_type`, `rig_identifier`, `description`, `review_status`, `reviewed_by`, `reviewed_at` |
| `catch_check` | A catch measured at a landing site | `inspection_id`, `rig_identifier`, `rig_nights`, `catch_weight_kg`, `checked_at` |
| `officer_location` | An officer's position while responding | `officer_id`, `alert_id`, `latitude`, `longitude`, `accuracy_m`, `recorded_at` |

## Relationships

```text
users ─┬─< alert_assignment >── alert >── zone_light_reading >── zone
       ├─< inspection ─┬─< violation_report
       │               └─< catch_check
       └─< officer_location

zone ─┬─< zone_light_reading
      ├─< zone_baseline        (one per moon band)
      ├─< zone_setting_history
      └─< alert
```

- One zone has many nightly readings, three baselines (dark, partial, bright) and many alerts.
- One reading can produce several alerts, one per cluster.
- One alert can have several assignments over time. Only one is active.
- An inspection can link to an alert, or stand alone as a random check.
- One inspection can produce several violation reports and catch checks.

## Enumerations

| Type | Values |
|---|---|
| `UserRole` | `patrol_coordinator`, `patrol_officer` |
| `ZoneType` | `fishing_zone`, `restricted_area` |
| `IngestionStatus` | `pending`, `received`, `ingestion_error` |
| `MoonBand` | `dark` (under 25% lit), `partial`, `bright` (75% or more) |
| `AlertStatus` | `new`, `in_progress`, `dismissed`, `closed` |
| `VerificationResult` | `pending`, `activity_confirmed`, `no_activity` |
| `AssignmentStatus` | `assigned`, `acknowledged`, `reported`, `reassigned`, `failed` |
| `InspectionType` | `site`, `landing_site`, `zone` |
| `InspectionOutcome` | `activity_consistent`, `no_activity`, `no_fishing_light`, `unable_to_verify` |
| `ViolationType` | `unregistered_rig`, `missing_permit`, `fishing_in_closed_area`, `fishing_during_closure`, `rig_cap_exceeded`, `unauthorized_gear` |
| `ReviewStatus` | `submitted`, `reviewed` |

## Integrity Rules

| Rule | Enforced by |
|---|---|
| One reading per zone per night | Unique (`zone_id`, `observation_date`) |
| One baseline per zone and moon band | Unique (`zone_id`, `moon_band`) |
| One alert per reading and cluster, so re-running a night creates no duplicates | Unique (`reading_id`, `cluster_label`) |
| Zone names are unique | Unique `name`, checked in the service first (`409`) |
| Zones do not overlap and sit inside their basin | Zone service (Shapely) |
| A cloudy night is *no data*, not *no activity* | No reading is saved for a skipped night |
| History is never erased | Settings changes go to `zone_setting_history`; assignment timestamps are kept |

