/**
 * Email Settings Component
 *
 * Configure email notification preferences
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Save, RefreshCw, Send, Mail, Bell, FileText } from 'lucide-react'
import { getSetting, updateSetting } from '@/lib/settings/actions'

interface EmailConfig {
  notifications_enabled: boolean
  notify_on_new_ticket: boolean
  notify_on_assignment: boolean
  notify_on_status_change: boolean
  notify_on_new_comment: boolean
  notify_on_resolution: boolean
  from_name: string
  from_email: string
  reply_to_email: string
  ticket_created_subject: string
  ticket_assigned_subject: string
  ticket_resolved_subject: string
}

const DEFAULT_CONFIG: EmailConfig = {
  notifications_enabled: true,
  notify_on_new_ticket: true,
  notify_on_assignment: true,
  notify_on_status_change: true,
  notify_on_new_comment: true,
  notify_on_resolution: true,
  from_name: 'LVCC IT Support',
  from_email: 'support@laverdad.edu.ph',
  reply_to_email: 'support@laverdad.edu.ph',
  ticket_created_subject: 'New Support Ticket: {{ticket_id}}',
  ticket_assigned_subject: 'Ticket Assigned: {{ticket_id}}',
  ticket_resolved_subject: 'Ticket Resolved: {{ticket_id}}',
}

export function EmailSettings() {
  const { toast } = useToast()
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const saved = await getSetting<EmailConfig>('email_notifications_config')
      if (saved) {
        setConfig(saved)
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast({
        title: 'Error',
        description: 'Failed to load email configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateSetting(
        'email_notifications_config',
        config,
        'Email notification configuration'
      )

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Email configuration saved successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save email configuration',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: 'Error',
        description: 'Failed to save email configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    toast({
      title: 'Test Email',
      description: 'Test email functionality not yet implemented',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium leading-none">Email Configuration</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage outgoing email settings and notification triggers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTestEmail} disabled={isSaving} className="hover:bg-muted/50 transition-colors">
            <Send className="mr-2 h-3.5 w-3.5" />
            Test Email
          </Button>
          <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={isSaving}
          className="shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all bg-gradient-to-r from-[#1f3463] to-[#2cafdd] hover:opacity-90 text-white border-0"
        >
          <Save className="mr-2 h-3.5 w-3.5" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Global Notifications Switch */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled" className="text-base">System Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Enable or disable all email notifications globally.
            </p>
          </div>
        </div>
        <Switch
          id="notifications-enabled"
          checked={config.notifications_enabled}
          onCheckedChange={(checked) =>
            setConfig({ ...config, notifications_enabled: checked })
          }
        />
      </div>

      {/* Email Notifications */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-primary/80">
          <Mail className="h-4 w-4" />
          <h4 className="font-semibold text-sm uppercase tracking-wider">Notification Events</h4>
        </div>
        
        <Card className="bg-card/50 border-input/50 shadow-none">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              <div className="flex items-center justify-between p-4 bg-muted/20">
                <Label htmlFor="notify-new-ticket" className="font-normal cursor-pointer flex-1">
                  New Ticket Created
                </Label>
                <Switch
                  id="notify-new-ticket"
                  checked={config.notify_on_new_ticket}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, notify_on_new_ticket: checked })
                  }
                  disabled={!config.notifications_enabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20">
                <Label htmlFor="notify-assignment" className="font-normal cursor-pointer flex-1">
                  Ticket Assigned
                </Label>
                <Switch
                  id="notify-assignment"
                  checked={config.notify_on_assignment}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, notify_on_assignment: checked })
                  }
                  disabled={!config.notifications_enabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20">
                <Label htmlFor="notify-status" className="font-normal cursor-pointer flex-1">
                  Status Changed
                </Label>
                <Switch
                  id="notify-status"
                  checked={config.notify_on_status_change}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, notify_on_status_change: checked })
                  }
                  disabled={!config.notifications_enabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20">
                <Label htmlFor="notify-comment" className="font-normal cursor-pointer flex-1">
                  New Comment Added
                </Label>
                <Switch
                  id="notify-comment"
                  checked={config.notify_on_new_comment}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, notify_on_new_comment: checked })
                  }
                  disabled={!config.notifications_enabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20">
                <Label htmlFor="notify-resolution" className="font-normal cursor-pointer flex-1">
                  Ticket Resolved
                </Label>
                <Switch
                  id="notify-resolution"
                  checked={config.notify_on_resolution}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, notify_on_resolution: checked })
                  }
                  disabled={!config.notifications_enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-6" />

      {/* Email Configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80">
          <div className="h-4 w-4 rounded-full border-2 border-primary/60" />
          <h4 className="font-semibold text-sm uppercase tracking-wider">Sender Identity</h4>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="from-name">Sender Name</Label>
            <Input
              id="from-name"
              placeholder="e.g. LVCC IT Support"
              value={config.from_name}
              onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="from-email">Sender Email</Label>
            <Input
              id="from-email"
              type="email"
              placeholder="support@laverdad.edu.ph"
              value={config.from_email}
              onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label htmlFor="reply-to">Reply-To Address</Label>
            <Input
              id="reply-to"
              type="email"
              placeholder="support@laverdad.edu.ph"
              value={config.reply_to_email}
              onChange={(e) => setConfig({ ...config, reply_to_email: e.target.value })}
            />
          </div>
        </div>
      </section>

      <Separator className="my-6" />

      {/* Email Templates */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80">
          <FileText className="h-4 w-4" />
          <h4 className="font-semibold text-sm uppercase tracking-wider">Subject Templates</h4>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Customize email subject lines. Available variables: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{'{{ticket_id}}'}</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{'{{ticket_title}}'}</code>
        </p>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject-created">New Ticket Subject</Label>
            <Input
              id="subject-created"
              className="font-mono text-sm"
              value={config.ticket_created_subject}
              onChange={(e) =>
                setConfig({ ...config, ticket_created_subject: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-assigned">Ticket Assigned Subject</Label>
            <Input
              id="subject-assigned"
              className="font-mono text-sm"
              value={config.ticket_assigned_subject}
              onChange={(e) =>
                setConfig({ ...config, ticket_assigned_subject: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-resolved">Ticket Resolved Subject</Label>
            <Input
              id="subject-resolved"
              className="font-mono text-sm"
              value={config.ticket_resolved_subject}
              onChange={(e) =>
                setConfig({ ...config, ticket_resolved_subject: e.target.value })
              }
            />
          </div>
        </div>
      </section>
    </div>
  )
}
