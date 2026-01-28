"use client"

import { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Lock,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { User } from '@/lib/types/users'
import { toast } from 'sonner'
import {
  getActiveSessions,
  getLoginHistory,
  revokeSession,
  revokeAllSessions
} from '@/app/actions/security'

interface SecurityTabProps {
  user: User
}

// Mock data types (to be replaced with actual database queries)
interface SessionData {
  id: string
  device_info: string
  device_type: 'desktop' | 'mobile' | 'tablet'
  location: string
  ip_address: string
  last_activity_at: string
  is_current: boolean
  user_agent: string
}

interface LoginHistoryData {
  id: string
  timestamp: string
  device: string
  browser: string
  os: string
  ip_address: string
  location: string
  status: 'success' | 'failed' | 'blocked'
  failure_reason?: string
}

function SecurityTabComponent({ user }: SecurityTabProps) {
  const [activeSessions, setActiveSessions] = useState<SessionData[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginHistoryData[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  // Load real data from database
  useEffect(() => {
    loadSessions()
    loadLoginHistory()
  }, [])

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    const result = await getActiveSessions()
    if (result.success && result.data) {
      // Transform data to match component interface (with fallback defaults)
      const transformedSessions = result.data.map((session) => ({
        id: session.id,
        device_info: `${session.browser} on ${session.os}`,
        device_type: session.device_type || 'desktop', // Default to desktop if null
        location: session.city && session.country ? `${session.city}, ${session.country}` : session.ip_address,
        ip_address: session.ip_address,
        last_activity_at: session.last_activity_at,
        is_current: session.is_current ?? false, // Default to false if undefined
        user_agent: session.user_agent || ''
      }))
      setActiveSessions(transformedSessions)
    } else {
      toast.error('Failed to load sessions')
    }
    setIsLoadingSessions(false)
  }

  const loadLoginHistory = async () => {
    setIsLoadingHistory(true)
    const result = await getLoginHistory(20)
    if (result.success && result.data) {
      // Transform data to match component interface
      const transformedHistory = result.data.map((record) => ({
        id: record.id,
        timestamp: record.timestamp,
        device: record.device_type || 'Unknown',
        browser: record.browser || 'Unknown',
        os: record.os || 'Unknown',
        ip_address: record.ip_address,
        location: record.city && record.country ? `${record.city}, ${record.country}` : record.ip_address,
        status: record.status,
        failure_reason: record.failure_reason ?? undefined
      }))
      setLoginHistory(transformedHistory)
    } else {
      toast.error('Failed to load login history')
    }
    setIsLoadingHistory(false)
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      default:
        return Monitor
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return CheckCircle
      case 'failed':
        return XCircle
      case 'blocked':
        return AlertCircle
      default:
        return AlertCircle
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500'
      case 'failed':
        return 'text-red-500'
      case 'blocked':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    const result = await revokeSession(sessionId)

    if (result.success) {
      toast.success('Session revoked successfully')
      // Reload data from database
      loadSessions()
    } else {
      toast.error(result.error || 'Failed to revoke session')
    }
  }

  const handleRevokeAllSessions = async () => {
    const result = await revokeAllSessions()

    if (result.success) {
      toast.success(result.message || 'All sessions revoked successfully')
      // Reload data from database
      loadSessions()
    } else {
      toast.error(result.error || 'Failed to revoke sessions')
    }
  }

  return (
    <div className="space-y-6">
      {/* SSO Authentication Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-[var(--brand-primary)]/15">
              <Lock className="h-5 w-5 text-[var(--brand-primary)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--brand-primary)]">
              Authentication
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--brand-tint)]/10">
              <Shield className="h-5 w-5 text-[var(--brand-primary)]" />
              <div>
                <p className="font-medium">Single Sign-On (SSO)</p>
                <p className="text-sm text-muted-foreground">
                  Your account is secured through La Verdad Christian College&apos;s Google Workspace SSO. Password management is handled by your institutional account.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Active Sessions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[var(--brand-primary)]/15">
                <Shield className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--brand-primary)]">
                  Active Sessions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Devices where you&apos;re currently signed in
                </p>
              </div>
            </div>
            {activeSessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllSessions}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke All
              </Button>
            )}
          </div>

          {isLoadingSessions ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device_type)

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--brand-tint)]/10 transition-[transform,box-shadow] duration-[var(--duration-base)] hover:translate-y-[-1px] hover:shadow-[var(--elev-2)] transform-gpu"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2.5 rounded-lg bg-[var(--brand-primary)]/10">
                        <DeviceIcon className="h-5 w-5 text-[var(--brand-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{session.device_info}</p>
                          {session.is_current && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          IP: {session.ip_address}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Login History Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-[var(--brand-primary)]/15">
              <Clock className="h-5 w-5 text-[var(--brand-primary)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--brand-primary)]">
                Login History
              </h2>
              <p className="text-sm text-muted-foreground">
                Recent sign-in activity on your account
              </p>
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : loginHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No login history found
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((record) => {
                    const StatusIcon = getStatusIcon(record.status)

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${getStatusColor(record.status)}`} />
                            <span className="capitalize">{record.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {new Date(record.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.device}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.browser} • {record.os}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{record.location}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {record.ip_address}
                          </code>
                          {record.failure_reason && (
                            <p className="text-xs text-red-600 mt-1">
                              {record.failure_reason}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Sign Out Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/15">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Sign Out</h2>
                <p className="text-sm text-muted-foreground">
                  End your current session and return to the login page
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Trigger sign out via auth action
                import('@/app/actions/auth').then(({ signOut }) => signOut())
              }}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export const SecurityTab = memo(SecurityTabComponent)
