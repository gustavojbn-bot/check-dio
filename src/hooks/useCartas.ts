import { useQuery } from '@tanstack/react-query';
import { XMLParser } from 'fast-xml-parser';
import { isValidIcaoCode } from '@/lib/icao';

export interface CartaItem {
  id: string;
  especie: string;
  tipo: string;
  tipo_descr: string;
  nome: string;
  IcaoCode: string;
  dt: string;
  link: string;
  arquivo: string;
  kmz?: string;
  aviso?: string;
  icp?: string;
  pe?: string;
  notam?: string;
  [key: string]: any;
}

export interface CartasData {
  icao: string;
  total: number;
  emenda?: string;
  lastupdate?: string;
  cartas: CartaItem[];
}

/**
 * Hook para buscar Cartas de um aeroporto via API AISWEB
 */
export function useCartas(icao: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cartas', icao],
    queryFn: async () => {
      try {
        if (!isValidIcaoCode(icao)) {
          console.error(`[useCartas] ❌ Código ICAO inválido: "${icao}" (esperado 4 letras maiúsculas)`);
          return {
            icao,
            total: 0,
            cartas: [],
          } as CartasData;
        }

        const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? '';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        console.log(`[useCartas] 🚀 Buscando Cartas para ${icao}...`);

        const url = `${PROXY_URL}/api/rotaer/${icao}?area=cartas`;
        const response = await fetch(url, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[useCartas] ⚠️ Erro ${response.status} ao buscar Cartas`);
          return {
            icao,
            total: 0,
            cartas: [],
          } as CartasData;
        }

        const responseText = await response.text();
        console.log(`[useCartas] 📄 Resposta recebida (${responseText.length} bytes)`);

        // Parse XML
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          parseTagValue: false,
        });

        const xmlData = parser.parse(responseText);
        console.log(`[useCartas] ✅ XML parseado`);

        // Extrair Cartas
        const cartasRoot = xmlData?.aisweb?.cartas;
        if (!cartasRoot) {
          console.warn(`[useCartas] ⚠️ Nenhuma Carta encontrada`);
          return {
            icao,
            total: 0,
            cartas: [],
          } as CartasData;
        }

        const total = parseInt((cartasRoot?.['@_total'] || '0').toString().trim());
        const emenda = (cartasRoot?.['@_emenda'] || '').toString().trim();
        const lastupdate = (cartasRoot?.['@_lastupdate'] || '').toString().trim();

        // Garantir que items é sempre array
        let items = cartasRoot.item || [];
        if (!Array.isArray(items)) {
          items = items ? [items] : [];
        }

        // Limpar campos de CDATA se necessário
        items = items.map((item: any) => ({
          ...item,
          nome: typeof item.nome === 'string' ? item.nome.trim() : item.nome,
          link: typeof item.link === 'string' ? item.link.trim() : item.link,
        }));

        console.log(`[useCartas] 🎯 Total de Cartas: ${total}`);
        console.log(`[useCartas] 📋 Items encontrados: ${items.length}`);

        return {
          icao,
          total,
          emenda,
          lastupdate,
          cartas: items as CartaItem[],
        } as CartasData;
      } catch (error) {
        console.error(`[useCartas] 💥 Erro ao buscar Cartas:`, error);
        return {
          icao,
          total: 0,
          cartas: [],
        } as CartasData;
      }
    },
    enabled: isValidIcaoCode(icao),
    staleTime: 1000 * 60 * 60, // 1 hora (cartas mudam menos frequentemente)
    refetchInterval: 1000 * 60 * 5, // Atualiza a cada 5 minutos
  });

  return {
    cartasData: data || { icao, total: 0, cartas: [] },
    isLoading,
    error,
  };
}
