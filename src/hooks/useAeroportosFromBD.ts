import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * ✅ CORRIGIDO: Renomeado de useAeroportosDoMapa
 * Este era o arquivo que faltava importar nos DashboardSVG
 *
 * Busca aeroportos da tabela 'aeroporto_rotaer' do Supabase
 * Retorna dados dinamicamente (não hardcoded)
 */

export interface PontoAeroporto {
  id: string;
  aeroporto_id: string;
  icao: string;
  nome: string;
  cidade: string;
  regional: string;
  latitude: number;
  longitude: number;
  concessao: 'VOA-SP' | 'VOA-SE' | string;
  elevacao_ft?: number;
  [key: string]: any;
}

/**
 * Hook principal: busca aeroportos da BD
 */
export function useAeroportosFromBD() {
  return useQuery({
    queryKey: ["aeroportos"],
    queryFn: async (): Promise<PontoAeroporto[]> => {
      console.log("%c[useAeroportosFromBD] Buscando aeroportos do Supabase...", "color: #22c55e; font-weight: bold");

      try {
        const { data, error } = await supabase
          .from("aeroporto_rotaer")
          .select("*")
          .order("icao", { ascending: true });

        if (error) {
          console.error("%c[useAeroportosFromBD] ❌ ERRO:", "color: #ef4444; font-weight: bold", error);
          throw error;
        }

        const quantidade = data?.length || 0;
        console.log(
          "%c[useAeroportosFromBD] ✅ Sucesso!",
          "color: #22c55e; font-weight: bold",
          { quantidade, primeiros: data?.[0] }
        );

        return (data || []) as PontoAeroporto[];
      } catch (err) {
        console.error("%c[useAeroportosFromBD] ❌ ERRO na requisição:", "color: #ef4444; font-weight: bold", err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,   // 5 minutos
    gcTime: 1000 * 60 * 30,      // 30 minutos
  });
}

/**
 * Hook: retorna regionais únicos
 */
export function useRegionaisDisponiveis() {
  const { data: aeroportos } = useAeroportosFromBD();

  const regionais = Array.from(
    new Set((aeroportos || []).map(a => a.regional).filter(Boolean))
  ) as string[];

  return {
    data: regionais,
    isLoading: false,
    error: null,
  };
}

/**
 * Hook alternativo: filtro por região
 */
export function useAeroportosPorRegiao(regiao: string) {
  const { data, ...rest } = useAeroportosFromBD();

  const filtered = (data || []).filter(a => a.regional === regiao);

  return {
    data: filtered,
    ...rest
  };
}

/**
 * Hook: aeroportos críticos (VOA-SP prioritários)
 */
export function useAeroportosCriticos() {
  const { data, ...rest } = useAeroportosFromBD();

  const criticos = (data || []).filter(a => a.concessao === 'VOA-SP');

  return {
    data: criticos,
    ...rest
  };
}
