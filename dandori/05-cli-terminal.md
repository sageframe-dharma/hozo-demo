# Dandori: Animated CLI terminal page

## Goal

Build `/cli/` — a dedicated page that demonstrates the Hōzō command-line
interface inside a faux terminal. The visitor steps through `hozo jobs
list`, `hozo jobs run nightly-rpool`, `hozo status`, `hozo wake`, and
`hozo shutdown` by clicking a "Next ▸" button. Each step types out the
command, then "executes" by streaming realistic output line-by-line.
The user can also click "Replay" to start over, or pick a specific
command from a sidebar list.

## Repository

`/Users/atmarcus/Vaults/sageframe-dharma/hozo-demo/`

## Source to study

- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/cli.py`

Read this to understand the real CLI surface — `hozo` is a `click` group
with subcommands. The demo should show the actual help text, the actual
flag names, and realistic output.

## Files to create

- `src/cli.njk` — permalink `/cli/`
- `src/assets/js/terminal.js` — typing/animation engine (loaded by /cli/ only)

## Pre-existing context

- Layout: `base.njk`
- Shared CSS classes for the terminal already live in
  `src/assets/css/hozo.css`: `.terminal`, `.terminal-head`,
  `.terminal-body`, `.prompt`, `.ok`, `.warn`, `.err`, `.dim`, `.accent`,
  `.cursor`. Use them.
- The page should NOT load `tour.js` for tour interaction (it can — tour
  steps are fine), but the primary interaction here is the Next button,
  not the tour.

## Required changes — page structure

`src/cli.njk` front matter:

```yaml
---
layout: base.njk
permalink: /cli/
pageTitle: "Command Line"
---
```

Layout (use Tailwind, 2-col on `md+`, stack on mobile):

- **Left/main column:** the terminal — `<div class="terminal">` with
  a `.terminal-head` showing `● ● ●` (red/yellow/green dots) + the
  current "prompt path" (e.g. `~/hozo$`), and a `.terminal-body` div
  with id `term-body` that the script writes into.
- **Right column** (`md:w-72`): a card listing the demo scenarios. Each
  is a button that resets the terminal to that scenario:
    - `▸ Hello & help` — `hozo --help`
    - `▸ List jobs` — `hozo jobs list`
    - `▸ Run a backup` — `hozo jobs run nightly-rpool`
    - `▸ Check remote status` — `hozo status --job nightly-rpool`
    - `▸ Send WoL` — `hozo wake nightly-rpool`
    - `▸ Shutdown remote` — `hozo shutdown nightly-rpool`
- **Below the terminal:** a row of controls:
    - `▸ Next` (primary blue) — advances to the next line/step within
      the current scenario
    - `↻ Replay` — restarts the current scenario from the top
    - `⏭ Skip animation` — fast-forwards to the end of the current
      scenario (renders everything instantly)

Below the controls add a short explainer paragraph: "The `hozo` CLI
mirrors the web UI 1:1. Anything you can do in the dashboard, you can
script. The web UI is a thin layer over the same orchestration."

## Required changes — terminal engine (`terminal.js`)

The engine takes scenario data and animates it. Each scenario is a
list of "events":

```js
// event shapes:
// { type: "cmd", text: "hozo jobs list" }                  -> types the command after a prompt
// { type: "out", text: "...", cls: "ok"|"warn"|"err"|"dim"|"accent"|null, instant: bool }
// { type: "wait", ms: 600 }
// { type: "prompt" }                                       -> blank prompt line at the end
```

The engine prints:
- A `<span class="prompt">~/hozo$ </span>` then types out the command
  character by character (12-22ms per char, with small random jitter
  for verisimilitude). After typing, prints a newline.
- Output lines appear one at a time, each with optional color class.
  Default per-line delay ~80ms; if event has `instant: true`, no delay.
- `wait` events pause that many ms.

Controls:
- "Next" button — if mid-typing/streaming, finishes the current event
  instantly and pauses; otherwise advances to the next event.
- "Replay" — wipes `#term-body`, restarts the current scenario index 0.
- "Skip animation" — runs all remaining events instantly (no delays).

Auto-play: when a scenario is loaded, it starts streaming
automatically. The user can click Next or Skip to speed through.

Expose `window.hozoLoadScenario(name)` so the sidebar buttons can switch
scenarios.

Provide these scenarios (write realistic output that matches what the
real CLI would produce; use the actual flags from `cli.py`):

### `help`

```
$ hozo --help
Usage: hozo [OPTIONS] COMMAND [ARGS]...

  Hōzō — Wake-on-demand ZFS backup orchestrator.

Options:
  --version              Show the version and exit.
  -c, --config TEXT      Path to hozo config.yaml  [default: ~/.config/hozo/config.yaml]
  -v, --verbose          Enable debug logging
  --help                 Show this message and exit.

Commands:
  jobs      Manage and execute backup jobs.
  serve     Start the Hōzō web UI and API server.
  shutdown  SSH shutdown the remote host for the named job.
  status    Show status of the remote backup host.
  wake      Send a Wake-on-LAN packet for the named job's host.
```

### `list`

```
$ hozo jobs list
NAME                    SOURCE                  TARGET HOST                 SHUTDOWN
─────────────────────────────────────────────────────────────────────────────────────
nightly-rpool           rpool/data              backup-box.tailnet.ts.net   yes
weekly-photos           tank/photos             backup-box.tailnet.ts.net   yes
monthly-archive         tank/archive            backup-box.tailnet.ts.net   yes
```

### `run`

```
$ hozo jobs run nightly-rpool
▶  Running job: nightly-rpool
[hozo] Sending Wake-on-LAN packet to AA:BB:CC:DD:EE:FF
[hozo] WoL packet sent
[hozo] Waiting for SSH on backup-box.tailnet.ts.net:22
[hozo] SSH up after 3.2s
[hozo] Issuing read kick to /dev/sdb
[hozo] Drive ready after 6.1s
[syncoid] Sending incremental rpool/data@hozo_2026-06-19 ... rpool/data@hozo_2026-06-20
[syncoid] 47% complete · 412 MiB/s · ETA 00:38
[syncoid] 89% complete · 405 MiB/s · ETA 00:08
[syncoid] Transfer complete · 6.74 GiB in 412.3s
[hozo] Listing remote snapshots: 47 found · latest matches local
[hozo] ntfy.sh/hozo-backups-demo ← ✓ nightly-rpool ok (47 snaps)
[hozo] ssh root@backup-box.tailnet.ts.net 'shutdown -h now'
✓  Job 'nightly-rpool' completed in 412.3s (47 remote snapshot(s))
```

(Color `[syncoid]` lines accent (cyan), `[hozo]` slate-default, the `✓`
line `ok` (green). The `▶ Running job` line should be `accent`.)

### `status`

```
$ hozo status --job nightly-rpool
Checking SSH on backup-box.tailnet.ts.net…

── Uptime ──────────
 08:42:14 up 3 min,  1 user,  load average: 0.21, 0.18, 0.09

── ZPool list ──────────
NAME     SIZE  ALLOC   FREE  CKPOINT  EXPANDSZ   FRAG    CAP  DEDUP    HEALTH  ALTROOT
backup  3.62T  1.94T  1.68T        -         -    11%    53%  1.00x    ONLINE  -

── ZPool health ──────────
all pools are healthy
```

### `wake`

```
$ hozo wake nightly-rpool
WOL packet sent to AA:BB:CC:DD:EE:FF (backup-box.tailnet.ts.net)
```

### `shutdown`

```
$ hozo shutdown nightly-rpool
Sending shutdown to backup-box.tailnet.ts.net…
Shutdown command sent.
```

## Acceptance criteria

- `/cli/` loads with the terminal visible and the `help` scenario
  auto-playing.
- Clicking a sidebar scenario switches the terminal to that scenario
  and auto-plays from the start.
- "Next" advances; "Replay" restarts; "Skip animation" fast-forwards.
- The blinking cursor renders at the end of typing and after each line.
- On 375px viewport, the layout stacks: terminal full-width on top,
  sidebar (scenario list) below. Terminal does not overflow horizontally.
- Output is correctly colored (cyan for `[syncoid]`, green for `✓`,
  etc.).
- No console errors.

## Verification commands

```bash
cd ~/Vaults/sageframe-dharma/hozo-demo
npx @11ty/eleventy
test -f _site/cli/index.html
test -f _site/assets/js/terminal.js
grep -q "hozoLoadScenario" _site/assets/js/terminal.js
grep -q "hozo jobs run nightly-rpool" _site/cli/index.html
```

## Commit

`feat(cli): animated terminal walkthrough of the Hōzō CLI`
