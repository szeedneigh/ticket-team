'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sun,
  Moon,
  Monitor,
  Clock,
  Calendar,
  Filter,
  List,
  ArrowUpDown,
  Sidebar,
  Eye,
  Loader2,
  Type
} from 'lucide-react'
import { toast } from 'sonner'
import { getUserPreferences, updateUserPreferences, type UserPreferences } from '@/app/actions/preferences'
import type { User } from '@/lib/types/users'
import { usePreferences } from '@/providers/preferences-provider'

interface PreferencesTabProps {
  user: User
}

// Theme preview card component
function ThemePreviewCard({
  theme,
  icon: Icon,
  label,
  selected,
  onClick
}: {
  theme: string
  icon: React.ElementType
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-[var(--brand-primary)] ${
        selected ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-border'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <Icon className="h-8 w-8" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
      )}
    </div>
  )
}

export function PreferencesTab({ user }: PreferencesTabProps) {
  const { refreshPreferences } = usePreferences()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  // Form state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [defaultTicketFilter, setDefaultTicketFilter] = useState('all')
  const [itemsPerPage, setItemsPerPage] = useState<10 | 20 | 50 | 100>(20)
  const [defaultSortOrder, setDefaultSortOrder] = useState<'newest' | 'oldest' | 'priority' | 'status'>('newest')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large' | 'extra-large'>('normal')

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      const result = await getUserPreferences()
      if (result.success && result.data) {
        setPreferences(result.data)

        // Populate form with existing preferences
        setTheme(result.data.theme as 'light' | 'dark' | 'system')
        setDateFormat(result.data.date_format)
        setTimeFormat(result.data.time_format as '12h' | '24h')
        setDefaultTicketFilter(result.data.default_ticket_filter)
        setItemsPerPage(result.data.items_per_page as 10 | 20 | 50 | 100)
        setDefaultSortOrder(result.data.default_sort_order as 'newest' | 'oldest' | 'priority' | 'status')
        setSidebarCollapsed(result.data.sidebar_collapsed)
        setReducedMotion(result.data.reduced_motion)
        setHighContrast(result.data.high_contrast)
        setFontSize(result.data.font_size as 'small' | 'normal' | 'large' | 'extra-large')
      }
      setIsLoading(false)
    }

    loadPreferences()
  }, [])

  // Save preferences
  const handleSavePreferences = () => {
    startTransition(async () => {
      const result = await updateUserPreferences({
        theme,
        date_format: dateFormat,
        time_format: timeFormat,
        default_ticket_filter: defaultTicketFilter,
        items_per_page: itemsPerPage,
        default_sort_order: defaultSortOrder,
        sidebar_collapsed: sidebarCollapsed,
        reduced_motion: reducedMotion,
        high_contrast: highContrast,
        font_size: fontSize
      })

      if (result.success) {
        toast.success('Preferences saved successfully')
        // Refresh preferences to apply changes immediately
        await refreshPreferences()
      } else {
        toast.error(result.error || 'Failed to save preferences')
      }
    })
  }

  // Get example formatted date
  const getFormattedDateExample = () => {
    const now = new Date()
    const formats: Record<string, string> = {
      'MM/DD/YYYY': `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`,
      'DD/MM/YYYY': `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`,
      'YYYY-MM-DD': `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
      'MMM DD, YYYY': `${now.toLocaleString('en-US', { month: 'short' })} ${now.getDate()}, ${now.getFullYear()}`
    }
    return formats[dateFormat] || dateFormat
  }

  // Get example formatted time
  const getFormattedTimeExample = () => {
    const now = new Date()
    if (timeFormat === '12h') {
      return now.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else {
      return now.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Appearance Section */}
      <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-primary)]">Appearance</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Customize how Ticket Team looks on your device
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Theme</Label>
              <div className="grid grid-cols-3 gap-4">
                <ThemePreviewCard
                  theme="light"
                  icon={Sun}
                  label="Light"
                  selected={theme === 'light'}
                  onClick={() => setTheme('light')}
                />
                <ThemePreviewCard
                  theme="dark"
                  icon={Moon}
                  label="Dark"
                  selected={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                />
                <ThemePreviewCard
                  theme="system"
                  icon={Monitor}
                  label="System"
                  selected={theme === 'system'}
                  onClick={() => setTheme('system')}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                System theme automatically switches between light and dark based on your device settings
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Localization Section */}
      <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-primary)]">Localization</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set your date and time formats
            </p>
          </div>

          <div className="space-y-4">
            {/* Date Format */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Format
              </Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Example: {getFormattedDateExample()}
              </p>
            </div>

            {/* Time Format */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Format
              </Label>
              <RadioGroup value={timeFormat} onValueChange={(value) => setTimeFormat(value as '12h' | '24h')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12h" id="12h" />
                  <Label htmlFor="12h" className="font-normal cursor-pointer">
                    12-hour (AM/PM)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="24h" id="24h" />
                  <Label htmlFor="24h" className="font-normal cursor-pointer">
                    24-hour
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Example: {getFormattedTimeExample()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard Defaults Section */}
      <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-primary)]">Dashboard Defaults</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set default values for your dashboard and ticket views
            </p>
          </div>

          <div className="space-y-4">
            {/* Default Ticket Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Default Ticket Filter
              </Label>
              <Select value={defaultTicketFilter} onValueChange={setDefaultTicketFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="my_tickets">My Tickets</SelectItem>
                  <SelectItem value="open">Open Tickets</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items Per Page */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Items Per Page
              </Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value) as 10 | 20 | 50 | 100)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default Sort Order */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Default Sort Order
              </Label>
              <Select value={defaultSortOrder} onValueChange={(value) => setDefaultSortOrder(value as 'newest' | 'oldest' | 'priority' | 'status')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="priority">By Priority</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sidebar Collapsed */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Sidebar className="h-4 w-4" />
                  Collapse Sidebar by Default
                </Label>
                <p className="text-xs text-muted-foreground">
                  Start with the sidebar collapsed for more space
                </p>
              </div>
              <Switch
                checked={sidebarCollapsed}
                onCheckedChange={setSidebarCollapsed}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Accessibility Section */}
      <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-primary)]">Accessibility</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust settings to improve readability and usability
            </p>
          </div>

          <div className="space-y-4">
            {/* Font Size */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Font Size
              </Label>
              <Select value={fontSize} onValueChange={(value) => setFontSize(value as 'small' | 'normal' | 'large' | 'extra-large')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  Reduced Motion
                </Label>
                <p className="text-xs text-muted-foreground">
                  Minimize animations and transitions
                </p>
              </div>
              <Switch
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  High Contrast Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Increase contrast for better visibility
                </p>
              </div>
              <Switch
                checked={highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSavePreferences}
          disabled={isPending}
          className="min-w-[120px]"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  )
}
