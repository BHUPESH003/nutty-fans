# 📜 TASK EXECUTION CONTRACT

**NuttyFans – Task-Level Execution Constitution**

---

## 1️⃣ Purpose

This document defines the **mandatory contract** for executing any task in the NuttyFans project.

It governs:

- How tasks are structured
- How work flows from idea to production
- Who can do what, and when
- What must exist before proceeding to the next phase

This contract is **binding** on humans and agents.

---

## 2️⃣ Core Principles (Non-Negotiable)

### **T1. One Task = One Folder**

Every task must live in exactly **one task folder**.

No task may span multiple folders.

---

### **T2. Tasks Are Immutable in Intent**

Once a task starts execution:

- Scope must not change
- Requirements must not drift

Any scope change requires:

- A **new task folder**, or
- Explicit human approval

---

### **T3. Docs Before Code**

No engineering work may begin unless:

- Planning and design documents are created
- Architecture is reviewed and approved

Code without approved docs is invalid.

---

### **T4. Humans Approve, Agents Propose**

- Agents may **propose**
- Agents may **draft**
- Agents may **suggest**

Only the human owner may:

- Approve
- Execute
- Merge
- Release

---

### **T5. Everything Must Be Auditable**

At any time, it must be possible to determine:

- What was done
- Why it was done
- Who approved it
- When it happened

---

## 3️⃣ Canonical Task Folder Structure

All tasks live under:

```
/tasks/
```

### **Folder Naming Convention**

```
YYYY-MM-DD__TASK-SHORT-NAME
```

Example:

```
2025-01-14__CREATOR-SUBSCRIPTIONS
```

---

### **Required Folder Contents**

```
tasks/
└── YYYY-MM-DD__TASK-NAME/
    ├── 00-TASK-OVERVIEW.md
    ├── 01-PM-RESEARCH.mdc
    ├── 02-ARCHITECTURE-REVIEW.mdc
    ├── 03-UI-UX.mdc
    ├── 04-ENGINEERING/
    │   ├── FRONTEND.mdc
    │   ├── BACKEND.mdc
    │   └── INTEGRATION.mdc
    ├── 05-QA.mdc
    ├── 06-DEVOPS.mdc
    ├── 07-DECISIONS.md
    └── 08-STATUS.md
```

All files are **mandatory**, even if marked “Not Applicable”.

---

## 4️⃣ File-Level Contracts

### **00-TASK-OVERVIEW.md**

**Owner:** Human only
**Purpose:** Define task intent

Contains:

- Problem statement
- Business goal
- Scope / out of scope
- Success criteria
- Dependencies

Frozen after task approval.

---

### **01-PM-RESEARCH.mdc**

**Owner:** PM agent → Human review
**Purpose:** Research & functional breakdown

Contains:

- Market/context research
- Functional requirements
- Non-functional requirements
- Open questions

Frozen once architecture review begins.

---

### **02-ARCHITECTURE-REVIEW.mdc**

**Owner:** Tech Lead / Senior Dev → Human approval
**Purpose:** Technical design

Contains:

- Architecture decisions
- Data flows
- API & DB impact
- Risks & trade-offs

Frozen before any engineering starts.

---

### **03-UI-UX.mdc**

**Owner:** UI/UX agent → Human approval
**Purpose:** UX & interaction definition

Contains:

- User flows
- Screen definitions
- Component reuse
- Edge cases

Frozen before frontend work begins.

---

### **04-ENGINEERING/**

Execution layer.

#### **FRONTEND.mdc**

Frontend approach, components, state, APIs.

#### **BACKEND.mdc**

Backend logic, schema changes, validation, security.

#### **INTEGRATION.mdc**

FE–BE contracts, event flows, edge cases.

Frozen when PR is opened.

---

### **05-QA.mdc**

**Owner:** QA agent
**Purpose:** Quality assurance

Contains:

- Test cases
- Bug list
- Status
- Responsible owner

Frozen after production release.

---

### **06-DEVOPS.mdc**

**Owner:** DevOps agent (manual trigger only)
**Purpose:** Infrastructure changes

Contains:

- Infra changes
- CI/CD updates
- Rollback plan

Created only if required.

---

### **07-DECISIONS.md**

**Owner:** Human only
**Purpose:** Immutable decision log

Append-only.
Never overwritten.

---

### **08-STATUS.md**

**Owner:** Human or agents
**Purpose:** Live task state

Contains:

- Current phase
- Blockers
- Owners
- Last updated date

---

## 5️⃣ Task Lifecycle (Mandatory Flow)

### **Phase 1 — Planning**

1. Create task folder
2. Write `00-TASK-OVERVIEW.md`
3. Run PM agent → `01-PM-RESEARCH.mdc`
4. Human review

---

### **Phase 2 — Design**

5. Run Tech Lead agent → `02-ARCHITECTURE-REVIEW.mdc`
6. Run UI/UX agent → `03-UI-UX.mdc`
7. Human approval
8. Architecture locked

---

### **Phase 3 — Engineering**

9. Create task branch
10. Run FE/BE agents → `04-ENGINEERING/*`
11. Human review
12. Open PR to `qa`

---

### **Phase 4 — QA**

13. Merge to `qa`
14. QA agent writes `05-QA.mdc`
15. Bugs resolved

---

### **Phase 5 — Release**

16. Optional DevOps agent → `06-DEVOPS.mdc`
17. Merge `qa` → `main`
18. Update `07-DECISIONS.md`
19. Mark task DONE in `08-STATUS.md`

---

## 6️⃣ Enforcement Rules

- Any missing file = task blocked
- Any unfrozen file = next phase blocked
- Any unapproved architecture = no code allowed
- Any deviation requires explicit human approval

---

## 7️⃣ Precedence Order

1. USER RULES
2. PROJECT RULES
3. TASK EXECUTION CONTRACT
4. Docs
5. Agent suggestions

---

## 8️⃣ Immutability

This document:

- Cannot be modified by agents
- Can only be changed by the human owner
- Any change must be logged

---

## ✅ Final Note

This contract is the **operating spine** of NuttyFans execution.

If this contract is followed:

- AI remains safe
- Architecture remains clean
- Delivery remains predictable
- Scale remains possible
