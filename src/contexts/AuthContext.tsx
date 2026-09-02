import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { NivelAcesso, Perfil } from '@/types/Perfil';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  nivelAcesso: NivelAcesso | null;
  isLoading: boolean;
  /** true assim que sabemos que não há sessão válida */
  isAuthenticated: boolean;
  podeInserir: boolean;
  podeEditar: boolean;
  podeExcluir: boolean;
  signIn: (email: string, senha: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  alterarSenha: (novaSenha: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function buscarPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('%c[AuthContext] ❌ Erro ao buscar perfil:', 'color: #ef4444', error);
    return null;
  }

  return data as Perfil | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    // Carrega sessão existente (ex: refresh de página)
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      setSession(data.session);
      if (data.session?.user) {
        setPerfil(await buscarPerfil(data.session.user.id));
      }
      setIsLoading(false);
    });

    // Reage a login/logout/refresh de token
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, novaSessao) => {
      if (!ativo) return;
      setSession(novaSessao);
      if (novaSessao?.user) {
        setPerfil(await buscarPerfil(novaSessao.user.id));
      } else {
        setPerfil(null);
      }
      setIsLoading(false);
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return { error: error ? traduzErroLogin(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const alterarSenha = async (novaSenha: string) => {
    const { data, error: authError } = await supabase.auth.updateUser({ password: novaSenha });
    if (authError) {
      return { error: traduzErroSenha(authError.message) };
    }

    // Usa o usuário retornado por updateUser (sempre atualizado) em vez do
    // `session` do estado do contexto, que pode ainda estar desatualizado
    // logo após um signIn (ex: fluxo de "Alterar senha" na tela de login).
    const userId = data.user?.id;
    if (userId) {
      const { error: perfilError } = await supabase
        .from('perfis')
        .update({ senha_provisoria: false })
        .eq('id', userId);

      if (perfilError) {
        console.error('%c[AuthContext] ❌ Erro ao limpar senha_provisoria:', 'color: #ef4444', perfilError);
      } else {
        setPerfil((atual) => (atual ? { ...atual, senha_provisoria: false } : atual));
      }
    }

    return { error: null };
  };

  const nivelAcesso = perfil?.nivel_acesso ?? null;
  const podeInserir = nivelAcesso === 'administrador' || nivelAcesso === 'operador';
  const podeEditar = nivelAcesso === 'administrador' || nivelAcesso === 'operador';
  const podeExcluir = nivelAcesso === 'administrador';

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    perfil,
    nivelAcesso,
    isLoading,
    isAuthenticated: !!session,
    podeInserir,
    podeEditar,
    podeExcluir,
    signIn,
    signOut,
    alterarSenha,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>');
  }
  return ctx;
}

function traduzErroLogin(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) {
    return 'E-mail ou senha inválidos.';
  }
  if (mensagem.includes('Email not confirmed')) {
    return 'E-mail ainda não confirmado.';
  }
  return 'Não foi possível entrar. Tente novamente.';
}

function traduzErroSenha(mensagem: string): string {
  if (mensagem.includes('New password should be different')) {
    return 'A nova senha deve ser diferente da senha atual.';
  }
  if (mensagem.includes('Password should be at least')) {
    return 'A senha deve ter ao menos 6 caracteres.';
  }
  return 'Não foi possível alterar a senha. Tente novamente.';
}
