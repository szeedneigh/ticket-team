'use server'

import { generateChatResponse } from '@/lib/ai/client'
import { getTicketContext } from '@/lib/ai/retrieval'
import { logAutomation, updateAutomationStatus } from '@/lib/ai/events'
import { requireAuth } from '@/lib/auth/session'
import { isStaffOrAbove } from '@/lib/types/database'
import type { TicketTriageSuggestion, TicketSummary } from '@/lib/types/ai-events'
import type { TicketComment } from '@/lib/types/tickets'
import type { KBArticleInput } from '@/lib/validations/kb-articles'

/**
 * Suggest ticket priority and category based on content
 * 
 * @param ticketTitle - Ticket title
 * @param ticketDescription - Ticket description
 * @param triggerEventId - Optional trigger event ID
 * @returns Triage suggestion
 */
export async function autoTriageTicket(
  ticketTitle: string,
  ticketDescription: string,
  triggerEventId?: string
): Promise<TicketTriageSuggestion | null> {
  const runId = await logAutomation({
    automationType: 'auto_triage',
    triggerEventId,
    inputData: {
      title: ticketTitle,
      description: ticketDescription,
    },
    status: 'running',
  })

  if (!runId) {
    console.error('[autoTriageTicket] Failed to log automation')
    return null
  }

  try {
    const systemInstruction = `You are an IT support ticket triage assistant.
Analyze the ticket and suggest:
1. Priority: low, medium, or high
2. Category: Choose from common IT categories
3. Confidence: 0.0 to 1.0
4. Reasoning: Brief explanation

Respond ONLY with valid JSON in this exact format:
{
  "priority": "medium",
  "category": "Hardware",
  "subcategory": "Computer Issues",
  "confidence": 0.85,
  "reasoning": "Brief reason"
}

Common categories: Hardware, Software, Network, Account Access, Email, Password Reset, System Access, Other`

    const prompt = `Ticket Title: ${ticketTitle}

Ticket Description:
${ticketDescription}

Please analyze this ticket and provide triage suggestions in JSON format.`

    const response = await generateChatResponse({
      prompt,
      systemInstruction,
      temperature: 0.3,
      maxOutputTokens: 512,
    })

    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from response')
    }

    const suggestion = JSON.parse(jsonMatch[0]) as TicketTriageSuggestion

    await updateAutomationStatus(runId, 'completed', {
      suggestion,
    })

    return suggestion
  } catch (error) {
    console.error('[autoTriageTicket] Error:', error)
    
    await updateAutomationStatus(
      runId,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    )

    return null
  }
}

/**
 * Generate a summary of a ticket and its comments
 * 
 * @param ticketId - Ticket ID
 * @param triggerEventId - Optional trigger event ID
 * @returns Ticket summary
 */
export async function autoSummarizeTicket(
  ticketId: string,
  triggerEventId?: string
): Promise<TicketSummary | null> {
  const runId = await logAutomation({
    automationType: 'auto_summarize',
    triggerEventId,
    inputData: {
      ticket_id: ticketId,
    },
    status: 'running',
  })

  if (!runId) {
    console.error('[autoSummarizeTicket] Failed to log automation')
    return null
  }

  try {
    const context = await getTicketContext(ticketId)

    if (!context.ticket) {
      throw new Error('Ticket not found')
    }

    const systemInstruction = `You are an IT support ticket summarization assistant.
Analyze the ticket and its comments to create:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Suggested next actions (optional)
4. Confidence score (0.0 to 1.0)

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief summary here",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "suggestedActions": ["Action 1", "Action 2"],
  "confidence": 0.9
}`

    const commentsText = context.comments
      .map((c: TicketComment) => `[${new Date(c.created_at).toLocaleDateString()}] ${c.content}`)
      .join('\n\n')

    const prompt = `Ticket: ${context.ticket.title}

Description:
${context.ticket.description}

Comments:
${commentsText || 'No comments yet.'}

Please provide a structured summary in JSON format.`

    const response = await generateChatResponse({
      prompt,
      systemInstruction,
      temperature: 0.3,
      maxOutputTokens: 1024,
    })

    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from response')
    }

    const summary = JSON.parse(jsonMatch[0]) as TicketSummary

    await updateAutomationStatus(runId, 'completed', {
      summary,
    })

    return summary
  } catch (error) {
    console.error('[autoSummarizeTicket] Error:', error)
    
    await updateAutomationStatus(
      runId,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    )

    return null
  }
}

/**
 * Generate suggested replies for a ticket
 * 
 * @param ticketId - Ticket ID
 * @param maxSuggestions - Maximum number of suggestions
 * @returns Array of suggested replies
 */
export async function suggestReplies(
  ticketId: string,
  maxSuggestions: number = 3
): Promise<string[]> {
  try {
    const context = await getTicketContext(ticketId)

    if (!context.ticket) {
      return []
    }

    const systemInstruction = `You are an IT support assistant suggesting replies.
Generate ${maxSuggestions} brief, professional reply suggestions for this ticket.
Each suggestion should be 1-2 sentences and address the user's issue.

Respond ONLY with valid JSON array:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]`

    const lastComment = context.comments[context.comments.length - 1]
    const lastCommentText = lastComment
      ? `\n\nLast Comment: ${lastComment.content}`
      : ''

    const prompt = `Ticket: ${context.ticket.title}

Description:
${context.ticket.description}${lastCommentText}

Please suggest ${maxSuggestions} helpful replies.`

    const response = await generateChatResponse({
      prompt,
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 512,
    })

    const jsonMatch = response.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    return JSON.parse(jsonMatch[0]) as string[]
  } catch (error) {
    console.error('[suggestReplies] Error:', error)
    return []
  }
}

/**
 * Synthesize a KB article draft from a resolved ticket
 *
 * Uses AI to convert ticket title, description, and comments into a KB article draft.
 * Only staff and above can use this. Ticket must be resolved or closed.
 *
 * @param ticketId - Ticket ID
 * @returns KB article draft (partial KBArticleInput) or null on failure
 */
export async function synthesizeKBDraftFromTicket(
  ticketId: string
): Promise<(Partial<KBArticleInput> & { source_ticket_id: string }) | null> {
  const user = await requireAuth()
  if (!isStaffOrAbove(user.role)) {
    return null
  }

  const context = await getTicketContext(ticketId)
  if (!context.ticket) {
    return null
  }

  const status = (context.ticket as { status?: string }).status
  if (status !== 'resolved' && status !== 'closed') {
    return null
  }

  const systemInstruction = `You are an IT support knowledge base author for La Verdad Christian College.
Convert this resolved support ticket into a KB article draft that will help other users with similar issues.

Output ONLY valid JSON in this exact format (no markdown code blocks, no extra text):
{
  "title": "Clear, descriptive article title (5-200 chars)",
  "content": "Full article content in markdown format. Include: problem description, solution steps, tips. Min 20 chars.",
  "summary": "Brief 1-2 sentence summary (10-500 chars)",
  "category": "One of: Technical, Account, Enrollment, General, Financial, Academic",
  "subcategory": "One of the subcategories for that category, or empty string",
  "tags": ["tag1", "tag2", "tag3"]
}

Category subcategories:
- Technical: Hardware, Software, Network, Email, Portal
- Account: Login Issues, Password Reset, Registration, Profile
- Enrollment: Course Registration, Schedule, Requirements, Clearance
- General: How-To Guides, Policies, FAQs, Announcements
- Financial: Tuition, Payment, Scholarships, Refunds
- Academic: Grades, Curriculum, Graduation, Transcripts`

  const commentsText = context.comments
    .map((c: TicketComment) => `[${new Date(c.created_at).toLocaleDateString()}] ${c.content}`)
    .join('\n\n')

  const prompt = `Resolved Ticket: ${context.ticket.title}

Description:
${context.ticket.description}

Resolution Discussion:
${commentsText || 'No comments.'}

Convert this into a helpful KB article draft. Focus on the solution and steps that resolved the issue.`

  try {
    const response = await generateChatResponse({
      prompt,
      systemInstruction,
      temperature: 0.5,
      maxOutputTokens: 2048,
    })

    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[synthesizeKBDraftFromTicket] No JSON in response')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: string
      content?: string
      summary?: string
      category?: string
      subcategory?: string
      tags?: string[]
    }

    if (!parsed.title || !parsed.content) {
      return null
    }

    return {
      title: parsed.title,
      content: parsed.content,
      summary: parsed.summary || '',
      category: parsed.category || 'General',
      subcategory: parsed.subcategory || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === 'string').slice(0, 10) : [],
      status: 'draft' as const,
      source_ticket_id: ticketId,
    }
  } catch (error) {
    console.error('[synthesizeKBDraftFromTicket] Error:', error)
    return null
  }
}