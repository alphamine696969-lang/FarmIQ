# FarmIQ — Precision Agricultural Intelligence System

> **Grow Smarter. Earn Better.**  
> A trusted, transparent agronomic intelligence platform combining field-level weather, regional market prices, deterministic crop economics, crop suitability guidance, AI-assisted plant health assessment, and full lifecycle crop tracking in one privacy-respecting experience.

---

## 🌾 Overview

**FarmIQ** addresses the fragmentation of modern agriculture by consolidating agronomic guidance, commodity market prices, micro-meteorology, and financial planning into a single unified workspace. 

Unlike generic chatbots or platforms that rely on arbitrary heuristics, FarmIQ is built upon a strict **Product Trust Contract**:
- **Provenance by Default**: Every data point discloses its source, timestamp, and jurisdiction.
- **Zero Simulated Market Prices**: Market prices come strictly from verified official providers (e.g., Eurostat) based on the farmer's region—no fabricated numbers are ever rendered.
- **Deterministic Financial & Agronomic Models**: Profitability, break-even thresholds, evapotranspiration (ET0), and crop scoring use audited, mathematical equations grounded in FAO and agricultural research standards.
- **Safety by Construction (ADR-006)**: The platform strictly refuses arbitrary chemical pesticide dosage recommendations, promoting cultural Integrated Pest Management (IPM) practices and extension service referrals.

---

## 🚀 Core Features & Modules

### 1. 🚜 Holdings & Plot Management (`/app/farms`)
- **Multi-Farm Architecture**: Register and switch between multiple agricultural estates and landholdings.
- **Plot-by-Plot Telemetry**: Track individual field plots, area (acres/hectares), soil texture classes, measured soil pH, irrigation infrastructure (Drip, Sprinkler, Rainfed, Flood), and active crop stages.
- **Private & Local-First**: Holding configurations persist securely in local tenant storage.

### 2. 🌤️ Agro-Meteorological Intelligence (`/app/weather`)
- **Live Open-Meteo Integration**: Keyless, high-resolution micro-climate forecasting with typeahead geocoding and browser GPS.
- **Agro-Specific Metrics**: Canopy air temperature, relative humidity, dew point, wind speed, solar radiation, and estimated root-zone soil moisture.
- **7-Day Field Telemetry**: Evaluates daily FAO-56 Reference Evapotranspiration (ET0), spraying window quality (drift risk assessment), and field soil workability.
- **Real-Time Hazard Alerts**: Automated warnings for overnight valley frost risks, high evaporative demand, foliar fungal conditions, and gusty winds.

### 3. 📈 Regional Market Prices (`/app/markets`)
- **Location-Based Official Data**: Resolves farmer location to official country/regional pricing feeds (e.g., Eurostat producer prices) with live source links and publication periods.
- **Net-Realization Calculator**: Calculate net take-home realization per crop after deducting freight, handling, and drying costs.
- **Honest Feed Boundaries**: Explicitly discloses when a region lacks a connected official live feed rather than inventing sample rows.

### 4. 💰 Farm Profit & Break-Even Engine (`/app/profit`)
- **Deterministic Financial Modeling**: Calculates gross revenue, total operational budget, net profit, margin percentage, and Return on Investment (ROI).
- **Unit Economics**: Dynamic cost-per-acre, revenue-per-acre, break-even yield, and break-even commodity price.
- **Granular Cost Breakdown**: Visual distribution across seeds, fertilizers, crop protection, labor, irrigation, fuel/machinery, land rent, and miscellaneous overhead.
- **Scenario Comparison**: Save, load, and compare multi-season crop scenarios directly within your workspace.

### 5. 🧭 Crop Suitability Advisor (`/app/crop-advisor`)
- **Deterministic 66-Crop Catalog**: Evaluates candidate crops across 11 agronomic categories (cereals, legumes, fruits, vegetables, oilseeds, cash crops).
- **Live Environmental Matching**: Auto-fills observed 90-day climate (Open-Meteo) and topsoil texture/pH (SoilGrids REST API) based on geographic coordinates.
- **Transparent Scoring Formula**: Transparent penalty curves for temperature bounds, soil pH deviation, and water requirements with grounded FAO citations.

### 6. 🔍 AI Plant Health & Disease Scanner (`/app/disease`)
- **Photo Assessment**: Upload 1–3 crop photos with client-side canvas compression for rapid analysis.
- **Plant & Symptom Identification**: Confirms species, analyzes visible foliar damage, assesses severity (none, early, moderate, severe), and generates recovery and prevention roadmaps.
- **Curated Agronomic Grounding**: Recommendations map directly to official agricultural protection guidelines (PPQS, FAO, CGIAR). Pesticide dosage requests are safely refused.

### 7. 🤖 Grounded Agronomic Assistant (`/app/assistant`)
- **Layered RAG Pipeline**: Context-grounded farming chatbot with multi-stage input validation, intent classification, and output guardrails.
- **Citation-Backed Responses**: Chunks retrieved from verified agronomy publications are cited with document sections and canonical URLs.
- **Honest Abstention Gate**: When retrieval similarity falls below confidence thresholds, the assistant openly discloses limitations instead of hallucinating answers.

### 8. 🌱 CropPath Lifecycle Tracker (`/app/crop-path`)
- **End-to-End Tracking**: Season-aware stage tracking from pre-sowing preparation to harvest.
- **Adaptive Weekly Scout Reports**: Log plant progress, photo receipts, observed weather impacts, and field notes.
- **Harvest Ledger & Badges**: Record realized yields and unlock verified farm operational achievements.

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router) | Server components, client interactivity, and optimized routing |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) | Strong type contracts across all data models and calculations |
| **UI & Styling** | [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) | Clean agro-modern UI with semantic green/earth tokens & icons |
| **Animations** | [GSAP](https://greensock.com/gsap/) | High-performance page transitions and micro-interactions |
| **Weather Integration** | [Open-Meteo API](https://open-meteo.com/) | Live, keyless agro-meteorological forecasting & geocoding |
| **Soil Integration** | [SoilGrids](https://soilgrids.org/) (ISRIC) | REST endpoint for automated global soil texture and pH retrieval |
| **Commodity Markets** | [Eurostat](https://ec.europa.eu/eurostat) API | Official European agricultural producer prices and indices |
| **AI Gateway** | TokenHarbor / OpenAI-compatible endpoint | Vision analysis and grounded agronomic conversational pipeline |
| **Persistence** | LocalStorage + [Supabase](https://supabase.com/) Ready | Local client state with prepared PostgreSQL & pgvector migrations |
| **Testing Engine** | Sucrase + Node Native Test Runner | Fast, TypeScript-native execution of all deterministic tests |

---

## 📂 Project Structure

```text
FarmIQ/
├── app/
│   ├── api/                      # Next.js Server Route Handlers
│   │   ├── assistant/chat/       # Multi-layer RAG chatbot pipeline
│   │   ├── crop-advisor/context/ # SoilGrids & Open-Meteo context aggregator
│   │   ├── crop-path/            # Lifecycle tracker, geocoding & recommendations
│   │   ├── disease/analyze/      # AI photo assessment & symptom parser
│   │   ├── markets/prices/       # Official regional market price feed
│   │   └── weather/current/      # Live Open-Meteo agro-weather endpoint
│   ├── app/                      # Authenticated App Shell & Dashboards
│   │   ├── assistant/            # AI Farming Assistant interface
│   │   ├── crop-advisor/         # Crop suitability scoring dashboard
│   │   ├── crop-path/            # Full crop cycle tracking experience
│   │   ├── disease/              # Plant health photo scanner
│   │   ├── farms/                # Multi-farm & plot management
│   │   ├── markets/              # Live commodity price watch & net realization
│   │   ├── profit/               # Deterministic farm profit & break-even model
│   │   ├── settings/             # Units, currency, profile & data governance
│   │   ├── weather/              # Agro-meteorology & spraying windows
│   │   └── page.tsx              # Main overview dashboard
│   ├── layout.tsx                # Root layout & font configuration
│   └── page.tsx                  # Marketing landing page
├── components/
│   ├── layout/                   # AppShell, Navbar, and Footer
│   ├── transitions/              # Smooth page transitions
│   └── ui/                       # Badges, Cards, and reusable primitives
├── docs/                         # Architecture, Decisions (ADRs), and Specifications
├── lib/
│   ├── calculations/             # Deterministic profit & break-even formulas
│   ├── data/                     # Knowledge bases, crop catalogs, and state stores
│   ├── integrations/             # API adapters (Open-Meteo, SoilGrids, Eurostat, AI)
│   └── services/                 # Business logic for Chatbot, Advisor, and CropPath
├── supabase/                     # PostgreSQL & pgvector database migrations
└── tests/                        # Automated unit and integration test suites
```

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) version **18.17** or higher
- `npm` or `pnpm`

### Installation

1. **Clone the repository and enter the directory**:
   ```bash
   git clone <repo-url>
   cd FarmIQ
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` template to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Note: FarmIQ features like Agro Weather, Crop Advisor scoring, Markets, and Profit calculations run immediately without requiring third-party API keys).*

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

FarmIQ includes a comprehensive test suite verifying financial math, RAG guardrails, vision parsers, SoilGrids integrations, and mock-removal invariants:

```bash
npm test
```

The test suite validates:
- **`profit.test.ts`**: Verifies break-even yield/price, revenue, profit per unit area, and crop-failure bounds.
- **`assistant/pipeline.test.ts`**: Verifies input guarding, prompt injection rejection, off-topic blocking, ADR-006 pesticide dosage refusal, retrieval ranking, and output gates.
- **`disease/analysis.test.ts`**: Verifies structured JSON report parsing, string clamping, and official source mapping.
- **`cropAdvisor/scoring.test.ts`**: Validates deterministic suitability scoring across all 66 crops against SoilGrids and Open-Meteo inputs.
- **`markets/noMock.test.ts`**: Enforces strict regression prevention against any sample market observations.
- **`cropPath/cropPath.test.ts` & `workflowV2.test.ts`**: Validates the complete 7-goal recommendation, roadmap scheduling, weekly report adjustments, and financial flows.

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default / Fallback | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | No | `"FarmIQ"` | Application display name |
| `NEXT_PUBLIC_APP_URL` | No | `"http://localhost:3000"` | Canonical base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | `""` | Supabase project URL (for cloud auth/persistence) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | `""` | Supabase public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | `""` | Supabase service key (enables pgvector document retrieval) |
| `AI_BASE_URL` | Optional | `"https://tokenharbor.ai/v1"` | OpenAI-compatible AI gateway endpoint |
| `AI_API_KEY` | Optional | `""` | Gateway authorization key (enables live LLM chat & vision) |
| `AI_GENERATION_MODEL` | Optional | `"mimo-v2.6-flash:free"` | Primary text generation model override |
| `AI_VISION_MODEL` | Optional | `"mimo-v2.6-flash:free"` | Image recognition model for disease scanner |
| `GOOGLE_TRANSLATE_API_KEY` | Optional | `""` | Multilingual machine translation provider |

---

## 📄 Architectural Decisions (ADR Highlights)

- **ADR-005 (Provenance Classification)**: Every data surface must classify freshness as `live`, `cached`, `stale`, or `unavailable`.
- **ADR-006 (Agronomic Safety Gate)**: Chemical pesticide dosages are strictly blocked from LLM output to prevent unintended crop burns or chemical toxicity.
- **ADR-009 (Decoupled Provider Architecture)**: All third-party network services gracefully degrade to clear disclosures rather than crashing the client.
- **ADR-011 (Local-First Client Storage)**: Farm profiles, plot registries, and financial scenarios persist locally via validated storage schemas.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
