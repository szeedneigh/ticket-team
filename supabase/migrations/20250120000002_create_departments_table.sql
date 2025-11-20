-- Migration: Create Departments Table
-- Description: Adds departments table for organizational structure management
-- Date: 2025-01-20

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Department information
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) >= 2),
  CONSTRAINT name_length CHECK (LENGTH(name) <= 100)
);

-- Table comment
COMMENT ON TABLE departments IS 'Organizational departments for user categorization';

-- Column comments
COMMENT ON COLUMN departments.id IS 'Unique identifier for the department';
COMMENT ON COLUMN departments.name IS 'Department name';
COMMENT ON COLUMN departments.description IS 'Optional description of the department';
COMMENT ON COLUMN departments.is_active IS 'Whether the department is active';
COMMENT ON COLUMN departments.created_at IS 'Creation timestamp';
COMMENT ON COLUMN departments.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN departments.created_by IS 'User who created this department';
COMMENT ON COLUMN departments.updated_by IS 'User who last updated this department';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary key index automatically created
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_active ON departments(is_active);
CREATE INDEX idx_departments_updated_at ON departments(updated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active departments
CREATE POLICY "Authenticated users can view active departments"
  ON departments FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Only admins can create departments
CREATE POLICY "Admins can insert departments"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Only admins can update departments
CREATE POLICY "Admins can update departments"
  ON departments FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Only admins can delete departments (soft delete preferred via is_active)
CREATE POLICY "Admins can delete departments"
  ON departments FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user count per department
CREATE OR REPLACE FUNCTION get_department_user_count(department_name TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM users
    WHERE department = department_name
      AND deactivated_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_department_user_count IS 'Gets the count of active users in a department';

-- Function to check if department can be deleted
CREATE OR REPLACE FUNCTION can_delete_department(department_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  dept_name TEXT;
  user_count INTEGER;
BEGIN
  -- Get department name
  SELECT name INTO dept_name
  FROM departments
  WHERE id = department_id;

  IF dept_name IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check user count
  user_count := get_department_user_count(dept_name);

  RETURN user_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION can_delete_department IS 'Checks if a department can be safely deleted (no users)';

-- ============================================================================
-- TRIGGER TO UPDATE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_departments_updated_at();

-- ============================================================================
-- SEED DEFAULT DEPARTMENTS
-- ============================================================================

INSERT INTO departments (name, description, is_active) VALUES
  ('IT Services', 'Information Technology support and infrastructure', true),
  ('Academic Affairs', 'Academic programs and faculty management', true),
  ('Admissions', 'Student admissions and enrollment', true),
  ('Finance', 'Financial operations and accounting', true),
  ('Library', 'Library services and resources', true),
  ('Registrar', 'Student records and registration', true),
  ('Human Resources', 'HR and personnel management', true),
  ('Facilities', 'Campus facilities and maintenance', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON departments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON departments TO authenticated;
GRANT EXECUTE ON FUNCTION get_department_user_count TO authenticated;
GRANT EXECUTE ON FUNCTION can_delete_department TO authenticated;
