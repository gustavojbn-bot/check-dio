import { useState, type CSSProperties, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Formulário de troca de senha acessível direto da tela de login,
 * para quem já sabe a senha atual e quer trocá-la sem precisar
 * entrar no sistema primeiro. Valida a senha atual autenticando
 * (signIn) antes de aplicar a nova senha.
 */
export function TrocarSenhaLogin({ onVoltar }: { onVoltar: () => void }) {
  const { signIn, alterarSenha } = useAuth();
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (novaSenha === senhaAtual) {
      setErro('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setEnviando(true);

    const { error: signInError } = await signIn(email, senhaAtual);
    if (signInError) {
      setErro('E-mail ou senha atual incorretos.');
      setEnviando(false);
      return;
    }

    const { error: alterarError } = await alterarSenha(novaSenha);
    setEnviando(false);

    if (alterarError) {
      setErro(alterarError);
      return;
    }

    // Sucesso: o AuthContext já autenticou o usuário (signIn acima), então
    // o App vai trocar automaticamente para o painel assim que isAuthenticated
    // virar true — só mostramos a confirmação por um instante antes disso.
    setSucesso(true);
  };

  return (
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
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Alterar senha</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.4 }}>
          Informe seu e-mail, a senha atual e a nova senha desejada.
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>E-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          style={inputStyle}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Senha atual</span>
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          required
          autoComplete="current-password"
          style={inputStyle}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Nova senha</span>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
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

      {sucesso && (
        <div
          style={{
            fontSize: 11,
            color: '#4ade80',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            borderRadius: 6,
            padding: '8px 10px',
          }}
        >
          ✅ Senha alterada com sucesso! Entrando...
        </div>
      )}

      <button
        type="submit"
        disabled={enviando || sucesso}
        style={{
          marginTop: 8,
          padding: '10px 12px',
          borderRadius: 6,
          border: 'none',
          backgroundColor: enviando || sucesso ? '#0e7490' : '#06b6d4',
          color: '#0f0f1e',
          fontWeight: 700,
          fontSize: 13,
          cursor: enviando || sucesso ? 'not-allowed' : 'pointer',
        }}
      >
        {enviando ? 'Alterando...' : sucesso ? 'Senha alterada' : 'Alterar senha'}
      </button>

      <button
        type="button"
        onClick={onVoltar}
        disabled={enviando}
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: '#64748b',
          fontSize: 11,
          fontWeight: 600,
          cursor: enviando ? 'not-allowed' : 'pointer',
        }}
      >
        ‹ Voltar para o login
      </button>
    </form>
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
