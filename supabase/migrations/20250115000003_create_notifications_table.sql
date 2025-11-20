-- Migration: Create Notifications Table
-- Description: Adds persistent notifications system with RLS policies
-- Date: 2025-01-15

-- ============================================================================
-- NOTIFICATION TYPE ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'ticket_assigned',
    'ticket_comment',
    'ticket_resolved',
    'ticket_status_changed',
    'ticket_priority_changed',
    'mention',
    'system_alert',
    'kb_article_published'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE notification_type IS 'Types of notifications that can be sent to users';

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target user
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification content
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related entities (optional)
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  article_id UUID REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who triggered the notification

  -- Metadata for additional context
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Status tracking
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message)) > 0)
);

-- Table comment
COMMENT ON TABLE notifications IS 'User notifications for system events';

-- Column comments
COMMENT ON COLUMN notifications.user_id IS 'User who receives this notification';
COMMENT ON COLUMN notifications.type IS 'Type of notification';
COMMENT ON COLUMN notifications.title IS 'Short title/subject of the notification';
COMMENT ON COLUMN notifications.message IS 'Full notification message';
COMMENT ON COLUMN notifications.ticket_id IS 'Related ticket if applicable';
COMMENT ON COLUMN notifications.article_id IS 'Related KB article if applicable';
COMMENT ON COLUMN notifications.actor_id IS 'User who triggered this notification';
COMMENT ON COLUMN notifications.metadata IS 'Additional context data as JSON';
COMMENT ON COLUMN notifications.read_at IS 'When the notification was marked as read';
COMMENT ON COLUMN notifications.archived_at IS 'When the notification was archived';
COMMENT ON COLUMN notifications.created_at IS 'When the notification was created';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary query patterns
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Filter by type
CREATE INDEX idx_notifications_type ON notifications(type);

-- Related entity lookups
CREATE INDEX idx_notifications_ticket_id ON notifications(ticket_id)
  WHERE ticket_id IS NOT NULL;
CREATE INDEX idx_notifications_article_id ON notifications(article_id)
  WHERE article_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark as read/archive) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- System/triggers can insert notifications (using service role)
-- Regular users cannot directly create notifications
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- Staff+ can insert notifications (for manual alerts)
CREATE POLICY "Staff can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_ticket_id UUID DEFAULT NULL,
  p_article_id UUID DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    ticket_id,
    article_id,
    actor_id,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_ticket_id,
    p_article_id,
    p_actor_id,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_notification IS 'Creates a new notification for a user';

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_notification_read IS 'Marks a notification as read';

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read_at = NOW()
  WHERE user_id = auth.uid()
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_all_notifications_read IS 'Marks all unread notifications as read for the current user';

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = auth.uid()
      AND read_at IS NULL
      AND archived_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_unread_notification_count IS 'Gets the count of unread notifications for the current user';

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- ============================================================================

-- Trigger function for ticket assignment notifications
CREATE OR REPLACE FUNCTION notify_ticket_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if assigned_to changed and is not null
  IF NEW.assigned_to IS NOT NULL AND
     (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN

    PERFORM create_notification(
      NEW.assigned_to,
      'ticket_assigned',
      'New Ticket Assigned',
      format('You have been assigned to ticket: %s', NEW.title),
      NEW.id,
      NULL,
      auth.uid(),
      jsonb_build_object('ticket_title', NEW.title, 'priority', NEW.priority)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_ticket_assigned
  AFTER UPDATE ON tickets
  FOR EACH ROW
  WHEN (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)
  EXECUTE FUNCTION notify_ticket_assigned();

-- Trigger function for ticket status change notifications
CREATE OR REPLACE FUNCTION notify_ticket_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify ticket owner when status changes (except when they changed it)
  IF NEW.status != OLD.status AND NEW.user_id != auth.uid() THEN
    PERFORM create_notification(
      NEW.user_id,
      'ticket_status_changed',
      'Ticket Status Updated',
      format('Your ticket "%s" status changed from %s to %s',
             NEW.title, OLD.status, NEW.status),
      NEW.id,
      NULL,
      auth.uid(),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'ticket_title', NEW.title
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_ticket_status_changed
  AFTER UPDATE ON tickets
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION notify_ticket_status_changed();

-- Trigger function for ticket comment notifications
CREATE OR REPLACE FUNCTION notify_ticket_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket RECORD;
BEGIN
  -- Get ticket details
  SELECT id, title, user_id, assigned_to INTO v_ticket
  FROM tickets WHERE id = NEW.ticket_id;

  -- Notify ticket owner (if they didn't write the comment)
  IF v_ticket.user_id != NEW.user_id THEN
    PERFORM create_notification(
      v_ticket.user_id,
      'ticket_comment',
      'New Comment on Your Ticket',
      format('New comment on ticket: %s', v_ticket.title),
      v_ticket.id,
      NULL,
      NEW.user_id,
      jsonb_build_object('ticket_title', v_ticket.title)
    );
  END IF;

  -- Notify assigned staff (if they didn't write the comment and are not the owner)
  IF v_ticket.assigned_to IS NOT NULL
     AND v_ticket.assigned_to != NEW.user_id
     AND v_ticket.assigned_to != v_ticket.user_id THEN
    PERFORM create_notification(
      v_ticket.assigned_to,
      'ticket_comment',
      'New Comment on Assigned Ticket',
      format('New comment on ticket: %s', v_ticket.title),
      v_ticket.id,
      NULL,
      NEW.user_id,
      jsonb_build_object('ticket_title', v_ticket.title)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_ticket_comment
  AFTER INSERT ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_comment();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_notification TO service_role;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
