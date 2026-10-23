# Insyte-technical-documentation

Technical documentation for Vesper, the night-light alert dashboard and patrol tool for Lake Kariba, Zimbabwe. It covers the offline mobile app used by patrol officers, the web dashboard used by patrol coordinators and administrators, the API that connects them, and the alert engine that turns satellite night-light data into zone alerts.

## Contents

| Page | What it covers |
| --- | --- |
| Overview | What Insyte is, who it is for, and its scope |
| Architecture | How the components fit together and how data flows |
| Backend / API | The API service, data model, endpoints and business rules |
| Patrol Officer Mobile App | The field app, including offline storage and sync |
| Coordinator Web App | The web dashboard (PWA) for coordinators and administrators |
| Alert Engine | VIIRS night-light processing, baselines and zone alerts |
| Security | Authentication, roles, location privacy and data protection |
| Deployment | Hosting, environments and releases |
| Developer Guide | Setting up and running Insyte locally |
| Limitations | What is implemented, partial, planned or out of scope |

## Getting started

### Prerequisites

- Python 3.9 or newer (`python3 --version` to check)
- `pip`

### Install and run

```bash
git clone https://github.com/akirachix/insyte-technical-documentation.git
cd insyte-technical-documentation
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
mkdocs serve
```
### Commands

| Command | What it does |
| --- | --- |
| `mkdocs serve` | Starts the local preview |
| `mkdocs build --strict` | Builds the static site into `site/` and fails on warnings such as broken links |
| `mkdocs gh-deploy` | Publishes the built site to GitHub Pages (normally done by the workflow) |

## Project structure

```text
insyte-technical-documentation/
├── mkdocs.yml               
├── requirements.txt        
├── .github/workflows/
│   └── deploy-docs.yml      
└── docs/
    ├── stylesheets/
    │   └── extra.css        
    ├── images/              
    ├── index.md             
    └── *.md                 
```

## Writing documentation

### Edit a page

1. Open the page in `docs/`, for example `docs/overview.md`.
2. Write under the `# Title`, using `##` for sections and `###` for sub-sections.
3. Check it in the browser with `mkdocs serve`.

### Add a page

Create `docs/your-page.md` with this header:

```markdown
---
title: Your Page
description: One sentence describing the page.
status: planned
---

# Your Page
```

Add it to the `nav` in `mkdocs.yml`:

```yaml
nav:
  - Guides:
      - Your Page: your-page.md
```

### Page status

Set `status` in each page's header so the team can see progress. It shows as an icon beside the page in the sidebar.

| Status | Meaning |
| --- | --- |
| `planned` | Title and headings only, not started |
| `draft` | Being written |
| `review` | Ready for a teammate to check |
| `complete` | Reviewed and up to date |

### Writing rules

- Describe what the code does today, not what is planned.
- Number sections (`## 1.`, `### 1.1`) so they are easy to refer to.
- Use a table when comparing more than three things.
- Name source files in backticks, such as `services/alert_service.py`, so readers can find the code.
- List environment variable names only. Never commit secrets or real values.
- Use the product's words: patrol officer, patrol coordinator, alert, zone, inspection, violation report, catch check.
- An alert is a lead, not proof of an offence. Never word an alert or a report as if it proves illegal activity.
- Put images in `docs/images/` and reference them as `![Description](images/image-name.png)`.
- Write each fact in one place and link to it from other pages.

## Contributing

1. Create a branch: `git checkout -b docs/<page-name>`
2. Write or update the page.
3. Run `mkdocs build --strict` to make sure the site builds. It fails on broken links.
4. Commit, push and open a pull request for review.

## Related repositories

| Repository | Description |
| --- | --- |
| Backend | API service, database and alert engine |
| Web app | Coordinator dashboard (PWA) |
| Mobile app | Offline field app for patrol officers |
