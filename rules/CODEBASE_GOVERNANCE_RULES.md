## 1️⃣ First: validation (you’re thinking correctly)

Your instinct is spot-on:

> “AI hallucinates architecture, duplicates logic, bypasses middleware”

Cal.com avoids this not by “smart devs”, but by:

- **Hard constraints**
- **Tooling-backed rules**
- **Repo-level governance**

You are correctly trying to **encode these constraints early**, _before_ agents touch code.

This is exactly how large orgs work.

---

## 2️⃣ Filter: what to keep vs drop (critical)

NuttyFans is:

- ✅ Single product
- ✅ Single Next.js app
- ❌ Not a public OSS monorepo (yet)
- ❌ No need for changesets, yarn PnP, turbo _right now_

So we **DO NOT blindly copy Cal.com**.

### ✅ KEEP (relevant & valuable)

From Cal.com, we should keep:

1. **Strict repo governance**
2. **Single source of truth for formatting & linting**
3. **Clear separation of concerns**
4. **CI-enforced quality gates**
5. **Environment discipline**
6. **No ad-hoc API / infra / env changes**
7. **Automation over trust**

### ❌ DROP (for now)

We should _not_ enforce yet:

- Turborepo
- Monorepo package boundaries
- Changesets
- Public OSS contribution overhead
- Multi-app release orchestration

We’ll design rules so these can be **added later without refactor**.

---

## 3️⃣ New canonical file (what you asked for)

We will create **one additional rule file**, complementary to
`CODEBASE_ARCHITECTURE_RULES.md`.

### 📁 Location

```
rules/
└── CODEBASE_GOVERNANCE_RULES.md
```

This file answers:

> “How do we keep the codebase clean, consistent, testable, and scalable over time?”

It focuses on **governance, enforcement, and hygiene**, not architecture (already covered).

---

# 📜 CODEBASE_GOVERNANCE_RULES.md

**NuttyFans – Codebase Governance & Quality Contract**

> **Editable by:** Human owner only
> **Applies to:** All humans, all agents, all PRs

---

## 1. Governance Philosophy

This codebase is treated as a **long-lived production system**, not a prototype.

Rules are enforced via:

- Tooling
- CI
- Repo structure
- Human review

**“Works on my machine” is not acceptable.**

---

## 2. Formatting & Linting (Mandatory)

### 2.1 Single Source of Truth

The repo must define:

- `.editorconfig`
- ESLint config
- Prettier config

All code **must** conform automatically.

### 2.2 Enforcement

- Formatting and linting must run:
  - On save (local)
  - On commit (pre-commit hook)
  - In CI (blocking)

Agents must **never bypass linting**.

---

## 3. Type Safety Rules

### 3.1 TypeScript Strictness

- `strict: true` is mandatory
- `any` is forbidden unless justified
- `// @ts-ignore` is forbidden without approval

### 3.2 Justification Format

Any exception must include:

```ts
// EXCEPTION:
// Reason:
// Approved by:
// Date:
```

---

## 4. Testing & Quality Gates

### 4.1 Test Layers

The codebase must support:

- Unit tests (logic)
- Integration tests (API / services)
- E2E tests (critical flows)

### 4.2 Merge Gates

A PR cannot be merged unless:

- Tests pass
- Lint passes
- Types pass

No exceptions.

---

## 5. Environment & Configuration Discipline

### 5.1 Environment Files

- `.env.example` must exist
- Every required env var must be documented
- No undocumented env usage allowed

### 5.2 Environment Separation

- QA and PROD configs must never mix
- Feature flags preferred over environment branching

---

## 6. API & Network Governance

### 6.1 No Ad-hoc Networking

- No inline `fetch`
- No raw API calls
- All network access must go through approved clients

Violations are considered architectural bugs.

---

## 7. Middleware & Cross-Cutting Concerns

If logic applies to:

- Auth
- Rate limiting
- Logging
- Validation
- Feature flags

…it **must** live in middleware or shared infra.

Duplicate enforcement logic is forbidden.

---

## 8. Dependency & Security Hygiene

### 8.1 Dependency Discipline

- Dependency changes must be performed using **pnpm only**
- No unused dependencies
- No unused scripts
- No unpinned critical dependencies

### 8.2 Secrets

- Secrets must never be committed
- Env usage must be explicit
- Any secret exposure is a blocking incident

---

## 9. Documentation & Change Traceability

### 9.1 Every Change Must Be Traceable

Any non-trivial change must be linked to:

- A task folder
- A decision log
- A PR

### 9.2 Silent Changes Are Forbidden

If a change affects:

- Behavior
- Performance
- Security
- Data

…it must be documented.

---

## 10. Escape Hatch (Governance-Level)

Breaking governance rules is allowed **only** if:

- There is a written justification
- It is logged in `07-DECISIONS.md`
- It has an explicit cleanup plan

Temporary hacks must have an expiry.

---

## 11. AI-Specific Governance

AI agents must:

- Follow all lint, test, and formatting rules
- Never disable checks
- Never commit failing code
- Never introduce duplicate tooling

If unsure, **stop and ask**.

---

## 12. Precedence

1. USER RULES
2. PROJECT RULES
3. TASK EXECUTION CONTRACT
4. CODEBASE_ARCHITECTURE_RULES
5. **CODEBASE_GOVERNANCE_RULES**
6. Docs
7. Agent suggestions

## 13. Package Manager & Dependency Management

### **13.1 pnpm Is Mandatory**

This project **must use `pnpm` as the only package manager**.

Allowed:

- `pnpm install`
- `pnpm add`
- `pnpm remove`
- `pnpm update`

Forbidden:

- `npm install`
- `yarn`
- `bun`

### **13.2 Lockfile Enforcement**

- `pnpm-lock.yaml` is the **single source of truth**
- Commits that modify dependencies **must** update `pnpm-lock.yaml`
- PRs that change `package.json` without updating the lockfile are invalid

### **13.3 Workspace Discipline**

- If workspaces are introduced later, they must use **pnpm workspaces**
- No mixed package manager artifacts are allowed

### **13.4 CI Enforcement**

- CI must fail if:
  - `package-lock.json` exists
  - `yarn.lock` exists
  - Any dependency command uses `npm` or `yarn`

### **13.5 Rationale**

pnpm is chosen because it:

- Enforces strict dependency isolation
- Prevents phantom dependencies
- Improves install performance
- Scales better for large codebases
- Matches modern, large-scale engineering standards
