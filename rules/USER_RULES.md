# 🧭 USER RULES

**NuttyFans – Human Authority & Interaction Contract**

---

## 1️⃣ User Identity & Authority

### **U1. Final Authority**

- **You are the single final decision-maker** for:
  - Architecture
  - Scope
  - Merges
  - Releases
  - Infra changes

- No agent decision is valid without your explicit approval.

There is **no shared authority** model.

---

## 2️⃣ Approval Language (Very Important)

Only the following phrases count as **explicit approval**:

### ✅ **Valid Approval Phrases**

- “Approved”
- “Proceed”
- “Looks good, go ahead”
- “Lock this”
- “Merge this”
- “Ship this”

### ❌ **Non-Approval (Agents must NOT act)**

- “Seems fine”
- “Okay”
- “Interesting”
- “Let’s see”
- “Continue”
- Silence / no response

> If approval language is ambiguous, **agents must pause and ask**.

---

## 3️⃣ Default Agent Behavior

### **U2. Agents Propose, Never Execute**

By default, all agents:

- Propose plans
- Create `.mdc` files
- Suggest changes
- Open PRs or drafts

They **must NOT**:

- Merge branches
- Deploy code
- Modify prod infra
- Overwrite canonical docs

Unless explicitly approved.

---

## 4️⃣ Manual Review Is Mandatory

### **U3. Mandatory Review Points**

You must manually review and approve:

- All `.mdc` files before execution
- All architecture changes
- All DB schema changes
- All API contract changes
- All DevOps changes
- All merges to `main` / `prod`

Agents must assume **human review is required** unless told otherwise.

---

## 5️⃣ Agent Invocation Rules

### **U4. Agents Are Fired Explicitly**

Agents may act only when:

- You explicitly invoke them
- OR a predefined trigger fires (later defined)

Examples of valid invocations:

- “Run PM agent for this task”
- “Ask Tech Lead agent to review”
- “Fire Frontend agent”

Agents must **not auto-chain** into other agents without permission.

---

## 6️⃣ Question-First Rule (Anti-Hallucination)

### **U5. When in Doubt, Ask**

If an agent encounters:

- Missing requirements
- Conflicting constraints
- Unclear scope
- Ambiguous UX
- Incomplete data

The agent must:

1. Pause
2. List assumptions
3. Ask clarifying questions
4. Wait for your response

Guessing is **not allowed**.

---

## 7️⃣ Scope Control

### **U6. No Scope Expansion**

Agents must:

- Work strictly within task scope
- Flag “nice-to-have” ideas separately
- Never silently add features

Any scope change:

- Requires a **new task folder**
- Or explicit approval

---

## 8️⃣ Communication Style Rules

### **U7. Structured Communication Only**

Agents must communicate in:

- Bullet points
- Tables
- Clearly labeled sections

No:

- Long narratives
- Vague language
- Marketing fluff

Clarity > verbosity.

---

## 9️⃣ Documentation Rules

### **U8. Docs Are the Source of Truth**

If:

- Code contradicts docs → docs win
- Agents are unsure → consult docs first

Agents must:

- Reference existing docs explicitly
- Quote file names and sections when relevant

---

## 🔟 Conflict Resolution

### **U9. Human Wins Always**

If:

- Two agents disagree
- An agent disagrees with docs
- An agent disagrees with you

The resolution path is:

1. Agent documents disagreement
2. Presents trade-offs
3. You decide
4. Decision logged in `07-DECISIONS.md`

---

## 1️⃣1️⃣ Safety & Boundaries

### **U10. Forbidden Actions (Hard Stop)**

Agents are **never allowed** to:

- Delete repositories or branches
- Modify secrets
- Access KYC or sensitive user data
- Push to prod
- Run destructive commands
- Change USER or PROJECT RULES

Even with approval — these remain manual.

---

## 1️⃣2️⃣ Escalation Rule

### **U11. When Agents Are Blocked**

If an agent is blocked for >1 step:

- It must summarize:
  - What’s blocked
  - Why
  - What it needs from you

Then wait.

No repeated attempts.

---

## 1️⃣3️⃣ Rule Evolution

### **U12. Rules Can Change Only by You**

USER RULES:

- Are immutable by agents
- Can only be modified by you
- Any change must be logged

---

# ✅ Summary (One Paragraph)

You are the **architect, reviewer, and final gatekeeper**.
Agents are **structured assistants**, not decision-makers.
Nothing moves without explicit approval.
Clarity beats speed.
Docs beat code.
Human judgment beats automation.
