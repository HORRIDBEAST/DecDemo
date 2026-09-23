# ROLLBACK.md — Post-hackathon checklist

This file tracks every security/privacy default we turned off or loosened for the
Android-wrapper hackathon push, and exactly how to put it back. Work through this
checklist after the hackathon is over. Each entry has a **Why we changed it** (so
future-you isn't guessing) and **How to revert it**.

Entries are added here automatically whenever a session makes this kind of change —
see "Standing rule" at the bottom.

---

## 1. Vercel — Deployment Protection disabled for Preview deployments

- **Changed:** 2026-09-23
- **Why:** the `android-migration` branch's preview deployment was behind Vercel
  Authentication (SSO). That's fine in a desktop browser (already logged into
  Vercel), but the Capacitor WebView on the phone has no Vercel session, so it got
  stuck on the `vercel.com/sso-api` login wall instead of loading the app. Turning
  off protection for previews let the phone load the preview URL directly.
- **Risk while off:** anyone with a preview URL (e.g. `dec-demo-git-<branch>-*.vercel.app`)
  can open it without logging in. Preview URLs aren't linked from anywhere public,
  but they're not secret either — if one leaks, anyone can view whatever branch it
  points to.
- **Revert steps:**
  1. Open the `dec-demo` project on vercel.com.
  2. **Settings → Deployment Protection**.
  3. Under **Vercel Authentication**, turn protection back on (or set it back to
     whatever scope it had before — check if it covered Preview + Production or
     just Production).
  4. Save.

---

## 2. Phone — Developer options enabled

- **Changed:** 2026-09-21 (Session 1/2 testing)
- **Why:** required to install and debug the ClaimLens APK outside the Play Store,
  and to see the device in `adb devices`.
- **Risk while on:** exposes extra settings (USB debugging, mock locations, etc.)
  that a normal user wouldn't have access to. Low risk for a personal device, but
  it's still an elevated-access mode not meant to be left on indefinitely.
- **Revert steps:**
  1. **Settings → About phone / Additional settings → Developer options**.
  2. Toggle **Developer options** itself off at the top of that screen (this also
     turns off everything inside it, including items 3–5 below, but list them
     separately in case the phone requires disabling them individually first).

## 3. Phone — USB debugging enabled

- **Changed:** 2026-09-21
- **Why:** required for `adb` (Android Debug Bridge) to see the phone and install
  the debug APK over USB.
- **Risk while on:** a connected computer can install/uninstall apps, read logs,
  and run shell commands on the phone without further confirmation once
  authorized. Don't plug the phone into an untrusted computer while this is on.
- **Revert steps:**
  1. **Settings → Developer options → USB debugging** → turn off.
  2. Also **Settings → Developer options → Revoke USB debugging authorizations**
     — clears the list of computers the phone trusts, including this laptop.

## 4. Phone — "Install via USB" / "USB debugging (Security settings)" enabled

- **Changed:** 2026-09-23 (after the first `adb install` failed with
  `INSTALL_FAILED_USER_RESTRICTED` on this MIUI/HyperOS device)
- **Why:** this phone (Xiaomi/Redmi/POCO, `klee_in`) blocks `adb install` unless
  this separate toggle is on — it's distinct from plain USB debugging and lets
  apps be installed from an unverified USB source without Play Protect review.
- **Risk while on:** any app pushed over USB installs without the phone's usual
  "unknown sources" friction or Play Protect scan. Meaningful risk if the phone
  is later plugged into a computer you don't fully trust.
- **Revert steps:**
  1. **Settings → Developer options → "USB debugging (Security settings)"** (or
     "Install via USB", wording varies by MIUI/HyperOS version) → turn off.

---

## 5. Render — CORS_ORIGINS widened on the backend (and, likely, the AI service)

- **Changed:** 2026-09-23
- **Why:** the `android-migration` branch's Vercel preview URL
  (`https://dec-demo-git-android-migration-horridbeasts-projects.vercel.app`) isn't
  in the backend's `CORS_ORIGINS` allowlist, only production's URL is. Confirmed via
  a direct CORS preflight test: the production origin gets an
  `access-control-allow-origin` header back, the preview origin gets none. That
  makes the browser silently block every request the preview site makes to the
  backend (`decdemo-2.onrender.com`) — including login, which is why sign-in
  appeared to succeed (the Supabase call itself has no CORS dependency) but never
  redirected to the dashboard (the follow-up call to our own backend was blocked,
  threw, and was swallowed by a silent `catch`).
- **Where:** `CORS_ORIGINS` env var on the **Backend** Render service
  (`decdemo-2`), and almost certainly the same var on the **AI-Agents** Render
  service too (used for the live agent-log stream — same allowlist pattern in
  `AI-Agents/src/main.py`, not yet hit in testing but will fail the same way).
- **Risk while widened:** any site running at that preview URL can make
  credentialed requests to the backend/AI service from a browser. Low risk here
  since only we control that Vercel branch, but it's still a real relaxation of
  the "only our known frontends may call this API" boundary.
- **Revert steps:**
  1. Render dashboard → **decdemo-2** (Backend) service → **Environment**.
  2. Edit `CORS_ORIGINS`, remove
     `https://dec-demo-git-android-migration-horridbeasts-projects.vercel.app`
     (and any other preview URLs added during this hackathon) from the
     comma-separated list, keeping the production URL and any real `localhost`
     dev entries.
  3. Save (Render redeploys automatically on env var change).
  4. Repeat steps 1–3 on the **AI-Agents** Render service if a preview origin was
     also added there.

## 6. Android app permissions requested (not a system setting, informational only)

- **Changed:** Session 2 — added `CAMERA`, `ACCESS_FINE_LOCATION`,
  `ACCESS_COARSE_LOCATION` to `front/android/app/src/main/AndroidManifest.xml`
  so the Camera and Geolocation Capacitor plugins work.
- **Not a rollback item:** this is normal app code, not a bypassed default. It
  ships in the app permanently and only takes effect if the app is installed.
  Listed here only for completeness — no action needed unless the Android
  wrapper itself is abandoned, in which case removing it is part of removing the
  `front/android/` folder, not a settings revert.

---

## Standing rule for future sessions

**From now on, whenever a session disables, weakens, or bypasses an existing
security/privacy default or policy — on the phone, in Vercel, in Supabase, on
this laptop, or anywhere else — add an entry to this file in the same session,
following the format above (Changed date, Why, Risk while on/off, Revert steps).**
Do this before telling the user the workaround is done, not as an afterthought.
