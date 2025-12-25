## 09 — Docs → Code Feature Matrix (Draft)

**Source of truth:** `docs/01-BRD.md`, `docs/02-PRD.md`, `docs/05-API-SPECIFICATION.md`, `docs/06-UI-UX-BLUEPRINT.md`, `docs/07-PROJECT-TRACKER.md`

### Legend

- **Backend**: ✅ implemented (layered), 🟡 partial / needs refactor, ⬜ missing
- **Frontend**: ✅ implemented + linked, 🟡 exists but not linked / incomplete, ⬜ missing
- **Arch**: ✅ compliant, ❌ violates `/rules/CODEBASE_ARCHITECTURE_RULES.md`

### Global architecture compliance (highest priority)

| Area                                            | Status | Evidence                                                                                                                                                                               | Required fix                                                                                                        |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Route handlers doing DB access                  | ❌     | `src/app/api/public/creator/[handle]/route.ts`, `src/app/api/public/creator/[handle]/posts/route.ts`                                                                                   | Move DB reads into repository/service; route calls one controller                                                   |
| Inline `fetch('/api/...')` in client components | ❌     | `src/components/posts/PostForm.tsx`, `src/app/(creator)/creator/posts/new/page.tsx`, `src/components/containers/creator/CreatorDashboardContainer.tsx`, multiple onboarding containers | Replace with `apiClient` methods + keep UI components dumb                                                          |
| DB/service access inside `app/` pages           | ❌     | `src/app/subscriptions/page.tsx` imports `SubscriptionService` directly                                                                                                                | Convert to client/container fetching via `apiClient` (or a server-safe facade that does not touch DB inside `app/`) |
| UI uses `alert()` instead of standard toast     | ❌     | `src/components/posts/PostForm.tsx`, `src/app/(creator)/creator/posts/new/page.tsx`                                                                                                    | Replace with standardized toast or UI inline error state                                                            |

---

## Feature matrix (module-level)

| Module                                        | Priority (docs) | Backend | Frontend | Notes                                                                                         |
| --------------------------------------------- | --------------- | ------- | -------- | --------------------------------------------------------------------------------------------- |
| Auth (register/login/logout/verify/reset)     | P0              | ✅      | ✅       | Confirm no remaining inline fetch patterns and UX parity                                      |
| Age gate / age verification                   | P0              | ✅      | ✅       | Verify UX flow matches blueprint                                                              |
| User profile (self + public)                  | P1/P0           | ✅      | ✅       | Needs full audit vs UI/UX blueprint                                                           |
| Creator onboarding + KYC                      | P0              | ✅      | ✅       | Provider mismatch in PRD (Jumio/Onfido) vs current (Veriff) → confirm intended                |
| Creator public profile (view)                 | P0              | 🟡      | ✅       | Works, but public API routes need layered refactor                                            |
| Posts CRUD (creator)                          | P0              | ✅      | 🟡       | Post creation UI exists; `PostForm` violates API client rule                                  |
| Media upload/processing                       | P0              | ✅      | 🟡       | FE uses inline fetch; align with apiClient; keep direct S3 PUT outside apiClient if needed    |
| Feed (for-you / following)                    | P0              | ✅      | ✅       | Verify explore filtering and NSFW controls                                                    |
| Explore (categories/trending/featured/search) | P0              | ✅      | ✅       | Tag browsing missing                                                                          |
| Reels                                         | P1              | ✅      | ✅       | Verify UX parity                                                                              |
| Messaging (conversations/messages/paid/PPV)   | P0/P1           | ✅      | ✅       | Realtime stream/hydration needs QA pass                                                       |
| Notifications (in-app + email)                | P0              | ✅      | ✅       | Web push endpoints exist; UX for opt-in/preferences needs audit                               |
| Wallet (balance/topup/transactions)           | P0              | ✅      | ✅       | Ensure checkout redirect + responsive tables verified                                         |
| Subscriptions (subscribe + manage)            | P0              | ✅      | 🟡       | Subscribe on creator profile is wired; subscription management UX needs full pass             |
| PPV purchases (posts/messages)                | P0              | ✅      | 🟡       | Purchase endpoints exist; “PPV library/history” UX missing                                    |
| Tips                                          | P0              | ✅      | 🟡       | Tip endpoint exists; tip UI added to creator profile; tip goals UX missing                    |
| Tags / hashtags                               | P0 (tracker)    | ⬜      | ⬜       | Schema exists (`Tag`, `PostTag`), but no API/UI for tags yet                                  |
| Content bundles (bundle store + purchase)     | P1              | ⬜      | ⬜       | Schema exists (`Bundle*`), but no backend routes/UI for bundles yet                           |
| Live streaming (Mux Live)                     | P1              | ⬜      | ⬜       | Needs full implementation + env vars/webhooks planning                                        |
| Admin panel / moderation                      | P0 (PRD)        | 🟡      | ⬜       | Admin tables exist; UI not present in this web app; needs explicit decision on scope/location |

---

## Next implementation wave (proposal)

1. **Architecture compliance sweep** (no new features until rules are enforced).
2. **Tags**: create/update posts with tags + browse/search tags + filter feeds by tag.
3. **PPV library**: purchases page + re-access flows.
4. **Subscription management**: manage subscriptions page UX.
5. **Bundles**: creator bundle management + fan purchase + access.
6. **Mux Live**: creator go-live + fan watch + paywall gating.
7. **Web Push UX**: opt-in prompts + preferences + verify delivery hooks.
