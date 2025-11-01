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
                        user.is_online ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
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
                  {/* Email */}
                  <motion.div
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-300 hover:shadow-md"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="p-2.5 rounded-lg bg-primary/20 shadow-sm">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="font-medium text-sm truncate">{user.email}</p>
                    </div>
                  </motion.div>


                  {/* Position */}
                  {user.position && (
                    <motion.div
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-300 hover:shadow-md"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <div className="p-2.5 rounded-lg bg-primary/20 shadow-sm">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Position</p>
                        <p className="font-medium text-sm truncate">{user.position}</p>
                      </div>
                    </motion.div>
                  )}

              {/* Department */}
              {user.department && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{user.department}</p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {user.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Last Login */}
              {user.last_login && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-medium">
                      {new Date(user.last_login).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Stats Card */}
      {ticketStats && (
        <Card className="p-6 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
          <h2 className="text-lg font-semibold text-primary mb-4">Activity Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
              <div className="p-3 rounded-lg bg-primary/10">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold text-primary">{ticketStats.total}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold text-blue-500">{ticketStats.open}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-500">{ticketStats.resolved}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
