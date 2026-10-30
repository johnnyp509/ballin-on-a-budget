# Ballin' on a Budget — Launch Readiness

Last reviewed: 2026-10-29
Working branch: `fix/service-worker-refresh-oct-2026`
Production branch: `main`

## Current state

The project is a static, installable-web-app foundation. It is not yet a native iOS or Android application and is not ready for paid public launch.

The working branch contains 373 deal records in `data/deals.json`, with an embedded fallback snapshot in `index.html`. The production `main` branch currently contains 295 records. PR #63 is the reviewed path for bringing the working branch changes to `main`; it is still open and unmerged.

## Verified launch blockers

- **App icons:** `manifest.webmanifest` and the Apple touch-icon link reference `icons/icon-192.png` and `icons/icon-512.png`, but neither file exists in the repository tree. Create and test real icon assets before relying on PWA installation or store packaging.
- **Native apps:** No iOS/Xcode or Android/Gradle project is present. A mobile packaging strategy and device testing are required.
- **Accounts:** The current app does not implement user registration, sign-in, account recovery, or server-side user identity.
- **Subscriptions:** No subscription entitlement or payment integration is present. Choose the monetization model and implement purchase, renewal, cancellation, restore-purchase, and access-control flows.
- **Privacy and terms:** Add public privacy and terms documents that accurately describe location use, analytics, saved-deal storage, account data, and payment handling before collecting account or payment data.
- **Deal operations:** The app fetches a static JSON file and uses a bundled fallback. A managed backend/admin workflow is needed for dependable deal updates, expiration, audit history, and verification.
- **Quality assurance:** Existing GitHub Actions checks validate data consistency and selected app behaviors. Add device/browser coverage, accessibility checks, install/update tests, and end-to-end tests for critical flows.

## Recommended release gates

### Gate 1 — Production web app
- Merge the reviewed app-refresh and data-integrity work into `main` after checking CI.
- Reconcile and publish the 373-record dataset; never overwrite newer production records without reviewing the diff.
- Add the missing icon files and test installation/update behavior on iOS Safari and Android Chrome.
- Remove or correct stale documentation and confirm the deployed GitHub Pages URL and custom-domain/HTTPS setup.

### Gate 2 — Paid product
- Decide what is free versus paid and document the subscription price and renewal terms.
- Select an account/backend and subscription architecture.
- Implement secure server-side entitlement checks; do not rely on a client-side flag to grant paid access.
- Publish privacy policy, terms, support contact, and account/data deletion instructions.
- Test purchase, restore, cancellation, expired subscription, and failed-payment states.

### Gate 3 — App stores
- Build and test iOS and Android packages.
- Prepare screenshots, descriptions, age/content ratings, support and privacy URLs.
- Complete Apple App Store Connect and Google Play Console setup.
- Run TestFlight and Play internal testing before public submission.
- Submit for review and address any reviewer feedback.

## Important operating rule

Do not describe the product as App Store-ready, subscription-ready, or production-updated until the corresponding release gate has actually passed. PR #63 is not merged, so its changes are not yet on `main`.
