# CLAUDE.md — DecentralizedClaim / ClaimLens: Android Wrapper Task

## Context

This repo is a working, deployed multi-agent AI insurance-claim platform:
- `front/` — Next.js 14 frontend (Vercel-deployed, live at https://dec-demo.vercel.app/)
- `Backend/` — NestJS API + WebSocket gateway (port 3001)
- `AI-Agents/` — Python FastAPI + LangGraph multi-agent pipeline (port 8000)
- `Block/` — Solidity smart contract, deployed on **Monad Testnet** (chain ID 10143)

All of this already works and is deployed. **Do not modify Backend/, AI-Agents/, or Block/
in this task.** The only goal right now is wrapping `front/` in Capacitor so it installs
and runs as a native Android app on a physical iQOO 15, for an upcoming hackathon demo.

## Current goal (scope this tightly)

Turn the existing, already-deployed Next.js site into an installable Android APK using
Capacitor — a thin native WebView shell, not a rewrite. The WebView should point at the
**live Vercel URL**, not a local static export, so all existing Next.js API routes,
Supabase auth, and the NestJS/FastAPI backends keep working exactly as they do today.

**Explicitly out of scope — do not attempt these:**
- Real Snapdragon NPU / on-device ML via native Android ML Kit or Qualcomm SNPE.
  Instead, use a TensorFlow.js quality-check (blur/darkness detection) running inside
  the WebView itself. This is an honest "runs in-browser on-device" claim, not an NPU claim.
- Rewriting any UI in native Kotlin/Java.
- Any change to backend, AI agent, or smart contract code.
- Visual polish beyond what's needed to make camera/mic/GPS flows usable on a phone screen.

## Time budget — respect this

I have roughly **5 total hours**, split across 5 separate ~1-hour sessions on different
days, before a hackathon this coming weekend. Each session should end with something
concrete and testable — don't leave a session mid-refactor. Prioritize "it works" over
"it's clean." If something is faster to hardcode for the demo than to build properly,
say so explicitly and hardcode it.

## Session plan (for your own tracking — confirm which session we're in before starting)

1. **Capacitor init** — `npm install @capacitor/core @capacitor/cli @capacitor/android`
   in `front/`, `npx cap init`, `npx cap add android`. Configure `capacitor.config.ts`
   with `server.url` pointing at the deployed Vercel URL and `cleartext: false`,
   `androidScheme: 'https'`. Run `npx cap sync android`. Confirm the Android project
   opens and Gradle syncs in Android Studio — do not attempt a full run yet if time is short.

2. **Camera + GPS plugins** — Install `@capacitor/camera` and `@capacitor/geolocation`.
   In the claim-intake flow, branch on `Capacitor.isNativePlatform()`: use the Capacitor
   Camera plugin instead of `<input type="file" capture>`, and Capacitor Geolocation
   instead of the browser `navigator.geolocation` API, when running natively. Add the
   required permissions to `android/app/src/main/AndroidManifest.xml`
   (`CAMERA`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`). Build a debug APK
   (`cd android && ./gradlew assembleDebug`) and install via `adb install` on the
   physical iQOO 15 device (USB debugging must be enabled on the phone first).

3. **On-device smoke test** — Run the installed app on the iQOO 15 against the live
   deployment. Fix whatever actually breaks: likely candidates are Supabase auth session
   persistence inside the WebView, CORS errors from the NestJS backend if origins aren't
   allowlisted for the Capacitor scheme, and any mixed-content blocking. Do not
   preemptively fix things that aren't broken — confirm the actual error first.

4. **Mic permission + TF.js pre-check** — Capacitor's WebView does not auto-prompt for
   `getUserMedia` microphone access the way a normal mobile browser does. Add an
   `onPermissionRequest` override in `MainActivity.java`/`.kt` (or the equivalent
   Capacitor bridge hook) that grants `RESOURCE_AUDIO_CAPTURE` when requested, and add
   `RECORD_AUDIO` to the manifest. Confirm Vapi.ai voice intake actually works inside the
   wrapped app, not just in a normal mobile browser tab. Also wire in a lightweight
   TensorFlow.js script (runs client-side, no native dependency) that checks a captured
   photo for blur/darkness before upload, and surfaces a simple "retake photo" prompt if
   it fails the check.

5. **Final end-to-end pass + fallback check** — Full run-through on the iQOO 15: voice
   claim intake → photo capture with quality pre-check → GPS auto-tag → live agent
   status stream over WebSocket → final Monad Testnet transaction confirmation viewable
   in-app. Also re-confirm the PWA "Add to Home Screen" path (manifest.json + icons)
   still works as a fallback demo path, in case anything about the native build is flaky
   on the actual hackathon day.

## Ground truth to check before assuming something is broken

- Live deployment: https://dec-demo.vercel.app/
- Backend must be reachable from the phone's network at the hackathon venue — if the
  backend is only running on a laptop's localhost during the actual event (not deployed),
  the Capacitor `server.url` and any API base URLs need to point at that laptop's LAN IP,
  not `localhost`. Flag this explicitly if it comes up — it's an easy last-minute failure mode.
- Monad Testnet contract address and RPC are already configured in `AI-Agents/.env` and
  `Backend/.env` per the main README — this task should never need to touch those.
- Target test device: iQOO 15, physical hardware, connected via USB for `adb install`
  during development.

## Communication style for this task

Be blunt about time cost. If a step is going to take longer than the session allows,
say so up front and propose the smallest version that still demos convincingly, rather
than starting something that won't finish.