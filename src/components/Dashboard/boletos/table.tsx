'use client';
import { ResponseType } from '@/@types';
import { iContas } from '@/@types/Contas';
import { iFilter } from '@/@types/Filter';
import { iDataResultTable } from '@/@types/Table';
import { GetContasDashboard } from '@/app/actions/contasAPagarReceber';
import { DataTable } from '@/components/CustomDataTable';
import ErrorMessage from '@/components/ErrorMessage';
import { Loading } from '@/components/Loading';
import { KEY_NAME_TABLE_PAGINATION } from '@/constants';
import { removeStorage } from '@/lib/utils';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { headers } from './columns';

function DataTableBankSlip() {
  const [data, setData] = useState<ResponseType<iDataResultTable<iContas>>>({});
  const [loading, setLoading] = useState(false);

  const handleBudgets = useCallback((filter: iFilter<iContas>) => {
    setLoading(true);
    GetContasDashboard()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar Contas:', err);
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
        title='Erro ao carregar Contas'
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

export default DataTableBankSlip;

