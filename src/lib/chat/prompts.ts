/**
 * System Prompts for AI Chat
 *
 * This module contains all system instructions and prompts for the AI chat assistant.
 * Prompts are designed to create a helpful IT support assistant that provides
 * grounded answers based on the knowledge base.
 *
 * @module lib/chat/prompts
 */

// ============================================================================
// Main System Instruction
// ============================================================================

/**
 * Primary system instruction for the AI chat assistant
 *
 * This defines the assistant's persona, behavior, and response guidelines.
 */
export const CHAT_SYSTEM_INSTRUCTION = `You are Timi, an AI-powered IT support assistant for La Verdad Christian College (LVCC). Your role is to help students, faculty, and staff with their technology-related questions and issues.

**Your Capabilities:**
- Answer IT support questions using the institutional knowledge base
- Provide step-by-step troubleshooting guidance
- Explain technical concepts in simple, accessible language
- Offer relevant solutions based on LVCC's IT policies and procedures

**Core Guidelines:**

1. **Be Grounded in Knowledge Base:**
   - ALWAYS base your answers on the provided knowledge base articles
   - If information is from a KB article, cite it using this format: [Article Title]
   - DO NOT make up information that isn't in the knowledge base
   - If you're unsure or the KB doesn't contain relevant information, admit it honestly

2. **Be Helpful and Professional:**
   - Use a warm, friendly, and professional tone
   - Address users respectfully (students, faculty, or staff)
   - Show empathy for technical frustrations
   - Break down complex solutions into clear, numbered steps
   - Use simple language - avoid unnecessary jargon

3. **Provide Quality Responses:**
   - Give complete, actionable answers
   - Include relevant screenshots or examples when helpful
   - Anticipate follow-up questions and address them proactively
   - Double-check that your answer directly addresses the user's question

4. **Know When to Escalate:**
   - If the issue requires hands-on support, suggest creating a ticket
   - If the issue involves sensitive data or account security, recommend a ticket
   - If you've provided troubleshooting steps but they haven't worked, offer escalation
   - Use this phrase when suggesting escalation: "I recommend creating a support ticket so our IT team can assist you directly."

5. **Citation Format:**
   - When referencing KB articles, use: [Article Title]
   - Place citations at the end of the relevant paragraph
   - You can reference multiple articles in one response

6. **Response Structure:**
   - Start with a brief, direct answer to the question
   - Provide detailed steps or explanation
   - End with next steps or offer to help further
   - Include relevant citations

**Example Responses:**

User: "How do I reset my password?"
Good Response: "I can help you reset your password! Here's how to do it:

1. Go to the LVCC Portal login page
2. Click on "Forgot Password" below the login button
3. Enter your LVCC email address
4. Check your email for a password reset link
5. Click the link and create a new password (must be at least 8 characters with uppercase, lowercase, and a number)

The reset link is valid for 24 hours. If you don't see the email, check your spam folder. [Password Reset Guide]

If you're still having trouble, I can help you create a support ticket for our IT team."

**Important Reminders:**
- You represent LVCC IT Support - be professional and accurate
- User trust is paramount - only provide verified information
- When in doubt, it's better to escalate than to guess
- Your goal is to resolve issues quickly while maintaining quality support

Remember: You're here to make technology easier for the LVCC community. Be patient, be helpful, and be human.`

// ============================================================================
// Specialized Prompts
// ============================================================================

/**
 * Prompt for generating session titles from first message
 *
 * Used to auto-generate descriptive titles for chat sessions.
 */
export const SESSION_TITLE_PROMPT = `Summarize the following IT support question in 5 words or less. Create a clear, descriptive title that captures the main issue or topic. Use title case. Do not use quotes.

Examples:
- "How do I reset my password?" → "Password Reset Help"
- "My printer isn't working" → "Printer Troubleshooting"
- "Can't connect to VPN" → "VPN Connection Issue"
- "Email not syncing on phone" → "Email Sync Problem"

Question: {query}

Title:`

/**
 * Prompt for determining if escalation is needed
 *
 * Used to analyze if a conversation should be escalated to a ticket.
 */
export const ESCALATION_DETECTION_PROMPT = `Based on the following IT support conversation, determine if this issue should be escalated to a human support ticket.

Escalation is recommended when:
1. The issue requires hands-on technical support
2. The issue involves sensitive account or security matters
3. Troubleshooting steps haven't resolved the problem
4. The issue is complex and requires specialized expertise
5. The user has explicitly requested human assistance

Conversation:
{conversation}

Should this be escalated? Respond with only "YES" or "NO" followed by a brief reason.`

/**
 * Prompt for extracting key information for ticket creation
 *
 * Used when escalating to extract relevant details for the ticket.
 */
export const TICKET_EXTRACTION_PROMPT = `Extract key information from this IT support conversation to create a support ticket.

Provide:
1. Suggested ticket title (concise, descriptive)
2. Brief problem summary (2-3 sentences)
3. Suggested category (from: Hardware, Software, Network, Account, Email, Other)
4. Suggested priority (Low, Medium, High)

Conversation:
{conversation}

Format your response as JSON:
{
  "title": "...",
  "summary": "...",
  "category": "...",
  "priority": "..."
}`

// ============================================================================
// Context Building Functions
// ============================================================================

export interface KBArticle {
  id: string
  title: string
  content: string
  category: string
  similarity: number
}

/**
 * Build prompt with knowledge base context
 *
 * Augments the user query with relevant KB articles for RAG.
 *
 * @param userQuery - The user's question
 * @param kbArticles - Retrieved knowledge base articles
 * @param conversationHistory - Optional previous messages
 * @returns Formatted prompt with context
 */
export function buildRAGPrompt(
  userQuery: string,
  kbArticles: KBArticle[],
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  let prompt = ''

  // Add conversation history if provided
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += '**Previous Conversation:**\n\n'
    for (const msg of conversationHistory.slice(-4)) {
      // Last 4 messages
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`
    }
    prompt += '---\n\n'
  }

  // Add knowledge base context
  if (kbArticles.length > 0) {
    prompt += '**Relevant Knowledge Base Articles:**\n\n'

    for (const article of kbArticles) {
      prompt += `### [${article.title}]\n\n`
      prompt += `**Category:** ${article.category}\n\n`
      prompt += `**Content:**\n${article.content}\n\n`
      prompt += `**Relevance Score:** ${(article.similarity * 100).toFixed(1)}%\n\n`
      prompt += '---\n\n'
    }
  } else {
    prompt += '**Note:** No relevant knowledge base articles found for this query. '
    prompt += 'Provide general guidance and suggest creating a support ticket if needed.\n\n'
  }

  // Add current user query
  prompt += `**Current User Question:**\n${userQuery}\n\n`

  // Add instruction
  prompt += '**Your Task:**\n'
  prompt += 'Answer the user\'s question using the knowledge base articles provided above. '
  prompt += 'Cite articles using [Article Title] format. '
  prompt += 'If the KB articles don\'t fully answer the question, acknowledge this and suggest next steps.\n\n'

  return prompt
}

/**
 * Build a follow-up prompt with context
 *
 * For multi-turn conversations, includes previous Q&A.
 */
export function buildFollowUpPrompt(
  userQuery: string,
  previousExchange: { query: string; response: string },
  kbArticles: KBArticle[]
): string {
  let prompt = '**Previous Exchange:**\n\n'
  prompt += `User asked: "${previousExchange.query}"\n\n`
  prompt += `You responded: "${previousExchange.response}"\n\n`
  prompt += '---\n\n'

  prompt += buildRAGPrompt(userQuery, kbArticles)

  return prompt
}

// ============================================================================
// Safety & Content Filtering
// ============================================================================

/**
 * Keywords that might indicate the query is out of scope
 *
 * Used to detect when users are asking about topics unrelated to IT support.
 */
export const OUT_OF_SCOPE_KEYWORDS = [
  'homework',
  'exam',
  'grades',
  'tuition',
  'financial aid',
  'admission',
  'enrollment',
  'schedule',
  'class',
  'course',
]

/**
 * Response for out-of-scope queries
 */
export const OUT_OF_SCOPE_RESPONSE = `I'm Timi, your IT support assistant. I can help with technology-related questions like:
- Password resets and account access
- Email and software issues
- Network and WiFi connectivity
- Printer and hardware problems
- VPN and remote access

For questions about academics, enrollment, or other non-IT topics, please visit the appropriate department:
- Academic: Academic Affairs Office
- Enrollment: Registrar's Office
- Financial: Finance Office

Is there an IT-related issue I can help you with?`

/**
 * Check if a query is within scope for IT support
 *
 * @param query - The user's query
 * @returns True if the query appears to be IT-related
 */
export function isQueryInScope(query: string): boolean {
  const lowerQuery = query.toLowerCase()

  // Check for out-of-scope keywords
  for (const keyword of OUT_OF_SCOPE_KEYWORDS) {
    if (lowerQuery.includes(keyword)) {
      return false
    }
  }

  return true
}

// ============================================================================
// Response Quality Metrics
// ============================================================================

/**
 * Calculate confidence score based on KB article similarity
 *
 * @param articles - Retrieved KB articles with similarity scores
 * @returns Confidence score (0-1)
 */
export function calculateConfidenceScore(articles: KBArticle[]): number {
  if (articles.length === 0) {
    return 0
  }

  // Weight by article similarity and count
  const avgSimilarity =
    articles.reduce((sum, article) => sum + article.similarity, 0) /
    articles.length

  // Boost confidence if multiple articles are relevant
  const countBonus = Math.min(articles.length / 5, 0.2)

  return Math.min(avgSimilarity + countBonus, 1)
}

/**
 * Determine if response should include escalation suggestion
 *
 * @param confidenceScore - Confidence score (0-1)
 * @param conversationLength - Number of messages in conversation
 * @returns True if escalation should be suggested
 */
export function shouldSuggestEscalation(
  confidenceScore: number,
  conversationLength: number
): boolean {
  // Low confidence - suggest escalation
  if (confidenceScore < 0.5) {
    return true
  }

  // Long conversation without resolution - suggest escalation
  if (conversationLength > 6) {
    return true
  }

  return false
}
