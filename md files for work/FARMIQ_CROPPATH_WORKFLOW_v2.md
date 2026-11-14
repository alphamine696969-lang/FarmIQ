# 🌾 FarmIQ — CropPath Feature Workflow

> **Scope:** International — works for any country, any region.
> **Core principle:** All data is fetched live from real sources. Nothing is hardcoded or AI-generated from memory.

---

## Workflow Overview

```
User Opens CropPath
        │
        ▼
[Phase 1]  Background Data Fetch (live, real-time)
        │
        ▼
[Phase 2]  Crop Recommendation
        │
        ▼
[Phase 3]  User Selects Crop → Field Setup
        │
        ▼
[Phase 4]  Roadmap Generation
        │
        ▼
[Phase 5]  Weekly Tracker Loop  ◄────────────────┐
        │                                         │
        ▼                                         │
[Phase 6]  Farmer Submits Weekly Report           │
        │                                         │
        ▼                                         │
[Phase 7]  Image Analysis + Report Processing     │
        │                                         │
        ▼                                         │
[Phase 8]  Roadmap Redevelopment ─────────────────┘
        │
        ▼  (when harvest reached)
[Phase 9]  Marketplace Suggestions
        │
        ▼
[Phase 10] Final Receipt + Badge
```

---

## Phase 1 — Background Data Fetch

Runs silently when user opens CropPath. No user action needed.

```
→ Detect user location (GPS or manual pin)
     → Resolve to: country, region/state, district

→ Fetch current + 14-day weather forecast
     Source: Open-Meteo API (free, no key required)
     URL: https://api.open-meteo.com/v1/forecast
     Data pulled: temperature, rainfall, humidity, wind, UV index

→ Detect current season
     Logic: derived from hemisphere + date + location
     Northern hemisphere: Kharif=Jun–Oct, Rabi=Nov–Apr
     Southern hemisphere: inverted
     Tropical zones: Wet / Dry season logic

→ Fetch crop price data for user's country
     Sources (by region):
       Global:    FAO GIEWS price data  — https://www.fao.org/giews
       Global:    World Bank commodity prices — https://www.worldbank.org/en/research/commodity-markets
       USA:       USDA NASS — https://www.nass.usda.gov
       EU:        Eurostat agri-prices — https://ec.europa.eu/eurostat
       India:     Agmarknet — https://agmarknet.gov.in
       Africa:    FEWS NET — https://fews.net
       Others:    FAO country office data

→ Fetch active government agricultural schemes for user's country
     Source: FAO country briefs — https://www.fao.org/countryprofiles
     + country-specific portals (resolved by detected country)

→ Load crop calendar for user's region
     Source: FAO crop calendar — https://www.fao.org/agriculture/seed/cropcalendar
     Filtered by: country + region + season
```

---

## Phase 2 — Crop Recommendation

Using all live-fetched data, the system scores eligible crops for the user.

```
INPUTS:
  user_location       → country + region
  current_season      → auto-detected
  weather_forecast    → 14-day data
  user_goal           → selected by user:
                         [High Profit / Low Cost / Low Water /
                          Govt-Supported / Short Duration / Organic]
  field_size          → entered by user
  soil_type           → user input or auto-mapped (FAO soil map)

PROCESS:
  1. Load FAO crop calendar for region → eligible crops this season
  2. Filter by weather compatibility
       → min/max temperature match
       → rainfall requirement vs forecast
       → humidity tolerance
  3. Filter by soil type compatibility
  4. For each eligible crop:
       → Fetch current commodity price (from Phase 1 sources)
       → Fetch any active govt subsidy or scheme
       → Estimate cost, revenue, profit per unit area
       → Score against user_goal
  5. Rank top 3–5 crops
  6. Build Crop Cards with all data timestamped

CROP CARD SHOWS:
  → Crop name + recommended variety
  → Why recommended (plain language)
  → Season + growth duration
  → Cost estimate / revenue estimate / profit estimate (per acre/hectare)
  → Current commodity price (live, with source + timestamp)
  → Active government benefits in user's country
  → Key benefits of growing this crop
  → Weather alignment summary
```

---

## Phase 3 — Field Setup

User selects a crop → fills a short form.

```
FIELDS:
  Crop Name          → auto-filled
  Field Name         → text (e.g. "East Field")
  Total Area         → number + unit (acre / hectare / bigha — auto by region)
  Variety / Seed ID  → optional text
  Planned Sow Date   → date picker (validated against crop's sowing window)
  Irrigation Type    → Rainfed / Canal / Drip / Sprinkler / Borewell
  Soil Type          → optional dropdown (auto-suggested from FAO soil map)
  Field Location     → GPS pin or manual address

ON SUBMIT:
  → All field data saved to DB
  → Triggers Phase 4
```

---

## Phase 4 — Roadmap Generation

```
ON FIELD SETUP SUBMIT:
  → Fetch 30-day extended weather forecast for field GPS location
  → Load crop agronomy guidelines for selected crop
       Source: FAO crop production guidelines
               https://www.fao.org/publications/en/
       + CGIAR research data (https://www.cgiar.org)
  → Load fertilizer schedule (crop-specific, region-adjusted)
  → Load irrigation schedule (crop stage × irrigation type)
  → Build week-by-week roadmap from sow date to estimated harvest date
  → Calculate all reminder dates
  → Store full roadmap in DB

ROADMAP STRUCTURE:
  Each crop divided into growth stages (from FAO/CGIAR agronomy data):

  Stage 0:  Land Preparation
  Stage 1:  Sowing / Planting
  Stage 2:  Germination / Emergence
  Stage 3:  Vegetative Growth (early)
  Stage 4:  Vegetative Growth (active)
  Stage 5:  Flowering / Reproductive
  Stage 6:  Grain Fill / Fruit Development
  Stage 7:  Maturity
  Stage 8:  Harvest

  Each week card contains:
    → Expected crop status at this stage
    → Action items (from agronomy guidelines)
    → Fertilizer task (amount + type + method)
    → Irrigation task (frequency + amount)
    → Scouting task (what to check)
    → Live weather advisory for that week (fetched fresh each week)
    → Reminders set for that week
```

---

## Phase 5 — Weekly Tracker Loop

Runs continuously for the full crop lifecycle.

```
EVERY 7 DAYS (or user-set interval):

  STEP 1 → Push notification sent: "Time for your Week X crop report"

  STEP 2 → User opens Weekly Report Form

  STEP 3 → User fills report (target: under 2 minutes)
              • Upload 1–3 crop photos (required)
              • Overall crop health: [Very Good / Good / Average / Worried]
              • Checklist: Did you irrigate? Fertilize? Any visible problems?
              • Optional note (voice or text)

  STEP 4 → System fetches fresh weather for next 7 days [Open-Meteo]

  STEP 5 → Image Analysis runs (Phase 7)

  STEP 6 → Report processed → roadmap updated (Phase 8)

  STEP 7 → Updated next-week card shown to farmer
              + any alert cards (disease, weather warning, action needed)

  REPEAT until harvest stage
```

---

## Phase 6 — Smart Reminders

All reminders are dynamic — recalculated after every weekly report.

```
REMINDER TYPES:

  💧 Watering
     → Scheduled from crop stage irrigation calendar
     → Automatically skipped if rainfall > threshold in forecast
     → Rescheduled if soil moisture forecast is adequate

  🧪 Fertilizer
     → Tied to crop growth stage
     → Adjusted forward/back if stage is running behind or ahead
     → Dose adjusted if nutrient deficiency detected in image analysis

  🐛 Pest / Disease Scout
     → Triggered when weather = high humidity + temperature in disease-favorable range
     → Crop-specific pest risk calendar (from FAO pest guidelines)

  📸 Weekly Report Due
     → Every 7 days from sowing date

  ⚠️ Weather Alert (immediate)
     → Frost risk detected → sent same day
     → Heatwave > crop max temp → sent same day
     → Excess rainfall / flood risk → sent same day
     → Drought stress risk → sent same day
     Source: Open-Meteo severe weather flags

  🏁 Harvest Window
     → Triggered when roadmap enters maturity stage
     → Confirmed when image analysis detects maturity signs
```

---

## Phase 7 — Image Analysis Pipeline

This is the most critical real-time processing step.

```
INPUT:
  1–3 farmer-uploaded photos from weekly report

STEP 1 — Image Quality Check
  → Check resolution (minimum 480p)
  → Check blur score
  → Check lighting adequacy
  → If quality too low → prompt user: "Please retake in daylight"

STEP 2 — Crop Stage Detection
  → Vision model analyzes image
  → Identifies visible growth stage from plant structure
  → Compares detected stage vs expected stage from roadmap
  → Output:
       "On schedule" / "1 week behind" / "2+ weeks behind" / "Ahead of schedule"

STEP 3 — Disease & Pest Detection
  → Image classified against disease model
     (PlantVillage dataset — 54,306 images, 38 disease classes, 14 crop types)
     https://github.com/spMohanty/PlantVillage-Dataset
  → If confidence > 0.75:
       → Disease name identified
       → Severity: Early / Moderate / Severe
       → Fetch treatment protocol from FAO plant protection guidelines
       → Insert treatment card into next week of roadmap

STEP 4 — Nutrient Deficiency Detection
  → Leaf color pattern analysis:
       Yellowing (uniform)         → Nitrogen deficiency
       Yellowing (older leaves)    → Magnesium deficiency
       Purple/red tinge            → Phosphorus deficiency
       Brown leaf edges/tips       → Potassium or salt stress
       Interveinal chlorosis       → Iron or Manganese deficiency
       Pale green overall          → Sulfur deficiency
  → Cross-reference with last logged fertilizer application
  → Output: deficiency flag + correction dose recommendation

STEP 5 — Overall Health Score
  → Combines: stage score + disease score + nutrient score
  → Output: Health Score 0–100
       90–100  Excellent
       70–89   Good
       50–69   Average — monitor closely
       30–49   Poor — intervention needed
       0–29    Critical — immediate action required

STEP 6 — Analysis Report Built
  → All findings compiled into structured report object
  → Passed to Phase 8 for roadmap redevelopment
```

---

## Phase 8 — Roadmap Redevelopment

After every image analysis + weather fetch, the roadmap is reassessed.

```
INPUTS TO REASSESSMENT:
  → Image analysis result (stage, disease, nutrient, health score)
  → Farmer's checklist answers (what was done, what was missed)
  → Live weather forecast for next 14 days
  → Current week number vs expected crop stage

DECISION LOGIC:

  Condition                          →  Action
  ─────────────────────────────────────────────────────────────────
  Stage on track + no issues         →  Minor reminder adjustments only
  Stage 1 week behind                →  Shift all future stage dates +1 week
  Stage 2+ weeks behind              →  Full roadmap recalculation from current stage
  Disease detected (confidence>0.75) →  Insert treatment cards for next 2 weeks
  Nutrient deficiency detected       →  Adjust fertilizer card for next week
  Missed irrigation (from checklist) →  Re-add to current week + adjust schedule
  Frost/heatwave incoming (forecast) →  Insert protective action card immediately
  Health score 30–49                 →  "Poor Crop Alert" card + escalated actions
  Health score < 30                  →  "Critical Alert" + full roadmap review

OUTPUT:
  → Updated roadmap from current week onward
  → Updated reminder schedule
  → Alert cards if any (shown prominently)
  → Summary card for farmer: "Here's what changed and why"
```

---

## Phase 9 — Harvest & Marketplace

Triggered when harvest stage is reached AND image confirms maturity.

```
HARVEST CONFIRMATION:
  → Roadmap reaches maturity week
  → Image analysis confirms: grain/fruit color, dry foliage, fill complete
  → If image doesn't confirm → extend 1 week, re-check

MARKETPLACE DATA FETCH (live, at harvest time):
  → Current commodity price for this crop in user's country
       Global:  FAO GIEWS — https://www.fao.org/giews
       USA:     USDA AMS — https://www.ams.usda.gov
       EU:      Eurostat — https://ec.europa.eu/eurostat
       Others:  World Bank commodity price feed

  → Nearest physical markets to user's field GPS
       Source: Mapbox / Google Maps API
       Filter: within 100km radius, handles this crop

  → Online selling platforms available in user's country
       Resolved by country code at runtime

  → Active government procurement or price support programs
       Source: FAO country office data + detected country govt portal

DISPLAY:
  → Top 2–3 nearest markets with current rate + distance
  → Online platform option if available
  → Government procurement option if applicable
  → Recommended option (best net return after transport cost estimate)
```

---

## Phase 10 — Final Receipt & Badge

```
RECEIPT CALCULATION:
  → Pull all expense entries logged during tracker
       (seed, fertilizer, irrigation, labor, pesticide, other)
  → Pull yield and sale price (entered by farmer at harvest)
  → Calculate:
       Total Expense
       Total Revenue
       Net Profit
       ROI %
       Profit per unit area

  → Pull tracker quality stats:
       Total weeks run
       Reports submitted vs missed
       Average health score across all reports
       Issues detected and resolved

  → Pull government benefits availed (schemes logged during tracker)

RECEIPT SAVED:
  → Stored permanently in "My Receipts" in farmer's profile
  → Exportable as PDF

BADGE AWARDED:
  → Crop-specific badge (e.g. "Wheat Grower — Season 1")
  → Additional badges for: all reports submitted, high health score, high ROI
  → Displayed on farmer's profile
```

---

## Live Data Sources — International Reference

| Data | Source | URL |
|---|---|---|
| Weather forecast | Open-Meteo | `open-meteo.com/v1/forecast` |
| Crop calendar (global) | FAO | `fao.org/agriculture/seed/cropcalendar` |
| Commodity prices (global) | FAO GIEWS | `fao.org/giews` |
| Commodity prices (global) | World Bank | `worldbank.org/en/research/commodity-markets` |
| Commodity prices (USA) | USDA NASS / AMS | `nass.usda.gov` / `ams.usda.gov` |
| Commodity prices (EU) | Eurostat | `ec.europa.eu/eurostat` |
| Commodity prices (Africa) | FEWS NET | `fews.net` |
| Soil map (global) | FAO / ISRIC | `soilgrids.org` |
| Agronomy guidelines | FAO publications | `fao.org/publications` |
| Crop research data | CGIAR | `cgiar.org` |
| Disease model dataset | PlantVillage | `github.com/spMohanty/PlantVillage-Dataset` |
| Govt schemes (global) | FAO country profiles | `fao.org/countryprofiles` |
| Nearest markets | Mapbox / Google Maps | `mapbox.com` / `maps.googleapis.com` |
| Government procurement | Country-specific | Resolved at runtime by country code |

---

*Document version: 2.0 | FarmIQ — CropPath Workflow (International)*
