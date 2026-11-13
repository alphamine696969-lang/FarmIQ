# FarmIQ — Technology Stack

## Preferred baseline
Confirm versions and compatibility against the repository before installing or upgrading dependencies.

| Layer | Preferred technology | Purpose |
|---|---|---|
| Framework | Next.js App Router | Routing, server rendering, route handlers |
| Language | TypeScript, strict mode | Typed application contracts |
| UI | React | Component-based interface |
| Styling | Tailwind CSS | Design tokens and responsive styling |
| Components | shadcn/ui where appropriate | Accessible reusable primitives |
| Icons | Lucide | Consistent iconography |
| Charts | Recharts or equivalent | Market and financial charts |
| Forms | React Hook Form + Zod | Validated forms |
| Database | PostgreSQL via Supabase | Persistent relational data |
| Auth | Supabase Auth | Account and session management |
| Storage | Supabase Storage | Private image/file storage |
| AI | Configurable model provider | Chat and vision workflows |
| Retrieval | PostgreSQL full-text search and/or pgvector | Search over approved documents |
| Testing | Vitest/Jest and Playwright as appropriate | Unit, integration, end-to-end tests |
| Deployment | Vercel-compatible hosting | Application deployment |

## Selection rules
- Prefer stable, maintained dependencies.
- Do not add a library for a trivial task that can be solved cleanly with existing tools.
- Avoid duplicate form, state, chart, or validation libraries.
- Pin or lock dependency versions through the package manager lockfile.
- Use server-side SDKs for provider calls requiring secrets.
- Do not assume an API is free or globally available; verify access, licensing, quotas, and geographic coverage.

## Environment configuration
Maintain `.env.example` with descriptions and no real secrets. Likely variables include:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `OPENAI_API_KEY` or selected AI provider equivalent
- `WEATHER_API_KEY`
- `MARKET_DATA_API_KEY`
- `MAPS_API_KEY`
- `EXCHANGE_RATE_API_KEY`

Use exact names required by the selected SDKs. Missing optional providers must not prevent unrelated features from running.

## Record deviations
Any major stack change must be recorded in `docs/DECISIONS.md` with context, alternatives, rationale, and consequences.
