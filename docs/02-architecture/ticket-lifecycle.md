# Ticket Lifecycle

> State machine defining allowed ticket status transitions.

## Table of Contents
- [State Machine](#state-machine)
- [Transition Rules](#transition-rules)
- [References](#references)

## State Machine
```mermaid
stateDiagram-v2
  [*] --> Open
  Open --> In_Progress: assign / work starts
  In_Progress --> On_Hold: waiting on user/parts
  On_Hold --> In_Progress: info received / unblocked
  In_Progress --> Resolved: fix applied / solution verified
  Resolved --> Closed: confirmation / time-based auto-close
  Open --> Canceled: withdrawn / duplicate
  In_Progress --> Canceled: invalid / out of scope
  On_Hold --> Canceled: no response

  %% Optional: allow reopen
  Closed --> Open: reopened
  Resolved --> Open: regression
```

## Transition Rules
- Only staff/admin may move `Open` → `In Progress`, `On Hold`, or `Canceled`.
- Submitter can request reopen: `Closed` → `Open` with justification.
- `Resolved` requires a documented solution and, when feasible, a linked KB article.
- Auto-close after a configurable period in `Resolved` with no submitter response.

## References
- See also: [System Architecture](./system-architecture.md)
- See also: [Feature List](../03-features/feature-list.md)
