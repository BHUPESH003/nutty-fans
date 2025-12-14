# 📐 CODEBASE_ARCHITECTURE_RULES.md

**NuttyFans – Google-Grade Next.js Codebase Contract**

> **Status:** Canonical
> **Editable by:** Human owner only
> **Applies to:** All humans, all agents, all code

---

## 1. Architecture Philosophy (Non-Negotiable)

This codebase follows **large-organization architecture principles**, inspired by:

- Google (layered ownership, policy vs mechanism)
- Vercel (Next.js App Router best practices)
- Stripe (API client & backend orchestration)
- Meta/Airbnb (frontend separation of concerns)

### Core beliefs:

- **Consistency > cleverness**
- **Reuse > duplication**
- **Explicit layers > implicit behavior**
- **Boring code scales**
- **Code is read more than written**

Any violation of these principles must go through an **escape hatch** (Section 9).

---

## 2. Mandatory Layered Architecture (Hard Rule)

### 2.1 Backend Layers (Strict)

Every backend feature must follow this flow:

```
Route Handler
   ↓
Controller
   ↓
Service
   ↓
Repository (DB / external systems)
```

### Responsibilities:

| Layer         | Allowed                         | Forbidden             |
| ------------- | ------------------------------- | --------------------- |
| Route Handler | Wiring, HTTP mapping            | Business logic        |
| Controller    | Orchestration, validation calls | DB access             |
| Service       | Business logic                  | HTTP, request parsing |
| Repository    | DB / external APIs              | Business rules        |

> **No layer may skip another layer.**

---

## 3. Next.js App Router Rules (Vercel-Aligned)

### 3.1 `app/` Directory Rules

Allowed in `app/`:

- Page composition
- Layouts
- Metadata
- Route handlers (`route.ts`)

Forbidden in `app/`:

- Business logic
- DB access
- API client logic
- Complex validation

### 3.2 Route Handlers (`app/api/**/route.ts`)

Route handlers must:

- Call **exactly one controller**
- Contain no logic beyond:
  - Parsing request
  - Returning response
  - Calling middleware

❌ Forbidden:

```ts
// ❌ NOT ALLOWED
export async function POST(req) {
  const body = await req.json();
  await db.user.create(body);
}
```

✅ Required:

```ts
export async function POST(req) {
  return userController.create(req);
}
```

---

## 4. Middleware Is Mandatory, Not Optional

### 4.1 Cross-Cutting Concerns

The following **must never** be implemented inside routes or services:

- Authentication
- Authorization
- Rate limiting
- Request logging
- Input sanitization
- Feature flags

These **must** live in:

```
middleware.ts
or
src/lib/middleware/*
```

### 4.2 Rule

If the same logic appears in more than **one route**, it **must be middleware**.

---

## 5. Frontend Architecture (Meta / Airbnb Style)

### 5.1 Component Types (Strict)

Components fall into exactly **two categories**:

#### 1️⃣ UI Components (Dumb)

- Pure rendering
- No API calls
- No business logic
- No side effects

Location:

```
src/components/ui/
```

#### 2️⃣ Containers (Smart)

- Data fetching
- State orchestration
- Calls services/hooks

Location:

```
src/components/containers/
```

❌ UI components may **never** fetch data.

---

## 6. API Client & Networking Rules (Stripe-Inspired)

### 6.1 Single API Client (Mandatory)

All frontend network calls must go through **one client**:

```
src/services/apiClient.ts
```

This client:

- Wraps `fetch` or `axios`
- Defines interceptors for:
  - Auth
  - Errors
  - Logging
  - Retry

❌ Forbidden everywhere else:

```ts
fetch('/api/...')
axios.get(...)
```

### 6.2 Service Layer on Frontend

Frontend services live in:

```
src/services/
```

UI → Container → Service → API Client

---

## 7. Backend Controller / Service / Repository Rules

### 7.1 Controllers

- Stateless
- No DB access
- No external API calls
- Only orchestration

### 7.2 Services

- Pure business logic
- Testable in isolation
- No HTTP concerns

### 7.3 Repositories

- DB queries only
- No conditionals based on business meaning
- No request context

---

## 8. Anti-Duplication Rules (Critical)

### 8.1 Search-Before-Create Rule

Before creating:

- A component
- A hook
- A service
- A utility

You **must search** the codebase.

If something similar exists → **reuse or extend**.

### 8.2 Duplication Threshold

If logic appears **twice**, it must be abstracted.
Three times = architectural failure.

---

## 9. Escape Hatch Protocol (Allowed, But Strict)

Breaking rules is allowed **only** via an escape hatch.

### 9.1 When Escape Hatches Are Allowed

- Framework limitations
- Performance constraints
- Third-party library requirements
- Prototyping behind feature flags

### 9.2 Required Documentation

Every escape hatch **must** be documented in:

```
tasks/<task-name>/07-DECISIONS.md
```

Format:

```md
Decision:
Rule Broken:
Reason:
Alternatives Considered:
Risk:
Approved By:
Date:
```

### 9.3 Approval

- Human approval required
- Temporary by default
- Must include a revisit plan

---

## 10. AI-Specific Enforcement Rules

### 10.1 AI Must Never

- Invent new architectural layers
- Bypass middleware
- Duplicate API clients
- Write logic directly in routes or JSX

### 10.2 AI Must Always

- Reference existing files
- Follow folder ownership
- Stop and ask if unsure
- Prefer reuse over creation

---

## 11. Forbidden Patterns (Hard Stop)

❌ Business logic in React components
❌ DB access in route handlers
❌ Multiple API clients
❌ Inline `fetch` / `axios`
❌ Copy-pasted services
❌ Skipping layers
❌ “Temporary” hacks without documentation

---

## 12. Enforcement Precedence

1. USER RULES
2. PROJECT RULES
3. TASK EXECUTION CONTRACT
4. **CODEBASE_ARCHITECTURE_RULES**
5. Docs
6. Agent suggestions

---

## Final Statement

This codebase is treated as a **long-lived, large-team system**, not a startup prototype.

If a change:

- Makes the system harder to reason about
- Introduces duplication
- Bypasses structure

…it is considered **incorrect**, even if it “works”.
