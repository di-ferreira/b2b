'use client';
import { iSearch, ResponseType } from '@/@types';
import { iFilter, iFilterQuery } from '@/@types/Filter';
import { iProduto } from '@/@types/Produto';
import { iDataResultTable } from '@/@types/Table';
import { SuperFindProducts } from '@/app/actions/produto';
import { DataTable } from '@/components/CustomDataTable';
import ErrorMessage from '@/components/ErrorMessage';
import Filter from '@/components/Filter';
import { Loading } from '@/components/Loading';
import { KEY_NAME_TABLE_PAGINATION } from '@/constants';
import { removeStorage } from '@/lib/utils';
import { Suspense, useEffect, useState } from 'react';
import { headers } from './columns';

function DataTableProducts() {
  const [data, setData] = useState<ResponseType<iDataResultTable<iProduto>>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [WordProducts, setWordProducts] = useState<string>('');

  const MountQueryFilter = (
    filter: iSearch<iProduto>
  ): iFilterQuery<iProduto>[] => {
    let listFilter: iFilterQuery<iProduto>[] = [];

    if (filter.value !== '') {
      listFilter = [
        {
          key: filter.filterBy as keyof iProduto,
          value: filter.value,
        },
      ];
    }
    return listFilter;
  };

  const handleProductSearch = (filter: iSearch<iProduto>) => {
    setLoading(true);
    setWordProducts(filter.value);

    SuperFindProducts({
      top: 15,
      skip: 0,
      orderBy: 'PRODUTO',
      filter: MountQueryFilter(filter),
    })
      .then(async (products: ResponseType<iDataResultTable<iProduto>>) => {
        if (products.value !== undefined) {
          setData((old) => (old = products));
        }

        if (products.error !== undefined)
          console.error('Error find Products', products.error);
      })
      .catch((e) => {
        console.error('Error find Products', e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleProduct = (filter: iFilter<iProduto>) => {
    setLoading(true);

    SuperFindProducts({
      top: filter.top,
      skip: filter.skip,
      orderBy: 'PRODUTO',
      filter: [{ key: 'PRODUTO', value: WordProducts }],
    })
      .then(async (products: ResponseType<iDataResultTable<iProduto>>) => {
        if (products.value !== undefined) {
          setData((old) => (old = products));
        }

        if (products.error !== undefined)
          console.error('Error find Products', products.error);
      })
      .catch((e) => {
        console.error('Error find Products', e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    removeStorage(KEY_NAME_TABLE_PAGINATION);
    handleProduct({ top: 10 });
  }, []);

  if (data.error !== undefined) {
    return (
      <ErrorMessage
        title='Erro ao carregar Produtos'
        message={`${data.error.message}`}
      />
    );
  }

  return (
    <section className='flex flex-col gap-x-5 w-full'>
      <Filter onSearch={handleProductSearch} />
      <Suspense fallback={<Loading />}>
        <DataTable
          columns={headers}
          TableData={data.value?.value!}
          QuantityRegiters={data.value?.Qtd_Registros}
          onFetchPagination={handleProduct}
          IsLoading={loading}
        />
      </Suspense>
    </section>
  );
}

export default DataTableProducts;

