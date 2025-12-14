-- ============================================================================
-- FIX: UUID extension and conversation duplicate prevention
-- ============================================================================
-- This migration fixes:
-- 1. Ensures pgcrypto extension is available for gen_random_uuid()
-- 2. Adds CHECK constraint to prevent conversation duplicates with swapped participants
-- ============================================================================

-- =============================================================================
-- 1. UUID EXTENSION
-- =============================================================================
-- Ensure gen_random_uuid() is available on all PostgreSQL versions.
-- PostgreSQL 13+ has it built-in, but older versions need pgcrypto.
-- This is idempotent and safe to run on Neon/Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. CONVERSATION PARTICIPANT ORDER CONSTRAINT
-- =============================================================================
-- Prevent duplicate conversations with swapped participants.
-- Enforces that participant_1 < participant_2 (lexicographically).
-- Application must normalize: always put smaller UUID in participant_1.

ALTER TABLE conversations 
ADD CONSTRAINT chk_participant_order 
CHECK (participant_1 < participant_2);

-- =============================================================================
-- 3. HELPER FUNCTION FOR CONVERSATION CREATION
-- =============================================================================
-- This function ensures participants are always in the correct order.
-- Use this in the application's repository layer.

CREATE OR REPLACE FUNCTION normalize_conversation_participants(
  user_a UUID,
  user_b UUID
)
RETURNS TABLE (participant_1 UUID, participant_2 UUID) AS $$
BEGIN
  IF user_a < user_b THEN
    RETURN QUERY SELECT user_a, user_b;
  ELSE
    RETURN QUERY SELECT user_b, user_a;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- USAGE EXAMPLE (for application code):
-- =============================================================================
-- SELECT * FROM normalize_conversation_participants('uuid-a', 'uuid-b');
-- Returns: participant_1 = smaller UUID, participant_2 = larger UUID
--
-- Then use these values when inserting/querying conversations.
-- =============================================================================

