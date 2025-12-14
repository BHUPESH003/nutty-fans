-- ============================================================================
-- FIX: user_activity table enum type
-- ============================================================================
-- This migration fixes the schema drift where activity_type was created as
-- VARCHAR(50) instead of using the UserActivityType enum.
-- ============================================================================

-- Step 1: Drop existing partitions and parent table
DROP TABLE IF EXISTS user_activity_2025_12;
DROP TABLE IF EXISTS user_activity_2026_01;
DROP TABLE IF EXISTS user_activity_2026_02;
DROP TABLE IF EXISTS user_activity_2026_03;
DROP TABLE IF EXISTS user_activity;

-- Step 2: Recreate partitioned table with correct enum type
CREATE TABLE user_activity (
  id              UUID DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  activity_type   "UserActivityType" NOT NULL,
  entity_type     VARCHAR(50),
  entity_id       UUID,
  duration_ms     INTEGER,
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Step 3: Recreate indexes on partitioned table
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_entity ON user_activity(entity_type, entity_id);

-- Step 4: Recreate partitions (Dec 2025 - Mar 2026)
CREATE TABLE user_activity_2025_12 PARTITION OF user_activity
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE user_activity_2026_01 PARTITION OF user_activity
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE user_activity_2026_02 PARTITION OF user_activity
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE user_activity_2026_03 PARTITION OF user_activity
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

