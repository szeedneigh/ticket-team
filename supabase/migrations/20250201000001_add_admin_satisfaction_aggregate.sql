-- Migration: Add admin satisfaction aggregate function
-- Description: Allows admins to view aggregated satisfaction scores without seeing individual feedback comments
-- Date: 2025-02-01

-- ============================================================================
-- ADMIN SATISFACTION AGGREGATE FUNCTION
-- ============================================================================
-- This function allows admins and super_admins to view aggregated satisfaction
-- metrics (ratings, distribution, category breakdown) without exposing
-- individual feedback comments, which remain visible only to super_admins.

CREATE OR REPLACE FUNCTION public.get_satisfaction_aggregate(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  overall_score NUMERIC;
  total_responses INTEGER;
  rating_distribution JSONB;
  category_breakdown JSONB;
BEGIN
  -- Verify user is admin or super_admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Set default date range to last 30 days if not provided
  IF start_date IS NULL THEN
    start_date := NOW() - INTERVAL '30 days';
  END IF;
  IF end_date IS NULL THEN
    end_date := NOW();
  END IF;

  -- Calculate overall satisfaction score
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO overall_score, total_responses
  FROM ticket_feedback tf
  INNER JOIN tickets t ON t.id = tf.ticket_id
  WHERE t.created_at >= start_date
    AND t.created_at <= end_date;

  -- Calculate rating distribution (1-5 stars)
  SELECT jsonb_build_object(
    '1', COUNT(*) FILTER (WHERE rating = 1),
    '2', COUNT(*) FILTER (WHERE rating = 2),
    '3', COUNT(*) FILTER (WHERE rating = 3),
    '4', COUNT(*) FILTER (WHERE rating = 4),
    '5', COUNT(*) FILTER (WHERE rating = 5)
  )
  INTO rating_distribution
  FROM ticket_feedback tf
  INNER JOIN tickets t ON t.id = tf.ticket_id
  WHERE t.created_at >= start_date
    AND t.created_at <= end_date;

  -- Calculate satisfaction by category
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'category', category,
        'score', ROUND(avg_rating::numeric, 1),
        'responses', response_count
      )
      ORDER BY category
    ),
    '[]'::jsonb
  )
  INTO category_breakdown
  FROM (
    SELECT 
      COALESCE(t.category, 'Uncategorized') as category,
      AVG(tf.rating) as avg_rating,
      COUNT(*) as response_count
    FROM ticket_feedback tf
    INNER JOIN tickets t ON t.id = tf.ticket_id
    WHERE t.created_at >= start_date
      AND t.created_at <= end_date
    GROUP BY COALESCE(t.category, 'Uncategorized')
  ) category_stats;

  -- Build result JSON
  result := jsonb_build_object(
    'overallScore', ROUND(overall_score::numeric, 1),
    'totalResponses', total_responses,
    'distribution', rating_distribution,
    'byCategory', category_breakdown,
    'dateRange', jsonb_build_object(
      'start', start_date,
      'end', end_date
    )
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (RLS will enforce admin role)
GRANT EXECUTE ON FUNCTION public.get_satisfaction_aggregate(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_satisfaction_aggregate IS 
  'Returns aggregated satisfaction metrics (ratings only, no comments) for admins and super_admins. '
  'Comments remain visible only to super_admins via direct table access.';
