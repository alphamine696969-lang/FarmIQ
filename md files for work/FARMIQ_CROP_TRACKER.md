# 🌾 FarmIQ — CropPath Feature Specification

> **Suggested Feature Name: CropPath**
> *Alternative names: GrowGuide / YieldTrack / FarmPath*
>
> **Rationale:** "CropPath" communicates a personalized roadmap (path) for each crop journey — from soil to sale. It's short, memorable, and fits FarmIQ's smart-farming identity.

---

## 1. Overview

**CropPath** is FarmIQ's intelligent crop lifecycle tracker. It acts as a personal farming assistant — recommending the right crop, building a full growth roadmap, guiding the farmer week by week, adapting to real-world conditions, and closing the loop with a marketplace suggestion and profit summary when the harvest is done.

The core philosophy: **minimum input from the farmer, maximum intelligence from the AI.**

---

## 2. Feature Flow (End-to-End)

```
[Crop Recommendation] 
        ↓
[Farmer Selects Crop + Fills Field Details]
        ↓
[AI Generates Growth Roadmap]
        ↓
[Weekly Tracker Runs] ←──────────────────┐
        ↓                                │
[Farmer Submits Weekly Report]           │
        ↓                                │
[AI Analyzes + Adjusts Roadmap] ─────────┘
        ↓  (when harvest done)
[Marketplace Suggestions]
        ↓
[Final Profit & Expense Summary]
        ↓
[Tracker Completed → Receipt Generated → Badge Earned]
```

---

## 3. Phase 1 — Crop Recommendation Engine

### What It Does
Before the farmer starts a tracker, CropPath recommends the best crop for them based on:

| Input Signal | Source |
|---|---|
| Farmer's region / location | GPS or manual input |
| Current season | Auto-detected from date + location |
| Current & forecasted weather | Weather API (e.g., Tomorrow.io) |
| Farmer's intent / goal | Short onboarding question (e.g., "I want high profit", "I want low-cost crop", "I want a govt. supported crop") |
| Field size and soil type (optional) | Farmer input |

### What It Shows Per Recommended Crop

For each recommended crop, CropPath displays a **Crop Card** containing:

```
🌽 [Crop Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Why this crop?
   Short AI-generated reason (matches farmer's goal + current conditions)

🌤 Best Season:       Kharif / Rabi / Zaid
⏱ Growth Period:     90–120 days

💰 Financial Overview (per acre estimate)
   Seed Cost:         ₹X,XXX
   Fertilizer Cost:   ₹X,XXX
   Total Expense:     ₹XX,XXX
   Expected Revenue:  ₹XX,XXX
   Est. Profit:       ₹XX,XXX (XX%)

🏛 Government Benefits
   - Scheme name + brief description
   - MSP (Minimum Support Price) if applicable
   - Subsidy programs available

✅ Key Benefits
   - Benefit 1
   - Benefit 2
   - Benefit 3
```

### Crop Selection
Farmer taps **"Grow This Crop"** → proceeds to field setup.

---

## 4. Phase 2 — Field Setup

After selecting a crop, the farmer fills a simple form. Fields are kept minimal and labeled clearly.

### Required Fields

| Field | Type | Description |
|---|---|---|
| Crop Name | Auto-filled | From selection |
| Field Name | Text | e.g., "North Field", "Home Farm" |
| Area | Number + Unit | Acres / Bigha / Hectare (unit auto-set by region) |
| Variety / Seed Code | Text | e.g., "HD-2967", "Pusa Basmati 1121" |
| Sowing Date (planned) | Date Picker | When they plan to sow |
| Irrigation Type | Dropdown | Rainfed / Canal / Drip / Borewell |
| Soil Type (optional) | Dropdown | Sandy / Loam / Clay / Black / Red |
| Sector / Village | Text or GPS | Location of the field |

> **AI Tip:** Optional fields improve roadmap accuracy but are never required.

On submission → CropPath generates the full growth roadmap.

---

## 5. Phase 3 — AI Growth Roadmap

### What Is the Roadmap?
A **dynamic, week-by-week plan** for the entire crop lifecycle — from sowing to harvest.

### Roadmap Structure

Each crop is broken into **stages** (auto-defined by crop type):

```
Stage 1: Land Preparation  (Week 0)
Stage 2: Sowing            (Week 1)
Stage 3: Germination       (Week 2–3)
Stage 4: Vegetative Growth (Week 4–8)
Stage 5: Flowering         (Week 9–11)
Stage 6: Grain Filling     (Week 12–14)
Stage 7: Maturity          (Week 15–16)
Stage 8: Harvest           (Week 17–18)
```

### Per-Week Guidance Card
Each week in the roadmap shows:

```
📅 Week 4 — Vegetative Growth

🌱 What to Expect:
   Crop should show 15–20 cm height, 4–5 leaves visible.

✅ Action Items:
   • Apply first dose of Urea (25 kg/acre)
   • Check for stem borer infestation
   • Irrigate if rainfall < 20mm this week

⏰ Reminders Set:
   • Watering: Every 4 days (Wed & Sun)
   • Fertilizer: Thursday

⚠️ Weather Alert:
   Heavy rain expected Wed–Thu. Skip irrigation this week.
```

### Roadmap Intelligence
- Roadmap is **not static** — it adjusts after every weekly feedback report
- Weather API integration: alerts are embedded into weekly cards in real time
- If a disease risk or pest risk is detected (via weather patterns), a warning card is inserted

---

## 6. Phase 4 — Weekly Feedback Collection

### Feedback Philosophy
> **Simple for the farmer. Rich for the AI.**

The feedback form is designed to take **under 2 minutes** to complete.

### Weekly Report Form

```
📸 Upload 1–3 photos of your crop
   (AI analyzes growth stage, color, visible issues)

⭐ How does your crop look overall?
   [Very Good] [Good] [Average] [Worried]

🌿 Did you complete this week's actions?
   • Applied Urea?        [Yes] [No] [Partial]
   • Irrigated?           [Yes] [No]
   • Spotted any issues?  [No issues] [Some pests] [Disease] [Other]

📝 Anything else? (optional, voice or text)
```

That's it. The AI does the rest.

### What AI Does With the Report
1. Analyzes uploaded crop photos (growth stage, health, anomalies)
2. Cross-checks with the expected stage for that week
3. Checks live weather data for the field's location
4. Updates the roadmap for upcoming weeks if:
   - Crop is behind schedule → slows down roadmap
   - Disease/pest signs detected → inserts treatment steps
   - Weather disruption expected → adjusts irrigation/fertilizer timing
5. Updates all reminder notifications

---

## 7. Phase 5 — Smart Reminders & Alerts

CropPath sends automated reminders to the farmer. All reminders are crop-specific and personalized.

### Reminder Types

| Reminder | Trigger |
|---|---|
| 💧 Watering Reminder | Scheduled based on crop + weather (skipped if rain expected) |
| 🧪 Fertilizer Reminder | Tied to growth stage timing |
| 🐛 Pest Alert | Triggered by weather conditions or report analysis |
| 📸 Weekly Report Due | Every 7 days (or set period) |
| ⚠️ Weather Warning | Frost, heavy rain, heatwave — crop impact explained |
| 🏁 Harvest Window | Notifies when crop is approaching maturity |

---

## 8. Phase 6 — Harvest & Marketplace Suggestions

When the roadmap enters the **Harvest Stage**, CropPath activates the marketplace module.

### What It Shows

```
🎉 Your crop is ready to harvest!

📦 Selling Options for [Crop Name]

1. 🏛 Government Mandi (Nearest)
   📍 [Mandi Name] — [X km away]
   💰 Current MSP Rate: ₹2,275/quintal
   📅 Next Arrival Window: Mon–Wed

2. 🏪 Private Buyer / Commission Agent
   📍 [Name] — [X km away]
   💰 Offered Rate: ₹2,320/quintal (Est.)

3. 🌐 Online Platform
   Platform: [e-NAM / Fasal / Other]
   💰 Rate: ₹2,340/quintal
   📦 Requires: Grade A sorting, 14% moisture

✅ Recommendation:
   Based on current rates and your location, 
   [Government Mandi Name] offers the best net return 
   after transport cost.
```

**Data sources:** Government mandi APIs (Agmarknet), e-NAM, local price feeds, geocoding for nearest markets.

---

## 9. Phase 7 — Final Summary & Receipt

After harvest is confirmed, CropPath generates the **complete tracker receipt**.

### Tracker Summary Card

```
✅ CropPath Tracker — Completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Crop:            Wheat (HD-2967)
Field:           North Field
Area:            2 Acres
Duration:        Nov 1, 2026 → Apr 5, 2027 (156 days)

━━━━━ EXPENSES ━━━━━
Seed Cost:       ₹3,200
Fertilizer:      ₹4,800
Irrigation:      ₹1,200
Pesticides:      ₹1,500
Labor:           ₹6,000
Other:           ₹800
─────────────────────
Total Cost:      ₹17,500

━━━━━ REVENUE ━━━━━
Yield:           24 Quintals
Sold at:         ₹2,275/quintal
Total Revenue:   ₹54,600

━━━━━ PROFIT ━━━━━
Net Profit:      ₹37,100
ROI:             212%
Per Acre Profit: ₹18,550

━━━━━ GOVERNMENT BENEFITS AVAILED ━━━━━
PM-KISAN Installment:  ₹2,000
Fertilizer Subsidy:    ₹850

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Receipt saved to your records
🏅 Badge Earned: "Wheat Grower — Season 1"
```

This receipt is saved permanently in the farmer's profile under **My Receipts**.

---

## 10. Gamification — Badges

After every completed tracker, the farmer earns a **crop badge** — a simple but meaningful reward system to encourage consistent use.

### Badge Examples

| Badge | Condition |
|---|---|
| 🌾 First Harvest | Complete first CropPath tracker |
| 🌽 Corn Master | Complete 3 corn crop cycles |
| 💰 Profit Champion | Achieve >200% ROI on any crop |
| 🌧 Weather Warrior | Complete a tracker during a major weather event |
| 📸 Diligent Farmer | Submit all weekly reports on time |
| 🏆 Season Pro | Complete 5 trackers in one year |

Badges are displayed on the farmer's **profile page** and can be shared.

---

## 11. AI Intelligence Layer — Summary

| Capability | When It Runs |
|---|---|
| Crop recommendation | On feature entry |
| Roadmap generation | After field setup |
| Weekly plan update | After each weekly report |
| Photo crop analysis | On report photo upload |
| Weather-aware alerts | Real-time (daily check) |
| Marketplace matching | At harvest stage |
| Profit calculation | On tracker completion |

**Weather Integration:** Tomorrow.io (or equivalent) — daily weather data pull per field location, embedded into roadmap adjustments and reminder logic.

**AI Models Used:**
- Claude API — roadmap generation, report analysis, recommendations
- Vision model — crop photo analysis (PlantVillage / Google Vision)
- RAG layer — government schemes, MSP data, agronomy knowledge base

---

## 12. Data Privacy & Farmer Trust

- All field data is stored per farmer account — private and not shared
- Photos uploaded in weekly reports are used only for that tracker's AI analysis
- Location is used only for weather + nearest market suggestions
- No data is sold or shared with third parties

---

## 13. Future Enhancements (v2 Roadmap)

- **Multi-field tracking:** Run multiple CropPath trackers in parallel
- **Community benchmarking:** Anonymous comparison — how your crop performs vs. nearby farmers
- **Input cost optimizer:** AI suggests cheapest seed/fertilizer suppliers near you
- **Loan & insurance module:** Suggest crop insurance and KCC loan options based on crop selected
- **Voice-first mode:** Entire CropPath usable via voice in regional languages

---

*Document version: 1.0 | FarmIQ — CropPath Feature Spec*
