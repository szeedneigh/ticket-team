"use client"

import { useState, memo } from 'react'
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
import { ProfileEditModal } from '@/components/profile/profile-edit-modal'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types/users'

interface ProfileOverviewTabProps {
  user: User
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
  className?: string
}

function InfoItemComponent({ icon: Icon, label, value, className }: InfoItemProps) {
  return (
    <div className={cn("group flex flex-col gap-2 p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-medium text-sm truncate text-foreground">{value}</p>
    </div>
  )
}

const InfoItem = memo(InfoItemComponent)

function ProfileOverviewTabComponent({ user, ticketStats }: ProfileOverviewTabProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Card className="overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm border-border/50">
          {/* Banner Section */}
          <div className="relative h-48 w-full bg-gradient-to-r from-blue-600/10 via-violet-600/10 to-blue-600/10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
          </div>

          <div className="px-8 pb-8">
            <div className="relative flex flex-col md:flex-row gap-8 items-start -mt-16">
              {/* Avatar Section */}
              <div className="shrink-0">
                <AvatarUpload user={user} />
              </div>

              {/* User Info Header */}
              <div className="flex-1 pt-16 md:pt-20 space-y-1 w-full">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                      {user.full_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="px-3 py-0.5 capitalize shadow-none">
                        {user.role.replace('_', ' ')}
                      </Badge>
                      <span className="hidden md:inline text-muted-foreground/40">•</span>
                      <div className="flex items-center gap-2">
                        <Circle
                          className={cn(
                            "h-2 w-2 fill-current",
                            user.is_online ? "text-green-500 animate-pulse" : "text-muted-foreground"
                          )}
                        />
                        <span>
                          {user.is_online ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
                          ) : user.last_seen ? (
                            <span>Last seen {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}</span>
                          ) : (
                            <span>Offline</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    className="shrink-0 shadow-sm"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Tickets */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <h3 className="text-3xl font-bold mt-2 text-foreground">{ticketStats.total}</h3>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Ticket className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full" />
              </div>
            </Card>

            {/* Open Tickets */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                  <h3 className="text-3xl font-bold mt-2 text-orange-500">{ticketStats.open}</h3>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20 transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500" 
                  style={{ width: `${ticketStats.total > 0 ? (ticketStats.open / ticketStats.total) * 100 : 0}%` }} 
                />
              </div>
            </Card>

            {/* Resolved Tickets */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <h3 className="text-3xl font-bold mt-2 text-green-500">{ticketStats.resolved}</h3>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 text-green-500 group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500" 
                  style={{ width: `${ticketStats.total > 0 ? (ticketStats.resolved / ticketStats.total) * 100 : 0}%` }} 
                />
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        user={user}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </div>
  )
}

export const ProfileOverviewTab = memo(ProfileOverviewTabComponent)
