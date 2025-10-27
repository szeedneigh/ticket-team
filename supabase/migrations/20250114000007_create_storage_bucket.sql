-- Migration: Create storage bucket for user uploads
-- Description: Creates user-uploads bucket with RLS policies for avatars and attachments
-- Date: 2025-01-14

-- ============================================================================
-- CREATE STORAGE BUCKET
-- ============================================================================

-- Create the storage bucket for user uploads (avatars, attachments, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true, -- Public bucket for avatars and public uploads
  5242880, -- 5MB file size limit (in bytes)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'] -- Only allow images
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all files in user-uploads bucket
CREATE POLICY "Public read access to user-uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Policy: Allow admins to manage all files in the bucket
CREATE POLICY "Admins can manage all files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  bucket_id = 'user-uploads' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Function to get the user's upload path prefix
CREATE OR REPLACE FUNCTION get_user_upload_path(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::text || '/' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql STABLE;
