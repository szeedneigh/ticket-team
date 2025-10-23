"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadAvatar } from '@/app/actions/profile'
import type { User } from '@/lib/types/users'

interface AvatarUploadProps {
  user: User
}

export function AvatarUpload({ user }: AvatarUploadProps) {
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
      const result = await uploadAvatar(file)
      
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
      console.error('Avatar upload error:', error)
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
    <Card className="p-4 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Display */}
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage 
              src={previewUrl || user.avatar_url || undefined} 
              alt={user.full_name || 'User avatar'} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          {/* Upload overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col items-center space-y-2">
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
            className="w-full"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {isUploading ? 'Uploading...' : 'Change Avatar'}
          </Button>

          {previewUrl && !isUploading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePreview}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>

        {/* Upload Guidelines */}
        <div className="text-center text-xs text-muted-foreground max-w-xs">
          <p>Upload a profile picture</p>
          <p>Max size: 5MB • Formats: JPG, PNG, GIF</p>
        </div>
      </div>
    </Card>
  )
}
