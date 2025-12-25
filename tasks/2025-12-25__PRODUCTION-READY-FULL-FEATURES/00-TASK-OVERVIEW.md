## Task: Production-ready full-feature completion (P0–P4)

> **Owner (per contract): Human**
>
> This file is drafted by an agent for review. Please edit/confirm scope, priorities, and success criteria, then reply **“Approved”**.

### Problem statement

- The app must be **production-ready** and **feature-complete** according to the canonical docs in `docs/` (BRD/PRD/Architecture/API/UI-UX/Tracker).
- The app must also be **fully compliant** with repo rules (`/rules/*`), especially layered architecture, single API client usage, and UI/UX consistency.

### Business goal

- Deliver a complete web product that can compete with major market players by implementing **all features specified in docs** (P0–P4) and ensuring polish, reliability, and consistency.

### Scope (in-scope)

- **Docs→Code parity**: For every feature described in `docs/01-BRD.md`, `docs/02-PRD.md`, `docs/05-API-SPECIFICATION.md`, `docs/06-UI-UX-BLUEPRINT.md`, `docs/07-PROJECT-TRACKER.md`:
  - Backend endpoints exist and follow **Route → Controller → Service → Repository**
  - Frontend UI exists and is linked from navigation/user flows
  - Error/success handling is centralized via `src/services/apiClient.ts`
  - UX matches blueprint (loading, errors, empty states, responsiveness)
- **Architecture compliance refactors** where the code currently violates rules (e.g., DB access in route handlers).
- **Mux Live** implementation for live streaming (per your direction).
- **Web Push only** for push notifications (per your direction).

### Out of scope (explicit)

- Native mobile apps (iOS/Android) beyond PWA/web.
- Admin panel as a separate app (unless docs explicitly require it inside this repo).

### Success criteria

- Feature matrix is **100% green** (Implemented + linked + tested) for all doc-defined features P0–P4.
- No architecture rule violations (spot-check + static scans):
  - No DB access in route handlers
  - No inline `fetch` outside `src/services/apiClient.ts`
  - No duplicated cross-cutting logic (moved to middleware/shared)
- TypeScript + ESLint clean for touched files.
- QA plan exists and can be executed end-to-end on QA environment.

### Dependencies / constraints

- Must follow `/rules/*` and existing doc contracts.
- All breaking changes require explicit approval and must be logged in `07-DECISIONS.md`.
- Payment providers: existing Square flow for wallet topups; live streaming: **Mux Live**; push: **Web Push only**.
