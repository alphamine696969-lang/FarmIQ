# FarmIQ — API Specification

API paths are proposed contracts. Adapt them to the chosen Next.js route-handler/server-action design, but preserve validation, authorization, and response semantics.

## Response conventions

Success:
```json
{ "data": {}, "meta": {} }
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed.",
    "requestId": "optional-safe-id"
  }
}
```

Do not expose stack traces or provider secrets. Use suitable HTTP status codes.

## Proposed endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/assistant/chat` | Submit a question and receive evidence-backed response |
| GET | `/api/assistant/conversations` | List the current user's conversations |
| GET | `/api/assistant/conversations/:id` | Retrieve an owned conversation |
| DELETE | `/api/assistant/conversations/:id` | Delete an owned conversation |
| POST | `/api/markets/search` | Search configured market observations |
| GET | `/api/markets/trends` | Retrieve available historical observations |
| POST | `/api/profit/calculate` | Validate inputs and calculate a scenario |
| POST | `/api/profit/scenarios` | Save a scenario |
| GET | `/api/profit/scenarios` | List the current user's scenarios |
| PATCH | `/api/profit/scenarios/:id` | Update an owned scenario |
| DELETE | `/api/profit/scenarios/:id` | Delete an owned scenario |
| POST | `/api/crops/recommend` | Generate evidence-backed crop suitability assessment |
| POST | `/api/disease/analyze` | Analyze a validated uploaded image |
| GET | `/api/weather/current` | Retrieve current provider data when available |
| GET | `/api/weather/forecast` | Retrieve forecast data |
| GET | `/api/weather/alerts` | Retrieve relevant alerts |
| GET | `/api/farms` | List the current user's farms |
| POST | `/api/farms` | Create a farm |
| GET | `/api/farms/:id` | Retrieve an owned farm |
| PATCH | `/api/farms/:id` | Update an owned farm |
| DELETE | `/api/farms/:id` | Delete an owned farm |
| GET | `/api/health` | Non-sensitive application health check |

## Authentication and authorization
- Require a valid session for user-owned resources.
- Enforce ownership for every read, update, and delete.
- Apply RLS to database tables and private storage.
- Admin endpoints must use trusted role checks.
- Rate-limit AI, vision, and expensive provider requests.

## Validation
Use Zod or an equivalent schema for all request bodies and query parameters. Validate units, supported crops where known, location formats, file size/type, pagination, and date ranges.

## Provider errors
Map upstream failures to safe application errors. Do not return raw provider payloads that may contain secrets or internal details. Include data freshness and source metadata in successful data responses.

## Example market response
```json
{
  "data": {
    "observations": [],
    "status": "unavailable",
    "message": "No configured provider returned data for this region."
  },
  "meta": {
    "source": null,
    "retrievedAt": null,
    "isSampleData": false
  }
}
```

## Versioning
If breaking contracts become necessary, document the migration and consider versioned paths or backward-compatible changes. Update this document whenever request or response shapes change.
