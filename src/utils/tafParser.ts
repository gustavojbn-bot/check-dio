/**
 * Parser de TAF (Terminal Aerodrome Forecast) - Extrai e interpreta a previsão
 * a partir da mensagem bruta REDEMET.
 *
 * Estrutura padrão TAF (mesma família de códigos do METAR, ver metarParser.ts):
 *   TAF [AMD|COR] ICAO DDhhmmZ DDhh/DDhh [vento] [visibilidade] [nuvens] [TX../TN..]
 *   [BECMG DDhh/DDhh ...] [TEMPO DDhh/DDhh ...] [FMDDhhmm ...] [PROB30|40 [TEMPO] DDhh/DDhh ...]
 *   [RMK ...]=
 *
 * Exemplo real: "TAF SBRP 311930Z 3100/3112 11007KT CAVOK TX24/0100Z TN15/0110Z RMK PGM="
 */

import { extrairVisibilidade } from './metarParser';

export type TafIndicador = 'INICIAL' | 'BECMG' | 'TEMPO' | 'FM' | 'PROB30' | 'PROB40';

export interface TafPeriodo {
  indicador: TafIndicador;
  periodoTexto: string;
  vento: string | null;
  visibilidade: string | null;
  nuvens: string | null;
  bruto: string;
}

export interface TafTemperatura {
  valor: number;
  quando: string;
}

export interface ParsedTaf {
  icao: string | null;
  tipo: 'TAF' | 'TAF AMD' | 'TAF COR';
  emissao: string | null;
  validadeInicio: string | null;
  validadeFim: string | null;
  periodos: TafPeriodo[];
  temperaturaMaxima: TafTemperatura | null;
  temperaturaMinima: TafTemperatura | null;
  taf_bruto: string;
}

const LABEL_INDICADOR: Record<TafIndicador, string> = {
  INICIAL: 'Previsão inicial',
  BECMG: 'Mudança gradual (BECMG)',
  TEMPO: 'Flutuação temporária (TEMPO)',
  FM: 'Mudança repentina (FM)',
  PROB30: 'Probabilidade 30% (PROB30)',
  PROB40: 'Probabilidade 40% (PROB40)',
};

export function getIndicadorLabel(indicador: TafIndicador): string {
  return LABEL_INDICADOR[indicador];
}

function formatDiaHora(dia: string, hora: string): string {
  return `dia ${dia} às ${hora}:00Z`;
}

function formatVento(segmento: string): string | null {
  if (/\b00000KT\b/.test(segmento)) {
    return 'Calmo';
  }

  const variavel = segmento.match(/\bVRB(\d{2,3})KT\b/);
  if (variavel) {
    return `Variável a ${parseInt(variavel[1])}kt`;
  }

  const fixo = segmento.match(/\b(\d{3})(\d{2,3})(?:G(\d{2,3}))?KT\b/);
  if (fixo) {
    const direcao = fixo[1];
    const velocidade = parseInt(fixo[2]);
    const rajada = fixo[3] ? `, rajadas de ${parseInt(fixo[3])}kt` : '';
    return `${direcao}° a ${velocidade}kt${rajada}`;
  }

  return null;
}

function formatVisibilidade(segmento: string): string | null {
  if (/\bCAVOK\b/.test(segmento)) {
    return 'CAVOK (≥10km, sem nuvens significativas abaixo de 5000ft)';
  }

  const vis = extrairVisibilidade(segmento);
  if (vis === null) {
    return null;
  }

  return vis >= 10000 ? '≥10km' : `${vis}m`;
}

function formatNuvens(segmento: string): string | null {
  const padraoNuvem = /\b(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?\b/g;
  const grupos = Array.from(segmento.matchAll(padraoNuvem)).map((m) => {
    const tipo = m[1];
    const altura = parseInt(m[2]) * 100;
    const especial = m[3] ? ` (${m[3]})` : '';
    return `${tipo} ${altura}ft${especial}`;
  });

  if (grupos.length === 0) {
    return null;
  }

  return grupos.join(', ');
}

/**
 * Divide o corpo do TAF (após validade) em segmentos por indicador de mudança:
 * BECMG, TEMPO, FMddhhmm, PROB30/40 (com TEMPO opcional junto).
 */
function segmentar(corpo: string): { indicador: TafIndicador; periodoTexto: string; texto: string }[] {
  const padraoIndicador = /\b(BECMG|TEMPO|FM\d{6}|PROB(?:30|40)(?:\s+TEMPO)?)\b/g;
  const matches = Array.from(corpo.matchAll(padraoIndicador));

  const segmentos: { indicador: TafIndicador; periodoTexto: string; texto: string }[] = [];

  // Segmento inicial: do começo do corpo até o primeiro indicador de mudança
  const fimInicial = matches.length > 0 ? matches[0].index! : corpo.length;
  const textoInicial = corpo.slice(0, fimInicial).trim();
  if (textoInicial) {
    segmentos.push({ indicador: 'INICIAL', periodoTexto: 'Durante toda a validade, salvo mudanças abaixo', texto: textoInicial });
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const inicioTexto = match.index! + match[0].length;
    const fimTexto = i + 1 < matches.length ? matches[i + 1].index! : corpo.length;
    const texto = corpo.slice(inicioTexto, fimTexto).trim();
    const cabecalho = match[0];

    let indicador: TafIndicador;
    let periodoTexto: string;

    if (cabecalho.startsWith('FM')) {
      indicador = 'FM';
      const fm = cabecalho.match(/FM(\d{2})(\d{2})(\d{2})/)!;
      periodoTexto = `A partir do dia ${fm[1]} às ${fm[2]}:${fm[3]}Z`;
    } else if (cabecalho.startsWith('PROB')) {
      indicador = cabecalho.startsWith('PROB30') ? 'PROB30' : 'PROB40';
      const periodo = texto.match(/^(\d{2})(\d{2})\/(\d{2})(\d{2})/);
      periodoTexto = periodo
        ? `entre ${formatDiaHora(periodo[1], periodo[2])} e ${formatDiaHora(periodo[3], periodo[4])}`
        : 'período não identificado';
    } else {
      indicador = cabecalho as TafIndicador; // 'BECMG' | 'TEMPO'
      const periodo = texto.match(/^(\d{2})(\d{2})\/(\d{2})(\d{2})/);
      periodoTexto = periodo
        ? `entre ${formatDiaHora(periodo[1], periodo[2])} e ${formatDiaHora(periodo[3], periodo[4])}`
        : 'período não identificado';
    }

    segmentos.push({ indicador, periodoTexto, texto });
  }

  return segmentos;
}

export function parseTaf(tafBruto: string | null | undefined): ParsedTaf | null {
  if (!tafBruto || typeof tafBruto !== 'string') {
    return null;
  }

  try {
    const upper = tafBruto.toUpperCase().trim();

    const cabecalho = upper.match(/TAF\s+(AMD|COR)?\s*([A-Z]{4})\s+(\d{2})(\d{2})(\d{2})Z\s+(\d{2})(\d{2})\/(\d{2})(\d{2})/);
    if (!cabecalho) {
      return {
        icao: null,
        tipo: 'TAF',
        emissao: null,
        validadeInicio: null,
        validadeFim: null,
        periodos: [],
        temperaturaMaxima: null,
        temperaturaMinima: null,
        taf_bruto: tafBruto,
      };
    }

    const [, amdCor, icao, diaEmissao, horaEmissao, minEmissao, diaIni, horaIni, diaFim, horaFim] = cabecalho;

    // Remove remarks (RMK ...) e o terminador "=" antes de segmentar o corpo previsional
    const semRmk = upper.slice(cabecalho.index! + cabecalho[0].length).split(/\bRMK\b/)[0].replace(/=\s*$/, '');

    // Temperaturas extremas ficam na previsão inicial, antes dos indicadores de mudança
    const matchTX = semRmk.match(/TX(M)?(\d{2})\/(\d{2})(\d{2})?Z/);
    const matchTN = semRmk.match(/TN(M)?(\d{2})\/(\d{2})(\d{2})?Z/);

    const temperaturaMaxima: TafTemperatura | null = matchTX
      ? {
          valor: parseInt(matchTX[2]) * (matchTX[1] ? -1 : 1),
          quando: matchTX[4] ? formatDiaHora(matchTX[3], matchTX[4]) : `às ${matchTX[3]}:00Z`,
        }
      : null;

    const temperaturaMinima: TafTemperatura | null = matchTN
      ? {
          valor: parseInt(matchTN[2]) * (matchTN[1] ? -1 : 1),
          quando: matchTN[4] ? formatDiaHora(matchTN[3], matchTN[4]) : `às ${matchTN[3]}:00Z`,
        }
      : null;

    // Remove os grupos de temperatura do corpo antes de segmentar (não fazem parte de vento/nuvens)
    const corpoSemTemp = semRmk.replace(/TX(M)?\d{2}\/\d{2,4}Z/g, '').replace(/TN(M)?\d{2}\/\d{2,4}Z/g, '');

    const segmentos = segmentar(corpoSemTemp);

    const periodos: TafPeriodo[] = segmentos.map((seg) => ({
      indicador: seg.indicador,
      periodoTexto: seg.periodoTexto,
      vento: formatVento(seg.texto),
      visibilidade: formatVisibilidade(seg.texto),
      nuvens: formatNuvens(seg.texto),
      bruto: seg.texto,
    }));

    return {
      icao,
      tipo: amdCor === 'AMD' ? 'TAF AMD' : amdCor === 'COR' ? 'TAF COR' : 'TAF',
      emissao: `dia ${diaEmissao} às ${horaEmissao}:${minEmissao}Z`,
      validadeInicio: formatDiaHora(diaIni, horaIni),
      validadeFim: formatDiaHora(diaFim, horaFim),
      periodos,
      temperaturaMaxima,
      temperaturaMinima,
      taf_bruto: tafBruto,
    };
  } catch (error) {
    console.error('[parseTaf] Erro ao parsear TAF:', error);
    return null;
  }
}
