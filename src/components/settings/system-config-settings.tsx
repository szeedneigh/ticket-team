/**
 * System Configuration Settings Component
 *
 * Manages SLA settings, response times, and system behavior
 */

'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, RefreshCw } from 'lucide-react'
import {
  getSystemConfig,
  updateSystemConfig,
  type SystemConfig,
} from '@/lib/settings/actions'

const DEFAULT_CONFIG: SystemConfig = {
  sla_response_hours: 24,
  sla_resolution_hours: 72,
  auto_assignment_enabled: false,
  allow_ticket_reassignment: true,
  require_resolution_notes: true,
  max_attachment_size_mb: 10,
  allowed_attachment_types: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif',
}

export function SystemConfigSettings() {
  const { toast } = useToast()
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const saved = await getSystemConfig()
      if (saved) {
        setConfig(saved)
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast({
        title: 'Error',
        description: 'Failed to load system configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateSystemConfig(config)

      if (result.success) {
        toast({
          title: 'Success',
          description: 'System configuration saved successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save system configuration',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: 'Error',
        description: 'Failed to save system configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
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
      {/* SLA Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">SLA (Service Level Agreement)</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sla-response">First Response Time (hours)</Label>
            <Input
              id="sla-response"
              type="number"
              min="1"
              max="168"
              value={config.sla_response_hours}
              onChange={(e) =>
                setConfig({ ...config, sla_response_hours: parseInt(e.target.value) || 24 })
              }
            />
            <p className="text-sm text-muted-foreground">
              Maximum time for first response to a new ticket
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sla-resolution">Resolution Time (hours)</Label>
            <Input
              id="sla-resolution"
              type="number"
              min="1"
              max="720"
              value={config.sla_resolution_hours}
              onChange={(e) =>
                setConfig({ ...config, sla_resolution_hours: parseInt(e.target.value) || 72 })
              }
            />
            <p className="text-sm text-muted-foreground">
              Maximum time to resolve a ticket
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Ticket Management</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-assignment">Auto-Assignment</Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign new tickets to available staff
              </p>
            </div>
            <Switch
              id="auto-assignment"
              checked={config.auto_assignment_enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, auto_assignment_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="allow-reassignment">Allow Ticket Reassignment</Label>
              <p className="text-sm text-muted-foreground">
                Allow staff to reassign tickets to other team members
              </p>
            </div>
            <Switch
              id="allow-reassignment"
              checked={config.allow_ticket_reassignment}
              onCheckedChange={(checked) =>
                setConfig({ ...config, allow_ticket_reassignment: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="require-notes">Require Resolution Notes</Label>
              <p className="text-sm text-muted-foreground">
                Staff must provide notes when resolving tickets
              </p>
            </div>
            <Switch
              id="require-notes"
              checked={config.require_resolution_notes}
              onCheckedChange={(checked) =>
                setConfig({ ...config, require_resolution_notes: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* File Upload Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">File Uploads</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="max-size">Maximum File Size (MB)</Label>
            <Input
              id="max-size"
              type="number"
              min="1"
              max="50"
              value={config.max_attachment_size_mb}
              onChange={(e) =>
                setConfig({ ...config, max_attachment_size_mb: parseInt(e.target.value) || 10 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowed-types">Allowed File Types</Label>
            <Input
              id="allowed-types"
              placeholder="pdf,doc,docx,jpg,png"
              value={config.allowed_attachment_types}
              onChange={(e) =>
                setConfig({ ...config, allowed_attachment_types: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Comma-separated list of allowed extensions
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
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
