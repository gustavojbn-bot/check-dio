import { useQuery } from '@tanstack/react-query';
import { isValidIcaoCode } from '@/lib/icao';

export interface TafData {
  taf_bruto: string | null;
}

/**
 * Hook para buscar TAF (Terminal Aerodrome Forecast) de um aeroporto via REDEMET.
 * Segue o mesmo padrão de auto-detecção de mensagem usado em useMetarRotaer.
 */
export function useTaf(icao: string | null) {
  const query = useQuery({
    queryKey: ['taf', icao],
    queryFn: async (): Promise<TafData> => {
      if (!icao || !isValidIcaoCode(icao)) {
        return { taf_bruto: null };
      }

      const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? '';

      const url = `${PROXY_URL}/api/taf/${icao}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const proxyResponse = await response.json();
        if (!proxyResponse.success) {
          console.warn(`[useTaf] ⚠️ Proxy retornou erro:`, proxyResponse.error);
          return { taf_bruto: null };
        }

        const json = proxyResponse.data;

        if (!json || !json.data) {
          console.warn(`[useTaf] ⚠️ Sem dados TAF para ${icao}`);
          return { taf_bruto: null };
        }

        let dataArray: any[] = [];
        if (Array.isArray(json.data)) {
          dataArray = json.data;
        } else if (typeof json.data === 'object' && Array.isArray(json.data.data)) {
          dataArray = json.data.data;
        } else if (typeof json.data === 'object') {
          dataArray = [json.data];
        }

        if (dataArray.length === 0) {
          return { taf_bruto: null };
        }

        const primeiroElemento = dataArray[0];
        const chavesDisponiveis = Object.keys(primeiroElemento);

        let propriedadeMensagem: string | null = null;

        for (const chave of chavesDisponiveis) {
          const valor = primeiroElemento[chave];
          if (typeof valor === 'string' && valor.toUpperCase().includes('TAF')) {
            propriedadeMensagem = chave;
            break;
          }
        }

        if (!propriedadeMensagem) {
          const propriedadesComuns = ['mens', 'mensagem', 'message', 'msg', 'raw_message'];
          for (const prop of propriedadesComuns) {
            const valor = primeiroElemento[prop];
            if (typeof valor === 'string' && valor.length > 5) {
              propriedadeMensagem = prop;
              break;
            }
          }
        }

        if (!propriedadeMensagem) {
          console.warn(`[useTaf] ⚠️ Nenhuma propriedade de mensagem detectada para ${icao}`);
          return { taf_bruto: null };
        }

        let mensagemExtraida: string | null = null;
        for (let i = dataArray.length - 1; i >= 0; i--) {
          const msg = dataArray[i][propriedadeMensagem];
          if (msg && typeof msg === 'string' && msg.length > 0) {
            mensagemExtraida = msg;
            break;
          }
        }

        return { taf_bruto: mensagemExtraida };
      } catch (error) {
        console.error(`[useTaf] ❌ ERRO:`, error);
        return { taf_bruto: null };
      }
    },
    enabled: !!icao && isValidIcaoCode(icao),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  return {
    taf: query.data || { taf_bruto: null },
    isLoading: query.isLoading,
    error: query.error,
  };
}
