# Task: Subscriptions & Payments System

**Task ID:** `2025-12-16__SUBSCRIPTIONS-PAYMENTS-SYSTEM`  
**Created:** December 16, 2025  
**Priority:** P0  
**Sprint:** 5 (Weeks 9-10)

---

## Problem Statement

Creators need to monetize their content through subscriptions and PPV. Users need a way to pay for access and show appreciation through tips.

---

## Business Goal

Enable the core revenue loop:

- Users subscribe to creators → Creators earn
- Users unlock PPV → Creators earn
- Users tip → Creators earn
- Platform takes 15% commission

---

## Scope

### ✅ In Scope

| Feature                   | Priority | Notes                  |
| ------------------------- | -------- | ---------------------- |
| Subscription purchase     | P0       | Monthly + bundles      |
| Square payment processing | P0       | Checkout, webhooks     |
| Subscription management   | P0       | Cancel, renew, upgrade |
| PPV content unlock        | P0       | Pay to view posts      |
| Wallet/balance system     | P0       | Prepaid balance        |
| Tipping                   | P0       | Tips on posts/messages |
| Transaction history       | P0       | User + creator views   |
| Creator payouts           | P0       | Weekly via Square      |

### ❌ Out of Scope

| Feature             | Reason                     |
| ------------------- | -------------------------- |
| Multiple currencies | Phase 2 (USD only for now) |
| Crypto payments     | Phase 2                    |
| Refund self-service | Manual review for now      |
| Tax form generation | Phase 2                    |

---

## Success Criteria

1. ✅ User can subscribe to creator (monthly or bundle)
2. ✅ Square payment processes successfully
3. ✅ User can top up wallet balance
4. ✅ User can unlock PPV content with wallet or card
5. ✅ User can tip creators on posts
6. ✅ Transaction history shows all purchases
7. ✅ Creator dashboard shows earnings breakdown
8. ✅ Weekly payouts process to creator's bank

---

## Dependencies

| Dependency             | Status                        |
| ---------------------- | ----------------------------- |
| Auth System            | ✅ Complete                   |
| Creator Foundation     | ✅ Complete (Square OAuth)    |
| Content/Posts System   | ✅ Complete (PPV posts exist) |
| Database Schema        | ✅ Complete                   |
| Square Production Keys | ⬜ Required                   |

---

## Confirmed Decisions

| Decision              | Answer          |
| --------------------- | --------------- |
| Payment Provider      | Square          |
| Platform Commission   | 15%             |
| Payout Schedule       | Weekly (Friday) |
| Minimum Payout        | $20             |
| Wallet Minimum Top-Up | $5              |

---

## Reference Documents

- [PRD Section 3.3](/docs/02-PRD.md) - Monetization System
- [Database Schema](/docs/04-DATABASE-SCHEMA.md) - subscriptions, transactions, payouts
- [Sprint 5 Research](/docs/SPRINT-5-SUBSCRIPTIONS-PAYMENTS-RESEARCH.md) - Full PM research
