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
  try {
    const titlePrompt = `Create a concise ticket title (5-10 words) for this IT support request.
Use title case. Be specific and descriptive.

User's question: "${query}"

${conversation.length > 1 ? `Additional context from conversation:
${conversation.slice(1, 3).map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}

Respond with ONLY the title, nothing else. Do not use quotes.`

    const response = await generateChatResponse({
      prompt: titlePrompt,
      temperature: 0.4,
      maxOutputTokens: 50,
    })

    const title = response.text.trim().replace(/^["']|["']$/g, '') // Remove quotes if present

    // Validate length and return
    if (title.length > 5 && title.length < 150) {
      return title
    }

    // Fallback if AI generates invalid title
    return query.substring(0, 80) + (query.length > 80 ? '...' : '')
  } catch (error) {
    console.error('Title generation error:', error)
    return query.substring(0, 80) + (query.length > 80 ? '...' : '')
  }
}

// ============================================================================
// Description Formatting
// ============================================================================

/**
 * Format comprehensive ticket description from chat context
 *
 * Includes:
 * - User's additional context (if provided)
 * - Issue summary
 * - Full conversation history
 * - Referenced KB articles
 *
 * @param params - Formatting parameters
 * @returns Formatted markdown description
 */
export function formatTicketDescription(params: {
  conversation: ChatMessage[]
  contextArticles: RAGContext[]
  userAdditions?: string
}): string {
  const { conversation, contextArticles, userAdditions } = params

  let description = '**🤖 This ticket was created from an AI chat conversation**\n\n'

  // User's additional context
  if (userAdditions && userAdditions.trim()) {
    description += `**📝 Additional Context from User:**\n\n`
    description += `${userAdditions}\n\n`
    description += '---\n\n'
  }

  // Issue summary (first user message)
  if (conversation.length > 0) {
    description += `**❓ Original Issue:**\n\n`
    description += `${conversation[0].content}\n\n`
    description += '---\n\n'
  }

  // Full conversation history
  if (conversation.length > 0) {
    description += `**💬 Chat Conversation History:**\n\n`

    conversation.forEach((msg, index) => {
      const icon = msg.role === 'user' ? '👤' : '🤖'
      const label = msg.role === 'user' ? 'User' : 'AI Assistant'
      const timestamp = msg.timestamp
        ? new Date(msg.timestamp).toLocaleString()
        : ''

      description += `**${icon} ${label}**${timestamp ? ` (${timestamp})` : ''}:\n`
      description += `${msg.content}\n\n`
    })

    description += '---\n\n'
  }

  // Referenced KB articles
  if (contextArticles.length > 0) {
    description += `**📚 Referenced Knowledge Base Articles:**\n\n`

    contextArticles.forEach(article => {
      const relevance = (article.similarity * 100).toFixed(0)
      description += `- **${article.title}** (${relevance}% relevance)\n`
      const category = (article.metadata as { category?: string })?.category
      if (category) {
        description += `  *Category: ${category}*\n`
      }
    })

    description += '\n'
  }

  return description
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
