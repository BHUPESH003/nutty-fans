# Admin Panel (Separate App, Same DB) — Feature Specification

This document defines the **Admin Panel** scope for NuttyFans. The Admin Panel will be a **separate application** that uses the **same database** (same Prisma schema / migrations), with privileged operations gated behind **strict RBAC** and full audit logging.

## Goals

- **Operational control**: review, moderation, support tooling, payouts oversight, fraud/risk, configuration.
- **Safety & compliance**: KYC/age verification oversight, DMCA, privacy requests, content policy enforcement.
- **Observability**: dashboards, health checks, job monitoring, incident response tooling.

## Non-goals

- Creator/fan product UI (handled by the main NuttyFans app).
- Direct DB writes outside defined workflows (all mutations go through Admin APIs with audit logs).

## Roles & Access Model (RBAC)

Define roles as **minimum**:

- **Super Admin**: full access, manages roles/permissions.
- **Admin**: broad access except security-critical operations (e.g., key rotation).
- **Support**: user support tooling (limited write), impersonation (optional), refunds (optional).
- **Moderator**: content moderation, reports, takedowns.
- **Finance**: payouts, ledger review, disputes, chargebacks, reconciliations.
- **Compliance**: KYC/age, legal requests, DMCA, bans/appeals.
- **Read-only Auditor**: view-only plus export access.

Permissions should be **resource-scoped** (e.g. `users.read`, `users.update_state`, `payouts.approve`, `content.takedown`).

## Global Requirements

- **Audit log**: every admin action writes to an immutable audit table (actor, action, target, before/after, IP, user agent).
- **Break-glass**: elevated actions require re-auth / 2FA / reason.
- **Rate limits**: admin endpoints protected.
- **Search**: fast global search (users/creators/posts/transactions).
- **Exports**: CSV export for lists with filters.
- **Impersonation (optional)**: support can “view as user” with explicit banner + audit.
- **Feature flags & config**: platform toggles via DB-backed config.

## Navigation / Pages

### Dashboard

- **KPIs**: active subs, GMV, wallet volume, payouts pending, abuse reports, live streams.
- **Alerts**: failing cron/jobs, webhook failures, payment provider issues, moderation backlog.
- **Recent actions**: audit trail stream.

### Users

- **User search**: by id, email, username, handle, phone, wallet id, payment ids.
- **User details**:
  - Account state (active/suspended/banned), email verified, age status
  - Wallet balance + ledger view
  - Purchases (PPV, bundles), subscriptions, tips, payouts history (if creator)
  - Devices/push subscriptions, notification prefs
  - Reports filed / reports against user
- **Actions**:
  - Suspend/ban/unban, force logout, reset MFA (if any)
  - Adjust wallet (credit/debit) with reason (high privilege)
  - Refund / reverse transactions (if supported by payment flow)

### Creators

- **Creator search**: handle, creatorId, userId, status.
- **Creator details**:
  - Profile content, category/tags, subscription pricing, verification status
  - Onboarding/KYC status + provider references
  - Earnings overview, payout settings state, commissions tier
  - Subscriber list overview + churn metrics
- **Actions**:
  - Verify/unverify creator
  - Force re-review, request additional docs
  - Override onboarding step (break-glass)
  - Adjust commission tier (break-glass)

### Moderation

- **Reports queue**: posts, comments, creators, users, live streams.
- **Post moderation**:
  - View media (with safety blur), tags, access level, PPV price
  - Takedown/restore, age-gate enforcement, mark NSFW, remove media
- **Comment moderation**: hide/unhide, delete, user warnings.
- **DM moderation (if applicable)**: conversation lookup (restricted).
- **DMCA / Legal**:
  - DMCA intake workflow, notice tracking, counter-notice tracking.
- **Actions**:
  - Strike system, warnings, shadow bans (optional)
  - Bulk takedown tools (high privilege)

### Content & Catalog

- **Posts**: list/filter by creator, tags, date, access level.
- **Tags**:
  - Create/merge/rename tags, manage slug collisions
  - Trending tags overview
- **Bundles**:
  - List bundles, status, price changes history
  - Force deactivate/restore bundle
- **PPV**:
  - PPV items overview, pricing outliers, purchase anomalies

### Live Streams (Mux)

- **Live sessions**: list active and recent streams, viewer count peaks.
- **Stream details**:
  - Creator, access level, entry price, playback restrictions
  - Mux stream id/playback id, health status, ingest metrics
- **Actions**:
  - Force end stream (moderation/abuse)
  - Gate stream (lock to subscribers/paid)
  - Remove recording access (if stored)

### Subscriptions

- **Subscription ledger**:
  - Active subs, cancellations, renewals, retries
  - Plan types (monthly/3/6/12)
- **Actions**:
  - Cancel on behalf of user (support)
  - Manual comp periods / credits (optional, high privilege)

### Payments & Wallet / Ledger

- **Wallet transactions**:
  - Filter by type: topup, ppv, bundle, tip, payout, adjustments
  - Drill into related entities (post/bundle/creator)
- **Reconciliation**:
  - Daily totals, discrepancies, provider settlement ids
- **Fraud / Risk**:
  - Velocity checks, suspicious patterns, chargeback flags
- **Actions**:
  - Manual adjustments (credit/debit) with reason + 4-eyes approval
  - Mark transactions as reviewed

### Payouts (Square)

- **Payout queue**:
  - Pending, processing, completed, failed
  - Creator payout readiness (KYC complete, connected account)
- **Payout run controls**:
  - Trigger payout job (break-glass)
  - Retry failed payouts with reason
- **Actions**:
  - Approve/hold/release payouts (if workflow enabled)
  - Export payout batch data

### Notifications (Web Push)

- **Push subscription stats**: opt-in %, delivery errors.
- **Templates (if supported)**: manage notification templates.
- **Test delivery**: send test push to admin’s own device.

### Settings / Configuration

- **Platform config**:
  - Commission tiers (4–16% strategy)
  - Feature flags (live enabled, bundles enabled, etc.)
  - Rate limit thresholds
- **Content policies**:
  - Allowed categories/tags
  - Moderation thresholds
- **System secrets**: view-only metadata, rotation workflows (no raw key display)

### Jobs / Cron / Ops

- **Job runs**:
  - Daily tasks, payouts, subscription renewals, scheduled posts
  - Status, duration, last run, logs
- **Actions**:
  - Re-run job (break-glass)
  - Inspect failures and retry units

## APIs (Admin App)

The Admin Panel should **not** call public `/api/*` routes intended for end-users. Create **admin-only route group** (example):

- `GET /api/admin/dashboard`
- `GET /api/admin/users?query=...`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/state`
- `GET /api/admin/creators?query=...`
- `PATCH /api/admin/creators/:id/verify`
- `GET /api/admin/moderation/reports`
- `POST /api/admin/moderation/takedown`
- `GET /api/admin/payments/transactions`
- `POST /api/admin/wallet/adjust`
- `GET /api/admin/payouts`
- `POST /api/admin/payouts/retry`
- `GET /api/admin/streams`
- `POST /api/admin/streams/:id/end`
- `GET /api/admin/jobs`
- `POST /api/admin/jobs/:name/run`

All admin APIs must enforce:

- `requireAdminSession()` middleware
- role/permission checks
- audit logging

## DB Tables / Entities Touched (High-Level)

Admin Panel will primarily read/mutate these areas (names may vary in Prisma schema):

- **Users**: `User`, auth/session tables
- **Creators**: `CreatorProfile`, onboarding/KYC status, category selection
- **Content**: `Post`, `Media`, `Comment`, `Tag`, `PostTag`
- **Bundles**: `Bundle`, `BundleItem`, `BundlePurchase`
- **PPV**: `PpvPurchase` / PPV purchase table
- **Subscriptions**: `Subscription`, plan definitions (if stored)
- **Payments/Wallet**: wallet ledger/transactions tables
- **Payouts**: payout records + provider references
- **Live**: `LiveStream`, purchases/access table
- **Push**: `PushSubscription`, `UserNotificationSettings`
- **Ops**: cron/job run tables (if present)
- **Audit**: `AdminAuditLog` (to be added if not present)
- **RBAC**: `AdminUser`, `Role`, `Permission`, `RolePermission` (to be added if not present)

## UI/UX Notes

- Use **tables** with saved filters, column toggles, and CSV exports.
- Use **side panels** for entity details (user/creator/post) to avoid losing list context.
- Require **reason input** for destructive actions (ban, takedown, payout hold, wallet adjust).
- Provide **preview** for moderation actions (what changes, what user sees).

## Implementation Notes

- New Next.js app (or separate repo) can reuse:
  - Prisma schema + migrations
  - shared types package (recommended) rather than importing from main app
  - auth provider (NextAuth) but with admin-only login constraints
