# Dandori: Break-glass restore flow

## Goal

Port the two-page restore flow: the confirmation page (with type-the-job-name
gate) and the restore-in-progress log page. This is the most dramatic UI in
the app and is worth showcasing prominently.

## Repository

`/Users/atmarcus/Vaults/sageframe-dharma/hozo-demo/`

## Source templates to port from

- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/restore_confirm.html`
- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/restore_log.html`

Read both before writing. Demo must match the original treatment —
the red alarm banner, the type-to-confirm gate, the red-bordered log
panel.

## Files to create

- `src/demo/restore.njk` — permalink `/demo/restore/`
- `src/demo/restore/log.njk` — permalink `/demo/restore/log/`

## Pre-existing context

- Layout: `base.njk`
- Data: `jobs` array; use `jobs[0]` (nightly-rpool) as the implicit
  "job being restored" throughout the demo flow.
- Helpers: `hozoToast(msg, kind)`.

## Required changes — restore confirm

Port `restore_confirm.html` for `jobs[0]`. Keep:

- The red alarm banner at top (`badge-err`, large, "⚠ Break-glass
  restore" + explanation about overwriting local data).
- The "Restore plan" card showing pull-from, write-to, flags, WoL.
- The type-to-confirm input ("Type `nightly-rpool` to confirm").
- The RESTORE button (`btn-danger`) and Cancel link.

Replace the form submit with JS:

```html
<form id="restore-form" class="card p-4 space-y-4">
  <!-- ...input... -->
</form>
<script>
  document.getElementById('restore-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const expected = '{{ jobs[0].name }}';
    const value = e.target.elements.confirm_name.value.trim();
    if (value !== expected) {
      hozoToast(`Type "${expected}" exactly to confirm.`, "err");
      return;
    }
    window.location.href = '/demo/restore/log/';
  });
</script>
```

Tour steps (front matter):

```yaml
tourSteps:
  - selector: "input[name='confirm_name']"
    title: "Type the job name to confirm"
    body: "There's no Undo on this. Hōzō makes you type the job name out — no muscle-memory clicks past the warning."
  - selector: "button[type='submit']"
    title: "Now hit RESTORE"
    body: "We'll show you the live log of the pull-back operation."
    next: "/demo/restore/log/"
```

## Required changes — restore log

Port `restore_log.html` for `jobs[0]`. On first load: no `result` (the
restore is "running"), red-bordered log box, "⏳ Restore in progress —
do not navigate away" banner.

Stream restore log lines into `#log-box` over ~8 seconds using
`setInterval` or a sequence of `setTimeout`s. After the last line,
flip the banner to the success state ("✓ Restore completed
successfully. Verify your data before relying on it.") and add a
"started/finished/duration" footer.

Lines to stream (color them: `[syncoid]` cyan, `[hozo]` slate, anything
with `ERROR` red, anything with `WARN` yellow):

```
[hozo] BREAK-GLASS RESTORE initiated — pulling backup/rpool-data → rpool/data
[hozo] Sending WoL to backup-box.tailnet.ts.net
[hozo] SSH up after 2.8s
[syncoid] Receiving rpool/data ← backup/rpool-data@hozo_latest
[syncoid]   force-delete: snapshots not on source will be removed locally
[syncoid] 14% complete · 380 MiB/s
[syncoid] 52% complete · 391 MiB/s
[syncoid] 88% complete · 402 MiB/s
[syncoid] Transfer complete · 6.74 GiB in 17.4s
[hozo] Verifying local snapshots match remote
[hozo] OK — 47 snapshots present on rpool/data
[hozo] Restore completed in 18.2s
```

After completion, also clear the "in progress" banner and show the
success one; both `result.success === true` styling.

## Acceptance criteria

- `/demo/restore/` shows the red alarm banner, the restore plan card,
  and the confirm input. Submitting an empty or wrong name shows an
  error toast and does not navigate.
- Submitting the correct job name ("nightly-rpool") navigates to
  `/demo/restore/log/`.
- `/demo/restore/log/` starts with "Restore in progress" + red-bordered
  empty log. Lines stream in over ~8 seconds. After completion, the
  banner flips to green success and a "Started / Finished / Duration"
  footer appears.
- Works on a 375px viewport without horizontal scroll.
- No console errors.

## Verification commands

```bash
cd ~/Vaults/sageframe-dharma/hozo-demo
npx @11ty/eleventy
test -f _site/demo/restore/index.html
test -f _site/demo/restore/log/index.html
grep -q "Break-glass" _site/demo/restore/index.html
grep -q "confirm_name" _site/demo/restore/index.html
grep -q "Restore in progress" _site/demo/restore/log/index.html
```

## Commit

`feat(demo): break-glass restore flow with type-to-confirm and live log`
