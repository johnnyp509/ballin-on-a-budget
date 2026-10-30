# Physical Device Test Checklist

Last updated: 2026-10-30
Status: not yet executed; CI simulator/debug builds do not replace real-device testing.

## Test devices and build record

Record for each test session:
- Device model and OS version
- App branch/commit and build date
- Tester and date
- Pass/fail, notes, and screenshots for each failed item

## Install and launch

- [ ] Install a fresh build on a physical iPhone.
- [ ] Install a fresh build on a physical Android phone.
- [ ] Confirm app name and launcher icon are correct.
- [ ] Confirm splash screen is correctly scaled in portrait and landscape.
- [ ] Confirm first launch opens without a blank screen, crash, or browser error.
- [ ] Force-close and relaunch; confirm the app still loads.

## Core deal discovery

- [ ] Home screen loads and deal cards render.
- [ ] Search finds a known business and a known deal.
- [ ] Search with no matches gives a clear empty state.
- [ ] Category filters work and can be cleared.
- [ ] Day/time schedule filters behave correctly for Arizona local time.
- [ ] "Happening Now" excludes expired, paused, and stale/unverified deals.
- [ ] Deal detail text, terms, business name, and address are readable.
- [ ] Saved deals persist after force-close/relaunch.
- [ ] Saved deals remain usable when offline if present in the local cache.

## Map and location

- [ ] Map renders and pins are tappable.
- [ ] Selecting a pin highlights the matching deal.
- [ ] Map radius/filter behavior is correct.
- [ ] Before location is requested, the app does not prompt unexpectedly.
- [ ] Choosing "My Location" triggers the platform permission prompt.
- [ ] Allowing permission centers the map on the device's location.
- [ ] Denying permission produces a useful explanation and leaves manual browsing usable.
- [ ] Re-enabling permission in OS settings restores the feature.
- [ ] Confirm location is foreground-only and no background tracking occurs.

## Navigation, layout, and accessibility

- [ ] Bottom navigation switches screens correctly.
- [ ] Back navigation works from deal details and dialogs.
- [ ] No content is hidden behind the status bar, home indicator, or bottom navigation.
- [ ] Text remains legible at larger system font settings.
- [ ] Buttons and touch targets are usable one-handed.
- [ ] Keyboard does not cover search input or important controls.
- [ ] External links open safely and return to the app.

## Offline, network, and update behavior

- [ ] App opens with network disabled and uses the bundled deal fallback.
- [ ] Offline state does not falsely label old deals as freshly verified.
- [ ] Restoring network recovers without requiring reinstall.
- [ ] A new web bundle/service worker update becomes available and installs cleanly.
- [ ] Relaunch after update shows the new version and current deal data.

## Release blockers / sign-off

- [ ] No crash or critical navigation failure on either platform.
- [ ] No false "verified" or "happening now" state.
- [ ] Location prompt matches the user-initiated action and platform disclosure.
- [ ] No production payment/account flow is shown before it is implemented and tested.
- [ ] All failed cases have a tracked issue and retest.

Do not mark this checklist complete based on GitHub Actions alone. Android debug and iOS simulator builds prove compilation, not real-device permissions, rendering, install/update behavior, or store compliance.
