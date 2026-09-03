-- ============================================================
-- Fix definitivo: ocorrencias.aeroporto_id deve referenciar
-- aeroporto_rotaer.id (uuid, o campo usado pelo frontend), não
-- aeroporto_rotaer.aeroporto_id (text, era a FK original antes
-- desta migration existir). Todos os passos num script só, para
-- não repetir o problema de transações parcialmente revertidas.
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1) Garante que aeroporto_rotaer.id pode ser referenciado por FK
do $$
begin
  alter table public.aeroporto_rotaer add constraint aeroporto_rotaer_id_key unique (id);
exception when duplicate_object then null;
end $$;

-- 2) Remove a FK antiga (aponta para a coluna errada)
alter table public.ocorrencias
  drop constraint if exists ocorrencias_aeroporto_id_fkey;

-- 3) Converte o tipo da coluna de text para uuid (tabela está vazia)
alter table public.ocorrencias
  alter column aeroporto_id type uuid using nullif(aeroporto_id, '')::uuid;

-- 4) Recria a FK apontando para o lugar certo
alter table public.ocorrencias
  add constraint ocorrencias_aeroporto_id_fkey
  foreign key (aeroporto_id) references public.aeroporto_rotaer(id);
