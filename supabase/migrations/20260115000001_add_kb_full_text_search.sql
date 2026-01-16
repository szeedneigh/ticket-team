-- Migration: Add full-text search vector for KB articles
-- Description: Adds a generated tsvector column + GIN index for fast keyword search
-- Date: 2026-01-15

-- Add generated search vector (includes title + summary + content)
ALTER TABLE knowledge_articles
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' ||
    coalesce(summary, '') || ' ' ||
    coalesce(content, '')
  )
) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_search_vector
ON knowledge_articles
USING GIN (search_vector);

COMMENT ON COLUMN knowledge_articles.search_vector IS 'Generated tsvector for fast keyword search (title+summary+content, english config)';

