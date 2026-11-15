# Changelog

All notable changes to FarmIQ should be documented here. Follow a simple Keep a Changelog style and use dates where practical.

## [Unreleased]

### Changed
- **Web research rebuilt as keyless model-initiated tools (ADR-019, replaces ADR-018's key-based search)** — removed the Tavily/Brave/Serper adapter entirely (no search-provider keys anywhere). New `lib/integrations/webFetch/index.ts` provides two OpenAI function-calling tools the **assistant model itself invokes before answering** (ChatGPT-style, bounded to 3 LLM turns / 4 tool executions per answer): `web_search` (keyless Bing News RSS — robots-allowed — merged with the Wikipedia search API) and `web_fetch` (reads any public page: http(s)+standard ports only, private/loopback/metadata/`.local` hosts blocked, DNS + manual-redirect re-validation, 8s/2MB caps, HTML→text). The system templates now instruct the model to research **for every answer — not only news** — cite only actually-returned URLs, and treat page content as untrusted. Research items flow into the pipeline's `sources[]` cards with a mandatory limitation line. Marketplace news + disease scanner call the same keyless `web_search` directly. Off switch: `WEB_FETCH_DISABLED=1`. Tool inventory: `docs/AI_TOOLS.md`.

### Added
- **Web-fetch tool for all AI surfaces (ADR-019)** — assistant tool loop, `POST /api/markets/news` (latest agriculture news for the selected location), and disease-scanner context, all with zero API keys. SSRF-guarded, honest failure states — never fake headlines or citations.
- **Markets "Latest news for your region" card** — when a region is chosen (search or GPS), the Markets page also fetches recency-biased web results via `/api/markets/news` and lists live source links (title, snippet, domain, date).

### Changed
- **Preloaded assistant static resources removed (ADR-018)** — deleted `STATIC_CHUNKS` (hard-coded agronomy/scheme/market/feature blurbs) from `knowledgeIndex.ts`. Offline fallback is now only approved crop + disease profiles; freshness comes from the web-research tools. Pipeline layer order is unchanged.

### Changed
- **Market Prices rebuilt on region-based official data — all mock removed (FIQ-100)** — deleted `INITIAL_MARKET_OBSERVATIONS` (and its API/page/dashboard/landing usages); new `POST /api/markets/prices` resolves the farmer's region (type-ahead search or GPS via new Photon reverse geocoding) to a country and returns **official Eurostat producer prices** for every covered crop with period + source link on each row. EU regions get live official rows (verified: Lyon → 10 rows, Germany → 2024 periods); non-EU regions get an honest "no live feed connected" state — **zero sample prices anywhere**. Net-realization calculator now runs on the selected official price with user-entered freight/handling (clearly labeled as their own estimates). Regression test `tests/markets/noMock.test.ts` source-checks that no sample observations can creep back.

### Changed
- **Crop Advisor rebuilt on live location data + full crop catalog (FIQ-099)** — removed the mock slider-only flow; added a **location/region search (type-ahead) and "Use my location" GPS** that loads observed90-day climate (Open-Meteo) and SoilGrids soil (texture + pH) via new `POST /api/crop-advisor/context`, auto-filling the parameters with per-source live badges and honest fallback reasons when a provider is down (manual sliders remain, never invented values).
- **All crops, not5–6 presets** — new `lib/data/cropCatalog.ts` covers **66 crops across11 categories** (cereals, pulses, oilseeds, tubers, fiber, sugar, vegetables, fruits, spices, beverages, industrial) with accepted agronomic ranges, no yield claims; every crop resolves a working approved-source URL. Scoring moved to a tested pure service (`lib/services/cropAdvisor/scoring.ts`): transparent −35/+5 pH, −30 temperature, −20 rainfall, −15 soil penalties, clamped20–98. The assistant's crop knowledge base now indexes the full66-crop catalog (no yield sentences).

### Changed
- **Disease Scanner rebuilt as real AI photo analysis (FIQ-098)** — removed the canned mock scan flow; new flow: enter plant name → upload 1–3 photos (client-compressed) → `POST /api/disease/analyze` (vision model) → structured report with plant identification (and match-confirmation against the entered name), plant details, growing conditions, disease name + why it occurs, severity, recovery steps, prevention steps, and **official sources mapped server-side from `APPROVED_SOURCES`** (the model can only pick ids — it can never supply URLs). Provider failure degrades to an honest fallback plus a clearly-labeled verified reference entry (never presented as a scan). ADR-006: cultural guidance only, no dosages.
- **Assistant sources are now query-adaptive, not a fixed 4–5** — retrieval selects chunks by relevance floor (≥60% of the best match, ≥ threshold, cap 6) and the pipeline dedupes to one card per source, so narrow questions return1–2 sources and broad ones more, only when they match the question.
- **Fixed dead official-source URLs (404 bug)** — all `APPROVED_SOURCES` canonical URLs had rotted (404/unreachable); replaced with live, curl-verified official links (FAO Irrigation Paper 56, USDA AMS Market News, PPQS India, CGIAR Research, FAO Plant Production & Protection, FAO GIEWS — all HTTP 200). Added FAO PPP and GIEWS as sources #5–6. Source cards now render excerpts as descriptions instead of fake quotes.
### Added
- Rewrote `docs/API_SPEC.md` as the real API + setup reference: all 12 implemented endpoints with request/response shapes, required env vars (local + Vercel), keyless service allowlist, setup commands, honest auth/limits notes, and the proposed-but-not-implemented list.
- CropPath crop lifecycle tracker (FIQ-090, spec `md files for work/FARMIQ_AI_CHATBOT_PIPELINE.md` sibling `FARMIQ_CROP_TRACKER.md`) at `/app/crop-path`:
  - Deterministic recommendation engine (goal weighting, season detection incl. monsoon Kharif/Rabi/Zaid, soil/temp/rainfall fit) with financial estimates derived only from labeled sample market data and honest "unavailable" states; optional AI "why this crop" via `POST /api/crop-path/recommend`.
  - Week-by-week growth roadmaps from stage templates scaled to each crop's cycle, with irrigation-aware reminders.
  - Weekly report flow with deterministic schedule adjustments, verified disease guidance (ADR-006: no dosages), optional AI assessment via `POST /api/crop-path/report`, and locally-stored compressed photos.
  - Harvest flow: sample-historical marketplace suggestions with verify-locally notice, profit receipt computed by the tested `calculateFarmProfit` engine, and badges (First Harvest, Profit Champion, crop master, Diligent Farmer).
  - Trackers persist in browser localStorage with a visible "account sync pending (FIQ-020)" notice; 29-assertion test suite in `tests/cropPath/cropPath.test.ts` (ADR-011).
- CropPath realtime + AI layer (FIQ-092, ADR-012):
  - **Live weather** via keyless Open-Meteo (+ Photon geocoding fallback): `POST /api/crop-path/weather` geocodes the field's village/region, fetches a 7-day forecast, and maps it to crop alerts (rain → skip-watering, frost, heat stress, blight risk for solanaceous crops, dry-spell ET0) with a bounded 60s/10min cache (50 entries). Recommendation scoring now takes live temperature/weekly-rain inputs; the tracker shows a live weather card with refresh and weather-skipped watering reminders.
  - **Type-ahead place picker** (`POST /api/crop-path/geocode`): the farmer picks their exact village/region from live suggestions; the tracker stores its coordinates and weather uses them directly — the wrong-place fix. The free-text fallback keeps a token guard (every significant query token must match the geocoder answer; Photon restricted to places/boundaries) so garbage queries return an honest "could not find" instead of another town's weather.
  - **AI photo analysis** (`POST /api/crop-path/photo`) on weekly reports using `AI_VISION_MODEL` (default `mimo-v2.6-flash:free`, verified multimodal): raster-only JPEG/PNG/WebP, ≤1.5 MB × 3 images, 6 MB body cap, one 2.5 s retry on transient `503 service_busy` gateway responses; honest `fallback: true` degradation and advisory-only labeling.
  - Adversarial hardening: negative harvest values clamped, extreme weather inputs bounded (soil pH 3.5–10, temp −20–55 °C, rain 0–1500 mm), weather cache failure TTL 60s, localStorage quota saves strip oldest photos instead of losing tracker text; 18-assertion weather suite in `tests/cropPath/weather.test.ts`.
  - Dashboard quick-action tile for CropPath on `/app`.
- CropPath v2 live-data workflow (FIQ-094, spec `md files for work/FARMIQ_CROPPATH_WORKFLOW_v2.md`, ADR-013):
  - **Phase 1 background fetch** — `POST /api/crop-path/context`: live 14-day Open-Meteo forecast with UV/ET0, ISRIC SoilGrids soil texture (honest unavailable when the service degrades), and international season detection (Kharif/Rabi/Zaid for monsoon regions via country/timezone, tropical Wet/Dry, hemisphere-inverted temperate seasons).
  - **Live official prices** — `POST /api/crop-path/prices`: Eurostat `apri_ap_crpouta` annual crop selling prices with units parsed from official labels; `not_covered` honesty for non-EU countries; financial cards show "official vs sample" with source, period, and dataset link.
  - **7 recommendation goals** (high profit, low cost, low water, short duration, govt-supported, resilient, organic-style) with honest clauses where no scheme/certification database exists; weather-alignment summaries per crop; GPS "use my location"; sowing-date season mismatch warning.
  - **Roadmap week cards** now carry fertilizer/irrigation/scouting tasks — rates always defer to soil tests, never invented amounts.
  - **Phase 7-8 structured vision**: JSON stage match, disease/nutrient observations, severity, maturity flag; stage evidence takes precedence over farmer rating for schedule shifts (+7/+14/−3 days); heuristic health score stored per report; photos required for weekly reports.
  - **Phase 9-10**: harvest maturity photo confirmation with one-week extend path; receipt stats (weeks run, reports vs missed, avg health, issues) and browser print-to-PDF; reminders panel (report due, schedule shift, harvest window) on the tracker home.
  - Honest boundaries recorded in ADR-013: World Bank/FAOSTAT/Agmarknet/FEWS NET/FAO-schemes/Mapbox/PlantVillage not connected (unreachable, auth, terms, or keys) — shown as "not connected", never faked; push notifications tracked as FIQ-095; scheme ingestion as FIQ-096.
- CropPath AI recommendation ranking (FIQ-097, ADR-014): `POST /api/crop-path/recommend` now sends the live context (14-day forecast, soil texture, season, goal) plus verified candidate profiles and the model returns the ranked order + fit reasons — validated so it can only reorder known crops (invented crops dropped, echoed labels canonicalized, reasons capped); any failure falls back to rule ranking and the card badges "AI-ranked live".
- CropPath mock-data removal (live-only financials):
  - Financial estimates now come **exclusively** from official live prices (Eurostat); without a connected feed the card shows an honest unavailable state — sample-historical price fallbacks removed from `buildFinancialEstimate`.
  - Harvest "selling options" sample marketplace removed; the harvest panel shows the live official price reference (source + period + link) or an honest "no official feed for your country" note, plus the FIQ-093 nearest-markets not-connected disclosure. Trackers store the picked place's `countryCode` for price lookups.
  - CropPath is now fully mock-free: weather, soil, geocoding, prices, and AI are all live or honestly unavailable (verified profiles/citations — the agronomy knowledge base — remain, as they are the verified dataset, not sample data).
- Layered AI chatbot request pipeline (FIQ-054) implementing `md files for work/FARMIQ_AI_CHATBOT_PIPELINE.md`:
  - `lib/services/assistant/` modules: input guard (off-topic, injection, length, language detection), intent classifier (8 intents with confidence gate), RAG retriever (pgvector RPC + local lexical index), context assembly (locked system prompt, 4-turn history), generation layer (LLM + extractive fallback + I-don't-know gate), output guard (prompt/identity leak and uncertainty checks), turn logging with quality metrics, and orchestrator.
  - `lib/integrations/ai/` provider adapter boundary (OpenAI/Anthropic chat, embeddings) with server-side secrets, timeouts, and untrusted-payload validation.
  - `POST /api/assistant/chat` now runs the full pipeline and returns sources, follow-ups, evidence status, limitations, and provider status; the assistant page calls it instead of running logic in the browser.
  - Pending migration `supabase/migrations/0001_assistant_chatbot_pipeline.sql` (pgvector knowledge store, `match_farmiq_docs` RPC, `chatbot_logs`) — applies once FIQ-020 configures Supabase.
  - DeepL translation boundary (`translation.ts`) with honest degradation when unconfigured.
  - 21-case pipeline test suite in `tests/assistant/pipeline.test.ts` (`npm test` runs both suites).
  - Provider smoke test `scripts/provider-smoke.ts` (`npm run test:provider`) — real gateway calls through the adapter; classification + generation verified against TokenHarbor.
- Vercel Git-integration deployment guide in `docs/DEPLOYMENT.md` (import repo, env vars, post-deploy checks).
- Task FIQ-084 to track Vercel production deployment.

### Changed
- AI provider replaced with a single TokenHarbor OpenAI-compatible gateway (ADR-009): `AI_BASE_URL`/`AI_API_KEY`, default models `mimo-v2.6-flash:free` (generation) and `deepseek-v4.1-flash:free` (intent); OpenAI/Anthropic adapter paths removed.
- Assistant answers are real-time from the provider: when the knowledge base has no matching documents the model answers from general farming knowledge with mandatory disclosure and `partial` evidence status instead of a canned refusal (ADR-010). Canned responses remain only for unconfigured/failed providers, guard rejections, and the ADR-006 dosage refusal.
- Intent classification now runs as a cascade — deterministic keywords first, LLM only for uncertain queries — to conserve free-tier rate limits.
- Translation switched from DeepL to Google Translate v2 (`GOOGLE_TRANSLATE_API_KEY`).
- Generation timeout raised to 120s for slow free-tier queues; chat route sets `maxDuration = 180` for Vercel.
- `tsconfig.json` target set to `ES2017` (required for Unicode regex flags and Set iteration in the pipeline).
- `.env.example` documents AI provider, model, and translation variables.
- `lib/services/assistantService.ts` marked deprecated in favor of the pipeline (kept for reference).

## [1.1.0] - 2026-10-11
### Changed
- Comprehensive UI/UX design overhaul across the entire platform implementing the **FarmIQ Global Smart Farming** design system:
  - **Color Tokens**: Soft organic Canvas Mint (`#F3FCF3`), Deep Forest Green (`#153D2B`), Leaf Lime (`#1BC447`), Harvest Gold (`#FD9D1A`), Atmosphere Blue (`#33B3FC`), Soil Charcoal (`#1C2922`), and Border Leaf (`#DCE5DC`).
  - **Bento Grid Architecture**: Crisp modular `#FFFFFF` bento cards with ambient tinted luminescence (`0 4px 20px -2px rgba(21, 61, 43, 0.04)`), `1.5rem` to `2rem` rounded corners, and 40x40 squircle icon containers.
  - **Pill Geometry**: Strict `rounded-full` pills for interactive controls, action buttons with localized vibrant glow (`0 8px 20px -4px rgba(27, 196, 71, 0.28)`), and status indicator chips (Operational, Harvest Warning, Hydrology Active, Critical Hazard).
  - **Telemetry Readouts**: Formatted with Plus Jakarta Sans and `font-variant-numeric: tabular-nums` for stable, glanceable monitoring.
  - **Sticky Command Shell**: Translucent command bar (`rgba(243, 252, 243, 0.85)` with `backdrop-filter: blur(12px)`), live pulsing `#1BC447` telemetry indicator, and farm switcher.
  - Form fields updated with soft-cornered 16px capsule geometry and vibrant focus rings.
  - All existing pages, routes, deterministic calculation engines, safety gates, and test suites preserved intact.

## [1.0.0] - 2026-10-11
### Added
- Complete Next.js App Router smart farming web application based on FarmIQ documentation specification.
- Full design system using Tailwind CSS with FarmIQ tokens.
- Seven core platform pillars:
  - Grounded AI Agricultural Assistant with verified citations (FAO, USDA, ICAR) and strict ADR-006 pesticide dosage abstention safety gates.
  - Crop Market Prices & Comparisons with net farm-gate realization deductions.
  - Deterministic Farm Profit & Break-Even Calculator with ROI, margins, and scenario comparison.
  - Crop Suitability & Trend Advisor matching soil pH, texture, and rainfall to crop phenology.
  - Crop-Health Disease & Symptom Scanner with candidate pathogen identification, cultural controls, and safety disclaimers.
  - Agro-Meteorological Weather Intelligence with calculated spraying windows, ET0 evapotranspiration, and frost hazard alerts.
  - Multi-Farm & Plot Governance with interactive plot creation and crop cycle tracking.
- Public web routes: Landing Page (`/`), Features (`/features`), How It Works (`/how-it-works`), Approved Sources & Trust Registry (`/sources`), About (`/about`), Privacy Policy (`/privacy`), Terms of Service (`/terms`), Login (`/login`), and Signup (`/signup`).
- Automated calculation unit tests in `tests/profit.test.ts` passing 100%.
- Verified production build generating 26 static pages and API routes with zero compilation errors.
