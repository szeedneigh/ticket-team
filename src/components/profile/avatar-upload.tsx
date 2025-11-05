"use client"

import { useState, useRef, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadAvatar } from '@/app/actions/profile'
import type { User } from '@/lib/types/users'

interface AvatarUploadProps {
  user: User
}

function AvatarUploadComponent({ user }: AvatarUploadProps) {
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
    <Card className="p-4 bg-card shadow-[var(--elev-2)] rounded-[18px] border border-[var(--brand-primary)]/10">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Display */}
        <div className="relative">
          <Avatar className="h-24 w-24 ring-4 ring-[var(--brand-tint)]/30 transition-all duration-[var(--duration-base)]">
            <AvatarImage
              src={previewUrl || user.avatar_url || undefined}
              alt={user.full_name || 'User avatar'}
            />
            <AvatarFallback className="bg-[var(--brand-primary)] text-white text-lg font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Upload overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col items-center space-y-2 w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full border-[var(--brand-accent)]/30 hover:border-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/10 transition-all duration-[var(--duration-base)]"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2 text-[var(--brand-accent)]" />
            )}
            {isUploading ? 'Uploading...' : 'Change Avatar'}
          </Button>

          {previewUrl && !isUploading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePreview}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>

        {/* Upload Guidelines */}
        <div className="text-center text-xs text-muted-foreground max-w-xs space-y-1">
          <p className="font-medium">Upload a profile picture</p>
          <p className="text-[10px]">Max size: 5MB • Formats: JPG, PNG, GIF</p>
        </div>
      </div>
    </Card>
  )
}

export const AvatarUpload = memo(AvatarUploadComponent)
