# FarmIQ — Roadmap

## Workflow 0 — Foundation
**Outcome:** Documented architecture and a reliable agent workflow.
- Inspect existing repository.
- Create and reconcile project documentation.
- Confirm stack, architecture, coding standards, and task dependencies.
- Establish environment and testing instructions.

**Exit criteria:** Documentation is coherent, linked, and actionable.

## Workflow 1 — Design system and public website
**Outcome:** Premium responsive public site and reusable UI components.
- Tokens, typography, shared components.
- Landing page and public content routes.
- Responsive navigation and accessible forms.
- Honest product preview states.

**Exit criteria:** Public routes work and production build passes.

## Workflow 2 — Backend and identity
**Outcome:** Persistent user accounts and secure data foundation.
- Supabase configuration and migrations.
- Authentication and session handling.
- RLS and ownership enforcement.
- Onboarding and preferences.

**Exit criteria:** Authenticated users can securely persist profile data.

## Workflow 3 — Farm management and dashboard
**Outcome:** Useful authenticated workspace.
- Farms, plots, crop cycles, notes.
- Dashboard empty states and saved activity.
- Multiple farms and location preferences.

**Exit criteria:** User-owned farm data persists and is isolated.

## Workflow 4 — Profit calculator
**Outcome:** First useful feature with no external data dependency.
- Deterministic calculations.
- Unit and currency handling.
- Scenario save, compare, export.
- Calculation tests.

**Exit criteria:** Formulas and persistence are tested.

## Workflow 5 — AI assistant
**Outcome:** Evidence-grounded agricultural chat.
- Approved-source ingestion.
- Retrieval and citations.
- Response schema validation.
- Conversation history and supported language workflows.

**Exit criteria:** Configured provider can answer using retrieved documents; missing evidence is handled honestly.

## Workflow 6 — Markets and weather
**Outcome:** Live data where providers are available.
- Market adapter and observations.
- Price history and comparison.
- Weather adapter and forecasts.
- Freshness and unavailable states.

**Exit criteria:** Configured providers return real timestamped data and no fake data is shown as live.

## Workflow 7 — Crop advisor and disease scanner
**Outcome:** Advanced agricultural decision support.
- Suitability datasets and documented scoring.
- Secure image upload.
- Supported model inference.
- Treatment safety and abstention behavior.

**Exit criteria:** Outputs have provenance, uncertainty, and safe fallbacks.

## Workflow 8 — Quality and deployment
**Outcome:** Release candidate.
- Security review.
- Unit, integration, and end-to-end tests.
- Accessibility and responsive checks.
- Production environment and provider setup.
- Final documentation and known-limitations report.

**Exit criteria:** Critical journeys pass and outstanding integrations are explicitly documented.

## Prioritization principle
Deliver a complete, useful vertical slice at each stage. Do not wait for every global data provider before finishing the rest of the product. Do not claim a feature is live until it is configured and verified.
