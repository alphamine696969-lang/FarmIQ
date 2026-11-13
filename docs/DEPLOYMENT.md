# FarmIQ — Deployment

## Environments
Maintain separate development, staging, and production environments where feasible. Keep database projects, credentials, storage, and provider keys isolated.

## Recommended deployment shape
- Next.js application on Vercel or a compatible platform.
- Managed PostgreSQL/auth/storage through Supabase or a documented equivalent.
- Provider credentials stored in the hosting platform's secret manager.
- Automated checks in CI before deployment.

## Pre-deployment checklist
- [ ] Production build succeeds.
- [ ] Lint and type checks pass.
- [ ] Critical unit/integration/E2E tests pass.
- [ ] Database migrations are reviewed and tested.
- [ ] RLS and storage access policies are enabled.
- [ ] Environment variables are configured in the correct environment.
- [ ] No secrets are committed or bundled client-side.
- [ ] Authentication redirect URLs are configured.
- [ ] Provider quotas, costs, licensing, and geographic coverage are reviewed.
- [ ] Error monitoring and safe logs are configured.
- [ ] Privacy, terms, data deletion, and retention behavior are reviewed.
- [ ] Sample data cannot be mistaken for live data.
- [ ] Backups and recovery expectations are documented.

## Deployment sequence
1. Run checks in CI.
2. Deploy to staging.
3. Apply reviewed migrations using the documented migration process.
4. Verify authentication, RLS, storage, and provider health.
5. Exercise critical user flows.
6. Promote to production.
7. Monitor errors, provider freshness, and performance.

## Rollback
Document the host's rollback mechanism and migration recovery approach. Prefer backward-compatible migrations. Do not assume reverting application code automatically reverses database changes safely.

## Operations
Track provider failures, data freshness, request errors, latency, and rate-limit behavior. Logs must not contain secrets, full sensitive user prompts unless justified, or private image contents.

## Release notes
Update `CHANGELOG.md` with meaningful changes and known limitations. Report which integrations are live, configured but untested, awaiting credentials, or unavailable.
