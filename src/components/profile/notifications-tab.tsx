/**
 * Notifications Tab Component
 *
 * Comprehensive notification preferences management with:
 * - Master channel toggles (Email, In-App)
 * - Per-notification-type channel toggles
 * - Digest frequency settings
 * - Quiet hours configuration
 *
 * @module components/profile/notifications-tab
 */

'use client'

import { useEffect, useState, useTransition, memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  Mail,
  MessageSquare,
  AlertCircle,
  ArrowUpCircle,
  AtSign,
  BookOpen,
  Clock,
  Moon,
  Save,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences
} from '@/app/actions/preferences'
import type { User } from '@/lib/types/users'

interface NotificationsTabProps {
  user: User
}

interface NotificationTypeConfig {
  key: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  emailKey: keyof NotificationPreferences
  appKey: keyof NotificationPreferences
}

// Notification types configuration
const TICKET_NOTIFICATIONS: NotificationTypeConfig[] = [
  {
    key: 'ticket_assigned',
    label: 'Ticket Assigned',
    description: 'When a ticket is assigned to you',
    icon: Bell,
    emailKey: 'ticket_assigned_email',
    appKey: 'ticket_assigned_app'
  },
  {
    key: 'ticket_comment',
    label: 'Comment on Ticket',
    description: 'When someone comments on your ticket',
    icon: MessageSquare,
    emailKey: 'ticket_comment_email',
    appKey: 'ticket_comment_app'
  },
  {
    key: 'ticket_status_changed',
    label: 'Status Changed',
    description: 'When ticket status is updated',
    icon: AlertCircle,
    emailKey: 'ticket_status_changed_email',
    appKey: 'ticket_status_changed_app'
  },
  {
    key: 'ticket_priority_changed',
    label: 'Priority Changed',
    description: 'When ticket priority is updated',
    icon: ArrowUpCircle,
    emailKey: 'ticket_priority_changed_email',
    appKey: 'ticket_priority_changed_app'
  },
  {
    key: 'mention',
    label: 'Mentions',
    description: 'When someone mentions you in a comment',
    icon: AtSign,
    emailKey: 'mention_email',
    appKey: 'mention_app'
  }
]

const KB_NOTIFICATIONS: NotificationTypeConfig[] = [
  {
    key: 'kb_article_published',
    label: 'Article Published',
    description: 'When a new knowledge base article is published',
    icon: BookOpen,
    emailKey: 'kb_article_published_email',
    appKey: 'kb_article_published_app'
  },
  {
    key: 'kb_article_updated',
    label: 'Article Updated',
    description: 'When a knowledge base article is updated',
    icon: BookOpen,
    emailKey: 'kb_article_updated_email',
    appKey: 'kb_article_updated_app'
  }
]

const DIGEST_OPTIONS = [
  { value: 'realtime', label: 'Real-time', description: 'Get notified immediately' },
  { value: 'hourly', label: 'Hourly', description: 'Receive a digest every hour' },
  { value: 'daily', label: 'Daily', description: 'Receive a daily digest at 9:00 AM' },
  { value: 'weekly', label: 'Weekly', description: 'Receive a weekly digest on Monday' }
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
]

function NotificationsTabComponent({ user }: NotificationsTabProps) {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    in_app_enabled: true,
    digest_frequency: 'realtime',
    quiet_hours_enabled: false,
    quiet_hours_days: []
  })
  const [hasChanges, setHasChanges] = useState(false)

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const result = await getNotificationPreferences()
      if (result.success && result.data) {
        setPreferences(result.data)
      } else if (result.error) {
        toast.error('Failed to load preferences', {
          description: result.error
        })
      }
      setIsLoading(false)
    }

    loadPreferences()
  }, [])

  // Handle preference update
  const handleUpdate = (updates: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  // Handle save
  const handleSave = async () => {
    startTransition(async () => {
      const result = await updateNotificationPreferences(preferences)

      if (result.success) {
        toast.success('Preferences saved', {
          description: 'Your notification preferences have been updated.'
        })
        setHasChanges(false)
      } else {
        toast.error('Failed to save', {
          description: result.error || 'An error occurred while saving preferences.'
        })
      }
    })
  }

  // Handle quiet hours days toggle
  const toggleQuietHoursDay = (day: number) => {
    const currentDays = preferences.quiet_hours_days || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort()

    handleUpdate({ quiet_hours_days: newDays })
  }

  if (isLoading) {
    return (
      <Card className="p-8 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Master Channel Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <CardHeader>
            <CardTitle className="text-[var(--brand-primary)] flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Enable or disable notification channels globally
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="email-enabled" className="text-base font-semibold">
                    Email Notifications
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => handleUpdate({ email_enabled: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="app-enabled" className="text-base font-semibold">
                    In-App Notifications
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in the application
                </p>
              </div>
              <Switch
                id="app-enabled"
                checked={preferences.in_app_enabled}
                onCheckedChange={(checked) => handleUpdate({ in_app_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ticket Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Card className="bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <CardHeader>
            <CardTitle className="text-[var(--brand-primary)]">Ticket Notifications</CardTitle>
            <CardDescription>
              Choose how you want to be notified about ticket events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Notification Type</th>
                    <th className="text-center py-3 px-4 font-semibold w-24">
                      <Mail className="h-4 w-4 mx-auto" />
                      <span className="text-xs">Email</span>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold w-24">
                      <Bell className="h-4 w-4 mx-auto" />
                      <span className="text-xs">In-App</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TICKET_NOTIFICATIONS.map((notification, index) => {
                    const Icon = notification.icon
                    return (
                      <tr
                        key={notification.key}
                        className={`border-b last:border-0 ${
                          index % 2 === 0 ? 'bg-muted/20' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10">
                              <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
                            </div>
                            <div>
                              <p className="font-medium">{notification.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {notification.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={preferences[notification.emailKey] as boolean}
                              onCheckedChange={(checked) =>
                                handleUpdate({ [notification.emailKey]: checked })
                              }
                              disabled={!preferences.email_enabled}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={preferences[notification.appKey] as boolean}
                              onCheckedChange={(checked) =>
                                handleUpdate({ [notification.appKey]: checked })
                              }
                              disabled={!preferences.in_app_enabled}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Knowledge Base Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        <Card className="bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <CardHeader>
            <CardTitle className="text-[var(--brand-primary)]">
              Knowledge Base Notifications
            </CardTitle>
            <CardDescription>
              Get notified about knowledge base updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Notification Type</th>
                    <th className="text-center py-3 px-4 font-semibold w-24">
                      <Mail className="h-4 w-4 mx-auto" />
                      <span className="text-xs">Email</span>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold w-24">
                      <Bell className="h-4 w-4 mx-auto" />
                      <span className="text-xs">In-App</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {KB_NOTIFICATIONS.map((notification, index) => {
                    const Icon = notification.icon
                    return (
                      <tr
                        key={notification.key}
                        className={`border-b last:border-0 ${
                          index % 2 === 0 ? 'bg-muted/20' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10">
                              <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
                            </div>
                            <div>
                              <p className="font-medium">{notification.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {notification.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={preferences[notification.emailKey] as boolean}
                              onCheckedChange={(checked) =>
                                handleUpdate({ [notification.emailKey]: checked })
                              }
                              disabled={!preferences.email_enabled}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={preferences[notification.appKey] as boolean}
                              onCheckedChange={(checked) =>
                                handleUpdate({ [notification.appKey]: checked })
                              }
                              disabled={!preferences.in_app_enabled}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Digest Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.3 }}
      >
        <Card className="bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <CardHeader>
            <CardTitle className="text-[var(--brand-primary)] flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Notification Digest
            </CardTitle>
            <CardDescription>
              Choose how frequently you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={preferences.digest_frequency}
              onValueChange={(value) =>
                handleUpdate({ digest_frequency: value as NotificationPreferences['digest_frequency'] })
              }
            >
              <div className="space-y-3">
                {DIGEST_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-4 rounded-lg border transition-colors hover:bg-muted/50"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiet Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.4 }}
      >
        <Card className="bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <CardHeader>
            <CardTitle className="text-[var(--brand-primary)] flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Quiet Hours
            </CardTitle>
            <CardDescription>
              Suppress notifications during specific hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours-enabled" className="text-base font-semibold">
                Enable Quiet Hours
              </Label>
              <Switch
                id="quiet-hours-enabled"
                checked={preferences.quiet_hours_enabled}
                onCheckedChange={(checked) => handleUpdate({ quiet_hours_enabled: checked })}
              />
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="space-y-6 pl-4 border-l-2 border-[var(--brand-primary)]/20">
                {/* Time Range */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Time Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">
                        Start Time
                      </Label>
                      <input
                        id="quiet-start"
                        type="time"
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                        value={preferences.quiet_hours_start || '22:00'}
                        onChange={(e) => handleUpdate({ quiet_hours_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">
                        End Time
                      </Label>
                      <input
                        id="quiet-end"
                        type="time"
                        className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                        value={preferences.quiet_hours_end || '08:00'}
                        onChange={(e) => handleUpdate({ quiet_hours_end: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Days Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Active Days</Label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleQuietHoursDay(day.value)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          (preferences.quiet_hours_days || []).includes(day.value)
                            ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select the days when quiet hours should be active
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-6 flex justify-end"
        >
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isPending}
            className="shadow-[var(--elev-3)] bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  )
}

export const NotificationsTab = memo(NotificationsTabComponent)
