-- Migration: Create semantic search function for knowledge base
-- Description: Creates match_kb_articles function for pgvector similarity search
-- Date: 2025-01-15

CREATE OR REPLACE FUNCTION match_kb_articles(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  min_content_length int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  category text,
  subcategory text,
  tags text[],
  view_count int,
  helpful_votes int,
  total_votes int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_articles.id,
    knowledge_articles.title,
    knowledge_articles.content,
    knowledge_articles.summary,
    knowledge_articles.category,
    knowledge_articles.subcategory,
    knowledge_articles.tags,
    knowledge_articles.view_count,
    knowledge_articles.helpful_votes,
    knowledge_articles.total_votes,
    1 - (knowledge_articles.embedding <=> query_embedding) AS similarity
  FROM knowledge_articles
  WHERE
    knowledge_articles.status = 'published'
    AND LENGTH(knowledge_articles.content) >= min_content_length
    AND knowledge_articles.embedding IS NOT NULL
    AND 1 - (knowledge_articles.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION match_kb_articles IS 'Semantic search for KB articles using pgvector cosine similarity with Gemini embeddings (768-dim)';
