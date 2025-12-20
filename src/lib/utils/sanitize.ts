/**
 * HTML Sanitization Utility
 *
 * Provides HTML sanitization to prevent XSS attacks while preserving
 * safe HTML elements and attributes from the Tiptap editor.
 *
 * @module lib/utils/sanitize
 */

import createDOMPurify, { type Config } from 'dompurify'
import { JSDOM } from 'jsdom'

// DOMPurify is a factory that needs a Window. Create a single instance that
// works both on the server (via JSDOM) and in the browser.
let purifier: ReturnType<typeof createDOMPurify> | null = null

function getPurifier(): ReturnType<typeof createDOMPurify> {
  if (purifier) return purifier

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const windowRef: any =
    typeof globalThis.window === 'undefined'
      ? new JSDOM('').window
      : globalThis.window

  purifier = createDOMPurify(windowRef)
  return purifier
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows safe HTML tags from Tiptap editor while removing dangerous scripts/attributes
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns The sanitized HTML string safe for rendering
 */
export function sanitizeHTML(dirty: string): string {
  // Configure DOMPurify with allowed tags from Tiptap editor
  const config: Config = {
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'mark',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Links and media
      'a', 'img',
      // Quotes and blocks
      'blockquote', 'div', 'span',
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Code blocks
      'pre', 'code',
    ],
    ALLOWED_ATTR: [
      // Link attributes
      'href', 'target', 'rel',
      // Image attributes
      'src', 'alt', 'title', 'width', 'height',
      // Styling (allow class for Tiptap styling)
      'class',
      // Code block language
      'data-language',
    ],
    // Don't allow arbitrary data attributes (except specific ones above)
    ALLOW_DATA_ATTR: false,
    // Force links to open in new tab for security
    ADD_ATTR: ['target'],
  }

  return getPurifier().sanitize(dirty, config)
}

/**
 * Sanitizes HTML content for preview mode (more restrictive)
 * Removes all potentially dangerous elements including iframes
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns The sanitized HTML string
 */
export function sanitizeHTMLStrict(dirty: string): string {
  const config: Config = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  }

  return getPurifier().sanitize(dirty, config)
}
