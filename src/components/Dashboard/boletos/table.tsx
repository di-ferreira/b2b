'use client';
import { ResponseType } from '@/@types';
import { iContas } from '@/@types/Contas';
import { iFilter } from '@/@types/Filter';
import { iColumnType, iDataResultTable } from '@/@types/Table';
import { GetContasDashboard } from '@/app/actions/contasAPagarReceber';
import { DataTable } from '@/components/CustomDataTable';
import ErrorMessage from '@/components/ErrorMessage';
import { Loading } from '@/components/Loading';
import { KEY_NAME_TABLE_PAGINATION } from '@/constants';
import { removeStorage } from '@/lib/utils';
import dayjs from 'dayjs';
import { Suspense, useCallback, useEffect, useState } from 'react';
import ButtonBoleto from './ButtonBoleto';

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

  const headers: iColumnType<iContas>[] = [
    {
      key: 'DATA',
      title: 'DATA',
      width: '20rem',
      render: (_, item) => {
        return dayjs(item.Data).format('DD/MM/YYYY');
      },
    },
    {
      key: 'DOC',
      title: 'DOC',
      width: '5rem',
      render: (_, item) => {
        return item.Doc;
      },
    },
    {
      key: 'TOTAL',
      title: 'TOTAL',
      width: '7rem',
      render: (_, item) => {
        return item.TOTAL.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        });
      },
    },
    {
      key: '',
      title: 'BOLETO',
      width: '20rem',
      render: (_, item) => {
        let banco: string = item.EMISSAO_BOLETO || '';
        console.log('banco: ', banco);
        if (banco === 'CAIXA ECONOMICA') {
          banco = 'caixa';
        }
        banco = banco.toLocaleLowerCase().trim().replaceAll(' ', '');
        return <ButtonBoleto conta={item} />;
      },
    },
  ];

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

