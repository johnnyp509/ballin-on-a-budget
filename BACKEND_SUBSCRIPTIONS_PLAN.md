# Backend, Accounts & Subscriptions — Implementation Plan

Last reviewed: 2026-10-30
Status: architecture proposal only; no provider, pricing, or payment flow has been activated.

## Goal

Move Ballin' on a Budget from a static deal catalogue to a dependable, managed product without losing the current fast-loading website, offline fallback, search, map, or 7-day verification discipline.

## Recommended architecture

### 1. Supabase for identity and application data

Use Supabase Auth + Postgres + Row Level Security (RLS) as the initial backend.

Why this is a practical fit:
- Managed authentication and database instead of building password storage and account recovery.
- Relational data for businesses, deals, schedules, verification events, saved deals, and subscription entitlements.
- RLS can enforce that ordinary users only access their own profile and saved items.
- Edge Functions can hold privileged integrations and webhook handling; secrets never ship in the app.

This is a recommendation, not a provider account or project already created.

### 2. RevenueCat for native subscription entitlements

For iOS and Android, use the stores' required in-app purchase flows, with RevenueCat as the subscription receipt/entitlement layer. The app should ask the entitlement service whether a user has access; it must never grant paid access based only on a localStorage flag or client-side setting.

Keep pricing, product identifiers, trial rules, and free-vs-paid feature boundaries configurable. Do not hardcode a price until the owner chooses it.

If web checkout is later needed, evaluate a separate compliant web payment flow and reconcile it server-side. Do not assume an App Store purchase can be replaced by a generic card checkout inside the native app.

### 3. Deal operations in Postgres

Proposed core tables:
- `businesses`: business identity, address, coordinates, website, status.
- `deals`: title, description, category, value, business, active state, start/end dates.
- `deal_schedules`: weekday/time windows and recurrence rules.
- `deal_verifications`: who checked it, when, source/evidence URL, outcome, notes.
- `profiles`: user profile and role metadata.
- `saved_deals`: user-to-deal relation, protected by RLS.
- `subscription_entitlements`: provider customer/user mapping and current entitlement state, updated only by trusted server webhook processing.
- `admin_audit_log`: actor, action, target, timestamp, and before/after summary.

Keep a stable deal ID when importing the current 373-record dataset. The JSON catalogue should remain exportable as a public read model/cache so the existing app shell can continue to load quickly.

## Deal accuracy rules

- Preserve the current 7-day verification freshness window.
- A deal older than the freshness window must not silently appear as freshly verified.
- Separate deal validity dates from verification timestamps; a recurring Monday special can still need a fresh confirmation.
- Store source/evidence and verification outcome for every check.
- Keep expired, paused, rejected, and unverified deals out of "Happening Now".
- Make all schedule calculations timezone-aware using the business's local timezone (Arizona businesses currently use America/Phoenix).
- Maintain the existing offline snapshot, but show its verification age honestly when offline.
- Require admin review for edits that change price, terms, days, or time windows.

## Security and privacy requirements

- Enable RLS on every user-owned table.
- Never expose the Supabase service-role key, RevenueCat secret, or webhook signing secrets in browser/native app code.
- Verify webhook signatures and make webhook processing idempotent.
- Treat subscription state from the server as authoritative; clients may cache it briefly but cannot write it.
- Provide account deletion and data export/deletion handling before public account launch.
- Collect location only when the user chooses the nearby/map feature; do not store precise location history by default.
- Document analytics, saved deals, location use, and payment processing accurately in the privacy policy.

## Suggested implementation sequence

1. Owner confirms backend/provider direction and whether the first release is free, paid, or freemium.
2. Create Supabase project and environments (development/staging/production); store credentials in GitHub Actions secrets and provider dashboards.
3. Add SQL migrations, RLS policies, seed/import script, and tests for the existing dataset.
4. Build admin-only deal management and verification workflow before opening public submissions.
5. Add authentication (sign-up, sign-in, password reset, account deletion) and saved-deal sync.
6. Add RevenueCat products/entitlements and server-side webhook synchronization after pricing and feature boundaries are approved.
7. Add monitoring, backups, audit trails, and end-to-end tests; migrate from static JSON only after parity checks pass.

## Decisions still required from the owner

- Free, paid, or freemium launch model; which features are paid.
- Subscription price and billing period(s); whether to offer a trial.
- Whether web users should be able to subscribe directly at launch.
- Who will have admin access and whether deal verification is owner-only initially.
- Whether users need social sign-in or email/password is sufficient.

## Explicit non-goals until approved

- No payment provider has been connected.
- No live user accounts or subscription charges have been created.
- No database or production data has been migrated.
- No secrets, credentials, or customer data are stored in this repository.
- No production branch or live website has been changed.
