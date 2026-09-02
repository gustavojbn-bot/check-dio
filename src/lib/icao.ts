/**
 * Valida o formato de um código ICAO de aeroporto: exatamente 4 letras
 * maiúsculas (ex.: SBSP, SBGR). Não confirma se o aeroporto existe de fato,
 * apenas que o formato é válido para ser usado numa chamada de API.
 */
export function isValidIcaoCode(icao: string | null | undefined): icao is string {
  return typeof icao === 'string' && /^[A-Z]{4}$/.test(icao);
}
