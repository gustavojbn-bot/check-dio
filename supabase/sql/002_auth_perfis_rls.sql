-- ============================================================
-- Autenticação + controle de acesso por nível de usuário
-- Rode este script inteiro no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Enum com os níveis de acesso possíveis
create type public.nivel_acesso as enum ('administrador', 'operador', 'visualizador');

-- 2. Tabela de perfis, vinculada 1:1 ao usuário autenticado (auth.users)
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  nivel_acesso public.nivel_acesso not null default 'visualizador',
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

-- 3. Função auxiliar (SECURITY DEFINER) que lê o nível do usuário logado
--    sem disparar recursão de RLS ao ser usada dentro de outras policies.
create or replace function public.nivel_acesso_atual()
returns public.nivel_acesso
language sql
stable
security definer
set search_path = public
as $$
  select nivel_acesso from public.perfis where id = auth.uid()
$$;

-- 4. Trigger: cria automaticamente um perfil (nível 'visualizador' por padrão)
--    sempre que um novo usuário é criado no Supabase Auth.
--    Sem isso, um usuário recém-criado não teria perfil e ficaria sem acesso a nada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email, nivel_acesso)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    new.email,
    'visualizador'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- POLÍTICAS RLS: perfis
-- ============================================================

create policy "perfis: usuário vê o próprio perfil"
  on public.perfis for select
  using (auth.uid() = id);

create policy "perfis: administrador vê todos os perfis"
  on public.perfis for select
  using (public.nivel_acesso_atual() = 'administrador');

create policy "perfis: usuário atualiza o próprio nome"
  on public.perfis for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "perfis: administrador gerencia todos os perfis"
  on public.perfis for all
  using (public.nivel_acesso_atual() = 'administrador')
  with check (public.nivel_acesso_atual() = 'administrador');

-- ============================================================
-- POLÍTICAS RLS: aeroporto_rotaer
-- administrador: CRUD completo | operador: ler/inserir/editar | visualizador: só ler
-- ============================================================

alter table public.aeroporto_rotaer enable row level security;

create policy "aeroporto_rotaer: leitura para qualquer nível autenticado"
  on public.aeroporto_rotaer for select
  using (public.nivel_acesso_atual() is not null);

create policy "aeroporto_rotaer: inserção admin e operador"
  on public.aeroporto_rotaer for insert
  with check (public.nivel_acesso_atual() in ('administrador', 'operador'));

create policy "aeroporto_rotaer: edição admin e operador"
  on public.aeroporto_rotaer for update
  using (public.nivel_acesso_atual() in ('administrador', 'operador'))
  with check (public.nivel_acesso_atual() in ('administrador', 'operador'));

create policy "aeroporto_rotaer: exclusão apenas admin"
  on public.aeroporto_rotaer for delete
  using (public.nivel_acesso_atual() = 'administrador');

-- ============================================================
-- POLÍTICAS RLS: ocorrencias
-- mesma regra de aeroporto_rotaer
-- ============================================================

alter table public.ocorrencias enable row level security;

create policy "ocorrencias: leitura para qualquer nível autenticado"
  on public.ocorrencias for select
  using (public.nivel_acesso_atual() is not null);

create policy "ocorrencias: inserção admin e operador"
  on public.ocorrencias for insert
  with check (public.nivel_acesso_atual() in ('administrador', 'operador'));

create policy "ocorrencias: edição admin e operador"
  on public.ocorrencias for update
  using (public.nivel_acesso_atual() in ('administrador', 'operador'))
  with check (public.nivel_acesso_atual() in ('administrador', 'operador'));

create policy "ocorrencias: exclusão apenas admin"
  on public.ocorrencias for delete
  using (public.nivel_acesso_atual() = 'administrador');

-- ============================================================
-- Perfil inicial de administrador (opcional)
-- Depois de criar seu primeiro usuário (Auth > Users > Add User,
-- ou pela tela de login/cadastro), rode o comando abaixo trocando
-- o e-mail para promover esse usuário a administrador:
-- ============================================================
-- update public.perfis set nivel_acesso = 'administrador'
-- where id = (select id from auth.users where email = 'seu-email@exemplo.com');
