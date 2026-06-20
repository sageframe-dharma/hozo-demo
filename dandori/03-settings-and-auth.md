# Dandori: Settings + auth pages

## Goal

Port the Settings page and the three WebAuthn auth pages (devices list,
login, register) into the demo site. All four are read-only in the demo
sense — submitting Settings shows a toast and redirects; the auth pages
demonstrate the WebAuthn flow visually without actually invoking
`navigator.credentials.*` (we want to tout the security model, not
prompt the visitor's actual passkey UI).

## Repository

`/Users/atmarcus/Vaults/sageframe-dharma/hozo-demo/`

## Source templates to port from

- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/settings.html`
- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/auth/devices.html`
- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/auth/login.html`
- `/Users/atmarcus/Vaults/sageframe-no-kaji-dev/hozo-sentinel/src/hozo/api/templates/auth/register.html`

Read those before writing. Demo must look identical (same palette, same
cards, same hint text) — only the form/JS handlers change.

## Files to create

- `src/demo/settings.njk` — permalink `/demo/settings/`
- `src/demo/auth/devices.njk` — permalink `/demo/auth/devices/`
- `src/demo/auth/login.njk` — permalink `/demo/auth/login/`
- `src/demo/auth/register.njk` — permalink `/demo/auth/register/`

## Pre-existing context

- Layout: `base.njk`.
- Data:
  - `settings` from `src/_data/settings.js` — ssh_timeout, ssh_user,
    rp_id, ntfy_topic, etc.
  - `devices` from `src/_data/devices.js` — array of 2 fake passkeys
    (MacBook Touch ID + YubiKey 5C NFC).
- Helpers: `hozoToast(msg, kind)`.

## Required changes — Settings

Port `settings.html` faithfully. Three cards: General (SSH defaults),
WebAuthn (RP ID), Notifications (ntfy/Pushover/SMTP). Pre-fill every
field from `settings`. The Pushover and SMTP sections stay collapsed
inside `<details>` like the original.

Submit handler (no real save):

```html
<script>
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    hozoToast("✓ Settings saved (demo)", "ok");
  });
</script>
```

Keep the "confirmNotificationClears" warning UX from the original —
copy that script over verbatim (with a guard so it doesn't block the
demo submit).

All `grid-cols-2`/`grid-cols-3` become `grid-cols-1 md:grid-cols-2` /
`grid-cols-1 sm:grid-cols-3` for mobile.

Tour steps (front matter):

```yaml
tourSteps:
  - selector: "input[name='rp_id']"
    title: "WebAuthn RP ID"
    body: "This is the hostname Hōzō binds passkeys to. Change it before registering your first device — after that, it's load-bearing."
  - selector: "input[name='ntfy_topic']"
    title: "Pick how you want to be paged"
    body: "ntfy.sh is the easiest — free, push-to-phone. Pushover and SMTP are also supported."
    next: "/demo/auth/devices/"
```

## Required changes — Devices page

Port `devices.html` literally. Show the two devices from the data file.
The Remove button:

```html
<button onclick="hozoToast('(demo) Would remove this passkey', 'warn'); return false;"
        class="btn-danger text-xs px-3 py-1.5 rounded text-white">
  Remove
</button>
```

**Make the bottom security note bigger and louder.** This is the place
to tout how secure Hōzō's auth model is. Replace the existing note
with a section that includes:

- A heading "🔐 Why passkeys only?"
- Three points (use a card with `border-l-4 border-green-500`):
  1. **No passwords.** Nothing to phish, nothing to leak in a breach,
     nothing to forget.
  2. **No shared secrets on the wire.** WebAuthn uses public-key
     cryptography — the private key never leaves your device.
  3. **Phishing-resistant by design.** A passkey registered for
     `hozo.tailnet.ts.net` will refuse to sign for any other origin.
     A look-alike domain cannot impersonate Hōzō to you.
- And keep the original "always keep 2 devices" recovery note.

Tour:

```yaml
tourSteps:
  - selector: "[data-add-device]"
    title: "Add a new device"
    body: "Hōzō supports laptops, phones, USB security keys — anything that speaks WebAuthn."
    next: "/demo/auth/login/"
```

(Give the + Add Device button `data-add-device`.)

## Required changes — Login page

Port `login.html`. The button must NOT call
`navigator.credentials.get` — instead, on click:

```js
document.getElementById('btn-login').addEventListener('click', () => {
  const btn = document.getElementById('btn-login');
  btn.disabled = true;
  btn.textContent = '⏳ Touch your security key…';
  setTimeout(() => {
    btn.textContent = '✓ Authenticated';
    btn.classList.add('badge-ok');
    setTimeout(() => { window.location.href = '/demo/dashboard/'; }, 600);
  }, 1400);
});
```

Treat `has_credentials` as true (since the demo always has 2 devices).
Below the button add a small explanatory line: "Hōzō uses passkeys —
no passwords. <a href='/demo/auth/devices/'>Why? →</a>"

## Required changes — Register page

Port `register.html`. Skip the bootstrap-mode RP-ID-save UI (always
treat `is_bootstrap = false` for the demo). Make the registration
button simulate the authenticator:

```js
document.getElementById('btn-register').addEventListener('click', () => {
  const btn = document.getElementById('btn-register');
  const ok = document.getElementById('reg-ok');
  btn.disabled = true;
  btn.textContent = '⏳ Touch your security key…';
  setTimeout(() => {
    btn.textContent = '✓ Registered';
    ok.classList.remove('hidden');
    setTimeout(() => { window.location.href = '/demo/auth/devices/'; }, 1000);
  }, 1500);
});
```

## Acceptance criteria

- `/demo/settings/` renders all three cards with pre-filled values.
  Submitting the form shows a green toast and does not navigate away.
- `/demo/auth/devices/` shows 2 devices, the new prominent "Why
  passkeys only?" panel with three points, and the original "always
  keep 2 devices" note.
- `/demo/auth/login/` button cycles through ⏳ → ✓ → navigates to
  `/demo/dashboard/`. No actual WebAuthn prompt appears.
- `/demo/auth/register/` button cycles through ⏳ → ✓ → navigates to
  `/demo/auth/devices/`. No actual WebAuthn prompt appears.
- All forms readable on a 375px viewport — fields stack to one column,
  no horizontal overflow.
- No console errors.

## Verification commands

```bash
cd ~/Vaults/sageframe-dharma/hozo-demo
npx @11ty/eleventy
test -f _site/demo/settings/index.html
test -f _site/demo/auth/devices/index.html
test -f _site/demo/auth/login/index.html
test -f _site/demo/auth/register/index.html
grep -q "Why passkeys" _site/demo/auth/devices/index.html
grep -q "RP ID" _site/demo/settings/index.html
```

## Commit

`feat(demo): settings and WebAuthn auth pages with security messaging`
