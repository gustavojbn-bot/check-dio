import { useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEY = ['ultimaAtualizacao'];

/**
 * Timestamp compartilhado de "última atualização" dos dados de METAR/TAF/ROTAER.
 * Atualizado manualmente (botão de refresh do Menu) e automaticamente a cada
 * ciclo de refetch (10 min, mesmo intervalo usado pelos hooks de dados).
 */
export function useUltimaAtualizacao(): number {
  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => Date.now(),
    initialData: () => Date.now(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data as number;
}

export function useRegistrarAtualizacao() {
  const queryClient = useQueryClient();
  return () => queryClient.setQueryData(QUERY_KEY, Date.now());
}
