/**
 * Canned Responses Page
 *
 * Manage quick reply templates for ticket comments
 * Accessible only to staff, admin and super_admin roles
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, Search, Edit2, Trash2, Copy, MessageSquare, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/lib/hooks/use-user'
import { isStaffOrAbove } from '@/lib/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { CannedResponse, CannedResponseInput } from '@/lib/types/templates'

export default function CannedResponsesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: userLoading } = useUser()

  const [responses, setResponses] = useState<CannedResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Role-based access control: Only staff and above can access this page
  useEffect(() => {
    if (!userLoading && user && !isStaffOrAbove(user.role)) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access canned responses',
        variant: 'destructive',
      })
      router.push('/dashboard?error=insufficient_permissions')
    }
  }, [user, userLoading, router, toast])

  // Get unique categories from responses
  const categories = [...new Set(responses.map(r => r.category).filter(Boolean))] as string[]

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CannedResponseInput>({
    title: '',
    content: '',
    category: '',
    shortcut: '',
  })

  // Fetch responses
  const fetchResponses = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from('canned_responses')
        .select(`
          *,
          creator:users!canned_responses_created_by_fkey(id, full_name, email)
        `)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setResponses(data || [])
    } catch (error) {
      console.error('Error fetching canned responses:', error)
      toast({
        title: 'Error',
        description: 'Failed to load canned responses',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, toast])

  useEffect(() => {
    fetchResponses()
  }, [fetchResponses])

  // Filter responses by search
  const filteredResponses = responses.filter(response =>
    response.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (response.shortcut && response.shortcut.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Handle create/edit
  const handleOpenDialog = (response?: CannedResponse) => {
    if (response) {
      setEditingResponse(response)
      setFormData({
        title: response.title,
        content: response.content,
        category: response.category || '',
        shortcut: response.shortcut || '',
      })
    } else {
      setEditingResponse(null)
      setFormData({
        title: '',
        content: '',
        category: '',
        shortcut: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in title and content',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in',
          variant: 'destructive',
        })
        return
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category || null,
        shortcut: formData.shortcut || null,
      }

      if (editingResponse) {
        // Update
        const { error } = await supabase
          .from('canned_responses')
          .update({
            ...payload,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingResponse.id)

        if (error) throw error
        toast({ title: 'Success', description: 'Canned response updated successfully' })
      } else {
        // Create
        const { error } = await supabase
          .from('canned_responses')
          .insert({
            ...payload,
            created_by: user.id,
          })

        if (error) throw error
        toast({ title: 'Success', description: 'Canned response created successfully' })
      }

      setDialogOpen(false)
      fetchResponses()
    } catch (error: unknown) {
      console.error('Error saving canned response:', error)
      const errorMessage = error instanceof Error && error.message.includes('duplicate')
        ? 'This shortcut is already in use'
        : 'Failed to save canned response'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (response: CannedResponse) => {
    if (!confirm(`Are you sure you want to delete "${response.title}"?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('canned_responses')
        .update({ is_active: false })
        .eq('id', response.id)

      if (error) throw error
      toast({ title: 'Success', description: 'Canned response deleted successfully' })
      fetchResponses()
    } catch (error) {
      console.error('Error deleting canned response:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete canned response',
        variant: 'destructive',
      })
    }
  }

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({ title: 'Copied', description: 'Content copied to clipboard' })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  // Show loading state while checking authentication and role
  if (userLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Block access if user is not staff or above
  if (!user || !isStaffOrAbove(user.role)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <div className="text-center">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have permission to access canned responses
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Canned Responses</h2>
          <p className="text-muted-foreground">
            Quick reply templates for ticket comments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchResponses} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            New Response
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Responses Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredResponses.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p>No canned responses found</p>
              <Button variant="link" onClick={() => handleOpenDialog()}>
                Create your first canned response
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredResponses.map((response) => (
            <Card key={response.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{response.title}</CardTitle>
                    {response.shortcut && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        /{response.shortcut}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {response.usage_count} uses
                  </Badge>
                </div>
                {response.category && (
                  <CardDescription>{response.category}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {response.content}
                </p>
              </CardContent>
              <div className="border-t p-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    by {response.creator?.full_name || 'Unknown'}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopyContent(response.content)}
                      title="Copy Content"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenDialog(response)}
                      title="Edit"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(response)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingResponse ? 'Edit Canned Response' : 'Create Canned Response'}
            </DialogTitle>
            <DialogDescription>
              {editingResponse
                ? 'Update the canned response details below'
                : 'Create a quick reply template for ticket comments'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Greeting"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., General"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortcut">Shortcut</Label>
                <Input
                  id="shortcut"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  placeholder="e.g., greet"
                />
                <p className="text-xs text-muted-foreground">
                  Type /{formData.shortcut || 'shortcut'} to insert
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the response content..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingResponse ? (
                'Update Response'
              ) : (
                'Create Response'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
