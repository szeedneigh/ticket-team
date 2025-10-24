import { getUser } from '@/lib/auth/session'
import { ProfileForm } from '@/components/profile/profile-form'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, Mail, Building, User as UserIcon } from 'lucide-react'

export default async function ProfilePage() {
  const user = await getUser()
  
  if (!user) {
    return null
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

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-[20px]">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center md:items-start">
            <AvatarUpload user={user} />
            <div className="mt-4 text-center md:text-left">
              <h1 className="text-2xl font-semibold text-[#003B73]">{user.full_name}</h1>
              <Badge variant={getRoleBadgeVariant(user.role)} className="mt-2">
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              {user.department && (
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{user.department}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {user.last_login && (
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="font-medium">
                      {new Date(user.last_login).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-[20px]">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#003B73]">Profile Information</h2>
            <p className="text-gray-600 mt-1">
              Update your personal information and preferences.
            </p>
          </div>
          
          <Separator />
          
          <ProfileForm user={user} />
        </div>
      </Card>
    </div>
  )
}
