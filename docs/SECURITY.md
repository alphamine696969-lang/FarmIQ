# FarmIQ — Security and Privacy

## Security principles
- Least privilege.
- Server-side authorization for protected operations.
- Row Level Security for user-owned database records.
- Private storage for uploaded images.
- Secrets never exposed to browsers.
- Input validation at trust boundaries.
- Minimal personal-data collection.
- Transparent consent and retention.

## Authentication and authorization
- Use the selected auth provider's supported session mechanisms.
- Protect application routes and API operations.
- Check resource ownership on every read, update, and delete.
- Apply RLS to user-owned tables and private storage.
- Do not accept a client-provided user ID or role as proof of identity.
- Admin roles must be assigned through trusted server-side procedures.

## Secrets
- Keep provider keys in server-only environment variables.
- Never commit real credentials.
- Do not expose service-role keys through `NEXT_PUBLIC_*` variables.
- Rotate any credential accidentally committed or exposed.
- Do not include secrets in logs, error messages, screenshots, or client bundles.

## Input and upload security
- Validate request schemas, ranges, units, and file sizes.
- Verify image content rather than trusting filename extensions alone.
- Use private storage and time-limited access URLs when needed.
- Apply rate limits to AI, image, and provider-intensive endpoints.
- Restrict server-side ingestion to approved domains and destinations.
- Protect against SSRF, injection, XSS, CSRF where applicable, and malicious files.

## AI security
- Treat user input, model output, and retrieved documents as untrusted.
- Do not allow retrieved content to override system rules.
- Validate citations against retrieved documents.
- Never allow the model to execute arbitrary tools or SQL.
- Apply stricter rules to chemical treatment and safety-sensitive guidance.
- Avoid logging full conversations unless needed and appropriately disclosed.

## Privacy
- Request location only when needed and with user consent.
- Allow manual location entry.
- Collect only necessary profile and farm data.
- Define deletion and retention policies for images, conversations, and account data.
- Provide appropriate account data export/deletion workflows.
- Avoid sharing identifiable farmer data with external providers unless necessary and disclosed.
- Review provider terms and data processing policies.

## Incident response
Document how to revoke keys, disable a provider, contain unauthorized access, review logs, notify responsible parties, and restore service. Never claim compliance with a legal or security standard without an appropriate assessment.
