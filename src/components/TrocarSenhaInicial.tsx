import { useState, type CSSProperties, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tela obrigatória exibida logo após o login quando o perfil está marcado
 * com senha_provisoria=true (usuário criado pelo administrador). Bloqueia
 * o acesso ao sistema até a senha ser trocada.
 */
export function TrocarSenhaInicial() {
  const { alterarSenha, signOut, perfil } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);
    const { error } = await alterarSenha(novaSenha);
    setEnviando(false);

    if (error) {
      setErro(error);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0f1e',
        gap: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          padding: 32,
          borderRadius: 10,
          border: '1px solid #2d3e50',
          backgroundColor: '#1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img
            src="/Logo-checkdio-3d.png"
            alt="Check DIO"
            style={{ width: '100%', maxWidth: 276, height: 'auto', objectFit: 'contain', marginBottom: 12 }}
          />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Troque sua senha para continuar</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.4 }}>
            {perfil?.nome ? `Olá, ${perfil.nome}. ` : ''}
            Este é seu primeiro acesso com uma senha provisória. Defina uma nova senha para liberar o sistema.
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Nova senha</span>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            autoFocus
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Confirmar nova senha</span>
          <input
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            style={inputStyle}
          />
        </label>

        {erro && (
          <div
            style={{
              fontSize: 11,
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          style={{
            marginTop: 8,
            padding: '10px 12px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: enviando ? '#0e7490' : '#06b6d4',
            color: '#0f0f1e',
            fontWeight: 700,
            fontSize: 13,
            cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? 'Salvando...' : 'Salvar nova senha e entrar'}
        </button>

        <button
          type="button"
          onClick={() => signOut()}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: '#64748b',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </form>
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: '9px 10px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: '#0f0f1e',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
};
