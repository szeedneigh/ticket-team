/**
 * KB Article Editor Form Component
 *
 * Comprehensive form for creating and editing KB articles.
 * Features:
 * - React Hook Form + Zod validation
 * - Auto-save to localStorage
 * - Draft recovery
 * - Rich text editor (Tiptap)
 * - Tag input with autocomplete
 * - Category/Subcategory selection
 * - Status management (draft/published)
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Send, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { kbArticleSchema, type KBArticleInput } from '@/lib/validations/kb-articles'
import type { KnowledgeArticleWithAuthor } from '@/lib/types/knowledge-base'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { TagInput } from './tag-input'
import { AutoSaveIndicator } from './auto-save-indicator'
import { DraftRecoveryDialog } from './draft-recovery-dialog'
import { DeleteArticleDialog } from './delete-article-dialog'
import { UnsavedChangesDialog } from '@/components/shared/unsaved-changes-dialog'
import type { DraftData } from './draft-recovery-dialog'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import { cn } from '@/lib/utils'
import * as Sentry from '@sentry/nextjs'

// Dynamic import for TiptapEditor to reduce initial bundle size
const TiptapEditor = dynamic(() => import('./tiptap-editor').then(mod => ({ default: mod.TiptapEditor })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
})

// Article categories with subcategories
const CATEGORIES = [
  {
    name: 'Technical',
    subcategories: ['Hardware', 'Software', 'Network', 'Email', 'Portal']
  },
  {
    name: 'Account',
    subcategories: ['Login Issues', 'Password Reset', 'Registration', 'Profile']
  },
  {
    name: 'Enrollment',
    subcategories: ['Course Registration', 'Schedule', 'Requirements', 'Clearance']
  },
  {
    name: 'General',
    subcategories: ['How-To Guides', 'Policies', 'FAQs', 'Announcements']
  },
  {
    name: 'Financial',
    subcategories: ['Tuition', 'Payment', 'Scholarships', 'Refunds']
  },
  {
    name: 'Academic',
    subcategories: ['Grades', 'Curriculum', 'Graduation', 'Transcripts']
  }
]

type CreateArticleAction = (data: KBArticleInput) => Promise<{ error?: string; success?: boolean; data?: { id: string } }>
type UpdateArticleAction = (id: string, data: Partial<KBArticleInput>) => Promise<{ error?: string; success?: boolean }>
type DeleteArticleAction = (id: string) => Promise<{ error?: string; success?: boolean }>

interface KBEditorFormProps {
  article?: KnowledgeArticleWithAuthor
  existingTags?: string[]
  mode: 'create' | 'edit'
  /** Pre-populated draft when creating from a resolved ticket */
  initialDraft?: Partial<KBArticleInput> & { source_ticket_id?: string | null }
  /** Passed from Server Component to avoid Client import - fixes production Server Action resolution */
  createArticleAction: CreateArticleAction
  /** Passed from Server Component to avoid Client import - fixes production Server Action resolution */
  updateArticleAction: UpdateArticleAction
  /** Optional - only for edit mode. Passed from Server Component. */
  deleteArticleAction?: DeleteArticleAction
}

export function KBEditorForm({ article, existingTags = [], mode, initialDraft, createArticleAction, updateArticleAction, deleteArticleAction }: KBEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const baseCategory = article?.category ?? initialDraft?.category ?? ''
  const [selectedCategory, setSelectedCategory] = useState<string>(baseCategory)

  // Storage key for auto-save
  const storageKey = `kb-draft-${article?.id || 'new'}`

  // Default values: article (edit) > initialDraft (create from ticket) > empty
  const defaultValues: KBArticleInput = {
    title: article?.title ?? initialDraft?.title ?? '',
    content: article?.content ?? initialDraft?.content ?? '',
    summary: article?.summary ?? initialDraft?.summary ?? '',
    category: article?.category ?? initialDraft?.category ?? '',
    subcategory: article?.subcategory ?? initialDraft?.subcategory ?? '',
    tags: article?.tags ?? initialDraft?.tags ?? [],
    status: article?.status ?? initialDraft?.status ?? 'draft',
    source_ticket_id: article?.source_ticket_id ?? initialDraft?.source_ticket_id ?? null
  }

  // Form setup
  const form = useForm<KBArticleInput>({
    resolver: zodResolver(kbArticleSchema),
    defaultValues,
    mode: 'onChange'
  })

  const { watch, setValue, formState: { errors } } = form

  // Watch all form fields for auto-save
  const formData = watch()

  // Auto-save hook
  const { saveStatus, lastSaved, clearSaved } = useAutoSave(
    storageKey,
    formData,
    2000,
    {
      enabled: true
    }
  )

  // Get subcategories for selected category
  const subcategories =
    CATEGORIES.find((cat) => cat.name === selectedCategory)?.subcategories || []

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setValue('category', value)
    // Reset subcategory when category changes
    setValue('subcategory', '')
  }

  // Handle draft recovery
  const handleRecoverDraft = (draftData: DraftData) => {
    if (draftData.title) setValue('title', draftData.title)
    if (draftData.content) setValue('content', draftData.content)
    if (draftData.summary) setValue('summary', draftData.summary)
    if (draftData.category) {
      setValue('category', draftData.category)
      setSelectedCategory(draftData.category)
    }
    if (draftData.subcategory) setValue('subcategory', draftData.subcategory)
    if (draftData.tags) setValue('tags', draftData.tags)
    if (draftData.status) setValue('status', draftData.status)

    toast.success('Draft recovered successfully')
  }

  // Handle form submission
  const onSubmit = async (data: KBArticleInput) => {
    startTransition(async () => {
      try {
        // Clear auto-saved draft BEFORE submission to prevent recovery dialog
        clearSaved()

        let result

        if (mode === 'edit' && article) {
          result = await updateArticleAction(article.id, data)
        } else {
          result = await createArticleAction(data)
        }

        // If there's an error, show it
        if (result?.error) {
          toast.error(result.error)
          return
        }

        // Show success message
        toast.success(
          data.status === 'published'
            ? mode === 'edit'
              ? 'Article updated and published!'
              : 'Article created and published!'
            : mode === 'edit'
            ? 'Article updated as draft'
            : 'Article saved as draft'
        )

        // Redirect after successful submission
        if (mode === 'create' && result && 'data' in result) {
          const createResult = result as { data: { id: string } }
          if (createResult.data?.id) {
            router.push(`/kb/${createResult.data.id}`)
          } else {
            router.push('/kb')
          }
        } else if (mode === 'edit' && article) {
          router.push(`/kb/${article.id}`)
        } else {
          router.push('/kb')
        }
      } catch (error) {
        console.error('Form submission error:', error)
        Sentry.captureException(error, {
          tags: { component: 'KBEditorForm', action: mode === 'edit' ? 'updateArticle' : 'createArticle' },
          extra: {
            digest: (error as Error & { digest?: string })?.digest,
            mode
          }
        })
        toast.error('Failed to save article. Please try again.')
      }
    })
  }

  // Save as draft
  const saveDraft = () => {
    setValue('status', 'draft')
    form.handleSubmit(onSubmit)()
  }

  // Publish article
  const publishArticle = () => {
    setValue('status', 'published')
    form.handleSubmit(onSubmit)()
  }

  // Handle cancel with confirmation
  const handleCancel = () => {
    const hasUnsavedChanges =
      formData.title ||
      formData.content ||
      formData.tags.length > 0

    if (hasUnsavedChanges) {
      setCancelDialogOpen(true)
    } else {
      router.back()
    }
  }

  const handleConfirmLeave = () => {
    clearSaved()
    router.back()
  }

  return (
    <>
      {/* Cancel / Leave Confirmation Dialog */}
      <UnsavedChangesDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Unsaved changes"
        description="You have unsaved changes. Are you sure you want to leave? Your draft will be discarded."
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={handleConfirmLeave}
      />

      {/* Draft Recovery Dialog */}
      {mode === 'create' && (
        <DraftRecoveryDialog
          storageKey={storageKey}
          onRecover={handleRecoverDraft}
          onDiscard={clearSaved}
        />
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" suppressHydrationWarning>
        {/* Header with Auto-Save Indicator */}
        <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md shadow-xl shadow-[#1f3463]/5 p-6 transition-all duration-200 hover:shadow-[#2cafdd]/5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {mode === 'edit' ? 'Edit Article' : 'Create New Article'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'edit'
                  ? 'Update your knowledge base article'
                  : 'Share your knowledge with the community'}
              </p>
            </div>
            <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md shadow-xl shadow-[#1f3463]/5 overflow-hidden transition-all duration-200 hover:border-[#2cafdd]/20 hover:shadow-[#2cafdd]/5">
          <div className="p-6 border-b border-white/10 bg-background/30">
            <h2 className="text-lg font-semibold text-foreground">Article Content</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Write clear, helpful content that will assist others
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Enter a descriptive title..."
                className={cn(
                  'h-11 rounded-xl border-white/10 bg-background/50 focus-visible:border-[#2cafdd]/50 focus-visible:ring-[#2cafdd]/20 transition-colors',
                  errors.title && 'border-destructive focus-visible:border-destructive'
                )}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary" className="text-sm font-medium text-foreground">
                Summary
                <span className="text-xs text-muted-foreground ml-2 font-normal">
                  (Recommended)
                </span>
              </Label>
              <Textarea
                id="summary"
                {...form.register('summary')}
                placeholder="Brief summary of the article (shown in article cards)..."
                rows={3}
                className={cn(
                  'rounded-xl border-white/10 bg-background/50 focus-visible:border-[#2cafdd]/50 focus-visible:ring-[#2cafdd]/20 transition-colors resize-none',
                  errors.summary && 'border-destructive focus-visible:border-destructive'
                )}
              />
              {errors.summary && (
                <p className="text-sm text-destructive">{errors.summary.message}</p>
              )}
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Content <span className="text-destructive">*</span>
              </Label>
              <TiptapEditor
                content={formData.content}
                onChange={(content) => setValue('content', content)}
                placeholder="Write your article content here..."
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md shadow-xl shadow-[#1f3463]/5 overflow-hidden transition-all duration-200 hover:border-[#2cafdd]/20 hover:shadow-[#2cafdd]/5">
          <div className="p-6 border-b border-white/10 bg-background/30">
            <h2 className="text-lg font-semibold text-foreground">Article Metadata</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Categorize your article to make it easier to find
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger
                    id="category"
                    className={cn(
                      'h-11 rounded-xl border-white/10 bg-background/50 focus:border-[#2cafdd]/50 focus:ring-[#2cafdd]/20',
                      errors.category && 'border-destructive'
                    )}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Subcategory Selection */}
              <div className="space-y-2">
                <Label htmlFor="subcategory">
                  Subcategory
                  <span className="text-xs text-muted-foreground ml-2">
                    (Optional)
                  </span>
                </Label>
                <Select
                  value={formData.subcategory || ''}
                  onValueChange={(value) => setValue('subcategory', value)}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger id="subcategory" className="h-11 rounded-xl border-white/10 bg-background/50 focus:border-[#2cafdd]/50 focus:ring-[#2cafdd]/20">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {subcat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <TagInput
              value={formData.tags}
              onChange={(tags) => setValue('tags', tags)}
              suggestions={existingTags}
              placeholder="Add tags to improve discoverability..."
              maxTags={10}
              inputClassName="h-11 rounded-xl border-white/10 bg-background/50 focus-visible:border-[#2cafdd]/50 focus-visible:ring-[#2cafdd]/20"
            />
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md shadow-xl shadow-[#1f3463]/5 p-6 transition-all duration-200">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="border-white/10 hover:bg-[#2cafdd]/5 hover:border-[#2cafdd]/30"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={saveDraft}
              disabled={isPending}
              className="bg-[#1f3463]/10 hover:bg-[#1f3463]/20 text-foreground border border-white/10"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="gradient"
              onClick={publishArticle}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {mode === 'edit' ? 'Update & Publish' : 'Publish Article'}
            </Button>
          </div>
        </div>

        {/* Delete Article (edit mode only) */}
        {mode === 'edit' && article && deleteArticleAction && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this article. This action cannot be undone.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Article
            </Button>
          </div>
        )}

        {mode === 'edit' && article && deleteArticleAction && (
          <DeleteArticleDialog
            articleId={article.id}
            articleTitle={article.title}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            deleteArticleAction={deleteArticleAction}
          />
        )}
      </form>
    </>
  )
}
