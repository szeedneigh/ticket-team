'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, File, AlertCircle, Image, FileText, FileSpreadsheet, Presentation, Archive, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  FILE_UPLOAD,
  isValidFileType,
  isValidFileSize,
  formatFileSize,
} from '@/lib/validations/tickets'

/**
 * File Upload Component
 *
 * Drag-and-drop file upload component for ticket attachments.
 * Features:
 * - Drag and drop support
 * - Multiple file selection
 * - File type and size validation
 * - File preview with remove functionality
 * - Progress indicators
 */

interface FileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  disabled?: boolean
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = FILE_UPLOAD.MAX_FILES,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (!isValidFileSize(file.size)) {
      return `File "${file.name}" exceeds maximum size of ${formatFileSize(FILE_UPLOAD.MAX_FILE_SIZE)}`
    }

    // Check file type (now checks both MIME type and extension)
    if (!isValidFileType(file)) {
      return `File "${file.name}" has an unsupported file type. Allowed: Images (JPG, PNG, GIF, WebP), Documents (PDF, Word, Excel, PowerPoint), Text files, Archives (ZIP, RAR)`
    }

    return null
  }, [])

  const validateFiles = useCallback(
    (newFiles: File[]): { valid: File[]; error: string | null } => {
      // Check max files limit
      if (files.length + newFiles.length > maxFiles) {
        return {
          valid: [],
          error: `Maximum ${maxFiles} files allowed. You currently have ${files.length} file(s).`,
        }
      }

      // Validate each file
      const validFiles: File[] = []
      for (const file of newFiles) {
        const error = validateFile(file)
        if (error) {
          return { valid: [], error }
        }

        // Check for duplicates
        const isDuplicate = files.some(
          (f) => f.name === file.name && f.size === file.size
        )
        if (!isDuplicate) {
          validFiles.push(file)
        }
      }

      return { valid: validFiles, error: null }
    },
    [files, maxFiles, validateFile]
  )

  // ============================================================================
  // File Handling
  // ============================================================================

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles || newFiles.length === 0) return

      const filesArray = Array.from(newFiles)
      const { valid, error } = validateFiles(filesArray)

      if (error) {
        setError(error)
        return
      }

      setError(null)
      onFilesChange([...files, ...valid])
    },
    [files, onFilesChange, validateFiles]
  )

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index)
      onFilesChange(newFiles)
      setError(null)
    },
    [files, onFilesChange]
  )

  const clearAll = useCallback(() => {
    onFilesChange([])
    setError(null)
  }, [onFilesChange])

  // ============================================================================
  // Drag and Drop Handlers
  // ============================================================================

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const droppedFiles = e.dataTransfer.files
      handleFiles(droppedFiles)
    },
    [disabled, handleFiles]
  )

  // ============================================================================
  // Click Handler
  // ============================================================================

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    },
    [handleFiles]
  )

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border border-dashed p-8 transition-all cursor-pointer group',
          isDragging && !disabled
            ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className={cn(
            "p-4 rounded-full bg-muted/50 mb-4 transition-transform group-hover:scale-110 group-hover:bg-background",
            isDragging && "scale-110 bg-background"
        )}>
            <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-muted-foreground">
          Maximum {maxFiles} files, up to {formatFileSize(FILE_UPLOAD.MAX_FILE_SIZE)} each
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supported: Images, PDFs, Office docs, text files, archives
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={FILE_UPLOAD.ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Selected Files ({files.length}/{maxFiles})
            </p>
            {files.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={disabled}
                className="h-8 text-xs hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => removeFile(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// File Preview Component
// ============================================================================

interface FilePreviewProps {
  file: File
  onRemove: () => void
  disabled?: boolean
}

function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/30 backdrop-blur-sm transition-colors hover:bg-muted/50">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex-shrink-0 p-2 rounded-md bg-background shadow-sm">
           {getFileIcon(file.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} • {file.type || 'Unknown type'}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
        className="flex-shrink-0 h-8 w-8 hover:text-destructive hover:bg-destructive/10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove file</span>
      </Button>
    </div>
  )
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" aria-hidden="true" />
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
  if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-blue-600" />
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />
  if (fileType.includes('presentation') || fileType.includes('powerpoint'))
    return <Presentation className="h-5 w-5 text-orange-500" />
  if (fileType.startsWith('text/')) return <FileText className="h-5 w-5 text-gray-500" />
  if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-5 w-5 text-yellow-600" />
  return <Paperclip className="h-5 w-5 text-muted-foreground" />
}
