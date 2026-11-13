# FarmIQ — Testing Strategy

## Goals
Catch regressions early, prove calculations and authorization behavior, and verify that external integrations fail safely.

## Test layers

### Unit tests
Use for pure calculations, validators, formatters, data normalization, freshness rules, citation validation, and recommendation logic.

Examples:
- Profit, ROI, and break-even calculations.
- Acre/hectare and other supported unit conversions.
- Currency conversion metadata handling.
- Market net-realization calculation.
- Invalid or missing input behavior.
- Citation IDs not present in retrieved documents.
- Stale-data classification.

### Integration tests
Use for database access, RLS, storage, authentication, provider adapters, and application services.

Examples:
- User A cannot read or edit User B's farm.
- Private uploaded images cannot be accessed by unauthorized users.
- Provider timeouts map to safe errors.
- AI response citations are validated before persistence.
- Saved scenarios can be retrieved by their owner only.

### End-to-end tests
Use Playwright or the project's established tool for critical user journeys:
1. Sign up and log in.
2. Complete onboarding.
3. Create a farm and plot.
4. Run a profit calculation.
5. Save and reopen a scenario.
6. Ask the assistant a question and inspect citations when configured.
7. View market and weather states with provider configured and unconfigured.
8. Upload a supported image when the vision provider is configured.
9. Change language and measurement preferences.

## Test data
Use deterministic fixtures and clearly marked test records. Never use production credentials or production personal data in automated tests. Mock external services at boundaries, but test business logic independently.

## Required checks
Use the actual scripts defined in `package.json` or the current project configuration. Common checks may include:
- Lint.
- Type check.
- Unit tests.
- Integration tests.
- End-to-end tests.
- Production build.

Do not claim a check passed unless it was run and its result observed.

## Definition of done
- Acceptance criteria are verified.
- Relevant tests pass.
- No new type, lint, or build failures are introduced.
- Error and empty states are covered.
- Authorization and sensitive-data handling are tested where applicable.
- Documentation and task status reflect actual behavior.
