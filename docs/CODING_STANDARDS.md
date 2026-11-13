# FarmIQ — Coding Standards

## General
- Use TypeScript strict mode.
- Prefer small, single-purpose modules and functions.
- Use descriptive names; avoid unexplained abbreviations.
- Keep UI components focused on presentation and interaction.
- Put business rules in reusable, testable service or calculation functions.
- Avoid `any`; use `unknown` and validate external data.
- Avoid duplicate logic and hidden global state.
- Do not silence TypeScript errors without a documented reason.

## React and UI
- Use functional components and hooks consistently.
- Keep components accessible: labels, keyboard support, focus states, semantic elements.
- Include loading, success, empty, and error states for async flows.
- Use stable keys for lists.
- Avoid unnecessary client components when server rendering is appropriate.
- Never put secret-bearing provider calls in client components.

## Validation
- Validate all untrusted inputs at the server boundary.
- Use Zod or the project's established validation library.
- Treat provider responses and model output as untrusted input.
- Validate file type, file size, and expected content before processing uploads.

## Errors
- Return consistent, safe error structures.
- Do not expose stack traces, credentials, SQL details, or internal prompts to users.
- Log useful diagnostic context without secrets or unnecessary personal information.
- Distinguish validation errors, authorization errors, rate limits, provider failures, and internal failures.

## Data and calculations
- Keep calculations deterministic and independent of React.
- Use decimal-safe representations for monetary values.
- Normalize units before comparing quantities.
- Preserve source, observation, retrieval, and update timestamps.
- Never label sample data as live.
- Do not silently replace missing data with invented defaults.

## Naming
- Components: PascalCase.
- Functions and variables: camelCase.
- Constants: UPPER_SNAKE_CASE where appropriate.
- Database tables and columns: consistent snake_case.
- Tests: name files after the behavior or module under test.

## Comments and documentation
Comment on why a non-obvious decision exists, not merely what a line does. Update docs when contracts, environment variables, architecture, or user-facing behavior change.

## Pull-request/task hygiene
Each workflow should have a narrow scope, acceptance criteria, tests, and a concise summary of files changed. Avoid unrelated formatting or refactors.
