# Frontend Web

The coordinator dashboard is a **Next.js** web app used by the patrol coordinator to see where unusual activity is, assign alerts to officers, review what officers report and manage zones and users.

- [Vesper Informational website](https://insyte-informational-website.vercel.app/)

## Technology

| Item | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | JavaScript (no TypeScript) |
| Styling | Plain CSS: one `.css` file per component, no inline styles, no Tailwind |
| Maps | MapLibre GL JS |
| Quality | ESLint, Prettier, Husky and lint-staged on every commit |

## Pages

Pages are selected with the `page` query parameter, for example `/?page=alerts`.

| Page | `?page=` | What the coordinator can do |
|---|---|---|
| Sign in | `sign-in` | Sign in with email and password; reset a forgotten password |
| Overview | `overview` | Map of the lake with zones and tonight's alerts; key numbers for the night |
| Alerts | `alerts`, `alert`, `reassign` | List and filter alerts, open one alert with its evidence, assign or reassign an officer |
| Report reviews | `report-reviews` | Review violation reports filed by officers |
| Officers | `officers`, `officer-profile` | See officers, their status and their assignment history |
| Statistics | `statistics` | Alerts, patrol outcomes, report-back rate and catch per rig-night over a period |
| Zones and rules | `zones`, `add-zone`, zone history | Import zones, edit details and detection settings, confirm rules, see the settings history |
| Users and roles | `users` | Create officers, activate and deactivate accounts |

## Project Structure

```text
insyte-frontend/
├── app/
│   ├── layout.jsx          root layout and fonts
│   ├── page.jsx            reads ?page= and shows the matching component
│   └── globals.css         colour variables and base styles
├── components/
│   ├── api.js              shared API client and helpers
│   ├── Sidebar.jsx / .css
│   ├── SignIn.jsx / .css
│   ├── Overview.jsx / .css
│   ├── Officers.jsx / .css
│   ├── OfficerProfile.jsx / .css
│   ├── Zones.jsx / .css
│   ├── AddZone.jsx / .css
│   └── Users.jsx / .css
└── .env.local              settings, never committed
```

## API Client

All requests go through `components/api.js`, so every page handles tokens and errors the same way.

| Helper | Purpose |
|---|---|
| `request(method, path, body)` | Calls `NEXT_PUBLIC_API_URL + path` with the token and JSON body |
| `getAll(path)` | Follows `limit` and `offset` until every page is loaded |
| `optional(loader)` | Turns a `404` into `null` for records that may not exist |
| `loadErrorMessage(error)` | A short, readable message for the page |
| `fullName`, `initials`, `roleLabel` | Consistent display of people and roles |

The access token is kept in `localStorage` under `vesper_token` and sent as `Authorization: Bearer <token>`. Signing out removes it and returns to `?page=sign-in`.

## Configuration

Nothing is hard-coded. Every setting is read from `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Vesper API |
| `NEXT_PUBLIC_MAP_TILES_URL`, `NEXT_PUBLIC_MAP_TILES_MAX_ZOOM`, `NEXT_PUBLIC_MAP_TILES_CREDIT` | Map background tiles and credit |
| `NEXT_PUBLIC_MAP_BOUNDS` | The map's starting view over Lake Kariba |
| `NEXT_PUBLIC_ZONE_RADIANCE_THRESHOLD`, `NEXT_PUBLIC_ZONE_CLUSTER_RADIUS_M`, `NEXT_PUBLIC_ZONE_MIN_CLUSTER_POINTS`, `NEXT_PUBLIC_ZONE_CONFIDENCE_THRESHOLD` | Default values shown when adding a zone |
| `NEXT_PUBLIC_STATS_PERIOD_NIGHTS`, `NEXT_PUBLIC_STATS_DEFAULT_NIGHTS` | Statistics periods |
| `NEXT_PUBLIC_REASSIGN_AFTER_MINUTES` | When an unacknowledged assignment is shown as overdue |
| `NEXT_PUBLIC_NIGHT_START_HOUR` | Which hour starts a new "night" for display |
| `NEXT_PUBLIC_MODEL_TUNING_TARGET` | Target used on the statistics page |


## Responsive Design

- Layouts adapt with CSS media queries down to phone width.
- Tables become stacked cards on small screens, with each cell labelled by its column name.
- Every page shows a clear message when data cannot be loaded, instead of an empty screen.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/?page=sign-in`. The API must be running and its `CORS_ALLOWED_ORIGINS` must include `http://localhost:3000`.

```bash
npm run lint
npm run format:check
npm run build
```
