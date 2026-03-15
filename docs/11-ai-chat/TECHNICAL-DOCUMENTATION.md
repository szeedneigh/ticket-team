# Timi AI Chat - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technical Implementation](#technical-implementation)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Configuration Guide](#configuration-guide)
6. [Deployment Guide](#deployment-guide)
7. [Maintenance Guide](#maintenance-guide)
8. [Development Guide](#development-guide)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌──────────────────┐            ┌──────────────────────────┐  │
│  │   Chat Page      │            │   Floating Widget        │  │
│  │  /chat           │            │  (Global Access)         │  │
│  └────────┬─────────┘            └────────┬─────────────────┘  │
│           │                               │                     │
│           └───────────────┬───────────────┘                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  ChatClient    │
                    │  Component     │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐   ┌───────▼────────┐
│ Message Display│  │ Chat Input  │   │ Escalation     │
│ - Markdown     │  │ - Auto-resize│   │ - Review Modal │
│ - Sources      │  │ - Shortcuts │   │ - AI Suggest   │
│ - Feedback     │  └─────────────┘   └────────────────┘
└────────────────┘
        │
        │
┌───────▼─────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                          │
│                                                                  │
│  ┌──────────────────┐           ┌─────────────────────────┐   │
│  │ Streaming API    │           │  Server Actions         │   │
│  │ /api/v1/ai/chat  │           │  - createChatSession()  │   │
│  │                  │           │  - sendMessage()        │   │
│  │ - SSE Stream     │           │  - prepareTicket()      │   │
│  │ - Message Queue  │           │  - createTicket()       │   │
│  └─────────┬────────┘           └────────┬────────────────┘   │
└────────────┼──────────────────────────────┼────────────────────┘
             │                              │
             │                              │
┌────────────▼──────────────────────────────▼────────────────────┐
│                    Service Layer                                │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  RAG Service     │  │  AI Client       │  │ Escalation   │ │
│  │  - Scope Check   │  │  - Gemini API    │  │ Utils        │ │
│  │  - Retrieval     │  │  - Embeddings    │  │ - Category   │ │
│  │  - Augmentation  │  │  - Streaming     │  │ - Staff      │ │
│  │  - Generation    │  │  - Retry Logic   │  │ - Title Gen  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
└───────────┼─────────────────────┼────────────────────┼─────────┘
            │                     │                    │
            │                     │                    │
┌───────────▼─────────────────────▼────────────────────▼─────────┐
│                    Data Layer (Supabase)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ PostgreSQL   │  │  pgvector    │  │  Row Level Security  │ │
│  │ - Sessions   │  │  - Embeddings│  │  - User Policies     │ │
│  │ - Messages   │  │  - Similarity│  │  - Role-Based Access │ │
│  │ - Tickets    │  │  - HNSW Index│  └──────────────────────┘ │
│  │ - KB Articles│  └──────────────┘                            │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
            │
            │
┌───────────▼─────────────────────────────────────────────────────┐
│                    External Services                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Google Gemini API                                       │  │
│  │  - text-embedding-004 (768-dim embeddings)              │  │
│  │  - gemini-2.0-flash-exp (chat completions)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Relationships

**Core Components:**

1. **ChatClient** (`src/components/chat/chat-client.tsx`)
   - Orchestrates entire chat experience
   - Manages state (messages, streaming, escalation)
   - Handles API communication
   - Coordinates child components

2. **ChatWidget** (`src/components/chat/chat-widget.tsx`)
   - Floating button interface
   - Mobile: Full-screen drawer
   - Desktop: Dialog with minimize/maximize
   - Persists state across navigation

3. **RAG Service** (`src/lib/chat/rag-service.ts`)
   - Core RAG pipeline implementation
   - Semantic search with pgvector
   - Context augmentation
   - Streaming response generation

4. **Escalation System** (`src/lib/chat/escalation-utils.ts`)
   - Multi-layered category detection
   - Workload-based staff assignment
   - Ticket title generation
   - Confidence scoring

### Data Flow

**Chat Message Flow:**
```
User Input → ChatInput → sendMessage()
    ↓
ChatClient (optimistic update)
    ↓
POST /api/v1/ai/chat (Server Action)
    ↓
streamRAGResponse() (RAG Service)
    ↓
    ├─→ Scope Check
    ├─→ Generate Embedding (768-dim)
    ├─→ Semantic Search (pgvector)
    ├─→ Context Augmentation
    ├─→ Stream Gemini Response (SSE)
    └─→ Record Interaction (DB)
    ↓
ChatClient (streaming chunks)
    ↓
ChatMessage (render with markdown)
```

**Ticket Escalation Flow:**
```
User clicks "Create Ticket" → prepareTicketFromChat()
    ↓
Analyze Conversation Context
    ├─→ detectCategory() (multi-layered)
    ├─→ suggestStaffAssignment() (workload-based)
    ├─→ generateTicketTitle() (AI)
    └─→ formatTicketDescription() (structured)
    ↓
Return TicketPreparation with confidence scores
    ↓
TicketReviewModal displays AI suggestions
    ↓
User reviews and modifies fields
    ↓
User clicks "Create Ticket" → createTicketFromChat()
    ↓
Insert ticket with user-reviewed data
    ↓
Link interaction to ticket
    ↓
Update session as escalated
    ↓
Return success with ticket ID
```

---

## Technical Implementation

### 1. SDK Migration (@google/genai)

**Old SDK** (`@google/generative-ai`):
```typescript
// Deprecated - DO NOT USE
import { GoogleGenerativeAI } from '@google/generative-ai'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
```

**New SDK** (`@google/genai`):
```typescript
// Current implementation
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: serverEnv.gemini.apiKey,
})

// Embeddings
const embeddingResult = await ai.models.embedContent({
  model: 'text-embedding-004',
  contents: text,
  config: {
    taskType: 'RETRIEVAL_QUERY',
    outputDimensionality: 768,
  },
})

// Chat completions
const chatResult = await ai.models.generateContent({
  model: 'gemini-2.0-flash-exp',
  contents: prompt,
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
})

// Streaming
const streamResult = await ai.models.generateContentStream({
  model: 'gemini-2.0-flash-exp',
  contents,
  config: { ... },
})

for await (const chunk of streamResult) {
  const text = chunk.text()
  // Process chunk
}
```

**Key Differences:**
- Unified `GoogleGenAI` client
- Models accessed via `ai.models.methodName()`
- Explicit `config` parameter
- Better TypeScript types
- Streaming uses async generators

### 2. RAG Pipeline Architecture

**File:** `src/lib/chat/rag-service.ts`

```typescript
export async function* streamRAGResponse(
  params: StreamRAGResponseParams
): AsyncGenerator<StreamRAGResponseChunk, void, unknown> {
  const { query, conversationHistory, sessionId } = params

  // ============================================================
  // STEP 1: Scope Check
  // ============================================================
  // Ensure query is relevant to IT support
  if (!isQueryInScope(query)) {
    yield {
      type: 'content',
      text: "I'm Timi, your IT support assistant for La Verdad Christian College. I can help with...",
    }
    yield { type: 'done', citations: [], shouldEscalate: false }
    return
  }

  // ============================================================
  // STEP 2: Retrieval - Semantic Search
  // ============================================================
  const { articles, confidence } = await retrieveContext({
    query,
    matchThreshold: 0.7,
    matchCount: 5,
  })

  // Notify about context retrieval
  yield {
    type: 'context',
    contextArticles: articles,
    confidence,
  }

  // ============================================================
  // STEP 3: Augmentation - Build Prompt
  // ============================================================
  const augmentedPrompt = buildRAGPrompt(query, articles, conversationHistory)

  // ============================================================
  // STEP 4: Generation - Stream Response
  // ============================================================
  let fullResponse = ''
  const chatStream = await generateChatStreamResponse({
    prompt: augmentedPrompt,
    systemInstruction: CHAT_SYSTEM_INSTRUCTION,
    temperature: 0.7,
  })

  for await (const chunk of chatStream) {
    if (chunk.type === 'content' && chunk.text) {
      fullResponse += chunk.text
      yield { type: 'content', text: chunk.text }
    }
  }

  // ============================================================
  // STEP 5: Extract Citations & Determine Escalation
  // ============================================================
  const citations = extractCitations(fullResponse, articles)
  const shouldEscalate = determineEscalationNeed(fullResponse, articles)

  yield {
    type: 'done',
    citations,
    shouldEscalate,
    responseTime: performance.now() - startTime,
  }
}
```

**Retrieval Implementation:**
```typescript
async function retrieveContext(params: {
  query: string
  matchThreshold: number
  matchCount: number
}): Promise<{ articles: RAGContext[]; confidence: number }> {
  // 1. Generate query embedding
  const embedding = await generateEmbedding(params.query, {
    taskType: 'RETRIEVAL_QUERY',
  })

  // 2. Semantic search using pgvector
  const { data: matches } = await supabase.rpc('match_kb_articles', {
    query_embedding: embedding,
    match_threshold: params.matchThreshold,
    match_count: params.matchCount,
  })

  // 3. Format results
  const articles: RAGContext[] = matches.map(match => ({
    id: match.id,
    title: match.title,
    content: match.content,
    category: match.category,
    similarity: match.similarity,
  }))

  // 4. Calculate confidence
  const avgSimilarity = articles.reduce((sum, a) => sum + a.similarity, 0) / articles.length
  const confidence = Math.min(avgSimilarity * 1.2, 1.0)

  return { articles, confidence }
}
```

**Augmentation Implementation:**
```typescript
function buildRAGPrompt(
  query: string,
  kbArticles: RAGContext[],
  conversationHistory: ConversationMessage[]
): string {
  let prompt = ''

  // 1. Add KB context
  if (kbArticles.length > 0) {
    prompt += '**Knowledge Base Context:**\n\n'
    kbArticles.forEach((article, index) => {
      prompt += `[${index + 1}] **${article.title}** (${article.category})\n`
      prompt += `${article.content}\n\n`
    })
  }

  // 2. Add conversation history
  if (conversationHistory.length > 0) {
    prompt += '**Conversation History:**\n\n'
    conversationHistory.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
    })
    prompt += '\n'
  }

  // 3. Add current query
  prompt += `**Current Question:**\n${query}\n\n`

  // 4. Add instructions
  prompt += '**Instructions:**\n'
  prompt += '- Answer based on the Knowledge Base context above\n'
  prompt += '- Cite sources using article titles\n'
  prompt += '- If context is insufficient, suggest creating a support ticket\n'
  prompt += '- Be concise and helpful\n'

  return prompt
}
```

### 3. Streaming Implementation

**Server-Side (API Route):**

**File:** `src/app/api/v1/ai/chat/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message, sessionId, conversationHistory } = await request.json()

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        // Start RAG pipeline
        const ragStream = streamRAGResponse({
          query: message,
          conversationHistory,
          sessionId,
          userId: user.id,
        })

        let fullResponse = ''
        let contextArticles: RAGContext[] = []
        let interactionId: string | null = null

        // Process stream chunks
        for await (const chunk of ragStream) {
          // Send chunk to client
          const data = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(encoder.encode(data))

          // Accumulate for DB storage
          if (chunk.type === 'content') {
            fullResponse += chunk.text || ''
          } else if (chunk.type === 'context') {
            contextArticles = chunk.contextArticles || []
          }
        }

        // Record interaction in database
        const { data: interaction } = await supabase
          .from('ai_interactions')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            query: message,
            response: fullResponse,
            context_articles: contextArticles.map(a => a.id),
            model: 'gemini-2.0-flash-exp',
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        interactionId = interaction?.id || null

        // Send final done event with interaction ID
        const doneEvent = `data: ${JSON.stringify({
          type: 'done',
          interactionId,
        })}\n\n`
        controller.enqueue(encoder.encode(doneEvent))

        controller.close()
      } catch (error) {
        console.error('Streaming error:', error)
        const errorEvent = `data: ${JSON.stringify({
          type: 'error',
          error: 'An error occurred while processing your request',
        })}\n\n`
        controller.enqueue(encoder.encode(errorEvent))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}
```

**Client-Side (ChatClient):**

**File:** `src/components/chat/chat-client.tsx`

```typescript
const handleSendMessage = async (message: string) => {
  // Optimistic update
  const userMessage: ChatMessage = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  }
  setMessages(prev => [...prev, userMessage])
  setIsLoading(true)
  setStreamingContent('')

  try {
    const response = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) throw new Error('Failed to send message')

    // Process SSE stream
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let sources: RAGContext[] = []
    let finalInteractionId: string | null = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))

          if (data.type === 'content') {
            fullContent += data.text || ''
            setStreamingContent(fullContent)
          } else if (data.type === 'context') {
            sources = data.contextArticles || []
          } else if (data.type === 'done') {
            finalInteractionId = data.interactionId || null
            setShouldEscalate(data.shouldEscalate || false)
          } else if (data.type === 'error') {
            toast.error(data.error || 'An error occurred')
          }
        }
      }
    }

    // Commit final message
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: fullContent,
      sources,
      interactionId: finalInteractionId,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, assistantMessage])
    setStreamingContent('')
  } catch (error) {
    console.error('Error sending message:', error)
    toast.error('Failed to send message')
  } finally {
    setIsLoading(false)
  }
}
```

### 4. Escalation System

**Multi-Layered Category Detection:**

**File:** `src/lib/chat/escalation-utils.ts`

```typescript
export async function detectCategory(
  params: CategoryDetectionParams
): Promise<CategoryDetectionResult> {
  const { query, contextArticles, conversationHistory } = params

  // ============================================================
  // Layer 1: KB Article Categories (90% confidence)
  // ============================================================
  if (contextArticles.length > 0) {
    const categoryFrequency: Record<string, number> = {}

    contextArticles.forEach(article => {
      categoryFrequency[article.category] =
        (categoryFrequency[article.category] || 0) + 1
    })

    const mostCommon = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => b - a)[0][0]

    return {
      category: mostCommon,
      confidence: 0.9,
      reason: `Based on ${contextArticles.length} related KB articles`,
    }
  }

  // ============================================================
  // Layer 2: Keyword Matching (70% confidence)
  // ============================================================
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'Account Access': [
      'password', 'reset', 'login', 'locked', 'account', 'unlock',
      'credentials', 'forgot', 'access', 'sign in', 'authentication'
    ],
    'Email': [
      'email', 'outlook', 'sending', 'receiving', 'inbox', 'attachment',
      'spam', 'mailbox', 'message', 'compose'
    ],
    'Network': [
      'wifi', 'internet', 'connection', 'network', 'ethernet', 'vpn',
      'disconnect', 'slow', 'connectivity', 'ip address'
    ],
    'Hardware': [
      'computer', 'laptop', 'monitor', 'keyboard', 'mouse', 'printer',
      'device', 'screen', 'power', 'battery', 'broken'
    ],
    'Software': [
      'install', 'software', 'application', 'program', 'update', 'error',
      'crash', 'bug', 'license', 'version'
    ],
  }

  const allText = `${query} ${conversationHistory.map(m => m.content).join(' ')}`
    .toLowerCase()

  const categoryScores: Record<string, number> = {}

  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    const matchCount = keywords.filter(keyword =>
      allText.includes(keyword.toLowerCase())
    ).length

    if (matchCount > 0) {
      categoryScores[category] = matchCount
    }
  })

  if (Object.keys(categoryScores).length > 0) {
    const bestMatch = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)[0]

    return {
      category: bestMatch[0],
      confidence: 0.7,
      reason: `Matched ${bestMatch[1]} relevant keywords`,
    }
  }

  // ============================================================
  // Layer 3: AI Classification (60% confidence)
  // ============================================================
  const classificationPrompt = `Classify this IT support issue into one category:
- Account Access
- Email
- Network
- Hardware
- Software
- Other

Issue: ${query}

Respond with ONLY the category name.`

  try {
    const response = await generateChatResponse({
      prompt: classificationPrompt,
      systemInstruction: 'You are a category classifier. Respond with only the category name.',
      temperature: 0.3,
    })

    const aiCategory = response.trim()

    if (Object.keys(CATEGORY_KEYWORDS).includes(aiCategory)) {
      return {
        category: aiCategory,
        confidence: 0.6,
        reason: 'AI-based classification',
      }
    }
  } catch (error) {
    console.error('AI classification failed:', error)
  }

  // ============================================================
  // Fallback: 'Other' category
  // ============================================================
  return {
    category: 'Other',
    confidence: 0.5,
    reason: 'Could not determine specific category',
  }
}
```

**Workload-Based Staff Assignment:**

```typescript
export async function suggestStaffAssignment(
  params: StaffAssignmentParams
): Promise<StaffSuggestion | null> {
  const { category, priority, description } = params
  const supabase = await createClient()

  // 1. Get all staff members
  const { data: staffList } = await supabase
    .from('users')
    .select('id, full_name, metadata')
    .eq('role', 'staff')
    .eq('deactivated_at', null)

  if (!staffList || staffList.length === 0) return null

  // 2. Filter by specialization
  const qualified = staffList.filter(staff => {
    const specialties = staff.metadata?.specialties || []
    return specialties.includes(category) || specialties.includes('General')
  })

  if (qualified.length === 0) return null

  // 3. Calculate workload for each
  const workloads = await Promise.all(
    qualified.map(async staff => {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', staff.id)
        .in('status', ['open', 'in_progress'])

      const hasSpecialty = staff.metadata?.specialties?.includes(category) || false

      return {
        staff,
        openTickets: count || 0,
        hasSpecialty,
      }
    })
  )

  // 4. Sort by priority strategy
  if (priority === 'high') {
    // High priority: prefer specialists, then by workload
    workloads.sort((a, b) => {
      if (a.hasSpecialty !== b.hasSpecialty) {
        return a.hasSpecialty ? -1 : 1
      }
      return a.openTickets - b.openTickets
    })
  } else {
    // Normal priority: balance workload first
    workloads.sort((a, b) => a.openTickets - b.openTickets)
  }

  const best = workloads[0]

  return {
    staffId: best.staff.id,
    staffName: best.staff.full_name || 'IT Staff',
    reason: best.hasSpecialty
      ? `Specialist in ${category} with ${best.openTickets} open tickets`
      : `Available staff with ${best.openTickets} open tickets`,
    confidence: best.hasSpecialty ? 0.85 : 0.65,
  }
}
```

### 5. Widget State Management

**React Context with localStorage Persistence:**

**File:** `src/components/chat/chat-widget-context.tsx`

```typescript
interface ChatWidgetState {
  isOpen: boolean
  isMinimized: boolean
  activeSessionId: string | null
  sessions: SessionSummary[]
  currentMessages: ChatMessage[]
}

const STORAGE_KEY = 'chatWidgetState'

export function ChatWidgetProvider({ children }: ChatWidgetProviderProps) {
  // Initialize from localStorage
  const [state, setState] = useState<ChatWidgetState>(() => {
    if (typeof window === 'undefined') {
      return {
        isOpen: false,
        isMinimized: false,
        activeSessionId: null,
        sessions: [],
        currentMessages: [],
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        isOpen: false, // Never persist open state
        isMinimized: parsed.isMinimized || false,
        activeSessionId: parsed.activeSessionId || null,
        sessions: [],
        currentMessages: [],
      }
    }

    return {
      isOpen: false,
      isMinimized: false,
      activeSessionId: null,
      sessions: [],
      currentMessages: [],
    }
  })

  // Persist to localStorage on change
  useEffect(() => {
    const toStore = {
      isMinimized: state.isMinimized,
      activeSessionId: state.activeSessionId,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  }, [state.isMinimized, state.activeSessionId])

  // Context methods
  const openWidget = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }))
  }, [])

  const closeWidget = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const minimizeWidget = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: true }))
  }, [])

  const maximizeWidget = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: false }))
  }, [])

  const setActiveSession = useCallback((sessionId: string) => {
    setState(prev => ({ ...prev, activeSessionId: sessionId }))
  }, [])

  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      currentMessages: [...prev.currentMessages, message],
    }))
  }, [])

  const value: ChatWidgetContextValue = {
    ...state,
    openWidget,
    closeWidget,
    toggleWidget: () => state.isOpen ? closeWidget() : openWidget(),
    minimizeWidget,
    maximizeWidget,
    setActiveSession,
    setSessions: (sessions) => setState(prev => ({ ...prev, sessions })),
    setCurrentMessages: (messages) => setState(prev => ({ ...prev, currentMessages: messages })),
    addMessage,
  }

  return (
    <ChatWidgetContext.Provider value={value}>
      {children}
    </ChatWidgetContext.Provider>
  )
}
```

---

## API Documentation

### Streaming Chat API

**Endpoint:** `POST /api/v1/ai/chat`

**Authentication:** Required (session cookie)

**Request Body:**
```typescript
{
  message: string                    // User's message
  sessionId: string                  // Chat session ID
  conversationHistory: Array<{       // Previous messages
    role: 'user' | 'assistant'
    content: string
  }>
}
```

**Response:** Server-Sent Events (text/event-stream)

**Event Types:**

1. **Context Event:**
```json
{
  "type": "context",
  "contextArticles": [
    {
      "id": "uuid",
      "title": "Password Reset Guide",
      "content": "...",
      "category": "Account Access",
      "similarity": 0.89
    }
  ],
  "confidence": 0.85
}
```

2. **Content Event (streamed):**
```json
{
  "type": "content",
  "text": "chunk of response text"
}
```

3. **Done Event:**
```json
{
  "type": "done",
  "interactionId": "uuid",
  "citations": ["article-id-1", "article-id-2"],
  "shouldEscalate": false,
  "responseTime": 1234
}
```

4. **Error Event:**
```json
{
  "type": "error",
  "error": "Error message"
}
```

### Server Actions

#### 1. Create Chat Session

**Function:** `createChatSession()`

**File:** `src/app/actions/chat.ts`

```typescript
export async function createChatSession(): Promise<
  ActionResponse<{ sessionId: string }>
>
```

**Returns:**
```typescript
{
  success: true,
  data: {
    sessionId: "uuid"
  }
}
```

#### 2. Get User Chat Sessions

**Function:** `getUserChatSessions(params)`

```typescript
export async function getUserChatSessions(params: {
  limit?: number
}): Promise<ActionResponse<SessionSummary[]>>
```

**Returns:**
```typescript
{
  success: true,
  data: [
    {
      session_id: "uuid",
      title: "Password reset help" | null,
      last_message: "Thanks for your help!",
      last_message_at: "2025-01-15T10:30:00Z",
      message_count: 5,
      escalated: false
    }
  ]
}
```

#### 3. Get Session with Messages

**Function:** `getChatSessionWithMessages(sessionId)`

```typescript
export async function getChatSessionWithMessages(
  sessionId: string
): Promise<ActionResponse<ChatSessionWithMessages | null>>
```

**Returns:**
```typescript
{
  success: true,
  data: {
    session: {
      session_id: "uuid",
      title: "Email issues",
      created_at: "2025-01-15T10:00:00Z",
      escalated: false
    },
    interactions: [
      {
        id: "uuid",
        query: "My email isn't working",
        response: "Let me help you...",
        context_articles: ["article-id"],
        was_helpful: true,
        created_at: "2025-01-15T10:01:00Z"
      }
    ]
  }
}
```

#### 4. Prepare Ticket from Chat

**Function:** `prepareTicketFromChat(params)`

```typescript
export async function prepareTicketFromChat(params: {
  sessionId: string
  interactionId: string
}): Promise<ActionResponse<TicketPreparation>>
```

**Returns:**
```typescript
{
  success: true,
  data: {
    suggestedTitle: "Cannot access student email account",
    suggestedCategory: "Email",
    categoryConfidence: 0.9,
    categoryReason: "Based on 3 related KB articles",
    suggestedPriority: "medium",
    suggestedDescription: "**Conversation Summary:**\n\nUser: My email isn't working\nAssistant: ...",
    suggestedStaff: {
      staffId: "uuid",
      staffName: "John Doe",
      reason: "Specialist in Email with 2 open tickets",
      confidence: 0.85
    }
  }
}
```

#### 5. Create Ticket from Chat

**Function:** `createTicketFromChat(params)`

```typescript
export async function createTicketFromChat(params: {
  sessionId: string
  interactionId: string
  title: string
  description: string
  category: string
  priority: string
  assignedTo?: string
  userAdditions?: string
}): Promise<ActionResponse<{ ticketId: string }>>
```

**Returns:**
```typescript
{
  success: true,
  data: {
    ticketId: "uuid"
  }
}
```

#### 6. Submit Feedback

**Function:** `submitFeedback(params)`

```typescript
export async function submitFeedback(params: {
  interactionId: string
  wasHelpful: boolean
  feedbackText?: string
}): Promise<ActionResponse<void>>
```

---

## Database Schema

### ai_chat_sessions

Tracks chat sessions for conversation history.

```sql
CREATE TABLE ai_chat_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,                    -- Optional session title
  escalated BOOLEAN DEFAULT FALSE,
  escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_created_at ON ai_chat_sessions(created_at DESC);
```

### ai_interactions

Records individual query-response pairs.

```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(session_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  context_articles UUID[],       -- IDs of KB articles used
  model TEXT NOT NULL,           -- e.g., 'gemini-2.0-flash-exp'
  was_helpful BOOLEAN,           -- Feedback: thumbs up/down
  feedback_text TEXT,            -- Optional text feedback
  ticket_id UUID REFERENCES tickets(id),  -- If escalated to ticket
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at DESC);
CREATE INDEX idx_ai_interactions_ticket_id ON ai_interactions(ticket_id);
```

### knowledge_articles (relevant columns)

```sql
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  embedding VECTOR(768),         -- pgvector for semantic search
  status TEXT NOT NULL DEFAULT 'published',
  -- ... other columns
);

CREATE INDEX idx_knowledge_articles_embedding
  ON knowledge_articles
  USING hnsw (embedding vector_cosine_ops);
```

### match_kb_articles Function

```sql
CREATE OR REPLACE FUNCTION match_kb_articles(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  summary TEXT,
  category TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ka.id,
    ka.title,
    ka.content,
    ka.summary,
    ka.category,
    ka.tags,
    1 - (ka.embedding <=> query_embedding) AS similarity
  FROM knowledge_articles ka
  WHERE ka.status = 'published'
    AND 1 - (ka.embedding <=> query_embedding) > match_threshold
  ORDER BY ka.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Configuration Guide

### Environment Variables

**Required Variables:**

```bash
# Gemini API (SERVER-ONLY)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (CLIENT + SERVER)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Service Role (SERVER-ONLY, bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration (CLIENT)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Security Notes:**
- NEVER commit `.env.local` to git
- Use `serverEnv` for server-only secrets (in `src/lib/env/server`)
- Use `clientEnv` for public variables (in `src/lib/env/client`)
- Run `npm run check-bundle-security` before deployment

### Gemini API Setup

1. **Get API Key:**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create new API key
   - Copy and add to `.env.local`

2. **Configure Models:**

   **File:** `src/lib/ai/client.ts`

   ```typescript
   const EMBEDDING_MODEL = 'text-embedding-004'  // 768 dimensions
   const CHAT_MODEL = 'gemini-2.0-flash-exp'    // Fast streaming
   ```

3. **Rate Limits:**
   - Free tier: 15 requests/minute, 1 million tokens/day
   - Paid tier: Higher limits based on plan
   - Retry logic handles rate limit errors

4. **Best Practices:**
   - Always use server-side proxying (never expose key to client)
   - Implement exponential backoff for retries
   - Monitor token usage in Google Cloud Console
   - Use temperature 0.7 for balanced creativity/accuracy

### Supabase Configuration

1. **Database Setup:**
   ```bash
   # Run all migrations
   npm run supabase:migration:up

   # Verify tables
   npm run check-db
   ```

2. **Enable pgvector Extension:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Generate TypeScript Types:**
   ```bash
   npm run supabase:types
   ```

4. **RLS Policies:**
   - Ensure `ai_chat_sessions` has user-scoped policies
   - Ensure `ai_interactions` has user-scoped policies
   - Review `supabase/migrations/20250114000004_create_rls_policies.sql`

### System Prompts Configuration

**File:** `src/lib/chat/prompts.ts`

```typescript
export const CHAT_SYSTEM_INSTRUCTION = `You are Timi, the AI IT support assistant for La Verdad Christian College.

**Your Role:**
- Provide helpful, accurate IT support using the Knowledge Base context
- Be friendly, professional, and concise
- Always cite your sources when referencing KB articles
- Suggest creating a support ticket if you cannot help

**Guidelines:**
- Use the provided KB context to answer questions
- If context is insufficient, admit it and suggest escalation
- Format responses clearly with markdown
- Include troubleshooting steps when relevant
- Ask clarifying questions if needed

**Response Format:**
- Start with a brief answer
- Provide step-by-step instructions if needed
- Cite KB articles: "According to the [Article Title]..."
- End with "Was this helpful?" sentiment

**Scope:**
You can ONLY help with IT-related topics for La Verdad Christian College:
- Password resets
- Email issues
- Network connectivity
- Software installation
- Hardware problems
- Account access
- System errors

For non-IT topics, politely redirect to appropriate resources.`

export const SCOPE_CHECK_KEYWORDS = [
  // Positive (in-scope)
  'password', 'email', 'login', 'access', 'network', 'wifi',
  'computer', 'laptop', 'printer', 'software', 'install',

  // Negative (out-of-scope)
  'weather', 'news', 'recipe', 'homework', 'grade',
]
```

**Customization:**
- Edit `CHAT_SYSTEM_INSTRUCTION` to change Timi's personality
- Adjust `SCOPE_CHECK_KEYWORDS` to refine scope detection
- Modify temperature in `src/lib/ai/client.ts` for response style

---

## Deployment Guide

### Pre-Deployment Checklist

```bash
# 1. Run linter
npm run lint

# 2. Check build health
npm run health

# 3. Verify database connection
npm run check-db

# 4. Test build
npm run build

# 5. Scan for security issues
npm run check-bundle-security

# 6. Run E2E tests (when implemented)
npm run test:e2e
```

### Vercel Deployment

**1. Connect Repository:**
- Go to Vercel dashboard
- Import git repository
- Select Next.js framework preset

**2. Configure Environment Variables:**
```bash
# Production environment variables
GEMINI_API_KEY=<production_key>
NEXT_PUBLIC_SUPABASE_URL=<production_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_key>
SUPABASE_SERVICE_ROLE_KEY=<production_key>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
SENTRY_DSN=<sentry_dsn>
```

**3. Build Settings:**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node Version: 18.x or higher

**4. Deploy:**
- Push to `main` branch for production
- Push to `development` branch for preview

### Database Migration

**Production Migration:**
```bash
# 1. Backup production database
supabase db dump -f backup.sql

# 2. Run migrations
supabase db push

# 3. Verify
supabase db diff
```

**Rollback Plan:**
- Keep previous migration backups
- Test rollback scripts in staging
- Document each migration's reversibility

### Monitoring Setup

**1. Sentry Configuration:**

**File:** `src/instrumentation.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || 'production',
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.BrowserTracing(),
    ],
  })
}
```

**2. Vercel Analytics:**
- Enable in Vercel dashboard
- Monitor page views, performance
- Track Core Web Vitals

**3. Supabase Logs:**
- Monitor query performance
- Track RLS policy hits
- Review API usage

### Post-Deployment Verification

```bash
# 1. Health check
curl https://your-domain.com/api/health

# 2. Test chat endpoint
curl -X POST https://your-domain.com/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "sessionId": "..."}'

# 3. Verify environment variables
# Check Vercel dashboard > Settings > Environment Variables

# 4. Test authentication flow
# Sign in via Google OAuth

# 5. Test widget
# Open any page, verify widget loads
```

---

## Maintenance Guide

### Monitoring AI Quality

**1. Track Feedback Metrics:**

```sql
-- Overall helpfulness rate
SELECT
  COUNT(*) FILTER (WHERE was_helpful = TRUE) AS helpful,
  COUNT(*) FILTER (WHERE was_helpful = FALSE) AS not_helpful,
  COUNT(*) FILTER (WHERE was_helpful = TRUE)::FLOAT /
    NULLIF(COUNT(*) FILTER (WHERE was_helpful IS NOT NULL), 0) AS helpfulness_rate
FROM ai_interactions
WHERE created_at > NOW() - INTERVAL '7 days';

-- Feedback by category
SELECT
  ka.category,
  COUNT(*) FILTER (WHERE ai.was_helpful = TRUE) AS helpful,
  COUNT(*) FILTER (WHERE ai.was_helpful = FALSE) AS not_helpful
FROM ai_interactions ai
JOIN knowledge_articles ka ON ka.id = ANY(ai.context_articles)
WHERE ai.created_at > NOW() - INTERVAL '7 days'
GROUP BY ka.category
ORDER BY helpful + not_helpful DESC;

-- Common negative feedback
SELECT
  feedback_text,
  COUNT(*) AS frequency
FROM ai_interactions
WHERE was_helpful = FALSE
  AND feedback_text IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY feedback_text
ORDER BY frequency DESC
LIMIT 10;
```

**2. Monitor Escalation Rate:**

```sql
-- Escalation rate over time
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS total_sessions,
  COUNT(*) FILTER (WHERE escalated = TRUE) AS escalated,
  COUNT(*) FILTER (WHERE escalated = TRUE)::FLOAT /
    COUNT(*) AS escalation_rate
FROM ai_chat_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**3. Response Time Monitoring:**

```typescript
// Add to your monitoring dashboard
const avgResponseTime = await supabase
  .from('ai_interactions')
  .select('created_at')
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

// Calculate from API logs
```

### Updating System Prompts

**When to Update:**
- Negative feedback patterns emerge
- New KB categories added
- Policy changes
- Tone/personality adjustments

**Process:**

1. **Draft New Prompt:**
   ```typescript
   // src/lib/chat/prompts.ts
   export const CHAT_SYSTEM_INSTRUCTION_V2 = `...`
   ```

2. **A/B Test (if possible):**
   ```typescript
   const useV2 = Math.random() < 0.5
   const instruction = useV2 ?
     CHAT_SYSTEM_INSTRUCTION_V2 :
     CHAT_SYSTEM_INSTRUCTION
   ```

3. **Monitor Metrics:**
   - Compare helpfulness rates
   - Compare escalation rates
   - Review sample responses

4. **Deploy:**
   ```typescript
   export const CHAT_SYSTEM_INSTRUCTION = CHAT_SYSTEM_INSTRUCTION_V2
   ```

### Adding Knowledge Base Articles

**1. Create Article:**
- Use KB management interface
- Write clear, structured content
- Add relevant tags and category

**2. Generate Embedding:**
```typescript
// Automatic via database trigger
// Or manually:
import { generateEmbedding } from '@/lib/ai/client'

const embedding = await generateEmbedding(article.content, {
  taskType: 'RETRIEVAL_DOCUMENT',
})

await supabase
  .from('knowledge_articles')
  .update({ embedding })
  .eq('id', articleId)
```

**3. Verify Retrieval:**
```typescript
// Test semantic search
const { data } = await supabase.rpc('match_kb_articles', {
  query_embedding: testEmbedding,
  match_threshold: 0.7,
  match_count: 5,
})

// Should include your new article
```

### Database Maintenance

**1. Vacuum and Analyze:**
```sql
-- Run weekly
VACUUM ANALYZE ai_interactions;
VACUUM ANALYZE ai_chat_sessions;
VACUUM ANALYZE knowledge_articles;
```

**2. Archive Old Sessions:**
```sql
-- Archive sessions older than 6 months
INSERT INTO ai_chat_sessions_archive
SELECT * FROM ai_chat_sessions
WHERE created_at < NOW() - INTERVAL '6 months';

DELETE FROM ai_chat_sessions
WHERE created_at < NOW() - INTERVAL '6 months';
```

**3. Index Maintenance:**
```sql
-- Rebuild vector index if needed
REINDEX INDEX idx_knowledge_articles_embedding;
```

### Cost Monitoring

**Gemini API Usage:**
- Monitor in Google Cloud Console
- Set up billing alerts
- Review token usage patterns

**Supabase Usage:**
- Database size: Check dashboard
- Bandwidth: Monitor API calls
- Vector operations: Track RPC calls

**Optimization Tips:**
- Cache frequently accessed KB articles
- Limit conversation history length (last 10 messages)
- Implement rate limiting for abuse prevention
- Archive old sessions regularly

---

## Development Guide

### Local Setup

**1. Clone Repository:**
```bash
git clone <repository-url>
cd ticket-team
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Set Up Environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

**4. Run Database Migrations:**
```bash
npm run supabase:migration:up
npm run check-db
```

**5. Start Development Server:**
```bash
npm run dev:safe
```

### Development Workflow

**1. Create Feature Branch:**
```bash
git checkout -b feature/your-feature-name
```

**2. Make Changes:**
- Follow coding standards in `docs/06-development/coding-standards.md`
- Use TypeScript strict mode
- Add comments for complex logic

**3. Test Locally:**
```bash
# Build test
npm run build

# Lint
npm run lint

# Security scan
npm run check-bundle-security
```

**4. Commit:**
```bash
git add .
git commit -m "feat: add new feature"
```

**5. Push and Create PR:**
```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### Testing Strategy

**E2E Tests (Playwright):**

```bash
# Install browsers
npx playwright install

# Run all tests
npm run test:e2e

# Run specific test
npm run test:e2e tests/e2e/chat/chat-page.spec.ts

# Debug mode
npm run test:e2e -- --debug

# UI mode
npm run test:e2e -- --ui
```

**Test Structure:**
```typescript
// tests/e2e/chat/example.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat')
  })

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('input[name="message"]', 'test')

    // Act
    await page.click('button[type="submit"]')

    // Assert
    await expect(page.getByText('response')).toBeVisible()
  })
})
```

### Debugging Tips

**1. Server-Side Debugging:**
```typescript
// Add console.logs in server actions
export async function myAction() {
  console.log('[myAction] Starting...', { params })
  // ...
  console.log('[myAction] Result:', result)
}

// Check Vercel logs or terminal
```

**2. Client-Side Debugging:**
```typescript
// Use React DevTools
// Add breakpoints in browser DevTools
// Use console.table for arrays
console.table(messages)
```

**3. API Debugging:**
```bash
# Test streaming endpoint
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "sessionId": "uuid"}' \
  -N  # Don't buffer output
```

**4. Database Debugging:**
```sql
-- Check last interactions
SELECT * FROM ai_interactions
ORDER BY created_at DESC
LIMIT 10;

-- Check session status
SELECT * FROM ai_chat_sessions
WHERE user_id = 'uuid';
```

### Code Style Guidelines

**TypeScript:**
- Use explicit types (avoid `any`)
- Prefer interfaces for objects
- Use enums for constants
- Add JSDoc comments for public APIs

**React:**
- Prefer Server Components by default
- Use `'use client'` only when necessary
- Memoize expensive computations
- Extract reusable logic to hooks

**Naming Conventions:**
- Components: PascalCase (`ChatClient`)
- Functions: camelCase (`sendMessage`)
- Constants: UPPER_SNAKE_CASE (`CHAT_MODEL`)
- Files: kebab-case (`chat-client.tsx`)

---

## Troubleshooting

### Common Issues

#### Issue: "Streaming not working"

**Symptoms:**
- No response appears
- Loading forever
- Console errors about EventSource

**Diagnosis:**
```typescript
// Check API endpoint
const response = await fetch('/api/v1/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'test', sessionId: 'test' }),
})

console.log('Response status:', response.status)
console.log('Response headers:', response.headers)
```

**Solutions:**
1. **Check Gemini API Key:**
   ```bash
   # Verify in .env.local
   echo $GEMINI_API_KEY
   ```

2. **Check CORS headers:**
   ```typescript
   // src/app/api/v1/ai/chat/route.ts
   return new Response(stream, {
     headers: {
       'Content-Type': 'text/event-stream',
       'Cache-Control': 'no-cache',
       'Connection': 'keep-alive',
     },
   })
   ```

3. **Check for proxy issues:**
   - Disable Nginx buffering
   - Check Vercel streaming support

#### Issue: "No KB articles found"

**Symptoms:**
- AI says "I don't have information"
- Empty sources array
- Low confidence scores

**Diagnosis:**
```sql
-- Check embeddings exist
SELECT COUNT(*) FROM knowledge_articles
WHERE embedding IS NOT NULL;

-- Test similarity search
SELECT * FROM match_kb_articles(
  (SELECT embedding FROM knowledge_articles LIMIT 1),
  0.7,
  5
);
```

**Solutions:**
1. **Generate missing embeddings:**
   ```typescript
   // Run migration or manual script
   const articles = await supabase
     .from('knowledge_articles')
     .select('id, content')
     .is('embedding', null)

   for (const article of articles) {
     const embedding = await generateEmbedding(article.content)
     await supabase
       .from('knowledge_articles')
       .update({ embedding })
       .eq('id', article.id)
   }
   ```

2. **Lower similarity threshold:**
   ```typescript
   // src/lib/chat/rag-service.ts
   const { articles } = await retrieveContext({
     query,
     matchThreshold: 0.6,  // Lower from 0.7
     matchCount: 5,
   })
   ```

3. **Improve KB content:**
   - Add more articles
   - Improve article quality
   - Add synonyms and variations

#### Issue: "Widget not appearing"

**Symptoms:**
- Floating button missing
- Console errors
- Widget doesn't open

**Diagnosis:**
```typescript
// Check context provider
import { useChatWidget } from '@/components/chat/chat-widget-context'

function TestComponent() {
  const context = useChatWidget()
  console.log('Widget context:', context)
  return null
}
```

**Solutions:**
1. **Check provider wrapping:**
   ```typescript
   // src/app/providers.tsx
   export function Providers({ children }) {
     return (
       <ChatWidgetProvider>  {/* Must wrap entire app */}
         {children}
         <ChatWidgetInitializer />
       </ChatWidgetProvider>
     )
   }
   ```

2. **Check authentication:**
   ```typescript
   // Widget only shows for authenticated users
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return null
   ```

3. **Check z-index conflicts:**
   ```css
   /* Ensure widget has high z-index */
   .widget-button {
     z-index: 50;  /* Or higher */
   }
   ```

#### Issue: "Ticket escalation not working"

**Symptoms:**
- Modal doesn't open
- Ticket not created
- Missing AI suggestions

**Diagnosis:**
```typescript
// Check prepareTicketFromChat
const result = await prepareTicketFromChat({
  sessionId: 'test-session',
  interactionId: 'test-interaction',
})

console.log('Preparation result:', result)
```

**Solutions:**
1. **Check session/interaction exist:**
   ```sql
   SELECT * FROM ai_interactions
   WHERE session_id = 'uuid';
   ```

2. **Check category detection:**
   ```typescript
   // Add logging to detectCategory
   console.log('Category detection:', {
     articles: contextArticles.length,
     keywords: matchedKeywords,
     confidence,
   })
   ```

3. **Check staff availability:**
   ```sql
   SELECT * FROM users
   WHERE role = 'staff'
     AND deactivated_at IS NULL;
   ```

### Error Messages

**"Failed to generate embedding"**
- Check Gemini API key is valid
- Check API quota not exceeded
- Check internet connectivity
- Retry with exponential backoff

**"No active session"**
- Ensure session created before sending message
- Check session not expired
- Verify session belongs to user (RLS)

**"Unauthorized"**
- Check user authenticated
- Verify session cookie present
- Check RLS policies allow access

**"Rate limit exceeded"**
- Implement request throttling
- Upgrade Gemini API plan
- Cache frequently requested data

---

## Performance Optimization

### Database Queries

**1. Use Indexes:**
```sql
-- Existing indexes
CREATE INDEX idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX idx_knowledge_articles_embedding
  ON knowledge_articles
  USING hnsw (embedding vector_cosine_ops);
```

**2. Limit Results:**
```typescript
// Always paginate
const { data } = await supabase
  .from('ai_interactions')
  .select('*')
  .eq('session_id', sessionId)
  .order('created_at', { ascending: false })
  .limit(50)  // Don't fetch all
```

**3. Select Specific Columns:**
```typescript
// Don't SELECT *
const { data } = await supabase
  .from('knowledge_articles')
  .select('id, title, category')  // Only what you need
  .eq('status', 'published')
```

### React Performance

**1. Memoization:**
```typescript
// ChatClient.tsx
const memoizedMessages = useMemo(() => {
  return messages.filter(m => m.role !== 'system')
}, [messages])

const handleSend = useCallback(async (message: string) => {
  // ... expensive operation
}, [sessionId, userId])
```

**2. Code Splitting:**
```typescript
// Lazy load heavy components
const TicketReviewModal = dynamic(
  () => import('./ticket-review-modal'),
  { loading: () => <Skeleton /> }
)
```

**3. Virtualization:**
```typescript
// For long message lists
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 100,
})
```

### API Optimization

**1. Response Caching:**
```typescript
// Cache KB articles
const articleCache = new Map<string, KBArticle>()

async function getArticle(id: string) {
  if (articleCache.has(id)) {
    return articleCache.get(id)
  }

  const article = await fetchArticle(id)
  articleCache.set(id, article)
  return article
}
```

**2. Request Batching:**
```typescript
// Batch multiple requests
const results = await Promise.all([
  fetchSessions(),
  fetchInteractions(),
  fetchUserProfile(),
])
```

**3. Streaming Optimization:**
```typescript
// Send larger chunks
let buffer = ''
for await (const chunk of stream) {
  buffer += chunk.text

  // Send every 50 chars instead of every char
  if (buffer.length > 50) {
    controller.enqueue(encoder.encode(`data: ${buffer}\n\n`))
    buffer = ''
  }
}
```

---

## Security Considerations

### API Key Protection

**CRITICAL:** Never expose Gemini API key to client.

**✅ Correct:**
```typescript
// src/app/api/v1/ai/chat/route.ts (server-side)
import { serverEnv } from '@/lib/env/server'

export async function POST() {
  const apiKey = serverEnv.gemini.apiKey  // Server-only
  // ... use API key
}
```

**❌ Wrong:**
```typescript
// Client component - NEVER DO THIS
'use client'
const apiKey = process.env.GEMINI_API_KEY  // Exposed to browser!
```

### Input Validation

**Always validate user input:**
```typescript
import { z } from 'zod'

const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate
  const parsed = chatMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    )
  }

  // Safe to use
  const { message, sessionId } = parsed.data
}
```

### SQL Injection Prevention

**Use parameterized queries:**
```typescript
// ✅ Safe - uses parameterized query
const { data } = await supabase
  .from('ai_interactions')
  .select('*')
  .eq('session_id', userProvidedId)

// ❌ Dangerous - raw SQL with user input
const { data } = await supabase.rpc('raw_query', {
  query: `SELECT * FROM ai_interactions WHERE session_id = '${userProvidedId}'`
})
```

### Rate Limiting

**Implement rate limiting:**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Continue...
}
```

---

**Version:** 1.0
**Last Updated:** November 2025
**Maintained By:** IT Development Team
**For User Guide:** See [USER-GUIDE.md](./USER-GUIDE.md)
**For System Architecture:** See [docs/02-architecture/system-architecture.md](../02-architecture/system-architecture.md)
