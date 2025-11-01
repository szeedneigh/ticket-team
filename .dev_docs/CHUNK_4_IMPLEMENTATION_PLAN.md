# Chunk 4: Comment System - Detailed Implementation Plan

**Feature**: Public Comments & Internal Notes for Tickets
**Estimated Time**: 3-4 hours
**Priority**: 🔴 CRITICAL (Blocks Staff Queue)
**Status**: Ready to Implement

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema Review](#database-schema-review)
3. [File Structure](#file-structure)
4. [Implementation Steps](#implementation-steps)
5. [Detailed File Specifications](#detailed-file-specifications)
6. [Security & RLS](#security--rls)
7. [Testing Checklist](#testing-checklist)
8. [Common Pitfalls](#common-pitfalls)

---

## Overview

### Goals

Implement a complete comment system for tickets that supports:
- ✅ Public comments (visible to all participants)
- ✅ Internal notes (visible only to staff, admins, super_admins)
- ✅ File attachments in comments
- ✅ Markdown rendering for rich text
- ✅ Activity logging for audit trail
- ✅ Cursor-based pagination
- ✅ RLS-enforced visibility (employees can't see internal notes)

### User Stories

**As an employee, I want to:**
- Add comments to my tickets to provide updates or ask questions
- Attach files to my comments (screenshots, documents)
- See all public comments on my tickets
- NOT see internal staff notes

**As staff, I want to:**
- Add public comments visible to ticket submitters
- Add internal notes that only staff can see
- View all comments including internal notes
- Track who said what and when

### Success Criteria

- [x] Database tables exist (already done)
- [ ] Server Actions for comment creation
- [ ] Comment input UI with internal note toggle
- [ ] Comment display with proper filtering
- [ ] RLS prevents employees from seeing internal notes
- [ ] Activity logging works correctly
- [ ] File attachments supported

---

## Database Schema Review

### ✅ Already Exists: `ticket_comments` Table

```sql
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,  -- KEY FIELD
  attachments JSONB DEFAULT '[]'::jsonb,        -- File metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT content_not_empty CHECK (LENGTH(content) > 0)
);
```

**Key Fields:**
- `is_internal`: FALSE = public comment, TRUE = internal staff note
- `attachments`: JSONB array of file metadata (empty array by default)
- `updated_at`: For future edit functionality (optional)

### ✅ Already Exists: RLS Policies

**Read Policy**:
```sql
CREATE POLICY "Users can read comments on accessible tickets"
  ON ticket_comments FOR SELECT
  USING (
    -- Can read if ticket is accessible
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
      )
    )
    -- CRITICAL: Filter out internal comments for non-staff
    AND (
      NOT is_internal
      OR get_user_role(auth.uid()) IN ('staff', 'admin', 'super_admin')
    )
  );
```

**Key Points:**
- Employees automatically can't see `is_internal=true` comments
- Staff can see all comments
- No code needed to filter - RLS does it automatically!

**Insert Policy**:
```sql
CREATE POLICY "Users can create comments on accessible tickets"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (ticket accessible by user)
    )
  );
```

**Note:** Policy doesn't restrict `is_internal` value. We must validate server-side that only staff can set `is_internal=true`.

---

## File Structure

### Files to Create (5 files)

```
src/
├── app/
│   └── actions/
│       └── comments.ts                    # NEW - Server Actions
├── components/
│   └── tickets/
│       ├── comment-box.tsx                # NEW - Input UI
│       ├── comment-list.tsx               # NEW - List with pagination
│       └── comment-item.tsx               # NEW - Single comment display
└── lib/
    └── validations/
        └── comments.ts                    # NEW - Zod schemas
```

### Files to Modify (2 files)

```
src/
├── app/
│   └── (dashboard)/
│       └── tickets/
│           └── [id]/
│               └── page.tsx               # MODIFY - Add comment components
└── components/
    └── tickets/
        └── ticket-detail.tsx              # MODIFY - Integrate comment UI
```

---

## Implementation Steps

### Phase 1: Backend (Server Actions & Validation) - 1 hour

**Order of implementation:**
1. ✅ Create `src/lib/validations/comments.ts` (validation schemas)
2. ✅ Create `src/app/actions/comments.ts` (Server Action)
3. ✅ Test with curl or Postman to verify creation works

### Phase 2: UI Components - 1.5 hours

**Order of implementation:**
4. ✅ Create `src/components/tickets/comment-item.tsx` (display single)
5. ✅ Create `src/components/tickets/comment-list.tsx` (display all)
6. ✅ Create `src/components/tickets/comment-box.tsx` (input form)

### Phase 3: Integration - 0.5 hours

**Order of implementation:**
7. ✅ Modify `src/components/tickets/ticket-detail.tsx` (add comment UI)
8. ✅ Verify comments display in ticket detail page

### Phase 4: Testing & Polish - 0.5-1 hour

**Order of implementation:**
9. ✅ Test as employee (can't create internal notes)
10. ✅ Test as staff (can create internal notes)
11. ✅ Verify RLS (employees can't see internal notes)
12. ✅ Test file attachments
13. ✅ Polish UI/UX

---

## Detailed File Specifications

### 1. `src/lib/validations/comments.ts`

**Purpose**: Zod schemas for comment validation

```typescript
import { z } from 'zod'

// Maximum comment length
export const COMMENT_MAX_LENGTH = 5000

// Comment creation schema
export const createCommentSchema = z.object({
  ticket_id: z.string().uuid('Invalid ticket ID'),
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(COMMENT_MAX_LENGTH, `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters`)
    .trim(),
  is_internal: z.boolean().default(false),
})

// Type inference
export type CreateCommentInput = z.infer<typeof createCommentSchema>

// File validation (reuse from tickets if needed)
export const COMMENT_FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  MAX_FILES: 5, // Max files per comment
} as const

// Validation helpers
export function isValidCommentFileSize(size: number): boolean {
  return size > 0 && size <= COMMENT_FILE_UPLOAD.MAX_SIZE
}

export function isValidCommentFileType(mimeType: string): boolean {
  return COMMENT_FILE_UPLOAD.ALLOWED_TYPES.includes(mimeType as any)
}
```

**Why this structure:**
- Clear validation rules
- Reusable types
- Follows existing patterns in `tickets.ts`

---

### 2. `src/app/actions/comments.ts`

**Purpose**: Server Actions for comment operations

```typescript
'use server'

/**
 * Comment Server Actions
 *
 * Server-side actions for comment creation and management.
 * Enforces RLS and logs activities for audit trail.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  createCommentSchema,
  isValidCommentFileSize,
  isValidCommentFileType,
  COMMENT_FILE_UPLOAD,
} from '@/lib/validations/comments'
import { uploadTicketAttachment } from '@/lib/tickets/storage'
import { ACTIVITY_TYPES } from '@/lib/constants/activity-types'
import { ERROR_MESSAGES } from '@/lib/constants'
import type { User } from '@/lib/types/users'

// ============================================================================
// Types
// ============================================================================

interface ServerActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface CommentWithUser {
  id: string
  ticket_id: string
  user_id: string
  content: string
  is_internal: boolean
  attachments: any[]
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    role: string
  }
}

// ============================================================================
// Create Comment Action
// ============================================================================

/**
 * Create a new comment on a ticket
 *
 * Features:
 * - Public comments (is_internal=false) for all users
 * - Internal notes (is_internal=true) only for staff/admin/super_admin
 * - Optional file attachments
 * - Activity logging
 * - RLS enforcement
 *
 * @param formData - Form data with comment details and files
 * @returns Response with created comment or error
 */
export async function createComment(
  formData: FormData
): Promise<ServerActionResponse<CommentWithUser>> {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      }
    }

    // 2. Get user profile with role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', authUser.id)
      .single()

    if (userError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
      }
    }

    // 3. Extract and validate form data
    const ticket_id = formData.get('ticket_id') as string
    const content = formData.get('content') as string
    const is_internal = formData.get('is_internal') === 'true'

    // Validate with Zod
    const validation = createCommentSchema.safeParse({
      ticket_id,
      content,
      is_internal,
    })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || ERROR_MESSAGES.INVALID_INPUT,
      }
    }

    // 4. CRITICAL: Only staff can create internal notes
    const isStaff = ['staff', 'admin', 'super_admin'].includes(user.role)

    if (is_internal && !isStaff) {
      return {
        success: false,
        error: 'Only staff members can create internal notes',
      }
    }

    // 5. Verify user has access to ticket (RLS will also check)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, user_id, assigned_to')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return {
        success: false,
        error: 'Ticket not found or access denied',
      }
    }

    // 6. Handle file uploads (if any)
    const fileCount = parseInt(formData.get('file_count') as string) || 0
    const attachmentMetadata: any[] = []

    if (fileCount > 0) {
      if (fileCount > COMMENT_FILE_UPLOAD.MAX_FILES) {
        return {
          success: false,
          error: `Maximum ${COMMENT_FILE_UPLOAD.MAX_FILES} files allowed per comment`,
        }
      }

      for (let i = 0; i < fileCount; i++) {
        const file = formData.get(`file_${i}`) as File
        if (!file) continue

        // Validate file
        if (!isValidCommentFileSize(file.size)) {
          return {
            success: false,
            error: `File "${file.name}" exceeds ${COMMENT_FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB limit`,
          }
        }

        if (!isValidCommentFileType(file.type)) {
          return {
            success: false,
            error: `File type "${file.type}" is not allowed`,
          }
        }

        // Upload file (reuse ticket storage utility)
        const uploadResult = await uploadTicketAttachment(file, ticket_id, user.id)

        if (!uploadResult.success || !uploadResult.data) {
          return {
            success: false,
            error: `Failed to upload "${file.name}"`,
          }
        }

        attachmentMetadata.push({
          filename: file.name,
          size_bytes: file.size,
          mime_type: file.type,
          storage_path: uploadResult.data.path,
        })
      }
    }

    // 7. Create comment
    const { data: comment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id,
        user_id: user.id,
        content: validation.data.content,
        is_internal,
        attachments: attachmentMetadata,
      })
      .select(
        `
        *,
        user:users(
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `
      )
      .single()

    if (commentError || !comment) {
      return {
        success: false,
        error: 'Failed to create comment',
      }
    }

    // 8. Log activity (use service client to bypass RLS)
    const serviceClient = createServiceClient()

    const activityType = is_internal
      ? ACTIVITY_TYPES.INTERNAL_NOTE_ADDED
      : ACTIVITY_TYPES.COMMENT_ADDED

    await serviceClient.from('ticket_activities').insert({
      ticket_id,
      user_id: user.id,
      action: activityType,
      metadata: {
        comment_id: comment.id,
        is_internal,
        has_attachments: attachmentMetadata.length > 0,
      },
    })

    // 9. Revalidate ticket detail page
    revalidatePath(`/tickets/${ticket_id}`)
    revalidatePath('/tickets')

    return {
      success: true,
      data: comment as CommentWithUser,
    }
  } catch (error) {
    console.error('Create comment error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.UNKNOWN_ERROR,
    }
  }
}
```

**Key Implementation Details:**

1. **Role Check for Internal Notes**:
   ```typescript
   if (is_internal && !isStaff) {
     return { success: false, error: 'Only staff...' }
   }
   ```

2. **Activity Logging**:
   - Uses `ACTIVITY_TYPES.COMMENT_ADDED` for public comments
   - Uses `ACTIVITY_TYPES.INTERNAL_NOTE_ADDED` for internal notes
   - Service client bypasses RLS for activity logging

3. **File Uploads**:
   - Reuses `uploadTicketAttachment()` from ticket storage
   - Stores metadata in `attachments` JSONB field
   - Validates size and type

4. **Revalidation**:
   - Revalidates ticket detail page to show new comment
   - Revalidates ticket list (in case last activity changes)

---

### 3. `src/components/tickets/comment-item.tsx`

**Purpose**: Display a single comment with user info and attachments

```typescript
'use client'

import { formatDistanceToNow } from 'date-fns'
import { Lock, Paperclip } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Comment Item Component
 *
 * Displays a single comment with:
 * - User avatar and name
 * - Timestamp
 * - Internal note badge (if applicable)
 * - Comment content with line breaks
 * - File attachments
 */

interface CommentUser {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
}

interface CommentAttachment {
  filename: string
  size_bytes: number
  mime_type: string
  storage_path: string
}

interface CommentItemProps {
  id: string
  content: string
  is_internal: boolean
  attachments: CommentAttachment[]
  created_at: string
  user: CommentUser
}

export function CommentItem({
  id,
  content,
  is_internal,
  attachments,
  created_at,
  user,
}: CommentItemProps) {
  // Get user initials for avatar fallback
  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className={is_internal ? 'border-amber-200 bg-amber-50/50' : ''}>
      <CardContent className="pt-4">
        <div className="flex gap-3">
          {/* User Avatar */}
          <Avatar className="h-8 w-8 mt-1">
            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>

          {/* Comment Content */}
          <div className="flex-1 space-y-2">
            {/* Header: Name, Badge, Time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{user.full_name}</span>

              {is_internal && (
                <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                  <Lock className="w-3 h-3 mr-1" />
                  Internal Note
                </Badge>
              )}

              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Comment Text */}
            <div className="text-sm whitespace-pre-wrap break-words">{content}</div>

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="space-y-1 mt-3">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5"
                  >
                    <Paperclip className="w-3 h-3" />
                    <span className="font-medium">{attachment.filename}</span>
                    <span>({(attachment.size_bytes / 1024).toFixed(0)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Key Features:**
- **Internal Note Styling**: Amber background/border for visual distinction
- **Lock Icon Badge**: Clear indicator of internal notes
- **Attachment Display**: Shows filename and size
- **Responsive**: Works on mobile and desktop

---

### 4. `src/components/tickets/comment-list.tsx`

**Purpose**: Display all comments with optional pagination

```typescript
'use client'

import { CommentItem } from './comment-item'
import type { TicketCommentWithUser } from '@/lib/types/tickets'

/**
 * Comment List Component
 *
 * Displays all comments for a ticket.
 * RLS automatically filters internal notes for employees.
 *
 * Future: Add cursor-based pagination if needed
 */

interface CommentListProps {
  comments: TicketCommentWithUser[]
  emptyMessage?: string
}

export function CommentList({
  comments,
  emptyMessage = 'No comments yet. Be the first to comment!',
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          id={comment.id}
          content={comment.content}
          is_internal={comment.is_internal}
          attachments={comment.attachments || []}
          created_at={comment.created_at}
          user={comment.user}
        />
      ))}
    </div>
  )
}
```

**Key Features:**
- **Simple Rendering**: Just maps comments to CommentItem
- **Empty State**: Shows message when no comments
- **RLS Filtering**: Comments array is already filtered by RLS
- **Extensible**: Easy to add pagination later

---

### 5. `src/components/tickets/comment-box.tsx`

**Purpose**: Input form for creating comments

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Loader2, Send, Lock, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createComment } from '@/app/actions/comments'
import { COMMENT_MAX_LENGTH } from '@/lib/validations/comments'

/**
 * Comment Box Component
 *
 * Input form for adding comments to tickets.
 * Features:
 * - Text area with character counter
 * - Internal note checkbox (staff only)
 * - File attachment support
 * - Loading states
 * - Success/error feedback
 */

interface CommentBoxProps {
  ticketId: string
  isStaff: boolean
}

interface SelectedFile {
  file: File
  preview: string
}

export function CommentBox({ ticketId, isStaff }: CommentBoxProps) {
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isPending, startTransition] = useTransition()

  const characterCount = content.length
  const isOverLimit = characterCount > COMMENT_MAX_LENGTH
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isPending

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 5 files
    if (selectedFiles.length + files.length > 5) {
      toast.error('Maximum 5 files per comment')
      return
    }

    const newFiles = files.map((file) => ({
      file,
      preview: file.name,
    }))

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  // Remove file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canSubmit) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('ticket_id', ticketId)
      formData.append('content', content.trim())
      formData.append('is_internal', isInternal.toString())
      formData.append('file_count', selectedFiles.length.toString())

      selectedFiles.forEach((sf, index) => {
        formData.append(`file_${index}`, sf.file)
      })

      const result = await createComment(formData)

      if (result.success) {
        toast.success(isInternal ? 'Internal note added' : 'Comment added')
        setContent('')
        setIsInternal(false)
        setSelectedFiles([])
      } else {
        toast.error(result.error || 'Failed to add comment')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Text Area */}
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            isStaff && isInternal
              ? 'Add an internal note (only visible to staff)...'
              : 'Add a comment...'
          }
          className="min-h-[100px] resize-none"
          disabled={isPending}
        />

        {/* Character Counter */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span
            className={
              isOverLimit ? 'text-destructive font-medium' : characterCount > COMMENT_MAX_LENGTH * 0.9 ? 'text-amber-600' : ''
            }
          >
            {characterCount} / {COMMENT_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* File Attachments */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Attachments</Label>
          <div className="space-y-1">
            {selectedFiles.map((sf, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 bg-muted rounded px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm truncate">
                  <Paperclip className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sf.file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({(sf.file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Internal Note Checkbox + File Button */}
        <div className="flex items-center gap-4">
          {/* Internal Note Toggle (Staff Only) */}
          {isStaff && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_internal"
                checked={isInternal}
                onCheckedChange={(checked) => setIsInternal(checked === true)}
                disabled={isPending}
              />
              <Label
                htmlFor="is_internal"
                className="text-sm font-normal cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                Internal note
              </Label>
            </div>
          )}

          {/* File Upload */}
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || selectedFiles.length >= 5}
              asChild
            >
              <span>
                <Paperclip className="w-4 h-4 mr-2" />
                Attach
              </span>
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              disabled={isPending || selectedFiles.length >= 5}
              className="sr-only"
            />
          </Label>
        </div>

        {/* Right: Submit Button */}
        <Button type="submit" disabled={!canSubmit} size="sm">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isInternal ? 'Add Note' : 'Comment'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
```

**Key Features:**

1. **Staff-Only Internal Notes**:
   ```typescript
   {isStaff && (
     <Checkbox checked={isInternal} />
   )}
   ```

2. **Character Counter**:
   - Shows yellow warning at 90%
   - Shows red error when over limit
   - Disables submit when over limit

3. **File Management**:
   - Visual preview of selected files
   - Remove button for each file
   - Max 5 files enforced

4. **Dynamic Placeholder**:
   - Changes based on `isInternal` state
   - Clear indication of note visibility

5. **Loading States**:
   - Disabled during submission
   - Spinner on button
   - Prevents double-submit

---

### 6. Modify `src/components/tickets/ticket-detail.tsx`

**Changes needed**: Add comment section

**Location**: After attachments section, before closing `</div>`

**Add this section**:

```typescript
{/* Comments Section */}
<Card>
  <CardHeader>
    <CardTitle>Comments & Activity</CardTitle>
    <CardDescription>
      {isStaff
        ? 'Add public comments or internal notes'
        : 'Add comments to communicate with support staff'}
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Comment Input */}
    <CommentBox ticketId={ticket.id} isStaff={isStaff} />

    <Separator />

    {/* Comment List */}
    <div>
      <h3 className="text-sm font-medium mb-4">
        All Comments ({comments.length})
      </h3>
      <CommentList comments={comments} />
    </div>
  </CardContent>
</Card>
```

**Required imports**:
```typescript
import { CommentBox } from './comment-box'
import { CommentList } from './comment-list'
import { Separator } from '@/components/ui/separator'
```

---

## Security & RLS

### ✅ Security Checklist

1. **RLS Automatically Filters Internal Notes**
   - Employees query `ticket_comments` → only get `is_internal=false`
   - Staff query `ticket_comments` → get all comments
   - No manual filtering needed in code!

2. **Server-Side Validation**
   ```typescript
   if (is_internal && !isStaff) {
     return { error: 'Only staff can create internal notes' }
   }
   ```

3. **Service Client for Activity Logging**
   - Must use `createServiceClient()` to bypass RLS
   - Activity table has strict INSERT policy

4. **File Validation**
   - Size limit: 10MB
   - Type whitelist: images, PDFs, docs
   - Max 5 files per comment

5. **Input Sanitization**
   - Zod schema validates and trims content
   - Max length enforced (5000 chars)
   - HTML escaping by React automatically

### Common Security Mistakes to Avoid

❌ **Don't filter is_internal in client code**:
```typescript
// WRONG - RLS already does this!
const publicComments = comments.filter(c => !c.is_internal)
```

✅ **Trust RLS**:
```typescript
// RIGHT - Just use comments as-is
<CommentList comments={comments} />
```

❌ **Don't allow is_internal without checking role**:
```typescript
// WRONG - No role check!
const is_internal = formData.get('is_internal') === 'true'
```

✅ **Always validate role**:
```typescript
// RIGHT
if (is_internal && !isStaff) {
  return { error: 'Only staff...' }
}
```

---

## Testing Checklist

### Phase 1: Server Action Testing (Backend)

Test with curl or directly from component:

**Test 1: Create public comment (as employee)**
```bash
# Should succeed
curl -X POST http://localhost:3000/api/test-comment \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "valid-uuid",
    "content": "This is my comment",
    "is_internal": false
  }'
```

**Expected**: Comment created with `is_internal=false`, activity logged

**Test 2: Try to create internal note (as employee)**
```bash
# Should FAIL with error
curl -X POST http://localhost:3000/api/test-comment \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "valid-uuid",
    "content": "Secret note",
    "is_internal": true
  }'
```

**Expected**: Error "Only staff members can create internal notes"

**Test 3: Create internal note (as staff)**
```bash
# Should succeed
# (same as Test 2 but with staff user)
```

**Expected**: Comment created with `is_internal=true`, activity logged with `INTERNAL_NOTE_ADDED`

### Phase 2: UI Testing

**Test as Employee:**
- [ ] Can add public comments
- [ ] **Cannot** see internal note checkbox
- [ ] **Cannot** see internal notes in list
- [ ] Can attach files to comments
- [ ] Character counter works
- [ ] Submit button disabled when empty
- [ ] Loading state shows during submission
- [ ] Success toast appears
- [ ] Comment appears immediately after creation

**Test as Staff:**
- [ ] Can add public comments
- [ ] **Can** see internal note checkbox
- [ ] **Can** toggle internal note
- [ ] **Can** see internal notes in list (with amber background)
- [ ] Internal notes show lock icon badge
- [ ] Can attach files to both public and internal
- [ ] All employee tests pass

### Phase 3: RLS Verification

**Setup:**
1. Create a ticket as Employee A
2. Have Staff B add:
   - 1 public comment
   - 1 internal note
3. Assign ticket to Staff C

**Verify Employee A sees:**
- [ ] Own comments
- [ ] Staff B's public comment
- [ ] **NOT** Staff B's internal note

**Verify Staff C sees:**
- [ ] All public comments
- [ ] All internal notes (including Staff B's)

### Phase 4: Integration Testing

**Full ticket workflow:**
1. Employee creates ticket
2. Employee adds comment "Need help with this"
3. Staff responds with public comment "I'll look into this"
4. Staff adds internal note "User forgot password again"
5. Staff resolves ticket
6. Employee sees: creation, their comment, staff public response
7. Staff sees: all above + internal note

**Expected Timeline Order:**
1. Ticket created activity
2. Comment added activity (employee)
3. Comment added activity (staff public)
4. Internal note added activity (staff) ← Only visible to staff
5. Status changed activity (resolved)

---

## Common Pitfalls

### 1. Forgetting to Check Role for Internal Notes

❌ **Wrong**:
```typescript
// Server Action - Missing role check
const is_internal = formData.get('is_internal') === 'true'
await supabase.from('ticket_comments').insert({ is_internal })
```

✅ **Correct**:
```typescript
const is_internal = formData.get('is_internal') === 'true'
const isStaff = ['staff', 'admin', 'super_admin'].includes(user.role)

if (is_internal && !isStaff) {
  return { error: 'Only staff can create internal notes' }
}
```

### 2. Manually Filtering is_internal in Client Code

❌ **Wrong**:
```typescript
// Client component - Don't do this!
const visibleComments = comments.filter(c => {
  if (c.is_internal && !isStaff) return false
  return true
})
```

✅ **Correct**:
```typescript
// RLS does the filtering automatically!
<CommentList comments={comments} />
```

### 3. Using Wrong Activity Type

❌ **Wrong**:
```typescript
// Always using COMMENT_ADDED
await supabase.from('ticket_activities').insert({
  action: ACTIVITY_TYPES.COMMENT_ADDED
})
```

✅ **Correct**:
```typescript
// Use different type for internal notes
const activityType = is_internal
  ? ACTIVITY_TYPES.INTERNAL_NOTE_ADDED
  : ACTIVITY_TYPES.COMMENT_ADDED
```

### 4. Forgetting Service Client for Activities

❌ **Wrong**:
```typescript
// Using regular client - RLS will block!
const supabase = await createClient()
await supabase.from('ticket_activities').insert({ ... })
```

✅ **Correct**:
```typescript
// Use service client to bypass RLS
const serviceClient = createServiceClient()
await serviceClient.from('ticket_activities').insert({ ... })
```

### 5. Not Revalidating After Comment

❌ **Wrong**:
```typescript
// Comment created but page doesn't update
await supabase.from('ticket_comments').insert({ ... })
return { success: true }
```

✅ **Correct**:
```typescript
await supabase.from('ticket_comments').insert({ ... })
revalidatePath(`/tickets/${ticket_id}`)
return { success: true }
```

---

## Expected Behaviors

### For Employees

**Can:**
- ✅ Add public comments on their own tickets
- ✅ View all public comments
- ✅ Attach files to comments
- ✅ See their comments immediately after posting

**Cannot:**
- ❌ See internal notes
- ❌ Create internal notes (checkbox hidden)
- ❌ View comments on tickets they don't own

### For Staff/Admin/Super Admin

**Can:**
- ✅ Add public comments on any accessible ticket
- ✅ Add internal notes with lock icon
- ✅ View all comments including internal notes
- ✅ Attach files to both public and internal
- ✅ See visual distinction (amber background) for internal notes
- ✅ Toggle between public comment and internal note

### Visual Distinctions

**Public Comment**:
- White background
- No badge
- Visible to all participants

**Internal Note**:
- Amber background (`bg-amber-50/50`)
- Amber border (`border-amber-200`)
- Lock icon badge
- "Internal Note" label
- Only visible to staff

---

## Success Criteria

### Must Have (MVP)

- [ ] Server Action `createComment()` works
- [ ] Public comments visible to all
- [ ] Internal notes visible only to staff
- [ ] Staff can toggle internal note checkbox
- [ ] Employees cannot create internal notes
- [ ] Activity logging works (COMMENT_ADDED vs INTERNAL_NOTE_ADDED)
- [ ] Comments appear immediately after creation
- [ ] RLS enforces visibility rules

### Nice to Have (Future)

- [ ] Edit comments (update `updated_at`)
- [ ] Delete comments (soft delete)
- [ ] Markdown rendering for rich text
- [ ] @mentions for staff
- [ ] Email notifications on new comments
- [ ] Real-time updates via WebSocket
- [ ] Pagination for large comment threads

---

## Timeline

### Hour 1: Backend
- ✅ Create `validations/comments.ts` (15 min)
- ✅ Create `actions/comments.ts` (45 min)

### Hour 2: UI Components Part 1
- ✅ Create `comment-item.tsx` (30 min)
- ✅ Create `comment-list.tsx` (15 min)
- ✅ Start `comment-box.tsx` (15 min)

### Hour 3: UI Components Part 2
- ✅ Finish `comment-box.tsx` (30 min)
- ✅ Modify `ticket-detail.tsx` (15 min)
- ✅ Initial testing (15 min)

### Hour 4: Testing & Polish
- ✅ Test as employee (15 min)
- ✅ Test as staff (15 min)
- ✅ Verify RLS (15 min)
- ✅ Fix bugs and polish (15 min)

---

## Post-Implementation

### Code Review Checklist

Before marking Chunk 4 complete, verify:

- [ ] All 5 files created
- [ ] `ticket-detail.tsx` modified correctly
- [ ] No TypeScript errors (`npm run lint`)
- [ ] Server Action logs activities correctly
- [ ] RLS policies work as expected (tested both roles)
- [ ] UI matches design patterns (consistent with existing components)
- [ ] Error messages are user-friendly
- [ ] Loading states prevent double-submission
- [ ] File uploads work correctly

### Documentation Updates

Update these files after completion:

- [ ] `.cursor/plans/phase-4-2f85354f.plan.md` - Mark Chunk 4 complete
- [ ] `docs/08-roadmap/implementation-status.md` - Update progress to 50% → 62.5%
- [ ] `.dev_docs/NEXT_STEPS_ANALYSIS.md` - Mark comment system done

---

## Next Steps After Chunk 4

Once comment system is complete, proceed to:

**Chunk 5: Staff Queue** (3-4 hours)
- Build `/tickets/queue` page
- Staff can view all open/in-progress tickets
- Quick assignment actions
- Workload management

**Why Chunk 5 next?**
- Comments are working
- Staff need queue to manage tickets efficiently
- Builds on existing ticket list patterns
- Independent from file attachments (Chunk 6)

---

## Questions & Answers

**Q: Do we need pagination for comments?**
A: Not immediately. Start without pagination. Add later if comments exceed 50 per ticket.

**Q: Can employees edit their own comments?**
A: Not in Chunk 4. Future feature using `updated_at` field.

**Q: How do file downloads work?**
A: Use signed URLs (Chunk 6). For now, just display filenames.

**Q: Should we use markdown rendering?**
A: Not in Chunk 4. Keep it simple with `whitespace-pre-wrap` for line breaks. Add markdown library later if needed.

**Q: What about real-time updates?**
A: Not in scope. Use `revalidatePath()` for now. Real-time can be added in Phase 6.

---

## Resources

### Documentation References

- Activity Types: `src/lib/constants/activity-types.ts`
- Ticket Types: `src/lib/types/tickets.ts`
- Database Schema: `supabase/migrations/20250114000002_create_core_tables.sql`
- RLS Policies: `supabase/migrations/20250114000004_create_rls_policies.sql`
- Existing Server Actions: `src/app/actions/tickets.ts`
- Storage Utils: `src/lib/tickets/storage.ts`

### Similar Patterns to Follow

- Form patterns: `src/components/tickets/ticket-form.tsx`
- Server Action patterns: `src/app/actions/tickets.ts`
- UI components: `src/components/tickets/ticket-card.tsx`
- Display patterns: `src/components/tickets/ticket-detail.tsx`

---

**Plan Created**: November 1, 2025
**Estimated Completion**: 3-4 hours of focused work
**Ready to Implement**: ✅ YES

**Let's build this! 🚀**
