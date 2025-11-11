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
import { Save, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { kbArticleSchema, type KBArticleInput } from '@/lib/validations/kb-articles'
import type { KnowledgeArticleWithAuthor } from '@/lib/types/knowledge-base'
import { createArticle, updateArticle } from '@/lib/kb/actions'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { TagInput } from './tag-input'
import { AutoSaveIndicator } from './auto-save-indicator'
import { DraftRecoveryDialog } from './draft-recovery-dialog'
import type { DraftData } from './draft-recovery-dialog'
import { useAutoSave } from '@/lib/hooks/use-auto-save'

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

interface KBEditorFormProps {
  article?: KnowledgeArticleWithAuthor
  existingTags?: string[]
  mode: 'create' | 'edit'
}

export function KBEditorForm({ article, existingTags = [], mode }: KBEditorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedCategory, setSelectedCategory] = useState<string>(
    article?.category || ''
  )

  // Storage key for auto-save
  const storageKey = `kb-draft-${article?.id || 'new'}`

  // Form setup
  const form = useForm<KBArticleInput>({
    resolver: zodResolver(kbArticleSchema),
    defaultValues: {
      title: article?.title ?? '',
      content: article?.content ?? '',
      summary: article?.summary ?? '',
      category: article?.category ?? '',
      subcategory: article?.subcategory ?? '',
      tags: article?.tags ?? [],
      status: article?.status ?? 'draft',
      source_ticket_id: article?.source_ticket_id ?? null
    },
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
          result = await updateArticle(article.id, data)
        } else {
          result = await createArticle(data)
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
        if (result?.data?.id) {
          router.push(`/kb/${result.data.id}`)
        } else if (mode === 'edit' && article) {
          router.push(`/kb/${article.id}`)
        } else {
          router.push('/kb')
        }
      } catch (error) {
        console.error('Form submission error:', error)
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
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your draft will be discarded.'
      )
      if (confirmLeave) {
        clearSaved()
        router.back()
      }
    } else {
      router.back()
    }
  }

  return (
    <>
      {/* Draft Recovery Dialog */}
      {mode === 'create' && (
        <DraftRecoveryDialog
          storageKey={storageKey}
          onRecover={handleRecoverDraft}
          onDiscard={clearSaved}
          currentData={formData}
        />
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" suppressHydrationWarning>
        {/* Header with Auto-Save Indicator */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle>
                  {mode === 'edit' ? 'Edit Article' : 'Create New Article'}
                </CardTitle>
                <CardDescription>
                  {mode === 'edit'
                    ? 'Update your knowledge base article'
                    : 'Share your knowledge with the community'}
                </CardDescription>
              </div>
              <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Article Content</CardTitle>
            <CardDescription>
              Write clear, helpful content that will assist others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Enter a descriptive title..."
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">
                Summary
                <span className="text-xs text-muted-foreground ml-2">
                  (Recommended)
                </span>
              </Label>
              <Textarea
                id="summary"
                {...form.register('summary')}
                placeholder="Brief summary of the article (shown in article cards)..."
                rows={3}
                className={errors.summary ? 'border-destructive' : ''}
              />
              {errors.summary && (
                <p className="text-sm text-destructive">{errors.summary.message}</p>
              )}
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>
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
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Article Metadata</CardTitle>
            <CardDescription>
              Categorize your article to make it easier to find
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger
                    id="category"
                    className={errors.category ? 'border-destructive' : ''}
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
                  <SelectTrigger id="subcategory">
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
            />
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={saveDraft}
                disabled={isPending}
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
          </CardContent>
        </Card>
      </form>
    </>
  )
}
