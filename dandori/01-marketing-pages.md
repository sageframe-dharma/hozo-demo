# Dandori: Marketing pages (landing, about, demo index)

## Goal

Build the three non-app pages of the Hōzō demo site: the landing page (`/`),
the about page (`/about/`), and the demo launcher (`/demo/`). All three use
the `marketing.njk` layout (sans-serif body) but render with the same Hōzō
slate palette as the real app. They are the entry points; the rest of the
site links back to them through the nav.

## Repository

`/Users/atmarcus/Vaults/sageframe-dharma/hozo-demo/`

## Files to create

- `src/index.njk` — landing page (uses `marketing.njk` layout)
- `src/about.njk` — story page (uses `marketing.njk` layout); permalink `/about/`
- `src/demo/index.njk` — walkthrough launcher (uses `base.njk` layout); permalink `/demo/`

## Pre-existing context the agent must use

- **Layouts available:** `base.njk` (mono font, includes `#toast` div, loads
  `demo.js` + `tour.js`) and `marketing.njk` (sans-serif body, loads only
  `tour.js`). Set via front matter `layout: base.njk` or `layout: marketing.njk`.
- **Shared CSS** (`src/assets/css/hozo.css`): `.card`, `.btn-primary`, `.btn-warn`,
  `.btn-danger`, `.badge-ok`, `.badge-err`, `.badge-nil`, `.badge-running`,
  `.terminal` and its children. Plus all Tailwind utilities via CDN.
- **Data sources** (auto-loaded as `site`, `jobs`, `settings`, `devices`):
  see `src/_data/*.js` for shape.
- **Front matter for nav state**: set `showSchedulerBadge: true` to show the
  "● Scheduler running" pill in the nav (relevant on /demo/, not on / or /about/).
- **Tour steps**: declare per-page via `tourSteps:` front matter array of
  `{ selector, title, body, next? }`. See "Tour wiring" below.

## Required changes — landing page (`src/index.njk`)

Hero, three-up feature row, embedded ASCII architecture diagram, two CTAs
side by side ("▶ Try the live demo" → `/demo/` and "📖 Read the story" →
`/about/`), small "Get it / install" callout linking to the GitHub repo.

Front matter:

```yaml
---
layout: marketing.njk
pageTitle: false
pageDescription: "Hōzō — wake-on-demand ZFS backup orchestrator. Try the live demo, no install needed."
---
```

Content beats (in order):

1. **Hero** — Large `Hōzō. 宝蔵` lockup, tagline "Wake-on-demand ZFS
   backup orchestrator", a one-paragraph subtitle: "Hōzō wakes a sleeping
   backup server, replicates ZFS snapshots over SSH, verifies the result,
   then shuts the server back down. Built for low-power homelab backup
   nodes — Intel NUC, Beelink, Raspberry Pi — silent, off when not in use."
2. **Two primary CTAs** — `Try the live demo →` (`/demo/`, blue
   `btn-primary` big button) and `Read the story (built in 3 hours) →`
   (`/about/`, slate outline button).
3. **Three-up feature row** (responsive: 3 cols on `md+`, stack on mobile)
   — each a `card p-5` with an emoji + title + 2-sentence body:
     - 🌙 **Wake. Sync. Sleep.** Wake-on-LAN, wait for SSH, optionally spin
       up a USB drive, run syncoid, verify, then shut the box down.
     - 🛡 **Tested in production.** 278 tests, 99% coverage, zero lint
       errors — not a prototype.
     - 🔐 **Passkeys only.** WebAuthn-only auth. No passwords to leak,
       no shared secrets, no bearer tokens.
4. **Architecture diagram** — use a `<pre class="card p-4 text-xs
   overflow-x-auto">` block with a condensed ASCII version of the box
   diagram from the README (controller → SSH/WoL → remote NUC → USB
   drive). Trim to ~14 lines so it fits without scrolling on most
   screens.
5. **Install / Get it** card — Two columns on `md+`:
   - Left: "Run it yourself" with a `docker run` or `pipx install hozo`
     snippet in a `<pre>`. Use `pipx install hozo` (matches what the
     project README implies).
   - Right: "Read the source" link to the GitHub repo + "Built with the
     Ho System" link to `{{ site.hoSystem }}`.
6. **Footer** is automatic from the layout.

## Required changes — about page (`src/about.njk`)

Front matter:

```yaml
---
layout: marketing.njk
permalink: /about/
pageTitle: "About — Built in Three Hours"
pageDescription: "Hōzō was built in a single three-hour morning session using the Ho System. The AI wrote the code. The author built the system."
---
```

Content (write the prose; don't just bullet it):

1. **Headline:** "Built in three hours."
2. **Lede paragraph:** Andrew built Hōzō in a single early-morning session
   before the kids were up — 278 tests, 99% coverage, zero lint errors. It
   was not a prototype. It was production software, deployed and running.
3. **The key distinction** — pull-quote treatment, centered, bigger:
   > "The AI wrote the code. I built the system. Those are different things."
4. **Section: "What 'building the system' meant"** — 3-4 paragraphs
   covering: the architecture and specification work that happened first;
   monitoring the AI's execution and correcting deviations; the
   verification discipline that caught what slipped through.
5. **Section: "Why this was possible"** — paragraph about the months of
   prior design work and eleven weeks of deliberate Python practice using
   the Ho System. Include the quote: *"Anything I can specify, I can
   build."*
6. **Section: "The Ho System"** — 1-2 paragraphs describing the
   methodology: structured human-AI collaborative development modeled on
   the martial-arts arc of shu-ha-ri (follow form → break form deliberately
   → transcend form). Emphasis on bounded sessions, verification, and
   environmental design that encodes quality practices. Link to
   `{{ site.hoSystem }}`.
7. **Section: "Speed without stability is just accelerated chaos"** —
   short paragraph naming the DORA quote and connecting it to why the
   verification discipline matters.
8. **Closing CTA** — "Read the full Substack post →" linking to
   `{{ site.substack }}` (open in new tab). "Or try the demo →" linking
   to `/demo/`.

Layout note: use generous prose width (`max-w-2xl`), `text-slate-300`
paragraphs, `text-2xl font-bold` section headings with `mt-10 mb-3`. The
pull quote: `text-xl italic text-slate-100 border-l-4 border-blue-400
pl-4 my-8`.

## Required changes — demo index (`src/demo/index.njk`)

The walkthrough launcher. This is what `/demo/` shows. Lists every
screen with a one-line description and provides a "▶ Start the guided
tour" button that triggers the cross-page walkthrough.

Front matter:

```yaml
---
layout: base.njk
permalink: /demo/
pageTitle: "Live Demo"
showSchedulerBadge: true
---
```

Content:

1. **Heading:** "Live Demo"
2. **Lede:** "This is the real Hōzō interface, running on sample data in
   your browser. Nothing leaves this page — no SSH, no ZFS, no backend.
   Click anywhere, break anything."
3. **Big primary button:** `▶ Start the guided tour` with
   `data-start-tour` attribute. Clicking triggers `hozoStartTour()` (the
   `data-start-tour` handler is already wired in `tour.js`).
4. **"Or jump straight in" grid** — 3-col responsive grid of `card p-4`
   tiles, each is an `<a>` to a demo screen:
   - 📊 **Dashboard** — `/demo/dashboard/` — "Job cards. Run a backup
     and watch it animate through every state."
   - ✏ **Create a job** — `/demo/jobs/new/` — "Configure source, target,
     schedule, notifications."
   - 📜 **Live log** — `/demo/jobs/log/` — "Watch syncoid run in real
     time (well, faked time)."
   - ⚙ **Settings** — `/demo/settings/` — "SSH defaults, notification
     channels, WebAuthn RP ID."
   - 🔐 **Devices (WebAuthn)** — `/demo/auth/devices/` — "Passkeys-only
     auth. No passwords."
   - ⚠ **Break-glass restore** — `/demo/restore/` — "Pull data back from
     the offsite. Type-to-confirm."

5. **CLI callout** at the bottom (card with terminal icon): "Prefer
   the command line? See the [animated CLI walkthrough →](/cli/)."

Make all card grids stack on mobile (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`).

## Tour wiring

The demo-index page's tour `tourSteps` front matter should be the first
3-4 steps of the cross-site walkthrough. Use:

```yaml
tourSteps:
  - selector: "[data-start-tour]"
    title: "Welcome to the Hōzō demo"
    body: "Click <b>Start the guided tour</b> any time, or wander on your own. Everything here runs on fake data in your browser."
  - selector: "a[href='/demo/dashboard/']"
    title: "The Dashboard is the heart of it"
    body: "Backup jobs, one card each. Run them, watch the log tail, jump to settings — start here."
    next: "/demo/dashboard/"
```

Cross-page transitions: when a step has `next: "/path/"`, the "Take me
there →" button navigates and the tour resumes on that page.

## Acceptance criteria

- `npx @11ty/eleventy --serve` builds with no warnings.
- `curl -s http://localhost:8080/ | grep -i "wake-on-demand"` returns
  the tagline.
- `/about/` renders the pull quote with the blue left border.
- `/demo/` shows 6 screen tiles and a Start Tour button.
- On a 375px-wide viewport (mobile), the feature row on `/` stacks
  vertically and the 3-up tile grid on `/demo/` stacks to one column.
- All internal links resolve (no 404s when navigating the demo).
- No console errors in browser devtools.

## Verification commands

```bash
cd ~/Vaults/sageframe-dharma/hozo-demo
npx @11ty/eleventy
test -f _site/index.html
test -f _site/about/index.html
test -f _site/demo/index.html
grep -q "Three" _site/about/index.html
grep -q "Start the guided tour" _site/demo/index.html
```

## Commit

`feat(marketing): landing, about, and demo index pages`
