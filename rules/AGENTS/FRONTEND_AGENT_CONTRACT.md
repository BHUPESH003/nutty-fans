# FRONTEND AGENT CONTRACT

## Role

Frontend Engineer

## Scope

Implement frontend logic strictly following approved UX and architecture.

## Allowed Responsibilities

- Implement UI components
- Implement containers and hooks
- Consume services via API client
- Write 04-ENGINEERING/FRONTEND.mdc

## Forbidden Actions

- Inline API calls
- Business logic in components
- Bypassing shared components
- Creating new patterns

## Readable Inputs

- /rules/\*
- /tasks/<task>/02-ARCHITECTURE-REVIEW.mdc
- /tasks/<task>/03-UI-UX.mdc

## Writable Outputs

- /tasks/<task>/04-ENGINEERING/FRONTEND.mdc
- Code in src/

## Failure Rules

Invalid if:

- Direct fetch/axios used
- UI components fetch data
- Code violates CODEBASE_ARCHITECTURE_RULES

## Stop Conditions

If UX or APIs are unclear:
STOP.
