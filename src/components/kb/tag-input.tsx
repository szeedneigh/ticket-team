/**
 * Tag Input Component with Autocomplete
 *
 * Allows users to add/remove tags with autocomplete suggestions.
 * Features:
 * - Autocomplete from existing tags
 * - Comma-separated input support
 * - Badge display for selected tags
 * - Keyboard navigation
 */

'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  maxTags?: number
  className?: string
  inputClassName?: string
}

export function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Add tags...',
  maxTags = 10,
  className,
  inputClassName
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions
    .filter(
      (tag) =>
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(tag)
    )
    .slice(0, 5)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()

    // Validate tag
    if (!trimmedTag) return
    if (value.includes(trimmedTag)) return
    if (value.length >= maxTags) return
    if (trimmedTag.length > 50) return

    onChange([...value, trimmedTag])
    setInputValue('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle comma or Enter to add tag
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    }

    // Handle backspace to remove last tag
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault()
      removeTag(value[value.length - 1])
    }

    // Handle Escape to close suggestions
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)

    // Show suggestions when typing
    if (newValue.length > 0 && filteredSuggestions.length > 0) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  // Handle paste with comma-separated tags
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text')
    const tags = pasteData.split(',').map((tag) => tag.trim())

    if (tags.length > 1) {
      e.preventDefault()
      tags.forEach((tag) => {
        if (tag && value.length < maxTags && !value.includes(tag.toLowerCase())) {
          addTag(tag)
        }
      })
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="tag-input" className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Tags
        <span className="text-xs text-muted-foreground font-normal">
          ({value.length}/{maxTags})
        </span>
      </Label>

      {/* Selected Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Input with Autocomplete */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              id="tag-input"
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                value.length >= maxTags
                  ? `Maximum ${maxTags} tags reached`
                  : placeholder
              }
              disabled={value.length >= maxTags}
              className={cn('pr-8', inputClassName)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              <Tag className="h-4 w-4" />
            </div>
          </div>
        </PopoverTrigger>

        {filteredSuggestions.length > 0 && (
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            side="bottom"
          >
            <Command>
              <CommandList>
                <CommandEmpty>No suggestions found</CommandEmpty>
                <CommandGroup heading="Suggested tags">
                  {filteredSuggestions.map((tag) => (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={() => addTag(tag)}
                      className="cursor-pointer"
                    >
                      <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Press comma or Enter to add tags. Use existing tags for better discoverability.
      </p>
    </div>
  )
}
