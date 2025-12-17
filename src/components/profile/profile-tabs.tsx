"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Shield, Bell, Activity, Settings } from 'lucide-react'
import { ProfileOverviewTab } from '@/components/profile/profile-overview-tab'
import { SecurityTab } from '@/components/profile/security-tab'
import { NotificationsTab } from '@/components/profile/notifications-tab'
import { ActivityTab } from '@/components/profile/activity-tab'
import { PreferencesTab } from '@/components/profile/preferences-tab'
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
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and view your activity.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-none">
          <TabsList className="inline-flex h-12 items-center justify-start rounded-full bg-muted/50 p-1 text-muted-foreground backdrop-blur-xl border border-border/50 w-auto">
            <TabsTrigger 
              value="profile" 
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Activity</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Preferences</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-[400px]">
          <TabsContent value="profile" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <ProfileOverviewTab user={user} ticketStats={ticketStats} />
          </TabsContent>

          <TabsContent value="security" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <SecurityTab user={user} />
          </TabsContent>

          <TabsContent value="notifications" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <NotificationsTab user={user} />
          </TabsContent>

          <TabsContent value="activity" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <ActivityTab user={user} />
          </TabsContent>

          <TabsContent value="preferences" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <PreferencesTab user={user} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
