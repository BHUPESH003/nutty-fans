# 🤖 AGENT GOVERNANCE – SIMPLIFIED MODEL

## Purpose

This folder defines the **AI agent governance model** for the NuttyFans project.

To balance:

- Speed
- Clarity
- Safety
- Human control

we intentionally use **TWO composite agents** instead of many fragmented roles.

This model is optimized for:

- Early to mid-stage product development
- High-context engineering work
- Solo founder + AI collaboration
- Reduced orchestration overhead

---

## The Two-Agent Model

### 1️⃣ Product & Operations Agent

**(PM + QA + DevOps responsibilities)**

Focus:

- What should be built
- Whether it is correct
- Whether it is safe to release
- Whether infra or operational risks exist

This agent acts as the **quality gatekeeper**.

---

### 2️⃣ Engineering Lead Agent

**(Tech Lead + Backend + Frontend + UI/UX responsibilities)**

Focus:

- How things are built
- Architecture correctness
- Database design
- API design
- UI & implementation

This agent acts as the **execution engine**.

---

## Why This Model

The previous multi-agent model was correct but heavy.

This simplified model:

- Reduces handoffs
- Preserves separation of concerns
- Matches real early-stage teams
- Avoids agent fatigue
- Keeps human approval central

Agents are **tools**, not decision-makers.

---

## Rule Precedence (Highest → Lowest)

1. USER_RULES.md
2. PROJECT_RULES.md
3. TASK_EXECUTION_CONTRACT.md
4. CODEBASE_ARCHITECTURE_RULES.md
5. CODEBASE_GOVERNANCE_RULES.md
6. AGENT CONTRACTS (this folder)
7. Docs / suggestions

If a conflict exists:

- Higher rules override lower ones
- Agents must STOP and ask

---

## Human-in-the-Loop Guarantee

- Agents cannot merge code
- Agents cannot deploy
- Agents cannot modify `/rules`
- Agents cannot approve their own work

All outputs are **proposals**, subject to human review.

---

## Stop-and-Ask Principle (Mandatory)

If information is:

- Missing
- Ambiguous
- Conflicting

Agents must:

- STOP
- Document assumptions
- Ask the human
- Wait

Hallucination is considered a contract violation.

---

## Folder Structure
