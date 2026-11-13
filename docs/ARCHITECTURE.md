# FarmIQ — Architecture

## Architecture principles
- Modular monolith first; split services only when justified by operational needs.
- Typed contracts between UI, business logic, database, and providers.
- Server-side secrets and authorization.
- Provider-independent adapters.
- Evidence provenance and data freshness as first-class fields.
- Testable business logic separated from React components.

## High-level system

```text
Browser / Mobile Web
        |
        v
Next.js App Router
  | Pages / UI components
  | Server actions / Route handlers
  v
Application services
  |-- Authentication & authorization
  |-- Farm and plot management
  |-- Profit calculations
  |-- Market intelligence
  |-- Weather intelligence
  |-- Crop recommendations
  |-- Disease assessment
  |-- AI retrieval and citation validation
  v
Data access layer
  |-- Supabase PostgreSQL
  |-- Supabase Storage
  |-- Vector search (e.g. pgvector if selected)
  v
External adapters
  |-- AI model provider
  |-- Weather provider
  |-- Market data providers
  |-- Official agricultural sources
  |-- Maps / geocoding / exchange rates
```

## Main modules
- **Identity:** authentication, profiles, roles, preferences.
- **Farm management:** farms, plots, crop cycles, notes.
- **Assistant:** retrieval, prompt assembly, model calls, response validation, citations.
- **Markets:** observations, unit normalization, currency conversion, comparison.
- **Economics:** deterministic calculation functions and saved scenarios.
- **Crop advisor:** data ingestion, suitability logic, uncertainty and evidence.
- **Disease scanner:** upload validation, vision inference, evidence retrieval, safety gates.
- **Weather:** provider adapter, cache, forecasts, alert rules.
- **Admin:** source configuration, ingestion jobs, provider health, audit trail.

## Data flows

### AI assistant
1. Validate authenticated request and input size.
2. Resolve language and relevant user context.
3. Retrieve authorized, relevant documents from the indexed knowledge base.
4. Send evidence and structured instructions to the model.
5. Validate response schema and citation identifiers.
6. Persist conversation and citations according to retention settings.
7. Return response with source links and evidence limitations.

### Market prices
1. Validate crop, location, units, and requested time window.
2. Query the relevant configured provider adapter.
3. Validate provider payload and normalize units/currency when possible.
4. Persist observations with provider and timestamps.
5. Return values with freshness and provenance.
6. Build charts only from available observations.

### Weather
1. Resolve a user-selected farm location.
2. Query the configured provider.
3. Normalize units and time zone.
4. Cache according to provider terms and freshness needs.
5. Evaluate documented crop/alert rules where data is adequate.
6. Display forecast resolution and timestamp.

### Disease assessment
1. Validate and privately store image.
2. Confirm a vision provider/model supports the use case.
3. Produce candidate labels or symptoms.
4. Retrieve applicable official references.
5. Apply safety and uncertainty checks.
6. Persist assessment with model and source metadata.
7. Never produce unverified chemical dosage instructions.

## Suggested directory layout
See `FOLDER_STRUCTURE.md`. Adjust to existing repository conventions and record deviations.

## Reliability
- Set timeouts for external requests.
- Use bounded retries only for retry-safe operations.
- Apply rate limits to expensive endpoints.
- Use caching only where permitted and safe.
- Do not cache private responses across users.
- Record safe operational metadata without logging secrets or unnecessary personal information.

## Deployment
Deploy the Next.js application to a compatible host and use managed PostgreSQL/auth/storage through Supabase or a documented equivalent. Configure separate development, staging, and production environments.
