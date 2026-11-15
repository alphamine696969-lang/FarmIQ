# FarmIQ AI Tools

Server-side tools the FarmIQ assistant and AI-integrated features can use.
Secrets never reach the browser. Every tool degrades with an honest
unavailable state when disabled (ADR-005) — results are never fabricated.

## Tool list

| Tool | Status | Where used | Configuration |
|---|---|---|---|
| **web_search** (model tool) | Implemented (ADR-019) | Assistant — model-initiated, ChatGPT-style loop | **None — keyless** (Bing News RSS + Wikipedia API); disable with `WEB_FETCH_DISABLED=1` |
| **web_fetch** (model tool) | Implemented (ADR-019) | Assistant — model reads a specific URL after searching | Same as above; SSRF-guarded page fetch |
| **Web research (direct)** | Implemented (ADR-019) | Marketplace "Latest news", Disease scanner context | Same keyless providers, called server-side |
| **LLM generation** | Implemented (ADR-009) | Assistant answers, CropPath ranking/report | `AI_API_KEY`, `AI_BASE_URL`, `AI_GENERATION_MODEL` |
| **LLM intent classification** | Implemented | Assistant layer 2 cascade | `AI_API_KEY` |
| **Vision image analysis** | Implemented (ADR-012/015) | Disease scanner, CropPath weekly photos | `AI_API_KEY`, `AI_VISION_MODEL` |
| **Embeddings + pgvector retrieval** | Boundary ready (FIQ-020) | Assistant layer 3 primary path | `AI_EMBEDDING_MODEL`, Supabase keys |
| **Translation** | Implemented | Assistant non-English turns | `GOOGLE_TRANSLATE_API_KEY` |
| **Geocoding / reverse geocoding** | Implemented (ADR-012) | Markets region, CropPath, Crop Advisor | Keyless Open-Meteo + Photon |
| **Official market prices** | Implemented (ADR-017) | Markets page | `MARKET_DATA_API_KEY` (IN) or keyless Eurostat (EU) |
| **Weather forecast** | Implemented (ADR-012) | CropPath, Crop Advisor | Keyless Open-Meteo |
| **Soil texture** | Implemented | Crop Advisor, CropPath | Keyless SoilGrids |

## How the assistant does web research (ADR-019)

Like ChatGPT/Claude, the **model itself decides** to research: the generation
request includes two OpenAI function-calling tools, and the loop is bounded to
3 LLM turns / 4 tool executions per answer.

1. `web_search(query, recent?)` — keyless discovery:
   - **Bing News RSS** (`bing.com/news/search?...&format=rss`) — current
     articles with publisher + date. Robots: `news/search` is allowed.
   - **Wikipedia search API** — encyclopedic coverage with snippets.
   - Results are **relevance-filtered** against the query (significant title
     hit, or two hits across title+snippet) so loose encyclopedia matches
     never surface; then merged, deduped by URL, capped at 8.
   - If a model emits tool calls as **text-form `<invoke>` blocks** instead of
     structured API `tool_calls`, they are parsed and executed the same way —
     and any leftover markup is stripped from the final answer (FIQ-056).
2. `web_fetch(url)` — reads a specific public page:
   - http(s) only, standard ports only, private/loopback/metadata addresses
     and `.local`/`.internal` hosts blocked (shape check + DNS check).
   - Redirects followed manually (≤3), each hop re-validated (SSRF guard).
   - 8s timeout, 2 MB body cap, HTML → readable text (scripts/styles stripped).
3. Tool results are returned to the model as clearly-labeled **untrusted data**
   messages; the final answer must cite only URLs that were actually returned.
4. Executed research items flow into the pipeline's `sources[]` cards and a
   mandatory limitation line ("researched live web results… open the linked
   sources to confirm").

### Disabled state

`WEB_FETCH_DISABLED=1` turns all web tools off (used by offline test runs);
routes and the pipeline report honest disabled messages.

## Direct (non-model) web research

- **Marketplace:** `POST /api/markets/news` resolves the user's place/GPS, then
  runs a recency-biased `web_search` for current agriculture news (10-min cache).
- **Disease scanner:** `POST /api/disease/analyze` enriches the vision prompt
  with `web_search` results for the named plant (URLs supplied only by the
  adapter — the model still cannot invent registry links; `source_ids` remain
  allowlisted to `APPROVED_SOURCES`).

## Planned / not yet wired as tools

These are **not** available to the model yet — do not claim they are:

- Live weather measurement lookup from inside chat (open Weather page)
- Live mandi price quote from inside chat (open Markets page)
- Government scheme eligibility checker
- Push notifications (FIQ-095)
- Arbitrary private-network or credential URL fetch (blocked by design — SSRF)
