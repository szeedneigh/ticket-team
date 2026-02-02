'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

// Note: Since this is a client component, we can't use the server-side logger
// The error reporting should be done through an error boundary service

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard error:', error)
    }
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gray-50">
      <Card className="p-8 bg-white border shadow-lg rounded-[20px] max-w-md w-full text-center">
        <div className="space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#003B73]">
              Something went wrong
            </h1>
            <p className="text-gray-600">
              We encountered an unexpected error while loading the dashboard.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mt-4 p-3 bg-gray-50 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 bg-[#0693D2] hover:bg-[#0693D2]/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-sm text-gray-500">
            <p>
              If this problem persists, please contact support or try refreshing the page.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
