import { describe, expect, it } from 'vitest';
import { iProduto } from '@/@types/Produto';
import { calcQuantidade, estoqueDisponivel } from '@/lib/product';

function makeProduct(overrides: Partial<iProduto>): iProduto {
  return {
    PRODUTO: '0001',
    NOME: 'Produto teste',
    QTDATUAL: 100,
    QTD_GARANTIA: 0,
    QTD_VENDA: 1,
    MULTIPLO_COMPRA: 1,
    ...overrides,
  } as iProduto;
}

describe('estoqueDisponivel', () => {
  it('subtracts the warranty quantity from the current stock', () => {
    expect(estoqueDisponivel(makeProduct({ QTDATUAL: 10, QTD_GARANTIA: 3 }))).toBe(7);
  });

  it('returns zero when warranty equals stock', () => {
    expect(estoqueDisponivel(makeProduct({ QTDATUAL: 5, QTD_GARANTIA: 5 }))).toBe(0);
  });
});

describe('calcQuantidade', () => {
  it('keeps the quantity when there is no multiple', () => {
    expect(calcQuantidade(1, makeProduct({ MULTIPLO_COMPRA: 1 }))).toBe(1);
  });

  it('rounds up to the purchase multiple', () => {
    expect(calcQuantidade(1, makeProduct({ MULTIPLO_COMPRA: 4 }))).toBe(4);
  });

  it('rounds up an already multiple quantity to the next multiple', () => {
    expect(calcQuantidade(5, makeProduct({ MULTIPLO_COMPRA: 4 }))).toBe(8);
  });

  it('uses the sale quantity as multiple when greater than one', () => {
    expect(
      calcQuantidade(1, makeProduct({ MULTIPLO_COMPRA: 4, QTD_VENDA: 3 })),
    ).toBe(3);
  });

  it('limits the quantity to the available stock', () => {
    expect(
      calcQuantidade(
        50,
        makeProduct({ MULTIPLO_COMPRA: 1, QTDATUAL: 10, QTD_GARANTIA: 2 }),
      ),
    ).toBe(8);
  });

  it('returns zero when there is no available stock', () => {
    expect(
      calcQuantidade(1, makeProduct({ QTDATUAL: 2, QTD_GARANTIA: 2 })),
    ).toBe(0);
  });
});
