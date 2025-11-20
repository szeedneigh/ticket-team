-- Migration: Create System Settings Table
-- Description: Adds system_settings table for storing application configuration
-- Date: 2025-01-20

-- ============================================================================
-- SYSTEM SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  -- Primary key
  key TEXT PRIMARY KEY,

  -- Configuration value (stored as JSONB for flexibility)
  value JSONB NOT NULL,

  -- Optional description for documentation
  description TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT key_not_empty CHECK (LENGTH(TRIM(key)) > 0),
  CONSTRAINT value_not_null CHECK (value IS NOT NULL)
);

-- Table comment
COMMENT ON TABLE system_settings IS 'Key-value store for system configuration settings';

-- Column comments
COMMENT ON COLUMN system_settings.key IS 'Unique identifier for the setting';
COMMENT ON COLUMN system_settings.value IS 'Configuration value stored as JSON';
COMMENT ON COLUMN system_settings.description IS 'Human-readable description of the setting';
COMMENT ON COLUMN system_settings.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN system_settings.updated_by IS 'User who last updated this setting';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary key index automatically created
-- Add index for updated_at for audit queries
CREATE INDEX idx_system_settings_updated_at ON system_settings(updated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
CREATE POLICY "Authenticated users can view settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can modify settings
CREATE POLICY "Admins can insert settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Admins can update settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Admins can delete settings"
  ON system_settings FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- ============================================================================
-- SEED DEFAULT SETTINGS
-- ============================================================================

-- Insert default system configuration
INSERT INTO system_settings (key, value, description)
VALUES (
  'system_config',
  jsonb_build_object(
    'sla_response_hours', 24,
    'sla_resolution_hours', 72,
    'auto_assignment_enabled', false,
    'allow_ticket_reassignment', true,
    'require_resolution_notes', true,
    'max_attachment_size_mb', 10,
    'allowed_attachment_types', 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif'
  ),
  'Core system configuration'
)
ON CONFLICT (key) DO NOTHING;

-- Insert default email configuration
INSERT INTO system_settings (key, value, description)
VALUES (
  'email_config',
  jsonb_build_object(
    'smtp_enabled', false,
    'from_email', 'helpdesk@laverdad.edu.ph',
    'from_name', 'La Verdad Helpdesk',
    'send_on_ticket_created', true,
    'send_on_ticket_updated', true,
    'send_on_ticket_resolved', true,
    'send_on_comment_added', true
  ),
  'Email notification configuration'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON system_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON system_settings TO authenticated;
