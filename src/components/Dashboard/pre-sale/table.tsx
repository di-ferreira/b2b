'use client';
import { ResponseType } from '@/@types';
import { iFilter } from '@/@types/Filter';
import { iMovimentoEventos } from '@/@types/MovimentosEventos';
import { iDataResultTable } from '@/@types/Table';
import { GetMovimentosDashboard } from '@/app/actions/preVenda';
import { DataTable } from '@/components/CustomDataTable';
import ErrorMessage from '@/components/ErrorMessage';
import { Loading } from '@/components/Loading';
import { KEY_NAME_TABLE_PAGINATION } from '@/constants';
import { removeStorage } from '@/lib/utils';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { headers } from './columns';

function DataTableSaleAwaiting() {
  const [data, setData] = useState<
    ResponseType<iDataResultTable<iMovimentoEventos>>
  >({});
  const [loading, setLoading] = useState(false);

  const handleBudgets = useCallback((filter: iFilter<iMovimentoEventos>) => {
    setLoading(true);
    GetMovimentosDashboard()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar Pré-vendas:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    removeStorage(KEY_NAME_TABLE_PAGINATION);
    handleBudgets({ top: 10 });
  }, []);

  if (data.error !== undefined) {
    return (
      <ErrorMessage
        title='Erro ao carregar Pré-vendas'
        message={`${data.error.message}`}
      />
    );
  }

  return (
    <section className='flex flex-col gap-x-5 w-full'>
      <Suspense fallback={<Loading />}>
        <DataTable
          columns={headers}
          TableData={data.value?.value!}
          //   QuantityRegiters={data.value?.Qtd_Registros}
          //   onFetchPagination={handleBudgets}
          IsLoading={loading}
        />
      </Suspense>
    </section>
  );
}

export default DataTableSaleAwaiting;

