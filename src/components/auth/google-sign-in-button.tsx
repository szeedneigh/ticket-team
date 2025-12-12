'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { signInWithGoogle } from '@/app/actions/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GoogleSignInButton() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  const handleSignIn = async () => {
    setError(null)
    
    startTransition(async () => {
      const result = await signInWithGoogle()
      
      if ('error' in result) {
        setError(result.error)
      } else if ('url' in result) {
        // Redirect to Google OAuth
        window.location.href = result.url
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="rounded-xl border-red-100 bg-red-50/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="group relative">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "relative w-full h-12 rounded-xl text-base font-medium transition-all duration-300",
            "bg-white border-slate-200 text-slate-700 shadow-sm",
            "hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow-md",
            "active:scale-[0.99]",
            isPending && "opacity-70 cursor-not-allowed"
          )}
          onClick={handleSignIn}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-400" />
              <span className="text-slate-500">Connecting...</span>
            </>
          ) : (
            <>
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-xs text-slate-400">
          Faculty, Staff & Student Portal
        </p>
      </div>
    </div>
  )
}
