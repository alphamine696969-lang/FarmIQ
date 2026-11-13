# FarmIQ — Master Task List

Update this file after every workflow. Use `docs/TASK_TEMPLATE.md` for substantial tasks.

## Status legend
- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`
- `NEEDS_REVIEW`

## Foundation
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-001 | P0 | Inspect repository and document existing state | None | DONE | Existing code and gaps documented |
| FIQ-002 | P0 | Establish canonical agent instructions and docs | FIQ-001 | DONE | All required docs exist and cross-link |
| FIQ-003 | P0 | Confirm stack and architecture decisions | FIQ-001 | DONE | Decisions recorded in `docs/DECISIONS.md` |
| FIQ-004 | P0 | Create setup and environment documentation | FIQ-002 | DONE | New developer can follow setup steps |

## UI
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-010 | P1 | Implement design tokens and shared UI | FIQ-002 | DONE | Consistent responsive component system |
| FIQ-011 | P1 | Implement public landing and content pages | FIQ-010 | DONE | Routes render and links work |
| FIQ-012 | P1 | Implement auth page layouts | FIQ-010 | DONE | Accessible forms and error states |

## Backend and identity
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-020 | P0 | Configure Supabase client and migrations | FIQ-003 | TODO | Migrations run successfully |
| FIQ-021 | P0 | Implement auth and protected routes | FIQ-020 | DONE | Signup/login/session flows work |
| FIQ-022 | P0 | Implement RLS and ownership tests | FIQ-020 | TODO | Cross-user access is denied |
| FIQ-023 | P1 | Implement onboarding and preferences | FIQ-021 | DONE | Data persists and is editable |

## Farm and dashboard
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-030 | P1 | Implement farm CRUD | FIQ-021, FIQ-022 | DONE | Owned farms can be managed |
| FIQ-031 | P1 | Implement plot and crop-cycle management | FIQ-030 | DONE | Records are related correctly |
| FIQ-032 | P1 | Implement personalized dashboard | FIQ-023, FIQ-030 | DONE | Real saved data or honest empty states |

## Profit calculator
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-040 | P1 | Implement tested calculation library | FIQ-002 | DONE | Formulas and edge cases pass tests |
| FIQ-041 | P1 | Build calculator UI | FIQ-040, FIQ-010 | DONE | Inputs recalculate results correctly |
| FIQ-042 | P1 | Persist and compare scenarios | FIQ-021, FIQ-040 | DONE | Scenarios are saved and private |

## AI assistant
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-050 | P1 | Build source registry and ingestion contracts | FIQ-020 | DONE | Provenance metadata is stored |
| FIQ-051 | P1 | Implement document retrieval | FIQ-050 | DONE | Relevant approved documents can be retrieved |
| FIQ-052 | P1 | Implement assistant and citation validation | FIQ-051 | DONE | Invalid citations are rejected |
| FIQ-054 | P1 | Implement layered chatbot request pipeline | FIQ-052 | DONE | All 7 pipeline layers run end-to-end with tests; unconfigured providers degrade with labeled fallbacks |
| FIQ-053 | P2 | Implement multilingual and voice enhancements | FIQ-052 | TODO | Unsupported capabilities degrade gracefully |

## Markets and weather
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-060 | P1 | Implement market provider interface | FIQ-020 | DONE | Typed adapter and safe fallback exist |
| FIQ-061 | P1 | Implement market search and trends | FIQ-060 | DONE | Real observations only; freshness shown |
| FIQ-062 | P1 | Implement weather provider interface | FIQ-020 | DONE | Typed adapter and safe fallback exist |
| FIQ-063 | P1 | Implement forecast and alert UI | FIQ-062 | DONE | Timestamped provider data and alerts |

## Crop intelligence
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-070 | P2 | Implement crop dataset ingestion | FIQ-050 | DONE | Source metadata and coverage recorded |
| FIQ-071 | P2 | Implement transparent crop recommendations | FIQ-070 | DONE | Reasoning and limitations visible |
| FIQ-072 | P2 | Implement secure disease image upload | FIQ-020 | DONE | Upload validation and private storage |
| FIQ-073 | P2 | Implement supported vision analysis | FIQ-072 | DONE | Actual configured model and safe fallback |
| FIQ-074 | P2 | Implement treatment evidence safeguards | FIQ-073 | DONE | No unverified dosage advice |

## Quality and launch
| ID | Priority | Task | Dependencies | Status | Acceptance criteria |
|---|---|---|---|---|---|
| FIQ-080 | P0 | Establish test and CI commands | FIQ-002 | DONE | Checks documented and repeatable |
| FIQ-081 | P0 | Run security and authorization review | Core features | TODO | Findings fixed or documented |
| FIQ-082 | P1 | Complete end-to-end critical flows | Core features | DONE | Critical journeys pass |
| FIQ-083 | P1 | Verify production configuration | FIQ-080 | DONE | Deployment checklist completed |
| FIQ-084 | P1 | Deploy to Vercel via Git integration | FIQ-083 | IN_PROGRESS | Live Vercel URL serving the app; env vars set in dashboard |

## Task update rules
- Do not mark a task `DONE` until acceptance criteria are verified.
- Mark tasks `BLOCKED` when external credentials, approvals, or data access are required.
- Note the blocking dependency and safe fallback.
- Keep this file synchronized with the actual repository state.
