'use client';
import { iCliente } from '@/@types/Cliente';
import { iItemInserir, iItensOrcamento, iOrcamento } from '@/@types/Orcamento';
import { iListaSimilare, iProduto } from '@/@types/Produto';
import { iColumnType } from '@/@types/Table';
import { addItem, updateItem } from '@/app/actions/orcamento';
import { DataTable } from '@/components/CustomDataTable';
import { Loading } from '@/components/Loading';
import ToastNotify from '@/components/ToastNotify';
import { SearchProductsModal } from '@/components/products/SearchProductsModal';
import SuperSearchProducts from '@/components/products/SuperSearchProduct';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormatToCurrency } from '@/lib/utils';
import useBudget from '@/store/BudgetStore';
import useProductStore from '@/store/useProductStore';
import { faPlus, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
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
    searchProducts,
    searchResult,
    selectProduct,
    isLoading,
    isOferta,
    productSelected,
    currentPrice,
    similares,
    history,
    clearDetails,
  } = useProductStore();
  const [IsVisibleModalProducts, setIsVisibleModalProducts] =
    useState<boolean>(false);
  const [budgetItem, setBudgetItem] = useState<iItensOrcamento>({
    QTD: 1,
    VALOR: 0,
    TOTAL: 0,
    SUBTOTAL: 0,
    DESCONTO: 0,
    TABELA:
      (budget.CLIENTE as iCliente).Tabela !== undefined ||
      (budget.CLIENTE as iCliente).Tabela !== ''
        ? (budget.CLIENTE as iCliente).Tabela!
        : 'SISTEMA',
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
  const inputProductRef = useRef<HTMLInputElement>(null);
  const inputQTDRef = useRef<HTMLInputElement>(null);
  const inputBtnSalvarRef = useRef<HTMLButtonElement>(null);

  async function saveItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let response;
    let message = '';
    const itemSave: iItemInserir = {
      pIdOrcamento: current.ORCAMENTO,
      pItemOrcamento: {
        CodigoProduto: WordProducts,
        Desconto: 0,
        Frete: 0,
        Qtd: budgetItem.QTD,
        Tabela: budgetItem.TABELA,
        Valor: currentPrice,
        SubTotal: budgetItem.SUBTOTAL,
        Total: budgetItem.TOTAL,
      },
    };

    console.log('item Orc itemSave', itemSave);

    if (item !== undefined) {
      response = await updateItem(itemSave);
      message = 'Item editado com sucesso';
      console.log('item Orc response update', response.value);
    } else {
      response = await addItem(itemSave);
      message = 'Item adicionado com sucesso';
      console.log('item Orc response add', response.value);
    }

    if (response?.value !== undefined) {
      setCurrent(response.value as iOrcamento);
      ToastNotify({
        message: message,
        type: 'success',
      });
    }

    if (response?.error !== undefined) {
      ToastNotify({
        message: 'Erro ao adicionar/editar item',
        type: 'error',
      });
      return;
    }

    if (CallBack) {
      CallBack();
    }

    if (item !== undefined) {
      if (onCloseModal) onCloseModal();
    } else {
      // 1. Limpa a busca textual
      setWordProducts('');

      // 2. Limpa a Store (essencial se você usa selectProduct)
      clearDetails();

      // 3. Reset TOTAL do objeto do item sem manter o estado anterior (...old)
      setBudgetItem({
        QTD: 1,
        VALOR: 0,
        TOTAL: 0,
        SUBTOTAL: 0,
        DESCONTO: 0,
        TABELA: (current.CLIENTE as iCliente).Tabela || 'SISTEMA',
        OBS: '',
        MD5: '',
        ITEM: 0,
        PRECO_LIQUIDO: '',
        IMP_SEPARACAO: '',
        GORDURA: 0,
        P_DESC: 0,
        ID_VALE_CASCO: 0,
        ORCAMENTO: current.ORCAMENTO,
        PRODUTO: {} as iProduto, // Isso vai zerar as referências nos inputs disabled
      });

      setQtdItem('1');

      // 4. Devolve o foco para o campo de busca
      setTimeout(() => inputProductRef.current?.focus(), 100);
    }
  }

  async function UpdateProduct(prod: iProduto) {
    let newQtd = 1;

    if (prod !== undefined) {
      newQtd = handleCalcQTD(budgetItem.QTD, prod);

      setBudgetItem(
        (old) =>
          (old = {
            ...budgetItem,
            PRODUTO: prod,
            VALOR: currentPrice,
            QTD: newQtd,
            SUBTOTAL: currentPrice * budgetItem.QTD,
            TOTAL: currentPrice * budgetItem.QTD,
          }),
      );

      if (prod.QTDATUAL - prod.QTD_GARANTIA <= 0) {
        ToastNotify({
          message: 'Produto sem estoque disponível para venda',
          type: 'error',
        });
      }

      setQtdItem((old) => (old = newQtd.toString()));
      setWordProducts(prod.PRODUTO);
      inputQTDRef.current?.focus();
    }
  }

  async function loadingProduct(product: iProduto) {
    selectProduct(product, current.CLIENTE as iCliente);
    setIsVisibleModalProducts(false);

    try {
      await UpdateProduct(product);
    } catch (e: any) {
      ToastNotify({
        message: `Erro inesperado ao carregar produto: ${e.message}`,
        type: 'error',
      });
    }
  }

  async function findProduct() {
    const products = await searchProducts(WordProducts);

    try {
      if (products.length === 1) {
        const product = await selectProduct(
          products[0],
          current.CLIENTE as iCliente,
        );

        console.log('findProduct product', product);

        setBudgetItem((prev) => ({
          ...prev,
          PRODUTO: products[0],
          VALOR: productSelected?.PRECO || 0,
        }));

        setWordProducts(products[0].PRODUTO);
        inputQTDRef.current?.focus();
      } else if (products.length > 1) {
        setIsVisibleModalProducts(true);
      } else {
        ToastNotify({ message: 'Não encontrado', type: 'error' });
      }
    } catch (error: any) {
      ToastNotify({ message: `Erro: ${error.message}`, type: 'error' });
    }
  }

  const OnSearchProduto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      findProduct();
    }
  };

  const handleCalcQTD = (qtd: number, product: iProduto): number => {
    let newQtd = 1;

    const multiploCompra = Number(product.MULTIPLO_COMPRA) || 1;
    const qtdVenda = Number(product.QTD_VENDA) || 1;

    const multiplo = qtdVenda > 1 ? qtdVenda : multiploCompra;

    newQtd = Math.ceil(qtd / multiplo) * multiplo;

    if (newQtd > product.QTDATUAL - product.QTD_GARANTIA) {
      newQtd = product.QTDATUAL - product.QTD_GARANTIA;
    }
    console.log('item Orc newQtd', newQtd);
    return newQtd;
  };

  async function onChangeQTD(e: React.ChangeEvent<HTMLInputElement>) {
    let newQtd = Number(e.target.value);

    if (Number.isNaN(newQtd) || newQtd < 1) {
      newQtd = 1;
    }
    const finalQtd = handleCalcQTD(newQtd, productSelected!);

    setQtdItem(finalQtd.toString());

    let total: number = currentPrice * finalQtd;

    setBudgetItem((prevBudgetItem) => ({
      ...prevBudgetItem,
      QTD: finalQtd,
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
    // Foco no input ao abrir o modal
    inputProductRef.current?.focus();

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
      key: 'acoes',
      title: 'AÇÕES',
      width: '10%',
      render: (_, item) => (
        <span className='flex w-full items-center justify-center gap-x-5'>
          <FontAwesomeIcon
            icon={faPlus}
            className='cursor-pointer text-emsoft_orange-main hover:text-emsoft_orange-light'
            size='xl'
            title='Adicionar'
            onClick={() => {
              loadingProduct(item.EXTERNO);
            }}
          />
        </span>
      ),
    },
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
                    onChange={(e) =>
                      setWordProducts(e.target.value.toUpperCase())
                    }
                    value={WordProducts}
                    ref={inputProductRef}
                    name='ProdutoPalavras'
                    labelText='PRODUTO'
                    labelPosition='top'
                    enterKeyHint='enter'
                    onKeyDown={OnSearchProduto}
                    disabled={item !== undefined}
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
              disabled={
                budgetItem.PRODUTO?.QTDATUAL! -
                  budgetItem.PRODUTO?.QTD_GARANTIA! <=
                0
              }
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
        <SearchProductsModal
          modalTitle={'Busca de Produtos'}
          IsVisible={IsVisibleModalProducts}
        >
          <SuperSearchProducts
            words={WordProducts}
            data={{ value: searchResult, Qtd_Registros: searchResult.length }}
            CallBack={loadingProduct}
          />
        </SearchProductsModal>
      </form>
      {isLoading && <Loading />}
    </div>
  );
};

export default FormEdit;

