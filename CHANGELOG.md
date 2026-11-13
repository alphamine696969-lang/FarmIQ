# Changelog

All notable changes to FarmIQ should be documented here. Follow a simple Keep a Changelog style and use dates where practical.

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
