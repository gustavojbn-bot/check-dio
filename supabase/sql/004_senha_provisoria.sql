-- ============================================================
-- Marca usuários criados pelo admin como "senha provisória",
-- obrigando a troca de senha no primeiro acesso ao sistema.
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.perfis add column if not exists senha_provisoria boolean not null default false;
