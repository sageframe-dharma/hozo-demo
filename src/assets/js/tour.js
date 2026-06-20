/* Hōzō walkthrough tour. Each page declares its tour steps via:

     <script type="application/json" id="tour-steps">
       [{ "selector": "#run-btn", "title": "...", "body": "...", "next": "/demo/jobs/log/" }, ...]
     </script>

   Tour state lives in localStorage under "hozo.tour":
     { active: bool, page: string, stepIdx: number }

   On first visit anywhere under /demo/ the tour auto-starts at /demo/.
   "Skip tour" disables it for the session (and persists).  */

(function () {
  "use strict";

  const KEY = "hozo.tour";
  const SEEN_KEY = "hozo.tour.seen";

  function readState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (_) { return {}; }
  }
  function writeState(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {}
  }

  function loadSteps() {
    const el = document.getElementById("tour-steps");
    if (!el) return [];
    try { return JSON.parse(el.textContent) || []; }
    catch (_) { return []; }
  }

  let overlay, spotlight, popover, currentSteps = [], idx = 0;

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "tour-overlay";
    spotlight = document.createElement("div");
    spotlight.className = "tour-spotlight";
    popover = document.createElement("div");
    popover.className = "tour-popover";
    overlay.appendChild(spotlight);
    document.body.appendChild(overlay);
    document.body.appendChild(popover);
  }

  function positionFor(target) {
    const r = target.getBoundingClientRect();
    const pad = 4;

    // Spotlight is a child of the position:fixed overlay → viewport-relative.
    // Do NOT add scrollY/scrollX here.
    spotlight.style.top    = `${r.top - pad}px`;
    spotlight.style.left   = `${r.left - pad}px`;
    spotlight.style.width  = `${r.width + pad * 2}px`;
    spotlight.style.height = `${r.height + pad * 2}px`;

    // Popover is attached to <body> → document-relative. Add scrollY/scrollX.
    const popW = 320;
    const popH = popover.offsetHeight || 180;
    const gap = 24;
    let top = r.bottom + gap + window.scrollY;
    let left = r.left + window.scrollX;
    if (left + popW > window.scrollX + window.innerWidth - 16) {
      left = window.scrollX + window.innerWidth - popW - 16;
    }
    if (left < window.scrollX + 16) left = window.scrollX + 16;
    if (top + popH > window.scrollY + window.innerHeight - 16) {
      top = r.top - popH - gap + window.scrollY;
    }
    popover.style.top = `${Math.max(top, window.scrollY + 16)}px`;
    popover.style.left = `${left}px`;
    requestAnimationFrame(() => popover.classList.add("visible"));
  }

  function renderStep() {
    if (!currentSteps[idx]) return endTour();
    const step = currentSteps[idx];
    const target = step.selector ? document.querySelector(step.selector) : null;
    if (!target) {
      // Skip silently if the selector isn't on this page.
      idx++;
      return renderStep();
    }

    // Fill the popover for THIS step (must happen before the visibility flip).
    popover.innerHTML = `
      <h3>${escapeHTML(step.title || "")}</h3>
      <p>${step.body || ""}</p>
      <div class="tour-controls">
        <span class="tour-step">Step ${idx + 1} of ${currentSteps.length}</span>
        <span>
          <button class="tour-skip" type="button" data-tour-skip>Skip tour</button>
          <button class="tour-next" type="button" data-tour-next>${
            step.next ? "Take me there →" : idx === currentSteps.length - 1 ? "Done" : "Next"
          }</button>
        </span>
      </div>
    `;
    overlay.classList.add("active");

    popover.querySelector("[data-tour-skip]").onclick = () => {
      try { localStorage.setItem(SEEN_KEY, "skipped"); } catch (_) {}
      endTour();
    };
    popover.querySelector("[data-tour-next]").onclick = () => {
      if (step.next) {
        writeState({ active: true, page: step.next, stepIdx: 0 });
        window.location.href = step.next;
        return;
      }
      idx++;
      if (idx >= currentSteps.length) return endTour();
      renderStep();
    };

    // Fade out while we (maybe) scroll; reposition once scroll settles.
    popover.classList.remove("visible");

    const margin = 80;
    const r0 = target.getBoundingClientRect();
    const popH = 220;
    const inView = r0.top >= margin && r0.bottom + 24 + popH <= window.innerHeight - margin;

    if (inView) {
      requestAnimationFrame(() => positionFor(target));
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      waitForScrollEnd(() => positionFor(target));
    }
  }

  // Resolve when the window stops scrolling, or after a hard cap.
  function waitForScrollEnd(cb) {
    let lastY = window.scrollY;
    let stable = 0;
    const hardCap = setTimeout(() => {
      clearInterval(interval);
      cb();
    }, 900);
    const interval = setInterval(() => {
      if (window.scrollY === lastY) {
        stable += 1;
        if (stable >= 3) {
          clearInterval(interval);
          clearTimeout(hardCap);
          cb();
        }
      } else {
        lastY = window.scrollY;
        stable = 0;
      }
    }, 60);
  }

  function endTour() {
    if (overlay) overlay.classList.remove("active");
    if (popover) popover.style.display = "none";
    writeState({ active: false });
    try { localStorage.setItem(SEEN_KEY, "done"); } catch (_) {}
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function start() {
    currentSteps = loadSteps();
    if (!currentSteps.length) return;
    idx = 0;
    if (!overlay) buildOverlay();
    popover.style.display = "block";
    writeState({ active: true, page: window.location.pathname, stepIdx: 0 });
    renderStep();
  }
  window.hozoStartTour = start;

  // Auto-start when arriving on a page mid-tour, or on first visit to
  // /demo/ if the user has never skipped/completed the tour.
  document.addEventListener("DOMContentLoaded", () => {
    const state = readState();
    const seen = (() => { try { return localStorage.getItem(SEEN_KEY); } catch (_) { return null; } })();
    const onDemoIndex = window.location.pathname.replace(/\/+$/, "") === "/demo";

    if (state.active && state.page && window.location.pathname.indexOf(state.page) === 0) {
      start();
      return;
    }
    if (onDemoIndex && !seen) {
      start();
    }
  });

  // Manual triggers anywhere.
  document.addEventListener("click", (e) => {
    if (e.target.matches("[data-start-tour]")) {
      e.preventDefault();
      try { localStorage.removeItem(SEEN_KEY); } catch (_) {}
      writeState({ active: true });
      start();
    }
  });

  // Reposition on resize/scroll while active.
  window.addEventListener("resize", () => {
    const step = currentSteps[idx];
    if (!step || !overlay.classList.contains("active")) return;
    const target = step.selector ? document.querySelector(step.selector) : null;
    if (target) positionFor(target);
  });
})();
