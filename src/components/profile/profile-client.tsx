"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          key="edit-mode"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Card className="p-8 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md shadow-xl rounded-[24px] border-2 border-primary/10">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Edit Profile
                </h2>
                <p className="text-muted-foreground mt-2">
                  Update your personal information and preferences.
                </p>
              </motion.div>

              <Separator />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ProfileForm
                  user={user}
                  defaultEditing={true}
                  onCancel={() => setIsEditing(false)}
                  onSuccess={() => setIsEditing(false)}
                />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="view-mode"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <ProfileView
            user={user}
            onEdit={() => setIsEditing(true)}
            ticketStats={ticketStats}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
