# Detection Pipeline

The detection pipeline turns one night of satellite data into zone readings and alerts. It was built and evaluated in two notebooks: `kariba_data_cleaning.ipynb` and `kariba_dbscan_model.ipynb`. Moving it into the backend as a service is.

<div class="diagram">
  <img src="/diagrams/pipeline.svg" alt="Pipeline: read the VNP46A1 file, clean pixels, find lights, cluster with DBSCAN, score against the baseline; outputs nightly QC, zone light readings and alerts" />
</div>

## Data

| Item | Value |
|---|---|
| Product | NASA Black Marble VNP46A1 (VIIRS Day/Night Band, daily, about 500 m) |
| Tile | `h20v10` |
| Period | 2019-01-23 to 2021-12-29 |
| Files read | 1,097 |
| Nights analysed | 710 (the rest were cloudy, daytime or did not cover the lake) |
| Clean light points | 103,574 |

## 1. Cleaning

Cleaning happens at three levels, and every step reports how many rows it removed.

**Files.** Drop files that are not VNP46A1, are empty, are an older copy of the same night, or do not cover the lake.

**Pixels.** Inside each night, drop pixels that are:

| Removed | How it is detected |
|---|---|
| Missing or impossible | Fill values and values outside the valid range |
| Daytime | `QF_Cloud_Mask` bit 0 |
| Cloudy | `QF_Cloud_Mask` bits 6–7 (cloud confidence) |
| Cirrus | `QF_Cloud_Mask` bit 9 |
| Flagged by the sensor | `QF_DNB` quality flags |
| Off the lake | Lake outline test |

A night with too little clear lake is **skipped**. It is recorded as not analysed, never as a quiet night.

**Lights.** Each night gets its own threshold from the dark water around it (median + a multiple of the MAD). Lights are local peaks above it (`peak_local_max`).

**Points.**

| Step | Removed | Why |
|---|---|---|
| Missing values | 0 | No position or radiance |
| Exact duplicates | 0 | Same pixel on the same night |
| Twin-pixel duplicates | 93,117 | One light covering several touching pixels with the same brightness |
| Outside the lake | 70 | Position not on the lake outline |
| Implausible radiance | 0 | Below the threshold or above the maximum |
| Near shore | flagged only | Possible town or shore glow |

Output: `kariba_clean_points.csv` (one row per light per night), `kariba_nightly_qc.csv` (one row per file) and `kariba_cleaning_log.csv`.

## 2. Clustering

DBSCAN is **unsupervised**: there are no labels saying a light was illegal fishing. Training means choosing the settings from the data and learning what normal looks like.

- Near-shore points are left out (78,405 points remain).
- The split is **by time**: nights before 2021-07-01 train the model (581 nights), later nights test it (129 nights).
- Distance is **haversine**, so distances are real kilometres on the globe.

### Choosing the settings

`eps` and `min_samples` were tried on every training night:

| eps (km) | min 3 | min 4 | min 5 | min 6 |
|---|---|---|---|---|
| 1.0 | 0.832 | 0.892 | 0.993 | — |
| 1.5 | 0.714 | 0.745 | 0.813 | 0.855 |
| 2.0 | 0.710 | 0.737 | 0.763 | 0.797 |
| **3.0** | 0.690 | 0.709 | **0.732** | 0.753 |
| 5.0 | 0.664 | 0.674 | 0.689 | 0.708 |

*Silhouette score: higher means tighter, better separated clusters.*

**Rule:** among settings that leave at most 40% of points as noise, take the highest silhouette; between close scores, take the smallest `eps`, so two nearby fleets stay separate.

**Chosen:** `eps = 3 km`, `min_samples = 5` (silhouette 0.732, noise 38.8%). The k-distance knee was 10.5 km, too wide for separate fleets.

Each night is clustered on its own. A cluster is summarised by its point count, centre, brightest and mean radiance, radius, and the zone most of its points are in.

**Result:** 3,824 clusters on 517 nights; 60% of points belong to a cluster.

## 3. Zone Readings

One row per **zone per analysed night**, the same shape as `zone_light_reading`:

| Field | Meaning |
|---|---|
| `light_index` | Total radiance of all lights in the zone |
| `hotspot_pixel_count` | Number of lights |
| `cluster_count` | Clusters centred in the zone |

Clear nights with no lights in a zone get **zeros**. Quiet nights are part of what normal looks like.

## 4. Baselines

From the **training** nights only, for each zone and moon band:

- **Expected light index:** the median.
- **Spread:** `1.4826 × MAD`, at least `0.25 × median` and at least 1, so a zone that is nearly always dark does not alert on a single lamp.

The moon band uses the same formula in the notebook and the backend: illumination at 22:00 UTC from the synodic month (29.53 days). Dark is under 25% lit, bright is 75% or more.

## 5. Scoring and Alerts

```text
score = (light_index − expected_light_index) / spread
```

A zone-night is **anomalous** when `score ≥ 3` **and** it has at least one cluster. A bright total with no cluster is scattered lights, not a fleet.

Every cluster in an anomalous zone-night becomes an alert:

```text
confidence = score / (score + 3)
```

Exactly at the threshold the confidence is 0.5, and it rises towards 1 as the night gets further above normal. It ranks how unusual the night is. It is **not** a probability that fishing is illegal. A zone's `confidence_threshold` of 0.5 is therefore the same rule as `score ≥ 3`.

## 6. Evaluation

There are no labelled examples yet, so the model is checked for sensible behaviour. Accuracy will be measured from patrol outcomes.

| Check | Result |
|---|---|
| Alert rate, training nights | 5.2% of zone-nights (242 of 4,648) |
| Alert rate, test nights | 3.7% of zone-nights (38 of 1,032): no drift |
| Baseline stability (Spearman, first vs second half of training) | 0.76 |
| Moon effect | Light index differs clearly by moon band, which justifies separate baselines |
| Alerts | 314 in total, 44 in the test period |

## Model Settings

Saved as `kariba_model_settings.json`:

```json
{
  "dbscan": { "eps_km": 3.0, "min_samples": 5, "metric": "haversine", "knee_eps_km": 10.483 },
  "alerting": { "k_mad": 3.0, "min_mad_share": 0.25, "needs_cluster": true },
  "data": { "exclude_near_shore": true, "training_nights": 581, "test_nights": 129, "test_from": "2021-07-01" },
  "suggested_zone_settings": { "cluster_radius_m": 3000.0, "min_cluster_points": 5, "confidence_threshold": 0.5 }
}
```

## Backend Integration 

| Notebook output | Backend destination |
|---|---|
| `kariba_zone_readings.csv` (5,680 rows) | `zone_light_reading`, loaded once as history |
| `kariba_zone_baselines.csv` (24 rows) | `zone_baseline`, plus the new `spread` column |
| `kariba_alerts.csv` (314 rows) | `alert` |
| `eps`, `min_samples` | Zone `cluster_radius_m = 3000`, `min_cluster_points = 5` |

The nightly detection service will:

1. read and clean the night's file;
2. drop near-shore points and cluster the **whole lake** with the model settings;
3. assign clusters to zones and save one reading per zone;
4. score each reading against the baseline for that night's moon band;
5. create one alert per cluster in each anomalous zone.

It will be run by the coordinator through `POST /vesper/detections/run`, which accepts a date or an uploaded `.h5` file.
