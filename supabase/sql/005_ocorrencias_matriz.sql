-- ============================================================
-- MATRIZ DE OCORRÊNCIAS
-- Portado de "Airport Ops Hub" (mesma origem Rede VOA), adaptado para
-- este projeto: RLS via nivel_acesso_atual() (em vez de has_role/user_roles),
-- aeroporto_id referenciando aeroporto_rotaer (tabela já existente aqui).
-- Rode este script inteiro no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1) Classificações
create table if not exists public.ocorrencia_classificacoes (
  id uuid not null default gen_random_uuid() primary key,
  nome text not null unique,
  descricao text not null default '',
  ordem int not null default 0,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ocorrencia_classificacoes enable row level security;
drop policy if exists "auth read classificacoes" on public.ocorrencia_classificacoes;
create policy "auth read classificacoes" on public.ocorrencia_classificacoes
  for select using (public.nivel_acesso_atual() is not null);
drop policy if exists "admin write classificacoes" on public.ocorrencia_classificacoes;
create policy "admin write classificacoes" on public.ocorrencia_classificacoes
  for all using (public.nivel_acesso_atual() = 'administrador')
  with check (public.nivel_acesso_atual() = 'administrador');

-- 2) Subclassificações
create table if not exists public.ocorrencia_subclassificacoes (
  id uuid not null default gen_random_uuid() primary key,
  classificacao_id uuid not null references public.ocorrencia_classificacoes(id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  exemplos text not null default '',
  ordem int not null default 0,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(classificacao_id, nome)
);
alter table public.ocorrencia_subclassificacoes enable row level security;
drop policy if exists "auth read subclassif" on public.ocorrencia_subclassificacoes;
create policy "auth read subclassif" on public.ocorrencia_subclassificacoes
  for select using (public.nivel_acesso_atual() is not null);
drop policy if exists "admin write subclassif" on public.ocorrencia_subclassificacoes;
create policy "admin write subclassif" on public.ocorrencia_subclassificacoes
  for all using (public.nivel_acesso_atual() = 'administrador')
  with check (public.nivel_acesso_atual() = 'administrador');

-- 3) Campos dinâmicos
do $$ begin
  create type public.ocorrencia_campo_tipo as enum ('text','textarea','select','multiselect','boolean','datetime','number');
exception when duplicate_object then null;
end $$;

create table if not exists public.ocorrencia_campos (
  id uuid not null default gen_random_uuid() primary key,
  classificacao_id uuid references public.ocorrencia_classificacoes(id) on delete cascade,
  subclassificacao_id uuid references public.ocorrencia_subclassificacoes(id) on delete cascade,
  key text not null,
  label text not null,
  tipo public.ocorrencia_campo_tipo not null default 'text',
  opcoes jsonb not null default '[]'::jsonb,
  obrigatorio boolean not null default false,
  ordem int not null default 0,
  ajuda text not null default '',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (classificacao_id is not null or subclassificacao_id is not null)
);
alter table public.ocorrencia_campos enable row level security;
drop policy if exists "auth read campos" on public.ocorrencia_campos;
create policy "auth read campos" on public.ocorrencia_campos
  for select using (public.nivel_acesso_atual() is not null);
drop policy if exists "admin write campos" on public.ocorrencia_campos;
create policy "admin write campos" on public.ocorrencia_campos
  for all using (public.nivel_acesso_atual() = 'administrador')
  with check (public.nivel_acesso_atual() = 'administrador');

-- 4) Documentos exigidos
create table if not exists public.ocorrencia_documentos (
  id uuid not null default gen_random_uuid() primary key,
  classificacao_id uuid references public.ocorrencia_classificacoes(id) on delete cascade,
  subclassificacao_id uuid references public.ocorrencia_subclassificacoes(id) on delete cascade,
  nome text not null,
  responsavel text not null default '',
  prazo_horas int,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (classificacao_id is not null or subclassificacao_id is not null)
);
alter table public.ocorrencia_documentos enable row level security;
drop policy if exists "auth read docs" on public.ocorrencia_documentos;
create policy "auth read docs" on public.ocorrencia_documentos
  for select using (public.nivel_acesso_atual() is not null);
drop policy if exists "admin write docs" on public.ocorrencia_documentos;
create policy "admin write docs" on public.ocorrencia_documentos
  for all using (public.nivel_acesso_atual() = 'administrador')
  with check (public.nivel_acesso_atual() = 'administrador');

-- 5) Auxiliares (responsáveis operacionais)
create table if not exists public.auxiliares (
  id uuid not null default gen_random_uuid() primary key,
  nome text not null,
  cpf text,
  ra text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.auxiliares enable row level security;
drop policy if exists "auth read auxiliares" on public.auxiliares;
create policy "auth read auxiliares" on public.auxiliares
  for select using (public.nivel_acesso_atual() is not null);
drop policy if exists "admin operador write auxiliares" on public.auxiliares;
create policy "admin operador write auxiliares" on public.auxiliares
  for all using (public.nivel_acesso_atual() in ('administrador','operador'))
  with check (public.nivel_acesso_atual() in ('administrador','operador'));

-- 6) Ajustes na tabela ocorrencias (cria se não existir; adiciona colunas se faltarem)
create table if not exists public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'Ocorrência',
  titulo text not null default '',
  descricao text not null default '',
  severidade text not null default 'media',
  status text not null default 'aberto',
  criado_em timestamptz not null default now()
);

alter table public.ocorrencias
  add column if not exists local text not null default '',
  add column if not exists classificacao_id uuid references public.ocorrencia_classificacoes(id),
  add column if not exists subclassificacao_id uuid references public.ocorrencia_subclassificacoes(id),
  add column if not exists aeroporto_id uuid references public.aeroporto_rotaer(id),
  add column if not exists auxiliar_id uuid references public.auxiliares(id),
  add column if not exists hora_ocorrencia timestamptz,
  add column if not exists resolvido_em timestamptz,
  add column if not exists criado_por uuid references auth.users(id),
  add column if not exists atualizado_em timestamptz not null default now(),
  add column if not exists dados jsonb not null default '{}'::jsonb,
  add column if not exists documentos_status jsonb not null default '[]'::jsonb;

-- 7) Log de exclusões (auditoria)
create table if not exists public.ocorrencias_exclusoes (
  id uuid not null default gen_random_uuid() primary key,
  ocorrencia_id uuid not null,
  justificativa text not null,
  excluido_por uuid not null references auth.users(id),
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.ocorrencias_exclusoes enable row level security;
drop policy if exists "admin read exclusoes" on public.ocorrencias_exclusoes;
create policy "admin read exclusoes" on public.ocorrencias_exclusoes
  for select using (public.nivel_acesso_atual() = 'administrador');
drop policy if exists "admin insert exclusoes" on public.ocorrencias_exclusoes;
create policy "admin insert exclusoes" on public.ocorrencias_exclusoes
  for insert with check (public.nivel_acesso_atual() = 'administrador');

-- ============================================================
-- SEED DA MATRIZ (classificações, subclassificações, campos e
-- documentos padrão da operação Rede VOA — conteúdo real, não é
-- placeholder)
-- ============================================================
do $$
declare
  c_fauna uuid; c_svoo uuid; c_acid uuid; c_solo uuid; c_incd uuid;
  c_orgp uuid; c_inc uuid; c_med uuid; c_imp uuid; c_falha uuid;
  c_exc uuid; c_infra uuid; c_avsec uuid; c_patr uuid; c_ana uuid;
  c_met uuid; c_ats uuid; c_info uuid;
  s uuid;
begin
  if exists (select 1 from public.ocorrencia_classificacoes limit 1) then
    raise notice 'ocorrencia_classificacoes já tem dados — pulando seed.';
    return;
  end if;

  -- Classificações
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Fauna','Risco decorrente da utilização do mesmo espaço por aeronave e presença de fauna (aves e outros animais).',10) returning id into c_fauna;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Segurança de Voo','Qualquer situação que ameace a integridade da aeronave ou da operação de voo.',20) returning id into c_svoo;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Acidente Aeronáutico','Ocorrência com lesões graves/fatais, danos estruturais relevantes ou aeronave desaparecida.',30) returning id into c_acid;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Ocorrência de Solo','Evento com aeronave no solo, sem intenção de voo ou relacionado a serviços de rampa.',40) returning id into c_solo;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Incidente Aeronáutico','Ocorrência que afeta ou pode afetar a segurança da operação, sem danos ou lesões graves.',50) returning id into c_incd;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Visita de Órgão Público','Presença de órgãos públicos, autoridades ou forças policiais no sítio aeroportuário.',60) returning id into c_orgp;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Incêndio','Presença de fogo, fumaça ou princípio de incêndio no sítio aeroportuário.',70) returning id into c_inc;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Operações Médicas','Atendimentos médicos, emergenciais ou transporte aeromédico.',80) returning id into c_med;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Imprensa','Presença ou atuação de profissionais de imprensa no sítio aeroportuário.',90) returning id into c_imp;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Falha de Procedimento','Desvio, erro ou descumprimento de normas ou procedimentos operacionais.',100) returning id into c_falha;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Excursão de Pista','Aeronave sai da superfície da pista (veer off ou overrun).',110) returning id into c_exc;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Infraestrutura, Equipamentos e Sistemas','Falhas em infraestrutura, equipamentos ou sistemas usados nas operações.',120) returning id into c_infra;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('AVSEC','Atos ou suspeitas de interferência ilícita contra a aviação civil.',130) returning id into c_avsec;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Segurança Patrimonial','Furto, roubo, depredação ou vandalismo no sítio aeroportuário.',140) returning id into c_patr;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Em análise','Ocorrências ainda não enquadradas nas categorias existentes.',150) returning id into c_ana;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Meteorologia','Condições meteorológicas adversas com impacto na operação.',160) returning id into c_met;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('ATS','Ocorrências relacionadas a serviços de tráfego aéreo.',170) returning id into c_ats;
  insert into public.ocorrencia_classificacoes (nome, descricao, ordem) values
    ('Informes','Situações relevantes que não configuram ocorrência operacional.',180) returning id into c_info;

  -- =========== FAUNA ===========
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_fauna, 'Avistamento', 'Animal vivo observado próximo à trajetória, sem necessidade de desvio.',
     'Ave próxima à pista; animal no pátio sem interferência; fauna na taxiway sem impacto.', 10) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'tipo_fauna','Tipo de fauna','select','["Ave pequena","Ave grande","Mamífero","Réptil","Outro"]',true,10),
    (s,'quantidade','Quantidade aproximada','number','[]',false,20),
    (s,'nivel_risco','Nível de risco percebido','select','["Baixo","Médio","Alto"]',true,30),
    (s,'comportamento','Comportamento','select','["Pousada","Voando baixo","Cruzando pista","Alimentando-se"]',false,40),
    (s,'fator_atrativo','Fator atrativo identificado','multiselect','["Lixo/resíduo","Água parada","Vegetação alta","Animais mortos","Nenhum"]',false,50),
    (s,'acao_tomada','Ação tomada','multiselect','["Afugentamento","Comunicação à torre","Comunicação com CCO","Nenhuma"]',true,60),
    (s,'acao_eficaz','A ação foi eficaz?','select','["Sim","Parcialmente","Não"]',false,70);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_fauna, 'Colisão (strike)', 'Tripulação testemunhar colisão, dano identificado, carcaça próxima à pista ou efeito significativo na operação.',
     'Tripulação reporta colisão; dano na aeronave; rejeição de decolagem por fauna.', 20) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'fase_voo','Fase do voo','select','["Táxi","Decolagem","Subida","Cruzeiro","Aproximação","Pouso"]',true,10),
    (s,'tipo_fauna','Tipo de fauna','select','["Ave pequena","Ave grande","Mamífero","Réptil","Outro"]',true,20),
    (s,'houve_dano','Houve dano aparente?','boolean','[]',true,30),
    (s,'descricao_dano','Descrição do dano','textarea','[]',false,40);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_fauna, 'Carcaça / Manejo de fauna', 'Carcaça identificada em área operacional ou adjacente.',
     'Carcaça encontrada no sítio aeroportuário e imediações.', 30) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'especie','Espécie (se possível)','text','[]',false,10),
    (s,'condicao','Condição','select','["Recente","Antiga"]',false,20),
    (s,'risco_imediato','Presença de risco imediato','boolean','[]',true,30),
    (s,'acao_remocao','Ação de remoção','textarea','[]',false,40);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_fauna, 'Quase colisão', 'Conflito exigindo ação evasiva pela tripulação ou pelo animal.',
     'Piloto desvia de ave; arremetida por presença de fauna.', 40) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'fase_voo','Fase do voo','select','["Táxi","Decolagem","Subida","Aproximação","Pouso"]',true,10),
    (s,'manobra','Tipo de manobra executada','text','[]',false,20),
    (s,'especie','Espécie (se possível)','text','[]',false,30),
    (s,'impacto_operacional','Impacto operacional','textarea','[]',false,40);

  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_fauna,'Registro de Ocorrências (Forms)','CCO',10),
    (c_fauna,'Ficha de Finalização de Ocorrência','AAL',20),
    (c_fauna,'Portal Único de Notificação','AAL',30);

  -- =========== SEGURANÇA DE VOO ===========
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_svoo,'Drone','Presença de aeronave não tripulada em área conflitante.','Drone sobrevoando próximo à pista; drone na aproximação.',10) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'altitude','Altitude aproximada','text','[]',false,10),
    (s,'distancia_pista','Distância da pista','text','[]',false,20),
    (s,'impacto','Impacto na operação','textarea','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_svoo,'Risco Baloeiro','Balão tripulado ou não tripulado em área conflitante.','Balão na aproximação final; balão cruzando área de tráfego.',20) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'quantidade_tamanho','Quantidade/tamanho','text','[]',false,10),
    (s,'direcao','Direção do deslocamento','text','[]',false,20),
    (s,'altitude','Altitude estimada','text','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_svoo,'Raio Laser','Feixe de laser direcionado à aeronave ou cabine.','Iluminação de cockpit por laser; interferência visual.',30) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'fase_voo','Fase do voo','select','["Táxi","Decolagem","Subida","Cruzeiro","Aproximação","Pouso"]',true,10),
    (s,'origem','Direção de origem','text','[]',false,20),
    (s,'duracao','Duração do evento','text','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_svoo,'FOD','Objetos estranhos na pista ou áreas de operação.','Peças metálicas na pista; ferramentas esquecidas; fragmentos.',40) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'tipo_objeto','Tipo de objeto','text','[]',true,10),
    (s,'quantidade','Quantidade','number','[]',false,20),
    (s,'necessidade_interdicao','Necessidade de interdição','boolean','[]',true,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_svoo,'Incursão de pista','Presença indevida de aeronave, veículo ou pessoa em pista em uso.','Veículo em pista sem autorização; pessoa na pista.',50) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'tipo_agente','Tipo de agente','select','["Aeronave","Veículo","Pessoa"]',true,10),
    (s,'tempo_permanencia','Tempo de permanência','text','[]',false,20),
    (s,'impacto','Impacto operacional','textarea','[]',false,30);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_svoo,'Registro de Ocorrência (Forms)','CCO',10),
    (c_svoo,'Ficha de Finalização de Ocorrência','AAL',20),
    (c_svoo,'Portal Único de Notificação','AAL',30);

  -- =========== ACIDENTE ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_acid,'modelo_aeronave','Modelo e matrícula','text','[]',true,10),
    (c_acid,'operador','Operador','text','[]',true,20),
    (c_acid,'ocupantes','Quantidade de ocupantes','number','[]',false,30),
    (c_acid,'vitimas','Existência de vítimas','boolean','[]',true,40),
    (c_acid,'condicao_aeronave','Condição da aeronave','textarea','[]',false,50),
    (c_acid,'interdicao','Interdição de área/pista','boolean','[]',true,60),
    (c_acid,'orgaos_acionados','Órgãos acionados','text','[]',false,70);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, prazo_horas, ordem) values
    (c_acid,'Registro de Ocorrência (Forms)','CCO',null,10),
    (c_acid,'Ficha de Finalização de Ocorrência','AAL',null,20),
    (c_acid,'Envio da Ficha ao Jurídico','AAL',24,30);

  -- =========== SOLO ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_solo,'tipo_equipamento','Tipo de equipamento/veículo/aeronave','text','[]',true,10),
    (c_solo,'empresa','Empresa envolvida','text','[]',true,20),
    (c_solo,'pessoas_envolvidas','Pessoas envolvidas','text','[]',false,30),
    (c_solo,'danos','Danos identificados','textarea','[]',false,40),
    (c_solo,'area_afetada','Área afetada','text','[]',false,50),
    (c_solo,'interdicao','Necessidade de interdição','boolean','[]',true,60);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, prazo_horas, ordem) values
    (c_solo,'Registro de Ocorrência (Forms)','CCO',null,10),
    (c_solo,'Ficha de Finalização de Ocorrência','AAL',null,20),
    (c_solo,'Envio da Ficha ao Jurídico','AAL',24,30);

  -- =========== INCIDENTE ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_incd,'modelo_aeronave','Modelo e matrícula','text','[]',true,10),
    (c_incd,'operador','Operador','text','[]',true,20),
    (c_incd,'fase_voo','Fase do voo','select','["Táxi","Decolagem","Subida","Cruzeiro","Aproximação","Pouso"]',true,30),
    (c_incd,'descricao','Descrição detalhada do evento','textarea','[]',true,40),
    (c_incd,'danos','Existência de danos','boolean','[]',true,50);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, prazo_horas, ordem) values
    (c_incd,'Registro de Ocorrência (Forms)','CCO',null,10),
    (c_incd,'Ficha de Finalização de Ocorrência','AAL',null,20),
    (c_incd,'Envio da Ficha ao Jurídico','AAL',24,30);

  -- =========== VISITA DE ÓRGÃO PÚBLICO ===========
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_orgp,'Força Policial e Órgão Público','PF/Receita/PC/PM/Bombeiros/ANAC/Artesp em atendimento ou fiscalização.','Atendimento da PF; fiscalização da ANAC; operação da Receita.',10) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'orgao','Órgão envolvido','text','[]',true,10),
    (s,'motivo','Motivo da presença','textarea','[]',true,20),
    (s,'chegada_saida','Horário de chegada e saída','text','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_orgp,'Autoridades Governamentais','Autoridades dos Poderes ou Forças Armadas em deslocamento oficial.','Operação presidencial; visita institucional; escolta oficial.',20) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'autoridade','Nome/cargo da autoridade','text','[]',true,10),
    (s,'orgao','Órgão representado','text','[]',false,20),
    (s,'escolta','Necessidade de escolta/protocolo especial','boolean','[]',false,30);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_orgp,'Registro de Ocorrência (Forms)','CCO',10),
    (c_orgp,'Ficha de Finalização de Ocorrência','AAL',20);

  -- =========== INCÊNDIO ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_inc,'tipo_incendio','Tipo de incêndio','select','["Aeronave","Vegetação","Instalação","Veículo","Outro"]',true,10),
    (c_inc,'vitimas','Existência de vítimas','boolean','[]',true,20),
    (c_inc,'fumaca_chamas','Fumaça ativa/chamas','boolean','[]',true,30),
    (c_inc,'interdicao','Necessidade de interdição','boolean','[]',true,40),
    (c_inc,'horario_controle','Horário de controle da ocorrência','datetime','[]',false,50);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_inc,'Registro de Ocorrência (Forms)','CCO',10),
    (c_inc,'Ficha de Finalização de Ocorrência','AAL',20),
    (c_inc,'Boletim de Ocorrência','AAL',30);

  -- =========== OPERAÇÕES MÉDICAS ===========
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_med,'Transporte Aeromédico','Transporte de paciente ou órgãos por meio aéreo.','Aeronave UTI; embarque de paciente em maca; transporte de órgão.',10) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'tipo','Tipo da operação','select','["Paciente","Órgão","Equipe médica"]',true,10),
    (s,'aeronave','Aeronave envolvida','text','[]',false,20),
    (s,'ambulancia','Necessidade de ambulância em área operacional','boolean','[]',true,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_med,'Atendimento Pré-Hospitalar (APH)','Atendimento médico de urgência em qualquer área do sítio.','Passageiro passando mal; crise convulsiva; PCR.',20) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'tipo_ocorrencia','Tipo de ocorrência médica','text','[]',true,10),
    (s,'pessoa','Pessoa(s) envolvida(s)','text','[]',false,20),
    (s,'equipe','Equipe acionada','multiselect','["Equipe médica interna","Bombeiros","SAMU","Outro"]',true,30),
    (s,'remocao','Necessidade de remoção hospitalar','boolean','[]',true,40);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_med,'Registro de Ocorrência (Forms)','CCO',10),
    (c_med,'Ficha de Finalização de Ocorrência','AAL',20);

  -- =========== IMPRENSA ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_imp,'veiculo','Veículo de imprensa','text','[]',true,10),
    (c_imp,'profissionais','Profissionais envolvidos','text','[]',false,20),
    (c_imp,'motivo','Motivo/pauta','textarea','[]',true,30),
    (c_imp,'entrevistas','Existência de entrevistas','boolean','[]',false,40),
    (c_imp,'acesso_restrito','Necessidade de acesso a área restrita','boolean','[]',false,50);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_imp,'Registro de Ocorrência (Forms)','CCO',10);

  -- =========== FALHA DE PROCEDIMENTO ===========
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_falha,'Interno (Rede Voa)','Falhas de processos executados por equipes internas da Rede VOA.','Não cumprimento de procedimento interno; falha de comunicação interna.',10) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'area','Área/equipe envolvida','text','[]',true,10),
    (s,'descricao','Descrição da falha','textarea','[]',true,20),
    (s,'medidas','Medidas adotadas','textarea','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_falha,'Externo','Falhas de operadores externos (companhias aéreas, hangares, operadores aéreos).','Companhia descumprindo procedimento; hangar sem coordenação.',20) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'empresa','Empresa/Operador','text','[]',true,10),
    (s,'descricao','Descrição da falha','textarea','[]',true,20),
    (s,'medidas','Medidas adotadas','textarea','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_falha,'Terceiros','Falhas de terceirizados (limpeza, áreas verdes, manutenção, segurança patrimonial).','Limpeza acessando área operacional; segurança deixando acesso desprotegido.',30) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'empresa','Empresa terceirizada','text','[]',true,10),
    (s,'descricao','Descrição da falha','textarea','[]',true,20),
    (s,'medidas','Medidas adotadas','textarea','[]',false,30);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_falha,'Registro de Ocorrência (Forms)','CCO',10),
    (c_falha,'Ficha de Finalização de Ocorrência','AAL',20),
    (c_falha,'Boletim de Ocorrência','AAL',30);

  -- =========== EXCURSÃO DE PISTA ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_exc,'aeronave','Aeronave (modelo e matrícula)','text','[]',true,10),
    (c_exc,'operador','Operador','text','[]',true,20),
    (c_exc,'tipo_excursao','Tipo de excursão','select','["Lateral (veer off)","Longitudinal (overrun)"]',true,30),
    (c_exc,'fase','Fase da operação','select','["Pouso","Decolagem","Táxi"]',true,40),
    (c_exc,'condicao_pista','Condição da pista','text','[]',false,50),
    (c_exc,'meteo','Condições meteorológicas','text','[]',false,60),
    (c_exc,'danos','Existência de danos','boolean','[]',true,70),
    (c_exc,'interdicao','Interdição de pista','boolean','[]',true,80);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, prazo_horas, ordem) values
    (c_exc,'Registro de Ocorrência (Forms)','CCO',null,10),
    (c_exc,'Ficha de Finalização de Ocorrência','AAL',null,20),
    (c_exc,'Envio da Ficha ao Jurídico','AAL',24,30),
    (c_exc,'Portal Único','AAL',null,40);

  -- =========== INFRAESTRUTURA ===========
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_infra,'Energia','Falhas de fornecimento ou distribuição de energia elétrica.','Queda de energia; gerador não acionou; balizamento inoperante.',10) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'sistema','Área/sistema afetado','text','[]',true,10),
    (s,'tipo_falha','Tipo de falha','text','[]',true,20),
    (s,'normalizacao','Horário de normalização','datetime','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_infra,'Equipamentos','Falhas de equipamentos operacionais.','Raio-x inoperante; esteira parada; viatura com pane; CCI inoperante.',20) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'equipamento','Equipamento afetado','text','[]',true,10),
    (s,'tipo_falha','Tipo de falha','text','[]',true,20),
    (s,'redundancia','Existência de redundância/backup','boolean','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_infra,'Sistemas','Falhas em sistemas tecnológicos e informatizados.','Internet indisponível; CFTV sem imagem; sistema fora do ar.',30) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'sistema','Sistema afetado','text','[]',true,10),
    (s,'tipo_falha','Tipo de falha','text','[]',true,20),
    (s,'tempo_indisponibilidade','Tempo de indisponibilidade','text','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_infra,'Infraestrutura','Falhas ou degradação de estruturas físicas do sítio.','Buraco na pista; alagamento; dano em cerca; vazamento.',40) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'estrutura','Estrutura afetada','text','[]',true,10),
    (s,'risco','Risco operacional associado','text','[]',false,20),
    (s,'isolamento','Necessidade de isolamento/interdição','boolean','[]',true,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_infra,'Comunicação','Falhas em meios de comunicação operacional.','Rádio inoperante; telefone fixo indisponível; interferência em canal.',50) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'meio','Meio de comunicação afetado','text','[]',true,10),
    (s,'area','Área/equipe impactada','text','[]',false,20),
    (s,'contingencia','Existência de contingência','boolean','[]',false,30);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_infra,'Registro de Ocorrência (Forms)','CCO',10),
    (c_infra,'Ficha de Finalização de Ocorrência','AAL',20);

  -- =========== AVSEC ===========
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Ameaça de Bomba','Comunicação ou identificação de ameaça relacionada a artefato explosivo.','Ligação anônima; mensagem com ameaça; passageiro afirmando estar com bomba.',10) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'meio','Meio utilizado','select','["Telefone","E-mail","WhatsApp","Verbal","Outro"]',true,10),
    (s,'conteudo','Conteúdo da ameaça','textarea','[]',true,20),
    (s,'evacuacao','Necessidade de evacuação/interdição','boolean','[]',true,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Artefato Suspeito','Objeto com características incomuns ou potencialmente perigosas.','Mochila abandonada; volume com sinais suspeitos; caixa com fios aparentes.',20) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'tipo_objeto','Tipo de objeto/volume','text','[]',true,10),
    (s,'caracteristicas','Características suspeitas','textarea','[]',true,20),
    (s,'isolamento','Existência de isolamento da área','boolean','[]',true,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Sequestro','Tomada de controle de aeronave ou instalação mediante ameaça.','Aeronave declarando situação de sequestro; interferência ilícita em voo.',30) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'aeronave','Aeronave envolvida','text','[]',true,10),
    (s,'operador','Operador/companhia aérea','text','[]',true,20),
    (s,'origem_destino','Origem/destino do voo','text','[]',false,30),
    (s,'ameaca_armada','Existência de ameaça armada','boolean','[]',true,40);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Acesso Não Autorizado (Invasão)','Entrada indevida em áreas restritas ou controladas.','Pessoa pulando cerca; veículo em área operacional sem autorização.',40) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'tipo_agente','Tipo de agente','select','["Pessoa","Veículo","Objeto"]',true,10),
    (s,'forma_acesso','Forma de acesso','text','[]',true,20),
    (s,'cftv','Existência de imagens/CFTV','boolean','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Artigos Perigosos (Itens proibidos)','Presença ou transporte de materiais proibidos.','Material inflamável no embarque; produto químico não declarado.',50) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'material','Tipo de material/objeto','text','[]',true,10),
    (s,'envolvido','Pessoa/empresa envolvida','text','[]',false,20),
    (s,'destinacao','Destinação adotada','textarea','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Volume Desacompanhado','Bagagem sem responsável identificado, sem indícios imediatos de ameaça.','Bagagem deixada no saguão; mala esquecida próxima ao check-in.',60) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'tipo_bagagem','Tipo de bagagem/volume','text','[]',true,10),
    (s,'tempo','Tempo sem responsável','text','[]',false,20),
    (s,'resultado','Resultado da verificação','textarea','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Sabotagem','Ato intencional de danificar aeronaves, sistemas ou infraestrutura.','Danificação intencional de equipamento; corte proposital de cerca.',70) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'estrutura','Estrutura/equipamento afetado','text','[]',true,10),
    (s,'tipo_dano','Tipo de dano/interferência','textarea','[]',true,20),
    (s,'cftv','Imagens/CFTV disponíveis','boolean','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Interferência Ilícita','Ação que represente ameaça à segurança da aviação civil, não enquadrada nas demais.','Credencial falsa; burlar inspeção; fotografar áreas restritas.',80) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'comportamento','Comportamento identificado','textarea','[]',true,10),
    (s,'pessoas','Pessoas envolvidas','text','[]',false,20),
    (s,'ameaca_direta','Existência de ameaça direta','boolean','[]',true,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Passageiro Indisciplinado','Comportamento inadequado, agressivo ou ameaçador de passageiro.','Agressão verbal; recusa de orientação; tumulto na área de embarque.',90) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'companhia','Companhia aérea envolvida','text','[]',true,10),
    (s,'comportamento','Descrição do comportamento','textarea','[]',true,20),
    (s,'agressao','Existência de agressão ou ameaça','boolean','[]',true,30),
    (s,'policial','Necessidade de acionamento policial','boolean','[]',false,40);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_avsec,'Transporte de Valores','Operações de transporte de valores ou cargas sensíveis.','Chegada de carro-forte; transporte de numerário com escolta.',100) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'empresa','Empresa responsável','text','[]',true,10),
    (s,'local','Local de movimentação','text','[]',false,20),
    (s,'escolta','Existência de escolta armada','boolean','[]',false,30);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_avsec,'Registro de Ocorrência (Forms)','CCO',10),
    (c_avsec,'Ficha de Finalização de Ocorrência','AAL',20),
    (c_avsec,'Boletim de Ocorrência','AAL',30);

  -- =========== SEGURANÇA PATRIMONIAL ===========
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_patr,'Furto','Subtração sem violência ou grave ameaça.','Furto de bagagem; furto de equipamento; furto em área administrativa.',10) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'bem','Bem/material subtraído','text','[]',true,10),
    (s,'responsavel','Proprietário/responsável','text','[]',false,20),
    (s,'cftv','Imagens/CFTV disponíveis','boolean','[]',false,30);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_patr,'Roubo','Subtração mediante violência, ameaça ou intimidação.','Assalto a passageiro; roubo com abordagem armada.',20) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'bem','Bem/material roubado','text','[]',true,10),
    (s,'arma','Existência de arma ou ameaça','boolean','[]',true,20),
    (s,'envolvidos','Quantidade de envolvidos','number','[]',false,30),
    (s,'vitimas','Vítimas/feridos','text','[]',false,40);
  insert into public.ocorrencia_subclassificacoes (classificacao_id, nome, descricao, exemplos, ordem) values
    (c_patr,'Depredação / Vandalismo','Dano intencional a bens, estruturas ou instalações.','Quebra proposital; pichação; corte de cerca perimetral.',30) returning id into s;
  insert into public.ocorrencia_campos (subclassificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (s,'estrutura','Estrutura/equipamento afetado','text','[]',true,10),
    (s,'tipo_dano','Tipo de dano','textarea','[]',true,20),
    (s,'suspeito','Suspeito identificado','text','[]',false,30);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_patr,'Registro de Ocorrência (Forms)','CCO',10),
    (c_patr,'Ficha de Finalização de Ocorrência','AAL',20),
    (c_patr,'Boletim de Ocorrência','AAL',30);

  -- =========== EM ANÁLISE ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_ana,'descricao','Descrição detalhada','textarea','[]',true,10),
    (c_ana,'envolvidos','Pessoas/equipes envolvidas','text','[]',false,20),
    (c_ana,'medidas','Medidas adotadas inicialmente','textarea','[]',false,30),
    (c_ana,'reclassificar','Necessidade de reclassificação posterior','boolean','[]',false,40);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_ana,'Registro de Ocorrência (Forms)','CCO',10),
    (c_ana,'Ficha de Finalização de Ocorrência','AAL',20);

  -- =========== METEOROLOGIA ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_met,'fenomeno','Fenômeno identificado','select','["Chuva Intensa / Alagamento","Ventos Fortes","Descarga Atmosférica","Baixa Visibilidade","Outro"]',true,10),
    (c_met,'inicio_fim','Horário de início/fim','text','[]',false,20),
    (c_met,'danos','Existência de danos','boolean','[]',true,30),
    (c_met,'suspensao','Necessidade de suspensão/interdição','boolean','[]',true,40);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_met,'Registro de Ocorrências (Forms)','CCO',10),
    (c_met,'Ficha de Finalização de Ocorrência','AAL',20);

  -- =========== ATS ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_ats,'orgao','Órgão ATS envolvido','select','["APP","ACC","TWR","AFIS","DECEA","Outro"]',true,10),
    (c_ats,'tipo','Tipo da ocorrência/restrição','text','[]',true,20),
    (c_ats,'motivo','Motivo informado','textarea','[]',false,30),
    (c_ats,'suspensao','Suspensão de pousos/decolagens','boolean','[]',true,40),
    (c_ats,'voos_impactados','Quantidade estimada de voos impactados','number','[]',false,50);
  insert into public.ocorrencia_documentos (classificacao_id, nome, responsavel, ordem) values
    (c_ats,'Registro de Ocorrências (Forms)','CCO',10),
    (c_ats,'Ficha de Finalização de Ocorrência','AAL',20);

  -- =========== INFORMES ===========
  insert into public.ocorrencia_campos (classificacao_id, key, label, tipo, opcoes, obrigatorio, ordem) values
    (c_info,'tipo','Tipo de informe','text','[]',true,10),
    (c_info,'origem','Origem da informação','text','[]',true,20),
    (c_info,'impacto','Possível impacto operacional','textarea','[]',false,30),
    (c_info,'preventiva','Necessidade de ação preventiva','boolean','[]',false,40),
    (c_info,'prazo','Prazo/período previsto','text','[]',false,50);
end $$;
