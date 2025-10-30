/**
 * CORS Configuration Utilities
 * 
 * Provides utilities for handling Cross-Origin Resource Sharing (CORS)
 * in API routes and server actions.
 * 
 * @module lib/cors
 */

import { NextResponse } from 'next/server'
import { env } from './env'

/**
 * CORS configuration options
 */
export interface CorsOptions {
  /**
   * Allowed origins. Use '*' to allow all origins (not recommended for production)
   */
  origins?: string[] | '*'
  
  /**
   * Allowed HTTP methods
   */
  methods?: string[]
  
  /**
   * Allowed headers
   */
  allowedHeaders?: string[]
  
  /**
   * Exposed headers
   */
  exposedHeaders?: string[]
  
  /**
   * Allow credentials (cookies, authorization headers)
   */
  credentials?: boolean
  
  /**
   * Max age for preflight cache (in seconds)
   */
  maxAge?: number
}

/**
 * Default CORS configuration
 */
const DEFAULT_CORS_OPTIONS: Required<CorsOptions> = {
  origins: [
    env.app.siteUrl,
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
}

/**
 * Check if an origin is allowed
 * 
 * @param origin - The origin to check
 * @param allowedOrigins - List of allowed origins or '*'
 * @returns Whether the origin is allowed
 */
function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[] | '*'
): boolean {
  if (!origin) return false
  
  if (allowedOrigins === '*') return true
  
  // Exact match
  if (allowedOrigins.includes(origin)) return true
  
  // Check if origin matches any pattern
  try {
    const originUrl = new URL(origin)
    return allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed)
        return (
          originUrl.protocol === allowedUrl.protocol &&
          originUrl.hostname === allowedUrl.hostname &&
          originUrl.port === allowedUrl.port
        )
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

/**
 * Add CORS headers to a response
 * 
 * @param response - The NextResponse to add headers to
 * @param origin - The request origin
 * @param options - CORS configuration options
 * @returns The response with CORS headers added
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null,
  options: CorsOptions = {}
): NextResponse {
  const config = { ...DEFAULT_CORS_OPTIONS, ...options }
  
  // Check if origin is allowed
  const isAllowed = isOriginAllowed(origin, config.origins)
  
  if (isAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (config.origins === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }
  
  // Set other CORS headers
  response.headers.set(
    'Access-Control-Allow-Methods',
    config.methods.join(', ')
  )
  
  response.headers.set(
    'Access-Control-Allow-Headers',
    config.allowedHeaders.join(', ')
  )
  
  if (config.exposedHeaders.length > 0) {
    response.headers.set(
      'Access-Control-Expose-Headers',
      config.exposedHeaders.join(', ')
    )
  }
  
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  response.headers.set(
    'Access-Control-Max-Age',
    config.maxAge.toString()
  )
  
  return response
}

/**
 * Handle CORS preflight request
 * 
 * @param request - The incoming request
 * @param options - CORS configuration options
 * @returns A response for the preflight request
 */
export function handleCorsPreflightRequest(
  request: Request,
  options: CorsOptions = {}
): NextResponse {
  const origin = request.headers.get('origin')
  const response = new NextResponse(null, { status: 204 })
  
  return addCorsHeaders(response, origin, options)
}

/**
 * Middleware helper to handle CORS
 * 
 * @param request - The incoming request
 * @param handler - The request handler function
 * @param options - CORS configuration options
 * @returns The response with CORS headers
 */
export async function withCors(
  request: Request,
  handler: () => Promise<NextResponse> | NextResponse,
  options: CorsOptions = {}
): Promise<NextResponse> {
  const origin = request.headers.get('origin')
  
  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request, options)
  }
  
  // Handle actual request
  const response = await handler()
  
  return addCorsHeaders(response, origin, options)
}

/**
 * Create a CORS-enabled API route handler
 * 
 * @param handler - The route handler function
 * @param options - CORS configuration options
 * @returns A wrapped handler with CORS support
 * 
 * @example
 * ```typescript
 * export const GET = corsHandler(async (request: Request) => {
 *   return NextResponse.json({ message: 'Hello' })
 * })
 * ```
 */
export function corsHandler(
  handler: (request: Request) => Promise<NextResponse> | NextResponse,
  options: CorsOptions = {}
) {
  return async (request: Request): Promise<NextResponse> => {
    return withCors(request, () => handler(request), options)
  }
}

/**
 * Validate request origin
 * 
 * @param request - The incoming request
 * @param allowedOrigins - List of allowed origins
 * @returns Whether the request origin is valid
 */
export function validateOrigin(
  request: Request,
  allowedOrigins?: string[]
): boolean {
  const origin = request.headers.get('origin')
  const origins = allowedOrigins || DEFAULT_CORS_OPTIONS.origins
  
  return isOriginAllowed(origin, origins)
}

/**
 * Create a response with CORS error
 * 
 * @param message - Error message
 * @returns A NextResponse with CORS error
 */
export function corsError(message = 'Origin not allowed'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

