# Sprint 7 Task Queue: Notifications System

**Sprint:** 7 (Weeks 13-14)  
**Priority:** P0 — Queued after Messaging  
**Prepared By:** Product Operations Agent  
**Date:** 2025-12-16

---

## 📋 Overview

Cross-cutting notification system for in-app, email, and push notifications.

---

## Scope

| Feature                  | Priority | PRD Reference |
| ------------------------ | -------- | ------------- |
| In-app notifications     | P0       | U-040         |
| Email notifications      | P0       | U-041         |
| Push notifications       | P0       | U-042         |
| Notification preferences | P0       | U-043         |
| Real-time bell updates   | P1       | —             |

---

## Notification Types

| Type                  | Trigger           | Channel       |
| --------------------- | ----------------- | ------------- |
| New post              | Creator publishes | In-app, push  |
| New subscriber        | Fan subscribes    | In-app, email |
| Subscription expiring | 3 days before     | Email         |
| Payment received      | Tip/PPV/sub       | In-app, email |
| New message           | DM received       | In-app, push  |
| KYC approved          | Veriff callback   | Email         |
| Payout sent           | Weekly payout     | Email         |

---

## Database Tables (Already Defined)

- `notifications` ✅

---

## API Endpoints (Estimated)

| Endpoint                          | Method    | Purpose            |
| --------------------------------- | --------- | ------------------ |
| `/api/notifications`              | GET       | List notifications |
| `/api/notifications/unread-count` | GET       | Badge count        |
| `/api/notifications/[id]/read`    | POST      | Mark as read       |
| `/api/notifications/read-all`     | POST      | Mark all read      |
| `/api/notifications/preferences`  | GET/PATCH | Preferences        |

---

## UI Pages (Estimated)

| Page                  | Route                     |
| --------------------- | ------------------------- |
| Notifications List    | `/notifications`          |
| Notification Settings | `/settings/notifications` |
| Bell Icon Component   | Header                    |

---

## Dependencies

- ✅ Auth System
- ✅ User Profiles
- 🟡 All other modules (to trigger notifications)

---

## External Services

| Service              | Purpose            |
| -------------------- | ------------------ |
| SendGrid / Resend    | Email delivery     |
| Firebase / OneSignal | Push notifications |

---

## Status

**⬜ QUEUED** — Will begin after Messaging complete

---

## Notes

- Consider event-driven architecture (pub/sub)
- Batch email notifications to avoid spam
