import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NIVEL_DESCRICAO, type NivelAcesso, type Perfil } from '@/types/Perfil';

const NIVEIS: NivelAcesso[] = ['administrador', 'operador', 'visualizador'];

const NIVEL_LABEL: Record<NivelAcesso, string> = {
  administrador: 'Administrador',
  operador: 'Operador',
  visualizador: 'Visualizador',
};

const NIVEL_COR: Record<NivelAcesso, string> = {
  administrador: '#ef4444',
  operador: '#f59e0b',
  visualizador: '#3b82f6',
};

interface GestaoUsuariosProps {
  onClose: () => void;
}

type Aba = 'perfis' | 'novo';

export function GestaoUsuarios({ onClose }: GestaoUsuariosProps) {
  const { nivelAcesso } = useAuth();
  const [aba, setAba] = useState<Aba>('perfis');
  const naoEhAdministrador = nivelAcesso !== 'administrador';

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>👤 Gestão de Usuários</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Perfis, níveis de acesso e cadastro de novos usuários
            </div>
          </div>
          <button onClick={onClose} style={closeButtonStyle} title="Fechar">
            ✕
          </button>
        </div>

        {naoEhAdministrador ? (
          <div style={avisoStyle}>
            🔒 Apenas administradores podem gerenciar usuários e níveis de acesso.
          </div>
        ) : (
          <>
            {/* Abas */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #2d3e50' }}>
              <TabButton label="Gestão de Perfis" ativo={aba === 'perfis'} onClick={() => setAba('perfis')} />
              <TabButton label="Cadastro de Usuário" ativo={aba === 'novo'} onClick={() => setAba('novo')} />
            </div>

            {aba === 'perfis' ? <AbaPerfis /> : <AbaNovoUsuario onCriado={() => setAba('perfis')} />}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        border: 'none',
        borderBottom: ativo ? '2px solid #06b6d4' : '2px solid transparent',
        backgroundColor: 'transparent',
        color: ativo ? '#06b6d4' : '#94a3b8',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

/**
 * Aba 1: lista de perfis existentes, com edição de nível e telefone
 */
function AbaPerfis() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [telefoneEditando, setTelefoneEditando] = useState<Record<string, string>>({});
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState<string | null>(null);

  const carregarUsuarios = async () => {
    setIsLoading(true);
    setErro(null);

    const { data, error } = await supabase.from('perfis').select('*').order('nome', { ascending: true });

    if (error) {
      console.error('%c[GestaoUsuarios] ❌ Erro ao listar usuários:', 'color: #ef4444', error);
      setErro('Não foi possível carregar os usuários.');
      setUsuarios([]);
    } else {
      setUsuarios((data || []) as Perfil[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const alterarNivel = async (perfil: Perfil, novoNivel: NivelAcesso) => {
    if (novoNivel === perfil.nivel_acesso) return;
    setSalvandoId(perfil.id);
    const anterior = perfil.nivel_acesso;

    setUsuarios((atual) => atual.map((u) => (u.id === perfil.id ? { ...u, nivel_acesso: novoNivel } : u)));

    const { error } = await supabase.from('perfis').update({ nivel_acesso: novoNivel }).eq('id', perfil.id);

    if (error) {
      console.error('%c[GestaoUsuarios] ❌ Erro ao atualizar nível:', 'color: #ef4444', error);
      alert('Não foi possível atualizar o nível de acesso deste usuário.');
      setUsuarios((atual) => atual.map((u) => (u.id === perfil.id ? { ...u, nivel_acesso: anterior } : u)));
    }
    setSalvandoId(null);
  };

  const salvarTelefone = async (perfil: Perfil) => {
    const novoTelefone = telefoneEditando[perfil.id];
    if (novoTelefone === undefined || novoTelefone === (perfil.telefone || '')) return;

    setSalvandoId(perfil.id);
    const { error } = await supabase.from('perfis').update({ telefone: novoTelefone || null }).eq('id', perfil.id);

    if (error) {
      console.error('%c[GestaoUsuarios] ❌ Erro ao salvar telefone:', 'color: #ef4444', error);
      alert('Não foi possível salvar o telefone.');
    } else {
      setUsuarios((atual) => atual.map((u) => (u.id === perfil.id ? { ...u, telefone: novoTelefone || null } : u)));
    }
    setSalvandoId(null);
  };

  const usuarioSelecionado = usuarios.find((u) => u.id === usuarioSelecionadoId) || null;

  if (usuarioSelecionado) {
    return (
      <DetalhePerfil
        perfil={usuarioSelecionado}
        ehVoce={usuarioSelecionado.id === user?.id}
        salvando={salvandoId === usuarioSelecionado.id}
        telefoneEditando={telefoneEditando[usuarioSelecionado.id]}
        onVoltar={() => setUsuarioSelecionadoId(null)}
        onAlterarNivel={(nivel) => alterarNivel(usuarioSelecionado, nivel)}
        onEditarTelefone={(valor) =>
          setTelefoneEditando((atual) => ({ ...atual, [usuarioSelecionado.id]: valor }))
        }
        onSalvarTelefone={() => salvarTelefone(usuarioSelecionado)}
      />
    );
  }

  return (
    <>
      {isLoading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>⏳ Carregando usuários...</div>
      ) : erro ? (
        <div style={avisoStyle}>{erro}</div>
      ) : usuarios.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>Nenhum usuário cadastrado.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
          {usuarios.map((u) => (
            <button
              key={u.id}
              onClick={() => setUsuarioSelecionadoId(u.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid #2d3e50',
                backgroundColor: u.id === user?.id ? 'rgba(6, 182, 212, 0.06)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#2d3e50';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                  {u.nome} {u.id === user?.id && <span style={{ color: '#06b6d4', fontSize: 10 }}>(você)</span>}
                </span>
                <span style={{ fontSize: 10, color: '#64748b' }}>{u.email}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: `1px solid ${NIVEL_COR[u.nivel_acesso]}`,
                    color: NIVEL_COR[u.nivel_acesso],
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {NIVEL_LABEL[u.nivel_acesso]}
                </span>
                <span style={{ color: '#475569', fontSize: 12 }}>›</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Painel de detalhe de um usuário: dados, telefone e nível de acesso,
 * com a lista explícita do que o nível selecionado permite fazer.
 */
function DetalhePerfil({
  perfil,
  ehVoce,
  salvando,
  telefoneEditando,
  onVoltar,
  onAlterarNivel,
  onEditarTelefone,
  onSalvarTelefone,
}: {
  perfil: Perfil;
  ehVoce: boolean;
  salvando: boolean;
  telefoneEditando: string | undefined;
  onVoltar: () => void;
  onAlterarNivel: (nivel: NivelAcesso) => void;
  onEditarTelefone: (valor: string) => void;
  onSalvarTelefone: () => void;
}) {
  const PERMISSOES: Record<NivelAcesso, { ler: boolean; inserir: boolean; editar: boolean; excluir: boolean }> = {
    administrador: { ler: true, inserir: true, editar: true, excluir: true },
    operador: { ler: true, inserir: true, editar: true, excluir: false },
    visualizador: { ler: true, inserir: false, editar: false, excluir: false },
  };

  const permissoes = PERMISSOES[perfil.nivel_acesso];

  return (
    <div>
      <button
        onClick={onVoltar}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          border: 'none',
          background: 'transparent',
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 14,
          padding: 0,
        }}
      >
        ‹ Voltar para a lista
      </button>

      {/* Identificação */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
          {perfil.nome} {ehVoce && <span style={{ color: '#06b6d4', fontSize: 11 }}>(você)</span>}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{perfil.email}</div>
      </div>

      {/* Telefone */}
      <Campo label="Telefone (WhatsApp)">
        <input
          type="tel"
          placeholder="+55 11 91234-5678"
          value={telefoneEditando ?? perfil.telefone ?? ''}
          onChange={(e) => onEditarTelefone(e.target.value)}
          onBlur={onSalvarTelefone}
          disabled={salvando}
          style={inputStyle}
        />
      </Campo>

      {/* Nível de acesso */}
      <div style={{ marginTop: 14 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Nível de acesso</span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {NIVEIS.map((nivel) => {
            const ativo = perfil.nivel_acesso === nivel;
            return (
              <button
                key={nivel}
                onClick={() => onAlterarNivel(nivel)}
                disabled={salvando}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${ativo ? NIVEL_COR[nivel] : '#2d3e50'}`,
                  backgroundColor: ativo ? `${NIVEL_COR[nivel]}1a` : 'transparent',
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: NIVEL_COR[nivel] }}>{NIVEL_LABEL[nivel]}</span>
                  {ativo && <span style={{ fontSize: 10, color: NIVEL_COR[nivel] }}>✓ selecionado</span>}
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{NIVEL_DESCRICAO[nivel]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* O que este usuário pode fazer, hoje */}
      <div style={{ marginTop: 18 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
          O que {ehVoce ? 'você' : perfil.nome} pode fazer no sistema
        </span>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 8,
          }}
        >
          <PermissaoItem label="Ler / visualizar dados" permitido={permissoes.ler} />
          <PermissaoItem label="Inserir novos registros" permitido={permissoes.inserir} />
          <PermissaoItem label="Editar registros existentes" permitido={permissoes.editar} />
          <PermissaoItem label="Excluir registros" permitido={permissoes.excluir} />
        </div>

        <div style={{ fontSize: 10, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>
          Vale para os dados do sistema (ex.: Aeroportos, Ocorrências). Aplicado automaticamente pelas
          políticas de segurança do banco (RLS) — não depende da tela usada para acessar os dados.
        </div>
      </div>
    </div>
  );
}

function PermissaoItem({ label, permitido }: { label: string; permitido: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 6,
        border: `1px solid ${permitido ? '#22c55e33' : '#ef444433'}`,
        backgroundColor: permitido ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
      }}
    >
      <span style={{ fontSize: 12, color: permitido ? '#4ade80' : '#f87171' }}>{permitido ? '✅' : '🚫'}</span>
      <span style={{ fontSize: 11, color: '#cbd5e1' }}>{label}</span>
    </div>
  );
}

/**
 * Aba 2: formulário de cadastro de novo usuário
 */
function AbaNovoUsuario({ onCriado }: { onCriado: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [nivelAcesso, setNivelAcesso] = useState<NivelAcesso>('visualizador');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setEnviando(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setErro('Sessão expirada. Faça login novamente.');
        setEnviando(false);
        return;
      }

      const proxyUrl = import.meta.env.VITE_PROXY_URL ?? '';
      const response = await fetch(`${proxyUrl}/api/admin/criar-usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ nome, email, senha, telefone: telefone || null, nivel_acesso: nivelAcesso }),
      });

      const resultado = await response.json();

      if (!response.ok || !resultado.success) {
        setErro(resultado.error || 'Não foi possível criar o usuário.');
        setEnviando(false);
        return;
      }

      setSucesso(
        `Usuário "${nome}" criado com sucesso! Repasse o e-mail e a senha provisória a ele — o sistema vai pedir a troca no primeiro acesso.`
      );
      setNome('');
      setEmail('');
      setTelefone('');
      setSenha('');
      setNivelAcesso('visualizador');
      setEnviando(false);
      setTimeout(onCriado, 1200);
    } catch (err) {
      console.error('%c[GestaoUsuarios] ❌ Erro ao criar usuário:', 'color: #ef4444', err);
      setErro('Erro de conexão com o servidor. O proxy (redemet-proxy.js) está rodando?');
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Campo label="Nome completo">
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} />
      </Campo>

      <Campo label="E-mail">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
      </Campo>

      <Campo label="Telefone (WhatsApp) — opcional">
        <input
          type="tel"
          placeholder="+55 11 91234-5678"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          style={inputStyle}
        />
      </Campo>

      <Campo label="Senha provisória">
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
          style={inputStyle}
        />
      </Campo>

      <Campo label="Nível de acesso">
        <select
          value={nivelAcesso}
          onChange={(e) => setNivelAcesso(e.target.value as NivelAcesso)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {NIVEIS.map((nivel) => (
            <option key={nivel} value={nivel}>
              {NIVEL_LABEL[nivel]}
            </option>
          ))}
        </select>
      </Campo>

      {erro && <div style={avisoStyle}>{erro}</div>}
      {sucesso && <div style={sucessoStyle}>✅ {sucesso}</div>}

      <button type="submit" disabled={enviando} style={submitButtonStyle(enviando)}>
        {enviando ? 'Criando...' : 'Criar usuário'}
      </button>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: CSSProperties = {
  width: 460,
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflowY: 'auto',
  backgroundColor: '#1e293b',
  border: '1px solid #2d3e50',
  borderRadius: 10,
  padding: 20,
  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
};

const closeButtonStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  border: '1px solid #2d3e50',
  backgroundColor: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 12,
  flexShrink: 0,
};

const avisoStyle: CSSProperties = {
  padding: 12,
  borderRadius: 6,
  border: '1px solid #f59e0b',
  backgroundColor: 'rgba(245, 158, 11, 0.08)',
  color: '#fbbf24',
  fontSize: 12,
};

const sucessoStyle: CSSProperties = {
  padding: 12,
  borderRadius: 6,
  border: '1px solid #22c55e',
  backgroundColor: 'rgba(34, 197, 94, 0.08)',
  color: '#4ade80',
  fontSize: 12,
};

const inputStyle: CSSProperties = {
  padding: '9px 10px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: '#0f0f1e',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
};

function submitButtonStyle(enviando: boolean): CSSProperties {
  return {
    marginTop: 4,
    padding: '10px 12px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: enviando ? '#0e7490' : '#06b6d4',
    color: '#0f0f1e',
    fontWeight: 700,
    fontSize: 13,
    cursor: enviando ? 'not-allowed' : 'pointer',
  };
}
