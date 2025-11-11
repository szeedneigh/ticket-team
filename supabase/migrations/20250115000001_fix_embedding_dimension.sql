-- Migration: Fix embedding dimension for Gemini text-embedding-004
-- Description: Changes embedding from vector(1536) to vector(768) to match Gemini API
-- Date: 2025-01-15

-- Drop existing index first
DROP INDEX IF EXISTS idx_knowledge_articles_embedding;

-- Alter the embedding column dimension
ALTER TABLE knowledge_articles
ALTER COLUMN embedding TYPE vector(768);

-- Recreate the index with correct dimension
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_embedding
ON knowledge_articles
USING hnsw (embedding vector_cosine_ops);

-- Add comment
COMMENT ON COLUMN knowledge_articles.embedding IS 'Gemini text-embedding-004 vector (768 dimensions)';
