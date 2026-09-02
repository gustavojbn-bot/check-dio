import { describe, it, expect } from 'vitest';
import { isValidIcaoCode } from './icao';

describe('isValidIcaoCode', () => {
  it('aceita códigos de 4 letras maiúsculas', () => {
    expect(isValidIcaoCode('SBSP')).toBe(true);
    expect(isValidIcaoCode('SBGR')).toBe(true);
  });

  it('rejeita códigos com tamanho errado', () => {
    expect(isValidIcaoCode('AB')).toBe(false);
    expect(isValidIcaoCode('SBSP1')).toBe(false);
    expect(isValidIcaoCode('')).toBe(false);
  });

  it('rejeita letras minúsculas ou caracteres não alfabéticos', () => {
    expect(isValidIcaoCode('sbsp')).toBe(false);
    expect(isValidIcaoCode('SB-P')).toBe(false);
    expect(isValidIcaoCode('1234')).toBe(false);
  });

  it('rejeita valores nulos/indefinidos', () => {
    expect(isValidIcaoCode(null)).toBe(false);
    expect(isValidIcaoCode(undefined)).toBe(false);
  });
});
