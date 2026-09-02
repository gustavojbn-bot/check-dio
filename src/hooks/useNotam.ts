import { useQuery } from '@tanstack/react-query';
import { XMLParser } from 'fast-xml-parser';
import { isValidIcaoCode } from '@/lib/icao';

export interface NotamItem {
  id: string;
  icaoairport_id: string;
  cod: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  cat: string;
  dist: string;
  tp: string;
  dt: string;
  n: string;
  number: string;
  loc: string;
  b: string;
  c: string;
  d: string;
  e: string;
  [key: string]: any;
}

export interface NotamData {
  icao: string;
  total: number;
  updatedat?: string;
  notams: NotamItem[];
}

/**
 * Hook para buscar NOTAMs de um aeroporto via API AISWEB
 */
export function useNotam(icao: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['notam', icao],
    queryFn: async () => {
      try {
        if (!isValidIcaoCode(icao)) {
          console.error(`[useNotam] ❌ Código ICAO inválido: "${icao}" (esperado 4 letras maiúsculas)`);
          return {
            icao,
            total: 0,
            notams: [],
          } as NotamData;
        }

        const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? '';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        console.log(`[useNotam] 🚀 Buscando NOTAMs para ${icao}...`);

        const url = `${PROXY_URL}/api/rotaer/${icao}?area=notam`;
        const response = await fetch(url, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[useNotam] ⚠️ Erro ${response.status} ao buscar NOTAMs`);
          return {
            icao,
            total: 0,
            notams: [],
          } as NotamData;
        }

        const responseText = await response.text();
        console.log(`[useNotam] 📄 Resposta recebida (${responseText.length} bytes)`);

        // Parse XML
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          parseTagValue: false,
        });

        const xmlData = parser.parse(responseText);
        console.log(`[useNotam] ✅ XML parseado`);

        // Extrair NOTAMs
        const notamRoot = xmlData?.aisweb?.notam;
        if (!notamRoot) {
          console.warn(`[useNotam] ⚠️ Nenhum NOTAM encontrado`);
          return {
            icao,
            total: 0,
            notams: [],
          } as NotamData;
        }

        const total = parseInt(notamRoot?.['@_total'] || '0');
        const updatedat = notamRoot?.['@_updatedat'];

        // Garantir que items é sempre array
        let items = notamRoot.item || [];
        if (!Array.isArray(items)) {
          items = items ? [items] : [];
        }

        console.log(`[useNotam] 🎯 Total de NOTAMs: ${total}`);
        console.log(`[useNotam] 📋 Items encontrados: ${items.length}`);

        return {
          icao,
          total,
          updatedat,
          notams: items as NotamItem[],
        } as NotamData;
      } catch (error) {
        console.error(`[useNotam] 💥 Erro ao buscar NOTAMs:`, error);
        return {
          icao,
          total: 0,
          notams: [],
        } as NotamData;
      }
    },
    enabled: isValidIcaoCode(icao),
    staleTime: 1000 * 60 * 10, // 10 minutos
    refetchInterval: 1000 * 60 * 5, // Atualiza a cada 5 minutos
  });

  return {
    notamData: data || { icao, total: 0, notams: [] },
    isLoading,
    error,
  };
}
