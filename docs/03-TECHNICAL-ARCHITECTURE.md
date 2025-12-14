# NuttyFans — Technical Architecture Document

**Version:** 1.0  
**Last Updated:** December 12, 2025  
**Document Owner:** Engineering Team  
**Status:** Draft for Review

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [System Design](#2-system-design)
3. [Technology Stack](#3-technology-stack)
4. [Infrastructure Architecture](#4-infrastructure-architecture)
5. [Security Architecture](#5-security-architecture)
6. [Scalability Plan](#6-scalability-plan)

---

## 1. Architecture Overview

### 1.1 Architecture Decision

**Recommendation: Modular Monolith with Service Extraction Path**

After analyzing requirements, we recommend starting with a **modular monolith** architecture using Next.js with clear module boundaries, designed for future microservice extraction.

**Rationale:**
| Factor | Monolith | Microservices | Decision |
|--------|----------|---------------|----------|
| Time to Market | Fast | Slow | Monolith ✓ |
| Team Size (Initial) | Small OK | Large needed | Monolith ✓ |
| Operational Complexity | Low | High | Monolith ✓ |
| Scalability | Good (vertical) | Excellent | Plan for extraction |
| Feature Velocity | Fast | Slower initially | Monolith ✓ |

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │     PWA     │  │  iOS (P2)   │  │ Android(P2) │        │
│  │  (Next.js)  │  │   (Next.js) │  │  (React     │  │  (React     │        │
│  │             │  │             │  │   Native)   │  │   Native)   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EDGE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Cloudflare / Vercel Edge                     │   │
│  │   • CDN (Static Assets, Media)                                       │   │
│  │   • DDoS Protection                                                  │   │
│  │   • SSL Termination                                                  │   │
│  │   • Edge Caching                                                     │   │
│  │   • WAF (Web Application Firewall)                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Application (Vercel)                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    API Routes + Server Actions                │   │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │   │
│  │  │  │  Auth   │ │ Content │ │ Payment │ │Messaging│ │Analytics│ │   │   │
│  │  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ Module  │ │   │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │   │
│  │  │  │  User   │ │ Creator │ │  Admin  │ │  Live   │ │ Search  │ │   │   │
│  │  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ Module  │ │   │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Background Workers (Serverless)                   │   │
│  │  • Video Transcoding    • Email/Push Notifications                   │   │
│  │  • Image Processing     • Payout Processing                          │   │
│  │  • AI Moderation        • Analytics Aggregation                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │  PostgreSQL   │  │    Redis      │  │   AWS S3      │  │ Meilisearch │  │
│  │   (Neon)      │  │   (Upstash)   │  │   Storage     │  │   Search    │  │
│  │               │  │               │  │               │  │             │  │
│  │  • Users      │  │  • Sessions   │  │  • Media      │  │ • Full-text │  │
│  │  • Content    │  │  • Cache      │  │  • Uploads    │  │ • Creators  │  │
│  │  • Payments   │  │  • Pub/Sub    │  │  • Backups    │  │ • Content   │  │
│  │  • Analytics  │  │  • Rate Limit │  │               │  │             │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Stripe    │ │   Jumio     │ │  SendGrid   │ │   Mux       │           │
│  │  Payments   │ │    KYC      │ │   Email     │ │ Live/Video  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  OneSignal  │ │  Sightengine│ │ Cloudinary  │ │   Pusher    │           │
│  │    Push     │ │  Moderation │ │   Images    │ │  Realtime   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Design

### 2.1 Authentication System

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐         ┌─────────────┐         ┌───────────┐ │
│  │   Client    │────────▶│  NextAuth   │────────▶│ Provider  │ │
│  │             │         │             │         │ (OAuth)   │ │
│  └─────────────┘         └─────────────┘         └───────────┘ │
│         │                       │                              │
│         │                       ▼                              │
│         │                ┌─────────────┐                       │
│         │                │  Database   │                       │
│         │                │  Adapter    │                       │
│         │                └─────────────┘                       │
│         │                       │                              │
│         ▼                       ▼                              │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │   JWT       │◀────────│  Session    │                       │
│  │   Token     │         │  Created    │                       │
│  └─────────────┘         └─────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Token Structure:
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user|creator|admin",
  "creatorId": "creator_id (if creator)",
  "verified": true,
  "exp": 1234567890,
  "iat": 1234567890
}
```

### 2.2 Content Delivery System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTENT DELIVERY ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  UPLOAD FLOW:                                                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Client  │───▶│Presigned│───▶│  S3     │───▶│  Queue  │───▶│ Process │  │
│  │         │    │  URL    │    │ Upload  │    │  (SQS)  │    │ Worker  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                   │         │
│                                      ┌────────────────────────────┘         │
│                                      ▼                                      │
│                               ┌─────────────┐                               │
│                               │  Generate:  │                               │
│                               │  • 480p     │                               │
│                               │  • 720p     │                               │
│                               │  • 1080p    │                               │
│                               │  • HLS      │                               │
│                               │  • Thumb    │                               │
│                               │  • Preview  │                               │
│                               └─────────────┘                               │
│                                      │                                      │
│                                      ▼                                      │
│  DELIVERY FLOW:                ┌─────────────┐                              │
│  ┌─────────┐    ┌─────────┐    │    CDN      │                              │
│  │ Client  │◀───│ Signed  │◀───│ CloudFront  │                              │
│  │         │    │  URL    │    │             │                              │
│  └─────────┘    └─────────┘    └─────────────┘                              │
│                                      ▲                                      │
│                                      │                                      │
│                               ┌─────────────┐                               │
│                               │     S3      │                               │
│                               │   Origin    │                               │
│                               └─────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Live Streaming Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LIVE STREAMING ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CREATOR SIDE                                 │   │
│  │                                                                      │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│  │  │   Camera/   │───▶│   RTMP      │───▶│     Mux Live            │  │   │
│  │  │   Browser   │    │   Ingest    │    │  (or similar service)   │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────────────────┘  │   │
│  │                                                    │                 │   │
│  └────────────────────────────────────────────────────┼─────────────────┘   │
│                                                       │                     │
│                                                       ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PROCESSING & DISTRIBUTION                         │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                      Mux Live                                │    │   │
│  │  │  • Transcoding (multiple qualities)                          │    │   │
│  │  │  • HLS/DASH packaging                                        │    │   │
│  │  │  • DVR (rewind capability)                                   │    │   │
│  │  │  • Recording to S3                                           │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                │                                     │   │
│  └────────────────────────────────┼─────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         VIEWER SIDE                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │   │
│  │  │    CDN      │◀───│  HLS Edge   │───▶│   Browser   │              │   │
│  │  │  Delivery   │    │   Server    │    │   Player    │              │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘              │   │
│  │                                              │                       │   │
│  │                                              ▼                       │   │
│  │                                        ┌───────────┐                 │   │
│  │                                        │  Pusher   │                 │   │
│  │                                        │  (Chat)   │                 │   │
│  │                                        └───────────┘                 │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Messaging System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MESSAGING ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │   Sender    │────────▶│   API       │────────▶│  Database   │           │
│  │   Client    │         │   Route     │         │  (Messages) │           │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│         ▲                       │                                           │
│         │                       ▼                                           │
│         │                ┌─────────────┐                                    │
│         │                │   Pusher    │                                    │
│         │                │  (Realtime) │                                    │
│         │                └─────────────┘                                    │
│         │                       │                                           │
│         │                       ▼                                           │
│  ┌─────────────┐         ┌─────────────┐                                    │
│  │  Receiver   │◀────────│  WebSocket  │                                    │
│  │   Client    │         │  Channel    │                                    │
│  └─────────────┘         └─────────────┘                                    │
│                                                                             │
│  Message Flow:                                                              │
│  1. Sender posts message via REST API                                       │
│  2. Message stored in PostgreSQL                                            │
│  3. Pusher event triggered for realtime delivery                            │
│  4. Receiver gets message via WebSocket                                     │
│  5. Read receipt sent back through same flow                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 Notification System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NOTIFICATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   Event     │  (New post, new subscriber, tip received, etc.)            │
│  │   Trigger   │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ Notification│                                                            │
│  │   Service   │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ├──────────────────┬──────────────────┬──────────────────┐         │
│         ▼                  ▼                  ▼                  ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────────┐   │
│  │   In-App    │    │    Email    │    │    Push     │    │  Webhook  │   │
│  │   (DB +     │    │  (SendGrid) │    │ (OneSignal) │    │  (Future) │   │
│  │   Pusher)   │    │             │    │             │    │           │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └───────────┘   │
│                                                                             │
│  Notification Types:                                                        │
│  • NEW_POST: Creator posts new content                                      │
│  • NEW_SUBSCRIBER: Someone subscribed to creator                            │
│  • NEW_TIP: Received a tip                                                  │
│  • NEW_MESSAGE: New DM received                                             │
│  • PAYOUT_PROCESSED: Weekly payout complete                                 │
│  • SUBSCRIPTION_EXPIRING: Sub expires in X days                             │
│  • LIVE_STARTED: Creator went live                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Complete Tech Stack

| Layer                | Technology                          | Purpose                      |
| -------------------- | ----------------------------------- | ---------------------------- |
| **Frontend**         | Next.js 14+ (App Router)            | React framework with SSR     |
| **UI Components**    | Tailwind CSS + shadcn/ui            | Styling and components       |
| **State Management** | Zustand + TanStack Query            | Client state + server state  |
| **Forms**            | React Hook Form + Zod               | Form handling + validation   |
| **Backend**          | Next.js API Routes + Server Actions | API layer                    |
| **Database**         | PostgreSQL (Neon)                   | Primary data store           |
| **ORM**              | Prisma                              | Database access              |
| **Cache**            | Redis (Upstash)                     | Caching + sessions           |
| **Auth**             | NextAuth.js v5                      | Authentication               |
| **Storage**          | AWS S3                              | Media storage                |
| **CDN**              | CloudFront                          | Content delivery             |
| **Search**           | Meilisearch                         | Full-text search             |
| **Payments**         | Stripe Connect                      | Payment processing           |
| **KYC**              | Jumio / Onfido                      | Identity verification        |
| **Email**            | SendGrid                            | Transactional email          |
| **Push**             | OneSignal                           | Push notifications           |
| **Realtime**         | Pusher                              | WebSocket connections        |
| **Video**            | Mux                                 | Video processing + streaming |
| **Moderation**       | Sightengine                         | AI content moderation        |
| **Monitoring**       | Sentry + Datadog                    | Error tracking + APM         |
| **Analytics**        | PostHog                             | Product analytics            |
| **Hosting**          | Vercel                              | Application hosting          |

### 3.2 Development Tools

| Tool           | Purpose           |
| -------------- | ----------------- |
| TypeScript     | Type safety       |
| ESLint         | Code linting      |
| Prettier       | Code formatting   |
| Husky          | Git hooks         |
| Vitest         | Unit testing      |
| Playwright     | E2E testing       |
| Docker         | Local development |
| GitHub Actions | CI/CD             |

---

## 4. Infrastructure Architecture

### 4.1 Environment Setup

| Environment | Purpose                | URL                   |
| ----------- | ---------------------- | --------------------- |
| Development | Local development      | localhost:3000        |
| Staging     | Pre-production testing | staging.nuttyfans.com |
| Production  | Live application       | nuttyfans.com         |

### 4.2 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Push   │───▶│  Lint   │───▶│  Test   │───▶│  Build  │───▶│ Deploy  │  │
│  │  Code   │    │  Check  │    │  Suite  │    │  App    │    │ Preview │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                     │       │
│                                                                     ▼       │
│                                                              ┌───────────┐  │
│                                                              │  Review   │  │
│                                                              │  & QA     │  │
│                                                              └───────────┘  │
│                                                                     │       │
│                                                                     ▼       │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐               ┌───────────────┐ │
│  │ Monitor │◀───│  Prod   │◀───│ Staging │◀──────────────│ Merge to Main │ │
│  │         │    │ Deploy  │    │ Deploy  │               │               │ │
│  └─────────┘    └─────────┘    └─────────┘               └───────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Monitoring & Observability

| Component      | Tool          | Purpose                 |
| -------------- | ------------- | ----------------------- |
| Error Tracking | Sentry        | Exception monitoring    |
| APM            | Datadog       | Performance monitoring  |
| Logs           | Datadog Logs  | Centralized logging     |
| Uptime         | Better Uptime | Availability monitoring |
| Analytics      | PostHog       | User behavior           |
| Alerts         | PagerDuty     | Incident management     |

---

## 5. Security Architecture

### 5.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: Edge Security                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Cloudflare DDoS Protection                                        │   │
│  │  • WAF Rules                                                         │   │
│  │  • Bot Management                                                    │   │
│  │  • SSL/TLS Termination                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Layer 2: Application Security                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Rate Limiting (per IP, per user)                                  │   │
│  │  • Input Validation (Zod schemas)                                    │   │
│  │  • CORS Configuration                                                │   │
│  │  • CSP Headers                                                       │   │
│  │  • CSRF Protection                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Layer 3: Authentication & Authorization                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • JWT Tokens (short-lived)                                          │   │
│  │  • Refresh Token Rotation                                            │   │
│  │  • Role-Based Access Control                                         │   │
│  │  • Session Management                                                │   │
│  │  • 2FA Support                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Layer 4: Data Security                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Encryption at Rest (AES-256)                                      │   │
│  │  • Encryption in Transit (TLS 1.3)                                   │   │
│  │  • PII Data Segregation                                              │   │
│  │  • Database Row-Level Security                                       │   │
│  │  • Audit Logging                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Rate Limiting Configuration

| Endpoint              | Limit        | Window   |
| --------------------- | ------------ | -------- |
| Auth endpoints        | 5 requests   | 1 minute |
| API (authenticated)   | 100 requests | 1 minute |
| API (unauthenticated) | 20 requests  | 1 minute |
| Upload endpoints      | 10 requests  | 1 minute |
| Search                | 30 requests  | 1 minute |

### 5.3 Content Security

| Feature              | Implementation                          |
| -------------------- | --------------------------------------- |
| Dynamic Watermarking | Viewer ID + timestamp burned into media |
| Signed URLs          | Time-limited access to media files      |
| Download Prevention  | No right-click, disabled save           |
| Screenshot Deterrent | CSS overlay patterns                    |
| DRM (Future)         | Widevine/FairPlay for premium content   |

---

## 6. Scalability Plan

### 6.1 Horizontal Scaling Strategy

| Component       | Scale Strategy                    |
| --------------- | --------------------------------- |
| Web Application | Vercel auto-scaling               |
| Database        | Neon auto-scaling + read replicas |
| Cache           | Upstash serverless scaling        |
| Storage         | S3 unlimited scaling              |
| CDN             | CloudFront global edge            |
| Workers         | Serverless auto-scaling           |

### 6.2 Performance Optimization

| Optimization | Implementation                                    |
| ------------ | ------------------------------------------------- |
| Database     | Connection pooling, query optimization, indexes   |
| Caching      | Redis for hot data, CDN for static assets         |
| Images       | WebP format, responsive sizes, lazy loading       |
| Videos       | Adaptive bitrate streaming, edge caching          |
| API          | Response compression, pagination, field selection |
| Frontend     | Code splitting, tree shaking, ISR                 |

### 6.3 Capacity Planning

| Milestone | Users | Creators | Infrastructure        |
| --------- | ----- | -------- | --------------------- |
| Launch    | 10K   | 500      | Single region         |
| 6 months  | 100K  | 2K       | + Read replicas       |
| 12 months | 500K  | 10K      | Multi-region          |
| 24 months | 5M    | 100K     | Global CDN + sharding |

---

_This document is confidential and intended for internal use only._
