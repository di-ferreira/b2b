'use client';
import { iSearch, ResponseType } from '@/@types';
import { iFilter, iFilterQuery } from '@/@types/Filter';
import { iOrcamento } from '@/@types/Orcamento';
import { iDataResultTable } from '@/@types/Table';
import { GetOrcamentosFromVendedor } from '@/app/actions/orcamento';
import { DataTable } from '@/components/CustomDataTable';
import ErrorMessage from '@/components/ErrorMessage';
import Filter from '@/components/Filter';
import { Loading } from '@/components/Loading';
import { KEY_NAME_TABLE_PAGINATION } from '@/constants';
import { removeStorage } from '@/lib/utils';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { headers } from './columns';

function DataTableBudget() {
  const [data, setData] = useState<ResponseType<iDataResultTable<iOrcamento>>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const filterValues = [
    { key: 'ORÇAMENTOS ABERTOS', value: 'N' },
    { key: 'ORÇAMENTOS FECHADOS', value: 'S' },
  ];
  const MountQueryFilter = useCallback(
    (filter: iSearch<iOrcamento>): iFilterQuery<iOrcamento>[] => {
      let listFilter: iFilterQuery<iOrcamento>[] = [];

      listFilter.push({ key: 'PV', value: filter.filterBy, typeSearch: 'eq' });

      return listFilter;
    },
    []
  );
  const handleBudgetSearch = useCallback((filter: iSearch<iOrcamento>) => {
    const valueSearch: string = filter.filterBy;

    if (valueSearch == 'S')
      handleBudgets({
        top: 10,
        skip: 0,
        orderBy: 'ORCAMENTO desc' as keyof iOrcamento,
        filter: MountQueryFilter(filter),
      });
    else
      handleBudgets({
        top: 10,
      });
  }, []);

  const handleBudgets = useCallback((filter: iFilter<iOrcamento>) => {
    setLoading(true);
    GetOrcamentosFromVendedor(filter)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar clientes:', err);
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
        title={`Erro ao carregar orçamentos`}
        message={`${data.value?.Qtd_Registros}`}
      />
    );
  }

  return (
    <section className='flex flex-col gap-5 w-full pt-4'>
      <Filter
        input={false}
        options={filterValues}
        onSearch={handleBudgetSearch}
      />
      <Suspense fallback={<Loading />}>
        <DataTable
          columns={headers}
          TableData={data.value?.value!}
          QuantityRegiters={data.value?.Qtd_Registros}
          onFetchPagination={handleBudgets}
          IsLoading={loading}
        />
      </Suspense>
    </section>
  );
}

export default DataTableBudget;

