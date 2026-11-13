# FarmIQ — Project Overview

## Summary
FarmIQ is a global smart-farming web platform combining agricultural information, market intelligence, farm economics, crop suitability guidance, crop-health image assessment, and weather alerts in one multilingual experience.

**Tagline:** Grow Smarter. Earn Better.

## Problem
Farmers often have to consult separate services for agronomic guidance, crop prices, weather, and financial planning. Information may be difficult to find in a farmer's language, regional sources may be fragmented, and generic AI responses can be unsupported or unsafe.

## Product goals
- Make reliable agricultural information easier to access.
- Show the source, date, geography, and limitations of important data.
- Help farmers compare crop economics using transparent assumptions.
- Surface market and weather information from configured providers.
- Offer multilingual interaction with clear fallbacks.
- Support multiple farms and plots per user.
- Build user trust through traceability, uncertainty communication, and privacy.

## Primary users
- Small and medium-sized farmers.
- Commercial farms and agricultural businesses.
- Agricultural cooperatives.
- Agricultural consultants and extension workers.
- Researchers and agricultural organizations.

## Core capabilities
1. AI agricultural assistant grounded in an approved knowledge base.
2. Crop market prices, comparisons, and historical observations.
3. Farm profit and break-even calculator.
4. Crop suitability and trend advisor.
5. Image-assisted crop disease and symptom assessment.
6. Weather forecasts and agriculture-relevant alerts.
7. Globalization, localization, and multi-farm management.

## Non-goals for the initial release
- Guaranteeing crop yields, profits, or market outcomes.
- Replacing a qualified agronomist, veterinarian, plant pathologist, or local extension officer.
- Providing unsupported pesticide dosages or universal treatment instructions.
- Claiming complete country or language coverage before it is implemented and validated.
- Building satellite analytics, IoT device control, lending, insurance underwriting, or commodity trading unless separately scoped.

## Product trust contract
Every data-driven feature must communicate:
- Where its data came from.
- When the information was observed or retrieved.
- Which geography and units it applies to.
- Whether it is live, cached, stale, sample, or unavailable.
- What assumptions and limitations affect the result.

## MVP success criteria
- A user can register, complete onboarding, and create a farm.
- Farm data persists and is private to its owner.
- Profit calculations are correct and testable.
- The assistant can answer from retrieved documents and validate citations.
- Configured weather and market providers return real data.
- Missing providers fail transparently.
- Critical flows are covered by automated tests.

## Product metrics to consider
Track activation, completed farm profiles, repeat use of calculators, successful source-backed answers, provider freshness, user feedback, and error rates. Do not collect unnecessary sensitive data.
