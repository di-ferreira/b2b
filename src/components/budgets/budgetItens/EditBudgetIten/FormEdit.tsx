'use client';
import { iCliente } from '@/@types/Cliente';
import { iItemInserir, iItensOrcamento, iOrcamento } from '@/@types/Orcamento';
import { iListaSimilare, iProduto } from '@/@types/Produto';
import { iColumnType } from '@/@types/Table';
import { updateItem } from '@/app/actions/orcamento';
import { DataTable } from '@/components/CustomDataTable';
import { Loading } from '@/components/Loading';
import ToastNotify from '@/components/ToastNotify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { calcQuantidade, estoqueDisponivel } from '@/lib/product';
import { FormatToCurrency } from '@/lib/utils';
import useBudget from '@/store/BudgetStore';
import useProductStore from '@/store/useProductStore';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { tableSalesHistoryHeaders } from './columns';

interface iFormEditItem {
  item?: iItensOrcamento;
  budget: iOrcamento;
  CallBack?: () => void;
  onCloseModal?: () => void;
}

const FormEdit = ({ item, budget, CallBack, onCloseModal }: iFormEditItem) => {
  const { current, setCurrent } = useBudget();
  const {
    selectProduct,
    isLoading,
    isOferta,
    productSelected,
    currentPrice,
    similares,
    history,
    estoqueFiliais,
    clearDetails,
  } = useProductStore();
  const [budgetItem, setBudgetItem] = useState<iItensOrcamento>({
    QTD: 1,
    VALOR: 0,
    TOTAL: 0,
    SUBTOTAL: 0,
    DESCONTO: 0,
    TABELA: (budget.CLIENTE as iCliente).Tabela || 'SISTEMA',
    OBS: '',
    MD5: '',
    ITEM: 0,
    PRECO_LIQUIDO: '',
    IMP_SEPARACAO: '',
    GORDURA: 0,
    P_DESC: 0,
    ID_VALE_CASCO: 0,
    ORCAMENTO: 0,
    PRODUTO: {} as iProduto,
  });

  const [WordProducts, setWordProducts] = useState<string>('');
  const [QtdItem, setQtdItem] = useState<string>('1');
  const formRef = useRef<HTMLFormElement>(null);
  const inputQTDRef = useRef<HTMLInputElement>(null);
  const inputBtnSalvarRef = useRef<HTMLButtonElement>(null);

  async function saveItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (item === undefined) return;

    try {
      const valor = currentPrice || budgetItem.VALOR || item.VALOR;
      const qtd = calcQuantidade(budgetItem.QTD, item.PRODUTO);
      const total = valor * qtd;

      const itemSave: iItemInserir = {
        pIdOrcamento: current.ORCAMENTO,
        pItemOrcamento: {
          CodigoProduto: item.PRODUTO.PRODUTO,
          Desconto: 0,
          Frete: 0,
          Qtd: qtd,
          Tabela: budgetItem.TABELA,
          Valor: valor,
          SubTotal: total,
          Total: total,
        },
      };

      const response = await updateItem(itemSave);

      if (response?.value !== undefined) {
        setCurrent(response.value as iOrcamento);
        ToastNotify({
          message: 'Item editado com sucesso',
          type: 'success',
        });
      }

      if (response?.error !== undefined) {
        ToastNotify({
          message: `Erro ao editar item: ${response.error.message}`,
          type: 'error',
        });
        return;
      }

      if (CallBack) {
        CallBack();
      }

      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      console.error('[saveItem] Unexpected error:', err);
      ToastNotify({
        message: `Erro inesperado: ${err.message || 'falha ao salvar item'}`,
        type: 'error',
      });
    }
  }

  async function onChangeQTD(e: React.ChangeEvent<HTMLInputElement>) {
    let newQtd = Number(e.target.value);

    if (Number.isNaN(newQtd) || newQtd < 1) {
      newQtd = 1;
    }

    const qtd = calcQuantidade(newQtd, budgetItem.PRODUTO);

    setQtdItem(qtd.toString());

    const total: number = currentPrice * qtd;

    setBudgetItem((prevBudgetItem) => ({
      ...prevBudgetItem,
      QTD: qtd,
      SUBTOTAL: total,
      TOTAL: total,
    }));
  }

  async function LoadItem() {
    if (item) {
      selectProduct(item.PRODUTO, budget.CLIENTE as iCliente);

      let new_price: number = item.PRODUTO.PRECO;

      new_price = new_price === undefined ? item.PRODUTO.PRECO : new_price;

      setBudgetItem(
        (old) =>
          (old = {
            ...item,
            PRODUTO: item.PRODUTO,
            VALOR: new_price,
            QTD: item.QTD,
            SUBTOTAL: item.SUBTOTAL,
            TOTAL: item.TOTAL,
          }),
      );
      setWordProducts(item.PRODUTO.PRODUTO);
      setQtdItem(item.QTD.toString());
    }
  }

  useEffect(() => {
    // Foco no input de quantidade ao abrir o modal
    inputQTDRef.current?.focus();

    // Carrega o item quando o componente monta ou o 'item' prop muda
    const loadData = async () => {
      try {
        LoadItem();
      } catch (err: any) {
        ToastNotify({ message: err.message, type: 'error' });
      }
    };

    loadData();
  }, [current.ORCAMENTO, item?.PRODUTO.PRODUTO]);

  const tableSimilaresHeaders: iColumnType<iListaSimilare>[] = [
    {
      key: 'EXTERNO.PRODUTO',
      title: 'PRODUTO',
      width: '10%',
    },
    {
      key: 'EXTERNO.NOME',
      title: 'NOME',
      width: '15%',
    },
    {
      key: 'EXTERNO.REFERENCIA',
      title: 'REFERÊNCIA',
      width: '15%',
    },
    {
      key: 'EXTERNO.EQUIVALENTE',
      title: 'EQUIVALENTE',
      width: '15%',
    },
    {
      key: 'EXTERNO.DATA_ATUALIZACAO',
      title: 'DATA ATUALIZAÇÃO',
      width: '15%',
      render: (_, item) => {
        return dayjs(item.EXTERNO.DATA_ATUALIZACAO).format('DD/MM/YYYY');
      },
    },
    {
      key: 'EXTERNO.QTDATUAL',
      title: 'QTD ATUAL',
      width: '15%',
    },
  ];

  return (
    <div className='relative w-full h-full'>
      <form
        ref={formRef}
        onSubmit={saveItem}
        method='POST'
        className={`flex flex-col overflow-x-hidden overflow-y-auto gap-y-3 w-full
                                                            h-full py-0 px-2 `}
      >
        <div
          className={`flex w-full h-[60vh] gap-3 overflow-x-hidden overflow-y-auto`}
        >
          <div className={`flex w-[70%] flex-col gap-y-3 tablet:w-[60%]`}>
            <div className={`flex gap-x-3 px-3  tablet:flex-wrap`}>
              <div
                className={`flex w-[30%] gap-x-1 items-end tablet:w-[50%] tablet-portrait:w-[100%]`}
              >
                <div className={`flex w-[100%]`}>
                  <Input
                    value={WordProducts}
                    name='ProdutoPalavras'
                    labelText='PRODUTO'
                    labelPosition='top'
                    disabled
                  />
                </div>
              </div>
              <div
                className={`flex w-[25%] tablet:w-[47%] tablet-portrait:w-[100%]`}
              >
                <Input
                  disabled
                  value={productSelected ? productSelected.REFERENCIA : ''}
                  name='REFERÊNCIA'
                  labelText='REFERÊNCIA'
                  labelPosition='top'
                />
              </div>
              <div
                className={`flex w-[30%] tablet:w-[70%] tablet-portrait:w-[100%]`}
              >
                <Input
                  disabled
                  value={
                    productSelected ? productSelected.FABRICANTE?.NOME : ''
                  }
                  name='FABRICANTE'
                  labelText='FABRICANTE'
                  labelPosition='top'
                />
              </div>
              <div
                className={`flex w-[15%] tablet:w-[27%] tablet-portrait:w-[100%]`}
              >
                <Input
                  disabled
                  value={
                    productSelected
                      ? productSelected.LOCAL?.toLocaleUpperCase()
                      : ''
                  }
                  name='LOCALIZAÇÃO'
                  labelText='LOCALIZAÇÃO'
                  labelPosition='top'
                />
              </div>
            </div>
            <div className={`flex flex-col gap-y-3 px-3`}>
              <div className={`flex grow`}>
                <Input
                  disabled
                  value={productSelected ? productSelected.NOME : ''}
                  name='NOME DO PRODUTO'
                  labelText='NOME DO PRODUTO'
                  labelPosition='top'
                />
              </div>
              <div>
                <Textarea
                  rows={6}
                  labelText='APLICAÇÃO PRODUTO'
                  labelPosition='top'
                  disabled
                  name='APLICACAO'
                  className='resize-none'
                  value={productSelected ? productSelected.APLICACOES : ''}
                />
              </div>
              <div>
                <Textarea
                  rows={6}
                  labelPosition='top'
                  labelText='INFORMACOES'
                  disabled
                  name='INFORMACOES.PRODUTO'
                  className='resize-none'
                  value={
                    productSelected
                      ? productSelected.INSTRUCOES?.toString()
                      : ''
                  }
                />
              </div>
            </div>
          </div>
          <div className={`flex flex-col w-[30%] tablet:w-[40%]`}>
            <DataTable
              columns={tableSalesHistoryHeaders}
              IsLoading={false}
              TableData={history}
              ErrorMessage='Nenhuma Chave encontrada'
            />
          </div>
        </div>
        <div className={`flex items-end pt-4 gap-x-4`}>
          <div className={`flex w-[10%]`}>
            <Input
              disabled
              value={productSelected ? productSelected.QTDATUAL : 0}
              name='ESTOQUE'
              type='number'
              labelText='ESTOQUE'
              labelPosition='top'
            />
          </div>
          {estoqueFiliais.length > 0 && (
            <div className={`flex w-[30%]`}>
              <div className='text-[11px] font-bold text-emsoft_dark-text mb-1'>
                ESTOQUE EM OUTRAS FILIAIS
              </div>
              <div className='flex flex-col gap-y-1 max-h-[80px] overflow-y-auto'>
                {estoqueFiliais.map((filial, idx) => (
                  <div
                    key={idx}
                    className='flex items-center gap-x-2 text-[11px] bg-gray-50 px-2 py-1 rounded'
                  >
                    <span className='font-bold w-[80px] truncate'>
                      {filial.LOJA}
                    </span>
                    <span className='w-[50px] text-right'>{filial.ESTOQUE}</span>
                    <span className='flex-1 text-right'>
                      {FormatToCurrency(filial.PRECO.toString())}
                    </span>
                    <span className='text-gray-500 truncate max-w-[60px]'>
                      {filial.LOCAL1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={`flex w-[10%]`}>
            <Input
              onChange={(e) => {
                let newQtdText = e.target.value;
                let newQtd = Number(newQtdText);

                if (Number.isNaN(newQtd) || newQtd < 1) {
                  newQtd = 1;
                }

                setQtdItem(newQtdText);

                setBudgetItem((prevBudgetItem) => ({
                  ...prevBudgetItem,
                  QTD: newQtd,
                }));
              }}
              onBlur={onChangeQTD}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  inputBtnSalvarRef.current?.focus();
                }
              }}
              value={QtdItem}
              ref={inputQTDRef}
              name='QTD'
              labelText='QTD'
              labelPosition='top'
              className='text-right'
            />
          </div>

          <div className={`flex w-[20%] relative`}>
            {isOferta && (
              <span
                className={`absolute text-[12px] font-bold text-red-700 top-2 left-12`}
              >
                *Produto em oferta
              </span>
            )}
            <Input
              value={FormatToCurrency(currentPrice.toString())}
              name='VALOR (R$)'
              labelText='VALOR'
              labelPosition='top'
              className='text-right'
              disabled
            />
          </div>
          <div className={`flex w-[20%]`}>
            <Input
              value={FormatToCurrency(budgetItem.TOTAL.toString())}
              name='TOTAL'
              labelText='TOTAL'
              labelPosition='top'
              className='text-right'
              disabled
            />
          </div>
        </div>
        <div
          className={`flex flex-col w-full h-[150px] overflow-x-hidden overflow-y-auto`}
        >
          <DataTable
            columns={tableSimilaresHeaders}
            IsLoading={false}
            TableData={similares}
            ErrorMessage='Nenhum Similar encontrado'
          />
        </div>
        <footer className='flex gap-x-2'>
          <div className='w-fit'>
            <Button
              type='submit'
              className={`flex w-fit h-[35px] p-3 gap-3`}
              title='Salvar produto'
              ref={inputBtnSalvarRef}
              disabled={estoqueDisponivel(budgetItem.PRODUTO) <= 0}
            >
              <FontAwesomeIcon
                icon={faSave}
                size='xl'
                title='SALVAR'
                className='text-white'
              />
              SALVAR
            </Button>
          </div>
          <div className='w-fit'>
            <Button
              type='button'
              className={`bg-emsoft_danger-main hover:bg-emsoft_danger-light flex w-fit h-[35px] p-3 gap-3`}
              title='SAIR'
              onClick={() => {
                onCloseModal && onCloseModal();
                clearDetails();
              }}
            >
              <FontAwesomeIcon
                icon={faTimes}
                size='xl'
                title='SALVAR'
                className='text-white'
              />
              SAIR
            </Button>
          </div>
        </footer>
      </form>
      {isLoading && <Loading />}
    </div>
  );
};

export default FormEdit;

