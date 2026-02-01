/**
 * System Configuration Settings Component
 *
 * Manages SLA settings, response times, and system behavior
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Save, RefreshCw, Clock, TicketIcon, FileBox } from 'lucide-react'
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

// Animation variants for staggered list items
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

function isSystemConfig(x: unknown): x is SystemConfig {
  return (
    typeof x === 'object' &&
    x !== null &&
    'sla_response_hours' in x &&
    typeof (x as SystemConfig).sla_response_hours === 'number'
  )
}

export function SystemConfigSettings({ initialData }: { initialData?: unknown }) {
  const { toast } = useToast()
  const data = isSystemConfig(initialData) ? initialData : null
  const [config, setConfig] = useState<SystemConfig>(data ?? DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(!data)
  const [isSaving, setIsSaving] = useState(false)

  const loadConfig = useCallback(async () => {
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
  }, [toast])

  useEffect(() => {
    if (!isSystemConfig(initialData)) loadConfig()
  }, [loadConfig, initialData])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      console.log('Saving system config:', config)
      const result = await updateSystemConfig(config)
      console.log('Save result:', result)

      if (result.success) {
        toast({
          title: 'Success',
          description: 'System configuration saved successfully',
        })
        // Reload to verify it saved
        await loadConfig()
      } else {
        console.error('Save failed:', result.error)
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
        description: error instanceof Error ? error.message : 'Failed to save system configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-none">General Configuration</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage core system behaviors and policies.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadConfig} disabled={isSaving} className="hover:bg-muted/50 transition-colors">
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn-primary-brand"
          >
            <Save className="mr-2 h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* SLA Settings */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80 mb-4">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
            <Clock className="h-4 w-4" />
          </div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Service Level Agreements (SLA)</h4>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Response Time Card */}
          <div className="group relative overflow-hidden rounded-xl border bg-background/50 hover:bg-background/80 transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium text-foreground">Response Time</h5>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    Target time for initial agent response to a new ticket.
                  </p>
                </div>
                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/5 transition-colors">
                  <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={config.sla_response_hours}
                  onChange={(e) =>
                    setConfig({ ...config, sla_response_hours: parseInt(e.target.value) || 24 })
                  }
                  className="w-24 h-9 font-mono bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all"
                />
                <span className="text-sm font-medium text-muted-foreground">Hours</span>
              </div>
            </div>
          </div>

          {/* Resolution Time Card */}
          <div className="group relative overflow-hidden rounded-xl border bg-background/50 hover:bg-background/80 transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium text-foreground">Resolution Time</h5>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    Target time to fully resolve and close a ticket.
                  </p>
                </div>
                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/5 transition-colors">
                  <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="720"
                  value={config.sla_resolution_hours}
                  onChange={(e) =>
                    setConfig({ ...config, sla_resolution_hours: parseInt(e.target.value) || 72 })
                  }
                  className="w-24 h-9 font-mono bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all"
                />
                <span className="text-sm font-medium text-muted-foreground">Hours</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Ticket Management */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80 mb-4">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
            <TicketIcon className="h-4 w-4" />
          </div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Ticket Workflow</h4>
        </div>
        
        <div className="rounded-xl border bg-background/50 divide-y divide-border/40 overflow-hidden">
          {/* Setting Row Item 1 */}
          <div className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-all duration-200">
            <div className="space-y-0.5">
              <Label htmlFor="auto-assignment" className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors">Auto-Assignment</Label>
              <p className="text-sm text-muted-foreground">
                Automatically distribute incoming tickets to available staff members.
              </p>
            </div>
            <Switch
              id="auto-assignment"
              checked={config.auto_assignment_enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, auto_assignment_enabled: checked })
              }
              className="data-[state=checked]:bg-primary shadow-sm"
            />
          </div>

          {/* Setting Row Item 2 */}
          <div className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-all duration-200">
            <div className="space-y-0.5">
              <Label htmlFor="allow-reassignment" className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors">Allow Reassignment</Label>
              <p className="text-sm text-muted-foreground">
                Enable staff to transfer ticket ownership to other agents.
              </p>
            </div>
            <Switch
              id="allow-reassignment"
              checked={config.allow_ticket_reassignment}
              onCheckedChange={(checked) =>
                setConfig({ ...config, allow_ticket_reassignment: checked })
              }
              className="data-[state=checked]:bg-primary shadow-sm"
            />
          </div>

          {/* Setting Row Item 3 */}
          <div className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-all duration-200">
            <div className="space-y-0.5">
              <Label htmlFor="require-notes" className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors">Mandatory Resolution Notes</Label>
              <p className="text-sm text-muted-foreground">
                Require agents to provide a summary when marking a ticket as resolved.
              </p>
            </div>
            <Switch
              id="require-notes"
              checked={config.require_resolution_notes}
              onCheckedChange={(checked) =>
                setConfig({ ...config, require_resolution_notes: checked })
              }
              className="data-[state=checked]:bg-primary shadow-sm"
            />
          </div>
        </div>
      </motion.section>

      {/* File Upload Settings */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 text-primary/80 mb-4">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
            <FileBox className="h-4 w-4" />
          </div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Attachments & Storage</h4>
        </div>

        <div className="rounded-xl border bg-background/50 divide-y divide-border/40 overflow-hidden">
          {/* Max Size Row */}
          <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/30 transition-all duration-200">
            <div className="space-y-0.5">
              <Label htmlFor="max-size" className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors">Maximum File Size</Label>
              <p className="text-sm text-muted-foreground">
                Limit the maximum size of individual file attachments.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                id="max-size"
                type="number"
                min="1"
                max="50"
                value={config.max_attachment_size_mb}
                onChange={(e) =>
                  setConfig({ ...config, max_attachment_size_mb: parseInt(e.target.value) || 10 })
                }
                className="w-20 h-9 font-mono bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all"
              />
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">MB</span>
            </div>
          </div>

          {/* Allowed Types Row */}
          <div className="group flex flex-col gap-3 p-4 hover:bg-muted/30 transition-all duration-200">
            <div className="space-y-0.5">
              <Label htmlFor="allowed-types" className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors">Allowed Extensions</Label>
              <p className="text-sm text-muted-foreground">
                Comma-separated list of file extensions allowed for upload permissions.
              </p>
            </div>
            <div className="relative">
              <Input
                id="allowed-types"
                placeholder="e.g. pdf,doc,docx,jpg,png"
                value={config.allowed_attachment_types}
                onChange={(e) =>
                  setConfig({ ...config, allowed_attachment_types: e.target.value })
                }
                className="font-mono text-sm bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all pl-9"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                <FileBox className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}
