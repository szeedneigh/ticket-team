-- Migration: Create Ticket Templates Table
-- Description: Adds ticket_templates table for reusable ticket templates
-- Date: 2025-01-20
-- Status: CRITICAL - Required for /tickets/templates page

-- ============================================================================
-- TICKET TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_templates (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  name TEXT NOT NULL,
  description TEXT,

  -- Template content
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,

  -- Default ticket properties
  category TEXT NOT NULL,
  subcategory TEXT,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}'::text[],

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit fields
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT title_template_not_empty CHECK (LENGTH(TRIM(title_template)) > 0),
  CONSTRAINT description_template_not_empty CHECK (LENGTH(TRIM(description_template)) > 0),
  CONSTRAINT category_not_empty CHECK (LENGTH(TRIM(category)) > 0),
  CONSTRAINT unique_active_template_name UNIQUE (name) WHERE is_active = TRUE
);

-- Table comment
COMMENT ON TABLE ticket_templates IS 'Reusable templates for common ticket types';

-- Column comments
COMMENT ON COLUMN ticket_templates.name IS 'Unique name for the template';
COMMENT ON COLUMN ticket_templates.description IS 'Brief description of when to use this template';
COMMENT ON COLUMN ticket_templates.title_template IS 'Template for ticket title (may contain placeholders)';
COMMENT ON COLUMN ticket_templates.description_template IS 'Template for ticket description';
COMMENT ON COLUMN ticket_templates.category IS 'Default category for tickets created from this template';
COMMENT ON COLUMN ticket_templates.subcategory IS 'Default subcategory (optional)';
COMMENT ON COLUMN ticket_templates.priority IS 'Default priority for tickets created from this template';
COMMENT ON COLUMN ticket_templates.tags IS 'Default tags for tickets created from this template';
COMMENT ON COLUMN ticket_templates.is_active IS 'Whether this template is active and visible';
COMMENT ON COLUMN ticket_templates.created_by IS 'User who created this template';
COMMENT ON COLUMN ticket_templates.updated_by IS 'User who last updated this template';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary query patterns
CREATE INDEX idx_ticket_templates_category ON ticket_templates(category);
CREATE INDEX idx_ticket_templates_active ON ticket_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ticket_templates_created_at ON ticket_templates(created_at DESC);

-- Full-text search on template name and description
CREATE INDEX idx_ticket_templates_name_search ON ticket_templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================================================
-- TRIGGER: UPDATE updated_at
-- ============================================================================

CREATE TRIGGER set_ticket_templates_updated_at
  BEFORE UPDATE ON ticket_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ticket_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active templates
CREATE POLICY "Authenticated users can view active templates"
  ON ticket_templates FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Staff+ can view all templates (including inactive)
CREATE POLICY "Staff can view all templates"
  ON ticket_templates FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- Staff+ can create templates
CREATE POLICY "Staff can create templates"
  ON ticket_templates FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- Staff+ can update templates
CREATE POLICY "Staff can update templates"
  ON ticket_templates FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- Staff+ can delete templates (soft delete via is_active = FALSE)
CREATE POLICY "Staff can delete templates"
  ON ticket_templates FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- ============================================================================
-- SEED DEFAULT TEMPLATES
-- ============================================================================

-- Insert some common templates
INSERT INTO ticket_templates (name, description, title_template, description_template, category, priority, tags, created_by)
SELECT
  'Password Reset Request',
  'Template for password reset requests',
  'Password Reset Request for [User Name]',
  E'User is unable to access their account and requires a password reset.\n\nUser Details:\n- Name: [User Name]\n- Email: [User Email]\n- Department: [Department]\n\nReason: [Reason for reset]\n\nUrgency: [Specify urgency]',
  'Account & Access',
  'medium',
  ARRAY['password', 'access', 'account'],
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO ticket_templates (name, description, title_template, description_template, category, priority, tags, created_by)
SELECT
  'Software Installation Request',
  'Template for requesting software installation',
  'Software Installation: [Software Name]',
  E'Request for software installation.\n\nSoftware Details:\n- Name: [Software Name]\n- Version: [Version]\n- License: [License Type]\n\nPurpose: [Why is this software needed?]\n\nUser/Department: [User or Department]',
  'Software',
  'low',
  ARRAY['software', 'installation', 'request'],
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO ticket_templates (name, description, title_template, description_template, category, priority, tags, created_by)
SELECT
  'Network Connectivity Issue',
  'Template for network connectivity problems',
  'Network Connectivity Issue in [Location]',
  E'Network connectivity issue reported.\n\nLocation: [Building/Room]\nAffected Users: [Number of users]\nSymptoms: [Describe the issue]\n\nInternet access: [Yes/No]\nLocal network access: [Yes/No]\n\nWhen did the issue start? [Date/Time]',
  'Network & Internet',
  'high',
  ARRAY['network', 'connectivity', 'internet'],
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO ticket_templates (name, description, title_template, description_template, category, priority, tags, created_by)
SELECT
  'Hardware Malfunction',
  'Template for hardware issues',
  'Hardware Issue: [Device Type] - [Issue]',
  E'Hardware malfunction reported.\n\nDevice Type: [Desktop/Laptop/Printer/etc.]\nModel: [Model]\nAsset Tag: [Asset Tag if available]\n\nIssue Description: [Describe the problem]\n\nError Messages: [Any error messages]\n\nLocation: [Building/Room]\nUser: [User Name]',
  'Hardware',
  'medium',
  ARRAY['hardware', 'malfunction', 'repair'],
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO ticket_templates (name, description, title_template, description_template, category, priority, tags, created_by)
SELECT
  'Email Issue',
  'Template for email-related problems',
  'Email Issue: [Type of Issue]',
  E'Email-related issue reported.\n\nIssue Type: [Cannot send/Cannot receive/Both]\nEmail Client: [Outlook/Gmail/Other]\nAffected Account: [Email address]\n\nError Messages: [Any error messages]\n\nWhen did this start? [Date/Time]\n\nCan you access email on other devices? [Yes/No]',
  'Email & Communication',
  'medium',
  ARRAY['email', 'communication', 'outlook'],
  id
FROM users
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON ticket_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ticket_templates TO authenticated;

