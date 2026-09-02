import { useQuery } from '@tanstack/react-query';
import { isValidIcaoCode } from '@/lib/icao';
import { parseMetar, type ParsedMetar } from '@/utils/metarParser';

export type MetarData = ParsedMetar;

export function useMetarRotaer(icao: string | null) {
  const query = useQuery({
    queryKey: ['metar', icao],
    queryFn: async (): Promise<MetarData> => {
      if (!icao) {
        return { status_metar: 'sem_dados' };
      }

      if (!isValidIcaoCode(icao)) {
        console.error(`[useMetarRotaer] ❌ Código ICAO inválido: "${icao}" (esperado 4 letras maiúsculas)`);
        return { status_metar: 'sem_dados' };
      }

      console.log(`%c[useMetarRotaer] 🚀 Buscando METAR para ${icao}...`, 'background: #ff6b6b; color: white; padding: 2px 6px; border-radius: 3px;');

      // Chamada via proxy backend (redemet-proxy.js localmente, ou Serverless
      // Functions em /api na Vercel) - a chave REDEMET fica só no servidor,
      // nunca chega ao bundle do navegador. Sem VITE_PROXY_URL, usa caminho
      // relativo (funciona quando /api está no mesmo domínio, como na Vercel).
      const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? '';

      // Calcular datas
      const agora = new Date();
      const data_fim = agora.toISOString().slice(0, 13).replace('-', '').replace('-', '').replace('T', '');
      const data_ini = new Date(agora.getTime() - 3600000).toISOString().slice(0, 13).replace('-', '').replace('-', '').replace('T', '');

      const url = `${PROXY_URL}/api/metar/${icao}?data_ini=${data_ini}&data_fim=${data_fim}`;

      try {
        console.log(`%c[useMetarRotaer] 📡 Chamando API...`, 'background: #4c6ef5; color: white; padding: 2px 6px; border-radius: 3px;');

        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(30000), // 30 segundos (aumentado de 10s)
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const proxyResponse = await response.json();
        if (!proxyResponse.success) {
          console.warn(`[useMetarRotaer] ⚠️ Proxy retornou erro:`, proxyResponse.error);
          return { status_metar: 'sem_dados' };
        }

        // proxyResponse.data é a resposta bruta da REDEMET repassada pelo proxy
        const json = proxyResponse.data;
        console.log(`%c[useMetarRotaer] ✅ RESPOSTA RECEBIDA`, 'background: #51cf66; color: white; padding: 2px 6px; border-radius: 3px;');
        console.log('[useMetarRotaer] Tipo de data:', typeof json.data, 'Estrutura:', json);

        // Verificar resposta
        if (!json || !json.data) {
          console.warn(`[useMetarRotaer] ⚠️ Sem dados METAR para ${icao}`);
          return { status_metar: 'sem_dados' };
        }

        // IMPORTANTE: json.data pode ser um ARRAY, um OBJETO com paginação, ou um OBJETO simples!
        let dataArray: any[] = [];

        // Caso 1: json.data é um ARRAY direto
        if (Array.isArray(json.data)) {
          console.log(`[useMetarRotaer] 📊 Recebido como ARRAY com ${json.data.length} elemento(s)`);
          dataArray = json.data;
        }
        // Caso 2: json.data é um OBJETO com propriedade "data" que é um ARRAY (paginação)
        else if (typeof json.data === 'object' && Array.isArray(json.data.data)) {
          console.log(`[useMetarRotaer] 📊 Recebido como PAGINAÇÃO com ${json.data.data.length} METAR(s) na propriedade 'data'`);
          dataArray = json.data.data;
        }
        // Caso 3: json.data é um OBJETO simples (sem paginação)
        else if (typeof json.data === 'object') {
          console.log(`[useMetarRotaer] 📊 Recebido como OBJETO simples, convertendo para array...`);
          dataArray = [json.data];
        }
        else {
          console.warn(`[useMetarRotaer] ⚠️ Tipo inesperado para data: ${typeof json.data}`);
          return { status_metar: 'sem_dados' };
        }

        if (dataArray.length === 0) {
          console.warn(`[useMetarRotaer] ⚠️ Array vazio`);
          return { status_metar: 'sem_dados' };
        }

        // Analisar primeira elemento
        console.log(`[useMetarRotaer] 🔍 Chaves disponíveis:`, Object.keys(dataArray[0]));
        console.log(`[useMetarRotaer] 📋 Primeiro elemento:`, dataArray[0]);

        // AUTO-DETECÇÃO: Procurar a propriedade que contém a mensagem METAR
        const primeiroElemento = dataArray[0];
        const chavesDisponiveis = Object.keys(primeiroElemento);

        let propriedadeMensagem: string | null = null;
        let mensagemExtraida: string | null = null;

        // Estratégia 1: Procurar por propriedade que contém a palavra "METAR"
        console.log('[useMetarRotaer] 🔎 ESTRATÉGIA 1: Procurando propriedade com "METAR"...');
        for (const chave of chavesDisponiveis) {
          const valor = primeiroElemento[chave];
          if (typeof valor === 'string' && valor.toUpperCase().includes('METAR')) {
            propriedadeMensagem = chave;
            console.log(`[useMetarRotaer] ✅ Estratégia 1 SUCESSO: "${chave}" contém METAR`);
            break;
          }
        }

        // Estratégia 2: Tentar propriedades comuns por nome
        if (!propriedadeMensagem) {
          console.log('[useMetarRotaer] 🔎 ESTRATÉGIA 2: Procurando por nomes conhecidos...');
          const propriedadesComuns = ['mens', 'mes', 'mensagem', 'message', 'msg', 'bruta_msg', 'conteudo', 'data', 'texto', 'raw_message'];
          for (const prop of propriedadesComuns) {
            if (prop in primeiroElemento) {
              const valor = primeiroElemento[prop];
              if (typeof valor === 'string' && valor.length > 5) {
                propriedadeMensagem = prop;
                console.log(`[useMetarRotaer] ✅ Estratégia 2 SUCESSO: "${prop}" encontrada`);
                break;
              }
            }
          }
        }

        // Estratégia 3: Usar primeira propriedade string com comprimento significativo
        if (!propriedadeMensagem) {
          console.log('[useMetarRotaer] 🔎 ESTRATÉGIA 3: Procurando primeira string significativa...');
          for (const chave of chavesDisponiveis) {
            const valor = primeiroElemento[chave];
            if (typeof valor === 'string' && valor.length > 20) {
              propriedadeMensagem = chave;
              console.log(`[useMetarRotaer] ✅ Estratégia 3 SUCESSO: usando "${chave}" (${valor.length} caracteres)`);
              break;
            }
          }
        }

        if (!propriedadeMensagem) {
          console.error(`[useMetarRotaer] ❌ NENHUMA PROPRIEDADE DETECTADA. Chaves:`, chavesDisponiveis);
          return { status_metar: 'sem_dados' };
        }

        // Pegar o METAR mais recente (iterando do final para o início)
        console.log(`[useMetarRotaer] 🔄 Procurando METAR válido em ${dataArray.length} registros...`);
        for (let i = dataArray.length - 1; i >= 0; i--) {
          const elem = dataArray[i];
          const msg = elem[propriedadeMensagem];
          if (msg && typeof msg === 'string' && msg.length > 0) {
            mensagemExtraida = msg;
            console.log(`[useMetarRotaer] ✅ METAR extraído do índice ${i}`);
            break;
          }
        }

        if (!mensagemExtraida) {
          console.error(`[useMetarRotaer] ❌ Falha ao extrair mensagem da propriedade "${propriedadeMensagem}"`);
          return { status_metar: 'sem_dados' };
        }

        console.log(`[useMetarRotaer] 📨 Mensagem extraída (primeiros 100 chars):`, mensagemExtraida.substring(0, 100));

        // Parsear mensagem METAR
        const metarData = parseMetar(mensagemExtraida);

        console.log(`[useMetarRotaer] ✅ METAR FINALIZADO PARA ${icao}:`, metarData);
        return metarData;
      } catch (error) {
        console.error(`[useMetarRotaer] ❌ ERRO:`, error);
        return { status_metar: 'sem_dados' };
      }
    },
    enabled: !!icao && isValidIcaoCode(icao),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  return {
    metar: query.data || { status_metar: 'sem_dados' as const },
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function getMetarColor(status: string | undefined): string {
  if (!status) return '#000000';

  switch (status.toLowerCase()) {
    case 'bom':
    case 'vfr':
      return '#22c55e';
    case 'atencao':
    case 'mvfr':
      return '#f59e0b';
    case 'critico':
    case 'ifr':
    case 'lifr':
      return '#ef4444';
    case 'sem_dados':
    default:
      return '#000000';
  }
}
