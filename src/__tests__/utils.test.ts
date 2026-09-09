import { describe, expect, it } from 'vitest';
import {
  FormatToCurrency,
  MaskCnpjCpf,
  RemoveSpecialCharacter,
  toIntSafe,
} from '@/lib/utils';

describe('RemoveSpecialCharacter', () => {
  it('removes all non-digit characters', () => {
    expect(RemoveSpecialCharacter('123.456.789-09')).toBe('12345678909');
  });

  it('returns empty string for all special chars', () => {
    expect(RemoveSpecialCharacter('abc-def.ghi')).toBe('');
  });

  it('returns same string if only digits', () => {
    expect(RemoveSpecialCharacter('12345')).toBe('12345');
  });

  it('handles CPF with dots and dash', () => {
    expect(RemoveSpecialCharacter('123.456.789-09')).toBe('12345678909');
  });

  it('handles CNPJ with dots, slash and dash', () => {
    expect(RemoveSpecialCharacter('12.345.678/0001-90')).toBe('12345678000190');
  });
});

describe('MaskCnpjCpf', () => {
  it('masks CPF (11 digits)', () => {
    expect(MaskCnpjCpf('12345678909')).toBe('123.456.789-09');
  });

  it('masks CNPJ (14 digits)', () => {
    expect(MaskCnpjCpf('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('returns empty string for undefined', () => {
    expect(MaskCnpjCpf(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(MaskCnpjCpf('')).toBe('');
  });

  it('handles already-masked CPF (length > 12 triggers CNPJ mask)', () => {
    expect(MaskCnpjCpf('123.456.789-09')).toBe('12.345.678/909');
  });

  it('handles already-masked CNPJ', () => {
    expect(MaskCnpjCpf('12.345.678/0001-90')).toBe('12.345.678/0001-90');
  });
});

describe('FormatToCurrency', () => {
  it('formats a number as BRL currency', () => {
    expect(FormatToCurrency('1000')).toBe('R$\u00a01.000,00');
  });

  it('formats a decimal number as BRL currency', () => {
    expect(FormatToCurrency('1234.56')).toBe('R$\u00a01.234,56');
  });

  it('formats zero', () => {
    expect(FormatToCurrency('0')).toBe('R$\u00a00,00');
  });
});

describe('toIntSafe', () => {
  it('parses a simple integer string', () => {
    expect(toIntSafe('42')).toBe(42);
  });

  it('parses pt-BR formatted number with dot as thousands separator', () => {
    expect(toIntSafe('1.234')).toBe(1234);
  });

  it('parses pt-BR formatted number with comma as decimal', () => {
    expect(toIntSafe('1.234,56')).toBe(1234);
  });

  it('returns 0 for null', () => {
    expect(toIntSafe(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(toIntSafe(undefined)).toBe(0);
  });

  it('throws for non-numeric string', () => {
    expect(() => toIntSafe('abc')).toThrow('Valor inválido para inteiro');
  });

  it('treats dot as thousands separator (pt-BR)', () => {
    expect(toIntSafe('42.99')).toBe(4299);
  });
});
