-- Migration: Create performance indexes
-- Description: B-tree indexes for queries, HNSW vector index for semantic search
-- Date: 2025-01-14

-- ============================================================================
-- CRITICAL INDEXES (Immediate Query Performance)
-- ============================================================================

-- TICKETS - Most frequent queries
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- Composite index for staff dashboard (assigned tickets filtered by status)
CREATE INDEX idx_tickets_assigned_status ON tickets(assigned_to, status) 
  WHERE assigned_to IS NOT NULL;

-- Composite for priority + status filtering
CREATE INDEX idx_tickets_status_priority ON tickets(status, priority);

-- KNOWLEDGE ARTICLES - Vector similarity search (HNSW for optimal performance)
CREATE INDEX idx_knowledge_articles_embedding ON knowledge_articles 
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- SECONDARY INDEXES (Analytical Queries)
-- ============================================================================

-- KNOWLEDGE ARTICLES - Filtering and discovery
CREATE INDEX idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX idx_knowledge_articles_category ON knowledge_articles(category, subcategory);
CREATE INDEX idx_knowledge_articles_author_id ON knowledge_articles(author_id);
CREATE INDEX idx_knowledge_articles_published_at ON knowledge_articles(published_at DESC) 
  WHERE status = 'published';

-- AI INTERACTIONS - Analytics and session tracking
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at DESC);
CREATE INDEX idx_ai_interactions_escalated ON ai_interactions(escalated_to_ticket) 
  WHERE escalated_to_ticket = TRUE;

-- TICKET COMMENTS - Timeline queries
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at);
CREATE INDEX idx_ticket_comments_user_id ON ticket_comments(user_id);

-- TICKET ACTIVITIES - Audit trail queries
CREATE INDEX idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);
CREATE INDEX idx_ticket_activities_user_id ON ticket_activities(user_id);
CREATE INDEX idx_ticket_activities_created_at ON ticket_activities(created_at DESC);

-- ============================================================================
-- FOREIGN KEY INDEXES (JOIN Optimization)
-- ============================================================================

-- TICKET FEEDBACK
CREATE INDEX idx_ticket_feedback_ticket_id ON ticket_feedback(ticket_id);
CREATE INDEX idx_ticket_feedback_user_id ON ticket_feedback(user_id);

-- ARTICLE VOTES
CREATE INDEX idx_article_votes_article_id ON article_votes(article_id);
CREATE INDEX idx_article_votes_user_id ON article_votes(user_id);

-- ATTACHMENTS
CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);
CREATE INDEX idx_attachments_comment_id ON attachments(comment_id) 
  WHERE comment_id IS NOT NULL;
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);

-- CATEGORIES
CREATE INDEX idx_categories_parent_id ON categories(parent_id) 
  WHERE parent_id IS NOT NULL;
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- USERS
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deactivated_at ON users(deactivated_at) 
  WHERE deactivated_at IS NOT NULL;

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES (Optional - for keyword search)
-- ============================================================================

-- Tickets - Full-text search on title and description
CREATE INDEX idx_tickets_search ON tickets 
  USING gin(to_tsvector('english', title || ' ' || description));

-- Knowledge Articles - Full-text search on title and content
CREATE INDEX idx_knowledge_articles_search ON knowledge_articles 
  USING gin(to_tsvector('english', title || ' ' || content));

-- ============================================================================
-- SPECIALIZED INDEXES
-- ============================================================================

-- GIN index for array search on knowledge article tags
CREATE INDEX idx_knowledge_articles_tags ON knowledge_articles USING gin(tags);

-- GIN index for JSONB metadata searches (if needed)
CREATE INDEX idx_tickets_metadata ON tickets USING gin(metadata);
CREATE INDEX idx_ai_interactions_metadata ON ai_interactions USING gin(metadata);

-- Comments for documentation
COMMENT ON INDEX idx_tickets_assigned_status IS 'Composite index for staff dashboard queries';
COMMENT ON INDEX idx_knowledge_articles_embedding IS 'HNSW vector index for semantic similarity search';
COMMENT ON INDEX idx_tickets_search IS 'Full-text search index for ticket title and description';
COMMENT ON INDEX idx_knowledge_articles_search IS 'Full-text search index for KB articles';

