/**
 * lib/aeroportos.ts
 *
 * Tipos, validações e utilitários para aeroportos de São Paulo.
 * Inclui dados dos 16 aeroportos, validação de coordenadas e conversão de tipos.
 */

import type { Severidade } from "./severidade";
import type { CategoriaMetar } from "./metar";

// ============================================================================
// CONSTANTES E BOUNDS
// ============================================================================

export const BOUNDS_SP = {
  minLat: -24.0,  // Sul (região de Uberaba/Franca)
  maxLat: -19.0,  // Norte (região de Ribeirão Preto)
  minLon: -50.0,  // Oeste (região de Jales/Adamantina)
  maxLon: -44.0,  // Leste (região de Ubatuba/litoral)
} as const;

// Tolerância para aceitar coordenadas ligeiramente fora dos bounds
const TOLERANCIA_BOUNDS = 0.1;

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface PistaRotaer {
  designacao: string;     // Ex: "09/27", "01L/19R"
  dimensoes: string;      // Ex: "2500 x 45 m"
  piso: string;           // Ex: "Asfalto", "Concreto"
  pcn: string;            // Ex: "PCN 40/F/D/X/T"
}

export interface ContatoRotaer {
  nome: string;
  funcao: string;         // Ex: "Chefe de Aeroporto", "Técnico"
  telefone: string;
  email: string;
}

/**
 * Dados ROTAER completos de um aeroporto (do banco de dados)
 */
export interface AeroportoRotaer {
  id: string;
  aeroporto_id: string;
  icao: string;
  nome: string;
  cidade: string;
  regional: string;      // Ex: "Norte", "Sudeste"
  latitude: string | null;      // Formato: "-21.1414" ou null
  longitude: string | null;     // Formato: "-50.4125" ou null
  elevacao_ft: number | null;
  pistas: PistaRotaer[] | null;
  balizamento: string | null;
  luzes: string | null;
  auxilios_navegacao: string | null;
  ats_orgao: string | null;
  ats_frequencias: string | null;
  ats_horario: string | null;
  sci_categoria: string | null;
  combustivel: string | null;
  horario_funcionamento: string | null;
  contatos: ContatoRotaer[] | null;
  observacoes: string | null;
  fonte: "aisweb" | "manual";
  updated_at: string;
}

/**
 * Ponto para o mapa (dados compilados)
 */
export interface PontoAeroporto {
  id: string;
  icao: string;
  nome: string;
  cidade: string;
  regional: string;
  latitude: number | null;        // Número: -21.1414
  longitude: number | null;       // Número: -50.4125
  voa?: string;       // Rota de VOA (São Paulo ou Sudeste) - DEPRECATED, usar concessao
  concessao?: string; // Concessão (VOA-SP ou VOA-SE) - source of truth
  status?: StatusOperacional;
  metar?: CategoriaMetar;
  metarInfo?: { teto_ft: number | null; visibilidade_m: number | null } | null;
  ocorrencia?: Severidade | null;
  elevacao_ft?: number | null;
}

export type StatusOperacional = "normal" | "atencao" | "critico" | "offline";

export interface ValidacaoLatLon {
  valido: boolean;
  latitude: number | null;
  longitude: number | null;
  erro?: string;
}

// ============================================================================
// DADOS DOS 16 AEROPORTOS DE SÃO PAULO (coordenadas reais)
// ============================================================================

export const AEROPORTOS_SP: Array<Omit<AeroportoRotaer, "id" | "pistas" | "contatos" | "updated_at">> = [
  {
    aeroporto_id: "sbao",
    icao: "SBAO",
    nome: "Araçatuba",
    cidade: "Araçatuba",
    regional: "Oeste",
    latitude: "-21.1414",
    longitude: "-50.4125",
    elevacao_ft: 1690,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "119.2",
    ats_horario: "0600-2200 UTC-3",
    sci_categoria: "Segurança",
    combustivel: "AVGAS 100LL, Jet A1",
    horario_funcionamento: "06:00-22:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbul",
    icao: "SBUL",
    nome: "Ubatuba",
    cidade: "Ubatuba",
    regional: "Litoral Nord.",
    latitude: "-23.1864",
    longitude: "-45.0665",
    elevacao_ft: 33,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "120.9",
    ats_horario: "0600-1900 UTC-3",
    sci_categoria: "Turismo",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "06:00-19:00 UTC-3",
    observacoes: "Próximo ao litoral, influências meteo",
    fonte: "manual",
  },
  {
    aeroporto_id: "sbkp",
    icao: "SBKP",
    nome: "Campinas",
    cidade: "Campinas",
    regional: "Interior Noroeste",
    latitude: "-22.9117",
    longitude: "-47.1298",
    elevacao_ft: 2179,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: "Campinas APP",
    ats_frequencias: "121.5",
    ats_horario: "0600-2200 UTC-3",
    sci_categoria: "Infraestrutura",
    combustivel: "AVGAS 100LL, Jet A1",
    horario_funcionamento: "06:00-22:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbrp",
    icao: "SBRP",
    nome: "Ribeirão Preto",
    cidade: "Ribeirão Preto",
    regional: "Nordeste",
    latitude: "-21.1347",
    longitude: "-47.5801",
    elevacao_ft: 2493,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: "Ribeirão APP",
    ats_frequencias: "119.7",
    ats_horario: "0600-2200 UTC-3",
    sci_categoria: "Infraestrutura",
    combustivel: "AVGAS 100LL, Jet A1",
    horario_funcionamento: "06:00-22:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbsr",
    icao: "SBSR",
    nome: "São Carlos",
    cidade: "São Carlos",
    regional: "Interior Central",
    latitude: "-22.2265",
    longitude: "-48.9681",
    elevacao_ft: 2810,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "120.3",
    ats_horario: "0600-2000 UTC-3",
    sci_categoria: "Pesquisa",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "06:00-20:00 UTC-3",
    observacoes: "Base de pesquisas aeronáuticas",
    fonte: "manual",
  },
  {
    aeroporto_id: "sbgp",
    icao: "SBGP",
    nome: "Guaratinguetá",
    cidade: "Guaratinguetá",
    regional: "Vale do Paraíba",
    latitude: "-22.7897",
    longitude: "-45.4833",
    elevacao_ft: 1670,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "121.1",
    ats_horario: "0600-1900 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "06:00-19:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbag",
    icao: "SBAG",
    nome: "Araraquara",
    cidade: "Araraquara",
    regional: "Centro-oeste",
    latitude: "-21.8078",
    longitude: "-48.1656",
    elevacao_ft: 2582,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "119.9",
    ats_horario: "0600-1900 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "06:00-19:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbmt",
    icao: "SBMT",
    nome: "Mato Grosso do Sul",
    cidade: "Maracaju",
    regional: "Sudoeste",
    latitude: "-21.6067",
    longitude: "-55.1975",
    elevacao_ft: 1890,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "120.5",
    ats_horario: "0700-1900 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL, Jet A1",
    horario_funcionamento: "07:00-19:00 UTC-3",
    observacoes: "Fora de SP (limite oeste)",
    fonte: "manual",
  },
  {
    aeroporto_id: "sbpf",
    icao: "SBPF",
    nome: "Pirassununga",
    cidade: "Pirassununga",
    regional: "Centro",
    latitude: "-21.9967",
    longitude: "-47.4348",
    elevacao_ft: 2379,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "120.7",
    ats_horario: "0600-1900 UTC-3",
    sci_categoria: "Militar",
    combustivel: "AVGAS 100LL, Jet A1",
    horario_funcionamento: "06:00-19:00 UTC-3",
    observacoes: "Base aérea (ALA 4)",
    fonte: "manual",
  },
  {
    aeroporto_id: "sbdb",
    icao: "SBDB",
    nome: "Dracena",
    cidade: "Dracena",
    regional: "Oeste",
    latitude: "-21.4631",
    longitude: "-51.5303",
    elevacao_ft: 1420,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "119.5",
    ats_horario: "0700-1800 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "07:00-18:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbad",
    icao: "SBAD",
    nome: "Adamantina",
    cidade: "Adamantina",
    regional: "Noroeste",
    latitude: "-21.6809",
    longitude: "-51.0769",
    elevacao_ft: 1330,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "119.1",
    ats_horario: "0700-1800 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "07:00-18:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbjd",
    icao: "SBJD",
    nome: "Jales",
    cidade: "Jales",
    regional: "Noroeste",
    latitude: "-20.2594",
    longitude: "-49.6475",
    elevacao_ft: 1260,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "119.3",
    ats_horario: "0700-1800 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "07:00-18:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbrr",
    icao: "SBRR",
    nome: "Rio Claro",
    cidade: "Rio Claro",
    regional: "Interior",
    latitude: "-22.4169",
    longitude: "-47.5658",
    elevacao_ft: 2368,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "120.1",
    ats_horario: "0600-1900 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "06:00-19:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbus",
    icao: "SBUS",
    nome: "Uberaba",
    cidade: "Uberaba",
    regional: "Sul",
    latitude: "-19.7658",
    longitude: "-47.4536",
    elevacao_ft: 2539,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "120.9",
    ats_horario: "0600-2000 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL, Jet A1",
    horario_funcionamento: "06:00-20:00 UTC-3",
    observacoes: "Fora de SP (limite sul)",
    fonte: "manual",
  },
  {
    aeroporto_id: "sbkm",
    icao: "SBKM",
    nome: "Kairumã",
    cidade: "Natividade da Serra",
    regional: "Nordeste",
    latitude: "-23.4428",
    longitude: "-44.5186",
    elevacao_ft: 1450,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "120.3",
    ats_horario: "0600-1900 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "06:00-19:00 UTC-3",
    observacoes: "Próximo ao litoral norte",
    fonte: "manual",
  },
  {
    aeroporto_id: "sbrl",
    icao: "SBRL",
    nome: "Marília",
    cidade: "Marília",
    regional: "Interior Sudeste",
    latitude: "-22.2086",
    longitude: "-49.9858",
    elevacao_ft: 2169,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "120.5",
    ats_horario: "0600-1900 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL",
    horario_funcionamento: "06:00-19:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
  {
    aeroporto_id: "sbrj",
    icao: "SBRJ",
    nome: "Itu",
    cidade: "Itu",
    regional: "Centro-sul",
    latitude: "-23.2617",
    longitude: "-47.2906",
    elevacao_ft: 1968,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: "119.7",
    ats_horario: "0600-2000 UTC-3",
    sci_categoria: "Regional",
    combustivel: "AVGAS 100LL, Jet A1",
    horario_funcionamento: "06:00-20:00 UTC-3",
    observacoes: null,
    fonte: "manual",
  },
];

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida se uma string é um número decimal válido (latitude ou longitude)
 * Exemplos válidos: "-21.1414", "21.1414", "-50", "47.5"
 */
export function validarFormatoNumerico(valor: string): boolean {
  if (!valor || String(valor).trim().length === 0) return false;
  return /^-?\d+(\.\d+)?$/.test(String(valor).trim());
}

/**
 * Valida se coordenadas estão dentro dos bounds de São Paulo
 * Aceita pequena tolerância (TOLERANCIA_BOUNDS)
 */
export function estaDentroDeSpBounds(latitude: number, longitude: number): boolean {
  return (
    latitude >= BOUNDS_SP.minLat - TOLERANCIA_BOUNDS &&
    latitude <= BOUNDS_SP.maxLat + TOLERANCIA_BOUNDS &&
    longitude >= BOUNDS_SP.minLon - TOLERANCIA_BOUNDS &&
    longitude <= BOUNDS_SP.maxLon + TOLERANCIA_BOUNDS
  );
}

/**
 * Valida latitude e longitude de forma completa
 * Retorna objeto com status, valores numéricos e mensagem de erro
 */
export function validarLatLon(latStr: string | null, lonStr: string | null): ValidacaoLatLon {
  // Vazio é permitido (será null)
  if (!latStr && !lonStr) {
    return { valido: true, latitude: null, longitude: null };
  }

  if (!latStr || !lonStr) {
    return {
      valido: false,
      latitude: null,
      longitude: null,
      erro: "Latitude e longitude devem estar ambas preenchidas ou ambas vazias",
    };
  }

  // Validar formato
  if (!validarFormatoNumerico(latStr)) {
    return {
      valido: false,
      latitude: null,
      longitude: null,
      erro: `Latitude inválida: "${latStr}" (use formato: -21.1414)`,
    };
  }

  if (!validarFormatoNumerico(lonStr)) {
    return {
      valido: false,
      latitude: null,
      longitude: null,
      erro: `Longitude inválida: "${lonStr}" (use formato: -50.4125)`,
    };
  }

  // Converter para number
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  // Validar ranges geográficos
  if (lat < -90 || lat > 90) {
    return {
      valido: false,
      latitude: null,
      longitude: null,
      erro: `Latitude fora do range: ${lat} (deve estar entre -90 e 90)`,
    };
  }

  if (lon < -180 || lon > 180) {
    return {
      valido: false,
      latitude: null,
      longitude: null,
      erro: `Longitude fora do range: ${lon} (deve estar entre -180 e 180)`,
    };
  }

  // Validar se está dentro de SP
  if (!estaDentroDeSpBounds(lat, lon)) {
    return {
      valido: false,
      latitude: lat,
      longitude: lon,
      erro: `Coordenadas fora de São Paulo: (${lat}, ${lon})`,
    };
  }

  return {
    valido: true,
    latitude: lat,
    longitude: lon,
  };
}

/**
 * Valida um número inteiro (elevação, etc)
 */
export function validarNumeroInteiro(valor: string | null): number | null {
if (!valor || String(valor).trim().length === 0) return null;
  const num = parseInt(valor, 10);
  if (isNaN(num)) throw new Error(`Valor não é um número inteiro: "${valor}"`);
  return num;
}

/**
 * Valida e limita string com comprimento máximo
 */
export function validarString(valor: string | null, maxLength: number): string | null {
if (!valor || String(valor).trim().length === 0) return null;
  return String(valor).trim().slice(0, maxLength);
}

// ============================================================================
// FUNÇÕES DE CONVERSÃO
// ============================================================================

/**
 * Determina a VOA (Rota) baseado na regional do aeroporto
 * Heurística: Sudeste e Litoral = VOA-SE, resto = VOA-SP
 */
export function determinarVOA(regional: string): "VOA-SP" | "VOA-SE" {
  const regiaoLower = String(regional || "").toLowerCase().trim();

  // VOA-SE: Sudeste, litoral, vale do paraíba
  if (
    regiaoLower.includes("sudeste") ||
    regiaoLower.includes("litoral") ||
    regiaoLower.includes("paraíba") ||
    regiaoLower.includes("vale") ||
    regiaoLower.includes("ubatuba") ||
    regiaoLower.includes("guaratinguetá") ||
    regiaoLower.includes("kairumã")
  ) {
    return "VOA-SE";
  }

  // VOA-SP: Default para resto (interior, oeste, noroeste, nordeste, etc)
  return "VOA-SP";
}

/**
 * Converte AeroportoRotaer → PontoAeroporto
 * Valida coordenadas e converte para números
 * Determina VOA automaticamente pela regional
 */
export function rotaerToPonto(
  rotaer: AeroportoRotaer,
  metar?: CategoriaMetar,
  ocorrencia?: Severidade | null,
): PontoAeroporto {
  const validacao = validarLatLon(rotaer.latitude, rotaer.longitude);

  return {
    id: rotaer.id,
    icao: rotaer.icao,
    nome: rotaer.nome,
    cidade: rotaer.cidade,
    regional: rotaer.regional,
    latitude: validacao.latitude,
    longitude: validacao.longitude,
    voa: determinarVOA(rotaer.regional),
    status: validacao.valido ? "normal" : "offline",
    metar,
    ocorrencia,
    elevacao_ft: rotaer.elevacao_ft ?? undefined,
  };
}

/**
 * Converte PontoAeroporto de volta para strings (para edição)
 */
export function pontoToRotaerForm(ponto: PontoAeroporto) {
  return {
    latitude: ponto.latitude ? String(ponto.latitude) : "",
    longitude: ponto.longitude ? String(ponto.longitude) : "",
    elevacao_ft: ponto.elevacao_ft ? String(ponto.elevacao_ft) : "",
  };
}

// ============================================================================
// UTILITÁRIOS DIVERSOS
// ============================================================================

/**
 * Calcula distância em km entre duas coordenadas (Haversine)
 * Útil para verificar proximidade de aeroportos
 */
export function distanciaEntreCoordenadas(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Retorna a região de São Paulo baseado em coordenadas
 */
export function obterRegiao(latitude: number, longitude: number): string {
  const centerLat = (BOUNDS_SP.minLat + BOUNDS_SP.maxLat) / 2; // ~-21.5
  const centerLon = (BOUNDS_SP.minLon + BOUNDS_SP.maxLon) / 2; // ~-47.0

  const norte = latitude > centerLat;
  const leste = longitude > centerLon;

  if (norte && leste) return "Nordeste";
  if (norte && !leste) return "Noroeste";
  if (!norte && leste) return "Sudeste";
  return "Sudoeste";
}

/**
 * Helper para criar um template vazio de ROTAER
 */
export function criarRotaerVazia(aeroportoId: string): Omit<AeroportoRotaer, "id" | "updated_at"> {
  return {
    aeroporto_id: aeroportoId,
    icao: "",
    nome: "",
    cidade: "",
    regional: "",
    latitude: null,
    longitude: null,
    elevacao_ft: null,
    pistas: null,
    balizamento: null,
    luzes: null,
    auxilios_navegacao: null,
    ats_orgao: null,
    ats_frequencias: null,
    ats_horario: null,
    sci_categoria: null,
    combustivel: null,
    horario_funcionamento: null,
    contatos: null,
    observacoes: null,
    fonte: "manual",
  };
}

export const pistaVazia = (): PistaRotaer => ({
  designacao: "",
  dimensoes: "",
  piso: "",
  pcn: "",
});

export const contatoVazio = (): ContatoRotaer => ({
  nome: "",
  funcao: "",
  telefone: "",
  email: "",
});
