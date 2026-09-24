'use client';
import { iSearch, ResponseType } from '@/@types';
import { iFilter } from '@/@types/Filter';
import { iProduto } from '@/@types/Produto';
import { iDataResultTable } from '@/@types/Table';
import { SearchProductsViaSQL } from '@/app/actions/produto';
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

  const handleProductSearch = (filter: iSearch<iProduto>) => {
    setLoading(true);
    setWordProducts(filter.value);

    SearchProductsViaSQL(filter.value.toUpperCase(), 15, 0)
      .then((products: ResponseType<iDataResultTable<iProduto>>) => {
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

    SearchProductsViaSQL(
      WordProducts.toUpperCase(),
      filter.top,
      filter.skip,
    )
      .then((products: ResponseType<iDataResultTable<iProduto>>) => {
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
          QuantityRegisters={data.value?.Qtd_Registros}
          onFetchPagination={handleProduct}
          IsLoading={loading}
        />
      </Suspense>
    </section>
  );
}

export default DataTableProducts;

