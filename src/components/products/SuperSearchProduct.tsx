'use client';
import { ResponseType } from '@/@types';
import { iFilter } from '@/@types/Filter';
import { iProduto } from '@/@types/Produto';
import { iColumnType, iDataResultTable } from '@/@types/Table';
import { SearchProductsViaSQL } from '@/app/actions/produto';
import useModal from '@/hooks/useModal';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Suspense, useEffect, useState } from 'react';
import { DataTable } from '../CustomDataTable';
import ToastNotify from '../ToastNotify';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

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
      width: '10%',
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
      width: '10%',
    },
    {
      key: 'REFERENCIA',
      title: 'REFERÊNCIA',
      width: '25%',
    },
    {
      key: 'NOME',
      title: 'NOME',
      width: '20%',
    },
    {
      key: 'APLICACOES',
      title: 'APLICAÇÕES',
      width: '35%',
    },
    {
      key: 'FABRICANTE.NOME',
      title: 'FABRICANTE',
      width: '35%',
    },
    {
      key: 'QTDATUAL',
      title: 'QTD',
      width: '10%',
    },
    {
      key: 'PRECO',
      title: 'VALOR',
      width: '10%',
      render: (_, item) => {
        return item.PRECO.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        });
      },
    },
  ];

  function findProduct(filter: iFilter<iProduto>) {
    setLoading(true);
    SearchProductsViaSQL(
      WordProducts.toUpperCase(),
      filter.top,
      filter.skip,
    )
      .then((products: ResponseType<iDataResultTable<iProduto>>) => {
        if (products.value !== undefined) {
          setProducts(
            (old) =>
              (old = {
                Qtd_Registros: products.value!.Qtd_Registros,
                value: products.value!.value.filter(
                  (p) => p.ATIVO !== 'N' && p.VENDA !== 'N' && p.TRANCAR !== 'S'
                ),
              })
          );
        }

        if (products.error !== undefined) {
          ToastNotify({
            message: 'Error find Products' + products.error,
            type: 'error',
          });
        }
      })
      .catch((e) => {
        ToastNotify({
          message: 'Error find Products' + e,
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
      findProduct({ top: 10, skip: 0 });
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
          onClick={() => findProduct({ top: 10, skip: 0 })}
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

