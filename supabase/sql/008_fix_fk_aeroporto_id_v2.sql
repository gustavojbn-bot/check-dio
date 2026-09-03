-- ============================================================
-- Patch v2: garante que aeroporto_rotaer.id tem uma constraint
-- UNIQUE (pré-requisito do Postgres para ser referenciada por uma
-- foreign key) antes de recriar a FK de ocorrencias.aeroporto_id.
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================================

do $$
begin
  alter table public.aeroporto_rotaer add constraint aeroporto_rotaer_id_key unique (id);
exception when duplicate_object then null;
end $$;

alter table public.ocorrencias
  drop constraint if exists ocorrencias_aeroporto_id_fkey;

alter table public.ocorrencias
  add constraint ocorrencias_aeroporto_id_fkey
  foreign key (aeroporto_id) references public.aeroporto_rotaer(id);
