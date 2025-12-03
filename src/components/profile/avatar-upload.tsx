"use client"

import { useState, useRef, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadAvatar } from '@/app/actions/profile'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types/users'

interface AvatarUploadProps {
  user: User
  className?: string
}

function AvatarUploadComponent({ user, className }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Upload file
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)

    try {
      // Wrap file in FormData for server action
      const formData = new FormData()
      formData.append('avatar', file)

      const result = await uploadAvatar(formData)

      if (result.success) {
        toast.success('Avatar updated successfully')
        // Clear preview URL after successful upload
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }
      } else {
        toast.error(result.error || 'Failed to upload avatar')
        // Clear preview on error
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      // Client-side logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Avatar upload error:', error)
      }
      // Clear preview on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getInitials = () => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email.charAt(0).toUpperCase()
  }

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Avatar Display */}
      <div className="relative group">
        <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl transition-all duration-300 group-hover:ring-[var(--brand-primary)]/50">
          <AvatarImage
            src={previewUrl || user.avatar_url || undefined}
            alt={user.full_name || 'User avatar'}
            className="object-cover"
          />
          <AvatarFallback className="bg-[var(--brand-primary)] text-white text-3xl font-bold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm z-10">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 p-2 bg-[var(--brand-primary)] text-white rounded-full shadow-lg hover:bg-[var(--brand-primary)]/90 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-primary)]"
          title="Change Avatar"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Cancel Preview Button - Only show if preview exists and not uploading */}
      {previewUrl && !isUploading && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemovePreview}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      )}
    </div>
  )
}

export const AvatarUpload = memo(AvatarUploadComponent)
