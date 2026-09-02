/**
 * Parser de METAR - Extrai informações da mensagem bruta REDEMET
 *
 * Exemplo de METAR bruto: "METAR SBAE 281400Z 02012KT CAVOK 28/17 Q1014="
 *
 * Estrutura padrão METAR:
 * METAR [ICAO] [DDhhmm]Z [vento] [visibilidade] [condições] [temp/ponto] [pressão] [informações adicionais]=
 */

export interface ParsedMetar {
  status_metar: 'bom' | 'atencao' | 'critico' | 'sem_dados';
  visibilidade_m?: number | null;
  teto_ft?: number | null;
  temperatura_c?: number | null;
  ponto_orvalho_c?: number | null;
  vento_direcao?: number | null;
  vento_velocidade_kt?: number | null;
  pressao_mb?: number | null;
  hora_obs?: string | null;
  metar_bruto?: string;
}

/**
 * Determina o status METAR baseado exclusivamente em visibilidade e teto,
 * segundo o critério interno da empresa:
 *
 *   BOM:      visibilidade >= 5000m  E   teto >= 1500ft
 *   ATENÇÃO:  visibilidade < 5000 e >= 1500m  E/OU  teto < 1500 e >= 600ft
 *   CRÍTICO:  visibilidade < 1500m  E/OU  teto < 600ft
 *
 * "E/OU" é tratado como "o pior dos dois indicadores decide o status": se
 * qualquer um dos dois cair na faixa crítica o status é crítico; senão, se
 * qualquer um cair na faixa de atenção o status é atenção.
 *
 * Quando um grupo não aparece na mensagem (ex.: CAVOK omite visibilidade e
 * nuvens, ou não há grupo BKN/OVC), esse indicador é tratado como "sem
 * restrição" e não derruba o status sozinho.
 */
function determinarStatus(metar: string): 'bom' | 'atencao' | 'critico' {
  const upper = metar.toUpperCase();

  const tetoFt = extrairTeto(upper) ?? Infinity;
  const visibilidadeM = extrairVisibilidade(upper) ?? Infinity;

  if (tetoFt < 600 || visibilidadeM < 1500) {
    return 'critico';
  }

  if (tetoFt < 1500 || visibilidadeM < 5000) {
    return 'atencao';
  }

  return 'bom';
}

/**
 * Extrai temperatura e ponto de orvalho
 * Formato: TT/DD (ex: 28/17 = 28°C, ponto de orvalho 17°C)
 * Também: M02/M08 (negativos, ex: -2/-8)
 */
function extrairTemperatura(metar: string): {
  temperatura_c: number | null;
  ponto_orvalho_c: number | null;
} {
  const padrao = /(M)?(\d{2})\/(M)?(\d{2})/;
  const match = metar.match(padrao);

  if (!match) {
    return { temperatura_c: null, ponto_orvalho_c: null };
  }

  const tempNegativa = match[1] === 'M';
  const temp = parseInt(match[2]) * (tempNegativa ? -1 : 1);

  const orNegativa = match[3] === 'M';
  const orvalho = parseInt(match[4]) * (orNegativa ? -1 : 1);

  return {
    temperatura_c: temp,
    ponto_orvalho_c: orvalho,
  };
}

/**
 * Extrai pressão
 * Formato: Qxxxx (em mb, ex: Q1014 = 1014 mb)
 * Ou: Axxxx (em inHg)
 */
function extrairPressao(metar: string): number | null {
  const padrao = /Q(\d{4})/;
  const match = metar.match(padrao);

  if (!match) {
    return null;
  }

  return parseInt(match[1]);
}

/**
 * Extrai vento (direção e velocidade)
 * Formato: DDDssKT (ex: 02012KT = 020°, 12 nós)
 * Ou: VARIável (ex: 180V240)
 */
function extrairVento(metar: string): {
  vento_direcao: number | null;
  vento_velocidade_kt: number | null;
} {
  const padrao = /(\d{3})(\d{2})KT/;
  const match = metar.match(padrao);

  if (!match) {
    return { vento_direcao: null, vento_velocidade_kt: null };
  }

  return {
    vento_direcao: parseInt(match[1]),
    vento_velocidade_kt: parseInt(match[2]),
  };
}

/**
 * Extrai visibilidade
 * Formato: DDDD (metros, ex: 9999 = 10km+)
 * Ou: DDDDEE (com direção)
 * Ou: xSM (milhas, ex: 10SM)
 */
export function extrairVisibilidade(metar: string): number | null {
  // Primeiro tenta SM (milhas estatutárias)
  const padraoSM = /(\d+)SM/;
  const matchSM = metar.match(padraoSM);
  if (matchSM) {
    // Converter milhas para metros (1 SM ≈ 1609 m)
    return parseInt(matchSM[1]) * 1609;
  }

  // Depois tenta formato em metros (antes do vento ou nuvem)
  const padraoMetros = /\s(\d{4})\s/;
  const matchMetros = metar.match(padraoMetros);
  if (matchMetros) {
    const vis = parseInt(matchMetros[1]);
    // Se é 9999, significa 10km ou mais
    if (vis === 9999) {
      return 10000;
    }
    return vis;
  }

  return null;
}

/**
 * Extrai hora de observação
 * Formato: DDhhmm Z (ex: 281400Z = 28º dia, 14:00 UTC)
 */
function extrairHoraObs(metar: string): string | null {
  const padrao = /(\d{2})(\d{2})(\d{2})Z/;
  const match = metar.match(padrao);

  if (!match) {
    return null;
  }

  const dia = match[1];
  const hora = match[2];
  const minuto = match[3];

  return `${dia}/${hora}:${minuto}Z`;
}

/**
 * Função principal: Parseia METAR bruto
 */
export function parseMetar(metarBruto: string): ParsedMetar {
  if (!metarBruto || typeof metarBruto !== 'string') {
    return {
      status_metar: 'sem_dados',
    };
  }

  try {
    const upper = metarBruto.toUpperCase().trim();

    // Extrair todas as informações
    const status_metar = determinarStatus(upper);
    const { temperatura_c, ponto_orvalho_c } = extrairTemperatura(upper);
    const pressao_mb = extrairPressao(upper);
    const { vento_direcao, vento_velocidade_kt } = extrairVento(upper);
    const hora_obs = extrairHoraObs(upper);

    // CAVOK = Ceiling And Visibility OK: por convenção da OACI, o METAR omite os
    // grupos de visibilidade e nuvens nesse caso, então preenchemos os valores
    // padrão (visibilidade >= 10km, teto >= 5000ft) quando não houver grupo explícito.
    const isCavok = upper.includes('CAVOK');
    const visibilidade_m = extrairVisibilidade(upper) ?? (isCavok ? 10000 : null);
    const teto_ft = extrairTeto(upper) ?? (isCavok ? 5000 : null);

    return {
      status_metar,
      temperatura_c,
      ponto_orvalho_c,
      pressao_mb,
      vento_direcao,
      vento_velocidade_kt,
      visibilidade_m,
      teto_ft,
      hora_obs,
      metar_bruto: metarBruto,
    };
  } catch (error) {
    console.error('[parseMetar] Erro ao parsear METAR:', error);
    return {
      status_metar: 'sem_dados',
      metar_bruto: metarBruto,
    };
  }
}

/**
 * Extrai teto (ceiling) da mensagem METAR
 * Teto = altura da base da nuvem mais baixa acima de 500 ft
 */
export function extrairTeto(metar: string): number | null {
  const padraoNuvem = /(\w{2,3})(\d{3})/g;
  const matches = metar.toUpperCase().matchAll(padraoNuvem);

  for (const match of matches) {
    const tipo = match[1];
    const altitude = parseInt(match[2]) * 100; // Converter para pés

    // Teto é a primeira camada BKN/OVC reportada (grupos vêm em ordem crescente
    // de altura no METAR). Sem piso mínimo: um teto baixo (ex.: BKN003) precisa
    // contar para classificar corretamente como crítico (<600ft).
    if (tipo === 'BKN' || tipo === 'OVC') {
      return altitude;
    }
  }

  return null;
}
