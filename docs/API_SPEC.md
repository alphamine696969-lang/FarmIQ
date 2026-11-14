# FarmIQ — API Specification & Setup Reference

This document lists **every implemented API endpoint**, the **environment setup required** for it to work, and the external services it depends on. Update this file whenever a route is added, changed, or removed.

**Response conventions** (all routes):

```json
Success:  { "data": { ... }, "meta": { ... } }
Error:    { "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

Provider failures never return 500 for upstream issues — they degrade to `data` with an explicit `fallback: true` / `available: false` / `unavailable` state. Stack traces and secrets are never exposed.

---

## 1. Implemented endpoints

### Core platform

| Method | Path | Purpose | External dependencies |
|---|---|---|---|
| GET | `/api/health` | Non-sensitive health check (status, trust flags) | None |
| POST | `/api/profit/calculate` | Deterministic profit / break-even calculation | None |
| POST | `/api/markets/prices` | Region-based **official** crop prices: resolves place/GPS → country, returns Eurostat producer prices (latest published period) or an honest not-covered state; never serves sample data | Eurostat `apri_ap_crpouta`, Open-Meteo geocoding, Photon reverse |
| GET | `/api/weather/current` | Current agro-weather snapshot (**sample data, labeled**) | None |

### AI assistant

| Method | Path | Purpose | External dependencies |
|---|---|---|---|
| POST | `/api/assistant/chat` | Full 7-layer chatbot pipeline (guard → classify → retrieve → assemble → generate → output-guard → log); `maxDuration: 180` | TokenHarbor gateway (`AI_API_KEY`) |

Request: `{ "message": string, "history"?: Turn[], "userId"?: string }` → response includes `answer, intent, sources[], followUps, evidenceStatus, limitations, warnings, blocked, providerConfigured` + `meta.modelUsed`.

### CropPath (crop lifecycle tracker)

| Method | Path | Purpose | External dependencies |
|---|---|---|---|
| POST | `/api/crop-path/geocode` | Type-ahead place suggestions for the village/region picker | Open-Meteo Geocoding, Photon (OSM) |
| POST | `/api/crop-path/context` | Phase 1 background fetch: 14-day forecast (temp/precip/UV/ET0), soil texture, international season | Open-Meteo Forecast, ISRIC SoilGrids |
| POST | `/api/crop-path/weather` | Field weather + crop alerts (rain-skip, frost, heat, blight risk, dry spell); accepts picked coordinates or text | Open-Meteo Forecast |
| POST | `/api/crop-path/prices` | Official annual crop prices for the farmer's country | Eurostat `apri_ap_crpouta` |
| POST | `/api/crop-path/recommend` | AI recommendation: model ranks and explains verified candidates using the live context; rule-based fallback | TokenHarbor gateway |
| POST | `/api/crop-path/report` | Optional AI assessment of a weekly report | TokenHarbor gateway |
| POST | `/api/crop-path/photo` | Structured vision analysis of report/maturity photos (stage match, disease/nutrient observations, maturity flag); raster-only ≤1.5 MB ×3, 6 MB body cap, `maxDuration: 120` | TokenHarbor gateway (`AI_VISION_MODEL`) |

### Disease scanner & Crop Advisor

| Method | Path | Purpose | External dependencies |
|---|---|---|---|
| POST | `/api/disease/analyze` | AI disease analysis of a named plant's photos: plant ID + match check, growing conditions, disease + cause, severity, recovery/prevention steps, official sources allowlisted from `APPROVED_SOURCES` (model picks ids, URLs mapped server-side); raster-only ≤3 images, 6 MB cap, `maxDuration: 120`; honest `fallback: true` | TokenHarbor gateway (`AI_VISION_MODEL`) |
| POST | `/api/crop-advisor/context` | Observed 90-day climate (mean temperature, precipitation total) + SoilGrids soil (texture class + pH) for a location; each field degrades to `null` + reason | Open-Meteo Forecast (`past_days=90`), ISRIC SoilGrids |

```jsonc
// POST /api/disease/analyze
{ "plantName": "tomato", "images": ["data:image/jpeg;base64,..."] }
// → { data: { report: { plantIdentified, plantMatchConfirmed, plantDetails, growingConditions,
//     diseaseName, diseaseWhy, severity, recoverySteps[], preventionSteps[], sourceIds[] },
//   sources: [{ id, sourceName, organization, canonicalUrl }], providerUsed, fallback } }

// POST /api/crop-advisor/context
{ "lat": 31.63, "lon": 74.87, "label": "Ludhiana" }   // or { "place": "Nakuru" }
// → { data: { available, location, climate: {avgTempC, totalPrecipMm, sourceName, ...} | null,
//     soil: {textureClass, ph, sourceName, ...} | null, currentTempC, reasons[] } }
```

Key request shapes:

```jsonc
// POST /api/crop-path/geocode
{ "query": "Nashik" }                       // ≥3 chars → { data: { suggestions: [{name, admin1, country, countryCode, latitude, longitude}] } }

// POST /api/crop-path/context
{ "lat": 20.01, "lon": 73.79, "label": "Nashik, Maharashtra", "countryCode": "IN" }
// or { "village": "Pune, Maharashtra" } (geocoded server-side)
// → { data: { available, location, season, hemisphere, currentTempC, days[14], soil|null, retrievedAt } }

// POST /api/crop-path/weather
{ "lat": ..., "lon": ..., "label": "...", "cropName": "Tomatoes" }  // or { "village" | "region": "..." }
// → { data: { available, locationName, currentTempC, next3Days, precipNext3DaysMm, wateringSkipped, notes[] } }

// POST /api/crop-path/prices
{ "crops": ["Wheat"], "countryCode": "DE" }
// → { data: { prices: { "Wheat": { price, unit, currency, sourceName, period, datasetUrl, retrievedAt } | null },
//             status: "live" | "not_covered" | "country_unavailable" | "unavailable", note } }

// POST /api/crop-path/recommend
{ "goal", "season", "region", "context": { currentTempC, precip14dMm, tempMax14C, tempMin14C, soilTexture },
  "candidates": [{ name, category, cycleDays, resilience, tempMinC, tempMaxC, phMin, phMax, rainMinMm, rainMaxMm, ruleScore, seasonSuitable }] }
// → { data: { ranking: string[], reasons: {crop: text}, providerUsed, fallback } }

// POST /api/crop-path/report
{ "cropName", "weekNumber", "stageLabel", "rating", "issues", "actionsCompleted", "notes" }
// → { data: { summary | null, providerUsed, fallback } }

// POST /api/crop-path/photo
{ "cropName", "weekNumber", "stageLabel", "images": ["data:image/jpeg;base64,..."] }   // 1–3 raster images
// → { data: { analysis, report: { stageMatch, diseaseSigns[], nutrientFlags[], severity, maturityConfirmed, notes } | null, providerUsed, fallback } }
```

---

## 2. Setup required

### Environment variables

Set in `.env.local` (local) and **Vercel → Project → Settings → Environment Variables** (deployed). Copy `.env.example` as the starting point.

| Variable | Required? | Purpose | Degradation when missing |
|---|---|---|---|
| `AI_API_KEY` | Recommended | TokenHarbor gateway key — assistant chat, AI ranking, AI summaries, photo analysis | All AI features degrade to labeled deterministic fallbacks (never errors) |
| `AI_BASE_URL` | Optional | Gateway base URL (default `https://tokenharbor.ai/v1`) | Uses default |
| `AI_GENERATION_MODEL` | Optional | Default `mimo-v2.6-flash:free` | Uses default |
| `AI_INTENT_MODEL` | Optional | Default `deepseek-v4.1-flash:free` | Uses default |
| `AI_VISION_MODEL` | Optional | Photo analysis model (default `mimo-v2.6-flash:free`) | Uses default |
| `AI_EMBEDDING_MODEL` | Optional | Opt-in embeddings for pgvector retrieval | Local lexical retrieval |
| `GOOGLE_TRANSLATE_API_KEY` | Optional | Google Translate v2 translation | Translation limitation disclosed |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Pending FIQ-020 | Database, auth, storage, pgvector migration | localStorage persistence, no account sync |
| `WEATHER_API_KEY`, `MARKET_DATA_API_KEY`, `MAPS_API_KEY`, `EXCHANGE_RATE_API_KEY` | Not used yet | Reserved for future providers | — |

**Never commit `.env.local`** (gitignored). Keys live only in local env / Vercel dashboard secrets.

### Keyless external services (no keys, allowlisted hosts)

These are hardcoded allowlist hosts — user input is only ever sent as an encoded query parameter (SSRF-safe by construction):

| Service | Host | Used by |
|---|---|---|
| Open-Meteo Forecast | `api.open-meteo.com` | `/api/crop-path/context`, `/api/crop-path/weather`, `/api/crop-advisor/context` (observed 90-day climate) |
| Open-Meteo Geocoding | `geocoding-api.open-meteo.com` | `/api/crop-path/geocode`, context/weather fallback |
| Photon (OSM) | `photon.komoot.io` | geocoding fallback + suggestions |
| ISRIC SoilGrids | `rest.isric.org` | soil texture + pH in `/api/crop-path/context` and `/api/crop-advisor/context` (degrades to manual inputs) |
| Eurostat | `ec.europa.eu/eurostat/api/...` | `/api/crop-path/prices` (EU coverage only) |

All are free/keyless. Open-Meteo requests are cached in-memory (weather 10 min, failures 60 s, prices 15 min, context 10 min, crop-advisor context 10 min).

### Local setup

```bash
npm install
cp .env.example .env.local      # add AI_API_KEY for live AI (optional)
npm run dev                     # http://localhost:3000
npm test                        # 7 offline test suites (must pass)
npm run test:provider           # optional: live TokenHarbor smoke test
npm run build                   # production build (stop dev server first)
```

### Vercel deployment

1. Push to `main` (Git integration auto-deploys — FIQ-084).
2. Add env vars above in the Vercel dashboard (at minimum `AI_API_KEY` + `AI_BASE_URL` for live AI).
3. Trigger **Deployments → ⋯ → Redeploy** so env vars apply to the new build.
4. Chat route uses `maxDuration = 180` and photo/recommend/report use `120` — free-tier completions can queue ~100 s; these limits provide headroom.

---

## 3. Auth, validation, limits

- **Current state:** API routes are not session-gated; user data (trackers, profile) lives in browser localStorage until Supabase persistence lands (FIQ-020/021/091). No secrets are exposed to the client — all provider keys are read server-side.
- Request bodies are validated per route (types, string caps, numeric bounds); harvest/recommendation numbers are clamped; photos are raster-only with size caps.
- AI/vision provider errors (429/503/timeouts) degrade to `fallback: true` — the deterministic engine is always the floor.

## 4. Proposed but not implemented (future)

Kept honest so this spec stays a contract of record:

| Planned endpoint | Status |
|---|---|
| `/api/assistant/conversations*` | TODO — conversation persistence (needs Supabase) |
| `/api/profit/scenarios*` | TODO — server-side scenario CRUD (currently localStorage) |
| `/api/farms*` | TODO — farm/plot CRUD API (currently localStorage UI) |
| `/api/weather/forecast`, `/api/weather/alerts` | Partial — CropPath weather route covers field alerts; page-level live weather is FIQ-092+ follow-up |
| `/api/markets/trends` | TODO — price time-series/trends; official point-in-time prices now served via `/api/markets/prices` (no sample data) |
