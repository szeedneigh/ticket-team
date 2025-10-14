-- Migration: Database functions and triggers
-- Description: Auto-update timestamps, activity logging, vote counting, and auth integration
-- Date: 2025-01-14

-- ============================================================================
-- TIMESTAMP UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to tables with updated_at
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TICKET ACTIVITY LOGGING TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO ticket_activities (ticket_id, user_id, action, old_value, new_value, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_changed',
      OLD.status::text,
      NEW.status::text,
      jsonb_build_object('timestamp', NOW())
    );
    
    -- Set resolved_at timestamp
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
      NEW.resolved_at = NOW();
    END IF;
    
    -- Set closed_at timestamp
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
      NEW.closed_at = NOW();
    END IF;
  END IF;

  -- Log priority changes
  IF (TG_OP = 'UPDATE' AND OLD.priority IS DISTINCT FROM NEW.priority) THEN
    INSERT INTO ticket_activities (ticket_id, user_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      auth.uid(),
      'priority_changed',
      OLD.priority::text,
      NEW.priority::text
    );
  END IF;

  -- Log assignment changes
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO ticket_activities (ticket_id, user_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      auth.uid(),
      'assigned',
      OLD.assigned_to::text,
      NEW.assigned_to::text
    );
  END IF;

  -- Log ticket creation
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO ticket_activities (ticket_id, user_id, action, new_value)
    VALUES (
      NEW.id,
      NEW.user_id,
      'created',
      jsonb_build_object(
        'title', NEW.title,
        'priority', NEW.priority,
        'category', NEW.category
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_ticket_changes
  AFTER INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_activity();

-- ============================================================================
-- ARTICLE VOTE COUNTING TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_article_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate vote counts for the article
  UPDATE knowledge_articles
  SET
    helpful_votes = (
      SELECT COUNT(*) FROM article_votes
      WHERE article_id = COALESCE(NEW.article_id, OLD.article_id)
      AND is_helpful = TRUE
    ),
    total_votes = (
      SELECT COUNT(*) FROM article_votes
      WHERE article_id = COALESCE(NEW.article_id, OLD.article_id)
    )
  WHERE id = COALESCE(NEW.article_id, OLD.article_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_article_votes_on_insert
  AFTER INSERT ON article_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_article_vote_counts();

CREATE TRIGGER update_article_votes_on_update
  AFTER UPDATE ON article_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_article_vote_counts();

CREATE TRIGGER update_article_votes_on_delete
  AFTER DELETE ON article_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_article_vote_counts();

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON AUTH SIGNUP (Critical!)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee' -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires after INSERT on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UPDATE LAST LOGIN TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_last_login();

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Soft delete attachment (staff only)
CREATE OR REPLACE FUNCTION public.soft_delete_attachment(p_attachment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Check if user is staff or above
  SELECT role INTO user_role_val
  FROM public.users
  WHERE id = auth.uid();

  IF user_role_val NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Soft delete the attachment
  UPDATE attachments
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE id = p_attachment_id
  AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deactivate user (admin/super_admin only, with guardrails)
CREATE OR REPLACE FUNCTION public.deactivate_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
  target_role user_role;
BEGIN
  -- Check if current user is admin or super_admin
  SELECT role INTO user_role_val
  FROM public.users
  WHERE id = auth.uid();

  IF user_role_val NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Get target user role
  SELECT role INTO target_role
  FROM public.users
  WHERE id = p_user_id;

  -- Prevent deactivating super_admin unless caller is super_admin
  IF target_role = 'super_admin' AND user_role_val != 'super_admin' THEN
    RAISE EXCEPTION 'Cannot deactivate super admin';
  END IF;

  -- Prevent self-deactivation
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot deactivate yourself';
  END IF;

  -- Deactivate the user
  UPDATE users
  SET
    deactivated_at = NOW(),
    deactivated_by = auth.uid()
  WHERE id = p_user_id
  AND deactivated_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set article published timestamp when status changes to published
CREATE OR REPLACE FUNCTION public.set_article_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_knowledge_article_published_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published')
  EXECUTE FUNCTION set_article_published_at();

-- Comments for documentation
COMMENT ON FUNCTION public.handle_new_user IS 'Auto-creates user profile when new auth user signs up';
COMMENT ON FUNCTION public.log_ticket_activity IS 'Automatically logs ticket changes to audit trail';
COMMENT ON FUNCTION public.update_article_vote_counts IS 'Maintains vote count aggregates on KB articles';
COMMENT ON FUNCTION public.soft_delete_attachment IS 'RPC function to soft-delete attachments (staff only)';
COMMENT ON FUNCTION public.deactivate_user IS 'RPC function to deactivate user accounts (admin only)';

