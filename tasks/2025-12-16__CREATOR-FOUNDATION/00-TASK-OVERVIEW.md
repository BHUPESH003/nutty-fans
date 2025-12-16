# Creator Foundation Task Overview

**Task ID:** `2025-12-16__CREATOR-FOUNDATION`  
**Sprint:** 3 (Creator Foundation)  
**Date:** 2025-12-16

---

## Problem Statement

Users can sign up and create profiles, but there is no path to become a creator. This blocks the core value proposition of NuttyFans — enabling creators to monetize content.

---

## Business Goal

Enable users to transition into verified creators who can:

1. Set up subscription pricing
2. Receive payments via Square
3. Track basic earnings and subscriber metrics

---

## Scope

### In Scope ✅

| Feature               | Priority | Description                     |
| --------------------- | -------- | ------------------------------- |
| Creator Application   | P0       | "Become a Creator" flow         |
| KYC Verification      | P0       | Veriff identity verification    |
| Creator Profile Setup | P0       | Public profile at `/c/[handle]` |
| Subscription Pricing  | P0       | $4.99-$49.99/month pricing      |
| Square Payments       | P0       | OAuth onboarding, payouts       |
| Creator Dashboard     | P0       | Basic metrics view              |

### Out of Scope ❌

- Content creation/posting system
- Messaging system
- Live streaming
- Advanced analytics
- Promotional tools
- Multi-tier subscriptions

---

## Technology Decisions

| Component        | Decision        | Rationale                    |
| ---------------- | --------------- | ---------------------------- |
| KYC Provider     | **Veriff**      | Confirmed by PM              |
| Payment Provider | **Square**      | Confirmed by PM (not Stripe) |
| Webhook Security | HMAC signatures | Standard practice            |
| OAuth Flow       | Server-side     | Secure token handling        |

---

## Success Criteria

1. User can apply to become a creator
2. KYC verification completes via Veriff
3. Approved creators can set subscription pricing
4. Square onboarding works end-to-end
5. Creator dashboard shows basic metrics
6. Public creator profile is accessible

---

## Dependencies

| Dependency      | Status      |
| --------------- | ----------- |
| Auth System     | ✅ Complete |
| User Profiles   | ✅ Complete |
| Database Schema | ✅ Complete |
| Design System   | ✅ Complete |

---

## References

- [Sprint 3 Research](file:///home/pelocal/Desktop/nuttyfans/docs/SPRINT-3-COMBINED-RESEARCH.md)
- [Database Schema](file:///home/pelocal/Desktop/nuttyfans/docs/04-DATABASE-SCHEMA.md)
