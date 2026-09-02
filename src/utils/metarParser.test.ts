import { describe, it, expect } from 'vitest';
import { parseMetar, extrairTeto } from './metarParser';

describe('parseMetar', () => {
  it('CAVOK: status "bom" e preenche visibilidade/teto padrão (grupos omitidos no METAR real)', () => {
    const r = parseMetar('METAR SBAE 281400Z 02012KT CAVOK 28/17 Q1014=');
    expect(r.status_metar).toBe('bom');
    expect(r.temperatura_c).toBe(28);
    expect(r.ponto_orvalho_c).toBe(17);
    expect(r.pressao_mb).toBe(1014);
    expect(r.vento_direcao).toBe(20);
    expect(r.vento_velocidade_kt).toBe(12);
    expect(r.visibilidade_m).toBe(10000);
    expect(r.teto_ft).toBe(5000);
  });

  it('teto >= 1500ft e visibilidade >= 5000m: status "bom"', () => {
    const r = parseMetar('METAR SBGR 010000Z 12010KT 9999 BKN020 22/18 Q1015=');
    expect(r.status_metar).toBe('bom');
    expect(r.teto_ft).toBe(2000);
  });

  it('teto entre 600-1500ft (BKN/OVC): status "atencao"', () => {
    const r = parseMetar('METAR SBGR 010000Z 12010KT 9999 BKN010 22/18 Q1015=');
    expect(r.status_metar).toBe('atencao');
    expect(r.teto_ft).toBe(1000);
  });

  it('teto < 600ft (BKN/OVC): status "critico"', () => {
    const r = parseMetar('METAR SBGR 010000Z 12010KT 9999 BKN005 22/18 Q1015=');
    expect(r.status_metar).toBe('critico');
    expect(r.teto_ft).toBe(500);
  });

  it('visibilidade entre 1500-5000m (sem restrição de teto): status "atencao"', () => {
    const r = parseMetar('METAR SBGR 010000Z 12010KT 3000 FEW100 22/18 Q1015=');
    expect(r.status_metar).toBe('atencao');
    expect(r.visibilidade_m).toBe(3000);
  });

  it('visibilidade < 1500m (sem restrição de teto): status "critico"', () => {
    const r = parseMetar('METAR SBGR 010000Z 12010KT 1200 FEW100 22/18 Q1015=');
    expect(r.status_metar).toBe('critico');
    expect(r.visibilidade_m).toBe(1200);
  });

  it('trovoada (TS) com visibilidade e teto bons: status "bom" (regra de fenômeno removida, só a tabela decide)', () => {
    const r = parseMetar('METAR SBKP 010000Z 12010KT 9999 TSRA FEW025 22/18 Q1013=');
    expect(r.status_metar).toBe('bom');
  });

  it('mensagem vazia ou inválida retorna status "sem_dados" sem lançar exceção', () => {
    expect(parseMetar('').status_metar).toBe('sem_dados');
    // @ts-expect-error entrada inválida de propósito para testar a guarda
    expect(parseMetar(null).status_metar).toBe('sem_dados');
  });
});

describe('extrairTeto', () => {
  it('retorna a altitude da primeira nuvem BKN/OVC reportada, mesmo abaixo de 500ft', () => {
    expect(extrairTeto('BKN008')).toBe(800);
    expect(extrairTeto('FEW010 SCT015 OVC025')).toBe(2500);
    expect(extrairTeto('BKN003')).toBe(300);
  });

  it('retorna null quando não há BKN/OVC na mensagem', () => {
    expect(extrairTeto('FEW010 SCT015')).toBeNull();
  });
});
