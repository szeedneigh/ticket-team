-- Migration: Create core tables with constraints
-- Description: Creates all 10 core tables with proper foreign keys, checks, and defaults
-- Date: 2025-01-14

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 1. USERS TABLE
-- Links to auth.users.id (Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  department TEXT,
  position TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- 2. CATEGORIES TABLE
-- Self-referential for hierarchy (parent/subcategory)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'both',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT name_length CHECK (LENGTH(name) >= 2),
  CONSTRAINT valid_type CHECK (type IN ('ticket', 'knowledge_base', 'both'))
);

-- 3. TICKETS TABLE
-- Central transactional entity for support requests
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL,
  subcategory TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  CONSTRAINT title_length CHECK (LENGTH(title) >= 5),
  CONSTRAINT description_length CHECK (LENGTH(description) >= 10),
  CONSTRAINT category_not_empty CHECK (LENGTH(category) > 0)
);

-- 4. TICKET_COMMENTS TABLE
-- Chronological communication linked to tickets
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT content_not_empty CHECK (LENGTH(content) > 0)
);

-- 5. TICKET_ACTIVITIES TABLE
-- Comprehensive audit trail for all ticket lifecycle events
CREATE TABLE ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT action_not_empty CHECK (LENGTH(action) > 0)
);

-- 6. TICKET_FEEDBACK TABLE
-- Post-resolution satisfaction ratings
CREATE TABLE ticket_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT one_feedback_per_user_per_ticket UNIQUE (ticket_id, user_id)
);

-- 7. KNOWLEDGE_ARTICLES TABLE
-- Rich content repository with pgvector embeddings for RAG
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status article_status NOT NULL DEFAULT 'draft',
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_votes INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  embedding vector(1536),
  source_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  CONSTRAINT title_length CHECK (LENGTH(title) >= 5),
  CONSTRAINT content_length CHECK (LENGTH(content) >= 20),
  CONSTRAINT category_not_empty CHECK (LENGTH(category) > 0),
  CONSTRAINT valid_vote_counts CHECK (helpful_votes >= 0 AND total_votes >= 0 AND helpful_votes <= total_votes)
);

-- 8. ARTICLE_VOTES TABLE
-- Quality feedback mechanism for knowledge base articles
CREATE TABLE article_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT one_vote_per_user_per_article UNIQUE (article_id, user_id)
);

-- 9. AI_INTERACTIONS TABLE
-- Logs all AI assistant conversations for analytics
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  context_articles UUID[] DEFAULT '{}'::uuid[],
  was_helpful BOOLEAN,
  escalated_to_ticket BOOLEAN NOT NULL DEFAULT FALSE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT session_id_not_empty CHECK (LENGTH(session_id) > 0),
  CONSTRAINT query_not_empty CHECK (LENGTH(query) > 0),
  CONSTRAINT response_not_empty CHECK (LENGTH(response) > 0)
);

-- 10. ATTACHMENTS TABLE
-- Files uploaded to tickets or comments, stored in Supabase Storage
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT filename_not_empty CHECK (LENGTH(filename) > 0),
  CONSTRAINT storage_path_not_empty CHECK (LENGTH(storage_path) > 0),
  CONSTRAINT valid_size CHECK (size_bytes > 0)
);

-- Comments for documentation
COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth';
COMMENT ON TABLE categories IS 'Hierarchical taxonomy for tickets and KB articles';
COMMENT ON TABLE tickets IS 'Support ticket requests and tracking';
COMMENT ON TABLE ticket_comments IS 'Comments and communication on tickets';
COMMENT ON TABLE ticket_activities IS 'Audit trail of all ticket changes';
COMMENT ON TABLE ticket_feedback IS 'Post-resolution satisfaction ratings';
COMMENT ON TABLE knowledge_articles IS 'Knowledge base articles with vector embeddings';
COMMENT ON TABLE article_votes IS 'User feedback on KB article quality';
COMMENT ON TABLE ai_interactions IS 'AI assistant conversation logs';
COMMENT ON TABLE attachments IS 'File attachments linked to tickets and comments';

