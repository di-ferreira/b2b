'use client';
import { ResponseType } from '@/@types';
import { iFilter } from '@/@types/Filter';
import { iProduto } from '@/@types/Produto';
import { iColumnType, iDataResultTable } from '@/@types/Table';
import { SuperFindProducts } from '@/app/actions/produto';
import useModal from '@/hooks/useModal';
import { KEY_NAME_TABLE_PAGINATION, ROWS_PER_PAGE_OPTIONS } from '@/constants';
import { getErrorMessage, loadStorage } from '@/lib/utils';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Suspense, useEffect, useState } from 'react';
import { DataTable } from '../CustomDataTable';
import ToastNotify from '../ToastNotify';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const REGISTROS_POR_PAGINA = ROWS_PER_PAGE_OPTIONS[0];

const formatarPreco = (valor: number) =>
  Number(valor ?? 0).toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL',
  });

/**
 * Estoque/preço por loja só existem quando o produto tem linha na filial
 * (`ESTOQUE_LOJAS`). Sem linha — ou quando a consulta de estoque falha — a
 * coluna mostra "-" em vez de um zero que pareceria estoque zerado.
 */
const formatarLoja = (valor: number | undefined) =>
  valor === undefined || valor === null ? '-' : String(valor);

const formatarPrecoLoja = (valor: number | undefined) =>
  valor === undefined || valor === null ? '-' : formatarPreco(valor);

/**
 * Mesmo tamanho de página que o TablePagination vai usar: ele guarda a
 * escolha do usuário no storage. Sem storage, a busca inicial traz 10.
 */
function registrosPorPagina(): number {
  try {
    const pagination = loadStorage<{ RowsPerPage?: number }>(
      KEY_NAME_TABLE_PAGINATION,
    );
    const rows = Number(pagination?.RowsPerPage);
    return ROWS_PER_PAGE_OPTIONS.includes(rows) ? rows : REGISTROS_POR_PAGINA;
  } catch {
    return REGISTROS_POR_PAGINA;
  }
}

interface iProps {
  data: iDataResultTable<iProduto>;
  words: string;
  CallBack?: (product: iProduto) => void;
}

const SuperSearchProducts = ({ data, words, CallBack }: iProps) => {
  const { OnCloseModal, showModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [Products, setProducts] = useState<iDataResultTable<iProduto>>(data);
  const [WordProducts, setWordProducts] = useState<string>(words);

  const tableHeaders: iColumnType<iProduto>[] = [
    {
      key: 'acoes',
      title: 'AÇÕES',
      width: '4%',
      render: (_, item) => (
        <span className='flex w-full items-center justify-center gap-x-5'>
          <FontAwesomeIcon
            icon={faPlus}
            className='cursor-pointer text-emsoft_blue-main hover:text-emsoft_blue-light'
            size='xl'
            title='Adicionar'
            onClick={() => {
              if (CallBack !== undefined) {
                OnCloseModal();
                CallBack(item);
              }
            }}
          />
        </span>
      ),
    },
    {
      key: 'PRODUTO',
      title: 'CÓDIGO',
      width: '8%',
    },
    {
      key: 'REFERENCIA',
      title: 'REFERÊNCIA',
      width: '10%',
    },
    {
      key: 'NOME',
      title: 'NOME',
      width: '29%',
    },
    {
      key: 'FABRICANTE.NOME',
      title: 'FABRICANTE',
      width: '19%',
    },
    {
      key: 'QTDATUAL',
      title: 'QTD_RJ',
      width: '6%',
    },
    {
      key: 'PRECO',
      title: 'PREÇO_RJ',
      width: '9%',
      render: (_, item) => formatarPreco(item.PRECO),
    },
    {
      key: 'QTD_ES',
      title: 'QTD_ES',
      width: '6%',
      render: (_, item) => formatarLoja(item.QTD_ES),
    },
    {
      key: 'PRECO_ES',
      title: 'PREÇO_ES',
      width: '9%',
      render: (_, item) => formatarPrecoLoja(item.PRECO_ES),
    },
  ];

  function findProduct(filter: iFilter<iProduto>) {
    const termo = WordProducts.trim();

    if (!termo) {
      setProducts({ value: [], Qtd_Registros: 0 });
      return;
    }

    setLoading(true);
    SuperFindProducts(
      termo,
      filter.top ?? registrosPorPagina(),
      filter.skip ?? 0,
    )
      .then((products: ResponseType<iDataResultTable<iProduto>>) => {
        if (products.error !== undefined) {
          ToastNotify({
            message: `Erro ao buscar produtos: ${products.error.message}`,
            type: 'error',
          });
          return;
        }

        const lista = (products.value?.value ?? []).filter(
          (p) => p.ATIVO !== 'N' && p.VENDA !== 'N' && p.TRANCAR !== 'S',
        );

        setProducts({
          Qtd_Registros: products.value?.Qtd_Registros ?? 0,
          value: lista,
        });

        if (lista.length === 0) {
          ToastNotify({
            message: `Nenhum produto encontrado para "${termo}"`,
            type: 'warning',
          });
        }
      })
      .catch((e) => {
        ToastNotify({
          message: `Erro ao buscar produtos: ${getErrorMessage(e)}`,
          type: 'error',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const OnSearchProduto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      findProduct({ top: registrosPorPagina(), skip: 0 });
    }
  };

  useEffect(() => {
    setProducts(data);
    if (data.value.length > 0) {
      showModal();
    }
  }, [data]);
  return (
    <div className='flex flex-col gap-4 w-full h-[95%] p-2'>
      <div className='flex gap-x-2 w-full items-center'>
        <Input
          value={WordProducts}
          onChange={(e) => setWordProducts(e.target.value)}
          onKeyDown={OnSearchProduto}
        />
        <Button
          className={`flex w-fit h-[35px] p-3 gap-3`}
          title='Buscar Produto'
          onClick={() => findProduct({ top: registrosPorPagina(), skip: 0 })}
        >
          <FontAwesomeIcon
            icon={faSearch}
            size='xl'
            title='SALVAR'
            className='text-white'
          />
          Buscar
        </Button>
      </div>
      <div className='flex w-full h-full flex-col overflow-x-hidden overflow-y-auto'>
        {loading ? (
          <span>Carregando...</span>
        ) : (
          <Suspense fallback={<span>Carregando...</span>}>
            <DataTable
              columns={tableHeaders}
              TableData={Products.value}
              IsLoading={loading}
              QuantityRegisters={Products.Qtd_Registros}
              onFetchPagination={findProduct}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default SuperSearchProducts;

