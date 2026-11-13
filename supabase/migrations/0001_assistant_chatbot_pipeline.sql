-- FarmIQ assistant chatbot pipeline schema.
-- Implements pipeline spec sections 4 (pgvector retrieval) and 9 (logging).
--
-- Status: PENDING. This migration cannot be applied until FIQ-020 configures a
-- Supabase project and service role key. Until then the pipeline runs on the
-- local in-memory knowledge index and the in-memory turn log (ADR-008).
--
-- Documents must be chunked and embedded with OpenAI text-embedding-3-small
-- (1536 dimensions) by the ingestion job before match_farmiq_docs returns rows.

create extension if not exists vector;

-- Approved knowledge-base chunks (spec section 4a).
create table if not exists public.farmiq_knowledge (
  id bigint generated always as identity primary key,
  kb_name text not null
    check (kb_name in ('kb_crops', 'kb_diseases', 'kb_schemes', 'kb_agronomy', 'kb_markets', 'kb_farmiq')),
  content text not null,
  source text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists farmiq_knowledge_embedding_idx
  on public.farmiq_knowledge using hnsw (embedding vector_cosine_ops);

-- Similarity search RPC used by lib/services/assistant/retriever.ts.
create or replace function public.match_farmiq_docs(
  query_embedding vector(1536),
  knowledge_base text,
  match_threshold float default 0.72,
  match_count int default 5
)
returns table (content text, source text, similarity float)
language sql
stable
as $$
  select k.content, k.source, 1 - (k.embedding <=> query_embedding) as similarity
  from public.farmiq_knowledge k
  where k.kb_name = knowledge_base
    and 1 - (k.embedding <=> query_embedding) > match_threshold
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

-- Every conversation turn for quality monitoring (spec section 9).
create table if not exists public.chatbot_logs (
  turn_id text primary key,
  user_id text not null default 'anonymous',
  timestamp timestamptz not null,
  user_message text not null,
  detected_intent text not null,
  retrieved_chunks jsonb not null default '[]'::jsonb,
  model_used text not null,
  response text not null,
  output_valid boolean not null,
  latency_ms integer not null,
  user_feedback text check (user_feedback in ('thumbs_up', 'thumbs_down'))
);

create index if not exists chatbot_logs_timestamp_idx
  on public.chatbot_logs (timestamp desc);

create index if not exists chatbot_logs_intent_idx
  on public.chatbot_logs (detected_intent);

-- Service-role only: the pipeline writes and reads from the server; no anon access.
alter table public.farmiq_knowledge enable row level security;
alter table public.chatbot_logs enable row level security;
