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

## ADR-011 — CropPath tracker: deterministic engine with optional AI enhancement
- **Status:** Accepted
- **Date:** 2026-11-14
- **Context:** The CropPath spec calls for AI-driven recommendations, roadmaps, and weekly report analysis, but the free-tier provider has hourly quotas and the platform's trust rules forbid invented prices, MSP rates, schemes, or pesticide dosages. Supabase persistence is still pending (FIQ-020), and no vision model or live weather provider is configured.
- **Options considered:** Fully AI-generated roadmaps and recommendations; fully static app with no AI; deterministic engines with optional provider enrichment.
- **Decision:** Core logic is deterministic and testable: recommendation scoring over the verified crop suitability profiles with goal weighting and month/region season detection; growth roadmaps from stage templates scaled to the crop's cycle; weekly feedback applies fixed schedule adjustments (+7/+4/0/−3 days) and pulls disease guidance only from the verified knowledge base with the ADR-006 no-dosage notice. Financial estimates are derived only from stored sample-historical market observations and are explicitly labeled (ADR-005); missing price data renders an honest "unavailable" state instead of a guess. The TokenHarbor provider is used only for optional, clearly-labeled text enhancements ("why this crop" reasons and weekly assessments) via `/api/crop-path/recommend` and `/api/crop-path/report`; any provider failure degrades to the deterministic output and is never a 500. Trackers persist in localStorage (same pattern as user state) with a visible notice that account sync is pending FIQ-020; live weather alerts and photo AI analysis are not shown as active until FIQ-092.
- **Consequences:** The feature works offline and under provider outages, passes deterministic tests, and never fabricates MSP/scheme numbers or dosages. Badge rules (First Harvest, Profit Champion >200% ROI, 3-cycle crop master, Diligent Farmer) are computed from receipts. A future Supabase migration will need to move tracker storage without changing the engine contracts.

## ADR-012 — CropPath realtime layer: Open-Meteo weather + opt-in AI photo analysis
- **Status:** Accepted
- **Date:** 2026-11-14
- **Context:** The CropPath spec requires weather-aware roadmap alerts and photo-based weekly analysis. No weather provider key exists (FIQ-062 adapter is sample-only), and the platform must not fabricate live data.
- **Options considered:** Ship with sample weather only; integrate a key-based provider (Tomorrow.io); use keyless Open-Meteo; skip photo analysis entirely.
- **Decision:** Live weather uses the keyless Open-Meteo forecast API with Photon (OSM) as geocoding fallback — three hardcoded allowlisted hosts (`api.open-meteo.com`, `geocoding-api.open-meteo.com`, `photon.komoot.io`), user text only ever sent as encoded query parameters (SSRF-safe). **Wrong-place protection is user selection, not guessing:** `POST /api/crop-path/geocode` returns type-ahead suggestions (both providers, Photon restricted to places/boundaries); the farmer picks the exact place, the tracker stores its coordinates, and weather fetches use those coordinates directly. The free-text fallback path (no pick) additionally requires every significant query token (≥3 chars, minus qualifier words) to appear in the geocoder answer and rejects non-place Photon results — so a garbage village name can never silently fetch another town's weather; it returns an honest "could not find" message pointing back to the suggestions. Deterministic agronomy rules (`lib/services/cropPath/weather.ts`) map the forecast to crop alerts (rain → skip-watering, frost, heat, blight-risk for solanaceous crops, dry spell with ET0) with a bounded 60s/10min in-memory cache (50 entries). Photo analysis uses the existing TokenHarbor gateway with `AI_VISION_MODEL` (default `mimo-v2.6-flash:free`, verified multimodal on this gateway); requests are raster-only (JPEG/PNG/WebP), ≤1.5 MB per image, 3 max, with a 6 MB body cap, plus one 2.5 s retry on transient `503 service_busy` gateway responses. Provider failure degrades to `fallback: true` and an honest UI note — never a 500. Harvest/recommendation inputs are clamped (negatives rejected, extreme weather values bounded); localStorage saves degrade by stripping oldest photos on quota exhaustion so tracker text always persists.
- **Consequences:** Weekly cards and recommendation scoring use real forecast data without any API key or cost. Weather outages degrade to labeled unavailable (60s recheck), not fabricated data. Photo analysis quality depends on the gateway's multimodal support — the UI labels it advisory-only. No mandi geocoding yet: marketplace options remain labeled sample data (future work).

## ADR-013 — CropPath v2 workflow: live-data boundary and honest deviations
- **Status:** Accepted
- **Date:** 2026-11-14
- **Context:** `md files for work/FARMIQ_CROPPATH_WORKFLOW_v2.md` demands all-live data across 10 phases (weather, prices, schemes, crop calendar, soil map, disease model, nearest markets, push notifications). The platform must integrate only sources that actually work keyless and stay within trust rules (no fabricated data, no scraping against terms, ADR-006, international scope).
- **Options considered:** Integrate every named source by scraping/manual downloads; ship only what has verified keyless APIs and mark the rest honestly unconfigured; block the feature until all sources exist.
- **Decision:** **Ship the vertical slice with every source verified live during implementation, and record honest boundaries for the rest.**
  - **Integrated live:** Open-Meteo 14-day forecast with UV (`/api/crop-path/context`, hemisphere/tropical season logic incl. Kharif/Rabi/Zaid and Wet/Dry), ISRIC SoilGrids soil texture (degrades to manual selector when the service returns null/unreachable), Photon/Open-Meteo geocoding suggestions (ADR-012), and **Eurostat `apri_ap_crpouta` official annual crop prices** (`/api/crop-path/prices`) — units parsed from Eurostat's own product labels, latest published period shown with source+period+URL; EU-only coverage returns `not_covered` with an explicit note (IN/US/etc. never get invented prices).
  - **Verified unreachable/not integrated (honest not-connected):** World Bank (connection refused from runtime), FAOSTAT API (requires auth), Agmarknet/FEWS NET (scraping/terms risk), FAO schemes & crop-calendar pages (no keyless API), Mapbox/Google nearest markets (API keys), PlantVillage classifier (no hosted model). These show honest "not connected / verify official portals" states (FIQ-093/095/096).
  - **Deliberate deviations from the spec:** fertilizer/irrigation tasks never carry kg/amounts (rates come from soil test — no invented guidance); vision output has no fake 0.75 confidence thresholds (structured observations + `uncertain` state instead); disease/nutrient findings are observational with ADR-006 extension-officer referral, never treatment protocols with doses; health score is an explicitly-labeled heuristic (rating + stage + issues), not a model metric; reminders are an in-app panel (report-due, schedule-shift, harvest-window) — browser push needs VAPID keys (FIQ-095); bigha is accepted as a label-only unit (no cross-unit conversion); 30-day roadmap weather uses Open-Meteo's 16-day maximum, honestly scoped.
  - Workflow mechanics added: 7 recommendation goals with honest clauses for govt-supported/organic (no scheme or certification database exists), sowing-date season mismatch warning, photos required for weekly reports with client-side quality advisory, vision stage-match taking precedence over farmer rating for schedule shifts (+7/+14/−3 days), receipt stats (weeks run, reports vs missed, average health, issues) with browser print-to-PDF, and harvest maturity photo confirmation with a one-week extend path.
- **Consequences:** The v2 phases that depend on unconnected sources are visibly pending rather than faked; switching any pending source on later only requires an adapter behind the existing routes. Eurostat prices are official but annual/last-published — labeled as such, never as a live market quote. Tests lock the season/texture/vision/health/stats/goal logic offline (5 suites).

## ADR-014 — AI performs the crop recommendation ranking over live context
- **Status:** Accepted
- **Date:** 2026-11-14
- **Context:** v2 Phase 2 requires the recommender to score crops using live weather/soil/season data. Previously the AI only rewrote the "why" line after a deterministic ranking; users asked for the recommender itself to be AI-integrated, not a mock.
- **Options considered:** Keep rule-only ranking with AI phrasing; give the model full freedom to invent crops and numbers; let the model rank and explain while all agronomic facts stay supplied by verified profiles.
- **Decision:** `POST /api/crop-path/recommend` now sends the live context (current temp, 14-day high/low/rain, soil texture, season, goal) plus each candidate's verified profile facts (cycle, resilience, temp/pH/rainfall ranges, rule score) and asks the model for a JSON ranking + per-crop fit reasons. `parseAiRanking` validates strictly: only known candidate names are accepted (echoed labels like "Wheat (Cereal / Grain)" are canonicalized, invented crops dropped, reasons capped at 400 chars, <2 valid entries rejected). The model can never introduce crops, prices, schemes, or dosages — those facts are only supplied by us. Any provider failure or invalid output falls back to the deterministic rule ordering with `fallback: true`; the UI badges the order as "AI-ranked live" vs rule-scored. Verified live: the model demoted wheat against a dry 8 mm Rajpura forecast for a resilient-goal farmer — reasoning over the actual weather, not the canned profile.
- **Consequences:** Ranking quality improves with real conditions while the knowledge boundary stays intact (model reasons, doesn't author, agronomic data). Free-tier quota can fall back at any time — the rule engine is always the floor. Tested offline via `parseAiRanking` cases in `tests/cropPath/workflowV2.test.ts`.

## Decision template
### ADR-XXX — Title
- **Status:** Proposed / Accepted / Superseded
- **Date:**
- **Context:**
- **Options considered:**
- **Decision:**
- **Consequences:**
