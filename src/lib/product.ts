import { iProduto } from '@/@types/Produto';

/**
 * Quantidade disponível para venda (estoque atual menos a garantia).
 */
export function estoqueDisponivel(product: iProduto): number {
  return Number(product.QTDATUAL) - Number(product.QTD_GARANTIA);
}

/**
 * Ajusta a quantidade informada ao múltiplo de compra/venda do produto e
 * limita ao estoque disponível.
 */
export function calcQuantidade(qtd: number, product: iProduto): number {
  const multiploCompra = Number(product.MULTIPLO_COMPRA) || 1;
  const qtdVenda = Number(product.QTD_VENDA) || 1;

  const multiplo = qtdVenda > 1 ? qtdVenda : multiploCompra;

  let newQtd = Math.ceil(qtd / multiplo) * multiplo;

  const disponivel = estoqueDisponivel(product);

  if (newQtd > disponivel) {
    newQtd = disponivel;
  }

  return newQtd;
}
