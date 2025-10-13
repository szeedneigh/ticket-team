# ADR 0004: Adopt RAG Architecture

## Status
Accepted

## Context
We must ensure AI responses are grounded in institutional knowledge and avoid hallucinations.

## Decision
Adopt Retrieval-Augmented Generation (RAG): retrieve top-K KB articles via pgvector and use them as context in prompts to the LLM.

## Consequences
- Pros: Grounded answers; traceability; domain specificity.
- Cons: Requires embedding storage/refresh and retrieval quality tuning.

## Alternatives Considered
- Pure LLM: faster to start, higher hallucination risk.
- Fine-tuned model: cost/time to fine-tune and maintain.
