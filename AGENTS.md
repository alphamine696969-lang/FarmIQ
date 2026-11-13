# FarmIQ — Agent Instructions

## Purpose
FarmIQ is a global smart-farming platform that helps farmers make evidence-informed decisions about crop selection, disease risks, market prices, weather, and farm profitability.

## Canonical instructions
Read this file first, then read the relevant project documents before changing code:
- `docs/PROJECT_OVERVIEW.md`
- `docs/ARCHITECTURE.md`
- `docs/TECH_STACK.md`
- `docs/FOLDER_STRUCTURE.md`
- `docs/CODING_STANDARDS.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`
- `TASKS.md`
- `docs/DECISIONS.md`

`CLAUDE.md` and `.cursorrules` are short pointers back to this file. Keep this document as the canonical source of project-wide agent rules.

## Product principles
1. Trust over confidence: never invent market prices, weather measurements, crop yields, disease diagnoses, official guidance, or citations.
2. Clearly distinguish live, cached, stale, sample, and unavailable data.
3. A source citation must point to a real source retrieved or stored by the application.
4. No pesticide dosage or treatment-specific chemical instruction unless verified against an applicable official label or authorized local guidance.
5. Build complete vertical slices, not disconnected mockups.
6. Preserve working code. Inspect before editing; avoid broad rewrites.
7. Prefer small, reviewable changes with tests.
8. Internationalize from the beginning; do not hardcode one country's assumptions into shared business logic.
9. Keep secrets on the server.
10. Be honest about incomplete integrations and untested features.

## Required workflow for every task
1. Read this file and the relevant docs.
2. Inspect the existing implementation and repository status.
3. Check task dependencies in `TASKS.md`.
4. State a short plan and identify files likely to change.
5. Implement only the current task and its necessary dependencies.
6. Add or update tests.
7. Run relevant lint, type-check, test, and build commands available in the repo.
8. Fix regressions caused by the change.
9. Update `TASKS.md`, `CHANGELOG.md`, and `docs/DECISIONS.md` when applicable.
10. Report what changed, checks run, failures, and any missing external configuration.

Do not automatically begin the next workflow unless explicitly asked.

## Preferred stack
Use the stack documented in `docs/TECH_STACK.md`. Inspect the current repository before changing technologies or dependency versions. Record any major deviation in `docs/DECISIONS.md`.

## Data and integration rules
- All third-party provider calls that use secrets must be server-side.
- Use provider adapters rather than coupling UI components to vendor APIs.
- Validate external responses before using them.
- Store provenance, timestamps, units, currency, and relevant geographic scope.
- Never present demo data as live.
- Do not scrape or ingest sources in violation of terms, licenses, robots policies, or rate limits.
- Do not fetch arbitrary user-provided URLs from the server; allowlist trusted ingestion sources to reduce SSRF risk.

## Definition of done
A task is complete only when its acceptance criteria are met, relevant tests pass, no known regression is introduced, and documentation reflects reality. If an external key or approval is missing, implement a safe integration boundary and clearly mark the integration as unconfigured rather than claiming it works.
