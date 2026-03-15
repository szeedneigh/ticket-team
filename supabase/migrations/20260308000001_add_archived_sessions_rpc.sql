-- Migration: Add RPC for paginated archived chat sessions
-- Description: Efficient DB-level grouping and pagination of archived chat sessions
-- instead of fetching all rows and slicing in memory.
-- Date: 2026-03-08

CREATE OR REPLACE FUNCTION get_archived_chat_sessions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  session_id TEXT,
  title TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  message_count BIGINT,
  escalated BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH session_agg AS (
    SELECT
      ai.session_id,
      MAX(ai.created_at) AS last_message_at,
      COUNT(*) AS message_count,
      BOOL_OR(ai.escalated_to_ticket) AS escalated
    FROM ai_interactions ai
    WHERE ai.user_id = p_user_id
      AND ai.archived_at IS NOT NULL
    GROUP BY ai.session_id
    ORDER BY last_message_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  session_titles AS (
    SELECT DISTINCT ON (ai.session_id)
      ai.session_id,
      (ai.metadata->>'session_title') AS title
    FROM ai_interactions ai
    WHERE ai.user_id = p_user_id
      AND ai.archived_at IS NOT NULL
      AND ai.metadata->>'session_title' IS NOT NULL
    ORDER BY ai.session_id, ai.created_at ASC
  ),
  latest_messages AS (
    SELECT DISTINCT ON (ai.session_id)
      ai.session_id,
      ai.query AS last_message
    FROM ai_interactions ai
    INNER JOIN session_agg sa ON sa.session_id = ai.session_id
    WHERE ai.user_id = p_user_id
      AND ai.archived_at IS NOT NULL
    ORDER BY ai.session_id, ai.created_at DESC
  )
  SELECT
    sa.session_id,
    st.title,
    lm.last_message,
    sa.last_message_at,
    sa.message_count,
    sa.escalated
  FROM session_agg sa
  LEFT JOIN session_titles st ON st.session_id = sa.session_id
  LEFT JOIN latest_messages lm ON lm.session_id = sa.session_id
  ORDER BY sa.last_message_at DESC;
$$;

COMMENT ON FUNCTION get_archived_chat_sessions IS 'Returns paginated archived chat session summaries for a user with DB-level grouping';

GRANT EXECUTE ON FUNCTION get_archived_chat_sessions TO authenticated;


-- ============================================================================
-- RPC for paginated active (non-archived) chat sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_active_chat_sessions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  session_id TEXT,
  title TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  message_count BIGINT,
  escalated BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH session_agg AS (
    SELECT
      ai.session_id,
      MAX(ai.created_at) AS last_message_at,
      COUNT(*) AS message_count,
      BOOL_OR(ai.escalated_to_ticket) AS escalated
    FROM ai_interactions ai
    WHERE ai.user_id = p_user_id
      AND ai.archived_at IS NULL
    GROUP BY ai.session_id
    ORDER BY last_message_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  session_titles AS (
    SELECT DISTINCT ON (ai.session_id)
      ai.session_id,
      (ai.metadata->>'session_title') AS title
    FROM ai_interactions ai
    WHERE ai.user_id = p_user_id
      AND ai.archived_at IS NULL
      AND ai.metadata->>'session_title' IS NOT NULL
    ORDER BY ai.session_id, ai.created_at ASC
  ),
  latest_messages AS (
    SELECT DISTINCT ON (ai.session_id)
      ai.session_id,
      ai.query AS last_message
    FROM ai_interactions ai
    INNER JOIN session_agg sa ON sa.session_id = ai.session_id
    WHERE ai.user_id = p_user_id
      AND ai.archived_at IS NULL
    ORDER BY ai.session_id, ai.created_at DESC
  )
  SELECT
    sa.session_id,
    st.title,
    lm.last_message,
    sa.last_message_at,
    sa.message_count,
    sa.escalated
  FROM session_agg sa
  LEFT JOIN session_titles st ON st.session_id = sa.session_id
  LEFT JOIN latest_messages lm ON lm.session_id = sa.session_id
  ORDER BY sa.last_message_at DESC;
$$;

COMMENT ON FUNCTION get_active_chat_sessions IS 'Returns paginated active (non-archived) chat session summaries for a user with DB-level grouping';

GRANT EXECUTE ON FUNCTION get_active_chat_sessions TO authenticated;
