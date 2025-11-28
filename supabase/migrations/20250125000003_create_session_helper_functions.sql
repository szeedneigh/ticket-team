-- Session Management Helper Functions
-- Functions to manage user sessions securely

-- Function to get active sessions count
CREATE OR REPLACE FUNCTION get_active_sessions_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM user_sessions_log
    WHERE user_id = p_user_id
    AND is_active = TRUE
    AND logout_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke session
CREATE OR REPLACE FUNCTION revoke_user_session(
  p_session_id TEXT,
  p_revoked_by UUID,
  p_reason TEXT DEFAULT 'User revoked'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions_log
  SET
    is_active = FALSE,
    logout_at = NOW(),
    revoked_at = NOW(),
    revoked_by = p_revoked_by,
    revoke_reason = p_reason,
    updated_at = NOW()
  WHERE session_id = p_session_id
  AND is_active = TRUE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke all sessions except current
CREATE OR REPLACE FUNCTION revoke_all_other_sessions(
  p_user_id UUID,
  p_current_session_id TEXT,
  p_reason TEXT DEFAULT 'User revoked all sessions'
)
RETURNS INTEGER AS $$
DECLARE
  v_revoked_count INTEGER;
BEGIN
  WITH revoked AS (
    UPDATE user_sessions_log
    SET
      is_active = FALSE,
      logout_at = NOW(),
      revoked_at = NOW(),
      revoked_by = p_user_id,
      revoke_reason = p_reason,
      updated_at = NOW()
    WHERE user_id = p_user_id
    AND session_id != p_current_session_id
    AND is_active = TRUE
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_revoked_count FROM revoked;

  RETURN v_revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Mark sessions inactive after 30 days of inactivity
  WITH marked AS (
    UPDATE user_sessions_log
    SET is_active = FALSE, updated_at = NOW()
    WHERE is_active = TRUE
    AND last_activity_at < NOW() - INTERVAL '30 days'
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted_count FROM marked;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_sessions_count TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_all_other_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_sessions TO service_role;

COMMENT ON FUNCTION get_active_sessions_count IS 'Returns count of active sessions for a user';
COMMENT ON FUNCTION revoke_user_session IS 'Revokes a specific user session';
COMMENT ON FUNCTION revoke_all_other_sessions IS 'Revokes all sessions except the current one';
COMMENT ON FUNCTION cleanup_old_sessions IS 'Cleanup sessions inactive for 30+ days';
