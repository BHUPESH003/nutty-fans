-- =============================================================================
-- Performance Optimization: Additional Indexes
-- =============================================================================
-- Date: 2025-12-16
-- Purpose: Add missing indexes for query optimization
-- =============================================================================

-- Posts table: Composite index for explore feed queries
CREATE INDEX IF NOT EXISTS idx_posts_status_access_published 
ON posts(status, access_level, published_at DESC) 
WHERE status = 'published' AND access_level = 'free';

-- Posts table: Index for trending posts (likes + date)
CREATE INDEX IF NOT EXISTS idx_posts_trending 
ON posts(like_count DESC, created_at DESC) 
WHERE status = 'published' AND access_level = 'free';

-- Posts table: Index for subscribed feed queries
CREATE INDEX IF NOT EXISTS idx_posts_subscribed_feed 
ON posts(status, published_at DESC) 
WHERE status = 'published';

-- Subscriptions: Index for active subscriptions lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_active 
ON subscriptions(user_id, creator_id, status, expires_at) 
WHERE status = 'active';

-- Subscriptions: Index for creator subscribers count
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_active 
ON subscriptions(creator_id, status, expires_at) 
WHERE status = 'active';

-- Messages: Composite index for conversation messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Messages: Index for unread messages
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(conversation_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Notifications: Composite index for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created 
ON notifications(user_id, is_read, created_at DESC);

-- Follows: Index for follower/following lookups
CREATE INDEX IF NOT EXISTS idx_follows_creator_follower 
ON follows(creator_id, follower_id);

-- Follows: Index for reverse lookup (who user follows)
CREATE INDEX IF NOT EXISTS idx_follows_follower 
ON follows(follower_id);

-- Transactions: Index for user transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
ON transactions(user_id, created_at DESC);

-- Transactions: Index for creator earnings
CREATE INDEX IF NOT EXISTS idx_transactions_creator_created 
ON transactions(creator_id, created_at DESC) 
WHERE creator_id IS NOT NULL;

-- PPV Purchases: Index for user purchases
CREATE INDEX IF NOT EXISTS idx_ppv_purchases_user_created 
ON ppv_purchases(user_id, created_at DESC);

-- Comments: Index for post comments with replies
CREATE INDEX IF NOT EXISTS idx_comments_post_parent_created 
ON comments(post_id, parent_id, created_at DESC);

-- Creator Profiles: Index for trending creators
CREATE INDEX IF NOT EXISTS idx_creator_profiles_trending 
ON creator_profiles(is_active, is_verified, subscriber_count DESC) 
WHERE is_active = true;

-- Creator Profiles: Index for search queries
CREATE INDEX IF NOT EXISTS idx_creator_profiles_search 
ON creator_profiles(is_active, category_id, subscriber_count DESC) 
WHERE is_active = true;

-- Media: Index for processing status
CREATE INDEX IF NOT EXISTS idx_media_processing 
ON media(processing_status, created_at) 
WHERE processing_status IN ('pending', 'processing');

-- Analytics: Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_post_analytics_date 
ON post_analytics(date DESC, post_id);

-- =============================================================================
-- Query Optimization Notes:
-- =============================================================================
-- 1. Partial indexes (WHERE clauses) reduce index size and improve performance
-- 2. Composite indexes support common query patterns
-- 3. DESC ordering in indexes supports descending sorts
-- 4. These indexes are optimized for read-heavy workloads
-- =============================================================================

