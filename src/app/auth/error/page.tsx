/**
 * Authentication Error Page
 * 
 * Displays authentication errors with user-friendly messages.
 * Provides a link to try signing in again.
 * 
 * @module app/auth/error/page
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication Error | TicketTeam',
  description: 'An error occurred during authentication',
}

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  const errorMessages: Record<string, { title: string; description: string }> = {
    invalid_domain: {
      title: 'Invalid Email Domain',
      description: 'Please use your La Verdad email address (@laverdad.edu.ph or @student.laverdad.edu.ph) to sign in.',
    },
    auth_failed: {
      title: 'Authentication Failed',
      description: 'We could not sign you in. Please try again or contact IT support if the problem persists.',
    },
    access_denied: {
      title: 'Access Denied',
      description: 'You do not have permission to access this application. Please contact IT support for assistance.',
    },
    server_error: {
      title: 'Server Error',
      description: 'An unexpected error occurred. Please try again later or contact IT support.',
    },
  }
  
  const error = params.error || 'auth_failed'
  const errorInfo = errorMessages[error] || errorMessages.auth_failed
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-primary)]">TicketTeam</h1>
          <p className="text-sm text-muted-foreground">
            La Verdad Christian College
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>{errorInfo.title}</CardTitle>
            </div>
            <CardDescription>{errorInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/auth/sign-in">Try Again</Link>
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Need help?{' '}
                <Link href="mailto:sidneyjohnsarcia@student.laverdad.edu.ph" className="text-foreground hover:underline">
                  Contact IT Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

