import { describe, it, expect } from 'vitest';
import { parseTaf } from './tafParser';

describe('parseTaf', () => {
  it('TAF simples (CAVOK, sem grupos de mudança): identifica cabeçalho, validade e temperaturas', () => {
    const r = parseTaf('TAF SBRP 311930Z 3100/3112 11007KT CAVOK TX24/0100Z TN15/0110Z RMK PGM=');
    expect(r).not.toBeNull();
    expect(r!.icao).toBe('SBRP');
    expect(r!.tipo).toBe('TAF');
    expect(r!.emissao).toBe('dia 31 às 19:30Z');
    expect(r!.validadeInicio).toBe('dia 31 às 00:00Z');
    expect(r!.validadeFim).toBe('dia 31 às 12:00Z');
    expect(r!.temperaturaMaxima).toEqual({ valor: 24, quando: 'dia 01 às 00:00Z' });
    expect(r!.temperaturaMinima).toEqual({ valor: 15, quando: 'dia 01 às 10:00Z' });
    expect(r!.periodos).toHaveLength(1);
    expect(r!.periodos[0].indicador).toBe('INICIAL');
    expect(r!.periodos[0].vento).toBe('110° a 7kt');
    expect(r!.periodos[0].visibilidade).toContain('CAVOK');
  });

  it('TAF com múltiplos BECMG: segmenta cada mudança gradual com seu próprio vento', () => {
    const r = parseTaf(
      'TAF SBRP 010430Z 0106/0118 11007KT CAVOK TN15/0110Z TX29/0118Z BECMG 0109/0111 09006KT BECMG 0112/0114 06010KT RMK PHG='
    );
    expect(r!.periodos).toHaveLength(3);
    expect(r!.periodos[0].indicador).toBe('INICIAL');
    expect(r!.periodos[1].indicador).toBe('BECMG');
    expect(r!.periodos[1].periodoTexto).toBe('entre dia 01 às 09:00Z e dia 01 às 11:00Z');
    expect(r!.periodos[1].vento).toBe('090° a 6kt');
    expect(r!.periodos[2].vento).toBe('060° a 10kt');
  });

  it('TAF com PROB30 direto (sem TEMPO): reconhece indicador e período', () => {
    const r = parseTaf(
      'TAF SBRP 060800Z 0612/0624 10005KT CAVOK TX29/0617Z TN19/0624Z BECMG 0613/0615 33008KT PROB30 0615/0618 7000 TS SCT030 FEW040CB BECMG 0621/0623 12004KT RMK PHP='
    );
    const prob = r!.periodos.find((p) => p.indicador === 'PROB30');
    expect(prob).toBeDefined();
    expect(prob!.periodoTexto).toBe('entre dia 06 às 15:00Z e dia 06 às 18:00Z');
    expect(prob!.visibilidade).toBe('7000m');
    expect(prob!.nuvens).toContain('SCT 3000ft');
    expect(prob!.nuvens).toContain('FEW 4000ft (CB)');
  });

  it('TAF com PROB30 TEMPO combinados: trata como um único indicador PROB30', () => {
    const r = parseTaf(
      'TAF SBRP 071455Z 0718/0806 34010KT 9999 SCT040 FEW045TCU TX30/0718Z TN19/0805Z PROB30 TEMPO 0718/0721 TSRA SCT040 FEW045CB BECMG 0722/0801 10005KT CAVOK RMK PGH='
    );
    const prob = r!.periodos.find((p) => p.indicador === 'PROB30');
    expect(prob).toBeDefined();
    expect(prob!.periodoTexto).toBe('entre dia 07 às 18:00Z e dia 07 às 21:00Z');
  });

  it('TAF com FM: identifica indicador de mudança repentina e horário exato', () => {
    const r = parseTaf('TAF SBGR 010000Z 0106/0212 12010KT CAVOK FM011800 20015G25KT 9999 SCT020 RMK TESTE=');
    const fm = r!.periodos.find((p) => p.indicador === 'FM');
    expect(fm).toBeDefined();
    expect(fm!.periodoTexto).toBe('A partir do dia 01 às 18:00Z');
    expect(fm!.vento).toBe('200° a 15kt, rajadas de 25kt');
  });

  it('vento calmo e vento variável são reconhecidos', () => {
    const r = parseTaf('TAF SBGR 010000Z 0106/0212 00000KT CAVOK RMK TESTE=');
    expect(r!.periodos[0].vento).toBe('Calmo');

    const r2 = parseTaf('TAF SBGR 010000Z 0106/0212 VRB03KT CAVOK RMK TESTE=');
    expect(r2!.periodos[0].vento).toBe('Variável a 3kt');
  });

  it('mensagem vazia, nula ou sem cabeçalho reconhecível não lança exceção', () => {
    expect(parseTaf('')).toBeNull();
    expect(parseTaf(null)).toBeNull();
    expect(parseTaf('mensagem qualquer sem estrutura de TAF')!.icao).toBeNull();
  });
});
