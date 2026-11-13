# FarmIQ — UI/UX Guide

## Brand
**FarmIQ** — **Grow Smarter. Earn Better.**

The product should feel like a premium global agricultural intelligence service: modern, calm, credible, practical, and accessible.

## Design tokens
- Forest green: `#123D2B`
- Primary green: `#218653`
- Fresh lime: `#B8E986`
- Warm off-white: `#F7F8F2`
- White: `#FFFFFF`
- Dark text: `#17231D`
- Secondary text: `#68766C`
- Border: `#E3E9E0`
- Warning: `#E9A23B`
- Error: `#D94C4C`

Use a clean sans-serif font such as Inter or Manrope. Use consistent spacing, radii, and typography. Keep shadows subtle and reserve strong color for actions or meaningful status.

## Principles
- Design mobile-first for farmers using varied devices and connectivity.
- Prioritize clarity over decoration.
- Use plain language and explain unfamiliar agronomic terms.
- Show units, timestamps, geography, and source details near relevant data.
- Distinguish live, cached, stale, sample, and unavailable data.
- Never rely on color alone to communicate status.
- Support keyboard navigation, visible focus, semantic HTML, and readable contrast.
- Respect reduced-motion preferences.
- Provide clear empty, loading, success, and error states.

## Public website
- `/`: value proposition, product preview, seven feature cards, trust/source section, global coverage, CTA.
- `/features`: capability overview.
- `/how-it-works`: user journey and evidence workflow.
- `/about`: mission and scope.
- `/sources`: source policy, citations, freshness, limitations.
- `/privacy`, `/terms`: reviewed legal pages; do not invent legal claims.
- `/login`, `/signup`: accessible authentication screens.

## Application navigation
- Dashboard
- AI Assistant
- Markets
- Profit Calculator
- Crop Advisor
- Disease Scanner
- Weather
- Farms
- History
- Settings

Admin navigation must only appear for authorized administrators.

## Core components
- App shell and responsive sidebar.
- Top bar with farm and language selectors.
- Metric card.
- Source/citation card.
- Data freshness badge.
- Empty state.
- Error state with retry where appropriate.
- Loading skeleton.
- Search and filter controls.
- Accessible chart container with textual summary.
- Confirm-delete dialog.
- Form field with label, helper text, and error message.

## Data presentation
Charts must use actual retrieved observations or explicitly labeled sample data. Show chart date ranges and units. Tables should expose source and observation timestamps. Explain unavailable data rather than rendering fabricated placeholders.

## Landing page hero
Headline: **Know Your Farm. Grow Your Future.**
Supporting text: “From crop diseases and unpredictable weather to market prices and farm profits, FarmIQ brings trusted agricultural intelligence together in one powerful platform.”
Primary CTA: Explore FarmIQ.
Secondary CTA: See How It Works.

## Accessibility and localization
Aim for WCAG 2.2 AA. Avoid text embedded in images where possible. Support translation expansion and longer strings. Format dates, currencies, numbers, and measurements using locale-aware utilities.
