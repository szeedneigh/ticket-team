"use client"

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  Mail,
  Building,
  User as UserIcon,
  Phone,
  Briefcase,
  Edit3,
  Ticket,
  CheckCircle,
  Clock,
  Circle
} from 'lucide-react'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { formatDistanceToNow } from 'date-fns'
import type { User } from '@/lib/types/users'

interface ProfileViewProps {
  user: User
  onEdit: () => void
  ticketStats?: {
    total: number
    open: number
    resolved: number
  }
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'destructive'
    case 'admin':
      return 'default'
    case 'staff':
      return 'secondary'
    default:
      return 'outline'
  }
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

function InfoItemComponent({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl bg-[var(--brand-tint)]/10 transition-[transform,opacity,box-shadow] duration-[var(--duration-base)] ease-[var(--transition-timing)] hover:translate-y-[-1px] hover:shadow-[var(--elev-2)] transform-gpu will-change-[transform,opacity]">
      <div className="p-2.5 rounded-lg bg-[var(--brand-primary)]/15 shadow-[var(--elev-1)] transition-colors duration-[var(--duration-fast)]">
        <Icon className="h-5 w-5 text-[var(--brand-primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-medium text-sm truncate">{value}</p>
      </div>
    </div>
  )
}

const InfoItem = memo(InfoItemComponent)

function ProfileViewComponent({ user, onEdit, ticketStats }: ProfileViewProps) {
  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Card className="overflow-hidden bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <AvatarUpload user={user} />
                <div className="mt-6 text-center space-y-3">
                  <h1 className="text-3xl font-bold text-[var(--brand-primary)]">
                    {user.full_name}
                  </h1>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="mt-2 px-4 py-1 text-sm font-semibold">
                    {user.role.replace('_', ' ')}
                  </Badge>

                  {/* Online Status Badge */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Circle
                      className={`h-2.5 w-2.5 ${
                        user.is_online ? 'fill-green-500 text-green-500 animate-pulse' : 'fill-gray-400 text-gray-400'
                      }`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {user.is_online ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
                      ) : user.last_seen ? (
                        <span className="text-gray-600 dark:text-gray-400">
                          Last seen {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">Offline</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={Mail} label="Email" value={user.email} />
                  {user.position && <InfoItem icon={Briefcase} label="Position" value={user.position} />}
                  {user.department && <InfoItem icon={Building} label="Department" value={user.department} />}
                  {user.phone && <InfoItem icon={Phone} label="Phone" value={user.phone} />}
                  <InfoItem
                    icon={CalendarDays}
                    label="Member Since"
                    value={new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                  {user.last_login && (
                    <InfoItem
                      icon={UserIcon}
                      label="Last Login"
                      value={new Date(user.last_login).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    />
                  )}
                </div>

                {/* Edit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={onEdit}
                    size="lg"
                    className="shadow-[var(--elev-2)] transition-[transform,box-shadow] duration-[var(--duration-base)] hover:translate-y-[-1px] hover:shadow-[var(--elev-3)] transform-gpu will-change-transform bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Activity Stats Card */}
      {ticketStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <Card className="p-6 bg-card shadow-[var(--elev-3)] rounded-[20px] border border-[var(--brand-primary)]/10">
            <h2 className="text-xl font-bold text-[var(--brand-primary)] mb-6">
              Activity Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Tickets */}
              <div className="flex items-center gap-4 p-5 rounded-xl bg-[var(--brand-primary)]/5 transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--transition-timing)] hover:translate-y-[-2px] hover:shadow-[var(--elev-2)] transform-gpu will-change-transform cursor-default">
                <div className="p-3 rounded-lg bg-[var(--brand-primary)]/15 shadow-[var(--elev-1)]">
                  <Ticket className="h-6 w-6 text-[var(--brand-primary)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Tickets</p>
                  <p className="text-3xl font-bold text-[var(--brand-primary)]">{ticketStats.total}</p>
                </div>
              </div>

              {/* Open Tickets */}
              <div className="flex items-center gap-4 p-5 rounded-xl bg-[var(--brand-accent)]/5 transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--transition-timing)] hover:translate-y-[-2px] hover:shadow-[var(--elev-2)] transform-gpu will-change-transform cursor-default">
                <div className="p-3 rounded-lg bg-[var(--brand-accent)]/15 shadow-[var(--elev-1)]">
                  <Clock className="h-6 w-6 text-[var(--brand-accent)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Tickets</p>
                  <p className="text-3xl font-bold text-[var(--brand-accent)]">{ticketStats.open}</p>
                </div>
              </div>

              {/* Resolved Tickets */}
              <div className="flex items-center gap-4 p-5 rounded-xl bg-green-500/5 transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--transition-timing)] hover:translate-y-[-2px] hover:shadow-[var(--elev-2)] transform-gpu will-change-transform cursor-default">
                <div className="p-3 rounded-lg bg-green-500/15 shadow-[var(--elev-1)]">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resolved</p>
                  <p className="text-3xl font-bold text-green-500">{ticketStats.resolved}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export const ProfileView = memo(ProfileViewComponent)
