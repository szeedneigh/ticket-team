"use client"

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
  delay?: number
}

function InfoItem({ icon: Icon, label, value, delay = 0 }: InfoItemProps) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-300 hover:shadow-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="p-2.5 rounded-lg bg-primary/20 shadow-sm">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-medium text-sm truncate">{value}</p>
      </div>
    </motion.div>
  )
}

export function ProfileView({ user, onEdit, ticketStats }: ProfileViewProps) {
  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md shadow-xl rounded-[24px] border-2 border-primary/10">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              {/* Avatar Section */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <AvatarUpload user={user} />
                <div className="mt-6 text-center space-y-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
              </motion.div>

              {/* User Info */}
              <motion.div
                className="flex-1 space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={Mail} label="Email" value={user.email} delay={0.1} />
                  {user.position && <InfoItem icon={Briefcase} label="Position" value={user.position} delay={0.15} />}
                  {user.department && <InfoItem icon={Building} label="Department" value={user.department} delay={0.2} />}
                  {user.phone && <InfoItem icon={Phone} label="Phone" value={user.phone} delay={0.25} />}
                  <InfoItem
                    icon={CalendarDays}
                    label="Member Since"
                    value={new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    delay={0.3}
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
                      delay={0.35}
                    />
                  )}
                </div>

                {/* Edit Button */}
                <motion.div
                  className="flex justify-end pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={onEdit}
                    size="lg"
                    className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Activity Stats Card */}
      {ticketStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="p-6 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md shadow-xl rounded-[24px] border-2 border-primary/10">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-6">
              Activity Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Tickets */}
              <motion.div
                className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all duration-300 hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-3 rounded-lg bg-primary/20 shadow-md">
                  <Ticket className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Tickets</p>
                  <p className="text-3xl font-bold text-primary">{ticketStats.total}</p>
                </div>
              </motion.div>

              {/* Open Tickets */}
              <motion.div
                className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/15 hover:to-blue-500/10 transition-all duration-300 hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-3 rounded-lg bg-blue-500/20 shadow-md">
                  <Clock className="h-7 w-7 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Tickets</p>
                  <p className="text-3xl font-bold text-blue-500">{ticketStats.open}</p>
                </div>
              </motion.div>

              {/* Resolved Tickets */}
              <motion.div
                className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/15 hover:to-green-500/10 transition-all duration-300 hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-3 rounded-lg bg-green-500/20 shadow-md">
                  <CheckCircle className="h-7 w-7 text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resolved</p>
                  <p className="text-3xl font-bold text-green-500">{ticketStats.resolved}</p>
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
