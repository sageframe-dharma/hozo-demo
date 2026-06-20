/**
 * terminal.js — Hōzō CLI demo animation engine
 *
 * Exposes:
 *   window.hozoLoadScenario(name) — load a named scenario and auto-play it
 *
 * Event shapes:
 *   { type: "cmd",    text: "hozo jobs list" }
 *   { type: "out",    text: "...", cls: "ok"|"warn"|"err"|"dim"|"accent"|null, instant: bool }
 *   { type: "wait",   ms: 600 }
 *   { type: "prompt" }  — trailing blank prompt
 */

(function () {
  "use strict";

  // ── Scenario data ──────────────────────────────────────────────────────────

  const SCENARIOS = {
    help: [
      { type: "cmd", text: "hozo --help" },
      { type: "out", text: "Usage: hozo [OPTIONS] COMMAND [ARGS]..." },
      { type: "out", text: "" },
      { type: "out", text: "  Hōzō — Wake-on-demand ZFS backup orchestrator." },
      { type: "out", text: "" },
      { type: "out", text: "Options:" },
      { type: "out", text: "  --version              Show the version and exit.", cls: "dim" },
      { type: "out", text: "  -c, --config TEXT      Path to hozo config.yaml  [default: ~/.config/hozo/config.yaml]", cls: "dim" },
      { type: "out", text: "  -v, --verbose          Enable debug logging", cls: "dim" },
      { type: "out", text: "  --help                 Show this message and exit.", cls: "dim" },
      { type: "out", text: "" },
      { type: "out", text: "Commands:" },
      { type: "out", text: "  jobs      Manage and execute backup jobs.", cls: "accent" },
      { type: "out", text: "  serve     Start the Hōzō web UI and API server.", cls: "accent" },
      { type: "out", text: "  shutdown  SSH shutdown the remote host for the named job.", cls: "accent" },
      { type: "out", text: "  status    Show status of the remote backup host.", cls: "accent" },
      { type: "out", text: "  wake      Send a Wake-on-LAN packet for the named job's host.", cls: "accent" },
      { type: "prompt" },
    ],

    list: [
      { type: "cmd", text: "hozo jobs list" },
      { type: "out", text: "NAME                    SOURCE                  TARGET HOST                 SHUTDOWN" },
      { type: "out", text: "─────────────────────────────────────────────────────────────────────────────────────", cls: "dim" },
      { type: "out", text: "nightly-rpool           rpool/data              backup-box.tailnet.ts.net   yes", cls: "ok" },
      { type: "out", text: "weekly-photos           tank/photos             backup-box.tailnet.ts.net   yes", cls: "ok" },
      { type: "out", text: "monthly-archive         tank/archive            backup-box.tailnet.ts.net   yes", cls: "ok" },
      { type: "prompt" },
    ],

    run: [
      { type: "cmd", text: "hozo jobs run nightly-rpool" },
      { type: "out", text: "▶  Running job: nightly-rpool", cls: "accent" },
      { type: "out", text: "[hozo] Sending Wake-on-LAN packet to AA:BB:CC:DD:EE:FF" },
      { type: "out", text: "[hozo] WoL packet sent" },
      { type: "wait", ms: 400 },
      { type: "out", text: "[hozo] Waiting for SSH on backup-box.tailnet.ts.net:22" },
      { type: "wait", ms: 600 },
      { type: "out", text: "[hozo] SSH up after 3.2s" },
      { type: "out", text: "[hozo] Issuing read kick to /dev/sdb" },
      { type: "wait", ms: 400 },
      { type: "out", text: "[hozo] Drive ready after 6.1s" },
      { type: "out", text: "[syncoid] Sending incremental rpool/data@hozo_2026-06-19 ... rpool/data@hozo_2026-06-20", cls: "accent" },
      { type: "wait", ms: 500 },
      { type: "out", text: "[syncoid] 47% complete · 412 MiB/s · ETA 00:38", cls: "accent" },
      { type: "wait", ms: 500 },
      { type: "out", text: "[syncoid] 89% complete · 405 MiB/s · ETA 00:08", cls: "accent" },
      { type: "wait", ms: 400 },
      { type: "out", text: "[syncoid] Transfer complete · 6.74 GiB in 412.3s", cls: "accent" },
      { type: "out", text: "[hozo] Listing remote snapshots: 47 found · latest matches local" },
      { type: "out", text: "[hozo] ntfy.sh/hozo-backups-demo ← ✓ nightly-rpool ok (47 snaps)" },
      { type: "out", text: "[hozo] ssh root@backup-box.tailnet.ts.net 'shutdown -h now'" },
      { type: "out", text: "✓  Job 'nightly-rpool' completed in 412.3s (47 remote snapshot(s))", cls: "ok" },
      { type: "prompt" },
    ],

    status: [
      { type: "cmd", text: "hozo status --job nightly-rpool" },
      { type: "out", text: "Checking SSH on backup-box.tailnet.ts.net…" },
      { type: "wait", ms: 500 },
      { type: "out", text: "" },
      { type: "out", text: "── Uptime ──────────", cls: "dim" },
      { type: "out", text: " 08:42:14 up 3 min,  1 user,  load average: 0.21, 0.18, 0.09" },
      { type: "out", text: "" },
      { type: "out", text: "── ZPool list ──────────", cls: "dim" },
      { type: "out", text: "NAME     SIZE  ALLOC   FREE  CKPOINT  EXPANDSZ   FRAG    CAP  DEDUP    HEALTH  ALTROOT" },
      { type: "out", text: "backup  3.62T  1.94T  1.68T        -         -    11%    53%  1.00x    ONLINE  -", cls: "ok" },
      { type: "out", text: "" },
      { type: "out", text: "── ZPool health ──────────", cls: "dim" },
      { type: "out", text: "all pools are healthy", cls: "ok" },
      { type: "prompt" },
    ],

    wake: [
      { type: "cmd", text: "hozo wake nightly-rpool" },
      { type: "wait", ms: 300 },
      { type: "out", text: "WOL packet sent to AA:BB:CC:DD:EE:FF (backup-box.tailnet.ts.net)", cls: "ok" },
      { type: "prompt" },
    ],

    shutdown: [
      { type: "cmd", text: "hozo shutdown nightly-rpool" },
      { type: "wait", ms: 300 },
      { type: "out", text: "Sending shutdown to backup-box.tailnet.ts.net…" },
      { type: "wait", ms: 400 },
      { type: "out", text: "Shutdown command sent.", cls: "ok" },
      { type: "prompt" },
    ],
  };

  // ── State ──────────────────────────────────────────────────────────────────

  let currentScenario = null;   // name string
  let events = [];              // flat array of events for current scenario
  let eventIdx = 0;             // which event we're on
  let running = false;          // true while a timer/loop is pending
  let skipMode = false;         // true after "Skip animation" clicked
  let midEvent = false;         // true while a cmd is still typing

  // For cancellation
  let pendingTimer = null;

  // ── DOM refs (assigned after DOMContentLoaded) ─────────────────────────────

  let termBody = null;
  let btnNext = null;
  let btnReplay = null;
  let btnSkip = null;

  // ── Utilities ─────────────────────────────────────────────────────────────

  function cancelPending() {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    running = false;
  }

  function delay(ms) {
    return new Promise((resolve) => {
      if (skipMode) {
        resolve();
        return;
      }
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        resolve();
      }, ms);
    });
  }

  function appendLine(text, cls) {
    const line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = text;
    // Remove cursor from previous last element if present
    removeCursor();
    termBody.appendChild(line);
    scrollToBottom();
    return line;
  }

  function removeCursor() {
    const existing = termBody.querySelector(".cursor");
    if (existing) existing.remove();
  }

  function appendCursor() {
    removeCursor();
    const c = document.createElement("span");
    c.className = "cursor";
    c.setAttribute("aria-hidden", "true");
    // Attach to the last line, or to body
    const last = termBody.lastElementChild;
    if (last && last.tagName !== "BR") {
      last.appendChild(c);
    } else {
      termBody.appendChild(c);
    }
  }

  function scrollToBottom() {
    termBody.scrollTop = termBody.scrollHeight;
  }

  // ── Event rendering ────────────────────────────────────────────────────────

  async function renderCmd(text) {
    midEvent = true;
    const line = document.createElement("div");
    const promptSpan = document.createElement("span");
    promptSpan.className = "prompt";
    promptSpan.textContent = "~/hozo$ ";
    line.appendChild(promptSpan);

    const cmdSpan = document.createElement("span");
    line.appendChild(cmdSpan);
    removeCursor();
    termBody.appendChild(line);
    scrollToBottom();

    // Type chars one by one
    for (let i = 0; i < text.length; i++) {
      if (skipMode) {
        cmdSpan.textContent = text;
        break;
      }
      cmdSpan.textContent = text.slice(0, i + 1);
      scrollToBottom();
      const charDelay = 12 + Math.random() * 10;
      await delay(charDelay);
    }

    appendCursor();
    scrollToBottom();

    // Brief pause after typing, then newline pause
    await delay(skipMode ? 0 : 180);
    midEvent = false;
  }

  async function renderOut(text, cls, instant) {
    appendLine(text, cls || undefined);
    appendCursor();
    if (!instant && !skipMode) {
      await delay(80);
    }
  }

  async function renderWait(ms) {
    await delay(skipMode ? 0 : ms);
  }

  function renderPrompt() {
    const line = document.createElement("div");
    const promptSpan = document.createElement("span");
    promptSpan.className = "prompt";
    promptSpan.textContent = "~/hozo$ ";
    line.appendChild(promptSpan);
    removeCursor();
    termBody.appendChild(line);
    appendCursor();
    scrollToBottom();
  }

  // ── Main play loop ─────────────────────────────────────────────────────────

  async function playFrom(idx) {
    running = true;
    eventIdx = idx;

    while (eventIdx < events.length && running) {
      const ev = events[eventIdx];

      switch (ev.type) {
        case "cmd":
          await renderCmd(ev.text);
          break;
        case "out":
          await renderOut(ev.text, ev.cls, ev.instant);
          break;
        case "wait":
          await renderWait(ev.ms);
          break;
        case "prompt":
          renderPrompt();
          break;
      }

      if (!running) break;
      eventIdx++;
    }

    running = false;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function loadScenario(name) {
    if (!SCENARIOS[name]) {
      console.warn("hozoLoadScenario: unknown scenario", name);
      return;
    }
    cancelPending();
    running = false;
    skipMode = false;
    midEvent = false;
    currentScenario = name;
    events = SCENARIOS[name];
    eventIdx = 0;

    // Clear terminal body
    termBody.innerHTML = "";

    // Mark active sidebar button
    document.querySelectorAll("[data-scenario]").forEach((btn) => {
      const isActive = btn.dataset.scenario === name;
      btn.classList.toggle("bg-blue-700", isActive);
      btn.classList.toggle("text-white", isActive);
      btn.classList.toggle("bg-slate-700", !isActive);
      btn.classList.toggle("text-slate-300", !isActive);
    });

    // Auto-play
    playFrom(0);
  }

  window.hozoLoadScenario = loadScenario;

  // ── Button handlers ────────────────────────────────────────────────────────

  function handleNext() {
    if (midEvent || running) {
      // Fast-forward the current event: engage skip mode momentarily
      // The running loop will drain the current event instantly
      skipMode = true;
      // Let the loop finish the current event, then pause
      // Re-enable normal mode for subsequent events
      const restoreNormal = () => {
        skipMode = false;
        running = false;
        cancelPending();
      };
      // Give one tick for the loop to process
      setTimeout(restoreNormal, 0);
    } else {
      // Not running: advance to next event
      if (eventIdx < events.length) {
        skipMode = false;
        playFrom(eventIdx);
      }
    }
  }

  function handleReplay() {
    loadScenario(currentScenario);
  }

  function handleSkip() {
    skipMode = true;
    if (!running) {
      // Resume playing in skip mode
      playFrom(eventIdx);
    }
    // If already running, the loop will pick up skipMode on next iteration
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    termBody = document.getElementById("term-body");
    btnNext = document.getElementById("btn-next");
    btnReplay = document.getElementById("btn-replay");
    btnSkip = document.getElementById("btn-skip");

    if (!termBody) return; // Not on the CLI page

    btnNext.addEventListener("click", handleNext);
    btnReplay.addEventListener("click", handleReplay);
    btnSkip.addEventListener("click", handleSkip);

    // Sidebar scenario buttons
    document.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.addEventListener("click", () => {
        loadScenario(btn.dataset.scenario);
      });
    });

    // Auto-load the help scenario
    loadScenario("help");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
