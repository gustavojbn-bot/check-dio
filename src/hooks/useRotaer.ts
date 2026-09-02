import { useQuery } from '@tanstack/react-query';
import { XMLParser } from 'fast-xml-parser';
import { isValidIcaoCode } from '@/lib/icao';

interface RotaerData {
  pistas?: string;
  acnPcn?: string;
  tipoOperacao?: string;
  papi?: string;
  frequencias?: string[];
  navAids?: string;
  iluminacao?: boolean;
  combustivel?: string[];
  servicos?: string[];
  [key: string]: any;
}

export function useRotaer(icao: string | null) {
  const query = useQuery({
    queryKey: ['rotaer', icao],
    queryFn: async (): Promise<RotaerData> => {
      if (!icao) {
        return {};
      }

      if (!isValidIcaoCode(icao)) {
        console.error(`[useRotaer] ❌ Código ICAO inválido: "${icao}" (esperado 4 letras maiúsculas)`);
        return {};
      }

      console.log(`[useRotaer] 🚀 Buscando ROTAER para ${icao}...`);

      // Chamada via proxy backend (redemet-proxy.js localmente, ou Serverless
      // Functions em /api na Vercel) - a chave DECEA fica só no servidor,
      // nunca chega ao bundle do navegador.
      const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? '';

      const url = `${PROXY_URL}/api/rotaer/${icao}?area=rotaer`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000), // 10 segundos
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const text = await response.text();

        // Parse XML com fast-xml-parser (ignora &format=json - API retorna XML sempre)
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          parseTagValue: false,
        });

        let data;
        try {
          data = parser.parse(text);
          console.log(`[useRotaer] ✅ XML parseado com sucesso para ${icao}`);
        } catch (parseError) {
          console.error(`[useRotaer] ❌ Erro ao parsear XML:`, parseError);
          data = {};
        }

        // 🔍 DEBUG PROFUNDO - Revelar estrutura completa
        console.log(`[useRotaer] 📊 Tipo de dados recebido:`, typeof data);
        console.log(`[useRotaer] 🔑 Chaves do objeto:`, data && typeof data === 'object' ? Object.keys(data) : 'N/A (texto)');
        console.log(`[useRotaer] 📋 DADOS BRUTOS COMPLETOS:`, JSON.stringify(data).substring(0, 3000));

        // Se tem estrutura aninhada, procurar por aerodrome em diferentes níveis
        if (data && typeof data === 'object') {
          console.log(`[useRotaer] 🔎 Procurando 'aerodrome' em diferentes caminhos...`);
          console.log(`[useRotaer] - data.aerodrome?`, data.aerodrome ? 'ENCONTRADO' : 'não encontrado');
          console.log(`[useRotaer] - data.aisweb?`, data.aisweb ? 'ENCONTRADO' : 'não encontrado');
          console.log(`[useRotaer] - data.ROTAER?`, data.ROTAER ? 'ENCONTRADO' : 'não encontrado');

          // Se tem aisweb, tentar acessar
          if (data.aisweb) {
            console.log(`[useRotaer] 🎯 AISWEB encontrado! Chaves:`, Object.keys(data.aisweb).slice(0, 10));
            console.log(`[useRotaer] 📊 aisweb.runways?`, data.aisweb.runways ? 'SIM' : 'NÃO');
            console.log(`[useRotaer] 📊 aisweb.services?`, data.aisweb.services ? 'SIM' : 'NÃO');
          }
        }

        // Extrair dados da resposta
        const rotaerData: RotaerData = {
          pistas: extractPistas(data),
          acnPcn: extractAcnPcn(data),
          tipoOperacao: extractTipoOperacao(data),
          papi: extractPapi(data),
          frequencias: extractFrequencias(data),
          navAids: extractNavAids(data),
          iluminacao: extractIluminacao(data),
          combustivel: extractCombustivel(data),
          servicos: extractServicos(data),
        };

        console.log(`[useRotaer] ✅ ROTAER obtido para ${icao}`, rotaerData);
        return rotaerData;
      } catch (error) {
        console.error(`[useRotaer] ❌ Erro ao buscar ROTAER:`, error);
        return {
          pistas: 'N/A',
          frequencias: [],
          navAids: 'N/A',
          iluminacao: false,
          combustivel: [],
          servicos: [],
        };
      }
    },
    enabled: !!icao && isValidIcaoCode(icao),
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  // Retorna estrutura esperada pelos componentes
  return {
    rotaer: query.data || {},
    isLoading: query.isLoading,
    error: query.error,
  };
}


// XMLParser com elementos que têm atributos retorna {"#text": "valor", "@_attr": "..."}
// Extrair o valor correto
function getTextValue(val: any): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && val['#text']) return String(val['#text']);
  return '';
}

// Funções de extração para dados parseados com XMLParser
export function extractPistas(data: any): string {
  try {
    if (!data || typeof data === 'string') return 'N/A';

    const runways = data?.aisweb?.runways?.runway;
    if (!runways) return 'N/A';

    const runway = Array.isArray(runways) ? runways[0] : runways;
    if (!runway) return 'N/A';

    const ident = runway['@_ident'] || runway.ident;
    const length = getTextValue(runway.length);
    const width = getTextValue(runway.width);
    const surface = getTextValue(runway.surface);

    if (ident && length && width) {
      return `${ident} | ${length}m × ${width}m | ${surface || ''}`;
    } else if (length && width) {
      return `${length}m × ${width}m`;
    }

    return 'N/A';
  } catch (e) {
    console.error(`[extractPistas] ❌ Erro:`, e);
    return 'N/A';
  }
}

/**
 * Código de resistência do pavimento (ACN/PCN), ex: "54/F/A/X/T".
 * Ver referência: memória "Guia de legendas do ROTAER" (seção 5).
 */
export function extractAcnPcn(data: any): string {
  try {
    if (!data || typeof data === 'string') return 'N/A';

    const runways = data?.aisweb?.runways?.runway;
    if (!runways) return 'N/A';

    const runway = Array.isArray(runways) ? runways[0] : runways;
    if (!runway) return 'N/A';

    const acnPcn = getTextValue(runway.surface_c);
    return acnPcn || 'N/A';
  } catch (e) {
    console.error(`[extractAcnPcn] ❌ Erro:`, e);
    return 'N/A';
  }
}

const TIPO_OPERACAO_DESCRICAO: Record<string, string> = {
  'VFR IFR': 'VFR dia/noite + IFR dia/noite',
  'IFR': 'VFR dia + IFR dia/noite',
  'IFR DIURNA': 'VFR dia + IFR dia',
  'VFR IFR DIURNA': 'VFR dia/noite + IFR dia',
  'VFR': 'VFR dia/noite',
};

/**
 * Tipo de operação do aeródromo (VFR/IFR), ex: "VFR IFR".
 * Ver referência: memória "Guia de legendas do ROTAER" (seção 3).
 */
export function extractTipoOperacao(data: any): string {
  try {
    if (!data || typeof data === 'string') return 'N/A';

    const tipoOperacao = getTextValue(data?.aisweb?.typeOpr) || data?.aisweb?.typeOpr;
    if (!tipoOperacao || typeof tipoOperacao !== 'string') return 'N/A';

    const descricao = TIPO_OPERACAO_DESCRICAO[tipoOperacao.trim()];
    return descricao ? `${tipoOperacao} (${descricao})` : tipoOperacao;
  } catch (e) {
    console.error(`[extractTipoOperacao] ❌ Erro:`, e);
    return 'N/A';
  }
}

/**
 * PAPI (luz L9 da tabela de iluminação) por cabeceira de pista.
 * Ver referência: memória "Guia de legendas do ROTAER" (seção 6).
 */
export function extractPapi(data: any): string {
  try {
    if (!data || typeof data === 'string') return 'N/A';

    const runways = data?.aisweb?.runways?.runway;
    if (!runways) return 'N/A';

    const runwaysArray = Array.isArray(runways) ? runways : [runways];
    const resultados: string[] = [];

    runwaysArray.forEach((runway: any) => {
      const thrs = runway?.thr;
      if (!thrs) return;

      const thrsArray = Array.isArray(thrs) ? thrs : [thrs];

      thrsArray.forEach((thr: any) => {
        const cabeceira = getTextValue(thr?.ident) || thr?.ident;
        if (!cabeceira) return;

        const lightsRaw = thr?.lights?.light;
        if (!lightsRaw) {
          resultados.push(`${cabeceira}: —`);
          return;
        }

        const lightsArray = Array.isArray(lightsRaw) ? lightsRaw : [lightsRaw];
        const temPapi = lightsArray.some((light: any) => {
          const codigo = typeof light === 'string' ? light : light?.['#text'];
          return codigo === 'L9';
        });

        resultados.push(`${cabeceira}: ${temPapi ? 'PAPI' : '—'}`);
      });
    });

    return resultados.length > 0 ? resultados.join(' · ') : 'N/A';
  } catch (e) {
    console.error(`[extractPapi] ❌ Erro:`, e);
    return 'N/A';
  }
}

export function extractFrequencias(data: any): string[] {
  try {
    if (!data || typeof data === 'string') return [];

    const services = data?.aisweb?.services?.service;
    if (!services) return [];

    const servicesArray = Array.isArray(services) ? services : [services];
    const freqs: string[] = [];

    servicesArray.forEach((service: any) => {
      // XMLParser transforma type="COM" em @_type="COM"
      if (service?.['@_type'] === 'COM' || service?.type === 'COM') {
        // Frequências estão em service.freqs.freq (pode ser string ou {#text})
        const freqObj = service?.freqs?.freq;
        if (freqObj) {
          const freqValue = typeof freqObj === 'string' ? freqObj : freqObj['#text'];
          if (freqValue) {
            freqs.push(`${freqValue} MHz`);
          }
        }
      }
    });

    return freqs;
  } catch (e) {
    console.error(`[extractFrequencias] ❌ Erro:`, e);
    return [];
  }
}

export function extractNavAids(data: any): string {
  try {
    if (!data || typeof data === 'string') return 'N/A';

    const services = data?.aisweb?.services?.service;
    if (!services) return 'N/A';

    const servicesArray = Array.isArray(services) ? services : [services];
    console.log(`[extractNavAids] 🔍 Tipos de serviços disponíveis:`, servicesArray.map((s: any) => s?.['@_type']));

    const navService = servicesArray.find((service: any) =>
      service?.['@_type'] === 'NAV' || service?.type === 'NAV'
    );

    if (navService) {
      const ident = navService?.ident || navService?.callsign;
      const freqObj = navService?.freqs?.freq;
      const freq = typeof freqObj === 'string' ? freqObj : freqObj?.['#text'];

      if (ident) {
        return `${ident}${freq ? ` (${freq} MHz)` : ''}`;
      }
    }

    console.log(`[extractNavAids] ⚠️ Nenhum serviço NAV encontrado`);
    return 'N/A';
  } catch (e) {
    console.error(`[extractNavAids] ❌ Erro:`, e);
    return 'N/A';
  }
}

export function extractIluminacao(data: any): boolean {
  try {
    if (!data || typeof data === 'string') return false;

    const runways = data?.aisweb?.runways?.runway;
    if (!runways) return false;

    const runway = Array.isArray(runways) ? runways[0] : runways;
    if (!runway) return false;

    // lights pode ser array ou objeto
    const lights = runway?.lights;
    if (!lights) return false;

    // Se for array, há iluminação
    if (Array.isArray(lights) && lights.length > 0) return true;

    // Se for objeto/string
    if (typeof lights === 'object') return true;
    if (typeof lights === 'string') return lights !== 'false';

    return !!lights;
  } catch (e) {
    console.error(`[extractIluminacao] ❌ Erro:`, e);
    return false;
  }
}

export function extractCombustivel(data: any): string[] {
  try {
    if (!data || typeof data === 'string') return [];

    const services = data?.aisweb?.services?.service;
    if (!services) return [];

    const servicesArray = Array.isArray(services) ? services : [services];
    const combustiveis: string[] = [];

    servicesArray.forEach((service: any) => {
      // Combustível está em AirportSuppliesService
      if (service?.['@_type'] === 'AirportSuppliesService' || service?.['@_type'] === 'FUEL') {
        // Verificar se fuel existe e não é vazio
        const fuel = service?.fuel;
        if (!fuel || fuel === '') return; // Sair se fuel não existe ou é string vazia

        // fuel.span pode ser: objeto único, array de objetos, ou string
        const spanData = fuel?.span;
        if (!spanData) return;

        // Converter para array para processar uniformemente
        const spans = Array.isArray(spanData) ? spanData : [spanData];

        spans.forEach((fuelObj: any) => {
          // Procurar em @_title primeiro (descrição), depois em #text
          const fuelText = typeof fuelObj === 'string'
            ? fuelObj
            : (fuelObj?.['@_title'] || fuelObj?.['#text']);

          if (fuelText) {
            // Procurar menções de JET A-1
            if ((fuelText.includes('JET A-1') || fuelText.includes('JET A')) && !combustiveis.includes('Jet A-1')) {
              combustiveis.push('Jet A-1');
            }
            // Procurar menções de AVGAS
            if ((fuelText.includes('AVGAS') || fuelText.includes('100LL')) && !combustiveis.includes('Avgas')) {
              combustiveis.push('Avgas');
            }
          }
        });
      }
    });

    return combustiveis;
  } catch (e) {
    console.error(`[extractCombustivel] ❌ Erro:`, e);
    return [];
  }
}

export function extractServicos(data: any): string[] {
  try {
    if (!data || typeof data === 'string') return [];

    const servicos: string[] = [];

    // Tentar obter de remarks/observações
    const remarks = data?.aisweb?.remarks;
    if (remarks) {
      const remarkArray = Array.isArray(remarks) ? remarks : [remarks];
      remarkArray.slice(0, 3).forEach((r: any) => {
        if (typeof r === 'string' && r.trim()) {
          servicos.push(r);
        }
      });
    }

    return servicos;
  } catch (e) {
    console.error(`[extractServicos] ❌ Erro:`, e);
    return [];
  }
}
