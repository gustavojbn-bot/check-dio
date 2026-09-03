-- ============================================================
-- Patch: colunas que a migration 005 presumiu já existirem em
-- public.ocorrencias, mas não existiam (titulo, tipo, descricao).
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.ocorrencias
  add column if not exists titulo text not null default '',
  add column if not exists tipo text not null default 'Ocorrência',
  add column if not exists descricao text not null default '';
