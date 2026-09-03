-- ============================================================
-- Patch v3: ocorrencias.aeroporto_id já existia como TEXT (schema
-- antigo), não UUID — por isso a FK não podia ser criada. Tabela
-- está vazia (0 linhas), então converter o tipo é seguro.
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.ocorrencias
  alter column aeroporto_id type uuid using aeroporto_id::uuid;

alter table public.ocorrencias
  drop constraint if exists ocorrencias_aeroporto_id_fkey;

alter table public.ocorrencias
  add constraint ocorrencias_aeroporto_id_fkey
  foreign key (aeroporto_id) references public.aeroporto_rotaer(id);
