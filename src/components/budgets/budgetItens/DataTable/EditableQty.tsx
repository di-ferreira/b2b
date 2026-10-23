'use client';
import { iItensOrcamento, iOrcamento } from '@/@types/Orcamento';
import { updateItem } from '@/app/actions/orcamento';
import ToastNotify from '@/components/ToastNotify';
import { calcQuantidade, estoqueDisponivel } from '@/lib/product';
import { useEffect, useState } from 'react';

interface iEditableQty {
  item: iItensOrcamento;
  onUpdated: (budget?: iOrcamento) => void;
}

/**
 * Quantidade editável direto na tabela do carrinho.
 * Mantém o valor unitário vindo da API e recalcula subtotal/total.
 */
const EditableQty = ({ item, onUpdated }: iEditableQty) => {
  const [value, setValue] = useState<string>(String(item.QTD));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(String(item.QTD));
  }, [item.QTD]);

  async function commitQty() {
    if (saving) return;

    const parsed = Number(value);

    if (Number.isNaN(parsed) || parsed < 1) {
      setValue(String(item.QTD));
      return;
    }

    if (estoqueDisponivel(item.PRODUTO) <= 0) {
      ToastNotify({
        message: 'Produto sem estoque disponível para venda',
        type: 'error',
      });
      setValue(String(item.QTD));
      return;
    }

    const qtd = calcQuantidade(parsed, item.PRODUTO);

    if (qtd === item.QTD) {
      setValue(String(item.QTD));
      return;
    }

    if (qtd < 1) {
      ToastNotify({
        message: 'Quantidade inválida para este produto',
        type: 'error',
      });
      setValue(String(item.QTD));
      return;
    }

    setSaving(true);

    try {
      const total = item.VALOR * qtd;

      const response = await updateItem({
        pIdOrcamento: item.ORCAMENTO,
        pItemOrcamento: {
          CodigoProduto: item.PRODUTO.PRODUTO,
          Qtd: qtd,
          Valor: item.VALOR,
          SubTotal: total,
          Total: total,
          Desconto: 0,
          Frete: 0,
          Tabela: item.TABELA || 'SISTEMA',
        },
      });

      if (response.error !== undefined) {
        ToastNotify({
          message: `Erro ao alterar quantidade: ${response.error.message}`,
          type: 'error',
        });
        setValue(String(item.QTD));
        return;
      }

      ToastNotify({
        message: 'Quantidade alterada com sucesso',
        type: 'success',
      });

      onUpdated(response.value);
    } catch (error: any) {
      ToastNotify({
        message: `Erro ao alterar quantidade: ${error?.message ?? error}`,
        type: 'error',
      });
      setValue(String(item.QTD));
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      type='number'
      min={1}
      value={value}
      disabled={saving}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commitQty}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={`w-16 h-9 rounded-md border border-input bg-background text-center text-black
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emsoft_blue-light
        disabled:cursor-not-allowed disabled:opacity-60`}
      title='Alterar quantidade'
    />
  );
};

export default EditableQty;
