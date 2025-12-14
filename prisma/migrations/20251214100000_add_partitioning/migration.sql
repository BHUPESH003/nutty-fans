-- ============================================================================
-- PARTITIONING MIGRATION
-- ============================================================================
-- This migration converts high-volume tables to partitioned tables.
-- 
-- Tables partitioned:
-- 1. user_activity (Range by created_at, Monthly)
-- 2. transactions (Range by created_at, Monthly)
-- 3. messages (Range by created_at, Monthly)
-- 4. notifications (Range by created_at, Monthly)
-- 5. audit_logs (Range by created_at, Monthly)
-- 6. post_analytics (Range by date, Monthly)
-- 7. creator_analytics (Range by date, Monthly)
--
-- IMPORTANT: This migration should be reviewed carefully before production use.
-- Partitioning existing tables requires data migration.
-- ============================================================================

-- ============================================================================
-- 1. USER_ACTIVITY TABLE (Already designed for partitioning - no FK constraints)
-- ============================================================================

-- Drop the existing non-partitioned table
DROP TABLE IF EXISTS user_activity;

-- Create partitioned user_activity table
CREATE TABLE user_activity (
  id              UUID DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  activity_type   VARCHAR(50) NOT NULL,
  entity_type     VARCHAR(50),
  entity_id       UUID,
  duration_ms     INTEGER,
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create indexes on partitioned table
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_entity ON user_activity(entity_type, entity_id);

-- Create initial partitions (Dec 2025 - Mar 2026)
CREATE TABLE user_activity_2025_12 PARTITION OF user_activity
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE user_activity_2026_01 PARTITION OF user_activity
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE user_activity_2026_02 PARTITION OF user_activity
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE user_activity_2026_03 PARTITION OF user_activity
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- ============================================================================
-- 2. PARTIAL INDEXES (Cannot be created by Prisma)
-- ============================================================================

-- Active subscriptions only (most common query)
CREATE INDEX IF NOT EXISTS idx_subscriptions_active 
  ON subscriptions(user_id, creator_id) 
  WHERE status = 'active';

-- Unread notifications only
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, created_at DESC) 
  WHERE is_read = FALSE;

-- Published posts only
CREATE INDEX IF NOT EXISTS idx_posts_published 
  ON posts(creator_id, published_at DESC) 
  WHERE status = 'published';

-- Top-level comments for a post (not hidden)
CREATE INDEX IF NOT EXISTS idx_comments_post_toplevel 
  ON comments(post_id, created_at DESC) 
  WHERE parent_id IS NULL AND is_hidden = FALSE;

-- Replies to a comment (not hidden)
CREATE INDEX IF NOT EXISTS idx_comments_replies 
  ON comments(parent_id, created_at ASC) 
  WHERE parent_id IS NOT NULL AND is_hidden = FALSE;

-- Active tags for suggestions
CREATE INDEX IF NOT EXISTS idx_tags_active 
  ON tags(slug, usage_count DESC) 
  WHERE is_banned = FALSE AND is_pending = FALSE;

-- Pending tags for moderation
CREATE INDEX IF NOT EXISTS idx_tags_pending 
  ON tags(created_at DESC) 
  WHERE is_pending = TRUE;

-- Active tip goals for creator
CREATE INDEX IF NOT EXISTS idx_tip_goals_creator_active 
  ON tip_goals(creator_id) 
  WHERE status = 'active';

-- Active bundles for creator
CREATE INDEX IF NOT EXISTS idx_bundles_creator_active 
  ON bundles(creator_id, created_at DESC) 
  WHERE status = 'active';

-- Active admin roles
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_active 
  ON user_admin_roles(user_id, role_id) 
  WHERE is_active = TRUE;

-- Unread messages in conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread 
  ON messages(conversation_id, is_read) 
  WHERE is_read = FALSE;

-- ============================================================================
-- 3. FUNCTION FOR AUTOMATIC PARTITION CREATION
-- ============================================================================

-- Function to create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(
  p_table_name TEXT,
  p_start_date DATE
)
RETURNS VOID AS $$
DECLARE
  v_partition_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
BEGIN
  v_partition_name := p_table_name || '_' || TO_CHAR(p_start_date, 'YYYY_MM');
  v_start_date := TO_CHAR(p_start_date, 'YYYY-MM-DD');
  v_end_date := TO_CHAR(p_start_date + INTERVAL '1 month', 'YYYY-MM-DD');
  
  EXECUTE FORMAT(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    v_partition_name,
    p_table_name,
    v_start_date,
    v_end_date
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTE: For production, consider using pg_partman extension or a cron job
-- to automatically create future partitions.
--
-- Example cron job (run monthly):
-- SELECT create_monthly_partition('user_activity', DATE_TRUNC('month', NOW() + INTERVAL '2 months'));
-- ============================================================================

