# Notification System Audit Report

## Executive Summary

The current notification system is **SAFE** for the current stage (MVP) and early growth. The database schema is well-indexed, and frontend polling is implemented responsibly. However, there are minor optimization opportunities and a potential latency issue in the creation flow that should be addressed before scaling.

## ✅ What is Implemented Correctly

### Database & Indexing

- **Composite Index**: The `Notification` table has an optimal composite index `@@index([userId, isRead, createdAt(sort: Desc)])`. This ensures that fetching unread counts and paginated lists is extremely fast and does not scan the table.
- **Foreign Keys**: Proper foreign key constraints with `onDelete: Cascade` ensure data integrity when users are deleted.

### Frontend Architecture

- **Lazy Loading**: The full notification list (`NotificationList`) is only fetched when the user opens the notification popover (or visits the page). It does **not** poll in the background when closed.
- **Efficient Polling**: The background polling (`useUnreadNotificationCount`) only fetches the _count_ (a lightweight integer), not the full list.
- **Polling Interval**: The interval is set to 20 seconds, which is a reasonable balance for an MVP.

### Security

- **Authorization**: API endpoints verify `session.user.id` before processing requests.
- **Data Isolation**: Queries are strictly scoped to the authenticated `userId`.

## ⚠️ Risks & Observations (Acceptable for MVP)

### 1. Synchronous Email/Push Sending

- **Observation**: `NotificationService.create` awaits `sendEmailNotificationIfEnabled` and `sendPushNotificationIfEnabled`.
- **Risk**: Creating a notification (e.g., on a new comment) will block the response until external email/push services respond. If Resend or the Push service is slow, the user experience will degrade.
- **Recommendation**: Move email/push dispatch to a background queue (e.g., BullMQ or Inngest) as soon as possible.

### 2. Polling Interval

- **Observation**: Polling is set to 20s.
- **Risk**: With 10k concurrent users, this is 500 requests/second.
- **Mitigation**: The query is highly optimized (index-only scan for count). Postgres can handle this, but caching the count in Redis would be the next step.

## ❌ Critical Fixes Required

_None found. The system is safe for deployment._

## 🔁 Recommendations & Roadmap

### Immediate (Next Sprint)

1.  **Background Jobs**: Decouple email/push sending from the request loop.
2.  **Batch Mark-Read**: Ensure the frontend calls `markAsRead` optimistically or in batches if a user clicks multiple items quickly.

### Scale (10k+ DAU)

1.  **Redis Caching**: Cache the unread count in Redis and invalidate it only when a new notification is created. This eliminates the polling load on Postgres.
2.  **SSE / WebSockets**: Switch to Server-Sent Events (SSE) for real-time delivery to remove polling entirely.

## Conclusion

**STATUS: GO**
The system is architecturally sound for the current phase.
