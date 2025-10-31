-- Migration: Add user presence tracking
-- Description: Adds is_online and last_seen columns to users table for real-time presence tracking
-- Date: 2025-01-31

-- ============================================================================
-- ADD PRESENCE TRACKING COLUMNS TO USERS TABLE
-- ============================================================================

-- Add is_online column to track current online status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE;

-- Add last_seen column to track last activity timestamp
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- ============================================================================
-- CREATE INDEXES FOR EFFICIENT QUERIES
-- ============================================================================

-- Index for filtering online users (e.g., showing online staff/admins)
CREATE INDEX IF NOT EXISTS idx_users_is_online
ON users(is_online)
WHERE is_online = TRUE;

-- Composite index for role-based online user queries
CREATE INDEX IF NOT EXISTS idx_users_role_online
ON users(role, is_online)
WHERE is_online = TRUE;

-- ============================================================================
-- CREATE FUNCTION TO AUTO-UPDATE LAST_SEEN
-- ============================================================================

-- Function to update last_seen timestamp when user goes online
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_online = TRUE AND (OLD.is_online IS NULL OR OLD.is_online = FALSE) THEN
    NEW.last_seen = NOW();
  END IF;

  IF NEW.is_online = FALSE AND OLD.is_online = TRUE THEN
    NEW.last_seen = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER FOR LAST_SEEN AUTO-UPDATE
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_user_last_seen ON users;

CREATE TRIGGER trigger_update_user_last_seen
  BEFORE UPDATE OF is_online ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_seen();

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN users.is_online IS
'Real-time online status - TRUE when user is actively connected, FALSE when offline';

COMMENT ON COLUMN users.last_seen IS
'Timestamp of last presence update - used for "last seen" display when offline';

COMMENT ON INDEX idx_users_is_online IS
'Partial index for efficient online user queries';

COMMENT ON INDEX idx_users_role_online IS
'Composite index for role-filtered online user lists (e.g., online staff members)';
