-- ============================================================
-- Soft delete para maps
-- ============================================================
-- Antes desta migration, excluir um mapa fazia DELETE permanente.
-- Agora o app marca `deleted_at` e a listagem filtra os não-deletados,
-- tornando a exclusão recuperável.
--
-- IMPORTANTE: rode esta migration no Supabase ANTES de fazer deploy
-- do código que depende da coluna `deleted_at`.

alter table public.maps
  add column if not exists deleted_at timestamptz null;

-- A listagem filtra `deleted_at is null` ordenando por created_at desc.
-- Índice parcial mantém essa query rápida conforme a tabela cresce.
create index if not exists maps_active_created_at_idx
  on public.maps (created_at desc)
  where deleted_at is null;
