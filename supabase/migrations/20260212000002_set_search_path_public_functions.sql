-- Migration: Set search_path=public for selected functions
-- Description: Hardens functions against search_path-based attacks by pinning them to the public schema.
-- Date: 2026-02-12

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS regproc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        -- Notifications & tickets
        'notify_ticket_comment',
        'notify_ticket_status_changed',
        'notify_ticket_assigned',
        'create_notification',
        'mark_notification_read',
        'mark_all_notifications_read',
        'get_unread_notification_count',

        -- Ticket numbers & sequences
        'generate_ticket_number',
        'set_ticket_display_number',

        -- Settings
        'set_setting',
        'get_setting',

        -- KB / RAG
        'match_kb_articles',
        'update_article_vote_counts',
        'set_article_published_at',
        'get_categories_with_counts',

        -- Departments & counts
        'get_departments_with_user_counts',
        'get_department_user_count',
        'update_departments_updated_at',
        'can_delete_department',

        -- Users, sessions & presence
        'get_user_role',
        'get_user_recent_events',
        'update_user_last_seen',
        'handle_new_user',
        'track_user_session',
        'get_active_sessions_count',
        'revoke_user_session',
        'revoke_all_other_sessions',
        'update_last_login',
        'update_user_preferences_updated_at',

        -- Files & uploads
        'get_user_upload_path',
        'soft_delete_attachment',

        -- Tickets & activities
        'log_ticket_activity',
        'get_ticket_event_context',
        'set_first_response_at',

        -- AI / analytics
        'match_ai_events',
        'match_ai_event_embeddings',
        'get_ai_model_usage_stats',
        'get_automation_metrics',

        -- Misc maintenance
        'cleanup_old_sessions',
        'update_updated_at_column',
        'increment_canned_response_usage'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.regproc);
  END LOOP;
END;
$$;

