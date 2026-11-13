# 🤖 FarmIQ — AI Chatbot Pipeline

> **Purpose:** Full technical specification for the FarmIQ AI chatbot's request pipeline — from the moment the user types a message to the moment a verified, domain-locked answer is returned.
>
> **Goal:** Responses must be grounded 100% in FarmIQ's knowledge base, consistent across all models, and never answer outside the farming/FarmIQ domain.

---

## 1. Architecture Overview

```
User Message
     │
     ▼
[1. Input Guard]          — Block off-topic / harmful input before any LLM call
     │
     ▼
[2. Intent Classifier]    — Fast lightweight model: what does the user want?
     │
     ├──► [3a. RAG Retriever]       — Semantic search over FarmIQ knowledge base
     │          │
     │          ▼
     │    [3b. Context Assembly]    — Build grounded prompt with retrieved chunks
     │
     ▼
[4. Generation Layer]     — LLM API with locked system prompt
     │
     ▼
[5. Output Guard]         — Validate answer stays in domain, no hallucination
     │
     ▼
[6. Response Streamed]    — Typed, cited, grounded answer to user
     │
     ▼
[7. Logging & Eval]       — Every turn logged for quality tracking
```

---

## 2. Layer 1 — Input Guard

**What it does:** Runs before any expensive LLM call. Rejects or redirects bad input immediately.

### Rules

| Check | Action |
|---|---|
| Message is empty or < 2 chars | Return: "Please type your question." |
| Message is off-topic (politics, general AI, etc.) | Return: canned "I can only help with farming topics" response |
| Message length > 2000 chars | Trim to 2000 or return error |
| Prompt injection patterns detected | Block and log |
| Language detected → non-English | Pass to translation layer first (DeepL / Google Translate API) |

### Off-Topic Detection (fast, no LLM)

Use a **keyword blocklist + embedding similarity check** against a set of known off-topic examples:

```typescript
// Pseudocode — run before LLM
const OFF_TOPIC_EXAMPLES = [
  "who is the president",
  "write me a poem",
  "stock market",
  "code a website"
];

// Embed the user message
// Compute cosine similarity vs off-topic examples
// If similarity > 0.82 → reject as off-topic

// Also check: is there ANY farming-related keyword?
const FARMING_KEYWORDS = [
  "crop", "soil", "fertilizer", "seed", "harvest", "irrigation",
  "pest", "disease", "weather", "mandi", "yield", "livestock",
  "farmiq", "sowing", "kharif", "rabi"
];
```

**Source:** <https://platform.anthropic.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations>

---

## 3. Layer 2 — Intent Classifier

**What it does:** Routes the user message to the right pipeline before retrieval.

### Why a Classifier Instead of One Giant Prompt?

A single mega-prompt with all possible answer types fails in production — it causes context bleed, slower responses, and lower accuracy. Instead, classify first, then route to a specialized pipeline.

**Source:** <https://blog.gopenai.com/intent-routing-for-ai-agents-e075d64da6c9>

### Intent Categories for FarmIQ

| Intent Label | Example User Query | Routes To |
|---|---|---|
| `crop_advice` | "What is the best crop for March in Punjab?" | RAG → Crop knowledge base |
| `disease_diagnosis` | "My wheat leaves are turning yellow" | RAG → Disease & pest knowledge base |
| `weather_query` | "Will it rain this week in Ludhiana?" | Weather API (Tomorrow.io) |
| `price_query` | "What is today's tomato price in mandi?" | Price API (Agmarknet / e-NAM) |
| `scheme_query` | "Which government scheme is for wheat farmers?" | RAG → Government schemes knowledge base |
| `croppath_query` | "How do I set up a crop tracker?" | RAG → CropPath feature docs |
| `general_farming` | "When should I irrigate my paddy?" | RAG → General agronomy knowledge base |
| `off_topic` | "What is ChatGPT?" | Blocked — canned response |

### Classifier Implementation

Use a **small, fast model** (lightweight classifier LLM) — not the full generation model. This saves cost and adds ~100ms latency max.

```typescript
const intentSystemPrompt = `
You are a routing classifier for FarmIQ, an AI farming assistant.
Classify the user's message into exactly one of these categories:
crop_advice | disease_diagnosis | weather_query | price_query | 
scheme_query | croppath_query | general_farming | off_topic

Return ONLY the category label. No explanation. No punctuation.
If the message has any farming or agriculture relevance, do NOT classify as off_topic.
`;

const intent = await classifyIntent(userMessage); // returns one label
```

**Confidence gate:** If classification confidence is below threshold → route to `general_farming` as safe fallback, not off_topic.

---

## 4. Layer 3 — RAG Retriever

### 4a. Knowledge Base Structure

FarmIQ's knowledge base is chunked, embedded, and stored in **Supabase + pgvector**.

| Knowledge Base | Contents |
|---|---|
| `kb_crops` | Crop profiles: season, soil, yield, varieties, cost, care |
| `kb_diseases` | Pest and disease profiles: symptoms, treatment, prevention |
| `kb_schemes` | Government schemes: PM-KISAN, MSP, subsidies, KCC, insurance |
| `kb_agronomy` | Irrigation, fertilizer schedules, soil prep guides |
| `kb_markets` | Mandi info, e-NAM guides, selling tips |
| `kb_farmiq` | FarmIQ feature docs: CropPath, calculators, disease scanner |

**Source — pgvector setup:**
<https://docs.vectorize.io/integrations/vector-databases/supabase>

### 4b. Embedding Model

Use **OpenAI `text-embedding-3-small`** (1536-dimensional vectors) for all document chunks and query embeddings.

- Small: cost-efficient
- Strong: outperforms ada-002 on most retrieval benchmarks
- Compatible with pgvector cosine similarity search

**Chunk size:** 500–900 tokens per chunk, 100-token overlap.

### 4c. Retrieval SQL (Supabase RPC)

```sql
-- pgvector similarity search
CREATE OR REPLACE FUNCTION match_farmiq_docs(
  query_embedding vector(1536),
  knowledge_base text,
  match_threshold float DEFAULT 0.72,
  match_count int DEFAULT 5
)
RETURNS TABLE (content text, source text, similarity float)
AS $$
  SELECT content, source, 1 - (embedding <=> query_embedding) AS similarity
  FROM farmiq_knowledge
  WHERE kb_name = knowledge_base
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

**Threshold:** 0.72 minimum similarity. Below this → no relevant docs found → trigger "I don't know" path.

### 4d. Hybrid Retrieval (optional, v2)

For complex queries, combine:
- **Dense retrieval** — pgvector cosine similarity (semantic)
- **Sparse retrieval** — PostgreSQL full-text search (keyword)
- **Merge results** with Reciprocal Rank Fusion (RRF)

This handles cases where a farmer asks something very specific (e.g., an exact scheme name) that semantic search alone might miss.

---

## 5. Layer 3b — Context Assembly

**What it does:** Builds the final prompt that goes to the generation model.

### Rules for Context Assembly

1. Take top-K retrieved chunks (K = 4–5 by default)
2. Sort by similarity score descending
3. Format each with its source label
4. Include conversation history (last 4 turns max, to control token cost)
5. Inject into the system prompt template

### Prompt Template

```
SYSTEM:
You are FarmIQ's AI assistant — a trusted farming advisor built specifically 
for farmers. You ONLY answer questions using the context provided below.

Rules you must always follow:
1. ONLY use information from the <context> block. Never use outside knowledge.
2. If the context does not contain enough information to answer, say:
   "I don't have enough information to answer that right now."
3. Never mention the underlying AI model or provider name.
   You are the FarmIQ Assistant.
4. Never answer political, general knowledge, or non-farming questions.
5. Always cite which knowledge source your answer comes from, e.g. [Crop Profiles].
6. Answer in the same language the user wrote in.
7. Be concise, practical, and farmer-friendly. No jargon without explanation.

<context>
[CHUNK 1 — source: kb_crops]
{chunk_1_content}

[CHUNK 2 — source: kb_schemes]
{chunk_2_content}

[CHUNK 3 — source: kb_agronomy]
{chunk_3_content}
</context>

<conversation_history>
{last_4_turns}
</conversation_history>

USER:
{user_message}
```

**Source — external knowledge restriction technique:**
<https://platform.anthropic.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations>

---

## 6. Layer 4 — Generation Layer

**What it does:** Sends the assembled prompt to the LLM and streams the response.

### Model Used

**Primary LLM** via AI API (your chosen provider).

```typescript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "your-generation-model",
    max_tokens: 1000,
    stream: true,
    system: assembledSystemPrompt,   // from Layer 3b
    messages: conversationHistory,   // includes user message
  })
});
```

### Model Consistency Rules

FarmIQ may use multiple models (e.g., a lightweight model for classification, a larger model for generation). Consistency is enforced by the **system prompt, not the model itself.** This means:

- Every model receives the same locked system prompt template
- The system prompt contains all persona, domain, and restriction rules
- Switching models does not change the chatbot's behavior or persona
- The model's identity is always "FarmIQ Assistant" — never the underlying AI brand

### Fallback Chain

```
Primary:   Generation LLM  (main generation)
Fallback:  Lightweight LLM  (if primary is rate-limited or slow)
Emergency: Cached response     (if both APIs fail — return last known answer for that intent)
```

### "I Don't Know" Gate

If retrieved chunks have similarity < 0.72 **or** context block is empty:

- **Do not call** the generation model
- Return directly: *"I don't have enough information about that right now. You can ask me about crops, diseases, government schemes, or market prices."*

This prevents the LLM from hallucinating when evidence is weak.

**Source:** <https://alpeshnakrani.com/blog/rag-chatbot-architecture/>

---

## 7. Layer 5 — Output Guard

**What it does:** Validates the generated answer before it reaches the user.

### Output Checks

```typescript
function validateOutput(response: string): ValidationResult {

  // 1. Length check
  if (response.length < 10) return { valid: false, reason: "Response too short" };

  // 2. Check for leaked system prompt
  if (response.includes("SYSTEM:") || response.includes("<context>")) {
    return { valid: false, reason: "Prompt leak detected" };
  }

  // 3. Check for off-domain claims
  const OFF_DOMAIN_SIGNALS = [
    "As an AI language model",
    "I am [any AI brand]",
    "As ChatGPT",
    "According to my training data",
    "I cannot browse the internet",
  ];
  for (const signal of OFF_DOMAIN_SIGNALS) {
    if (response.includes(signal)) {
      return { valid: false, reason: "Identity leak" };
    }
  }

  // 4. Check for extreme uncertainty (hallucination signal)
  const UNCERTAINTY_SIGNALS = ["I think", "I believe", "probably", "maybe", "I'm not sure"];
  const uncertaintyCount = UNCERTAINTY_SIGNALS.filter(s => response.includes(s)).length;
  if (uncertaintyCount >= 3) {
    return { valid: false, reason: "High uncertainty — possible hallucination" };
  }

  return { valid: true };
}
```

If validation fails → return the "I don't have enough information" fallback response.

---

## 8. Layer 6 — Response Delivery

**What it shows the user:**

1. **Status indicator** (while processing): "Checking FarmIQ knowledge base…"
2. **Streamed answer**: Typed word-by-word for better UX
3. **Source tags**: e.g., `[Source: Government Schemes]` at the bottom
4. **Suggested follow-up questions**: 2–3 auto-generated based on intent

### Response Format

```
[FarmIQ Assistant]

{Main answer — plain, practical language}

📌 Source: {kb_name}

━━━━━━━━━━━━━━━━━━━
You might also ask:
• {follow_up_1}
• {follow_up_2}
```

### Multilingual Output

If the user wrote in Hindi, Punjabi, etc. → translate input to English for retrieval → generate answer in English → translate answer back to user's language via DeepL / Google Translate API.

---

## 9. Layer 7 — Logging & Evaluation

**Every conversation turn is logged** for quality monitoring and knowledge base improvement.

### What Gets Logged

```typescript
interface TurnLog {
  turn_id: string;
  user_id: string;
  timestamp: string;
  user_message: string;
  detected_intent: string;
  retrieved_chunks: { source: string; similarity: number }[];
  model_used: string;
  response: string;
  output_valid: boolean;
  latency_ms: number;
  user_feedback?: "thumbs_up" | "thumbs_down";
}
```

### Quality Metrics to Track

| Metric | Target |
|---|---|
| Intent classification accuracy | > 92% |
| Retrieval hit rate (similarity > 0.72) | > 85% |
| Output guard pass rate | > 98% |
| Average response latency | < 3 seconds |
| User thumbs-up rate | > 80% |

Logs stored in **Supabase** (`chatbot_logs` table). Review weekly — use thumbs-down logs to identify knowledge base gaps and add missing content.

---

## 10. Full Request Lifecycle (Annotated)

```
User types: "Which crop should I grow in November in Punjab?"
     │
     ▼
[Input Guard]
  ✓ Not empty
  ✓ Not off-topic (farming keywords detected)
  ✓ Length OK
     │
     ▼
[Intent Classifier — Lightweight LLM]
  → Label: "crop_advice"
  → Confidence: 0.94
     │
     ▼
[RAG Retriever]
  → Embed query with text-embedding-3-small
  → Search kb_crops (Supabase pgvector)
  → Top 4 chunks returned (similarity: 0.89, 0.84, 0.81, 0.79)
     │
     ▼
[Context Assembly]
  → Chunks injected into system prompt
  → Last 2 turns of conversation history added
     │
     ▼
[Generation — Primary LLM]
  → Streams response
  → Cites [Crop Profiles] as source
     │
     ▼
[Output Guard]
  ✓ No prompt leak
  ✓ No identity leak
  ✓ Low uncertainty
     │
     ▼
[Response to User]
  "For November sowing in Punjab, the best crops are Wheat (HD-2967 variety)
   and Mustard. Wheat is the top Rabi crop in Punjab with an MSP of ₹2,275/quintal.
   [Source: Crop Profiles]"
     │
     ▼
[Log Turn]
  → Stored in Supabase chatbot_logs
  → Latency: 1.8s
```

---

## 11. Tech Stack Summary

| Component | Technology |
|---|---|
| Frontend | Next.js (streaming UI) |
| Backend API | Next.js API routes / Edge Functions |
| Vector DB | Supabase + pgvector |
| Embedding Model | OpenAI `text-embedding-3-small` |
| Intent Classifier | Lightweight LLM (your choice) |
| Generation Model | Primary LLM (your choice) |
| Translation | Google Translate API / DeepL |
| Weather data | Tomorrow.io API |
| Price data | Agmarknet / e-NAM API |
| Logging | Supabase (`chatbot_logs` table) |
| Monitoring | Custom dashboard (query volume, latency, feedback) |

---

## 12. What Keeps Responses Consistent Across Models

This is the most important architecture decision. Consistency does NOT depend on always using the same model. It depends on:

1. **Locked system prompt** — same template injected for every model call
2. **RAG-only answers** — model never relies on its own training data
3. **"I don't know" gate** — weak retrieval = no generation = no drift
4. **Output guard** — catches any slip through the layers
5. **Temperature = 0 or 0.1** — low randomness for factual answers

If you swap one model for another, the chatbot still behaves identically — because the prompt, retrieval, and guard layers are what define the behavior, not the model.

---

## 13. Knowledge Base Maintenance

The RAG pipeline is only as good as its knowledge base. Schedule:

| Task | Frequency |
|---|---|
| Add new government scheme docs | When schemes are announced |
| Update MSP / price data | Seasonally (Kharif / Rabi) |
| Add new crop profiles | Quarterly |
| Review thumbs-down logs | Weekly |
| Re-embed updated documents | After each update |
| Accuracy eval run (test set of 50 questions) | Monthly |

---

## 14. References

- Anthropic official docs — Reduce hallucinations:
  <https://platform.anthropic.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations>
- Anthropic official docs — Strengthen guardrails:
  <https://platform.anthropic.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency>
- Supabase pgvector integration:
  <https://docs.vectorize.io/integrations/vector-databases/supabase>
- RAG production architecture (GetWidget):
  <https://www.getwidget.dev/blog/rag-chatbot-architecture/>
- Intent routing in production:
  <https://blog.gopenai.com/intent-routing-for-ai-agents-e075d64da6c9>
- Multi-provider RAG pipeline study:
  <https://www.synapsesocial.com/papers/69e47440010ef96374d8ffcc>

---

*Document version: 1.0 | FarmIQ — AI Chatbot Pipeline Spec*
