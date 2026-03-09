'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileWarning, RefreshCw, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function KBEditorError({ error, reset }: ErrorBoundaryProps) {
  const params = useParams()
  const articleId = params?.id as string | undefined

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('KB Editor error:', error)
    }
    Sentry.captureException(error, {
      tags: { feature: 'kb-editor' },
      extra: { articleId },
    })
  }, [error, articleId])

  const backHref = articleId ? `/kb/${articleId}` : '/kb'

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gray-50">
      <Card className="p-8 bg-white border shadow-lg rounded-[20px] max-w-md w-full text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 rounded-full">
              <FileWarning className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#003B73]">
              Editor encountered an error
            </h1>
            <p className="text-gray-600">
              The article editor ran into an unexpected problem. Your recent
              changes may have been auto-saved to your browser.
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 bg-[#0693D2] hover:bg-[#0693D2]/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Article
              </Link>
            </Button>
          </div>

          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
