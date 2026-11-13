# FarmIQ — Database Schema

This is the proposed logical schema. Inspect existing migrations before creating tables and adapt names/types where needed. All user-owned data must have enforceable ownership policies.

## Core tables

### `profiles`
- `id` UUID primary key, references the auth user.
- `display_name` nullable text.
- `country_code` nullable text.
- `region` nullable text.
- `preferred_language` text.
- `preferred_currency` text.
- `measurement_system` text.
- `role` controlled server-managed value, not user-editable for admin access.
- `created_at`, `updated_at` timestamps.

### `farms`
- `id` UUID primary key.
- `owner_id` UUID references profiles/auth user.
- `name` text.
- `country_code`, `region`, `locality` nullable text.
- `latitude`, `longitude` nullable numeric.
- `area_value` numeric and `area_unit` text.
- `created_at`, `updated_at` timestamps.

### `farm_plots`
- `id` UUID primary key.
- `farm_id` UUID references farms.
- `name` text.
- `area_value` numeric.
- `area_unit` text.
- `soil_type`, `soil_ph`, `irrigation_type` nullable fields.
- Optional geometry only if a supported mapping strategy is implemented.
- `created_at`, `updated_at` timestamps.

### `crop_cycles`
- `id`, `farm_id`, optional `plot_id`.
- `crop_code`, `variety`, `season`.
- `planting_date`, `expected_harvest_date`, nullable actual harvest date.
- `status`, notes, timestamps.

### `conversations`
- `id`, `owner_id`, title, language, timestamps.

### `messages`
- `id`, `conversation_id`, role, content, structured metadata, timestamps.
- Do not treat model output as trusted source material.

### `agricultural_sources`
- `id`, name, provider type, base URL, jurisdiction, language, license/attribution notes, enabled status, timestamps.

### `source_documents`
- `id`, `source_id`, title, canonical URL, publication date, retrieved timestamp, content hash, language, crop/topic metadata, status.

### `source_chunks`
- `id`, `document_id`, chunk index, text, metadata, optional embedding/vector.
- Store only content permitted by the source's license and terms.

### `assistant_citations`
- `id`, `message_id`, `document_id`, excerpt or section reference, citation metadata.
- Citation references must resolve to real stored documents.

### `market_observations`
- `id`, provider, source record ID, crop code, variety/grade, market name and location, country/region, price numeric, currency, quantity unit, observation timestamp, retrieval timestamp, quality/freshness metadata.
- Append observations; do not overwrite history.

### `market_watchlists`
- `id`, `owner_id`, crop code, optional market/location filters, timestamps.

### `weather_snapshots`
- `id`, optional farm ID, provider, location/coordinates, forecast or observation type, valid time, retrieved time, metrics JSON, units, resolution metadata.

### `weather_alerts`
- `id`, owner ID, optional farm/plot ID, alert type, severity, start/end times, explanation, source references, status, timestamps.

### `profit_scenarios`
- `id`, owner ID, name, currency, area value/unit, assumptions JSON or normalized relation, result snapshot, timestamps.

### `profit_scenario_items`
- Optional normalized table for multiple crops per scenario: scenario ID, crop, yield assumptions, price assumptions, cost breakdown, computed outputs.

### `crop_recommendations`
- `id`, owner ID, optional farm/plot ID, inputs, recommendations JSON, source references, algorithm/model version, created timestamp.

### `disease_assessments`
- `id`, owner ID, optional farm/plot ID, private image path, crop, location/jurisdiction, model identifier/version, candidates, confidence semantics, evidence references, limitations, created timestamp.

### `uploaded_files`
- `id`, owner ID, private storage path, MIME type, size, checksum, purpose, retention/deletion state, timestamps.

### `user_preferences`
- `owner_id`, notification preferences, language, units, timezone, timestamps.

### `feedback`
- `id`, owner ID nullable where appropriate, feature, rating, comment, created timestamp.

### `ingestion_jobs`
- `id`, source ID, status, started/finished timestamps, record counts, safe error summary.

### `audit_logs`
- `id`, actor ID, action, resource type/ID, safe metadata, timestamp.
- Do not log secrets or unnecessary sensitive content.

## Integrity and security
- Use foreign keys, constraints, indexes, and migrations.
- Use numeric/decimal types for monetary amounts and quantities where appropriate.
- Index owner IDs, foreign keys, crop codes, market locations, and observation timestamps.
- Apply RLS to user-owned records and private storage.
- Verify ownership in server-side logic as well as RLS.
- Admin roles must be assigned through trusted server-side controls.
- Define retention and deletion behavior for images and conversations.
- Never rely on client-provided owner IDs as proof of ownership.
