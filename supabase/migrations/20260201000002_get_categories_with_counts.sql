-- Migration: Get Categories with Counts
-- Description: Single RPC to fetch categories with ticket/article counts (eliminates N+1)
-- Date: 2026-02-01

-- ============================================================================
-- FUNCTION: get_categories_with_counts
-- ============================================================================
-- Returns categories with ticket_count and article_count in a single query.
-- Replaces N+1 pattern of 2 queries per category.

CREATE OR REPLACE FUNCTION get_categories_with_counts(
  p_filter_type TEXT DEFAULT NULL,
  p_filter_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  parent_id UUID,
  type TEXT,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMPTZ,
  ticket_count BIGINT,
  article_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.parent_id,
    c.type,
    c.is_active,
    COALESCE(c.display_order, 0)::INTEGER AS display_order,
    c.created_at,
    (SELECT COUNT(*)::BIGINT FROM tickets t WHERE t.category = c.name) AS ticket_count,
    (SELECT COUNT(*)::BIGINT FROM knowledge_articles ka WHERE ka.category = c.name) AS article_count
  FROM categories c
  WHERE
    (p_filter_type IS NULL OR c.type = p_filter_type OR c.type = 'both')
    AND (p_filter_is_active IS NULL OR c.is_active = p_filter_is_active)
  ORDER BY c.display_order ASC NULLS LAST, c.name ASC;
$$;

COMMENT ON FUNCTION get_categories_with_counts IS 'Returns categories with ticket and article counts in a single query. Eliminates N+1 pattern.';

GRANT EXECUTE ON FUNCTION get_categories_with_counts TO authenticated;
