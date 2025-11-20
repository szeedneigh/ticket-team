/**
 * Email Settings Component
 *
 * Configure email notification preferences
 */

'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, RefreshCw, Send } from 'lucide-react'
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

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
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
  }

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
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Email Notifications</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="notifications-enabled">Enabled</Label>
            <Switch
              id="notifications-enabled"
              checked={config.notifications_enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, notifications_enabled: checked })
              }
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-2">
            Configure which events trigger email notifications
          </p>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify-new-ticket">New Ticket Created</Label>
            <Switch
              id="notify-new-ticket"
              checked={config.notify_on_new_ticket}
              onCheckedChange={(checked) =>
                setConfig({ ...config, notify_on_new_ticket: checked })
              }
              disabled={!config.notifications_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify-assignment">Ticket Assigned</Label>
            <Switch
              id="notify-assignment"
              checked={config.notify_on_assignment}
              onCheckedChange={(checked) =>
                setConfig({ ...config, notify_on_assignment: checked })
              }
              disabled={!config.notifications_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify-status">Status Changed</Label>
            <Switch
              id="notify-status"
              checked={config.notify_on_status_change}
              onCheckedChange={(checked) =>
                setConfig({ ...config, notify_on_status_change: checked })
              }
              disabled={!config.notifications_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify-comment">New Comment Added</Label>
            <Switch
              id="notify-comment"
              checked={config.notify_on_new_comment}
              onCheckedChange={(checked) =>
                setConfig({ ...config, notify_on_new_comment: checked })
              }
              disabled={!config.notifications_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notify-resolution">Ticket Resolved</Label>
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
      </div>

      {/* Email Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Configuration</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from-name">From Name</Label>
            <Input
              id="from-name"
              placeholder="LVCC IT Support"
              value={config.from_name}
              onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-email">From Email</Label>
            <Input
              id="from-email"
              type="email"
              placeholder="support@laverdad.edu.ph"
              value={config.from_email}
              onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reply-to">Reply-To Email</Label>
            <Input
              id="reply-to"
              type="email"
              placeholder="support@laverdad.edu.ph"
              value={config.reply_to_email}
              onChange={(e) => setConfig({ ...config, reply_to_email: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Email Templates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Subject Templates</h3>
        <p className="text-sm text-muted-foreground">
          Use {'{ticket_id}'} and {'{ticket_title}'} as placeholders
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject-created">Ticket Created</Label>
            <Input
              id="subject-created"
              placeholder="New Support Ticket: {{ticket_id}}"
              value={config.ticket_created_subject}
              onChange={(e) =>
                setConfig({ ...config, ticket_created_subject: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-assigned">Ticket Assigned</Label>
            <Input
              id="subject-assigned"
              placeholder="Ticket Assigned: {{ticket_id}}"
              value={config.ticket_assigned_subject}
              onChange={(e) =>
                setConfig({ ...config, ticket_assigned_subject: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-resolved">Ticket Resolved</Label>
            <Input
              id="subject-resolved"
              placeholder="Ticket Resolved: {{ticket_id}}"
              value={config.ticket_resolved_subject}
              onChange={(e) =>
                setConfig({ ...config, ticket_resolved_subject: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={handleTestEmail} disabled={isSaving}>
          <Send className="mr-2 h-4 w-4" />
          Send Test Email
        </Button>
        <Button variant="outline" onClick={loadConfig} disabled={isSaving}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
