# NuttyFans — Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** December 12, 2025  
**Document Owner:** Product Team  
**Status:** Draft for Review

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Stories & Requirements](#2-user-stories--requirements)
3. [Feature Specifications](#3-feature-specifications)
4. [User Flows](#4-user-flows)
5. [Acceptance Criteria](#5-acceptance-criteria)
6. [Edge Cases & Error Handling](#6-edge-cases--error-handling)
7. [Non-Functional Requirements](#7-non-functional-requirements)

---

## 1. Product Overview

### 1.1 Product Summary

NuttyFans is a creator monetization platform enabling content creators to earn through subscriptions, PPV, tips, and more. The platform supports both SFW and adult content with strict category segregation.

### 1.2 Product Principles

| Principle              | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| **Creator-First**      | Features prioritize creator earning potential                        |
| **Premium Experience** | Clean, editorial aesthetic inspired by Hidden.com                    |
| **Trust & Safety**     | Robust verification and moderation                                   |
| **Fair Economics**     | Tiered commission (default 4–16% by subscriber tier), weekly payouts |
| **Mobile-Ready**       | PWA-first responsive design                                          |

### 1.3 Target Users

| User Type      | Description                            |
| -------------- | -------------------------------------- |
| **Creators**   | Content producers seeking monetization |
| **Fans/Users** | Content consumers supporting creators  |
| **Admins**     | Platform operators managing the system |

---

## 2. User Stories & Requirements

### 2.1 User (Fan) Stories

#### 2.1.1 Account Management

| ID    | Story                                                                        | Priority |
| ----- | ---------------------------------------------------------------------------- | -------- |
| U-001 | As a user, I want to register with email/password so I can create an account | P0       |
| U-002 | As a user, I want to sign in with Google/Apple so I can register quickly     | P0       |
| U-003 | As a user, I want to verify I'm 18+ so I can access the platform             | P0       |
| U-004 | As a user, I want to edit my profile so others can learn about me            | P1       |
| U-005 | As a user, I want to enable 2FA so my account is secure                      | P1       |
| U-006 | As a user, I want to delete my account so I can leave the platform           | P0       |

#### 2.1.2 Content Discovery

| ID    | Story                                                                           | Priority |
| ----- | ------------------------------------------------------------------------------- | -------- |
| U-010 | As a user, I want to browse my feed so I can see content from creators I follow | P0       |
| U-011 | As a user, I want to explore by category so I can discover new creators         | P0       |
| U-012 | As a user, I want to see trending content so I can find popular creators        | P0       |
| U-013 | As a user, I want to search for creators so I can find specific people          | P0       |
| U-014 | As a user, I want AI recommendations so I can discover relevant content         | P1       |
| U-015 | As a user, I want to filter SFW/NSFW so I can control what I see                | P0       |

#### 2.1.3 Subscriptions & Payments

| ID    | Story                                                                     | Priority |
| ----- | ------------------------------------------------------------------------- | -------- |
| U-020 | As a user, I want to subscribe to a creator so I can access their content | P0       |
| U-021 | As a user, I want to purchase PPV content so I can unlock specific posts  | P0       |
| U-022 | As a user, I want to tip creators so I can show appreciation              | P0       |
| U-023 | As a user, I want to manage my subscriptions so I can control my spending | P0       |
| U-024 | As a user, I want to add funds to my wallet so I can make purchases       | P0       |
| U-025 | As a user, I want to view my transaction history so I can track spending  | P0       |
| U-026 | As a user, I want to purchase subscription bundles so I can save money    | P1       |

#### 2.1.4 Engagement

| ID    | Story                                                                  | Priority |
| ----- | ---------------------------------------------------------------------- | -------- |
| U-030 | As a user, I want to like posts so I can show appreciation             | P0       |
| U-031 | As a user, I want to comment on posts so I can interact with content   | P1       |
| U-032 | As a user, I want to bookmark posts so I can find them later           | P0       |
| U-033 | As a user, I want to message creators so I can communicate directly    | P0       |
| U-034 | As a user, I want to send paid messages so I can get creator attention | P1       |
| U-035 | As a user, I want to watch live streams so I can interact in real-time | P1       |
| U-036 | As a user, I want to tip during live streams so I can support creators | P1       |

#### 2.1.5 Notifications

| ID    | Story                                                                    | Priority |
| ----- | ------------------------------------------------------------------------ | -------- |
| U-040 | As a user, I want in-app notifications so I know about new content       | P0       |
| U-041 | As a user, I want email notifications so I stay informed                 | P0       |
| U-042 | As a user, I want push notifications so I don't miss content             | P0       |
| U-043 | As a user, I want to manage notification preferences so I control alerts | P0       |

### 2.2 Creator Stories

#### 2.2.1 Onboarding

| ID    | Story                                                                   | Priority |
| ----- | ----------------------------------------------------------------------- | -------- |
| C-001 | As a creator, I want to apply to become a creator so I can monetize     | P0       |
| C-002 | As a creator, I want to complete KYC verification so I can get approved | P0       |
| C-003 | As a creator, I want to set up my profile so fans can find me           | P0       |
| C-004 | As a creator, I want to choose my category so I'm properly classified   | P0       |
| C-005 | As a creator, I want to set my subscription price so I can earn         | P0       |

#### 2.2.2 Content Management

| ID    | Story                                                                     | Priority |
| ----- | ------------------------------------------------------------------------- | -------- |
| C-010 | As a creator, I want to upload images so I can share visual content       | P0       |
| C-011 | As a creator, I want to upload videos so I can share video content        | P0       |
| C-012 | As a creator, I want to write text posts so I can share updates           | P0       |
| C-013 | As a creator, I want to set posts as free/paid so I can control access    | P0       |
| C-014 | As a creator, I want to set PPV prices so I can monetize individual posts | P0       |
| C-015 | As a creator, I want to schedule posts so I can plan content              | P0       |
| C-016 | As a creator, I want to post stories so I can share ephemeral content     | P1       |
| C-017 | As a creator, I want to create highlights so I can feature stories        | P1       |
| C-018 | As a creator, I want to post short videos so I can create reels           | P1       |
| C-019 | As a creator, I want to go live so I can stream to subscribers            | P1       |

#### 2.2.3 Monetization

| ID    | Story                                                                   | Priority |
| ----- | ----------------------------------------------------------------------- | -------- |
| C-020 | As a creator, I want to receive subscription payments so I can earn     | P0       |
| C-021 | As a creator, I want to receive PPV payments so I earn per content      | P0       |
| C-022 | As a creator, I want to receive tips so I can earn from appreciation    | P0       |
| C-023 | As a creator, I want to create paid DMs so I can monetize messaging     | P1       |
| C-024 | As a creator, I want to set up content bundles so I can offer deals     | P1       |
| C-025 | As a creator, I want to sell digital products so I can diversify income | P1       |
| C-026 | As a creator, I want weekly payouts so I get paid quickly               | P0       |

#### 2.2.4 Analytics & Management

| ID    | Story                                                               | Priority |
| ----- | ------------------------------------------------------------------- | -------- |
| C-030 | As a creator, I want to view my revenue so I can track earnings     | P0       |
| C-031 | As a creator, I want to see subscriber count so I can track growth  | P0       |
| C-032 | As a creator, I want post analytics so I can see what performs      | P0       |
| C-033 | As a creator, I want audience insights so I understand my fans      | P1       |
| C-034 | As a creator, I want to view payout history so I can track payments | P0       |
| C-035 | As a creator, I want to export data so I can analyze externally     | P1       |

#### 2.2.5 Privacy & Safety

| ID    | Story                                                              | Priority |
| ----- | ------------------------------------------------------------------ | -------- |
| C-040 | As a creator, I want to block users so I can prevent harassment    | P0       |
| C-041 | As a creator, I want to block regions so I can control visibility  | P0       |
| C-042 | As a creator, I want watermarked content so leaks are traceable    | P0       |
| C-043 | As a creator, I want to report users so I can flag bad actors      | P0       |
| C-044 | As a creator, I want to hide content from search so I stay private | P1       |

### 2.3 Admin Stories

| ID    | Story                                                                    | Priority |
| ----- | ------------------------------------------------------------------------ | -------- |
| A-001 | As an admin, I want to review KYC applications so I can approve creators | P0       |
| A-002 | As an admin, I want to manage users so I can handle issues               | P0       |
| A-003 | As an admin, I want to moderate content so I can enforce policies        | P0       |
| A-004 | As an admin, I want to handle reports so I can resolve disputes          | P0       |
| A-005 | As an admin, I want to view platform analytics so I can monitor health   | P0       |
| A-006 | As an admin, I want to manage categories so I can organize content       | P0       |
| A-007 | As an admin, I want to process DMCA requests so I can handle takedowns   | P0       |
| A-008 | As an admin, I want financial reports so I can track revenue             | P0       |

---

## 3. Feature Specifications

### 3.1 Authentication System

#### 3.1.1 Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Landing   │───▶│  Age Gate   │───▶│   Sign Up   │         │
│  │    Page     │    │   (18+)     │    │    Form     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                               │                 │
│                                               ▼                 │
│                     ┌─────────────┐    ┌─────────────┐         │
│                     │   Email     │◀───│   Verify    │         │
│                     │   Confirm   │    │   Email     │         │
│                     └─────────────┘    └─────────────┘         │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Feed      │◀───│   Onboard   │◀───│  Category   │         │
│  │   (Home)    │    │   Profile   │    │   Prefs     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Fields:**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Email | String | Valid email format | Yes |
| Password | String | Min 8 chars, 1 upper, 1 number | Yes |
| Display Name | String | 2-30 characters | Yes |
| Date of Birth | Date | Must be 18+ | Yes |
| Country | Select | From approved list | Yes |
| Terms Acceptance | Boolean | Must be true | Yes |

**Social Login Options:**

- Google OAuth 2.0
- Apple Sign In
- Twitter OAuth (future)

#### 3.1.2 Creator Verification (KYC)

**Required Documents:**

1. Government-issued ID (passport, driver's license, national ID)
2. Selfie holding ID
3. Proof of address (utility bill, bank statement - within 3 months)

**Verification Process:**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Submit    │───▶│   AI       │───▶│   Manual    │───▶│  Decision   │
│   Documents │    │   Review   │    │   Review    │    │  Approved/  │
│             │    │   (Auto)   │    │   (Human)   │    │  Rejected   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                                     │
                          │ Auto-approve                        │
                          │ (high confidence)                   │
                          └─────────────────────────────────────┘
```

**KYC Provider Integration:**

- Primary: Jumio or Onfido
- Fallback: Manual review team

### 3.2 Content System

#### 3.2.1 Post Types

| Type      | Description          | Max Size   | Formats             |
| --------- | -------------------- | ---------- | ------------------- |
| **Image** | Single or gallery    | 20MB/image | JPG, PNG, GIF, WebP |
| **Video** | Short or long form   | 5GB        | MP4, MOV, WebM      |
| **Text**  | Text-only posts      | 5000 chars | Markdown            |
| **Mixed** | Combination          | Per type   | All above           |
| **Story** | 24h ephemeral        | 50MB       | Image/Video         |
| **Reel**  | Short vertical video | 500MB      | MP4 (max 3 min)     |

#### 3.2.2 Post Creation

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Content | Mixed | Yes | Media + text |
| Caption | Text | No | Post description |
| Access Level | Enum | Yes | Free/Subscribers/PPV |
| PPV Price | Decimal | If PPV | $1-500 |
| Schedule | DateTime | No | Future publish time |
| Comments | Boolean | Yes | Allow comments |
| Category | Enum | Yes | Content category |

**Video Processing Pipeline:**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │───▶│   Queue     │───▶│  Transcode  │───▶│   Store     │
│   (S3)      │    │   (SQS)     │    │  (Lambda/   │    │   (S3+CDN)  │
│             │    │             │    │   FFmpeg)   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │  Generate   │
                                      │  - 480p     │
                                      │  - 720p     │
                                      │  - 1080p    │
                                      │  - 4K (opt) │
                                      │  - Thumb    │
                                      │  - Preview  │
                                      └─────────────┘
```

#### 3.2.3 Content Watermarking

**Dynamic Watermark Components:**

- Platform domain: `nuttyfans.com`
- Creator username: `@creator_username`
- Viewer ID: `user_[hash]`
- Timestamp: `YYYY-MM-DD HH:MM`

**Watermark Placement:**

- Images: Diagonal tiled pattern (semi-transparent)
- Videos: Burned into video frames
- Live Streams: Real-time overlay

### 3.3 Monetization System

#### 3.3.1 Subscription Tiers

| Setting         | Range           | Default |
| --------------- | --------------- | ------- |
| Monthly Price   | $4.99 - $49.99  | $9.99   |
| 3-Month Bundle  | 5-20% discount  | 10%     |
| 6-Month Bundle  | 10-30% discount | 20%     |
| 12-Month Bundle | 15-40% discount | 30%     |
| Free Trial      | 0-30 days       | 0 days  |

#### 3.3.2 PPV Pricing

| Content Type    | Min Price | Max Price |
| --------------- | --------- | --------- |
| Image/Gallery   | $1        | $100      |
| Video (<10 min) | $3        | $200      |
| Video (>10 min) | $5        | $500      |
| Message/DM      | $1        | $100      |

#### 3.3.3 Tipping

| Feature       | Specification              |
| ------------- | -------------------------- |
| Min Tip       | $1                         |
| Max Tip       | $500 per transaction       |
| Tip Jar Goals | Optional creator-set goals |
| Tip Messages  | Optional message with tip  |

#### 3.3.4 Revenue Distribution

```
User Payment: $100.00
├── Platform Commission (15%):     $15.00
├── Payment Processing (3%):       $3.00 (absorbed by platform)
├── Creator Earnings:              $85.00
└── Payout (weekly):               $85.00 (minus any holds)
```

### 3.4 Messaging System

#### 3.4.1 Message Types

| Type        | Description                 | Cost             |
| ----------- | --------------------------- | ---------------- |
| **Free DM** | Basic text message          | Free             |
| **Paid DM** | Message with payment        | Creator-set      |
| **Mass DM** | Broadcast to subscribers    | Free for creator |
| **PPV DM**  | Message with locked content | Creator-set      |

#### 3.4.2 Messaging Features

| Feature         | Description          |
| --------------- | -------------------- |
| Text            | Rich text with emoji |
| Media           | Images and videos    |
| Voice Notes     | Audio messages       |
| Read Receipts   | Delivery/read status |
| Reactions       | Emoji reactions      |
| Reply Threading | Quote replies        |

### 3.5 Live Streaming

#### 3.5.1 Stream Types

| Type             | Description           | Access        |
| ---------------- | --------------------- | ------------- |
| **Free Stream**  | Open to all followers | Anyone        |
| **Sub-Only**     | Subscribers only      | Subscribers   |
| **Paid Entry**   | One-time fee to watch | Paying users  |
| **Private Show** | 1-on-1 or small group | By invitation |

#### 3.5.2 Stream Features

| Feature      | Description                  |
| ------------ | ---------------------------- |
| Live Chat    | Real-time text chat          |
| Tip Alerts   | On-screen tip notifications  |
| Goals        | Live tip goals with progress |
| Co-Streaming | Multiple creators            |
| Recording    | Auto-record for replay       |
| Screen Share | Share screen content         |

#### 3.5.3 Technical Specs

| Spec         | Requirement           |
| ------------ | --------------------- |
| Protocol     | WebRTC / RTMP ingest  |
| Quality      | Up to 1080p60         |
| Latency      | <3 seconds            |
| Max Duration | 4 hours               |
| CDN          | Multi-region delivery |

### 3.6 Explore & Discovery

#### 3.6.1 Explore Page Sections

```
┌─────────────────────────────────────────────────────────────────┐
│                       EXPLORE PAGE                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [Search Bar]                                      🔍     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Categories:  [All] [Fitness] [Art] [Education] [Adult] [...]  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🔥 TRENDING NOW                                           ││
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  ││
│  │  │     │ │     │ │     │ │     │ │     │  ←→              ││
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ⭐ FEATURED CREATORS                                      ││
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          ││
│  │  │     │ │     │ │     │ │     │                          ││
│  │  └─────┘ └─────┘ └─────┘ └─────┘                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  💡 RECOMMENDED FOR YOU                                    ││
│  │  ┌───────────────────┐ ┌───────────────────┐              ││
│  │  │                   │ │                   │              ││
│  │  │   Post Card       │ │   Post Card       │              ││
│  │  │                   │ │                   │              ││
│  │  └───────────────────┘ └───────────────────┘              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### 3.6.2 Recommendation Algorithm

**Factors:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Category Match | 30% | User's category preferences |
| Engagement Score | 25% | Likes, comments, subscriptions |
| Recency | 15% | Newer content preferred |
| Creator Popularity | 15% | Subscriber count, growth |
| Similar Users | 10% | What similar users like |
| Diversity | 5% | Ensure variety in feed |

### 3.7 Analytics Dashboard (Creator)

#### 3.7.1 Overview Metrics

| Metric        | Description                | Timeframes        |
| ------------- | -------------------------- | ----------------- |
| Total Revenue | Earnings before commission | 7d, 30d, 90d, All |
| Net Earnings  | After platform commission  | 7d, 30d, 90d, All |
| Subscribers   | Current active subscribers | Current           |
| New Subs      | New subscriptions          | 7d, 30d           |
| Churned Subs  | Cancelled subscriptions    | 7d, 30d           |
| Profile Views | Unique profile visitors    | 7d, 30d           |

#### 3.7.2 Content Analytics

| Metric          | Description                |
| --------------- | -------------------------- |
| Post Views      | Total views per post       |
| Engagement Rate | Likes + Comments / Views   |
| PPV Purchases   | Number of unlocks          |
| Top Posts       | Highest performing content |
| Best Times      | Optimal posting times      |

#### 3.7.3 Audience Insights

| Metric         | Description                 |
| -------------- | --------------------------- |
| Demographics   | Age, gender, location       |
| Active Times   | When subscribers are online |
| Retention      | Subscriber retention rate   |
| Lifetime Value | Average subscriber LTV      |

---

## 4. User Flows

### 4.1 User Registration Flow

```
START
  │
  ▼
┌─────────────────┐     ┌─────────────────┐
│  Landing Page   │────▶│  "Join" Button  │
└─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Age Gate Modal │
                        │  "Are you 18+?" │
                        └─────────────────┘
                         │             │
                     Yes ▼             ▼ No
               ┌─────────────┐  ┌─────────────┐
               │ Registration│  │   Blocked   │
               │    Form     │  │   Access    │
               └─────────────┘  └─────────────┘
                      │
                      ▼
               ┌─────────────────┐
               │  Email/Password │
               │       OR        │
               │  Social Login   │
               └─────────────────┘
                      │
                      ▼
               ┌─────────────────┐
               │ Email Verify    │
               │ (Link Sent)     │
               └─────────────────┘
                      │
                      ▼
               ┌─────────────────┐
               │ Category Prefs  │
               │ (SFW/NSFW)      │
               └─────────────────┘
                      │
                      ▼
               ┌─────────────────┐
               │ Profile Setup   │
               │ (Optional)      │
               └─────────────────┘
                      │
                      ▼
                    HOME
```

### 4.2 Creator Subscription Flow

```
START (User on Creator Profile)
  │
  ▼
┌─────────────────┐
│ "Subscribe"     │
│  Button         │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Subscription    │
│ Options Modal   │
│                 │
│ ○ 1 Month: $X   │
│ ○ 3 Month: $Y   │
│ ○ 6 Month: $Z   │
└─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Wallet Balance  │────▶│ Sufficient?     │
│ Check           │     │                 │
└─────────────────┘     └─────────────────┘
                         │             │
                     Yes ▼             ▼ No
               ┌─────────────┐  ┌─────────────┐
               │  Confirm    │  │  Add Funds  │
               │  Purchase   │  │  Modal      │
               └─────────────┘  └─────────────┘
                      │                │
                      │         ┌──────┘
                      ▼         ▼
               ┌─────────────────┐
               │ Payment         │
               │ Processing      │
               └─────────────────┘
                      │
                ┌─────┴─────┐
            Success     Failed
                │           │
                ▼           ▼
         ┌──────────┐ ┌──────────┐
         │ Access   │ │ Error    │
         │ Granted  │ │ Message  │
         └──────────┘ └──────────┘
```

### 4.3 Content Upload Flow (Creator)

```
START
  │
  ▼
┌─────────────────┐
│  "+" Create     │
│  Button         │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Content Type    │
│ Selection       │
│                 │
│ 📷 Post         │
│ 📹 Video        │
│ 📝 Text         │
│ ⏱️ Story        │
│ 🎬 Reel         │
│ 🔴 Go Live      │
└─────────────────┘
         │
         ▼ (Post selected)
┌─────────────────┐
│ Media Upload    │
│                 │
│ [Drag & Drop]   │
│ [Browse Files]  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Post Editor     │
│                 │
│ [Media Preview] │
│ [Caption]       │
│ [Access Level]  │
│   ○ Free        │
│   ○ Subscribers │
│   ○ PPV ($__)   │
│ [Schedule]      │
│ [Comments On]   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Preview         │
│ & Confirm       │
└─────────────────┘
         │
    ┌────┴────┐
    │         │
Schedule    Post Now
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ Queued  │ │Published│
└─────────┘ └─────────┘
```

### 4.4 PPV Purchase Flow

```
START (User views locked content)
  │
  ▼
┌─────────────────┐
│ Locked Content  │
│ Preview         │
│                 │
│ 🔒 Unlock $XX   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Purchase Modal  │
│                 │
│ Content: [Desc] │
│ Price: $XX      │
│ Wallet: $YY     │
│                 │
│ [Confirm]       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Payment Check   │
│                 │
│ Balance >= Price│
└─────────────────┘
       │      │
   Yes ▼      ▼ No
┌─────────┐ ┌─────────────┐
│ Process │ │ Add Funds   │
│ Payment │ │ Flow        │
└─────────┘ └─────────────┘
       │           │
       ▼           │
┌─────────────┐    │
│ Content     │◀───┘
│ Unlocked    │
└─────────────┘
```

---

## 5. Acceptance Criteria

### 5.1 User Registration

| Criterion | Test                                                     |
| --------- | -------------------------------------------------------- |
| AC-001    | User can register with valid email and password          |
| AC-002    | Password must meet complexity requirements               |
| AC-003    | Age verification modal appears before registration       |
| AC-004    | Users under 18 cannot complete registration              |
| AC-005    | Email verification link is sent within 30 seconds        |
| AC-006    | User can complete registration via Google OAuth          |
| AC-007    | Duplicate email addresses are rejected                   |
| AC-008    | User is redirected to feed after successful registration |

### 5.2 Content Upload

| Criterion | Test                                          |
| --------- | --------------------------------------------- |
| AC-010    | Creator can upload images up to 20MB          |
| AC-011    | Creator can upload videos up to 5GB           |
| AC-012    | Progress indicator shows during upload        |
| AC-013    | Video transcoding completes within 10 minutes |
| AC-014    | Multiple resolutions are generated            |
| AC-015    | Thumbnail is auto-generated                   |
| AC-016    | Creator can set PPV price between $1-500      |
| AC-017    | Scheduled posts publish at correct time       |
| AC-018    | Content is watermarked with viewer info       |

### 5.3 Subscription

| Criterion | Test                                                  |
| --------- | ----------------------------------------------------- |
| AC-020    | User can subscribe with sufficient wallet balance     |
| AC-021    | Subscription grants immediate content access          |
| AC-022    | Subscription auto-renews monthly                      |
| AC-023    | User receives confirmation email                      |
| AC-024    | Creator sees new subscriber notification              |
| AC-025    | User can cancel subscription anytime                  |
| AC-026    | Access continues until period ends after cancellation |
| AC-027    | Bundle discounts apply correctly                      |

### 5.4 Payouts

| Criterion | Test                                                                             |
| --------- | -------------------------------------------------------------------------------- |
| AC-030    | Earnings are calculated using the tiered commission strategy (CommissionService) |
| AC-031    | Payouts are processed weekly (Fridays)                                           |
| AC-032    | Minimum payout threshold is $20                                                  |
| AC-033    | Creator receives payout confirmation                                             |
| AC-034    | Payout history is accurate and complete                                          |
| AC-035    | Failed payouts are retried and notified                                          |

---

## 6. Edge Cases & Error Handling

### 6.1 Payment Edge Cases

| Scenario               | Handling                              |
| ---------------------- | ------------------------------------- |
| Insufficient funds     | Show add funds modal                  |
| Payment processor down | Queue and retry, notify user          |
| Chargeback/Dispute     | Freeze creator payout, investigate    |
| Currency conversion    | Show converted amount before purchase |
| Expired card           | Notify user, request card update      |
| Fraud detection        | Block transaction, notify support     |

### 6.2 Content Edge Cases

| Scenario             | Handling                        |
| -------------------- | ------------------------------- |
| Upload fails midway  | Resume upload, show progress    |
| Unsupported format   | Reject with clear error message |
| File too large       | Reject with size limit info     |
| Transcoding fails    | Notify creator, offer retry     |
| NSFW in SFW category | AI detection, flag for review   |
| Copyright content    | DMCA process, takedown          |

### 6.3 Account Edge Cases

| Scenario               | Handling                         |
| ---------------------- | -------------------------------- |
| Forgot password        | Email reset link flow            |
| Account locked         | 5 failed attempts = 30 min lock  |
| Duplicate registration | Suggest login instead            |
| Deleted creator        | Refund active subscriptions      |
| Banned user            | Revoke access, notify reason     |
| KYC rejection          | Allow resubmission with feedback |

### 6.4 Error Messages

| Error Code | User Message                                             |
| ---------- | -------------------------------------------------------- |
| AUTH_001   | "Invalid email or password. Please try again."           |
| AUTH_002   | "Your account has been locked. Try again in 30 minutes." |
| PAY_001    | "Insufficient balance. Please add funds to continue."    |
| PAY_002    | "Payment failed. Please try a different payment method." |
| UPLOAD_001 | "File too large. Maximum size is [X]MB."                 |
| UPLOAD_002 | "Unsupported file format. Please use [formats]."         |
| SUB_001    | "Unable to process subscription. Please try again."      |

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements

| Metric            | Requirement               |
| ----------------- | ------------------------- |
| Page Load Time    | < 2 seconds (P95)         |
| API Response Time | < 200ms (P95)             |
| Video Start Time  | < 3 seconds               |
| Image Load Time   | < 1 second                |
| Search Results    | < 500ms                   |
| Upload Speed      | Saturate user's bandwidth |

### 7.2 Scalability Requirements

| Metric             | Requirement        |
| ------------------ | ------------------ |
| Concurrent Users   | 100,000+           |
| Daily Active Users | 1,000,000+         |
| Storage Capacity   | 10+ PB             |
| Video Streaming    | 50,000+ concurrent |
| Database           | 1B+ records        |

### 7.3 Availability Requirements

| Metric              | Requirement                      |
| ------------------- | -------------------------------- |
| Uptime              | 99.9% (8.76 hours downtime/year) |
| Planned Maintenance | < 4 hours/month                  |
| Recovery Time       | < 15 minutes                     |
| Data Durability     | 99.999999999% (11 9s)            |

### 7.4 Security Requirements

| Requirement         | Implementation                      |
| ------------------- | ----------------------------------- |
| Data Encryption     | TLS 1.3 in transit, AES-256 at rest |
| Authentication      | JWT + refresh tokens, optional 2FA  |
| Authorization       | Role-based access control (RBAC)    |
| Password Storage    | Argon2id hashing                    |
| API Security        | Rate limiting, input validation     |
| Audit Logging       | All sensitive operations logged     |
| Penetration Testing | Quarterly external audits           |
| Bug Bounty          | Program for security researchers    |

### 7.5 Compliance Requirements

| Regulation | Requirement                        |
| ---------- | ---------------------------------- |
| GDPR       | Data export, deletion, consent     |
| CCPA       | Privacy controls for CA users      |
| 2257       | Age verification records           |
| PCI-DSS    | Compliant payment processing       |
| DMCA       | Designated agent, takedown process |
| AML/KYC    | Identity verification for payouts  |

### 7.6 Accessibility Requirements

| Standard            | Level             |
| ------------------- | ----------------- |
| WCAG                | 2.1 AA compliance |
| Keyboard Navigation | Full support      |
| Screen Readers      | Compatible        |
| Color Contrast      | 4.5:1 minimum     |
| Text Resizing       | Up to 200%        |

### 7.7 Localization Requirements

| Feature             | Requirement                         |
| ------------------- | ----------------------------------- |
| Languages (Phase 1) | English                             |
| Languages (Phase 2) | Spanish, French, German, Portuguese |
| Currency Display    | User's local currency               |
| Date/Time           | User's timezone                     |
| RTL Support         | Future consideration                |

---

## Document Approval

| Role             | Name | Signature | Date |
| ---------------- | ---- | --------- | ---- |
| Product Manager  |      |           |      |
| Engineering Lead |      |           |      |
| Design Lead      |      |           |      |
| QA Lead          |      |           |      |

---

_This document is confidential and intended for internal use only._
