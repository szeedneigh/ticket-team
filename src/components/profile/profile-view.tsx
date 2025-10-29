"use client"

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
  Clock
} from 'lucide-react'
import { UserAvatar } from '@/components/auth/user-avatar'
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
      <Card className="p-8 bg-card/90 backdrop-blur-sm shadow-lg rounded-[20px]">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center md:items-start">
            <UserAvatar user={user} size="xl" />
            <div className="mt-4 text-center md:text-left">
              <h1 className="text-2xl font-semibold text-primary">{user.full_name}</h1>
              <Badge variant={getRoleBadgeVariant(user.role)} className="mt-2">
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              {/* Position */}
              {user.position && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-medium">{user.position}</p>
                  </div>
                </div>
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
