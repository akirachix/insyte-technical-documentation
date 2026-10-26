---
layout: home

hero:
  name: Vesper Technical Documentation
  text: Satellite night-light intelligence for Lake Kariba
  tagline: Finding unusual kapenta fishing activity from space, and giving patrol teams a clear place to look.
  image:
    src: /logo.png
    alt: Vesper
  actions:
    - theme: brand
      text: Get Started
      link: /overview
    - theme: alt
      text: Architecture
      link: /architecture/overview


features:
  - title: Seen from Space
    details: NASA VIIRS night-light files are cleaned every night. Cloud, daytime, shore glow and duplicate pixels are removed before anything is counted.
  - title: Explainable Alerts
    details: DBSCAN groups lights into fleets. Each zone is compared with its own normal level for the same moon phase, and every alert carries its score and reason.
  - title: Built for the Field
    details: A coordinator web dashboard to assign and review alerts, and a Flutter app for officers to record inspections, violations and catch checks.
  - title: Secure by Design
    details: FastAPI with short-lived signed tokens, Argon2 passwords, role checks on every route, rate limits, security headers and redacted JSON logs.
---

## Documentation Sections

| # | Section | What it covers |
|---|---|---|
| 1 | [Overview](/overview) | The problem, what Vesper does and does not do, users and the end-to-end flow |
| 2 | [Architecture](/architecture/overview) | System layers, components, data flow and design guidelines |
| 3 | [Backend](/backend/overview) | FastAPI service structure, [API reference](/backend/api), [database](/backend/database) and [detection pipeline](/backend/detection) |
| 4 | [Frontend Web](/frontend-web/overview) | The Next.js coordinator dashboard |
| 5 | [Frontend Mobile](/frontend-mobile/overview) | The Flutter patrol officer app |
| 6 | [Security](/security/overview) | Authentication, access control and protections, mapped to the OWASP Top 10 |
| 7 | [Deployment](/deployment/overview) | Environments, configuration and how to run each part |

::: tip How to read these docs
Each page describes the system **as it is built today**.
:::
