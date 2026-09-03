-- ============================================================
-- Patch: a coluna ocorrencias.aeroporto_id já existia antes da
-- migration 005 rodar, com uma FK apontando para outro lugar (ou
-- nenhuma). Recria a constraint apontando para aeroporto_rotaer,
-- que é a tabela de aeroportos usada neste projeto.
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.ocorrencias
  drop constraint if exists ocorrencias_aeroporto_id_fkey;

alter table public.ocorrencias
  add constraint ocorrencias_aeroporto_id_fkey
  foreign key (aeroporto_id) references public.aeroporto_rotaer(id);
