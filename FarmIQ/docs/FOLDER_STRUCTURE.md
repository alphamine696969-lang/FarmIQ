# FarmIQ — Folder Structure

Adapt this layout to the current repository rather than creating duplicate or competing structures.

```text
/
├── AGENTS.md
├── CLAUDE.md
├── .cursorrules
├── TASKS.md
├── CHANGELOG.md
├── .env.example
├── README.md
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── FOLDER_STRUCTURE.md
│   ├── CODING_STANDARDS.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPEC.md
│   ├── AI_MODELS.md
│   ├── UI_UX_GUIDE.md
│   ├── ROADMAP.md
│   ├── TASK_TEMPLATE.md
│   ├── DECISIONS.md
│   ├── TESTING.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   └── GLOSSARY.md
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (app)/
│   └── api/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   └── features/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validators/
│   ├── calculations/
│   ├── services/
│   ├── integrations/
│   │   ├── ai/
│   │   ├── markets/
│   │   ├── weather/
│   │   ├── agriculture/
│   │   └── vision/
│   └── utils/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── public/
```

## Conventions
- Route-specific components stay near their route unless reused.
- Shared UI primitives belong in `components/ui`.
- Business logic belongs in `lib/calculations` or `lib/services`, not in presentational components.
- Provider-specific code belongs in `lib/integrations/<provider-category>`.
- Shared request and response schemas belong in `lib/validators` or a documented contracts directory.
- Database changes are versioned migrations.
- Tests mirror the module they cover.
- Avoid oversized catch-all files and circular imports.
