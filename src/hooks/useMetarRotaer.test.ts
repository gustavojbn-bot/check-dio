import { describe, it, expect } from 'vitest';
import { getMetarColor } from './useMetarRotaer';

// A lógica de parsing do METAR (parseMetar) mora em src/utils/metarParser.ts
// e é testada em src/utils/metarParser.test.ts - useMetarRotaer.ts só a
// reexporta como tipo (MetarData) e a usa internamente no hook.

describe('getMetarColor', () => {
  it.each([
    ['bom', '#22c55e'],
    ['vfr', '#22c55e'],
    ['atencao', '#f59e0b'],
    ['mvfr', '#f59e0b'],
    ['critico', '#ef4444'],
    ['ifr', '#ef4444'],
    ['lifr', '#ef4444'],
    ['sem_dados', '#000000'],
  ])('mapeia status "%s" para a cor %s', (status, cor) => {
    expect(getMetarColor(status)).toBe(cor);
  });

  it('é case-insensitive', () => {
    expect(getMetarColor('CRITICO')).toBe('#ef4444');
    expect(getMetarColor('Bom')).toBe('#22c55e');
  });

  it('retorna preto para status desconhecido ou indefinido', () => {
    expect(getMetarColor(undefined)).toBe('#000000');
    expect(getMetarColor('status-inexistente')).toBe('#000000');
  });
});
