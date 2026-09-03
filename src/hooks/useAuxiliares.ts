import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Auxiliar {
  id: string;
  nome: string;
  ativo: boolean;
  cpf: string | null;
  ra: string | null;
}

/** Lista de auxiliares (responsáveis operacionais) ativos, para atribuir a ocorrências. */
export function useAuxiliares() {
  return useQuery({
    queryKey: ['auxiliares'],
    queryFn: async (): Promise<Auxiliar[]> => {
      const { data, error } = await supabase
        .from('auxiliares')
        .select('id, nome, ativo, cpf, ra')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data ?? [];
    },
  });
}
