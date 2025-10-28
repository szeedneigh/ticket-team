"use client"

import { useState } from 'react'
import { ProfileView } from '@/components/profile/profile-view'
import { ProfileForm } from '@/components/profile/profile-form'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { User } from '@/lib/types/users'

interface ProfileClientProps {
  user: User
  ticketStats?: {
    total: number
    open: number
    resolved: number
  }
}

export function ProfileClient({ user, ticketStats }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <Card className="p-8 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-primary">Edit Profile</h2>
            <p className="text-muted-foreground mt-1">
              Update your personal information and preferences.
            </p>
          </div>
          
          <Separator />
          
          <ProfileForm 
            user={user}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        </div>
      </Card>
    )
  }

  return (
    <ProfileView 
      user={user} 
      onEdit={() => setIsEditing(true)}
      ticketStats={ticketStats}
    />
  )
}
