'use client';
import { iCliente } from '@/@types/Cliente';
import { iOrcamento } from '@/@types/Orcamento';
import { iProduto } from '@/@types/Produto';
import { addItem } from '@/app/actions/orcamento';
import { Loading } from '@/components/Loading';
import ToastNotify from '@/components/ToastNotify';
import SuperSearchProducts from '@/components/products/SuperSearchProduct';
import { estoqueDisponivel, calcQuantidade } from '@/lib/product';
import useProductStore from '@/store/useProductStore';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { ModalEditBudgetItem } from '../EditBudgetIten/ModalEditBudgetItem';

interface iNewBudgetItem {
  budget: iOrcamento;
  CallBack: () => void;
  onCloseModal?: () => void;
}

/**
 * Inclusão de item: abre direto a busca de produtos e adiciona o produto
 * selecionado ao orçamento com a quantidade inicial calculada pelo múltiplo.
 */
const NewBudgetItemSearch = ({ budget, CallBack }: iNewBudgetItem) => {
  const [saving, setSaving] = useState(false);

  const selectProduct = useProductStore((state) => state.selectProduct);
  const searchResult = useProductStore((state) => state.searchResult);

  // Referência estável: o SuperSearchProducts reinicia a tabela quando `data` muda.
  const [initialData] = useState(() => ({
    value: searchResult,
    Qtd_Registros: searchResult.length,
  }));

  async function handleAddProduct(prod: iProduto) {
    if (saving) return;

    if (estoqueDisponivel(prod) <= 0) {
      ToastNotify({
        message: 'Produto sem estoque disponível para venda',
        type: 'error',
      });
      return;
    }

    setSaving(true);

    try {
      const cliente = budget.CLIENTE as iCliente;

      await selectProduct(prod, cliente);

      const price = useProductStore.getState().currentPrice;
      const qtd = calcQuantidade(1, prod);
      const total = price * qtd;

      const response = await addItem({
        pIdOrcamento: budget.ORCAMENTO,
        pItemOrcamento: {
          CodigoProduto: prod.PRODUTO,
          Qtd: qtd,
          Valor: price,
          SubTotal: total,
          Total: total,
          Desconto: 0,
          Frete: 0,
          Tabela: cliente.Tabela || 'SISTEMA',
        },
      });

      if (response.error !== undefined) {
        ToastNotify({
          message: `Erro ao adicionar item: ${response.error.message}`,
          type: 'error',
        });
        return;
      }

      ToastNotify({
        message: `${prod.NOME} adicionado com sucesso`,
        type: 'success',
      });

      CallBack();
    } catch (error: any) {
      ToastNotify({
        message: `Erro ao adicionar item: ${error?.message ?? error}`,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SuperSearchProducts
        words=''
        data={initialData}
        CallBack={handleAddProduct}
      />
      {saving && <Loading />}
    </>
  );
};

const NewBudgetItem = ({ budget, CallBack }: iNewBudgetItem) => {
  return (
    <ModalEditBudgetItem
      modalTitle={'Novo Item'}
      buttonText={'Novo Item'}
      buttonIcon={faPlusCircle}
      containerStyle='laptop:w-[85vw] laptop:h-[85vh] tablet-a8-portrait:w-[85vw] tablet-a8-portrait:h-[85vh] w-[85vw] h-[85vh]'
    >
      <NewBudgetItemSearch budget={budget} CallBack={CallBack} />
    </ModalEditBudgetItem>
  );
};

export default NewBudgetItem;
