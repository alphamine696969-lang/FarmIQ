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

## ADR-008 — Chatbot pipeline runs on local fallbacks until providers are configured
- **Status:** Accepted
- **Date:** 2026-11-13
- **Context:** The chatbot pipeline spec (md files for work/FARMIQ_AI_CHATBOT_PIPELINE.md) requires pgvector retrieval, LLM classification/generation, embeddings, and translation. Supabase is not configured yet (FIQ-020) and no valid AI provider key is available in this environment.
- **Options considered:** Block the task until credentials exist; build only documentation; build the full pipeline with safe integration boundaries.
- **Decision:** Implement all seven pipeline layers now behind typed boundaries. Retrieval falls back to an in-memory knowledge index derived from existing approved datasets with a calibrated query-term-coverage threshold of 0.2 (the spec's 0.72 cosine threshold applies to the pgvector path). Classification and generation fall back to deterministic keyword/extractive behavior that is labeled in every response and limitation line (ADR-005). Translation uses DeepL only when `DEEPL_API_KEY` is present; otherwise non-English input proceeds with a disclosed limitation. Provider failures (invalid keys, timeouts) must degrade to fallbacks, never 500s.
- **Consequences:** The assistant works offline and in CI without secrets; answers are honest "partial" evidence with visible provider status. Activating pgvector/LLM paths requires FIQ-020 plus provider keys and re-running the test suite with those keys deliberately absent from test runs. `tsconfig.json` target raised to ES2017 for Unicode regex/Set usage in the pipeline.

## ADR-009 — Single TokenHarbor gateway for AI, Google Translate for translation
- **Status:** Accepted
- **Date:** 2026-11-13
- **Context:** Provider wiring for the chatbot pipeline needed a concrete AI backend. OpenAI/Anthropic direct APIs are not used by this project; the available credentials are a TokenHarbor OpenAI-compatible gateway (`https://tokenharbor.ai/v1`) serving free-tier models, and translation should use Google Translate rather than DeepL.
- **Options considered:** Keep OpenAI/Anthropic adapters and add a third provider; replace adapters with one gateway; per-feature providers.
- **Decision:** Replace the OpenAI/Anthropic paths with a single gateway adapter (`AI_BASE_URL` + `AI_API_KEY`, default `https://tokenharbor.ai/v1`). Models default to `mimo-v2.6-flash:free` for generation and `deepseek-v4.1-flash:free` for the occasional uncertain classification (overridable via `AI_GENERATION_MODEL` / `AI_INTENT_MODEL`). The intent classifier runs as a cascade: the deterministic keyword classifier answers clear queries without spending provider budget; the LLM classifier is only consulted at or below the confidence gate. Generation timeout is 120s (free-tier completions observed at ~100s under load) with a 15s fail-fast classification timeout; route `maxDuration` is 180s for Vercel. Embeddings are opt-in via `AI_EMBEDDING_MODEL` because no embedding model is provided by default. Translation uses Google Translate v2 REST behind `GOOGLE_TRANSLATE_API_KEY`.
- **Consequences:** One secret to rotate; provider failures (429 rate limits, hourly free quotas, slow queues) degrade to keyword classification and labeled extractive answers, never 500s. Free-tier quotas are small — expect fallback answers during busy periods until a paid tier or self-hosted model is configured. Keys live only in `.env.local`/deployment secrets, never in code or `.env.example`.

## ADR-010 — Weak-retrieval queries answered live from general farming knowledge
- **Status:** Accepted
- **Date:** 2026-11-13
- **Context:** The pipeline spec's "I don't know" gate blocked generation whenever retrieval found no knowledge-base chunks, so uncovered farming questions (and greetings) received a canned refusal even though a working LLM provider was configured. The assistant should answer farming questions in real time using the provider.
- **Options considered:** Keep the strict gate; expand the static index until it covers everything; allow the model to answer generally when the knowledge base is silent.
- **Decision:** When the provider is configured and retrieval returns no chunks, the model answers from general farming knowledge using a dedicated prompt template that forbids invented citations, requires an opening disclosure that the answer is not from the FarmIQ knowledge base, and keeps all safety rules (farming-only, no pesticide dosages, same language). Such answers carry `evidenceStatus: partial`, zero sources, and an explicit limitation line. The strict gate remains for the unconfigured/offline path, and grounded (chunk-backed) answers keep the original locked template.
- **Consequences:** The assistant never shows canned refusals for on-topic farming questions while the provider is healthy; trust is preserved through mandatory disclosure instead of abstention. Output guard, intent guard, injection guard, and ADR-006 refusal are unchanged. Offline/unconfigured behavior still abstains honestly.

## Decision template
### ADR-XXX — Title
- **Status:** Proposed / Accepted / Superseded
- **Date:**
- **Context:**
- **Options considered:**
- **Decision:**
- **Consequences:**
