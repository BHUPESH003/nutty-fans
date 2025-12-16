# QA Plan: Subscriptions & Payments System

**Module:** `SUBSCRIPTIONS-PAYMENTS-SYSTEM`  
**Date:** December 16, 2025  
**Tester:** QA Agent

---

## 🛠️ Test Environment Setup

1. **Square Sandbox Account**
   - Ensure `SQUARE_ACCESS_TOKEN` and `SQUARE_APP_ID` are set in `.env`
   - Use Square Sandbox Test Cards for payments
   - Dashboard: https://developer.squareup.com/apps

2. **Database**
   - Ensure `subscriptions`, `transactions`, `wallet_balance` tables exist
   - Seed test users and creators

---

## 🧪 Test Cases

### 1. Wallet System

| ID      | Test Case             | Pre-condition      | Expected Result                     | Priority |
| ------- | --------------------- | ------------------ | ----------------------------------- | -------- |
| WAL-001 | Get wallet balance    | User logged in     | Returns current balance (default 0) | P0       |
| WAL-002 | Top-up wallet ($10)   | User logged in     | Redirects to Square Checkout        | P0       |
| WAL-003 | Complete top-up       | Successful payment | Balance increases by $10            | P0       |
| WAL-004 | View wallet history   | Transactions exist | Lists top-up transaction            | P1       |
| WAL-005 | Top-up below min ($1) | User logged in     | Error: Minimum amount is $5         | P2       |

### 2. Subscriptions

| ID      | Test Case             | Pre-condition    | Expected Result                                          | Priority |
| ------- | --------------------- | ---------------- | -------------------------------------------------------- | -------- |
| SUB-001 | View creator plans    | Creator exists   | Returns monthly + bundle prices                          | P0       |
| SUB-002 | Subscribe (Monthly)   | Wallet has funds | Deducts funds, creates active sub                        | P0       |
| SUB-003 | Subscribe (Card)      | Wallet empty     | Redirects to Square Checkout                             | P0       |
| SUB-004 | Verify Content Access | Active sub       | Access to subscriber-only posts                          | P0       |
| SUB-005 | Cancel Subscription   | Active sub       | Status becomes `canceled`, access remains until end date | P1       |
| SUB-006 | Renew Subscription    | Canceled sub     | Status becomes `active`, extends date                    | P1       |
| SUB-007 | Duplicate Subscribe   | Active sub       | Error: Already subscribed                                | P2       |

### 3. PPV Content

| ID      | Test Case             | Pre-condition     | Expected Result                    | Priority |
| ------- | --------------------- | ----------------- | ---------------------------------- | -------- |
| PPV-001 | View locked post      | No purchase       | Shows lock icon, blur, price       | P0       |
| PPV-002 | Purchase PPV (Wallet) | Wallet has funds  | Deducts funds, unlocks content     | P0       |
| PPV-003 | Purchase PPV (Card)   | Wallet empty      | Redirects to Square Checkout       | P0       |
| PPV-004 | Verify Unlock         | Purchased         | Content visible, media playable    | P0       |
| PPV-005 | Purchase Own Post     | Creator logged in | Error: Cannot purchase own content | P2       |

### 4. Tipping

| ID      | Test Case          | Pre-condition     | Expected Result                    | Priority |
| ------- | ------------------ | ----------------- | ---------------------------------- | -------- |
| TIP-001 | Send Tip (Wallet)  | Wallet has funds  | Deducts funds, creates transaction | P0       |
| TIP-002 | Send Tip (Card)    | Wallet empty      | Redirects to Square Checkout       | P0       |
| TIP-003 | View Received Tips | Creator logged in | Shows tip in earnings dashboard    | P1       |

### 5. Creator Payouts

| ID      | Test Case              | Pre-condition      | Expected Result               | Priority |
| ------- | ---------------------- | ------------------ | ----------------------------- | -------- |
| PAY-001 | View Earnings          | Transactions exist | Shows correct total - 15% fee | P0       |
| PAY-002 | Update Payout Settings | Creator logged in  | Saves bank/Square details     | P0       |
| PAY-003 | View Payout History    | Payouts exist      | Lists past payouts            | P1       |

### 6. Webhooks (Integration)

| ID      | Test Case            | Payload                | Expected Result                           | Priority |
| ------- | -------------------- | ---------------------- | ----------------------------------------- | -------- |
| WEB-001 | Payment Completed    | `payment.updated`      | Updates transaction status to `COMPLETED` | P0       |
| WEB-002 | Subscription Renewed | `invoice.payment_made` | Extends subscription end date             | P1       |
| WEB-003 | Invalid Signature    | Any                    | Returns 401 Unauthorized                  | P0       |

---

## 📝 API Verification Checklist

- [ ] `POST /api/wallet/topup`
- [ ] `POST /api/subscriptions/[creatorId]`
- [ ] `POST /api/ppv/[postId]/purchase`
- [ ] `POST /api/tips`
- [ ] `POST /api/webhooks/square/payments`

---

## 🐞 Known Issues / Risks

- **Square Sandbox:** Webhooks require local tunneling (ngrok) or manual payload testing.
- **Concurrency:** Double-spending wallet balance (needs database transaction lock check).
