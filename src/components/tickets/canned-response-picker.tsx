'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquarePlus, Search, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface CannedResponse {
  id: string
  title: string
  content: string
  category: string | null
  shortcut: string | null
}

interface CannedResponsePickerProps {
  onSelect: (content: string) => void
  disabled?: boolean
}

export function CannedResponsePicker({ onSelect, disabled }: CannedResponsePickerProps) {
  const [open, setOpen] = useState(false)
  const [responses, setResponses] = useState<CannedResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchResponses = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('canned_responses')
        .select('id, title, content, category, shortcut')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })

      if (error) throw error
      setResponses(data || [])
    } catch {
      setResponses([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && responses.length === 0) {
      fetchResponses()
    }
  }, [open, responses.length, fetchResponses])

  const handleSelect = async (response: CannedResponse) => {
    onSelect(response.content)
    setOpen(false)
    setSearch('')

    try {
      const supabase = createClient()
      await supabase.rpc('increment_canned_response_usage', {
        response_id: response.id,
      })
    } catch {
      // Non-critical; don't block the user
    }
  }

  const filtered = search
    ? responses.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.content.toLowerCase().includes(search.toLowerCase()) ||
          r.shortcut?.toLowerCase().includes(search.toLowerCase()) ||
          r.category?.toLowerCase().includes(search.toLowerCase())
      )
    : responses

  const grouped = filtered.reduce<Record<string, CannedResponse[]>>((acc, r) => {
    const key = r.category || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const sortedCategories = Object.keys(grouped).sort((a, b) =>
    a === 'General' ? 1 : b === 'General' ? -1 : a.localeCompare(b)
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          title="Insert canned response"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Canned
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search responses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-72">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {search ? 'No matching responses' : 'No canned responses available'}
            </div>
          ) : (
            <div className="px-1 pb-1">
              {sortedCategories.map((category, catIdx) => (
                <div key={category}>
                  {catIdx > 0 && <Separator className="my-1" />}
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {category}
                    </p>
                  </div>
                  {grouped[category].map((response) => (
                    <button
                      key={response.id}
                      type="button"
                      className="w-full text-left rounded-md px-2 py-2 hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => handleSelect(response)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate flex-1">
                          {response.title}
                        </span>
                        {response.shortcut && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            <Zap className="w-2.5 h-2.5 mr-0.5" />
                            {response.shortcut}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {response.content}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
