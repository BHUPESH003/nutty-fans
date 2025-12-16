# Sprint 5 Combined Task Research: Subscriptions & Payments System

**Sprint:** 5 (Weeks 9-10)  
**Focus:** Revenue Enablers  
**Prepared By:** Product Operations Agent  
**Date:** 2025-12-16

---

## 📋 Executive Summary

This document consolidates **Subscriptions** and **Payments** into ONE combined task. This is the #1 priority as it enables creator monetization.

---

## 🎯 Combined Task: SUBSCRIPTIONS-PAYMENTS-SYSTEM

**Proposed Task ID:** `2025-12-16__SUBSCRIPTIONS-PAYMENTS-SYSTEM`

### Scope — All Revenue Features Combined

| Sub-Feature                             | Priority | PRD Reference |
| --------------------------------------- | -------- | ------------- |
| Subscription Purchase Flow              | P0       | U-020         |
| Square Payment Processing               | P0       | C-020         |
| Subscription Management (cancel, renew) | P0       | U-023         |
| Bundle Purchasing (3m, 6m, 12m)         | P0       | U-026         |
| PPV Content Unlock                      | P0       | U-021, C-021  |
| Wallet/Balance System                   | P0       | U-024         |
| Transaction History                     | P0       | U-025         |
| Tipping                                 | P0       | U-022, C-022  |
| Creator Payouts                         | P0       | C-026         |

### Why Combine?

1. **Payment Flow Shared:** All monetization uses Square
2. **Wallet Central:** Tips, PPV, subscriptions all use wallet
3. **Transaction Unified:** Single transaction table, one architecture
4. **Business Critical:** Can't earn without payments working

---

## 📊 Functional Requirements

### FR-1: Subscription Purchase

| Requirement    | Description                                    |
| -------------- | ---------------------------------------------- |
| **Trigger**    | User clicks "Subscribe" on creator profile     |
| **Plan Types** | Monthly, 3-month, 6-month, 12-month            |
| **Pricing**    | Creator-set price ($4.99 - $49.99)             |
| **Bundles**    | Discounts applied per creator settings         |
| **Free Trial** | 0-30 days optional                             |
| **Payment**    | Square checkout or wallet balance              |
| **Result**     | `subscriptions` record created, access granted |

### FR-2: Square Payment Integration

| Requirement      | Description                                 |
| ---------------- | ------------------------------------------- |
| **Provider**     | Square (confirmed)                          |
| **Checkout**     | Square Web Payments SDK                     |
| **Card Storage** | Square Cards API for saved cards            |
| **Webhooks**     | `payment.completed`, `subscription.updated` |
| **Refunds**      | Square Refunds API                          |

### FR-3: Subscription Management

| Requirement    | Description                       |
| -------------- | --------------------------------- |
| **View**       | List active subscriptions         |
| **Cancel**     | Cancel at end of period           |
| **Resume**     | Reactivate cancelled subscription |
| **Auto-Renew** | Toggle auto-renewal               |
| **Upgrade**    | Switch to longer bundle           |

### FR-4: PPV Unlock

| Requirement | Description                              |
| ----------- | ---------------------------------------- |
| **Trigger** | User clicks "Unlock" on PPV post         |
| **Price**   | Creator-set ($1 - $500)                  |
| **Payment** | Square checkout or wallet balance        |
| **Result**  | `ppv_purchases` record, content unlocked |

### FR-5: Wallet System

| Requirement  | Description                                            |
| ------------ | ------------------------------------------------------ |
| **Balance**  | User wallet balance (stored on `users.wallet_balance`) |
| **Top-Up**   | Add funds via Square payment                           |
| **Minimum**  | $5 minimum top-up                                      |
| **Usage**    | Pay for subscriptions, PPV, tips                       |
| **Priority** | Use wallet first, then card                            |

### FR-6: Tipping

| Requirement | Description                   |
| ----------- | ----------------------------- |
| **Range**   | $1 - $500 per tip             |
| **Targets** | Posts, messages, live streams |
| **Message** | Optional tip message          |
| **Payment** | Wallet or direct payment      |

### FR-7: Creator Payouts

| Requirement    | Description                      |
| -------------- | -------------------------------- |
| **Schedule**   | Weekly (every Friday)            |
| **Minimum**    | $20 minimum payout               |
| **Commission** | 15% platform fee                 |
| **Method**     | Square payouts to creator's bank |
| **History**    | Payout history with breakdowns   |

### FR-8: Transaction History

| Requirement      | Description                         |
| ---------------- | ----------------------------------- |
| **User View**    | All purchases, tips, wallet top-ups |
| **Creator View** | All earnings, payouts, commissions  |
| **Filtering**    | By type, date range, status         |
| **Export**       | CSV export for tax purposes         |

---

## 🗄️ Database Tables (Already Defined)

| Table                  | Purpose                    | Schema Status |
| ---------------------- | -------------------------- | ------------- |
| `subscriptions`        | Active subscriptions       | ✅ Defined    |
| `transactions`         | All financial transactions | ✅ Defined    |
| `payouts`              | Creator payouts            | ✅ Defined    |
| `ppv_purchases`        | PPV unlock records         | ✅ Defined    |
| `users.wallet_balance` | User wallet                | ✅ Defined    |

---

## 🔌 API Endpoints Required

### Subscriptions

| Endpoint                         | Method | Purpose                              |
| -------------------------------- | ------ | ------------------------------------ |
| `/api/subscriptions`             | GET    | List user's subscriptions            |
| `/api/subscriptions/[creatorId]` | POST   | Subscribe to creator                 |
| `/api/subscriptions/[id]`        | PATCH  | Update subscription (cancel, resume) |
| `/api/subscriptions/[id]/renew`  | POST   | Manually renew                       |
| `/api/creator/subscribers`       | GET    | Creator's subscriber list            |

### Payments

| Endpoint                        | Method          | Purpose                 |
| ------------------------------- | --------------- | ----------------------- |
| `/api/payments/checkout`        | POST            | Create Square checkout  |
| `/api/payments/cards`           | GET/POST/DELETE | Saved cards             |
| `/api/webhooks/square/payments` | POST            | Square payment webhooks |

### Wallet

| Endpoint                   | Method | Purpose                    |
| -------------------------- | ------ | -------------------------- |
| `/api/wallet`              | GET    | Get wallet balance         |
| `/api/wallet/topup`        | POST   | Add funds to wallet        |
| `/api/wallet/transactions` | GET    | Wallet transaction history |

### PPV

| Endpoint                     | Method | Purpose              |
| ---------------------------- | ------ | -------------------- |
| `/api/ppv/[postId]/purchase` | POST   | Purchase PPV content |
| `/api/ppv/purchases`         | GET    | User's PPV purchases |

### Tips

| Endpoint             | Method | Purpose                 |
| -------------------- | ------ | ----------------------- |
| `/api/tips`          | POST   | Send tip                |
| `/api/tips/received` | GET    | Creator's received tips |

### Payouts

| Endpoint                        | Method    | Purpose         |
| ------------------------------- | --------- | --------------- |
| `/api/creator/payouts`          | GET       | Payout history  |
| `/api/creator/payouts/settings` | GET/PATCH | Payout settings |

### Transactions

| Endpoint                    | Method | Purpose                  |
| --------------------------- | ------ | ------------------------ |
| `/api/transactions`         | GET    | User transaction history |
| `/api/creator/transactions` | GET    | Creator earnings history |
| `/api/transactions/export`  | GET    | Export as CSV            |

---

## 🖼️ UI Pages Required

### User Pages

| Page                | Route            | Purpose                  |
| ------------------- | ---------------- | ------------------------ |
| Subscribe Modal     | Component        | Subscription checkout    |
| My Subscriptions    | `/subscriptions` | Manage subscriptions     |
| Wallet              | `/wallet`        | Balance, top-up, history |
| Transaction History | `/transactions`  | All purchases            |
| PPV Unlock Modal    | Component        | PPV purchase flow        |
| Tip Modal           | Component        | Send tip flow            |

### Creator Pages

| Page               | Route                       | Purpose               |
| ------------------ | --------------------------- | --------------------- |
| Earnings Dashboard | `/creator/earnings`         | Revenue overview      |
| Subscribers List   | `/creator/subscribers`      | Subscriber management |
| Payout History     | `/creator/payouts`          | Payout records        |
| Payout Settings    | `/creator/payouts/settings` | Bank/payment setup    |

---

## ⚠️ Risks & Considerations

| Risk                         | Impact | Mitigation                     |
| ---------------------------- | ------ | ------------------------------ |
| Square ToS for adult content | High   | Verify compliance early        |
| Payment disputes/chargebacks | High   | Clear ToS, content access logs |
| Tax compliance               | Medium | Transaction export, 1099 prep  |
| Currency conversion          | Medium | Start USD-only                 |

---

## 🔗 Dependencies

| Dependency           | Status      | Notes                           |
| -------------------- | ----------- | ------------------------------- |
| Auth System          | ✅ Complete | Required for user identity      |
| Creator Foundation   | ✅ Complete | Square OAuth already integrated |
| Content/Posts System | ✅ Complete | Required for PPV                |
| S3/CloudFront        | ✅ Complete | N/A for payments                |
| Square API Keys      | 🟡 Required | Need production keys            |

---

## ✅ Confirmed Decisions

| Decision         | Answer | Notes                                     |
| ---------------- | ------ | ----------------------------------------- |
| Payment Provider | Square | Already integrated for creator onboarding |
| Platform Fee     | 15%    | Standard commission                       |
| Payout Schedule  | Weekly | Every Friday                              |
| Minimum Payout   | $20    | Reduce transaction fees                   |
| Wallet System    | Yes    | Prepaid balance option                    |

---

## 📅 Estimated Timeline

| Phase                              | Duration       | Owner            |
| ---------------------------------- | -------------- | ---------------- |
| Architecture Review                | 2 days         | Engineering Lead |
| Backend (Payments + Subscriptions) | 5 days         | Backend Agent    |
| Backend (Wallet + Tips + Payouts)  | 3 days         | Backend Agent    |
| Frontend (User flows)              | 4 days         | Frontend Agent   |
| Frontend (Creator earnings)        | 3 days         | Frontend Agent   |
| Square Integration Testing         | 2 days         | Both             |
| QA Testing                         | 3 days         | QA Agent         |
| **Total**                          | **~3-4 weeks** |                  |

---

## 📝 Next Steps

1. **PM:** Create task folder `2025-12-16__SUBSCRIPTIONS-PAYMENTS-SYSTEM`
2. **Engineering Lead:** Begin `02-ARCHITECTURE-REVIEW.mdc`
3. **Verify:** Square ToS compliance for adult content
4. **Setup:** Square production API keys
