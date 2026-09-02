import { useState, type CSSProperties, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TrocarSenhaLogin } from './TrocarSenhaLogin';

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [modo, setModo] = useState<'login' | 'alterar-senha'>('login');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const { error } = await signIn(email, senha);

    if (error) {
      setErro(error);
    }
    setEnviando(false);
  };

  if (modo === 'alterar-senha') {
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
        <TrocarSenhaLogin onVoltar={() => setModo('login')} />
      </div>
    );
  }

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
            style={{ width: '100%', maxWidth: 276, height: 'auto', objectFit: 'contain', marginBottom: 8 }}
          />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
            SISTEMA DE GESTÃO DEPTO INFRAESTRUTURA E OPERAÇÕES
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
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
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
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={() => setModo('alterar-senha')}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: '#06b6d4',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Alterar senha
        </button>
      </form>

      <div style={{ fontSize: 10, color: '#475569', textAlign: 'center' }}>
        Desenvolvido pela Superintendência de Infraestrutura e Operações REDE VOA
      </div>
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
