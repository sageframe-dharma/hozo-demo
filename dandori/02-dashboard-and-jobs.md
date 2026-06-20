# Dandori: Dashboard, job form, job log

## Goal

Port the heart of the Hōzō UI — dashboard with job cards, the
create/edit job form, and the live log viewer — into the demo site as
static Eleventy pages with JS-driven interactivity. The "Run Backup"
button on a card triggers a scripted timeline that walks the job through
every state the real orchestrator passes through (WoL → SSH wait → drive
spin-up → syncoid → verify → notify → shutdown → success), with inline
log lines appearing as it goes.

## Repository

`/Users/atmarcus/Vaults/sageframe-dharma/hozo-demo/`

## Source templates to port from

- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/dashboard.html`
- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/partials/_job_card.html`
- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/job_form.html`
- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/job_log.html`
- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/partials/log_lines.html`

Read those files before writing. The demo must look identical (same
slate palette, same card layout, same badge styles) — what changes is
that HTMX endpoints are replaced with vanilla JS calls.

## Files to create

- `src/demo/dashboard.njk` — permalink `/demo/dashboard/`
- `src/demo/jobs/new.njk` — permalink `/demo/jobs/new/`
- `src/demo/jobs/edit.njk` — permalink `/demo/jobs/edit/` (pre-filled with
  the first job from data)
- `src/demo/jobs/log.njk` — permalink `/demo/jobs/log/`
- `src/_includes/_job_card.njk` — reusable partial included from dashboard

## Pre-existing context

- Layout: `base.njk` (loads `demo.js` + `tour.js`, includes `#toast`).
- Data: `jobs` array from `src/_data/jobs.js` — three jobs, one with
  `last_result.success: true`, one `false`, one `null` (never run).
- Settings: `settings` from `src/_data/settings.js` — used for the
  scheduler badge.
- Helpers available on `window`:
  - `hozoToast(msg, kind)` — kind: "info" | "ok" | "warn" | "err"
  - `hozoRunScripted(jobName, cardElement)` — runs the scripted backup
    timeline on a card. Pass the `<div class="card">` element. The card
    must contain:
      - `[data-status-badge]` — gets its `textContent` and class swapped
        as the run progresses
      - `[data-inline-log]` — `<div class="font-mono text-xs">` that
        appears (`.hidden` removed) and gets log lines appended
  - `hozoWake(jobName)`, `hozoShutdown(jobName)`, `hozoDelete(jobName)`
- Filters: `formatDate` (e.g. `job.last_result.started_at | formatDate("ymdhm")`)
  and `relTime` (e.g. `job.last_result.started_at | relTime`).

## Required changes — dashboard

The dashboard renders a `_job_card.njk` for each job. Each card:

- Title row: job name + description, status badge on the right.
  - If `job.last_result.success`: green `badge-ok`, text `✓ OK`, links
    to `/demo/jobs/log/` (use `data-status-badge` so the script can
    flip it during a run).
  - If `job.last_result.success === false`: red `badge-err`, text
    `✗ Failed — view log`, links to `/demo/jobs/log/`.
  - If `job.last_result === null`: gray `badge-nil`, text `— No runs yet`.
- Info grid (2 cols on `md+`, stacks on mobile): Source, Target, Last run
  (use `formatDate`), Duration, Snapshots count. For failures show the
  error in a red row spanning both cols.
- Action row: `▶ Run Backup` (primary blue), `⚡ Wake` (amber outline),
  `⏻ Shutdown` (red outline), then a kebab menu (`<details
  class="job-menu">`) with Edit / Delete. The kebab menu must collapse
  on mobile alongside everything else.
- **Action wiring (replace HTMX with onclick):**
  - Run: `onclick="hozoRunScripted('{{ job.name }}', this.closest('.card'))"`
  - Wake: `onclick="hozoWake('{{ job.name }}')"`
  - Shutdown: `onclick="hozoShutdown('{{ job.name }}')"`
  - Edit: `<a href="/demo/jobs/edit/">✏ Edit job</a>`
  - Delete (form): `onclick="hozoDelete('{{ job.name }}'); return false;"`
- **Inline log container** (new — not in the original): below the action
  row, add `<div data-inline-log class="hidden mt-3 p-3 bg-slate-900
  rounded font-mono text-xs leading-5 max-h-48 overflow-y-auto"></div>`.
  This is where the scripted timeline writes lines so you don't have
  to navigate to a separate log page to see the demo work.

Page structure (`src/demo/dashboard.njk`):

```njk
---
layout: base.njk
permalink: /demo/dashboard/
pageTitle: "Dashboard"
showSchedulerBadge: true
tourSteps:
  - selector: "#new-job-btn"
    title: "Jobs live here"
    body: "Each card is a backup job. Tap <b>+ New Job</b> to configure one — we'll start by running the first one."
  - selector: "[data-card='nightly-rpool'] button[data-run]"
    title: "Run a backup"
    body: "Click <b>▶ Run Backup</b>. Hōzō will wake the remote box, run syncoid, verify the snapshots, and shut the box down — all faked here, but the states are the real ones."
  - selector: "[data-card='nightly-rpool'] [data-status-badge]"
    title: "Watch the status"
    body: "This badge cycles through every real state. When it lands on <b>✓ OK</b>, the run is done."
  - selector: "[data-card='weekly-photos'] [data-status-badge]"
    title: "Failures are loud"
    body: "Click the red <b>Failed</b> badge to read the log."
    next: "/demo/jobs/log/"
---

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Backup Jobs</h1>
  <a id="new-job-btn" href="/demo/jobs/new/" class="btn-primary text-xs px-4 py-2 rounded text-white">+ New Job</a>
</div>

<div id="job-cards">
  {% for job in jobs %}
    {% include "_job_card.njk" %}
  {% endfor %}
</div>
```

The `_job_card.njk` partial must set `data-card="{{ job.name }}"` on the
outer card div, and `data-run` on the Run button, so tour selectors can
find them.

## Required changes — job form (new + edit)

Port `job_form.html` faithfully — same card sections (Job, Source &
Target, Schedule, SSH, Behaviour, Drive Spin-Up), same fields, same
hints. Two pages share the structure; differences:

- `new.njk`: empty values, action POSTs nowhere (submit handler shows
  a toast "(demo) Job 'X' would be created" then navigates back to
  `/demo/dashboard/`).
- `edit.njk`: pre-fills with `jobs[0]` (nightly-rpool); the name field is
  readonly with the helper text "Name can't be changed after creation."

Replace the original Jinja `{% macro %}` blocks with native Nunjucks
macros (same syntax) — or, if simpler, inline the field markup. Both
pages must respect 2-col grids on `md+` and stack on mobile (`grid-cols-1
md:grid-cols-2`).

Submit handler (single inline script at the bottom of each page):

```html
<script>
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (new FormData(e.target).get("name") || "this job").trim();
    hozoToast(`(demo) Job '${name}' would be ${'{{ "saved" if isEdit else "created" }}'}.`, "ok");
    setTimeout(() => { window.location.href = "/demo/dashboard/"; }, 900);
  });
</script>
```

Use front matter `isEdit: true` on `edit.njk`.

## Required changes — job log

Port `job_log.html` faithfully. Renders for the first job (nightly-rpool)
with its (successful) `last_result` shown — duration, started_at,
finished_at, snapshots count. The `#log-box` div is populated server-side
with realistic log lines (write them inline; don't rely on partials):

```
[hozo] Sending Wake-on-LAN packet to AA:BB:CC:DD:EE:FF
[hozo] WoL packet sent
[hozo] Waiting for SSH on backup-box.tailnet.ts.net:22
[hozo] SSH up after 3.2s
[hozo] Issuing read kick to /dev/sdb
[hozo] Drive ready after 6.1s
[syncoid] Sending incremental rpool/data@hozo_2026-06-19 ... rpool/data@hozo_2026-06-20
[syncoid] 12% complete · 418 MiB/s · ETA 01:02
[syncoid] 47% complete · 412 MiB/s · ETA 00:38
[syncoid] 89% complete · 405 MiB/s · ETA 00:08
[syncoid] Transfer complete · 6.74 GiB in 412.3s
[hozo] Listing remote snapshots: 47 found · latest matches local
[hozo] ntfy.sh/hozo-backups-demo ← ✓ nightly-rpool ok (47 snaps)
[hozo] ssh root@backup-box.tailnet.ts.net 'shutdown -h now'
[hozo] Job 'nightly-rpool' completed in 412.3s (47 snapshots on remote)
```

Apply the original color rules per line: lines containing `[syncoid]` →
`text-cyan-300`; `ERROR` → `text-red-400`; `WARNING` → `text-yellow-400`;
default → `text-slate-300`. Just do this with a tiny inline loop —
either pre-color in the template or with a 10-line script.

At the bottom keep the existing "Break-glass restore" link to
`/demo/restore/`.

Add tour steps that hand off back to `/demo/dashboard/` after the user
has seen the log.

## Acceptance criteria

- `/demo/dashboard/` renders three cards. The nightly-rpool card shows
  a green ✓ OK badge, weekly-photos shows red ✗ Failed, monthly-archive
  shows gray — No runs yet.
- Clicking ▶ Run Backup on the nightly-rpool card: status badge
  immediately changes; an inline log area appears below the actions and
  lines stream in over ~11 seconds; status lands on ✓ OK; a toast appears
  ("Started:" then "✓ … finished in 11.2s").
- Clicking ⚡ Wake produces a toast. Clicking ⏻ Shutdown produces a
  confirm() then a toast.
- The kebab menu opens and closes correctly (existing behavior in
  `demo.js`).
- `/demo/jobs/new/` shows the empty form with all six card sections.
  Submitting toasts "(demo) Job '...' would be created" and redirects to
  `/demo/dashboard/`.
- `/demo/jobs/edit/` shows the form pre-filled with nightly-rpool values;
  the Name field is readonly.
- `/demo/jobs/log/` shows the colored log lines and the result summary.
- On 375px viewport: dashboard cards readable, action row wraps cleanly,
  form fields stack to one column.
- No console errors.

## Verification commands

```bash
cd ~/Vaults/sageframe-dharma/hozo-demo
npx @11ty/eleventy
test -f _site/demo/dashboard/index.html
test -f _site/demo/jobs/new/index.html
test -f _site/demo/jobs/edit/index.html
test -f _site/demo/jobs/log/index.html
grep -q "Run Backup" _site/demo/dashboard/index.html
grep -q "data-status-badge" _site/demo/dashboard/index.html
grep -q "data-inline-log" _site/demo/dashboard/index.html
grep -q "nightly-rpool" _site/demo/jobs/edit/index.html
grep -q "syncoid" _site/demo/jobs/log/index.html
```

## Commit

`feat(demo): dashboard, job form, and job log pages with scripted run-now flow`
