# Task: Messaging System

**Task ID:** `2025-12-16__MESSAGING-SYSTEM`  
**Created:** December 16, 2025  
**Priority:** P0  
**Sprint:** 6 (Weeks 11-12)

---

## Problem Statement

Users need a way to communicate directly with creators. Creators need a way to monetize direct interactions through paid messages.

---

## Business Goal

Increase user engagement and retention through direct communication. Enable a new revenue stream via paid DMs.

---

## Scope

### ✅ In Scope

| Feature                 | Priority | Notes               |
| ----------------------- | -------- | ------------------- |
| Conversation list       | P0       | Inbox view          |
| Real-time messaging     | P0       | WebSocket / Polling |
| Media sharing in DMs    | P0       | Images/Videos (S3)  |
| Paid messages (PPV DMs) | P0       | Unlock to view      |
| Message read receipts   | P1       | "Seen" status       |
| Blocking users          | P0       | Prevent harassment  |
| Message moderation      | P1       | Report messages     |

### ❌ Out of Scope

| Feature               | Reason  |
| --------------------- | ------- |
| Group chats           | Phase 2 |
| Audio/Video calls     | Phase 2 |
| Message search        | Phase 2 |
| Disappearing messages | Phase 2 |

---

## Success Criteria

1. ✅ Users can start conversations with creators
2. ✅ Messages are delivered in real-time (or near real-time)
3. ✅ Users can send images/videos in DMs
4. ✅ Creators can send paid messages that require unlock
5. ✅ Users can block other users
6. ✅ Unread message counts are accurate

---

## Dependencies

| Dependency             | Status                                       |
| ---------------------- | -------------------------------------------- |
| Auth System            | ✅ Complete                                  |
| User Profiles          | ✅ Complete                                  |
| Subscriptions/Payments | ✅ Complete (Required for paid DMs)          |
| Database Schema        | ✅ Complete (conversations, messages tables) |

---

## Reference Documents

- [PRD Section 3.4](/docs/02-PRD.md) - Communication System
- [Database Schema](/docs/04-DATABASE-SCHEMA.md) - conversations, messages, blocks
- [Sprint 6 Queue](/docs/SPRINT-6-MESSAGING-QUEUE.md) - Initial research
