'use client';
import { iSearch, ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import { iFilter, iFilterQuery } from '@/@types/Filter';
import { iOrcamento } from '@/@types/Orcamento';
import { iColumnType, iDataResultTable } from '@/@types/Table';
import { iVendedor } from '@/@types/Vendedor';
import { GetClienteFromVendedor } from '@/app/actions/cliente';
import { NewOrcamento } from '@/app/actions/orcamento';
import { DataTable } from '@/components/CustomDataTable';
import ErrorMessage from '@/components/ErrorMessage';
import Filter from '@/components/Filter';
import { Loading } from '@/components/Loading';
import { KEY_NAME_TABLE_PAGINATION } from '@/constants';
import { removeStorage } from '@/lib/utils';
import {
  faFileLines,
  faSpinner,
  faUserAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { headers } from './columns';

function DataTableCustomer() {
  const router = useRouter();
  const [data, setData] = useState<ResponseType<iDataResultTable<iCliente>>>(
    {}
  );
  const [iconLoading, setIconLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const filterValues = [
    { key: 'NOME', value: 'NOME' },
    { key: 'CÓDIGO', value: 'CLIENTE' },
    { key: 'CPF/CNPJ', value: 'CIC' },
    { key: 'BAIRRO', value: 'BAIRRO' },
    { key: 'CIDADE', value: 'CIDADE' },
  ];

  const MountQueryFilter = useCallback(
    (filter: iSearch<iCliente>): iFilterQuery<iCliente>[] => {
      let listFilter: iFilterQuery<iCliente>[] = [];

      if (filter.value !== '') {
        if (filter.filterBy === 'CLIENTE' || filter.filterBy === 'CIC')
          listFilter = [
            {
              key: filter.filterBy as keyof iCliente,
              value: filter.value,
              typeSearch: 'eq',
            },
          ];
        else
          listFilter = [
            {
              key: filter.filterBy as keyof iCliente,
              value: filter.value,
            },
          ];
      }
      return listFilter;
    },
    []
  );

  const handleCustomerSearch = useCallback((filter: iSearch<iCliente>) => {
    setLoading(true);
    GetClienteFromVendedor({
      top: 15,
      skip: 0,
      orderBy: 'CLIENTE',
      filter: MountQueryFilter(filter),
    })
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

  const handleCustomer = useCallback((filter: iFilter<iCliente>) => {
    setLoading(true);
    GetClienteFromVendedor(filter)
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
    handleCustomer({ top: 10 });
  }, []);

  if (data.error !== undefined) {
    return (
      <ErrorMessage
        title='Erro ao carregar Clientes'
        message={`${data.error.message}`}
      />
    );
  }
  const NewAddOrcamento: iOrcamento = {
    ORCAMENTO: 0,
    TOTAL: 0.0,
    CLIENTE: {} as iCliente,
    VENDEDOR: {} as iVendedor,
    COM_FRETE: 'N',
    ItensOrcamento: [],
  };

  const headersAction: iColumnType<iCliente> = {
    key: 'actions',
    title: 'AÇÕES',
    width: '20rem',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center gap-x-5'>
        <Link href={`/app/customers/${item.CLIENTE}`}>
          <FontAwesomeIcon
            icon={faUserAlt}
            className='text-emsoft_blue-main hover:text-emsoft_blue-light'
            size='xl'
            title='Cliente'
          />
        </Link>
        <FontAwesomeIcon
          icon={iconLoading ? faSpinner : faFileLines}
          spin={iconLoading}
          className='cursor-pointer text-emsoft_orange-main hover:text-emsoft_orange-light'
          size='xl'
          title='Gerar Orçamento'
          onClick={() => {
            let orcID = 0;
            setIconLoading(true);
            NewOrcamento()
              .then((res) => {
                if (res.value !== undefined) {
                  orcID = res.value.ORCAMENTO;
                }
              })
              .catch((err) => {
                console.error('Create budget error: ', err);
              })
              .finally(() => {
                setIconLoading(false);
                router.push(`/app/budgets/${orcID}`);
              });
          }}
        />
      </span>
    ),
  };

  const headersFull: iColumnType<iCliente>[] = [...headers, headersAction];

  return (
    <section className='flex flex-col gap-x-5 w-full'>
      <Filter options={filterValues} onSearch={handleCustomerSearch} />
      <Suspense fallback={<Loading />}>
        <DataTable
          columns={headersFull}
          TableData={data.value?.value!}
          QuantityRegiters={data.value?.Qtd_Registros}
          onFetchPagination={handleCustomer}
          IsLoading={loading}
        />
      </Suspense>
    </section>
  );
}

export default DataTableCustomer;

