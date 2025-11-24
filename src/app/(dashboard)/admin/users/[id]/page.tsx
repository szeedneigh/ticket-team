/**
 * User Detail/Edit Page
 *
 * View and edit user details with activity history
 * Accessible only to admin and super_admin roles
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Activity, RefreshCw, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  UserAvatar,
  RoleBadge,
  UserForm,
  DeactivateUserDialog,
  ReactivateUserDialog,
  UserActivityHistory,
} from '@/components/users'
import { createClient } from '@/lib/supabase/client'
import { getUserById, getComprehensiveUserActivity, getUserStatistics } from '@/lib/users/queries'
import type { User } from '@/lib/types/users'

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'super_admin'>('admin')
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)

  const [activityData, setActivityData] = useState<{
    ticketActivities: Array<{
      id: string
      action: string
      old_value: string | null
      new_value: string | null
      created_at: string
      ticket: { id: string; title: string; status: string }
    }>
    comments: Array<{
      id: string
      content: string
      is_internal: boolean
      created_at: string
      ticket: { id: string; title: string; status: string }
    }>
    kbArticles: Array<{
      id: string
      title: string
      status: string
      created_at: string
      updated_at: string
      is_author: boolean
    }>
    tickets: Array<{
      id: string
      title: string
      status: string
      priority: string
      created_at: string
      resolved_at: string | null
      relationship: 'created' | 'assigned'
    }>
  }>({
    ticketActivities: [],
    comments: [],
    kbArticles: [],
    tickets: [],
  })

  const [statistics, setStatistics] = useState({
    ticketsCreated: 0,
    ticketsAssigned: 0,
    ticketsResolved: 0,
    commentsPosted: 0,
    avgResolutionTime: null as number | null,
  })

  // Fetch current user's role
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (currentUser) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (data && (data.role === 'admin' || data.role === 'super_admin')) {
          setCurrentUserRole(data.role as 'admin' | 'super_admin')
        }
      }
    }

    fetchCurrentUserRole()
  }, [])

  // Fetch user data
  const fetchUserData = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Fetch user details
      const userData = await getUserById(supabase, userId)
      if (!userData) {
        toast({
          title: 'Error',
          description: 'User not found',
          variant: 'destructive',
        })
        router.push('/admin/users')
        return
      }

      setUser(userData)

      // Fetch comprehensive user activity
      const activity = await getComprehensiveUserActivity(supabase, userId, 15)
      setActivityData(activity)

      // Fetch user statistics
      const stats = await getUserStatistics(supabase, userId)
      setStatistics(stats)
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUserData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleUpdateSuccess = () => {
    setIsEditing(false)
    fetchUserData()
    toast({
      title: 'Success',
      description: 'User updated successfully',
    })
  }

  const formatDuration = (hours: number | null): string => {
    if (hours === null) return 'N/A'
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${(hours / 24).toFixed(1)}d`
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  const canManage =
    currentUserRole === 'super_admin' || (currentUserRole === 'admin' && user.role !== 'super_admin')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>

        <div className="flex gap-2">
          {canManage && !isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit User
              </Button>

              {user.deactivated_at ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReactivateDialog(true)}
                >
                  Reactivate User
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeactivateDialog(true)}
                >
                  Deactivate User
                </Button>
              )}
            </>
          )}

          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Editing
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - User Info & Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    user={user}
                    size="xl"
                  />
                  <div>
                    <CardTitle className="text-2xl">{user.full_name}</CardTitle>
                    <CardDescription className="mt-1">{user.email}</CardDescription>
                    <div className="mt-2 flex items-center gap-2">
                      <RoleBadge role={user.role} />
                      {user.deactivated_at ? (
                        <Badge variant="destructive">Deactivated</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            {isEditing ? (
              <CardContent>
                <Separator className="mb-6" />
                <UserForm
                  mode="edit"
                  user={user}
                  currentUserRole={currentUserRole}
                  onSuccess={handleUpdateSuccess}
                  onCancel={() => setIsEditing(false)}
                />
              </CardContent>
            ) : (
              <CardContent>
                <Separator className="mb-4" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p className="mt-1">
                      {user.department || <span className="text-muted-foreground">Not set</span>}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Position</p>
                    <p className="mt-1">
                      {user.position || <span className="text-muted-foreground">Not set</span>}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="mt-1">
                      {user.phone || <span className="text-muted-foreground">Not set</span>}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Joined</p>
                    <p className="mt-1">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {user.deactivated_at && (
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Deactivated</p>
                      <p className="mt-1 text-destructive">
                        {new Date(user.deactivated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Activity History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity History
                  </CardTitle>
                  <CardDescription>Complete activity across tickets, comments, and articles</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUserData}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <UserActivityHistory
                ticketActivities={activityData.ticketActivities}
                comments={activityData.comments}
                kbArticles={activityData.kbArticles}
                tickets={activityData.tickets}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Statistics */}
        <div className="space-y-6">
          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Created</p>
                <p className="mt-1 text-2xl font-bold">{statistics.ticketsCreated}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Assigned</p>
                <p className="mt-1 text-2xl font-bold">{statistics.ticketsAssigned}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Resolved</p>
                <p className="mt-1 text-2xl font-bold">{statistics.ticketsResolved}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Comments Posted</p>
                <p className="mt-1 text-2xl font-bold">{statistics.commentsPosted}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatDuration(statistics.avgResolutionTime)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <DeactivateUserDialog
        user={user}
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        onSuccess={fetchUserData}
      />

      <ReactivateUserDialog
        user={user}
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        onSuccess={fetchUserData}
      />
    </div>
  )
}
