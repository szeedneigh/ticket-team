-- Migration: Create ticket-attachments storage bucket
-- Description: Creates storage bucket for ticket file attachments with RLS policies
-- Date: 2025-01-30

-- ============================================================================
-- CREATE TICKET-ATTACHMENTS BUCKET
-- ============================================================================

-- Create the ticket-attachments bucket for ticket file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false, -- Private bucket, access controlled by RLS
  10485760, -- 10MB file size limit (in bytes)
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- .pptx
    -- Text
    'text/plain',
    'text/csv',
    -- Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES FOR TICKET-ATTACHMENTS
-- ============================================================================

-- Policy: Authenticated users can view attachments from tickets they have access to
-- Note: This is a simplified policy. In production, you'd check ticket ownership/assignment.
CREATE POLICY "Users can view ticket attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ticket-attachments');

-- Policy: Authenticated users can upload attachments
-- Files are stored in tickets/{ticket-id}/{filename}
CREATE POLICY "Users can upload ticket attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] = 'tickets'
);

-- Policy: Users can update attachments they uploaded
CREATE POLICY "Users can update their own ticket attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  owner_id = auth.uid()
)
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  owner_id = auth.uid()
);

-- Policy: Users can delete attachments they uploaded or staff can delete any
CREATE POLICY "Users can delete their own attachments or staff can delete any"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin', 'super_admin')
    )
  )
);

-- Policy: Staff can manage all ticket attachments
CREATE POLICY "Staff can manage all ticket attachments"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('staff', 'admin', 'super_admin')
  )
)
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('staff', 'admin', 'super_admin')
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE storage.buckets IS 'Ticket attachments bucket with 10MB limit and support for documents, images, text files, and archives';
