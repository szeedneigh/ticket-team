/**
 * Production-Safe Logger
 * 
 * Structured logging utility that respects NODE_ENV and redacts sensitive data.
 * Does not log anything in production to prevent information leakage.
 * 
 * @module lib/logger
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

/**
 * Check if running in development mode
 * Uses process.env.NODE_ENV directly to avoid circular dependencies
 * This is safe for both client and server as webpack statically replaces it
 */
const isDevelopment = process.env.NODE_ENV === 'development'

interface LogContext {
  [key: string]: unknown
}

/**
 * Redact sensitive data from log messages
 */
function redactSensitiveData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'api_key',
    'apiKey',
    'authorization',
    'auth',
    'session',
    'cookie',
    'credit_card',
    'ssn',
    'email',
  ]

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData)
  }

  const redacted: LogContext = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    
    // Check if key contains sensitive data
    if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
      redacted[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}

/**
 * Check if context object has any meaningful data
 */
function hasContextData(context: unknown): boolean {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return false
  }
  const obj = context as Record<string, unknown>
  return Object.values(obj).some(value => value !== undefined && value !== null)
}

/**
 * Base logging function
 */
function log(level: LogLevel, message: string, context?: LogContext) {
  if (!isDevelopment) {
    // Don't log in production
    return
  }

  // Only process context if it has meaningful data
  const hasData = context ? hasContextData(context) : false
  const redactedContext = hasData ? redactSensitiveData(context!) : undefined

  switch (level) {
    case 'error':
      if (redactedContext && hasContextData(redactedContext)) {
        console.error(`[ERROR] ${message}`, redactedContext)
      } else {
        console.error(`[ERROR] ${message}`)
      }
      break
    case 'warn':
      if (redactedContext && hasContextData(redactedContext)) {
        console.warn(`[WARN] ${message}`, redactedContext)
      } else {
        console.warn(`[WARN] ${message}`)
      }
      break
    case 'info':
      if (redactedContext && hasContextData(redactedContext)) {
        console.info(`[INFO] ${message}`, redactedContext)
      } else {
        console.info(`[INFO] ${message}`)
      }
      break
    case 'debug':
      if (redactedContext && hasContextData(redactedContext)) {
        console.debug(`[DEBUG] ${message}`, redactedContext)
      } else {
        console.debug(`[DEBUG] ${message}`)
      }
      break
  }
}

/**
 * Log error level message
 */
export function error(message: string, context?: LogContext): void {
  log('error', message, context)
}

/**
 * Log warning level message
 */
export function warn(message: string, context?: LogContext): void {
  log('warn', message, context)
}

/**
 * Log info level message
 */
export function info(message: string, context?: LogContext): void {
  log('info', message, context)
}

/**
 * Log debug level message
 */
export function debug(message: string, context?: LogContext): void {
  log('debug', message, context)
}

/**
 * Logger object for convenient imports
 */
export const logger = {
  error,
  warn,
  info,
  debug,
}
