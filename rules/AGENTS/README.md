# 🤖 AGENT CONTRACTS – README

## Purpose

This folder defines **agent-specific contracts** for the NuttyFans project.

Each agent contract specifies:

- What the agent is responsible for
- What the agent is explicitly forbidden to do
- What files the agent can read and write
- How the agent must behave when information is missing
- How the agent’s output is validated
- When the agent must stop and wait for human input

These contracts exist to ensure:

- Predictable behavior
- No architectural drift
- No scope bleed between roles
- Safe and auditable AI usage

---

## What Agent Contracts Are

An **Agent Contract** is a **binding role definition**.

Think of each agent as:

> A junior-to-senior team member who must follow a written role charter.

If an agent violates its contract:

- Its output is invalid
- The task is blocked
- No downstream agent may proceed

---

## What Agent Contracts Are NOT

Agent contracts are **not**:

- Prompt experiments
- Suggestions
- Best practices
- Flexible guidelines

They are **strict operating rules**.

---

## Relationship to Other Rules

Agent contracts do **not** exist in isolation.

### Rule Precedence (Highest → Lowest)

1. **USER_RULES.md**
   Human authority and approval rules

2. **PROJECT_RULES.md**
   Repo structure, branching, environments

3. **TASK_EXECUTION_CONTRACT.md**
   Task lifecycle, files, gates

4. **CODEBASE_ARCHITECTURE_RULES.md**
   Code structure and layering

5. **CODEBASE_GOVERNANCE_RULES.md**
   Tooling, quality, hygiene

6. **AGENT CONTRACTS (this folder)**
   Role-specific behavior and boundaries

7. Docs & agent suggestions

If there is any conflict:

- Higher-precedence rules win
- Agents must stop and ask

---

## Folder Structure

```
rules/AGENTS/
├── README.md
├── PM_AGENT_CONTRACT.md
├── TECH_LEAD_AGENT_CONTRACT.md
├── UI_UX_AGENT_CONTRACT.md
├── FRONTEND_AGENT_CONTRACT.md
├── BACKEND_AGENT_CONTRACT.md
├── QA_AGENT_CONTRACT.md
└── DEVOPS_AGENT_CONTRACT.md
```

Each file defines **one agent role**.

---

## Common Structure of an Agent Contract

Every agent contract file must define:

1. **Role & Scope**
2. **Allowed Responsibilities**
3. **Explicitly Forbidden Actions**
4. **Readable Inputs (files/folders)**
5. **Writable Outputs (files/folders)**
6. **Mandatory Output Structure (if applicable)**
7. **Failure & Escalation Rules**
8. **Stop Conditions**

This consistency allows:

- Mechanical enforcement
- Easy review
- Predictable behavior

---

## Stop-and-Ask Principle (Critical)

All agents must follow this rule:

> If requirements are missing, conflicting, or ambiguous:
>
> - Do NOT guess
> - Do NOT invent
> - Do NOT proceed
> - Ask the human and wait

Hallucination is treated as a **contract violation**.

---

## Human-in-the-Loop Guarantee

No agent:

- Approves work
- Merges code
- Deploys changes
- Modifies production infrastructure

All agent output is:

- Proposals only
- Subject to human review
- Reversible

---

## How These Contracts Are Used

Agent contracts are:

- Referenced explicitly in Cursor agent system prompts
- Treated as canonical during reviews
- Used to reject invalid output
- Stable across tools and IDEs

They are **tool-agnostic** by design.

---

## Modifying Agent Contracts

- Only the human owner may modify agent contracts
- Any change must be deliberate and reviewed
- Changes should be rare and documented

Agents must never modify files in this folder.

---

## Final Note

These contracts exist to make AI:

- Predictable
- Safe
- Useful at scale

Speed without structure creates debt.
Structure enables speed later.

---

## Status

This README establishes the **agent governance layer**.
Individual agent contracts define execution.
