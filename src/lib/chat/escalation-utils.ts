/**
 * Escalation Utility Functions
 *
 * Utilities for smart ticket creation from chat conversations:
 * - Category detection with confidence scoring
 * - Staff assignment based on workload and specialization
 * - Title generation from conversation context
 * - Description formatting with conversation history
 *
 * @module lib/chat/escalation-utils
 */

import { createClient } from '@/lib/supabase/server'
import { generateChatResponse } from '@/lib/ai/client'
import type { RAGContext, ChatMessage } from '@/lib/types/ai'

// ============================================================================
// Types
// ============================================================================

export interface CategoryDetectionResult {
  category: string
  confidence: number
  reason: string
}

export interface StaffSuggestion {
  staffId: string
  staffName: string
  department: string
  currentWorkload: number
  reason: string
  specialty?: string
}

export interface TicketPreparation {
  suggestedTitle: string
  suggestedDescription: string
  suggestedCategory: string
  categoryConfidence: number
  suggestedPriority: 'low' | 'medium' | 'high'
  suggestedStaff: StaffSuggestion | null
  conversationContext: ChatMessage[]
}

// ============================================================================
// Category Detection
// ============================================================================

/**
 * Category keyword mappings for classification
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Account Access': [
    'password',
    'login',
    'access',
    'account',
    'credential',
    'authentication',
    'locked out',
    'forgot password',
    'can\'t log in',
    'username',
  ],
  'Network': [
    'wifi',
    'internet',
    'connection',
    'vpn',
    'network',
    'connectivity',
    'can\'t connect',
    'offline',
    'slow internet',
    'ethernet',
  ],
  'Email': [
    'email',
    'outlook',
    'mail',
    'inbox',
    'send',
    'receive',
    'attachment',
    'spam',
    'email client',
    'webmail',
  ],
  'Hardware': [
    'printer',
    'computer',
    'laptop',
    'screen',
    'monitor',
    'keyboard',
    'mouse',
    'hardware',
    'device',
    'peripheral',
  ],
  'Software': [
    'software',
    'application',
    'program',
    'install',
    'update',
    'error',
    'crash',
    'freeze',
    'app',
    'license',
  ],
}

/**
 * Detect ticket category from conversation context
 *
 * Uses a multi-layered approach:
 * 1. KB article categories (highest confidence)
 * 2. Keyword matching (medium confidence)
 * 3. AI classification (fallback)
 *
 * @param params - Detection parameters
 * @returns Category with confidence score
 */
export async function detectCategory(params: {
  query: string
  contextArticles: RAGContext[]
  conversation: ChatMessage[]
}): Promise<CategoryDetectionResult> {
  const { query, contextArticles, conversation } = params

  // Layer 1: KB Article Categories (Highest confidence - 0.9)
  if (contextArticles.length > 0) {
    const categories = contextArticles
      .map(a => (a.metadata as { category?: string })?.category)
      .filter(Boolean) as string[]

    if (categories.length > 0) {
      // Find most common category
      const categoryCount = categories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const mostCommon = Object.entries(categoryCount).sort(
        (a, b) => b[1] - a[1]
      )[0]

      if (mostCommon) {
        return {
          category: mostCommon[0],
          confidence: 0.9,
          reason: `Based on ${mostCommon[1]} relevant knowledge base article${mostCommon[1] > 1 ? 's' : ''}`,
        }
      }
    }
  }

  // Layer 2: Keyword Matching (Medium confidence - 0.7)
  const fullText = `${query} ${conversation.map(m => m.content).join(' ')}`.toLowerCase()

  const categoryScores: Record<string, number> = {}

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchCount = keywords.filter(keyword =>
      fullText.includes(keyword.toLowerCase())
    ).length

    if (matchCount > 0) {
      categoryScores[category] = matchCount
    }
  }

  if (Object.keys(categoryScores).length > 0) {
    const bestMatch = Object.entries(categoryScores).sort(
      (a, b) => b[1] - a[1]
    )[0]

    return {
      category: bestMatch[0],
      confidence: 0.7,
      reason: `Matched ${bestMatch[1]} relevant keyword${bestMatch[1] > 1 ? 's' : ''}`,
    }
  }

  // Layer 3: AI Classification (Fallback - 0.6)
  try {
    const classificationPrompt = `Classify this IT support request into ONE of these categories: Account Access, Network, Email, Hardware, Software, or General.

Request: "${query}"

Context:
${conversation.slice(0, 3).map(m => `${m.role}: ${m.content}`).join('\n')}

Respond with ONLY the category name, nothing else.`

    const response = await generateChatResponse({
      prompt: classificationPrompt,
      temperature: 0.3,
      maxOutputTokens: 50,
    })

    const aiCategory = response.text.trim()

    // Validate AI response
    const validCategories = [
      ...Object.keys(CATEGORY_KEYWORDS),
      'General',
    ]

    if (validCategories.includes(aiCategory)) {
      return {
        category: aiCategory,
        confidence: 0.6,
        reason: 'AI-classified based on conversation context',
      }
    }
  } catch (error) {
    console.error('AI classification error:', error)
  }

  // Default fallback
  return {
    category: 'General',
    confidence: 0.3,
    reason: 'Unable to determine specific category',
  }
}

// ============================================================================
// Staff Assignment
// ============================================================================

/**
 * Suggest staff member for ticket assignment
 *
 * Considers:
 * - Staff specialization in the category
 * - Current workload (open tickets)
 * - Availability (not deactivated)
 * - Priority level for experience matching
 *
 * @param params - Assignment parameters
 * @returns Staff suggestion or null if none available
 */
export async function suggestStaffAssignment(params: {
  category: string
  priority: 'low' | 'medium' | 'high'
  description: string
}): Promise<StaffSuggestion | null> {
  const { category, priority } = params

  try {
    const supabase = await createClient()

    // Get active staff members
    const { data: staffList, error: staffError } = await supabase
      .from('users')
      .select('id, full_name, department, metadata')
      .eq('role', 'staff')
      .is('deactivated_at', null)

    if (staffError || !staffList || staffList.length === 0) {
      console.error('Error fetching staff:', staffError)
      return null
    }

    // Filter by specialization if metadata includes specialties
    const qualified = staffList.filter(staff => {
      const metadata = staff.metadata as { specialties?: string[] } | null
      const specialties = metadata?.specialties || []

      // Check if staff has this category as a specialty
      return (
        specialties.length === 0 || // No specialties = can handle all
        specialties.includes(category) ||
        specialties.includes('All Categories')
      )
    })

    if (qualified.length === 0) {
      // No specialized staff, use all staff
      qualified.push(...staffList)
    }

    // Get current workload for each qualified staff member
    const workloads = await Promise.all(
      qualified.map(async staff => {
        const { count, error: countError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', staff.id)
          .in('status', ['open', 'in_progress', 'on_hold'])

        if (countError) {
          console.error('Error counting tickets:', countError)
        }

        const metadata = staff.metadata as { specialties?: string[] } | null
        const specialties = metadata?.specialties || []

        return {
          staff,
          openTickets: count || 0,
          hasSpecialty: specialties.includes(category),
        }
      })
    )

    // Sort by priority strategy
    if (priority === 'high') {
      // For high priority: prefer specialized staff even if busier
      workloads.sort((a, b) => {
        if (a.hasSpecialty !== b.hasSpecialty) {
          return a.hasSpecialty ? -1 : 1
        }
        return a.openTickets - b.openTickets
      })
    } else {
      // For low/medium: prefer least busy staff
      workloads.sort((a, b) => a.openTickets - b.openTickets)
    }

    const selected = workloads[0]

    return {
      staffId: selected.staff.id,
      staffName: selected.staff.full_name,
      department: selected.staff.department || 'IT Support',
      currentWorkload: selected.openTickets,
      reason: selected.hasSpecialty
        ? `Specializes in ${category} issues`
        : `Available to assist (${selected.openTickets} current ticket${selected.openTickets !== 1 ? 's' : ''})`,
      specialty: selected.hasSpecialty ? category : undefined,
    }
  } catch (error) {
    console.error('Staff assignment error:', error)
    return null
  }
}

// ============================================================================
// Title Generation
// ============================================================================

/**
 * Generate a concise ticket title from conversation
 *
 * Uses AI to create a 5-10 word descriptive title.
 *
 * @param query - Original user query
 * @param conversation - Full conversation context
 * @returns Generated title
 */
export async function generateTicketTitle(
  query: string,
  conversation: ChatMessage[]
): Promise<string> {
  // Debug logging
  console.log('[Escalation] generateTicketTitle called with:', {
    queryLength: query.length,
    conversationLength: conversation.length,
  })

  try {
    // Build conversation context for better understanding
    const allMessages = conversation
      .slice(0, 6)
      .map(m => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.content}`)
      .join('\n')

    const titlePrompt = `Generate a short, specific ticket title (5-8 words) for this IT support issue.

CONVERSATION:
${allMessages || `USER: ${query}`}

RULES:
- Extract the ACTUAL device/system mentioned (iPhone, laptop, Outlook, printer, etc.)
- State the SPECIFIC problem (not syncing, won't connect, crashes, etc.)
- Use Title Case
- DO NOT make up details not in the conversation
- DO NOT just repeat the user's question word for word

Examples:
- "Printer Not Connecting to Computer"
- "iPhone Email Accounts Not Syncing"
- "Laptop WiFi Disconnects Randomly"

Title:`

    const response = await generateChatResponse({
      prompt: titlePrompt,
      temperature: 0.2,
      maxOutputTokens: 40,
    })

    let title = response.text.trim()
    // Clean up: remove quotes, "Title:" prefix, etc.
    title = title.replace(/^["']|["']$/g, '').replace(/^Title:\s*/i, '').trim()

    console.log('[Escalation] AI generated title:', title)

    // Validate: must be different from raw query and reasonable length
    if (title.length > 5 && title.length < 100 && title.toLowerCase() !== query.toLowerCase()) {
      return title
    }

    console.warn('[Escalation] AI title invalid, using fallback')
  } catch (error) {
    console.error('[Escalation] Title generation error:', error)
  }

  // Smart fallback: Extract device/system and problem from query
  return extractTitleFromQuery(query, conversation)
}

/**
 * Extract a meaningful title from the user's query when AI fails.
 * Looks for common device and problem keywords.
 */
function extractTitleFromQuery(query: string, conversation: ChatMessage[]): string {
  const allText = [query, ...conversation.filter(m => m.role === 'user').map(m => m.content)]
    .join(' ')
    .toLowerCase()

  // Common devices/systems
  const devices = [
    'printer', 'iphone', 'ipad', 'mac', 'macbook', 'laptop', 'computer', 'pc',
    'outlook', 'email', 'teams', 'wifi', 'network', 'vpn', 'phone', 'monitor',
    'keyboard', 'mouse', 'scanner', 'projector', 'zoom', 'excel', 'word',
  ]

  // Common problems
  const problems = [
    'not working', 'not connecting', 'not syncing', 'won\'t connect', 'won\'t start',
    'not responding', 'crashes', 'freezes', 'slow', 'error', 'can\'t access',
    'can\'t login', 'can\'t print', 'disconnecting', 'broken', 'failed',
  ]

  // Find device
  let device = ''
  for (const d of devices) {
    if (allText.includes(d)) {
      device = d.charAt(0).toUpperCase() + d.slice(1)
      break
    }
  }

  // Find problem
  let problem = ''
  for (const p of problems) {
    if (allText.includes(p)) {
      problem = p.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      break
    }
  }

  // Build title
  if (device && problem) {
    return `${device} ${problem}`
  } else if (device) {
    return `${device} Issue`
  } else if (problem) {
    return `System ${problem}`
  }

  // Last resort: clean up the query
  const cleanQuery = query
    .replace(/^(I'm |I am |I have |My |The |Hi,? |Hello,? |Hey,? |Help,? )/i, '')
    .replace(/[.!?]+$/, '')
    .trim()

  const words = cleanQuery.split(/\s+/).slice(0, 6).join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// ============================================================================
// Description Formatting
// ============================================================================

/**
 * Create a clean, plain-text ticket description from chat context.
 *
 * Uses plain text formatting (no markdown) since ticket view doesn't render it.
 * Designed for quick scanning by technicians.
 */
export async function formatTicketDescription(params: {
  conversation: ChatMessage[]
  contextArticles: RAGContext[]
  userAdditions?: string
}): Promise<string> {
  const { conversation, contextArticles, userAdditions } = params

  // Debug logging
  console.log('[Escalation] formatTicketDescription called with:', {
    conversationLength: conversation.length,
    contextArticlesCount: contextArticles.length,
    hasUserAdditions: !!userAdditions,
  })

  let description = ''

  // Clean header (plain text)
  description += '=== ESCALATED FROM AI CHAT ASSISTANT ===\n\n'

  // User's additional context (priority - shown first)
  if (userAdditions && userAdditions.trim()) {
    description += 'ADDITIONAL NOTES FROM USER:\n'
    description += `${userAdditions}\n\n`
    description += '---\n\n'
  }

  // AI-generated summary (or fallback)
  const summary = await summarizeConversationForTicket(conversation)
  description += summary

  // Referenced KB articles (compact format)
  if (contextArticles.length > 0) {
    description += '\n\n---\n'
    description += 'Related KB Articles: '
    const articleTitles = contextArticles.map(article => article.title).join(', ')
    description += articleTitles
  }

  console.log('[Escalation] Generated description length:', description.length)
  return description
}

/**
 * Generate an intelligent, accurate summary for technicians.
 * 
 * Uses PLAIN TEXT formatting (no markdown) for compatibility.
 * Only extracts information actually present in the conversation.
 */
async function summarizeConversationForTicket(
  conversation: ChatMessage[]
): Promise<string> {
  // Debug logging
  console.log('[Escalation] summarizeConversationForTicket called with', conversation.length, 'messages')

  if (!conversation.length) {
    return 'PROBLEM: No conversation data available.\n\nPlease check the chat session for context.'
  }

  // Log first message for debugging
  if (conversation[0]) {
    console.log('[Escalation] First message role:', conversation[0].role, 'content preview:', conversation[0].content.substring(0, 50))
  }

  const serialized = conversation
    .map(msg => `${msg.role === 'user' ? 'USER' : 'AI'}: ${msg.content}`)
    .join('\n\n')

  try {
    const response = await generateChatResponse({
      prompt: `Summarize this IT support chat for a technician. Write in PLAIN TEXT only (no markdown, no asterisks, no special formatting).

CONVERSATION:
${serialized}

Write a summary with these sections (use CAPS for labels):

PROBLEM:
What issue is the user reporting? Be specific - quote their words if helpful.

DEVICE/SYSTEM:
What device or system is affected? (Write "Not specified" if not mentioned in the chat)

WHAT WAS TRIED:
List any troubleshooting steps mentioned by user or AI. (Write "None mentioned" if nothing was tried)

NEXT STEPS:
What should the technician do to help?

CRITICAL RULES:
- Use PLAIN TEXT only - NO asterisks, NO markdown, NO bold
- ONLY include facts from the conversation above
- DO NOT invent or assume any details not mentioned
- If user says "printer", do NOT write "computer"
- If something isn't mentioned, write "Not specified"
- Keep it brief and accurate`,
      temperature: 0.1,
      maxOutputTokens: 400,
    })

    const text = response.text.trim()
    if (text) {
      console.log('[Escalation] AI summary generated successfully')
      return text
    }
  } catch (error) {
    console.error('[Escalation] AI summary failed:', error)
  }

  // Fallback: Create a simple plain-text summary from the PASSED conversation only
  console.log('[Escalation] Using fallback summary')

  const userMessages = conversation
    .filter(m => m.role === 'user')
    .map(m => m.content)

  const firstUserMessage = userMessages[0] || 'No user message found'
  const allUserContent = userMessages.join(' | ')

  return `PROBLEM:
User reported: "${truncate(firstUserMessage, 200)}"
${userMessages.length > 1 ? `Additional context: ${truncate(allUserContent, 150)}` : ''}

WHAT WAS TRIED:
User consulted AI chat assistant before escalating.

NEXT STEPS:
Please review the issue and assist the user.`
}

/**
 * Build short, recent excerpts without dumping the full transcript.
 */
function buildKeyExcerpts(
  conversation: ChatMessage[],
  maxItems: number,
  maxLength: number
): string[] {
  const trimmed = conversation
    .filter(msg => msg.content && msg.content.trim())
    .slice(-maxItems)

  return trimmed.map(msg => {
    const label = msg.role === 'user' ? 'User' : 'AI'
    return `${label}: ${truncate(msg.content, maxLength)}`
  })
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

// ============================================================================
// Priority Suggestion
// ============================================================================

/**
 * Suggest ticket priority based on conversation context
 *
 * Looks for urgency indicators in the conversation.
 *
 * @param query - User query
 * @param conversation - Conversation messages
 * @returns Suggested priority level
 */
export function suggestPriority(
  query: string,
  conversation: ChatMessage[]
): 'low' | 'medium' | 'high' {
  const fullText = `${query} ${conversation.map(m => m.content).join(' ')}`.toLowerCase()

  // High priority indicators
  const highPriorityKeywords = [
    'urgent',
    'critical',
    'emergency',
    'can\'t work',
    'completely broken',
    'production',
    'all users',
    'entire department',
    'asap',
    'immediately',
  ]

  if (highPriorityKeywords.some(keyword => fullText.includes(keyword))) {
    return 'high'
  }

  // Low priority indicators
  const lowPriorityKeywords = [
    'when you have time',
    'not urgent',
    'low priority',
    'question about',
    'curious',
    'wondering',
    'minor',
  ]

  if (lowPriorityKeywords.some(keyword => fullText.includes(keyword))) {
    return 'low'
  }

  // Default to medium
  return 'medium'
}
