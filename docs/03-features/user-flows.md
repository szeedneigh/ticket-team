# User Flows

> End-to-end user journeys for key tasks.

## Table of Contents
- [Actors](#actors)
- [Use Case UC-01: Employee Submits a Ticket](#use-case-uc-01-employee-submits-a-ticket)
- [Use Case UC-07: MIS Staff Manages Knowledge Base](#use-case-uc-07-mis-staff-manages-knowledge-base)
- [Use Case UC-08: Administrator Views Analytics Dashboard](#use-case-uc-08-administrator-views-analytics-dashboard)
- [Use Case UC-12: View All User Feedback (Restricted)](#use-case-uc-12-view-all-user-feedback-restricted)
- [References](#references)

## Actors
- **Employee (end-user)**
- **MIS Staff (support team)**
- **Administrator (system overseer)**
- **Super Administrator (high-privilege oversight)**

### Role Capabilities (Summary)
- Employee: create/view own tickets; add comments/attachments on visible own tickets; submit feedback; cannot view feedback; no deletes.
- MIS Staff: triage/resolve tickets; manage KB and categories; can soft-delete attachments; cannot view feedback.
- Administrator: all MIS Staff capabilities plus user management (create/update/deactivate non-super); cannot grant/manage `super_admin`; cannot view feedback.
- Super Administrator: full access including feedback visibility/management and role governance.

## Use Case UC-01: Employee Submits a Ticket

| Element | Description |
|---|---|
| Use-Case Name | UC-01: Employee Submits a Ticket |
| Actor(s) | Employee |
| Preconditions | Employee is authenticated; has an issue requiring MIS support. |

### Main Flow (Success Scenario)
1. Employee interacts with the AI Chatbot and describes the issue in natural language.
2. System converts the question to a vector embedding and performs similarity search against the Knowledge Base (pgvector).
3. System assembles an augmented prompt (system rules + retrieved docs + question) and queries Gemini to generate a grounded answer.
4. If insufficient, the Employee chooses to "Escalate to a Ticket".
5. As the Employee refines the description, the AI Assistant suggests relevant articles for self-service.
6. Employee fills required fields (Title, Category, Urgency) and optionally attaches files.
7. Employee submits the form; the system validates input and creates a new Open ticket, displaying a confirmation with the ticket ID.

### Alternative Flows
- **A1: AI Chatbot Solves the Issue**
  - The Employee confirms resolution; no ticket is created.
- **A2: AI Assistant Suggestion is Successful**
  - Employee cancels ticket submission after finding a solution.

### Exception Flows
- **E1: Invalid Form Input**
  - Submission blocked with clear error messages until required fields are complete.
- **E2: File Upload Failure**
  - On validation failure (size/type), system prompts correction before submission.

## Use Case UC-07: MIS Staff Manages Knowledge Base

| Element | Description |
|---|---|
| Use Case Name | UC-07: MIS Staff Manages Knowledge Base |
| Actor(s) | MIS Staff, Administrator |
| Preconditions | Actor logged in with appropriate privileges. |

### Main Flow (AI Assisted Creation)
1. Actor navigates to a ticket with status "Resolved".
2. Actor clicks "Generate Knowledge Base Article".
3. System sends ticket title, description, and verified resolution to Gemini via secure server-side function.
4. AI generates a structured draft (title, problem summary, step-by-step solution).
5. System opens "New Article" with prefilled draft.
6. Actor reviews and edits for accuracy and clarity.
7. Actor assigns a relevant category.
8. Actor saves and publishes the article.
9. System generates and stores vector embedding for the article; becomes searchable immediately.

### Alternative Flows
- **A1: Manual Article Creation**
- **A2: Editing an Existing Article**

### Exception Flows
- **E1: Missing Required Fields**

## Use Case UC-08: Administrator Views Analytics Dashboard

| Element | Description |
|---|---|
| Use Case Name | UC-08: Administrator Views Analytics Dashboard |
| Actor(s) | Administrator, Super Administrator |
| Preconditions | Admin logged in; historical ticket data exists. |

### Main Flow (Success Scenario)
1. Admin opens Analytics.
2. System queries and aggregates ticket and feedback data.
3. Dashboard renders KPIs (Ticket Volume & Trends, Average First Response Time, Average Resolution Time, User Satisfaction, Ticket Distribution, Knowledge Base ROI).
4. Admin applies filters (date range, department, category).
5. Widgets refresh to reflect filters for granular analysis.
6. Admin uses insights for planning (training needs, infra upgrades, proactive actions).

### Exception Flow
- **E1: No Data Available**
  - Widgets display "No data available for this period" instead of errors.

## Use Case UC-12: View All User Feedback (Restricted)

| Element | Description |
|---|---|
| Use Case Name | UC-12: View All User Feedback |
| Actor(s) | Super Administrator |
| Preconditions | Actor logged in with Super Administrator privileges. |

### Main Flow
1. Super Admin opens the secure "User Feedback" section.
2. System displays ratings and comments for resolved tickets.
3. Data can be filtered by date range, category, or assigned staff.
4. Super Admin conducts objective performance reviews and institutional satisfaction assessment.

## References
- See also: [Feature List](./feature-list.md)
- See also: [System Architecture](../02-architecture/system-architecture.md)
- See also: [Ticket Lifecycle](../02-architecture/ticket-lifecycle.md)
- See also: [Endpoints (Feedback Access)](../04-api/endpoints.md#feedback-access)
