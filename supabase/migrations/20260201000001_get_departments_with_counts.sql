-- Migration: Get Departments with User Counts
-- Description: Single RPC to fetch all departments with user counts (eliminates N+1)
-- Date: 2026-02-01

-- ============================================================================
-- FUNCTION: get_departments_with_user_counts
-- ============================================================================
-- Returns all departments with user_count in a single query.
-- Replaces N+1 pattern of get_department_user_count per department.

CREATE OR REPLACE FUNCTION get_departments_with_user_counts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  user_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.description,
    d.is_active,
    d.display_order,
    d.created_at,
    d.updated_at,
    d.created_by,
    d.updated_by,
    COUNT(u.id)::BIGINT AS user_count
  FROM departments d
  LEFT JOIN users u
    ON u.department = d.name
    AND u.deactivated_at IS NULL
  GROUP BY d.id, d.name, d.description, d.is_active, d.display_order, d.created_at, d.updated_at, d.created_by, d.updated_by
  ORDER BY d.display_order ASC NULLS LAST, d.name ASC;
$$;

COMMENT ON FUNCTION get_departments_with_user_counts IS 'Returns all departments with user counts in a single query. Eliminates N+1 pattern.';

GRANT EXECUTE ON FUNCTION get_departments_with_user_counts TO authenticated;
