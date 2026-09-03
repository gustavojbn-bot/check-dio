import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Matriz de classificação de ocorrências: classificações > subclassificações,
 * cada uma com campos dinâmicos e documentos exigidos configuráveis.
 * Portado de Airport Ops Hub (mesma origem Rede VOA) — ver memória do
 * projeto e supabase/sql/005_ocorrencias_matriz.sql.
 */

export type CampoTipo = 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'datetime' | 'number';

export interface Classificacao {
  id: string;
  nome: string;
  descricao: string;
  ordem: number;
  ativa: boolean;
}

export interface Subclassificacao {
  id: string;
  classificacao_id: string;
  nome: string;
  descricao: string;
  exemplos: string;
  ordem: number;
  ativa: boolean;
}

export interface Campo {
  id: string;
  classificacao_id: string | null;
  subclassificacao_id: string | null;
  key: string;
  label: string;
  tipo: CampoTipo;
  opcoes: string[];
  obrigatorio: boolean;
  ordem: number;
  ajuda: string;
  ativo: boolean;
}

export interface Documento {
  id: string;
  classificacao_id: string | null;
  subclassificacao_id: string | null;
  nome: string;
  responsavel: string;
  prazo_horas: number | null;
  ordem: number;
  ativo: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbAny = supabase as any;

export function useClassificacoes() {
  return useQuery({
    queryKey: ['ocorrencia-classificacoes'],
    queryFn: async (): Promise<Classificacao[]> => {
      const { data, error } = await dbAny
        .from('ocorrencia_classificacoes')
        .select('*')
        .eq('ativa', true)
        .order('ordem');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubclassificacoes(classificacaoId: string | null) {
  return useQuery({
    queryKey: ['ocorrencia-subclassificacoes', classificacaoId],
    enabled: !!classificacaoId,
    queryFn: async (): Promise<Subclassificacao[]> => {
      const { data, error } = await dbAny
        .from('ocorrencia_subclassificacoes')
        .select('*')
        .eq('classificacao_id', classificacaoId)
        .eq('ativa', true)
        .order('ordem');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCamposMatriz(classificacaoId: string | null, subclassificacaoId: string | null) {
  return useQuery({
    queryKey: ['ocorrencia-campos', classificacaoId, subclassificacaoId],
    enabled: !!classificacaoId || !!subclassificacaoId,
    queryFn: async (): Promise<Campo[]> => {
      const ors: string[] = [];
      if (classificacaoId) ors.push(`classificacao_id.eq.${classificacaoId}`);
      if (subclassificacaoId) ors.push(`subclassificacao_id.eq.${subclassificacaoId}`);
      const { data, error } = await dbAny
        .from('ocorrencia_campos')
        .select('*')
        .eq('ativo', true)
        .or(ors.join(','))
        .order('ordem');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDocumentosMatriz(classificacaoId: string | null, subclassificacaoId: string | null) {
  return useQuery({
    queryKey: ['ocorrencia-documentos', classificacaoId, subclassificacaoId],
    enabled: !!classificacaoId || !!subclassificacaoId,
    queryFn: async (): Promise<Documento[]> => {
      const ors: string[] = [];
      if (classificacaoId) ors.push(`classificacao_id.eq.${classificacaoId}`);
      if (subclassificacaoId) ors.push(`subclassificacao_id.eq.${subclassificacaoId}`);
      const { data, error } = await dbAny
        .from('ocorrencia_documentos')
        .select('*')
        .eq('ativo', true)
        .or(ors.join(','))
        .order('ordem');
      if (error) throw error;
      return data ?? [];
    },
  });
}
