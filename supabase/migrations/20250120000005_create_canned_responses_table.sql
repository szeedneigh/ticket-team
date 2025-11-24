-- Migration: Create Canned Responses Table
-- Description: Adds canned_responses table for quick reply templates
-- Date: 2025-01-20
-- Status: CRITICAL - Required for /tickets/canned-responses page

-- ============================================================================
-- CANNED RESPONSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS canned_responses (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Response identification
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Organization
  category TEXT,
  shortcut TEXT,

  -- Usage tracking
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,

  -- Audit fields
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  CONSTRAINT usage_count_non_negative CHECK (usage_count >= 0),
  CONSTRAINT unique_active_shortcut UNIQUE (shortcut) WHERE is_active = TRUE AND shortcut IS NOT NULL,
  CONSTRAINT shortcut_format CHECK (shortcut IS NULL OR (shortcut ~ '^[a-z0-9_-]+$' AND LENGTH(shortcut) >= 2))
);

-- Table comment
COMMENT ON TABLE canned_responses IS 'Quick reply templates for ticket comments';

-- Column comments
COMMENT ON COLUMN canned_responses.title IS 'Display name for the canned response';
COMMENT ON COLUMN canned_responses.content IS 'The template text to insert';
COMMENT ON COLUMN canned_responses.category IS 'Optional category for organization';
COMMENT ON COLUMN canned_responses.shortcut IS 'Keyboard shortcut (e.g., "greet" for /greet)';
COMMENT ON COLUMN canned_responses.is_active IS 'Whether this response is active and visible';
COMMENT ON COLUMN canned_responses.usage_count IS 'Number of times this response has been used';
COMMENT ON COLUMN canned_responses.created_by IS 'User who created this response';
COMMENT ON COLUMN canned_responses.updated_by IS 'User who last updated this response';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary query patterns
CREATE INDEX idx_canned_responses_category ON canned_responses(category);
CREATE INDEX idx_canned_responses_active ON canned_responses(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_canned_responses_usage ON canned_responses(usage_count DESC);
CREATE INDEX idx_canned_responses_shortcut ON canned_responses(shortcut) WHERE shortcut IS NOT NULL;

-- Full-text search on title and content
CREATE INDEX idx_canned_responses_search ON canned_responses USING gin(to_tsvector('english', title || ' ' || content));

-- ============================================================================
-- TRIGGER: UPDATE updated_at
-- ============================================================================

CREATE TRIGGER set_canned_responses_updated_at
  BEFORE UPDATE ON canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: INCREMENT usage_count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_canned_response_usage(response_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE canned_responses
  SET usage_count = usage_count + 1
  WHERE id = response_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_canned_response_usage IS 'Increments the usage count for a canned response';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active responses
CREATE POLICY "Authenticated users can view active responses"
  ON canned_responses FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Staff+ can view all responses (including inactive)
CREATE POLICY "Staff can view all responses"
  ON canned_responses FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- Staff+ can create responses
CREATE POLICY "Staff can create responses"
  ON canned_responses FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- Staff+ can update responses
CREATE POLICY "Staff can update responses"
  ON canned_responses FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- Staff+ can delete responses (soft delete via is_active = FALSE)
CREATE POLICY "Staff can delete responses"
  ON canned_responses FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- ============================================================================
-- SEED DEFAULT CANNED RESPONSES
-- ============================================================================

-- Insert common canned responses
INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Greeting',
  E'Hello! Thank you for contacting La Verdad IT Support. I''m looking into your request and will get back to you shortly.',
  'General',
  'greet',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Closing - Resolved',
  E'Your issue has been resolved. If you experience any further problems, please don''t hesitate to create a new ticket or reply to this one.\n\nThank you for your patience!',
  'Closing',
  'resolved',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Request More Information',
  E'Thank you for submitting your ticket. To help us resolve your issue more quickly, could you please provide the following additional information:\n\n- [Information needed]\n- [Information needed]\n- [Information needed]\n\nOnce we receive this information, we''ll be able to proceed with resolving your issue.',
  'General',
  'moreinfo',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Password Reset Instructions',
  E'To reset your password, please follow these steps:\n\n1. Go to the login page\n2. Click "Forgot Password?"\n3. Enter your email address\n4. Check your email for the reset link\n5. Follow the link and set a new password\n\nIf you don''t receive the email within 5 minutes, please check your spam folder or contact us.',
  'Account & Access',
  'pwreset',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Escalated to IT Manager',
  E'Thank you for your patience. Your issue has been escalated to our IT Manager for further review. You should expect an update within [timeframe].',
  'Escalation',
  'escalate',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Scheduled Maintenance Notice',
  E'Please note that we have scheduled maintenance that may affect this service:\n\nDate: [Date]\nTime: [Time]\nExpected Duration: [Duration]\n\nWe apologize for any inconvenience this may cause.',
  'General',
  'maintenance',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Remote Support Request',
  E'To assist you with this issue, I''d like to remotely access your computer. Please let me know a convenient time, and I''ll send you a secure remote support link.\n\nAvailable times:\n- [Time slot 1]\n- [Time slot 2]\n- [Time slot 3]',
  'Support',
  'remote',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Waiting on Third Party',
  E'We''ve identified that this issue requires assistance from [Third Party Name]. We''ve contacted them and are awaiting their response.\n\nExpected response time: [Timeframe]\n\nWe''ll update you as soon as we hear back from them.',
  'Status',
  'thirdparty',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

INSERT INTO canned_responses (title, content, category, shortcut, created_by)
SELECT
  'Thank You',
  E'Thank you for confirming that the issue is resolved. Your feedback helps us improve our services.\n\nIf you encounter any other issues, please don''t hesitate to reach out!',
  'Closing',
  'thanks',
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (shortcut) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON canned_responses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON canned_responses TO authenticated;
GRANT EXECUTE ON FUNCTION increment_canned_response_usage TO authenticated;

