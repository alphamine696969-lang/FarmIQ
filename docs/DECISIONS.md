# FarmIQ — Architecture Decision Log

Record meaningful decisions here. Do not silently reverse an earlier decision; add a new entry explaining why.

## ADR-001 — Start as a modular monolith
- **Status:** Proposed
- **Context:** The product has multiple features but is early-stage. Distributed services add operational overhead before scale is proven.
- **Decision:** Keep the application in a modular Next.js codebase with clear service and provider boundaries.
- **Consequences:** Easier local development and deployment; modules must remain well separated.

## ADR-002 — Use PostgreSQL as the system of record
- **Status:** Proposed
- **Context:** FarmIQ needs relational ownership, historical observations, auditability, and structured records.
- **Decision:** Use PostgreSQL, preferably through Supabase if compatible with the existing project.
- **Consequences:** Migrations, indexes, constraints, and RLS policies are required.

## ADR-003 — Provider adapters for external data
- **Status:** Accepted
- **Context:** Weather, market, map, exchange-rate, AI, and agricultural providers vary by region and subscription.
- **Decision:** Hide provider-specific payloads behind typed adapters.
- **Consequences:** More upfront abstraction, but easier provider replacement and regional coverage management.

## ADR-004 — Data provenance is required
- **Status:** Accepted
- **Context:** Farmers need to assess the source and freshness of recommendations.
- **Decision:** Store and display source identifiers, timestamps, units, geography, and freshness status where relevant.
- **Consequences:** Data models and UI must carry provenance metadata.

## ADR-005 — Demo data must be visibly labeled
- **Status:** Accepted
- **Context:** Development often occurs before API credentials are available.
- **Decision:** Sample data may be used only in an explicit demo context and must be visibly labeled.
- **Consequences:** No sample values can silently appear as live market, weather, or AI results.

## ADR-006 — AI must abstain when evidence is inadequate
- **Status:** Accepted
- **Context:** Unsupported agricultural guidance can cause financial, crop, environmental, or safety harm.
- **Decision:** Validate citations and disclose insufficient evidence; treatment-specific chemical advice requires applicable official guidance.
- **Consequences:** Some questions will receive a limitation message instead of a confident answer.

## ADR-007 — Deploy to Vercel via Git integration
- **Status:** Accepted
- **Date:** 2026-11-13
- **Context:** The app is a Next.js App Router project already hosted on GitHub. CLI deploy requires interactive auth not available in this environment.
- **Options considered:** Vercel CLI token deploy; Git integration; self-hosted Node server.
- **Decision:** Connect the GitHub repository to Vercel for automatic Production (main) and Preview (branch) deployments. Configure secrets only in Vercel project settings.
- **Consequences:** Deploys are driven by git pushes; no `vercel.json` required; environment variables must be maintained in the Vercel dashboard rather than local `.env.local`.

## Decision template
### ADR-XXX — Title
- **Status:** Proposed / Accepted / Superseded
- **Date:**
- **Context:**
- **Options considered:**
- **Decision:**
- **Consequences:**
