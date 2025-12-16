# Sprint 3 Combined Task Research

**Sprint:** 3 (Weeks 5-6)  
**Focus:** Creator Foundation  
**Prepared By:** Product Operations Agent  
**Date:** 2025-12-16

---

## 📋 Executive Summary

Sprint 3 consolidates **Creator Foundation** into **ONE combined task** instead of multiple fragmented tasks. This reduces context-switching and ensures cohesive architecture design.

---

## 🎯 Combined Task: CREATOR-FOUNDATION

**Proposed Task ID:** `2025-12-16__CREATOR-FOUNDATION`

### Scope — All Creator Setup Features Combined

| Sub-Feature                            | Priority | PRD Reference |
| -------------------------------------- | -------- | ------------- |
| Creator Application Flow               | P0       | C-001         |
| KYC Verification                       | P0       | C-002         |
| Creator Profile Setup                  | P0       | C-003, C-004  |
| Subscription Pricing Setup             | P0       | C-005         |
| Creator Settings                       | P0       | C-040, C-041  |
| Basic Creator Dashboard (metrics only) | P0       | C-030, C-031  |
| Square Payments Integration            | P0       | C-020, C-026  |

### Why Combine?

1. **Architecture Coherence:** Creator → KYC → Profile → Monetization is a single flow
2. **Data Model Alignment:** `creators`, `kyc_verifications`, `subscription_tiers` tables are interdependent
3. **Reduces Handoffs:** One architecture review covers all creator setup
4. **Faster Delivery:** No waiting between micro-tasks

---

## 📊 Functional Requirements

### FR-1: Creator Application Flow

| Requirement          | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| **Trigger**          | User clicks "Become a Creator"                                 |
| **Eligibility**      | Must have verified email + age verification passed             |
| **Application Form** | Display name, category, bio, profile photo, subscription price |
| **Initial State**    | `application_status: PENDING`                                  |
| **Outcome**          | Redirects to KYC verification                                  |

### FR-2: KYC Verification

| Requirement   | Description                                       |
| ------------- | ------------------------------------------------- |
| **Provider**  | **Veriff** ✅ (Confirmed)                         |
| **Documents** | Government ID + selfie + proof of address         |
| **Webhook**   | Provider calls `/api/webhooks/kyc` on completion  |
| **States**    | `PENDING` → `IN_REVIEW` → `APPROVED` / `REJECTED` |
| **Rejection** | Allow resubmission with feedback                  |

### FR-3: Creator Profile

| Requirement            | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| **Fields**             | Display name, bio, category, profile photo, banner, links |
| **Visibility**         | Public profile at `/c/[handle]`                           |
| **Privacy**            | Region blocking, hide from search option                  |
| **Verification Badge** | Shown after KYC approval                                  |

### FR-4: Subscription Setup

| Requirement     | Description                                              |
| --------------- | -------------------------------------------------------- |
| **Price Range** | $4.99 - $49.99/month                                     |
| **Bundles**     | 3-month (10% off), 6-month (20% off), 12-month (30% off) |
| **Free Trial**  | 0-30 days optional                                       |
| **Changes**     | Price changes apply to new subs only                     |

### FR-5: Square Payments Integration

| Requirement         | Description                      |
| ------------------- | -------------------------------- |
| **Provider**        | **Square** ✅ (Confirmed)        |
| **Account Type**    | Square Seller Account with OAuth |
| **Onboarding**      | OAuth flow to Square             |
| **Payout Schedule** | Weekly (every Friday)            |
| **Minimum Payout**  | $20                              |
| **Commission**      | 15% platform fee                 |

### FR-6: Basic Creator Dashboard

| Requirement    | Description                                      |
| -------------- | ------------------------------------------------ |
| **Metrics**    | Total revenue, subscriber count, profile views   |
| **Timeframes** | 7d, 30d, 90d, all-time                           |
| **Status**     | Account status, payout pending, next payout date |

---

## 🗄️ Database Tables Involved

Already defined in `04-DATABASE-SCHEMA.md`:

| Table                | Purpose                           |
| -------------------- | --------------------------------- |
| `users`              | Creator flag, verification status |
| `creator_profiles`   | Extended creator info             |
| `kyc_verifications`  | KYC submission records            |
| `subscription_tiers` | Creator pricing                   |
| `creator_payouts`    | Payout history                    |
| `creator_earnings`   | Revenue tracking                  |

---

## 🔌 API Endpoints Required

| Endpoint                         | Method    | Purpose                     |
| -------------------------------- | --------- | --------------------------- |
| `/api/creator/apply`             | POST      | Submit creator application  |
| `/api/creator/kyc/start`         | POST      | Initiate KYC with Veriff    |
| `/api/webhooks/veriff`           | POST      | Receive Veriff callbacks    |
| `/api/creator/profile`           | GET/PATCH | Get/update creator profile  |
| `/api/creator/subscription-tier` | GET/PATCH | Manage subscription pricing |
| `/api/creator/square/onboard`    | POST      | Start Square OAuth          |
| `/api/creator/square/callback`   | GET       | Square OAuth callback       |
| `/api/creator/dashboard`         | GET       | Dashboard metrics           |
| `/api/creator/payouts`           | GET       | Payout history              |

---

## 🖼️ UI Pages Required

| Page                   | Route                    | Purpose               |
| ---------------------- | ------------------------ | --------------------- |
| Creator Application    | `/creator/apply`         | Application form      |
| KYC Verification       | `/creator/verify`        | KYC document upload   |
| Creator Onboarding     | `/creator/onboard`       | Post-approval setup   |
| Creator Profile Edit   | `/creator/profile/edit`  | Edit creator profile  |
| Subscription Settings  | `/creator/subscription`  | Pricing setup         |
| Payout Setup           | `/creator/payouts/setup` | Square setup          |
| Creator Dashboard      | `/creator/dashboard`     | Metrics overview      |
| Public Creator Profile | `/c/[handle]`            | Public-facing profile |

---

## ⚠️ Risks & Considerations

| Risk                                  | Mitigation                         |
| ------------------------------------- | ---------------------------------- |
| Veriff API delays                     | Mock KYC in dev environment        |
| Square restrictions for adult content | Verify Square ToS compliance early |
| Region-specific requirements          | Start with US/UK/EU only           |

---

## ✅ Confirmed Decisions

| Decision             | Answer           | Notes                     |
| -------------------- | ---------------- | ------------------------- |
| **KYC Provider**     | Veriff           | ✅ Confirmed              |
| **Payment Provider** | Square           | ✅ Confirmed (not Stripe) |
| **Creator Age**      | 18+              | ✅ Confirmed              |
| **Category System**  | Fixed list in DB | ✅ Extensible later       |

---

## 📅 Estimated Timeline

| Phase                | Duration     | Owner            |
| -------------------- | ------------ | ---------------- |
| Architecture Review  | 2 days       | Engineering Lead |
| UI/UX Design         | 2 days       | UI/UX Agent      |
| Backend Development  | 5 days       | Backend Agent    |
| Frontend Development | 5 days       | Frontend Agent   |
| Integration          | 2 days       | Both             |
| QA Testing           | 3 days       | QA Agent         |
| **Total**            | **~3 weeks** |                  |

---

## ✅ Success Criteria

1. User can apply to become a creator
2. KYC verification completes via external provider
3. Approved creators can set subscription pricing
4. Stripe Connect onboarding works end-to-end
5. Creator dashboard shows basic metrics
6. Public creator profile is accessible

---

## 🔗 Dependencies

| Dependency      | Status      | Notes                            |
| --------------- | ----------- | -------------------------------- |
| Auth System     | ✅ Complete | Required for creator application |
| User Profiles   | ✅ Complete | Base for creator profiles        |
| Database Schema | ✅ Complete | Creator tables defined           |
| Infrastructure  | 🟡 Pending  | Needed for KYC webhooks, Stripe  |

---

## 📝 Next Steps

1. **Human:** Resolve open questions above
2. **Engineering Lead:** Create architecture review document
3. **UI/UX Agent:** Design creator onboarding flow
4. **Engineering:** Implement after architecture approval
