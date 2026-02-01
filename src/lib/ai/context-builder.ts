/**
 * RAG Context String Builder
 *
 * Pure utility for formatting RAG sources into a context string.
 * No 'use server' - safe to use from any module.
 */

import type { RAGSource } from '@/lib/types/ai-events'

export function buildContextString(
  sources: RAGSource[],
  maxLength: number = 4000
): string {
  if (sources.length === 0) {
    return 'No relevant context found.'
  }

  let context = 'Relevant Information:\n\n'
  let currentLength = context.length

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i]
    const sourceText = `[${i + 1}] ${source.title || source.type}\n${source.content}\n\n`

    if (currentLength + sourceText.length > maxLength) {
      break
    }

    context += sourceText
    currentLength += sourceText.length
  }

  return context
}
