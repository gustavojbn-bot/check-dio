import { describe, it, expect } from 'vitest';
import {
  extractPistas,
  extractFrequencias,
  extractNavAids,
  extractIluminacao,
  extractCombustivel,
  extractServicos,
} from './useRotaer';

// Fixtures no formato que o XMLParser (ignoreAttributes: false, attributeNamePrefix: '@_')
// produz para a resposta XML da API AISWEB.

describe('extractPistas', () => {
  it('retorna N/A quando não há dados', () => {
    expect(extractPistas(null)).toBe('N/A');
    expect(extractPistas({})).toBe('N/A');
  });

  it('extrai ident, comprimento, largura e piso de uma única pista', () => {
    const data = {
      aisweb: {
        runways: {
          runway: {
            '@_ident': '18/36',
            length: '2100',
            width: '45',
            surface: 'ASPH',
          },
        },
      },
    };
    expect(extractPistas(data)).toBe('18/36 | 2100m × 45m | ASPH');
  });

  it('usa a primeira pista quando há várias (array)', () => {
    const data = {
      aisweb: {
        runways: {
          runway: [
            { '@_ident': '09/27', length: '1800', width: '30', surface: 'GRASS' },
            { '@_ident': '18/36', length: '2100', width: '45', surface: 'ASPH' },
          ],
        },
      },
    };
    expect(extractPistas(data)).toBe('09/27 | 1800m × 30m | GRASS');
  });

  it('lida com valores envolvidos em {#text} pelo XMLParser', () => {
    const data = {
      aisweb: {
        runways: {
          runway: {
            '@_ident': '11/29',
            length: { '#text': '1200' },
            width: { '#text': '23' },
            surface: { '#text': 'ASPH' },
          },
        },
      },
    };
    expect(extractPistas(data)).toBe('11/29 | 1200m × 23m | ASPH');
  });

  it('omite o ident quando ausente', () => {
    const data = {
      aisweb: { runways: { runway: { length: '2100', width: '45' } } },
    };
    expect(extractPistas(data)).toBe('2100m × 45m');
  });
});

describe('extractFrequencias', () => {
  it('retorna array vazio quando não há serviços', () => {
    expect(extractFrequencias(null)).toEqual([]);
    expect(extractFrequencias({ aisweb: {} })).toEqual([]);
  });

  it('extrai frequências dos serviços do tipo COM', () => {
    const data = {
      aisweb: {
        services: {
          service: [
            { '@_type': 'COM', freqs: { freq: '118.000' } },
            { '@_type': 'NAV', freqs: { freq: '350.000' } },
            { '@_type': 'COM', freqs: { freq: { '#text': '121.600' } } },
          ],
        },
      },
    };
    expect(extractFrequencias(data)).toEqual(['118.000 MHz', '121.600 MHz']);
  });

  it('lida com um único serviço (não array)', () => {
    const data = {
      aisweb: { services: { service: { '@_type': 'COM', freqs: { freq: '118.000' } } } },
    };
    expect(extractFrequencias(data)).toEqual(['118.000 MHz']);
  });
});

describe('extractNavAids', () => {
  it('retorna N/A quando não há serviço NAV', () => {
    const data = { aisweb: { services: { service: { '@_type': 'COM', freqs: { freq: '118.000' } } } } };
    expect(extractNavAids(data)).toBe('N/A');
  });

  it('extrai ident e frequência do serviço NAV', () => {
    const data = {
      aisweb: {
        services: {
          service: [
            { '@_type': 'COM', freqs: { freq: '118.000' } },
            { '@_type': 'NAV', ident: 'RPD', freqs: { freq: '350.000' } },
          ],
        },
      },
    };
    expect(extractNavAids(data)).toBe('RPD (350.000 MHz)');
  });
});

describe('extractIluminacao', () => {
  it('retorna false quando não há dados de pista', () => {
    expect(extractIluminacao(null)).toBe(false);
    expect(extractIluminacao({})).toBe(false);
  });

  it('retorna true quando a pista tem luzes (array)', () => {
    const data = { aisweb: { runways: { runway: { lights: ['REIL', 'PAPI'] } } } };
    expect(extractIluminacao(data)).toBe(true);
  });

  it('retorna false quando lights está ausente', () => {
    const data = { aisweb: { runways: { runway: { '@_ident': '18/36' } } } };
    expect(extractIluminacao(data)).toBe(false);
  });
});

describe('extractCombustivel', () => {
  it('retorna array vazio quando não há serviço de combustível', () => {
    const data = { aisweb: { services: { service: { '@_type': 'COM' } } } };
    expect(extractCombustivel(data)).toEqual([]);
  });

  it('identifica Jet A-1 e Avgas nas descrições de combustível', () => {
    const data = {
      aisweb: {
        services: {
          service: {
            '@_type': 'AirportSuppliesService',
            fuel: {
              span: [{ '@_title': 'JET A-1 disponível' }, { '@_title': 'AVGAS 100LL' }],
            },
          },
        },
      },
    };
    expect(extractCombustivel(data)).toEqual(['Jet A-1', 'Avgas']);
  });
});

describe('extractServicos', () => {
  it('retorna array vazio quando não há remarks', () => {
    expect(extractServicos({ aisweb: {} })).toEqual([]);
  });

  it('extrai até 3 observações de texto', () => {
    const data = { aisweb: { remarks: ['Obs 1', 'Obs 2', 'Obs 3', 'Obs 4'] } };
    expect(extractServicos(data)).toEqual(['Obs 1', 'Obs 2', 'Obs 3']);
  });
});
