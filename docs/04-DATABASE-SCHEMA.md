# NuttyFans — Database Schema

**Version:** 1.0  
**Last Updated:** December 12, 2025  
**Database:** PostgreSQL (Neon)

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIP DIAGRAM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │    User     │───────│   Creator   │───────│    Post     │               │
│  │             │  1:1  │   Profile   │  1:N  │             │               │
│  └─────────────┘       └─────────────┘       └─────────────┘               │
│        │                     │                     │                        │
│        │ 1:N                 │ 1:N                 │ 1:N                    │
│        ▼                     ▼                     ▼                        │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │Subscription │       │   Payout    │       │    Media    │               │
│  │             │       │             │       │             │               │
│  └─────────────┘       └─────────────┘       └─────────────┘               │
│        │                                           │                        │
│        │ N:1                                       │ 1:N                    │
│        ▼                                           ▼                        │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │ Transaction │───────│    Tip      │       │    Like     │               │
│  │             │       │             │       │             │               │
│  └─────────────┘       └─────────────┘       └─────────────┘               │
│                                                                             │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │   Message   │       │Conversation │       │Notification │               │
│  │             │───────│             │       │             │               │
│  └─────────────┘  N:1  └─────────────┘       └─────────────┘               │
│                                                                             │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │ LiveStream  │       │   Report    │       │  Category   │               │
│  │             │       │             │       │             │               │
│  └─────────────┘       └─────────────┘       └─────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### 1. Users Table

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  email_verified  TIMESTAMP,
  password_hash   VARCHAR(255),
  display_name    VARCHAR(50) NOT NULL,
  username        VARCHAR(30) UNIQUE NOT NULL,
  avatar_url      TEXT,
  date_of_birth   DATE NOT NULL,
  country         VARCHAR(2) NOT NULL,
  role            VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  wallet_balance  DECIMAL(12,2) DEFAULT 0.00,
  preferences     JSONB DEFAULT '{}',
  metadata        JSONB DEFAULT '{}',
  last_login_at   TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### 2. Creator Profiles Table

```sql
CREATE TABLE creator_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio                   TEXT,
  cover_image_url       TEXT,
  category_id           UUID REFERENCES categories(id),
  is_nsfw               BOOLEAN DEFAULT FALSE,
  subscription_price    DECIMAL(6,2) DEFAULT 9.99,
  subscription_price_3m DECIMAL(6,2),
  subscription_price_6m DECIMAL(6,2),
  subscription_price_12m DECIMAL(6,2),
  free_trial_days       INTEGER DEFAULT 0,
  tips_enabled          BOOLEAN DEFAULT TRUE,
  dm_price              DECIMAL(6,2) DEFAULT 0,
  kyc_status            VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected')),
  kyc_submitted_at      TIMESTAMP,
  kyc_verified_at       TIMESTAMP,
  kyc_rejection_reason  TEXT,
  stripe_account_id     VARCHAR(255),
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  payout_schedule       VARCHAR(20) DEFAULT 'weekly',
  total_earnings        DECIMAL(12,2) DEFAULT 0,
  total_subscribers     INTEGER DEFAULT 0,
  total_posts           INTEGER DEFAULT 0,
  is_featured           BOOLEAN DEFAULT FALSE,
  is_verified           BOOLEAN DEFAULT FALSE,
  blocked_countries     TEXT[] DEFAULT '{}',
  social_links          JSONB DEFAULT '{}',
  settings              JSONB DEFAULT '{}',
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_category ON creator_profiles(category_id);
CREATE INDEX idx_creator_profiles_kyc_status ON creator_profiles(kyc_status);
CREATE INDEX idx_creator_profiles_is_nsfw ON creator_profiles(is_nsfw);
```

### 3. Categories Table

```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL,
  slug        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon        VARCHAR(50),
  is_nsfw     BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  parent_id   UUID REFERENCES categories(id),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_nsfw ON categories(is_nsfw);
```

### 4. Posts Table

```sql
CREATE TABLE posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  content           TEXT,
  post_type         VARCHAR(20) DEFAULT 'post' CHECK (post_type IN ('post', 'story', 'reel')),
  access_level      VARCHAR(20) DEFAULT 'subscribers' CHECK (access_level IN ('free', 'subscribers', 'ppv')),
  ppv_price         DECIMAL(6,2),
  is_pinned         BOOLEAN DEFAULT FALSE,
  is_nsfw           BOOLEAN DEFAULT FALSE,
  comments_enabled  BOOLEAN DEFAULT TRUE,
  like_count        INTEGER DEFAULT 0,
  comment_count     INTEGER DEFAULT 0,
  view_count        INTEGER DEFAULT 0,
  purchase_count    INTEGER DEFAULT 0,
  scheduled_at      TIMESTAMP,
  published_at      TIMESTAMP,
  expires_at        TIMESTAMP,
  status            VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived', 'removed')),
  moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected')),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_creator_id ON posts(creator_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_access_level ON posts(access_level);
CREATE INDEX idx_posts_is_nsfw ON posts(is_nsfw);
```

### 5. Media Table

```sql
CREATE TABLE media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID REFERENCES posts(id) ON DELETE CASCADE,
  message_id        UUID REFERENCES messages(id) ON DELETE CASCADE,
  creator_id        UUID NOT NULL REFERENCES creator_profiles(id),
  media_type        VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  original_url      TEXT NOT NULL,
  processed_url     TEXT,
  thumbnail_url     TEXT,
  preview_url       TEXT,
  urls              JSONB DEFAULT '{}',
  width             INTEGER,
  height            INTEGER,
  duration          INTEGER,
  file_size         BIGINT,
  mime_type         VARCHAR(100),
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  sort_order        INTEGER DEFAULT 0,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_post_id ON media(post_id);
CREATE INDEX idx_media_creator_id ON media(creator_id);
CREATE INDEX idx_media_processing_status ON media(processing_status);
```

### 6. Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id      UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  plan_type       VARCHAR(20) DEFAULT 'monthly' CHECK (plan_type IN ('monthly', '3month', '6month', '12month')),
  price_paid      DECIMAL(6,2) NOT NULL,
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  started_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP NOT NULL,
  cancelled_at    TIMESTAMP,
  auto_renew      BOOLEAN DEFAULT TRUE,
  stripe_subscription_id VARCHAR(255),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
```

### 7. Transactions Table

```sql
CREATE TABLE transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id),
  creator_id          UUID REFERENCES creator_profiles(id),
  transaction_type    VARCHAR(30) NOT NULL CHECK (transaction_type IN ('subscription', 'ppv', 'tip', 'message', 'live_tip', 'wallet_topup', 'payout', 'refund')),
  amount              DECIMAL(10,2) NOT NULL,
  currency            VARCHAR(3) DEFAULT 'USD',
  platform_fee        DECIMAL(10,2),
  creator_earnings    DECIMAL(10,2),
  status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id   VARCHAR(255),
  stripe_transfer_id  VARCHAR(255),
  related_id          UUID,
  related_type        VARCHAR(50),
  description         TEXT,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_creator_id ON transactions(creator_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

### 8. Payouts Table

```sql
CREATE TABLE payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          UUID NOT NULL REFERENCES creator_profiles(id),
  amount              DECIMAL(10,2) NOT NULL,
  currency            VARCHAR(3) DEFAULT 'USD',
  status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method       VARCHAR(20) DEFAULT 'stripe',
  stripe_payout_id    VARCHAR(255),
  period_start        TIMESTAMP NOT NULL,
  period_end          TIMESTAMP NOT NULL,
  transactions_count  INTEGER DEFAULT 0,
  failure_reason      TEXT,
  processed_at        TIMESTAMP,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payouts_creator_id ON payouts(creator_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_created_at ON payouts(created_at DESC);
```

### 9. Conversations Table

```sql
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1   UUID NOT NULL REFERENCES users(id),
  participant_2   UUID NOT NULL REFERENCES users(id),
  last_message_id UUID,
  last_message_at TIMESTAMP,
  unread_count_1  INTEGER DEFAULT 0,
  unread_count_2  INTEGER DEFAULT 0,
  is_blocked      BOOLEAN DEFAULT FALSE,
  blocked_by      UUID REFERENCES users(id),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
```

### 10. Messages Table

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id),
  content         TEXT,
  message_type    VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'media', 'ppv', 'tip')),
  ppv_price       DECIMAL(6,2),
  is_paid         BOOLEAN DEFAULT FALSE,
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMP,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### 11. Notifications Table

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  body            TEXT,
  data            JSONB DEFAULT '{}',
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMP,
  action_url      TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 12. Likes Table

```sql
CREATE TABLE likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
```

### 13. Bookmarks Table

```sql
CREATE TABLE bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);
```

### 14. Follows Table

```sql
CREATE TABLE follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, creator_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_creator_id ON follows(creator_id);
```

### 15. Blocks Table

```sql
CREATE TABLE blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked_id ON blocks(blocked_id);
```

### 16. Reports Table

```sql
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES users(id),
  reported_type   VARCHAR(20) NOT NULL CHECK (reported_type IN ('user', 'post', 'message', 'comment')),
  reported_id     UUID NOT NULL,
  reason          VARCHAR(50) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution      TEXT,
  resolved_by     UUID REFERENCES users(id),
  resolved_at     TIMESTAMP,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reported_type ON reports(reported_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

### 17. Live Streams Table

```sql
CREATE TABLE live_streams (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        UUID NOT NULL REFERENCES creator_profiles(id),
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  thumbnail_url     TEXT,
  access_level      VARCHAR(20) DEFAULT 'subscribers' CHECK (access_level IN ('free', 'subscribers', 'paid')),
  entry_price       DECIMAL(6,2),
  status            VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  stream_key        VARCHAR(255) UNIQUE,
  playback_id       VARCHAR(255),
  mux_live_stream_id VARCHAR(255),
  scheduled_at      TIMESTAMP,
  started_at        TIMESTAMP,
  ended_at          TIMESTAMP,
  viewer_count      INTEGER DEFAULT 0,
  peak_viewers      INTEGER DEFAULT 0,
  total_tips        DECIMAL(10,2) DEFAULT 0,
  recording_url     TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_streams_creator_id ON live_streams(creator_id);
CREATE INDEX idx_live_streams_status ON live_streams(status);
CREATE INDEX idx_live_streams_scheduled_at ON live_streams(scheduled_at);
```

### 18. PPV Purchases Table

```sql
CREATE TABLE ppv_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  post_id         UUID REFERENCES posts(id),
  message_id      UUID REFERENCES messages(id),
  transaction_id  UUID NOT NULL REFERENCES transactions(id),
  price_paid      DECIMAL(6,2) NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, message_id)
);

CREATE INDEX idx_ppv_purchases_user_id ON ppv_purchases(user_id);
CREATE INDEX idx_ppv_purchases_post_id ON ppv_purchases(post_id);
```

### 19. Sessions Table (NextAuth)

```sql
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires);
```

### 20. Accounts Table (NextAuth OAuth)

```sql
CREATE TABLE accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                VARCHAR(50) NOT NULL,
  provider            VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INTEGER,
  token_type          VARCHAR(50),
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
```

---

## Analytics Tables

### 21. Post Analytics Table

```sql
CREATE TABLE post_analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  views       INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  likes       INTEGER DEFAULT 0,
  comments    INTEGER DEFAULT 0,
  shares      INTEGER DEFAULT 0,
  saves       INTEGER DEFAULT 0,
  purchases   INTEGER DEFAULT 0,
  revenue     DECIMAL(10,2) DEFAULT 0,
  UNIQUE(post_id, date)
);

CREATE INDEX idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX idx_post_analytics_date ON post_analytics(date);
```

### 22. Creator Analytics Table

```sql
CREATE TABLE creator_analytics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  profile_views       INTEGER DEFAULT 0,
  new_subscribers     INTEGER DEFAULT 0,
  churned_subscribers INTEGER DEFAULT 0,
  total_subscribers   INTEGER DEFAULT 0,
  revenue_subscriptions DECIMAL(10,2) DEFAULT 0,
  revenue_ppv         DECIMAL(10,2) DEFAULT 0,
  revenue_tips        DECIMAL(10,2) DEFAULT 0,
  revenue_messages    DECIMAL(10,2) DEFAULT 0,
  revenue_total       DECIMAL(10,2) DEFAULT 0,
  UNIQUE(creator_id, date)
);

CREATE INDEX idx_creator_analytics_creator_id ON creator_analytics(creator_id);
CREATE INDEX idx_creator_analytics_date ON creator_analytics(date);
```

---

## Audit & Compliance Tables

### 23. Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 24. DMCA Requests Table

```sql
CREATE TABLE dmca_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complainant_name    VARCHAR(255) NOT NULL,
  complainant_email   VARCHAR(255) NOT NULL,
  content_urls        TEXT[] NOT NULL,
  original_work_urls  TEXT[],
  description         TEXT NOT NULL,
  status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'valid', 'invalid', 'counter_filed')),
  affected_post_id    UUID REFERENCES posts(id),
  affected_creator_id UUID REFERENCES creator_profiles(id),
  resolution          TEXT,
  resolved_by         UUID REFERENCES users(id),
  resolved_at         TIMESTAMP,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dmca_requests_status ON dmca_requests(status);
CREATE INDEX idx_dmca_requests_created_at ON dmca_requests(created_at DESC);
```

---

*This document is confidential and intended for internal use only.*

