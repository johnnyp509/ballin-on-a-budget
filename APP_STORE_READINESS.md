# Ballin' on a Budget — Launch Readiness

Last reviewed: 2026-10-30
Working branch: `mobile/capacitor-foundation-oct-2026`
Production branch: `main`

## Current state

The project is a static, installable-web-app foundation with generated Capacitor 8 iOS and Android projects. GitHub Actions run #4 successfully generated both native projects, generated platform icons, synchronized Capacitor, built the Android debug app, built the iOS simulator app, and committed the native projects to this working branch. It has not yet been installed or tested on physical devices and is not ready for paid public launch.

The working branch contains 373 deal records in `data/deals.json`, with an embedded fallback snapshot in `index.html`. The production `main` branch currently contains 295 records. PR #63 is the reviewed path for bringing the app-refresh and data-integrity work to `main`; PR #64 adds the mobile packaging foundation on top of PR #63. Both remain review-only and unmerged.

## Data health check — 2026-10-30

- Canonical dataset: 373 deal records with 373 unique IDs.
- Embedded offline fallback: exact match with `data/deals.json`.
- Live-verification freshness: zero records older than the 7-day window.
- Map coverage: zero records missing coordinates.
- App smoke tests: inline scripts parse; search, category filters, schedule windows, and map-radius checks pass.
- Evidence: GitHub Actions run [40991709036](https://github.com/johnnyp509/ballin-on-a-budget/actions/runs/40991709036) passed both deal-data validation and app smoke tests.

## Verified launch blockers

- **Icons:** A branded SVG source lives at `assets/logo.svg`. The web build generates the 192px and 512px PWA PNG icons into `www/icons/`; the native icon generator has now generated Android and iOS icon/splash resources. Review the rendered icons on real device launchers before release.
- **Native apps:** Capacitor 8 projects now exist in `android/` and `ios/`. GitHub Actions run #4 (`40991024812`) passed native project generation, native icon generation/sync, Android `assembleDebug`, and the iOS simulator `xcodebuild`; commit `7262a19fd4107754124eb44bc823ac587ab3a905` saved the generated projects. These are unsigned development/simulator builds, not store-ready release binaries.
- **Accounts:** The current app does not implement user registration, sign-in, account recovery, or server-side user identity.
- **Subscriptions:** No subscription entitlement or payment integration is present. Choose the monetization model and implement purchase, renewal, cancellation, restore-purchase, and access-control flows.
- **Privacy and terms:** Add public privacy and terms documents that accurately describe location use, analytics, saved-deal storage, account data, and payment handling before collecting account or payment data.
- **Deal operations:** The app fetches a static JSON file and uses a bundled fallback. A managed backend/admin workflow is needed for dependable deal updates, expiration, audit history, and verification.
- **Quality assurance:** Existing GitHub Actions checks validate data consistency, selected app behaviors, and the mobile web bundle. Add device/browser coverage, accessibility checks, install/update tests, and end-to-end tests for critical flows.

## Recommended release gates

### Gate 1 — Production web app
- Merge the reviewed app-refresh and data-integrity work into `main` after checking CI.
- Reconcile and publish the 373-record dataset; never overwrite newer production records without reviewing the diff.
- Verify generated PWA icons and test installation/update behavior on iOS Safari and Android Chrome.
- Remove or correct stale documentation and confirm the deployed GitHub Pages URL and custom-domain/HTTPS setup.

### Gate 2 — Native mobile foundation
- Review the generated native projects and icon assets in the mobile branch.
- Install and test on physical iPhone and Android devices; check navigation, external links, map/location behavior, offline/update behavior, and safe-area/layout behavior.
- Review generated platform icons, permissions, app display name, package identifier, and native configuration.
- Test on physical iPhone and Android devices.

### Gate 3 — Paid product
- Decide what is free versus paid and document the subscription price and renewal terms.
- Select an account/backend and subscription architecture.
- Implement secure server-side entitlement checks; do not rely on a client-side flag to grant paid access.
- Publish privacy policy, terms, support contact, and account/data deletion instructions.
- Test purchase, restore, cancellation, expired subscription, and failed-payment states.

### Gate 4 — App stores
- Prepare screenshots, descriptions, age/content ratings, support and privacy URLs.
- Complete Apple App Store Connect and Google Play Console setup.
- Run TestFlight and Play internal testing before public submission.
- Submit for review and address any reviewer feedback.

## Important operating rule

Do not describe the product as App Store-ready, subscription-ready, or production-updated until the corresponding release gate has actually passed. PR #63 and PR #64 are not merged, so their changes are not yet on `main`.
