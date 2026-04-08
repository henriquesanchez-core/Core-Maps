-- Initial schema inferred from current application code.
-- Source of truth should be your real DB, but this file documents what the app expects.

create extension if not exists pgcrypto;

-- ============================================================
-- maps
-- ============================================================
create table if not exists public.maps (
  id uuid primary key default gen_random_uuid(),
  client_username text not null,
  reference_profiles text null,
  viral_term text not null default '[]', -- TODO: migrate to jsonb
  transcription text null,
  viral_format text not null default '{}', -- TODO: migrate to jsonb
  client_data jsonb not null default '{}'::jsonb,
  references_data jsonb null,
  extracted_profile jsonb null,
  narrative text null,
  action_plan text null, -- TODO: migrate to jsonb
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Query patterns observed:
-- 1) Dashboard: ORDER BY created_at DESC LIMIT 20
create index if not exists maps_created_at_desc_idx on public.maps (created_at desc);

-- 2) Fetch/update by ID (PK already covers these access paths)
--    SELECT * FROM maps WHERE id = ?
--    UPDATE maps SET ... WHERE id = ? AND updated_at = ?

-- Optional helper index if client lookup becomes common.
create index if not exists maps_client_username_idx on public.maps (client_username);

-- ============================================================
-- tab_audios
-- ============================================================
create table if not exists public.tab_audios (
  tab_id text primary key,
  audio_url text null,
  updated_at timestamptz not null default now(),
  constraint tab_audios_tab_id_check check (
    tab_id in (
      'nucleo',
      'virais',
      'referencias',
      'headlines',
      'roteiro',
      'playbook',
      'speaker_image'
    )
  )
);

-- Query patterns observed:
-- 1) SELECT tab_id, audio_url FROM tab_audios
-- 2) SELECT/UPDATE/DELETE by tab_id (covered by PK)

-- ============================================================
-- Foreign keys
-- ============================================================
-- No FK constraints are currently implied by application code.
-- The app does not relate maps/tab_audios to another table by key yet.
