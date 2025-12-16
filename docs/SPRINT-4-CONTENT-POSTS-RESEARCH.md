# Sprint 4 Combined Task Research: Content/Posts System

**Sprint:** 4 (Weeks 7-8)  
**Focus:** Content System Foundation  
**Prepared By:** Product Operations Agent  
**Date:** 2025-12-16

---

## 📋 Executive Summary

This document consolidates all **Content/Posts System** features into ONE combined task. This is the next P0 priority after Creator Foundation completion.

---

## 🎯 Combined Task: CONTENT-POSTS-SYSTEM

**Proposed Task ID:** `2025-12-16__CONTENT-POSTS-SYSTEM`

### Scope — All Content Features Combined

| Sub-Feature                                 | Priority | PRD Reference       |
| ------------------------------------------- | -------- | ------------------- |
| Post Creation (text, image, video, mixed)   | P0       | C-010, C-011, C-012 |
| Media Upload to S3                          | P0       | C-010, C-011        |
| Access Level Control (free/subscribers/PPV) | P0       | C-013, C-014        |
| Post Scheduling                             | P0       | C-015               |
| Content Feed (subscribed creators)          | P0       | U-010               |
| Like/Bookmark functionality                 | P0       | U-030, U-032        |
| **Comments System**                         | P0       | U-031               |
| Post Detail View                            | P0       | —                   |
| Basic Moderation (status flags)             | P0       | —                   |
| Video Processing Pipeline (**Mux**)         | P0       | PRD 3.2.2           |
| **Stories (24h ephemeral)**                 | P0       | C-016               |
| **Reels (short vertical video)**            | P0       | C-018               |
| Dynamic Watermarking (invisible)            | P0       | C-042               |

### Why Combine?

1. **End-to-End Flow:** Post creation → Media upload → Processing → Feed display
2. **Tight Integration:** Posts, media, likes, bookmarks are interdependent
3. **Single Architecture:** One review covers entire content pipeline
4. **User Value:** Creators can't earn without content; users can't engage without feed

---

## 📊 Functional Requirements

### FR-1: Post Creation

| Requirement              | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| **Post Types**           | Text, Image, Video, Mixed (combination)                           |
| **Content Field**        | Rich text, max 5000 characters, markdown support                  |
| **Media Attachment**     | 1-10 images OR 1 video per post                                   |
| **Access Levels**        | `free` (anyone), `subscribers` (subs only), `ppv` (pay to unlock) |
| **PPV Pricing**          | $1 - $500 range                                                   |
| **Scheduling**           | Optional future publish timestamp                                 |
| **Comments Toggle**      | Enable/disable comments per post                                  |
| **NSFW Flag**            | Mark content as NSFW                                              |
| **Draft/Publish States** | `draft`, `scheduled`, `published`, `archived`                     |

### FR-2: Media Upload & Processing

| Requirement            | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| **Image Formats**      | JPG, PNG, GIF, WebP                                           |
| **Image Max Size**     | 20MB per image                                                |
| **Video Formats**      | MP4, MOV, WebM                                                |
| **Video Max Size**     | 5GB                                                           |
| **Video Max Duration** | 60 minutes                                                    |
| **Processing**         | Generate thumbnails, multiple resolutions (480p, 720p, 1080p) |
| **Storage**            | S3 with CloudFront CDN                                        |
| **Processing Status**  | `pending` → `processing` → `completed` / `failed`             |

### FR-3: Video Processing Pipeline

```
Upload → S3 (raw) → Queue (SQS/background job) → Transcode → Store (S3 + CDN)
                                                      ↓
                                               Generate:
                                               - 480p, 720p, 1080p
                                               - Thumbnail
                                               - Preview clip
                                               - Watermarked versions
```

**Provider:** **Mux** ✅ (Confirmed)

- Managed video platform
- $0.0055/min watched
- Simple integration via API
- Automatic transcoding, thumbnails, previews

### FR-4: Content Feed

| Requirement        | Description                                  |
| ------------------ | -------------------------------------------- |
| **Feed Type**      | Chronological from subscribed creators       |
| **Access Control** | Free posts visible to all; paid posts locked |
| **PPV Preview**    | Show blurred thumbnail + unlock button       |
| **Pagination**     | Cursor-based infinite scroll                 |
| **Caching**        | Redis cache for feed queries                 |

### FR-5: Like & Bookmark

| Requirement       | Description                                      |
| ----------------- | ------------------------------------------------ |
| **Like**          | Toggle like on post, increment/decrement counter |
| **Bookmark**      | Save post to user's saved collection             |
| **Optimistic UI** | Immediate UI update, background sync             |

### FR-6: Content Watermarking

| Requirement    | Description                                       |
| -------------- | ------------------------------------------------- |
| **Mode**       | **Invisible only** ✅ (Confirmed)                 |
| **Components** | Platform domain, creator username, viewer ID hash |
| **Images**     | Invisible steganographic watermark                |
| **Videos**     | Invisible watermark embedded in frames            |
| **Purpose**    | Trace content leaks back to source                |

---

## 🗄️ Database Tables (Already Defined)

| Table            | Purpose                            | Schema Status |
| ---------------- | ---------------------------------- | ------------- |
| `posts`          | Post content, access level, status | ✅ Defined    |
| `media`          | Media files (images, videos)       | ✅ Defined    |
| `likes`          | User likes on posts                | ✅ Defined    |
| `bookmarks`      | User saved posts                   | ✅ Defined    |
| `post_analytics` | Views, engagement metrics          | ✅ Defined    |

---

## 🔌 API Endpoints Required

### Post Management (Creator)

| Endpoint                   | Method | Purpose              |
| -------------------------- | ------ | -------------------- |
| `/api/posts`               | POST   | Create new post      |
| `/api/posts`               | GET    | List creator's posts |
| `/api/posts/[id]`          | GET    | Get post details     |
| `/api/posts/[id]`          | PATCH  | Update post          |
| `/api/posts/[id]`          | DELETE | Delete post          |
| `/api/posts/[id]/publish`  | POST   | Publish draft        |
| `/api/posts/[id]/schedule` | POST   | Schedule post        |

### Media Management

| Endpoint                 | Method | Purpose                          |
| ------------------------ | ------ | -------------------------------- |
| `/api/media/upload-url`  | POST   | Get presigned S3 upload URL      |
| `/api/media/confirm`     | POST   | Confirm upload, start processing |
| `/api/media/[id]/status` | GET    | Check processing status          |

### Feed (User)

| Endpoint            | Method | Purpose                   |
| ------------------- | ------ | ------------------------- |
| `/api/feed`         | GET    | Get user's content feed   |
| `/api/feed/explore` | GET    | Get explore/discover feed |

### Engagement

| Endpoint                   | Method | Purpose              |
| -------------------------- | ------ | -------------------- |
| `/api/posts/[id]/like`     | POST   | Toggle like          |
| `/api/posts/[id]/bookmark` | POST   | Toggle bookmark      |
| `/api/user/bookmarks`      | GET    | Get bookmarked posts |

### Public

| Endpoint                             | Method | Purpose                  |
| ------------------------------------ | ------ | ------------------------ |
| `/api/public/creator/[handle]/posts` | GET    | Public posts for creator |

---

## 🖼️ UI Pages Required

### Creator Pages

| Page            | Route                             | Purpose                |
| --------------- | --------------------------------- | ---------------------- |
| Create Post     | `/creator/posts/new`              | Post creation form     |
| Edit Post       | `/creator/posts/[id]/edit`        | Edit existing post     |
| My Posts        | `/creator/posts`                  | List all creator posts |
| Draft Posts     | `/creator/posts?status=draft`     | Filter drafts          |
| Scheduled Posts | `/creator/posts?status=scheduled` | Filter scheduled       |

### User Pages

| Page        | Route          | Purpose           |
| ----------- | -------------- | ----------------- |
| Home Feed   | `/feed` or `/` | Main content feed |
| Post Detail | `/post/[id]`   | Single post view  |
| Bookmarks   | `/bookmarks`   | Saved posts       |

### Shared Components

| Component        | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `PostCard`       | Feed item display (preview, locked state) |
| `PostDetail`     | Full post view with media                 |
| `MediaUploader`  | Multi-file upload with progress           |
| `MediaGallery`   | Image carousel / video player             |
| `LikeButton`     | Animated like toggle                      |
| `BookmarkButton` | Bookmark toggle                           |
| `PPVUnlockModal` | Purchase modal for locked content         |

---

## ⚠️ Risks & Considerations

| Risk                        | Impact | Mitigation                              |
| --------------------------- | ------ | --------------------------------------- |
| Video processing costs      | High   | Start with Mux free tier, monitor usage |
| Large file uploads          | Medium | Use chunked uploads, presigned URLs     |
| Content moderation at scale | High   | Start with manual review, add AI later  |
| CDN costs                   | Medium | Implement proper caching strategies     |

---

## ✅ Confirmed Decisions

| Decision           | Answer         | Notes                            |
| ------------------ | -------------- | -------------------------------- |
| **Video Provider** | Mux            | ✅ Managed platform, $0.0055/min |
| **Comments**       | Include in MVP | ✅ Elevated from P1 to P0        |
| **Stories/Reels**  | Include now    | ✅ Elevated from P1 to P0        |
| **Watermark**      | Invisible only | ✅ No visible overlay            |

---

## 🔗 Dependencies

| Dependency         | Status          | Notes                                 |
| ------------------ | --------------- | ------------------------------------- |
| Auth System        | ✅ Complete     | Required for access control           |
| Creator Foundation | ✅ Complete     | Required for creator_id               |
| User Profiles      | ✅ Complete     | Required for feed personalization     |
| S3 Infrastructure  | ✅ **Complete** | 3 environments configured in .env     |
| CDN (CloudFront)   | ✅ **Complete** | Configured in .env                    |
| Database Schema    | ✅ Complete     | Posts, media, likes, bookmarks tables |

---

## 📅 Estimated Timeline

| Phase                           | Duration       | Owner            |
| ------------------------------- | -------------- | ---------------- |
| Architecture Review             | 2 days         | Engineering Lead |
| UI/UX Design                    | 2 days         | UI/UX Agent      |
| Backend (Posts + Media APIs)    | 5 days         | Backend Agent    |
| Video Processing Integration    | 3 days         | Backend Agent    |
| Frontend (Creator + User pages) | 5 days         | Frontend Agent   |
| Integration                     | 2 days         | Both             |
| QA Testing                      | 3 days         | QA Agent         |
| **Total**                       | **~3–4 weeks** |                  |

---

## ✅ Success Criteria

1. Creator can create and publish posts with images/videos
2. Media uploads process and generate multiple resolutions
3. Users see content feed from subscribed creators
4. PPV content shows locked preview with unlock button
5. Like and bookmark functionality works
6. Scheduled posts publish at correct time
7. Draft posts save without publishing

---

## 📝 Next Steps

1. **Human:** Resolve open questions (video provider, comments scope)
2. **Engineering Lead:** Create `02-ARCHITECTURE-REVIEW.mdc`
3. **UI/UX Agent:** Design post creation and feed UI
4. **Engineering:** Implement after approval
