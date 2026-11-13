# FarmIQ — Deployment

## Environments
Maintain separate development, staging, and production environments where feasible. Keep database projects, credentials, storage, and provider keys isolated.

## Recommended deployment shape
- Next.js application on Vercel or a compatible platform.
- Managed PostgreSQL/auth/storage through Supabase or a documented equivalent.
- Provider credentials stored in the hosting platform's secret manager.
- Automated checks in CI before deployment.

## Vercel (Git integration)

FarmIQ is a standard Next.js App Router project. Vercel auto-detects the framework; no `vercel.json` is required.

### Prerequisites
- Repository pushed to GitHub (default branch `main`).
- `npm run build` succeeds locally.
- `.env.local`, `node_modules/`, `.next/`, and `*.zip` remain gitignored (never committed).

### Connect and deploy
1. Sign in at [vercel.com](https://vercel.com) with an account that has access to the GitHub repo.
2. **Add New Project** → **Import** the `FarmIQ` repository.
3. Confirm project settings (defaults are correct for this repo):
   - Framework Preset: **Next.js**
   - Build Command: `npm run build` (or Vercel default)
   - Output: managed by the Next.js plugin
   - Install Command: `npm install`
4. Add environment variables for the target environment (Production / Preview / Development), mirroring `.env.example`:
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_APP_URL` — set to the Vercel deployment URL (e.g. `https://farmiq.vercel.app`)
   - `NEXT_PUBLIC_DEMO_MODE` — `true` until live providers are configured
   - Optional when available: Supabase, AI, weather, market, maps, exchange-rate keys
5. Click **Deploy**.
6. After the first deploy, set `NEXT_PUBLIC_APP_URL` to the final production domain and redeploy if the domain changed.

### Post-deploy verification
- Open the deployment URL; landing page and public routes render.
- Hit `/api/health`.
- Confirm demo/sample data is visibly labeled (ADR-005); no sample value is presented as live.
- Configure authentication redirect URLs if Supabase auth is enabled.
- Enable Vercel Password Protection / access controls only if required by policy.

### Git-based updates
Every push to `main` triggers a Production deployment; pushes to other branches create Preview deployments. Keep secrets out of the repository — configure them only in Vercel project settings.

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
