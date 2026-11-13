# FarmIQ — Local Setup

This guide is a baseline. Confirm commands and framework versions against the repository and update it when implementation is complete.

## Prerequisites
- Supported Node.js LTS version compatible with the project.
- Package manager matching the lockfile (npm, pnpm, or yarn).
- Git.
- Supabase project for authentication, database, and storage.
- Optional provider accounts for AI, weather, markets, maps, and exchange rates.

## Install
1. Clone or open the repository.
2. Inspect the package manager lockfile.
3. Install dependencies using the matching package manager.
4. Copy `.env.example` to `.env.local`.
5. Fill in the credentials required for the features being tested.

Example with npm, only if the project uses npm:
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment variables
Document each variable in `.env.example`. Keep real secrets in local environment configuration or the deployment secret manager. Never commit `.env.local`.

Likely configuration includes:
- Supabase URL and public/anonymous key.
- Server-only Supabase service role key if truly needed.
- AI provider API key.
- Weather provider API key.
- Market provider credentials.
- Optional map and exchange-rate provider keys.

Use the exact names required by the implemented SDKs.

## Database
1. Create a Supabase project.
2. Configure the project URL and keys.
3. Apply checked-in migrations using the project's documented migration workflow.
4. Apply RLS policies.
5. Run seed scripts only in development/test environments.
6. Verify private storage policies for uploaded images.

Do not manually change production schema without a migration.

## Run checks
Use the scripts present in `package.json`. Document actual commands for development, linting, type checking, tests, and production build.

## Provider setup
Each provider guide should state:
- Account/approval prerequisites.
- Credential name.
- Required scopes or permissions.
- Geographic and crop coverage.
- Rate limits and costs where known.
- How to test the integration.
- Expected fallback when unconfigured.

## Troubleshooting
- Missing environment variable: check spelling and restart the dev server.
- Authentication redirect failure: verify configured site URL and redirect URLs.
- RLS denial: verify ownership and policies; do not disable RLS as a workaround.
- Provider errors: inspect safe server logs and provider status; do not expose keys.
