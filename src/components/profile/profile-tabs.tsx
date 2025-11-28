"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Shield, Bell, Activity, Settings } from 'lucide-react'
import { ProfileOverviewTab } from '@/components/profile/profile-overview-tab'
import { SecurityTab } from '@/components/profile/security-tab'
import { NotificationsTab } from '@/components/profile/notifications-tab'
import { ActivityTab } from '@/components/profile/activity-tab'
import { PreferencesTab } from '@/components/profile/preferences-tab'
import { Card } from '@/components/ui/card'
import type { User as UserType } from '@/lib/types/users'

interface ProfileTabsProps {
  user: UserType
  ticketStats?: {
    total: number
    open: number
    resolved: number
  }
}

export function ProfileTabs({ user, ticketStats }: ProfileTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'profile'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`/profile?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-primary)]">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile" className="space-y-6">
            <ProfileOverviewTab user={user} ticketStats={ticketStats} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab user={user} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationsTab user={user} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityTab user={user} />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <PreferencesTab user={user} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
