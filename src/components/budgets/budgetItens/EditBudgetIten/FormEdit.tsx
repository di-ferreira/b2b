'use client';
import { ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import { iItemInserir, iItensOrcamento, iOrcamento } from '@/@types/Orcamento';
import { iListaSimilare, iProduto, iSaleHistory } from '@/@types/Produto';
import { iColumnType, iDataResultTable } from '@/@types/Table';
import { addItem, GetOrcamento, updateItem } from '@/app/actions/orcamento';
import {
  GetNewPriceFromTable,
  GetProduct,
  GetProductPromotion,
  GetSaleHistory,
  SuperFindProducts,
} from '@/app/actions/produto';
import { DataTable } from '@/components/CustomDataTable';
import { Loading } from '@/components/Loading';
import SuperSearchProducts from '@/components/products/SuperSearchProduct';
import ToastNotify from '@/components/ToastNotify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import useModal from '@/hooks/useModal';
import { FormatToCurrency } from '@/lib/utils';
import { faPlus, faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { tableSalesHistoryHeaders } from './columns';

interface iFormEditItem {
  item?: iItensOrcamento;
  budget: iOrcamento;
  CallBack?: () => void;
  onCloseModal?: () => void; // Adicione esta linha
}

const FormEdit = ({ item, budget, CallBack, onCloseModal }: iFormEditItem) => {
  const { showModal } = useModal();
  const [budgetItem, setBudgetItem] = useState<iItensOrcamento>({
    QTD: 1,
    VALOR: 0,
    TOTAL: 0,
    SUBTOTAL: 0,
    DESCONTO: 0,
    TABELA: 'SISTEMA',
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
  const [Budget, setBudget] = useState<iOrcamento>(budget);
  const [productSelected, setProductSelected] = useState<iProduto>(
    {} as iProduto
  );
  const [Similares, setSimilares] = useState<iListaSimilare[]>([]);
  const [SalesHistory, setSalesHistory] = useState<iSaleHistory[]>([]);
  let [SerachedProducts, setSerachedProducts] = useState<
    iDataResultTable<iProduto>
  >({
    Qtd_Registros: 0,
    value: [],
  });
  const [WordProducts, setWordProducts] = useState<string>('');
  const [QtdItem, setQtdItem] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [isOferta, setIsOferta] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputProductRef = useRef<HTMLInputElement>(null);
  const inputQTDRef = useRef<HTMLInputElement>(null);
  const inputBtnSalvarRef = useRef<HTMLButtonElement>(null);

  async function saveItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let response;
    let message = '';
    const itemSave: iItemInserir = {
      pIdOrcamento: budget.ORCAMENTO,
      pItemOrcamento: {
        CodigoProduto: WordProducts,
        Desconto: 0,
        Frete: 0,
        Qtd: budgetItem.QTD,
        Tabela: budgetItem.TABELA,
        Valor: budgetItem.VALOR,
        SubTotal: budgetItem.SUBTOTAL,
        Total: budgetItem.TOTAL,
      },
    };
    if (budgetItem.ORCAMENTO > 0) {
      response = await updateItem(itemSave);
      // OnCloseModal();
      message = 'Item editado com sucesso';
    } else {
      response = await addItem(itemSave);
      // OnCloseModal();
      message = 'Item adicionado com sucesso';
    }

    if (response.value !== undefined) {
      ToastNotify({
        message: message,
        type: 'success',
      });
    }

    if (response.error !== undefined) {
      ToastNotify({
        message: 'Erro ao adicionar item',
        type: 'error',
      });
    }

    if (CallBack) {
      CallBack();
    }
    if (onCloseModal) onCloseModal();
    setIsOferta(false);
  }

  async function UpdateProduct(prod: iProduto) {
    let new_price = prod.PRECO;
    let promotionalProduct = await GetProductPromotion(prod);

    let history = await GetSaleHistory(budget.CLIENTE, prod);

    if (promotionalProduct.error !== undefined) {
      new_price = (await GetNewPriceFromTable(prod, Budget.CLIENTE.Tabela))
        .value!;
    }

    if (promotionalProduct.value !== undefined) {
      setIsOferta(true);
      new_price = promotionalProduct.value.OFERTA;
    }

    let newQtd = 1;
    if (prod !== undefined) {
      newQtd = handleCalcQTD(budgetItem.QTD, prod);
      setBudgetItem(
        (old) =>
          (old = {
            ...budgetItem,
            PRODUTO: prod,
            VALOR: new_price,
            QTD: newQtd,
            SUBTOTAL: new_price * budgetItem.QTD,
            TOTAL: new_price * budgetItem.QTD,
          })
      );

      history.value !== null && setSalesHistory((old) => [...history.value!]);

      setQtdItem((old) => (old = newQtd.toString()));
      setProductSelected(prod);
      setSimilares((old) => [...prod.ListaSimilares]);
      setWordProducts(prod.PRODUTO);
      inputQTDRef.current?.focus();
    }
  }

  async function loadingProduct(product: iProduto) {
    setLoading(true);
    try {
      const prod = await GetProduct(product.PRODUTO);
      UpdateProduct(prod.value!);
    } finally {
      setLoading(false);
    }
  }

  async function findProduct() {
    setLoading(true);

    const resultProduct = await GetProduct(WordProducts);

    if (
      resultProduct.value !== undefined &&
      resultProduct.value?.ATIVO !== 'N' &&
      resultProduct.value?.VENDA !== 'N'
    ) {
      UpdateProduct(resultProduct.value);
      setLoading(false);
    } else if (
      resultProduct.error !== undefined ||
      (resultProduct.value?.ATIVO !== 'S' && resultProduct.value?.VENDA !== 'S')
    ) {
      SuperFindProducts({
        filter: [{ key: 'PRODUTO', value: WordProducts }],
      })
        .then(async (products: ResponseType<iDataResultTable<iProduto>>) => {
          if (products.value !== undefined) {
            if (products.value.Qtd_Registros === 1) {
              loadingProduct(products.value.value[0]);
            } else {
              setSerachedProducts((old) => (old = products.value!));
              showModal();
            }
          }

          if (products.error !== undefined) {
            ToastNotify({
              message: `Erro: ${products.error.message}`,
              type: 'error',
            });
          }
        })
        .catch((e) => {
          toast({
            title: 'Error!',
            description: `Erro: ${e.message}`,
            variant: 'destructive',
          });
        })
        .finally(() => {
          inputQTDRef.current?.focus();

          setLoading(false);
        });
    } else {
      ToastNotify({
        message: `Erro: Produto não disponível para venda`,
        type: 'error',
      });

      setLoading(false);
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
    let multiplo = product.MULTIPLO_COMPRA;

    if (product.QTD_VENDA > 1) multiplo = product.QTD_VENDA;

    newQtd = Math.ceil(qtd / multiplo) * multiplo;
    return newQtd;
  };

  async function onChangeQTD(e: React.ChangeEvent<HTMLInputElement>) {
    let newQtd = Number(e.target.value);
    if (isNaN(newQtd)) newQtd = 1;
    const finalQtd = handleCalcQTD(newQtd, productSelected);

    setQtdItem(finalQtd.toString());

    const new_price = await GetNewPriceFromTable(
      productSelected,
      Budget.CLIENTE.Tabela
    );

    setBudgetItem((prevBudgetItem) => ({
      ...prevBudgetItem,
      QTD: finalQtd,
      SUBTOTAL: new_price.value! * newQtd,
      TOTAL: new_price.value! * newQtd,
    }));
  }

  async function LoadItem(cliente: iCliente) {
    if (item) {
      const new_price = await GetNewPriceFromTable(
        item.PRODUTO,
        cliente.Tabela
      );
      setProductSelected(
        (old) =>
          (old = {
            ...item.PRODUTO,
          })
      );

      setBudgetItem(
        (old) =>
          (old = {
            ...item,
            PRODUTO: item.PRODUTO,
            VALOR: new_price.value!,
            QTD: item.QTD,
            SUBTOTAL: item.SUBTOTAL,
            TOTAL: item.TOTAL,
          })
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
        const res = await GetOrcamento(budget.ORCAMENTO);
        if (res.value) {
          setBudget(res.value);
          LoadItem(res.value.CLIENTE);
        }
      } catch (err: any) {
        console.error('Erro ao carregar orçamento:', err);
        ToastNotify({ message: err.message, type: 'error' });
      }
    };

    loadData();

    // Cleanup opcional se necessário
    return () => {
      // Código de limpeza aqui (se aplicável)
    };
  }, [budget.ORCAMENTO, item?.PRODUTO.PRODUTO]);

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
                {/* <div className={`flex w-[10%] mb-2`}>
                <Button
                  type='button'
                  onClick={() => {
                    findProduct();
                  }}
                  className={`flex w-9 h-10`}
                  title='Buscar Produto'
                  disabled={item !== undefined || loading}
                >
                  <FontAwesomeIcon
                    icon={loading ? faSpinner : faSearch}
                    spin={loading}
                    size='xl'
                    title='Fechar'
                    className='text-white'
                  />
                </Button>
              </div> */}
              </div>
              <div
                className={`flex w-[25%] tablet:w-[47%] tablet-portrait:w-[100%]`}
              >
                <Input
                  disabled
                  value={budgetItem.PRODUTO?.REFERENCIA}
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
                  value={budgetItem.PRODUTO?.FABRICANTE?.NOME}
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
                  value={budgetItem.PRODUTO?.LOCAL?.toLocaleUpperCase()}
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
                  value={budgetItem.PRODUTO?.NOME}
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
                  value={budgetItem.PRODUTO?.APLICACOES}
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
                  value={budgetItem.PRODUTO?.INSTRUCOES?.toString()}
                />
              </div>
            </div>
          </div>
          <div className={`flex flex-col w-[30%] tablet:w-[40%]`}>
            <DataTable
              columns={tableSalesHistoryHeaders}
              IsLoading={false}
              TableData={SalesHistory}
              ErrorMessage='Nenhuma Chave encontrada'
            />
          </div>
        </div>
        <div className={`flex items-end pt-4 gap-x-4`}>
          <div className={`flex w-[10%]`}>
            <Input
              disabled
              value={budgetItem.PRODUTO?.QTDATUAL}
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
              value={FormatToCurrency(budgetItem.VALOR.toString())}
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
            TableData={Similares}
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
        </footer>
        <SuperSearchProducts
          words={WordProducts}
          data={SerachedProducts}
          CallBack={loadingProduct}
        />
      </form>
      {loading && <Loading />}
    </div>
  );
};

export default FormEdit;

