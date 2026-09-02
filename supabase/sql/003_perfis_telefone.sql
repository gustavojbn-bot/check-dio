-- ============================================================
-- Adiciona telefone ao perfil (uso futuro: notificações via WhatsApp)
-- Rode no Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.perfis add column if not exists telefone text;

-- Atualiza a trigger de criação automática de perfil para também
-- copiar o telefone, quando informado nos metadados do usuário
-- (usado pelo endpoint de cadastro de novo usuário no admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email, telefone, nivel_acesso)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    new.email,
    new.raw_user_meta_data->>'telefone',
    'visualizador'
  );
  return new;
end;
$$;
