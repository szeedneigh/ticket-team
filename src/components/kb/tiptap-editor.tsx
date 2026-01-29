/**
 * Tiptap Rich Text Editor Component
 *
 * A comprehensive rich text editor for KB article content.
 * Features:
 * - Rich formatting toolbar (Bold, Italic, Code, Headings, Lists, Links)
 * - Markdown shortcuts support
 * - Write/Preview tabs
 * - Image upload support
 * - Code block with syntax highlighting
 */

'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useState } from 'react'
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Code2,
  Eye,
  Edit3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Start writing your article...',
  className,
  editable = true
}: TiptapEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false // We use CodeBlockLowlight instead
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 hover:text-primary/80'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg'
        }
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-md bg-muted p-4 font-mono text-sm'
        }
      })
    ],
    content,
    editable,
    immediatelyRender: false, // Required for SSR to avoid hydration mismatches
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate dark:prose-invert max-w-none min-h-[400px] focus:outline-none px-4 py-4 bg-background/30',
          'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
          'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
          'prose-p:leading-7 prose-li:leading-7 prose-p:text-foreground/90',
          'prose-code:bg-[#2cafdd]/10 prose-code:text-[#0693D2] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono',
          'prose-pre:bg-[#1f3463]/10 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg'
        ),
        'data-placeholder': placeholder
      }
    }
  })

  const setLink = () => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', previousUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    if (!editor) return

    const url = window.prompt('Enter image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className={cn(
      'rounded-xl border border-white/10 overflow-hidden bg-background/40 backdrop-blur-md shadow-sm transition-all duration-200 focus-within:border-[#2cafdd]/30 focus-within:shadow-[#2cafdd]/5',
      className
    )}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')}>
        {/* Tab Headers */}
        <div className="border-b border-white/10 bg-background/30 px-4 py-2.5 flex items-center justify-between">
          <TabsList className="h-9 bg-background/50 border border-white/10 p-0.5 rounded-lg">
            <TabsTrigger
              value="write"
              className="text-xs h-8 gap-2 px-4 rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1f3463]/20 data-[state=active]:to-[#2cafdd]/20 data-[state=active]:text-[#0693D2] data-[state=active]:border data-[state=active]:border-[#2cafdd]/30"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Write
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="text-xs h-8 gap-2 px-4 rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1f3463]/20 data-[state=active]:to-[#2cafdd]/20 data-[state=active]:text-[#0693D2] data-[state=active]:border data-[state=active]:border-[#2cafdd]/30"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Write Tab */}
        <TabsContent value="write" className="m-0">
          {editable && (
            <div className="border-b border-white/10 bg-background/20 p-2.5">
              <div className="flex flex-wrap gap-1">
                {/* Text Formatting */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={cn(
                    'h-8 w-8 p-0',
                    editor.isActive('bold') && 'bg-muted'
                  )}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={cn(
                    'h-8 w-8 p-0 rounded-lg hover:bg-[#2cafdd]/10 hover:text-[#0693D2] transition-colors',
                    editor.isActive('italic') && 'bg-[#2cafdd]/20 text-[#0693D2]'
                  )}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={cn(
                    'h-8 w-8 p-0',
                    editor.isActive('code') && 'bg-muted'
                  )}
                  title="Inline Code (Ctrl+E)"
                >
                  <Code className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8" />

                {/* Headings */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={cn(
                    'h-8 w-8 p-0',
                    editor.isActive('heading', { level: 1 }) && 'bg-muted'
                  )}
                  title="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={cn(
                    'h-8 w-8 p-0',
                    editor.isActive('heading', { level: 2 }) && 'bg-muted'
                  )}
                  title="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={cn(
                    'h-8 w-8 p-0',
                    editor.isActive('heading', { level: 3 }) && 'bg-muted'
                  )}
                  title="Heading 3"
                >
                  <Heading3 className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8" />

                {/* Lists */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={cn(
                    'h-8 w-8 p-0',
                    editor.isActive('bulletList') && 'bg-muted'
                  )}
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={cn(
                    'h-8 w-8 p-0',
                    editor.isActive('orderedList') && 'bg-muted'
                  )}
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8" />

                {/* Link & Image */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={setLink}
                  className={cn(
                    'h-8 w-8 p-0',
                    editor.isActive('link') && 'bg-muted'
                  )}
                  title="Add Link"
                >
                  <Link2 className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addImage}
                  className="h-8 w-8 p-0"
                  title="Add Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8 bg-white/10" />

                {/* Code Block */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={cn(
                    'h-8 w-8 p-0 rounded-lg hover:bg-[#2cafdd]/10 hover:text-[#0693D2] transition-colors',
                    editor.isActive('codeBlock') && 'bg-[#2cafdd]/20 text-[#0693D2]'
                  )}
                  title="Code Block"
                >
                  <Code2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <EditorContent editor={editor} />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="m-0">
          <div
            className={cn(
              'prose prose-slate dark:prose-invert max-w-none min-h-[400px] px-4 py-4 bg-background/30',
              'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
              'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
              'prose-p:leading-7 prose-li:leading-7 prose-p:text-foreground/90',
              'prose-code:bg-[#2cafdd]/10 prose-code:text-[#0693D2] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono',
              'prose-pre:bg-[#1f3463]/10 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg'
            )}
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
