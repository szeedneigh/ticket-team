/**
 * Production-Safe Logger
 * 
 * Structured logging utility that respects NODE_ENV and redacts sensitive data.
 * Does not log anything in production to prevent information leakage.
 * 
 * @module lib/logger
 */

import { isDevelopment } from './env'

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

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
 * Base logging function
 */
function log(level: LogLevel, message: string, context?: LogContext) {
  if (!isDevelopment()) {
    // Don't log in production
    return
  }

  const redactedContext = context ? redactSensitiveData(context) : undefined

  switch (level) {
    case 'error':
      console.error(`[ERROR] ${message}`, redactedContext || '')
      break
    case 'warn':
      console.warn(`[WARN] ${message}`, redactedContext || '')
      break
    case 'info':
      console.info(`[INFO] ${message}`, redactedContext || '')
      break
    case 'debug':
      console.debug(`[DEBUG] ${message}`, redactedContext || '')
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
