/* Hōzō demo glue — toast, scripted run-now flow, generic demo helpers.
   Loaded on every demo page; pages opt in to specific behaviors via data
   attributes and IDs. No backend; everything is in-memory. */

(function () {
  "use strict";

  // ── Toast ──────────────────────────────────────────────────────────────
  const toastEl = () => document.getElementById("toast");

  function toast(msg, kind = "info") {
    const el = toastEl();
    if (!el) return;
    const node = document.createElement("div");
    node.className = "toast-msg";
    if (kind === "ok") node.style.borderColor = "#166534";
    if (kind === "err") node.style.borderColor = "#7f1d1d";
    if (kind === "warn") node.style.borderColor = "#854d0e";
    node.textContent = msg;
    el.appendChild(node);
    setTimeout(() => node.remove(), 4000);
  }
  window.hozoToast = toast;

  // ── Kebab menu close-on-outside-click (carried over from base.html) ───
  document.addEventListener("click", (e) => {
    document.querySelectorAll("details.job-menu[open]").forEach((d) => {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll("details.job-menu[open]").forEach((d) => {
        d.removeAttribute("open");
      });
    }
  });

  // ── Scripted "Run Backup" timeline ─────────────────────────────────────
  // Animates a job card through the real status states the orchestrator
  // moves through. Calling code wires this to the ▶ Run Backup button.

  const RUN_STEPS = [
    { ms: 0,     status: "Sending WoL packet…",           kind: "running", log: "[hozo] Sending Wake-on-LAN packet to AA:BB:CC:DD:EE:FF" },
    { ms: 900,   status: "Waiting for SSH…",              kind: "running", log: "[hozo] Waiting for SSH on backup-box.tailnet.ts.net:22" },
    { ms: 2200,  status: "Spinning up backup drive…",     kind: "running", log: "[hozo] Issuing read kick to /dev/sdb (waiting up to 90s)" },
    { ms: 3500,  status: "syncoid: starting transfer…",   kind: "running", log: "[syncoid] Sending incremental rpool/data@hozo_2026-06-19 ... rpool/data@hozo_2026-06-20" },
    { ms: 5200,  status: "syncoid: 38% (412 MiB/s)…",     kind: "running", log: "[syncoid] 38% complete · 412 MiB/s · ETA 00:42" },
    { ms: 7000,  status: "syncoid: 81% (398 MiB/s)…",     kind: "running", log: "[syncoid] 81% complete · 398 MiB/s · ETA 00:14" },
    { ms: 8800,  status: "Verifying remote snapshots…",   kind: "running", log: "[hozo] Listing snapshots on remote: 47 found · latest matches local" },
    { ms: 9600,  status: "Sending notification…",         kind: "running", log: "[hozo] ntfy.sh/hozo-backups-demo ← ✓ nightly-rpool ok (47 snaps)" },
    { ms: 10200, status: "Shutting down remote host…",    kind: "running", log: "[hozo] ssh root@backup-box.tailnet.ts.net 'shutdown -h now'" },
    { ms: 11200, status: "✓ OK",                          kind: "ok",      log: "[hozo] Job 'nightly-rpool' completed in 11.2s (47 snapshots on remote)" },
  ];

  function runScriptedBackup(jobName, card) {
    if (!card) return;
    if (card.dataset.running === "1") {
      toast(`${jobName} is already running`, "warn");
      return;
    }
    card.dataset.running = "1";

    const badge = card.querySelector("[data-status-badge]");
    const logBox = card.querySelector("[data-inline-log]");
    if (logBox) {
      logBox.classList.remove("hidden");
      logBox.innerHTML = "";
    }

    toast(`Started: ${jobName}`, "ok");

    RUN_STEPS.forEach((step) => {
      setTimeout(() => {
        if (badge) {
          badge.className =
            "text-xs px-2 py-1 rounded " +
            (step.kind === "ok"
              ? "badge-ok"
              : step.kind === "err"
              ? "badge-err"
              : "badge-running");
          badge.textContent = step.status;
        }
        if (logBox) {
          const line = document.createElement("div");
          const cls =
            step.log.includes("[syncoid]")
              ? "text-cyan-300"
              : step.log.includes("ERROR")
              ? "text-red-400"
              : "text-slate-300";
          line.className = cls;
          line.textContent = step.log;
          logBox.appendChild(line);
          logBox.scrollTop = logBox.scrollHeight;
        }
        if (step.kind === "ok") {
          delete card.dataset.running;
          toast(`✓ ${jobName} finished in 11.2s`, "ok");
        }
      }, step.ms);
    });
  }
  window.hozoRunScripted = runScriptedBackup;

  // ── Wake / Shutdown toasts (purely cosmetic) ──────────────────────────
  window.hozoWake = function (jobName) {
    toast(`⚡ WoL packet sent to ${jobName} target`, "ok");
  };
  window.hozoShutdown = function (jobName) {
    if (!confirm(`Shutdown remote host for ${jobName}?`)) return;
    toast(`⏻ Shutdown command sent to ${jobName} target`, "ok");
  };
  window.hozoDelete = function (jobName) {
    if (!confirm(`Delete job ${jobName}? (Demo only — nothing happens.)`)) return;
    toast(`(demo) Job ${jobName} would be deleted`, "warn");
  };
})();
