# hozo-demo

Interactive walkthrough and live demo for [Hōzō](https://github.com/sageframe-no-kaji/hozo-sentinel)
— a wake-on-demand ZFS backup orchestrator.

Deployed at **[hozo.atmarcus.net](https://hozo.atmarcus.net)**.

## What this is

The full Hōzō web UI, ported to a static site, running on sample data in
the visitor's browser. Same templates, same palette, same interactions
— no backend, no SSH, no ZFS. Click "Run Backup" and watch a card
animate through every state the real orchestrator passes through (WoL →
SSH wait → drive spin-up → syncoid → verify → notify → shutdown).
Includes a guided tour and an animated CLI walkthrough.

## Stack

- [Eleventy](https://www.11ty.dev/) (Nunjucks templates)
- Tailwind via CDN (matches the real app)
- Vanilla JS for the scripted interactions and the tour overlay
- Deploys to Cloudflare Pages

## Local development

```bash
npm install
npm start                # http://localhost:8080 with live reload
npm run build            # writes _site/
```

## Project layout

```
src/
├── _data/               # site config + sample jobs / settings / devices
├── _includes/           # head, nav, footer, _job_card
├── _layouts/            # base.njk (mono, app pages) + marketing.njk
├── assets/
│   ├── css/hozo.css     # shared styles from the real app
│   └── js/
│       ├── demo.js      # toast, scripted run-now flow, kebab menu
│       ├── tour.js      # cross-page guided walkthrough
│       └── terminal.js  # CLI page animation engine
├── index.njk            # landing
├── about.njk            # "Built in three hours" story
├── cli.njk              # animated CLI terminal
└── demo/
    ├── index.njk        # tour launcher
    ├── dashboard.njk    # job cards
    ├── jobs/            # new, edit, log
    ├── auth/            # devices, login, register
    ├── settings.njk
    └── restore/         # confirm + log
```

## Sample data

Three jobs cover the three card states the UI distinguishes:

- `nightly-rpool` — green, last successful run 8h ago
- `weekly-photos` — red, failed run 2d ago (incremental snapshot mismatch)
- `monthly-archive` — gray, never run

Defined in `src/_data/jobs.js`. Tweak there to change what the demo shows.

## How the dandori workflow works

This repo was built using the [Ho System](https://github.com/sageframe-no-kaji/ho-system)
methodology. The `dandori/` folder contains the five task specs (one per
section of the site) that were dispatched to parallel sub-agents. Each
spec is self-contained: goal, files, required changes, acceptance
criteria, verification commands.

To rebuild a section, hand its dandori spec to an agent and let it run.

## Deploy

Two manual steps were needed once to wire deploy:

1. **Cloudflare Pages** — create a new Pages project pointed at the
   GitHub repo `sageframe-dharma/hozo-demo`. Build command: `npm run
   build`. Output directory: `_site`. Node version: 20+.
2. **DNS** — add a CNAME `hozo` in the Cloudflare zone for
   `atmarcus.net` pointing to the Pages project's `*.pages.dev`
   subdomain.

Once those are in place, every push to `main` redeploys automatically.

## Related

- **Source for the real app:** [sageframe-no-kaji/hozo-sentinel](https://github.com/sageframe-no-kaji/hozo-sentinel)
- **The story:** [Three Hours](https://sageframe.substack.com/p/three-hours) on Substack
- **The methodology:** [Ho System](https://github.com/sageframe-no-kaji/ho-system)
