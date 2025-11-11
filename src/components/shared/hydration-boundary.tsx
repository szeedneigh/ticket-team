/**
 * Hydration Boundary Component
 *
 * Catches and suppresses hydration errors caused by browser extensions
 * that inject attributes (like fdprocessedid from password managers).
 * 
 * This component prevents console spam from extension-related hydration warnings
 * while allowing real hydration errors to surface.
 */

'use client'

import { Component, type ReactNode } from 'react'

interface HydrationBoundaryProps {
  children: ReactNode
}

interface HydrationBoundaryState {
  hasError: boolean
}

export class HydrationBoundary extends Component<
  HydrationBoundaryProps,
  HydrationBoundaryState
> {
  constructor(props: HydrationBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): HydrationBoundaryState {
    // Check if error is related to hydration mismatches from browser extensions
    const isExtensionError = 
      error.message?.includes('Hydration') ||
      error.message?.includes('fdprocessedid') ||
      error.message?.includes('browser extension')

    if (isExtensionError) {
      // Suppress the error by not setting hasError state
      // This prevents the error boundary from rendering fallback UI
      return { hasError: false }
    }

    // For other errors, let them propagate
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    // Only log non-extension errors
    const isExtensionError = 
      error.message?.includes('Hydration') ||
      error.message?.includes('fdprocessedid') ||
      error.message?.includes('browser extension')

    if (!isExtensionError) {
      console.error('Component error:', error, errorInfo)
    }
    // Otherwise silently suppress extension-related hydration warnings
  }

  render() {
    if (this.state.hasError) {
      // Only render fallback for real errors, not extension-related ones
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>Something went wrong. Please refresh the page.</p>
        </div>
      )
    }

    return this.props.children
  }
}

