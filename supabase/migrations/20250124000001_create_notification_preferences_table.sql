-- Migration: Create User Notification Preferences Table
-- Description: Adds table for storing user notification preferences
-- Date: 2025-01-24

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Master channel toggles
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Ticket notification preferences (Email)
  ticket_assigned_email BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_comment_email BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_status_changed_email BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_priority_changed_email BOOLEAN NOT NULL DEFAULT TRUE,
  mention_email BOOLEAN NOT NULL DEFAULT TRUE,

  -- Ticket notification preferences (In-App)
  ticket_assigned_app BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_comment_app BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_status_changed_app BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_priority_changed_app BOOLEAN NOT NULL DEFAULT TRUE,
  mention_app BOOLEAN NOT NULL DEFAULT TRUE,

  -- Knowledge Base notification preferences (Email)
  kb_article_published_email BOOLEAN NOT NULL DEFAULT FALSE,
  kb_article_updated_email BOOLEAN NOT NULL DEFAULT FALSE,

  -- Knowledge Base notification preferences (In-App)
  kb_article_published_app BOOLEAN NOT NULL DEFAULT TRUE,
  kb_article_updated_app BOOLEAN NOT NULL DEFAULT TRUE,

  -- Digest settings
  digest_frequency TEXT NOT NULL DEFAULT 'realtime',

  -- Quiet hours settings
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_days JSONB DEFAULT '[]'::jsonb,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_digest_frequency CHECK (
    digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly')
  ),
  CONSTRAINT quiet_hours_valid CHECK (
    NOT quiet_hours_enabled OR (
      quiet_hours_start IS NOT NULL AND quiet_hours_end IS NOT NULL
    )
  )
);

-- Table comment
COMMENT ON TABLE user_notification_preferences IS 'User notification channel and timing preferences';

-- Column comments
COMMENT ON COLUMN user_notification_preferences.user_id IS 'User these preferences belong to';
COMMENT ON COLUMN user_notification_preferences.email_enabled IS 'Master toggle for email notifications';
COMMENT ON COLUMN user_notification_preferences.in_app_enabled IS 'Master toggle for in-app notifications';
COMMENT ON COLUMN user_notification_preferences.digest_frequency IS 'How often to send notification digests';
COMMENT ON COLUMN user_notification_preferences.quiet_hours_enabled IS 'Whether to suppress notifications during quiet hours';
COMMENT ON COLUMN user_notification_preferences.quiet_hours_start IS 'Start time for quiet hours';
COMMENT ON COLUMN user_notification_preferences.quiet_hours_end IS 'End time for quiet hours';
COMMENT ON COLUMN user_notification_preferences.quiet_hours_days IS 'Days of week when quiet hours apply (0=Sunday, 6=Saturday)';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_notification_preferences_user_id ON user_notification_preferences(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own preferences (first time setup)
CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all preferences
CREATE POLICY "Service role can manage all notification preferences"
  ON user_notification_preferences FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create user notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS user_notification_preferences AS $$
DECLARE
  v_preferences user_notification_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM user_notification_preferences
  WHERE user_id = p_user_id;

  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_notification_preferences IS 'Gets notification preferences for a user, creating defaults if none exist';

-- Function to update user notification preferences
CREATE OR REPLACE FUNCTION update_user_notification_preferences(
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS user_notification_preferences AS $$
DECLARE
  v_preferences user_notification_preferences;
BEGIN
  -- Update preferences
  UPDATE user_notification_preferences
  SET
    email_enabled = COALESCE((p_preferences->>'email_enabled')::BOOLEAN, email_enabled),
    in_app_enabled = COALESCE((p_preferences->>'in_app_enabled')::BOOLEAN, in_app_enabled),

    ticket_assigned_email = COALESCE((p_preferences->>'ticket_assigned_email')::BOOLEAN, ticket_assigned_email),
    ticket_comment_email = COALESCE((p_preferences->>'ticket_comment_email')::BOOLEAN, ticket_comment_email),
    ticket_status_changed_email = COALESCE((p_preferences->>'ticket_status_changed_email')::BOOLEAN, ticket_status_changed_email),
    ticket_priority_changed_email = COALESCE((p_preferences->>'ticket_priority_changed_email')::BOOLEAN, ticket_priority_changed_email),
    mention_email = COALESCE((p_preferences->>'mention_email')::BOOLEAN, mention_email),

    ticket_assigned_app = COALESCE((p_preferences->>'ticket_assigned_app')::BOOLEAN, ticket_assigned_app),
    ticket_comment_app = COALESCE((p_preferences->>'ticket_comment_app')::BOOLEAN, ticket_comment_app),
    ticket_status_changed_app = COALESCE((p_preferences->>'ticket_status_changed_app')::BOOLEAN, ticket_status_changed_app),
    ticket_priority_changed_app = COALESCE((p_preferences->>'ticket_priority_changed_app')::BOOLEAN, ticket_priority_changed_app),
    mention_app = COALESCE((p_preferences->>'mention_app')::BOOLEAN, mention_app),

    kb_article_published_email = COALESCE((p_preferences->>'kb_article_published_email')::BOOLEAN, kb_article_published_email),
    kb_article_updated_email = COALESCE((p_preferences->>'kb_article_updated_email')::BOOLEAN, kb_article_updated_email),
    kb_article_published_app = COALESCE((p_preferences->>'kb_article_published_app')::BOOLEAN, kb_article_published_app),
    kb_article_updated_app = COALESCE((p_preferences->>'kb_article_updated_app')::BOOLEAN, kb_article_updated_app),

    digest_frequency = COALESCE(p_preferences->>'digest_frequency', digest_frequency),

    quiet_hours_enabled = COALESCE((p_preferences->>'quiet_hours_enabled')::BOOLEAN, quiet_hours_enabled),
    quiet_hours_start = COALESCE((p_preferences->>'quiet_hours_start')::TIME, quiet_hours_start),
    quiet_hours_end = COALESCE((p_preferences->>'quiet_hours_end')::TIME, quiet_hours_end),
    quiet_hours_days = COALESCE(p_preferences->'quiet_hours_days', quiet_hours_days),

    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_preferences;

  -- If no rows updated, create new preferences
  IF NOT FOUND THEN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user_notification_preferences IS 'Updates notification preferences for a user';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_notification_preferences TO authenticated;
