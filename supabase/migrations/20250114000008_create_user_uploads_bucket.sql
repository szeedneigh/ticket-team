-- Migration: Create user-uploads storage bucket
-- Description: Creates storage bucket for user avatar uploads with RLS policies
-- Date: 2025-10-30

-- Create the user-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true, -- Public bucket so avatars can be displayed
  5242880, -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for user-uploads bucket
-- Policy: Users can view all avatars (public bucket)
CREATE POLICY "Users can view all avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-uploads');

-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
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

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment on bucket
COMMENT ON TABLE storage.buckets IS 'User avatar uploads with 5MB limit and image MIME types only';
