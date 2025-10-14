-- Migration: Row Level Security (RLS) Policies
-- Description: Enable RLS and create security policies for all tables
-- Date: 2025-01-14

-- ============================================================================
-- HELPER FUNCTION for checking user role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- USERS TABLE
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Read: Users can read their own profile + admins can read all
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() 
    OR get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Insert: Only during signup (handled by trigger)
CREATE POLICY "Users can insert own profile during signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Update: Users can update own profile, admins can update all
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    id = auth.uid()
    OR get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Read: Public (all authenticated users can view categories)
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO authenticated
  USING (TRUE);

-- Write: Staff and above can manage categories
CREATE POLICY "Staff can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- ============================================================================
-- TICKETS TABLE
-- ============================================================================

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Read: Submitter or staff can view
CREATE POLICY "Users can read tickets they created or are assigned to"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
  );

-- Insert: Users can create tickets for themselves
CREATE POLICY "Users can create own tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update: Staff can update all tickets, users cannot update their own (must use comments)
CREATE POLICY "Staff can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'))
  WITH CHECK (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- Delete: Only super_admin can delete tickets (soft-delete via status recommended)
CREATE POLICY "Super admin can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'super_admin');

-- ============================================================================
-- TICKET_COMMENTS TABLE
-- ============================================================================

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Read: Same visibility as parent ticket
CREATE POLICY "Users can read comments on accessible tickets"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
      )
    )
    -- Filter out internal comments for non-staff
    AND (
      NOT is_internal
      OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
    )
  );

-- Insert: Users can comment on tickets they can access
CREATE POLICY "Users can create comments on accessible tickets"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
      )
    )
  );

-- Update: Users can update their own comments, staff can update all
CREATE POLICY "Users can update own comments"
  ON ticket_comments FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
  );

-- ============================================================================
-- TICKET_ACTIVITIES TABLE
-- ============================================================================

ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;

-- Read: Same visibility as parent ticket
CREATE POLICY "Users can read activities on accessible tickets"
  ON ticket_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_activities.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
      )
    )
  );

-- Insert: Only via triggers/functions (no direct insert)
CREATE POLICY "Only system can insert activities"
  ON ticket_activities FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

-- ============================================================================
-- TICKET_FEEDBACK TABLE
-- ============================================================================

ALTER TABLE ticket_feedback ENABLE ROW LEVEL SECURITY;

-- Read: Only super_admin can read feedback
CREATE POLICY "Only super admin can read feedback"
  ON ticket_feedback FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'super_admin');

-- Insert: Only ticket submitter can provide feedback
CREATE POLICY "Ticket submitter can provide feedback"
  ON ticket_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_feedback.ticket_id
      AND tickets.user_id = auth.uid()
    )
  );

-- No updates/deletes (immutable for analytics)

-- ============================================================================
-- KNOWLEDGE_ARTICLES TABLE
-- ============================================================================

ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Read: Published articles are public, drafts only visible to staff
CREATE POLICY "Published articles are publicly readable"
  ON knowledge_articles FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
  );

-- Insert: Only staff can create articles
CREATE POLICY "Staff can create articles"
  ON knowledge_articles FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
  );

-- Update: Author or admin can update
CREATE POLICY "Author or admin can update articles"
  ON knowledge_articles FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Delete: Only admin can delete
CREATE POLICY "Admin can delete articles"
  ON knowledge_articles FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- ============================================================================
-- ARTICLE_VOTES TABLE
-- ============================================================================

ALTER TABLE article_votes ENABLE ROW LEVEL SECURITY;

-- Read: Users can read own votes, staff can read all
CREATE POLICY "Users can read own votes"
  ON article_votes FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
  );

-- Insert: Users can vote on published articles
CREATE POLICY "Users can vote on published articles"
  ON article_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM knowledge_articles
      WHERE knowledge_articles.id = article_votes.article_id
      AND knowledge_articles.status = 'published'
    )
  );

-- Update: Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON article_votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- AI_INTERACTIONS TABLE
-- ============================================================================

ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Read: Users can read own interactions, staff can read all
CREATE POLICY "Users can read own AI interactions"
  ON ai_interactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
  );

-- Insert: Users can create their own interactions
CREATE POLICY "Users can create own AI interactions"
  ON ai_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- ATTACHMENTS TABLE
-- ============================================================================

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Read: Same visibility as parent ticket
CREATE POLICY "Users can read attachments on accessible tickets"
  ON attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = attachments.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
      )
    )
  );

-- Insert: Users can upload to accessible tickets
CREATE POLICY "Users can upload attachments to accessible tickets"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = attachments.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
      )
    )
  );

-- Update: Only for soft-delete by staff
CREATE POLICY "Staff can soft delete attachments"
  ON attachments FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin'));

-- Comments for documentation
COMMENT ON FUNCTION public.get_user_role IS 'Helper function to retrieve user role for RLS policies';

