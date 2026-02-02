/**
 * Delete Article Dialog
 *
 * Confirmation modal for permanently deleting a KB article.
 * Access: Staff (own articles) | Admin+ (all articles)
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface DeleteArticleDialogProps {
  articleId: string
  articleTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  deleteArticleAction: (id: string) => Promise<{ error?: string; success?: boolean }>
}

export function DeleteArticleDialog({
  articleId,
  articleTitle,
  open,
  onOpenChange,
  deleteArticleAction
}: DeleteArticleDialogProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteArticleAction(articleId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Article deleted successfully')
      onOpenChange(false)
      router.push('/kb')
    } catch (error) {
      console.error('Delete article error:', error)
      toast.error('Failed to delete article. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete Article</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The article will be permanently removed from the knowledge base.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-medium text-foreground">&quot;{articleTitle}&quot;</span>?
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Article'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
