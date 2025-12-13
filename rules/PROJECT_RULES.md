# 🏗️ PROJECT RULES

**NuttyFans – Engineering, Repo & Delivery Contract**

---

## 1️⃣ Repository Structure (Canonical)

### **P1. Root-Level Structure**

The repository **must** follow this structure:

```
/
├── .cursor/
│   └── .rules
├── rules/
│   ├── USER_RULES.md
│   ├── PROJECT_RULES.md
│   └── README.md
├── docs/
│   ├── 01-BRD.md
│   ├── 02-PRD.md
│   ├── 03-TECHNICAL-ARCHITECTURE.md
│   ├── 04-DATABASE-SCHEMA.md
│   ├── 05-API-SPECIFICATION.md
│   ├── 06-UI-UX-BLUEPRINT.md
│   ├── 07-PROJECT-TRACKER.md
│   └── README.md
├── tasks/
│   └── YYYY-MM-DD__TASK-NAME/
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   └── types/
├── tests/
├── scripts/
├── README.md
└── package.json
```

No agent may invent new root folders without approval.

---

## 2️⃣ Branching & Environments

### **P2. Branches**

- `main` → Production
- `qa` → Dev + QA environment
- `task/*` → Feature branches (one per task)

Example:

```
task/2025-01-14__CREATOR-SUBSCRIPTIONS
```

### **P3. Merge Rules**

- `task/*` → `qa` (after review)
- `qa` → `main` (after QA sign-off)

Direct commits to `main` or `qa` are **forbidden**.

---

## 3️⃣ Environment Rules

### **P4. Environments**

| Environment | Purpose                  |
| ----------- | ------------------------ |
| QA          | Dev, integration testing |
| PROD        | Live users               |

### **P5. Environment Safety**

- No test data in PROD
- No prod secrets in QA
- Feature flags preferred over hotfixes

---

## 4️⃣ Coding Standards

### **P6. Language & Stack**

- Frontend: **Next.js (App Router), TypeScript**
- Backend: **Next.js APIs / Server Actions**
- Database: **PostgreSQL**
- Styling: **Tailwind + ShadCN**

### **P7. Code Quality**

- TypeScript strict mode ON
- No `any` without justification
- No dead code
- Small, composable functions

Agents must prioritize **readability over cleverness**.

---

## 5️⃣ Documentation Standards

### **P8. Documentation Is Mandatory**

- Every task must have a task folder
- Every non-trivial change must update docs or reference why not

### **P9. Doc Format**

- Markdown only (`.md`)
- Machine drafts use `.mdc`
- No diagrams without text explanation

---

## 6️⃣ API & Database Rules

### **P10. API Contracts**

- Defined in `docs/05-API-SPECIFICATION.md`
- Versioned if breaking
- Frontend cannot assume backend behavior

### **P11. Database Changes**

- All schema changes must be documented
- No destructive migrations without rollback
- All DB logic is backend-owned

---

## 7️⃣ Frontend Rules

### **P12. UI Consistency**

- Follow `06-UI-UX-BLUEPRINT.md`
- Reuse components before creating new ones
- No inline styling unless unavoidable

### **P13. State Management**

- Explicit ownership of state
- No hidden global state
- Clear loading & error states

---

## 8️⃣ Backend Rules

### **P14. Business Logic**

- Backend owns validation
- Never trust frontend input
- All auth checks server-side

### **P15. Security**

- Rate limiting on sensitive endpoints
- Proper access control
- Audit logs for critical actions

---

## 9️⃣ QA & Testing Rules

### **P16. Testing Responsibility**

- Developers write basic tests
- QA agent writes test cases & bug reports
- Bugs must be linked to tasks

### **P17. Bug Lifecycle**

Bug states:

- Open
- In Progress
- Fixed
- Verified
- Closed

No silent bug fixes.

---

## 🔟 DevOps Rules

### **P18. Infra Changes**

- Infra changes require `06-DEVOPS.mdc`
- Rollback plan mandatory
- No auto-deploys to PROD

---

## 1️⃣1️⃣ Agent Boundaries

### **P19. Agent Permissions**

Agents may:

- Create files
- Propose changes
- Open PRs

Agents may NOT:

- Merge PRs
- Deploy
- Modify secrets
- Change `/rules`

---

## 1️⃣2️⃣ Naming & Conventions

### **P20. Naming**

- Files: kebab-case
- Components: PascalCase
- Variables: camelCase
- Constants: SCREAMING_SNAKE_CASE

---

## 1️⃣3️⃣ Rule Enforcement

### **P21. Rule Conflicts**

Order of precedence:

1. USER RULES
2. PROJECT RULES
3. Docs
4. Agent suggestions

---

## 1️⃣4️⃣ Rule Evolution

### **P22. Changes to PROJECT RULES**

- Only you can modify
- Must be documented
- No silent updates

---

# ✅ Summary

These PROJECT RULES ensure:

- Predictable structure
- Safe AI collaboration
- Clean delivery pipeline
- Long-term maintainability

Together with USER RULES, this forms a **complete operating system** for NuttyFans.
