# Task: Content/Posts System

**Task ID:** `2025-12-16__CONTENT-POSTS-SYSTEM`  
**Created:** December 16, 2025  
**Priority:** P0  
**Sprint:** 4 (Weeks 7-8)

---

## Problem Statement

Creators need the ability to share content (posts, images, videos) with their subscribers. Users need a feed to discover and engage with content from creators they follow.

---

## Business Goal

Enable the core content loop:

- Creators publish content → Users consume → Users engage (like, bookmark, comment)
- Monetization via PPV and subscription-gated content

---

## Scope

### ✅ In Scope

| Feature                                   | Priority | Notes                            |
| ----------------------------------------- | -------- | -------------------------------- |
| Post creation (text, image, video, mixed) | P0       |                                  |
| Media upload to S3                        | P0       | Presigned URLs                   |
| Video processing with Mux                 | P0       | Transcode, thumbnails            |
| Access levels (free, subscribers, PPV)    | P0       |                                  |
| Post scheduling                           | P0       | Future publish                   |
| Content feed                              | P0       | Chronological from subscriptions |
| Like / Bookmark                           | P0       |                                  |
| Comments                                  | P0       | Elevated from P1                 |
| Stories (24h ephemeral)                   | P0       | Elevated from P1                 |
| Reels (short vertical video)              | P0       | Elevated from P1                 |
| Invisible watermarking                    | P0       |                                  |
| Basic moderation flags                    | P0       |                                  |

### ❌ Out of Scope

| Feature                  | Reason             |
| ------------------------ | ------------------ |
| AI content moderation    | Phase 2            |
| Recommendations/trending | Separate task      |
| Live streaming           | Separate task (P1) |
| Mass DM / post promotion | Phase 2            |

---

## Success Criteria

1. ✅ Creator can create and publish posts with text, images, or videos
2. ✅ Videos are processed via Mux with multiple resolutions
3. ✅ Users see subscribed creators' content in feed
4. ✅ PPV content shows locked preview with unlock button
5. ✅ Like and bookmark functionality works
6. ✅ Comments can be added to posts
7. ✅ Stories expire after 24 hours
8. ✅ Reels are playable in vertical format
9. ✅ Scheduled posts publish at correct time

---

## Dependencies

| Dependency         | Status      |
| ------------------ | ----------- |
| Auth System        | ✅ Complete |
| Creator Foundation | ✅ Complete |
| User Profiles      | ✅ Complete |
| S3/CloudFront      | ✅ Complete |
| Database Schema    | ✅ Complete |
| Mux Account        | ⬜ Required |

---

## Confirmed Decisions

| Decision       | Answer         |
| -------------- | -------------- |
| Video Provider | Mux            |
| Comments       | Include in MVP |
| Stories/Reels  | Include in MVP |
| Watermark      | Invisible only |

---

## Reference Documents

- [PRD Section 3.2](/docs/02-PRD.md) - Content System specs
- [Database Schema](/docs/04-DATABASE-SCHEMA.md) - posts, media, likes, bookmarks tables
- [Sprint 4 Research](/docs/SPRINT-4-CONTENT-POSTS-RESEARCH.md) - Combined PM research
