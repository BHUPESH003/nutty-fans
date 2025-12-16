# Sprint 6 Task Queue: Messaging System

**Sprint:** 6 (Weeks 11-12)  
**Priority:** P0 — Queued after Subscriptions/Payments  
**Prepared By:** Product Operations Agent  
**Date:** 2025-12-16

---

## 📋 Overview

Direct messaging between fans and creators, including paid messages.

---

## Scope

| Feature             | Priority | PRD Reference |
| ------------------- | -------- | ------------- |
| Conversations list  | P0       | U-033         |
| Real-time messaging | P0       | U-033         |
| Media in messages   | P0       | U-033         |
| Paid messages       | P1       | U-034, C-023  |
| Read receipts       | P1       | —             |
| Block user in DMs   | P0       | C-040         |
| Message moderation  | P1       | —             |

---

## Database Tables (Already Defined)

- `conversations` ✅
- `messages` ✅
- `blocks` ✅

---

## API Endpoints (Estimated)

| Endpoint                           | Method   | Purpose            |
| ---------------------------------- | -------- | ------------------ |
| `/api/conversations`               | GET      | List conversations |
| `/api/conversations/[id]`          | GET      | Get conversation   |
| `/api/conversations/[id]/messages` | GET/POST | Messages           |
| `/api/conversations/[id]/read`     | POST     | Mark as read       |
| `/api/messages/[id]`               | DELETE   | Delete message     |

---

## UI Pages (Estimated)

| Page         | Route            |
| ------------ | ---------------- |
| Inbox        | `/messages`      |
| Conversation | `/messages/[id]` |
| New Message  | `/messages/new`  |

---

## Dependencies

- ✅ Auth System
- ✅ User Profiles
- 🟡 Subscriptions/Payments (for paid DMs)

---

## Status

**⬜ QUEUED** — Will begin after Subscriptions/Payments complete

---

## Notes

- Consider WebSocket for real-time
- May use Pusher or Ably for simplicity
