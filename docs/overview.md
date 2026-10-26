# Overview

Vesper is an alert and patrol system for Lake Kariba, built by the Insyte team. It uses NASA night-light satellite data to show patrol coordinators where fishing-light activity is unusually high, so limited boats and fuel go where they are most likely to be needed. Patrol officers then check the area and record what they find on an offline-capable mobile app.

Vesper is a **patrol-priority aid**. It does not count rigs, it does not decide whether anything is legal, and it never accuses anyone. An alert means *this zone is busier than normal tonight and needs checking*.

## The Product at a Glance

| Aspect | Description |
|---|---|
| **What it is** | A coordinator web dashboard, an officer mobile app and an API that turns nightly satellite light data into zone alerts |
| **Who it is for** | Patrol coordinators and patrol officers of the fisheries and parks authorities on Lake Kariba |
| **What it does** | Compares each zone with its own normal level, raises an alert when activity is unusually high, assigns it to an officer, and records what the officer finds |
| **What it does not do** | Count rigs, judge legality, replace vessel tracking, permits or catch records, or put more boats and fuel on the water |

Three ideas shape the whole product:

1. **Seen from space.** Night-light data gives a second, independent view of fishing activity that does not depend on every rig carrying a working tracker.
2. **Explainable.** Every alert carries its score and the reason it was raised, so a coordinator can judge it rather than trust it blindly.
3. **Field-verified.** Patrol outcomes are recorded against every alert, so alerts can be measured and tuned over time.

### Who uses it

Two personas defined during the research guided the design.

| Persona | Role | What they need |
|---|---|---|
| Rudo Chikwanha | Patrol coordinator, regional office | A live view of the lake at night, a clear sense of which areas to prioritise, and field reports that arrive on time instead of on paper |
| Tendai Moyo | Patrol officer, on the lake | Alerts that say where to go and why, short forms to record inspections and catch checks, and an app that works with poor connectivity |

## The Problem

### Why Lake Kariba matters

Lake Kariba is shared by Zimbabwe (about 55%) and Zambia (about 45%). Its open-water kapenta fishery is an affordable source of food and supports a long chain of fishers, traders, transporters and retailers.

### What is going wrong

- **Catches have collapsed.** Reported catches fell from around 30,000 tonnes in the 1990s to about 5,200 tonnes in 2022 to 2023, a drop of roughly 83%. The figures come from different reporting systems, so treat them as indicative.
- **Fishing effort is high.** A 2013 FAO technical meeting estimated effort at about 1,016 rigs, against about 437 that would give the maximum sustainable yield.
- **Patrols search without direction.** Vessel tracking (VMS) never covers unregistered boats, so officers cannot see where rigs gather at night. With limited boats, fuel and mobile signal, patrols often search the usual grounds and hope.

**Problem statement.** Overfishing and unlicensed fishing are steadily reducing the kapenta catch on Zimbabwe's side of Lake Kariba, threatening the food and livelihoods that depend on it. Patrol officers cannot see where rigs are concentrated at night, because vessel tracking data never covers unregistered boats. With limited boats, fuel and signal, patrols search without direction, so overfishing continues unchecked while the fish stock declines.

**How might we** help Lake Kariba fisheries patrol teams make timely, evidence-informed deployment decisions despite limited resources and fragmented operational information?

### Three different problems

Falling catches have more than one cause, and each needs a different response. Vesper addresses only the middle one, and only the information part of it.

| Problem | Typical response | Does Vesper address it? |
|---|---|---|
| Legal overcapacity: too many licensed rigs | Licensing reform, effort limits, closed seasons | No |
| Illegal, unreported or untracked activity | Patrols, inspections, monitoring | Partly: it helps decide where to look |
| Environmental stress: water level, climate | Adaptive rules, monitoring | No |

### Why existing tools are not enough

| Tool | What it gives | Where it falls short |
|---|---|---|
| National policies and management plans | A framework for sustainable fishing | A policy cannot enforce itself on a large, remote lake without funding, staff and data |
| Licensing | Stops the legal fleet growing (Zimbabwe stopped issuing new rig permits in 2020) | Does not find unregistered activity |
| Vessel monitoring (VMS) | Location and movement of equipped rigs | Shows only rigs with working, accessible devices; coverage of the lake is not publicly known |
| Co-management committees | Local knowledge and legitimacy | Reports travel up through several administrative levels, so they may not reach patrol planners quickly |
| Cross-border cooperation | A shared Blue Economy Strategy (2025) | Each country still has its own databases and enforcement systems |



## Resources Used

### Data and science

| Resource | Used for |
|---|---|
| NASA VIIRS Day/Night Band night-light data (VNP46A1 nightly files) | The satellite signal: nightly light levels over the lake |
| Google Earth Engine API | Requesting and capturing the satellite data |
| DBSCAN spatial clustering | Grouping nearby lights into fleets |
| Zone and basin definitions | Splitting the lake into patrol zones, each with its own baseline |
| Kariba cleaning and model notebooks | Cleaning the historical data and building the detection model |
| Research report and interviews | Evidence for the problem, the users and the design decisions |

The nightly pipeline removes cloud, daytime, shore glow and duplicate pixels before anything is counted. It then finds lights, groups them with DBSCAN, builds zone readings, scores each zone against its own baseline for the same moon phase, and creates alerts.

### Technology

| Layer | Technology |
|---|---|
| Coordinator web dashboard | Next.js 16, React 19, MapLibre GL |
| Officer mobile app | Flutter, Provider (MVVM), secure storage, a local SQLite database for offline forms |
| API | FastAPI, SQLAlchemy 2, Alembic migrations, Pydantic schemas |
| Database | PostgreSQL in production, SQLite in development and tests |
| Security | Short-lived signed tokens, Argon2 password hashing, role checks on every route, rate limits, redacted JSON logs |
| Location | W3C Geolocation on the officer's phone |
| Hosting and delivery | Vercel for the web apps, a container on a cloud host for the API, GitHub with CI (Ruff, pytest, ESLint, Prettier) |

### Design and documentation

| Tool | Used for |
|---|---|
| Figma | Interface designs for the dashboard and mobile app |
| Lucidspark | System architecture diagram |
| VitePress | This documentation site |

## The Final Product Design

### How it works from end to end

1. **Collect.** Each night the pipeline takes the satellite light data for the lake and cleans it.
2. **Detect.** Lights are grouped into clusters, and each zone's activity is compared with its own normal level for the same moon phase.
3. **Alert.** If a zone is unusually active, an alert is created with its score and the reason it was raised. The wording is neutral: *Unusually high fishing-light activity detected in this zone tonight.*
4. **Assign.** The coordinator opens the dashboard, reviews the alert and assigns it to a patrol officer.
5. **Check.** The officer acknowledges the alert on the mobile app, goes to the area where possible, and records what they find: whether rigs and lights are present, whether permits and trackers are in order, and any violations or catch checks.
6. **Close.** The coordinator reviews the report and either verifies the alert (`activity_confirmed` or `no_activity`) or dismisses it. The outcome is stored so alert quality can be measured.

### The two interfaces

| | Coordinator web dashboard | Patrol officer mobile app |
|---|---|---|
| Used by | Patrol coordinators | Patrol officers |
| Main jobs | Review alerts on a map, assign and review them, manage zones, see statistics | Claim and acknowledge alerts, record inspections and violations, record catch checks |
| Built for | Planning at night or in the early morning | Use on a boat: large touch targets and short forms |

The officer app saves forms and location on the phone and sends them when a connection returns, so a weak signal on the water does not lose a report.

### Safeguards built into the design

- **Neutral language.** Alerts never use words such as "illegal", "ghost boat" or "dark rig". A detection is described as unusual light activity that needs verification.
- **No naming from satellite data alone.** Individual rigs are never named or shown from a satellite detection by itself.
- **Role-based access.** Only authorised officers and coordinators see operational layers.
- **Every move is checked.** Alerts follow a fixed set of statuses, and invalid moves are rejected.

See [Security](https://docs.google.com/document/d/1E8U9r6zHr0yqcYyplcxXAwgKesu6auHCQREmjJBLyTg/edit?usp=sharing) for the full list.

## Design and Brand Guidelines

### Design Principles

| Principle | Meaning |
|---|---|
| Clarity first | The coordinator must see where to look and why in one glance |
| Honest wording | Alerts describe *unusual light activity*, never an offence |
| Field-ready | Large touch targets and short forms for officers on boats |
| Consistent | One palette and one type scale across web and mobile |

### Colour Palette

| Name | Hex | Use |
|---|---|---|
| Navy | `#122B59` | Primary text, headers, primary buttons |
| Cyan | `#77E6F6` | Highlights, active states, new alerts |
| Sky | `#BCE0FE` | Secondary surfaces, in-progress states |
| Mist | `#E9F1F8` | Page and card backgrounds |
| White | `#FFFFFF` | Cards and inputs |

### Design Resources

- [Vesper UI designs in Figma](https://www.figma.com/design/t6CzMnYAs2C4bRnB3Nxew1/Insyte?node-id=7-2&p=f&t=TF2kUwaEt5Hb9p1v-0)

### Frontend Conventions

- Plain CSS: one `.css` file next to each `.jsx` component, no inline styles, no Tailwind.
- JavaScript only (no TypeScript).
- No hard-coded values: URLs, thresholds and map settings come from `.env.local`.

## What Is Still Unproven

Vesper is built on a plausible idea that has not yet been tested on the lake. The next steps follow the research recommendations:

- **Validate the detections** against reliable field information such as patrol outcomes, permit records and vessel-tracking data.
- **Measure latency.** The time between a satellite pass and data release decides whether alerts can support same-night patrols.
- **Test whether alerts change patrol decisions**, ideally with patrol ride-alongs and formal permissions.
- **Agree data sharing** with both countries so permits, zones and tracking data can be used for validation.
- **Keep the main constraint open.** If officers name fuel, authorisation or coordination as the real limit, the project should respond to that rather than force a satellite solution.

## Where to Go Next

| To learn about | Go to |
|---|---|
| How the layers fit together | [Architecture](/architecture/overview) |
| The API, database and detection logic | [Backend](/backend/overview) |
| The coordinator dashboard | [Frontend Web](/frontend-web/overview) |
| The officer app | [Frontend Mobile](/frontend-mobile/overview) |
| Authentication, roles and safeguards | [Security](/security/overview) |
| Running and hosting each part | [Deployment](/backend/deployment) |


## Documentation Deployment

This documentation site is built using VitePress and deployed automatically using GitHub Actions.

### Local Development
To run the documentation portal locally for editing:
```bash
npm run docs:dev
```
The site will be accessible locally at `http://localhost:5173/`.

### Production Deployment
Deployments are fully automated via CI/CD:
1. Any commits pushed or merged into the `main` branch trigger the `.github/workflows/deploy-docs.yml` workflow.
2. The workflow installs project dependencies, executes `npm run docs:build`, and publishes the static bundles directly to **GitHub Pages**.
