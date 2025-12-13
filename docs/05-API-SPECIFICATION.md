# NuttyFans — API Specification

**Version:** 1.0  
**Last Updated:** December 12, 2025  
**API Style:** REST with JSON  
**Base URL:** `https://api.nuttyfans.com/v1`

---

## Authentication

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <uuid>
```

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

---

## API Endpoints

### 1. Authentication

#### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "username": "johndoe",
  "dateOfBirth": "1990-01-15",
  "country": "US",
  "acceptTerms": true
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "username": "johndoe"
  },
  "message": "Verification email sent"
}
```

#### POST /auth/login
Authenticate user and return tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### POST /auth/refresh
Refresh access token.

#### POST /auth/logout
Invalidate current session.

#### POST /auth/forgot-password
Request password reset email.

#### POST /auth/reset-password
Reset password with token.

#### POST /auth/verify-email
Verify email with token.

---

### 2. Users

#### GET /users/me
Get current user profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "username": "johndoe",
  "avatarUrl": "https://...",
  "role": "user",
  "walletBalance": 50.00,
  "createdAt": "2024-01-15T00:00:00Z"
}
```

#### PATCH /users/me
Update current user profile.

#### GET /users/:username
Get public user profile.

#### DELETE /users/me
Delete user account (soft delete).

---

### 3. Creators

#### POST /creators/apply
Apply to become a creator.

**Request:**
```json
{
  "bio": "Fitness enthusiast...",
  "categoryId": "uuid",
  "isNsfw": false,
  "subscriptionPrice": 9.99
}
```

#### GET /creators/:username
Get creator public profile.

**Response (200):**
```json
{
  "id": "uuid",
  "username": "fitnessqueen",
  "displayName": "Sarah Fitness",
  "bio": "Fitness enthusiast...",
  "avatarUrl": "https://...",
  "coverImageUrl": "https://...",
  "category": {
    "id": "uuid",
    "name": "Fitness",
    "slug": "fitness"
  },
  "isNsfw": false,
  "isVerified": true,
  "subscriptionPrice": 9.99,
  "subscriberCount": 1250,
  "postCount": 85,
  "isSubscribed": false,
  "isFollowing": true
}
```

#### PATCH /creators/me
Update creator profile.

#### GET /creators/me/analytics
Get creator analytics.

**Query Params:**
- `period`: `7d`, `30d`, `90d`, `all`

**Response (200):**
```json
{
  "revenue": {
    "total": 5000.00,
    "subscriptions": 4000.00,
    "ppv": 800.00,
    "tips": 200.00
  },
  "subscribers": {
    "total": 250,
    "new": 45,
    "churned": 12
  },
  "engagement": {
    "profileViews": 5000,
    "postViews": 25000,
    "likes": 3500
  }
}
```

#### GET /creators/me/subscribers
Get list of subscribers.

#### GET /creators/me/payouts
Get payout history.

---

### 4. Posts

#### GET /posts
Get posts feed.

**Query Params:**
- `type`: `feed`, `explore`, `creator`
- `creatorId`: Filter by creator
- `category`: Filter by category
- `nsfw`: `true`, `false`
- `cursor`: Pagination cursor
- `limit`: 20 (default)

**Response (200):**
```json
{
  "posts": [
    {
      "id": "uuid",
      "creator": {
        "id": "uuid",
        "username": "creator",
        "displayName": "Creator Name",
        "avatarUrl": "https://..."
      },
      "content": "Post caption...",
      "media": [
        {
          "id": "uuid",
          "type": "image",
          "url": "https://...",
          "thumbnailUrl": "https://...",
          "width": 1080,
          "height": 1350
        }
      ],
      "accessLevel": "subscribers",
      "isLocked": true,
      "ppvPrice": null,
      "likeCount": 150,
      "commentCount": 25,
      "isLiked": false,
      "isBookmarked": false,
      "publishedAt": "2024-01-15T12:00:00Z"
    }
  ],
  "nextCursor": "cursor_string",
  "hasMore": true
}
```

#### POST /posts
Create a new post.

**Request:**
```json
{
  "content": "New post caption",
  "mediaIds": ["uuid1", "uuid2"],
  "accessLevel": "subscribers",
  "ppvPrice": null,
  "commentsEnabled": true,
  "scheduledAt": null
}
```

#### GET /posts/:id
Get single post.

#### PATCH /posts/:id
Update post.

#### DELETE /posts/:id
Delete post.

#### POST /posts/:id/like
Like a post.

#### DELETE /posts/:id/like
Unlike a post.

#### POST /posts/:id/bookmark
Bookmark a post.

#### DELETE /posts/:id/bookmark
Remove bookmark.

#### POST /posts/:id/purchase
Purchase PPV post.

---

### 5. Media

#### POST /media/upload-url
Get presigned upload URL.

**Request:**
```json
{
  "filename": "video.mp4",
  "contentType": "video/mp4",
  "fileSize": 52428800
}
```

**Response (200):**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "mediaId": "uuid",
  "expiresAt": "2024-01-15T13:00:00Z"
}
```

#### POST /media/:id/complete
Mark upload as complete and trigger processing.

#### GET /media/:id/status
Get media processing status.

---

### 6. Subscriptions

#### POST /subscriptions
Subscribe to a creator.

**Request:**
```json
{
  "creatorId": "uuid",
  "planType": "monthly"
}
```

**Response (201):**
```json
{
  "subscription": {
    "id": "uuid",
    "creatorId": "uuid",
    "planType": "monthly",
    "pricePaid": 9.99,
    "status": "active",
    "expiresAt": "2024-02-15T00:00:00Z"
  }
}
```

#### GET /subscriptions
Get user's active subscriptions.

#### DELETE /subscriptions/:id
Cancel subscription.

---

### 7. Wallet & Payments

#### GET /wallet
Get wallet balance and history.

**Response (200):**
```json
{
  "balance": 50.00,
  "currency": "USD",
  "transactions": [
    {
      "id": "uuid",
      "type": "subscription",
      "amount": -9.99,
      "description": "Subscription to @creator",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ]
}
```

#### POST /wallet/topup
Add funds to wallet.

**Request:**
```json
{
  "amount": 50.00,
  "paymentMethodId": "pm_xxx"
}
```

#### POST /tips
Send a tip to creator.

**Request:**
```json
{
  "creatorId": "uuid",
  "amount": 10.00,
  "message": "Great content!"
}
```

---

### 8. Messages

#### GET /conversations
Get list of conversations.

#### GET /conversations/:id/messages
Get messages in conversation.

#### POST /conversations/:id/messages
Send a message.

**Request:**
```json
{
  "content": "Hello!",
  "mediaIds": [],
  "ppvPrice": null
}
```

#### POST /conversations/:id/messages/:messageId/purchase
Purchase PPV message.

---

### 9. Notifications

#### GET /notifications
Get user notifications.

**Query Params:**
- `unreadOnly`: `true`, `false`
- `cursor`: Pagination cursor
- `limit`: 20 (default)

#### PATCH /notifications/:id/read
Mark notification as read.

#### POST /notifications/read-all
Mark all notifications as read.

---

### 10. Search & Explore

#### GET /search
Search creators and content.

**Query Params:**
- `q`: Search query
- `type`: `creators`, `posts`, `all`
- `category`: Filter by category
- `nsfw`: `true`, `false`

#### GET /explore/categories
Get all categories.

#### GET /explore/trending
Get trending content.

#### GET /explore/featured
Get featured creators.

---

### 11. Live Streams

#### POST /streams
Create a new live stream.

**Request:**
```json
{
  "title": "Live Q&A",
  "description": "Ask me anything!",
  "accessLevel": "subscribers",
  "entryPrice": null,
  "scheduledAt": "2024-01-20T18:00:00Z"
}
```

**Response (201):**
```json
{
  "stream": {
    "id": "uuid",
    "title": "Live Q&A",
    "streamKey": "sk_xxx",
    "rtmpUrl": "rtmp://live.nuttyfans.com/live",
    "status": "scheduled"
  }
}
```

#### GET /streams/:id
Get stream details.

#### POST /streams/:id/start
Start the stream.

#### POST /streams/:id/end
End the stream.

#### GET /streams/live
Get currently live streams.

---

### 12. Reports & Moderation

#### POST /reports
Submit a report.

**Request:**
```json
{
  "reportedType": "post",
  "reportedId": "uuid",
  "reason": "inappropriate_content",
  "description": "This violates..."
}
```

---

### 13. Admin Endpoints

#### GET /admin/users
List all users (paginated).

#### GET /admin/creators/pending
Get pending KYC applications.

#### POST /admin/creators/:id/approve
Approve creator KYC.

#### POST /admin/creators/:id/reject
Reject creator KYC.

#### GET /admin/reports
Get pending reports.

#### PATCH /admin/reports/:id
Resolve report.

#### GET /admin/analytics
Platform-wide analytics.

#### POST /admin/content/:id/remove
Remove content.

---

## Webhooks

### Stripe Webhooks
**Endpoint:** `POST /webhooks/stripe`

Events handled:
- `payment_intent.succeeded`
- `payment_intent.failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `transfer.created`
- `payout.paid`
- `payout.failed`

### Mux Webhooks
**Endpoint:** `POST /webhooks/mux`

Events handled:
- `video.asset.ready`
- `video.asset.errored`
- `video.live_stream.active`
- `video.live_stream.idle`

---

## Rate Limits

| Endpoint Group | Rate Limit |
|----------------|------------|
| Auth | 5/min |
| General API | 100/min |
| Upload | 10/min |
| Search | 30/min |

---

*This document is confidential and intended for internal use only.*

