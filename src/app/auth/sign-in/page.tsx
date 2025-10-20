/**
 * Sign In Page
 * 
 * Google OAuth authentication page.
 * 
 * @module app/auth/sign-in/page
*/

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Sign In | TicketTeam',
  description: 'Sign in with your La Verdad email',
}

function SignInSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-3/4 mx-auto" />
    </div>
  )
}

export default function SignInPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in with your school Google account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<SignInSkeleton />}>
          <GoogleSignInButton />
        </Suspense>
      </CardContent>
    </Card>
  )
}

