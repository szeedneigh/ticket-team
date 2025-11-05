"use client"

import { useState, memo } from 'react'
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

function ProfileClientComponent({ user, ticketStats }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="animate-in fade-in duration-200">
      {isEditing ? (
        <Card className="p-8 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10 animate-in fade-in duration-200">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--brand-primary)]">
                Edit Profile
              </h2>
              <p className="text-muted-foreground mt-2">
                Update your personal information and preferences.
              </p>
            </div>

            <Separator />

            <ProfileForm
              user={user}
              defaultEditing={true}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => setIsEditing(false)}
            />
          </div>
        </Card>
      ) : (
        <ProfileView
          user={user}
          onEdit={() => setIsEditing(true)}
          ticketStats={ticketStats}
        />
      )}
    </div>
  )
}

export const ProfileClient = memo(ProfileClientComponent)
