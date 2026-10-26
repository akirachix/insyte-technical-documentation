# Architecture Overview

Vesper is designed around three principles:

1. **Rules first and explainable.** Every alert can be traced back to the night, the zone reading, the baseline it was compared with and the score that triggered it. There is no black box.
2. **Honest about the data.** A cloudy night is *no data*, never *no activity*. Satellite light shows where light is, not who is fishing.
3. **Field-verified.** Patrol outcomes are recorded against every alert, so alerts can be measured and tuned over time.

## System Architecture

Vesper is split into three layers. The clients never calculate alerts themselves: they ask the API for processed results.

<a href="/diagrams/system-architecture.png" target="_blank">
  <img src="/diagrams/system-architecture.png" alt="Vesper system architecture diagram" />
</a>

- [Vesper SAD on Lucidspark](https://lucid.app/lucidspark/cc699984-8901-451a-b04f-a16a195d2490/edit?invitationId=inv_0cb716aa-7a66-4a02-900a-03febc664ac5&page=0_0#)


### Architecture Layers

| Layer | Components | Responsibility |
|---|---|---|
| Presentation | Coordinator web dashboard (Next.js), patrol officer app (Flutter) | Show alerts and zones, collect field records, never hold business rules |
| Application | Vesper API (FastAPI): security core, routers, services, repositories | Authentication, validation, business rules, access control, logging |
| Data | PostgreSQL (SQLite for local development) | Durable storage of users, zones, readings, baselines, alerts and field records |
| Processing | Nightly detection pipeline (Python: h5py, NumPy, SciPy, scikit-image, scikit-learn) | Turn satellite files into zone readings and alerts |

## Component Breakdown

### 1. Satellite Data Source

- **Product:** NASA Black Marble **VNP46A1**, daily night-time radiance from the VIIRS Day/Night Band, at about 500 m per pixel.
- **Coverage:** tile `h20v10` contains Lake Kariba.
- **Format:** one HDF5 (`.h5`) file per night with radiance, cloud mask, sensor quality flags and moon illumination.
- **Period used for the model:** January 2019 to December 2021 (1,097 files).

### 2. Cleaning

Turns a raw file into clean light points. See [Detection Pipeline](/backend/detection#_1-cleaning).

- Drops pixels that are missing, impossible, cloudy, cirrus, daytime, outside the lake or flagged by the sensor.
- Skips whole nights with too little clear lake.
- Finds lights as local peaks above a robust per-night threshold, merges twin pixels and flags near-shore points.

### 3. Detection Model

Turns clean points into readings and alerts. See [Detection Pipeline](/backend/detection#_2-clustering).

- **DBSCAN** (haversine distance) groups lights within **3 km** with at least **5** lights into a cluster.
- Light is totalled per zone into a **zone light reading**.
- Each reading is compared with the zone's **baseline** for the same moon band (dark, partial, bright).
- A zone-night with a score of 3 or more **and** at least one cluster produces one alert per cluster.

### 4. Zones Module

- Zones and basins are loaded from JSON sources (`ZONES_SOURCE`, `BASINS_SOURCE`) or an uploaded `.json` file.
- Each zone must sit inside its basin, have a valid boundary and not overlap another zone.
- Each zone carries its own detection settings (cluster radius, minimum lights, radiance and confidence thresholds). Every change is kept in the zone setting history.

### 5. Alert Module

- Alerts move through a fixed set of statuses. Invalid moves are rejected.
- The coordinator **verifies** an alert (`activity_confirmed` or `no_activity`) or **dismisses** it.

<div class="diagram">
  <img src="/diagrams/alert-lifecycle.svg" alt="Alert status: new to in_progress to closed or dismissed. Assignment status: assigned to acknowledged to reported, or failed or reassigned" />
</div>


### 6. Patrol Module

| Record | Who creates it | Purpose |
|---|---|---|
| Alert assignment | Coordinator | Gives one officer responsibility for an alert |
| Inspection | Officer | What was found at a site, landing site or zone, with GPS and outcome |
| Violation report | Officer | One suspected violation for one rig, linked to an inspection |
| Catch check | Officer | Catch weight and rig-nights for catch per rig-night |
| Officer location | Officer app | Position recorded while responding to an alert |

### 7. Coordinator Dashboard

Web dashboard for the patrol coordinator: overview map, alerts, assignment and reassignment, report reviews, officers, statistics, zones and rules, users. See [Frontend Web](/frontend-web/overview).

### 8. Officer App

Mobile app for patrol officers: sign in, assigned alerts, inspections, violation reports and catch checks. See [Frontend Mobile](/frontend-mobile/overview).

## Data Flow

**Step 1: Ingest.** The night's VIIRS file is read and cleaned. If too little of the lake is clear, the night is skipped and nothing is saved.

**Step 2: Detect.** Lights are clustered, totalled per zone and saved as zone light readings, including zeros for clear zones with no lights.

**Step 3: Score.** Each reading is compared with its baseline. Unusual zone-nights with clusters create alerts with status `new`.

**Step 4: Assign.** The coordinator assigns the alert to an active officer. The alert moves to `in_progress`.

**Step 5: Patrol.** The officer acknowledges, goes to the area and records an inspection, plus any violation reports and catch checks.

**Step 6: Close.** The coordinator reviews the reports and verifies or dismisses the alert. The outcome becomes a label for measuring and tuning the model.


## Scalability Strategy

| Area | Approach |
|---|---|
| API | Stateless FastAPI instances behind a load balancer; tokens carry identity, so any instance can serve any request |
| Database | PostgreSQL with indexes on zone, date and alert foreign keys; unique constraints stop duplicate readings and alerts |
| Nightly processing | One night at a time, re-runnable: a reading per zone per night and an alert per reading and cluster are unique |
| Lists | List endpoints for growing tables (alerts, assignments, inspections, reports, history) are paginated with `limit` and `offset` |
| Offline field work | Officers save records on the phone and sync in batches |
