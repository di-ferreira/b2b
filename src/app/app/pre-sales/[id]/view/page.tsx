import { GetPreVenda } from '@/app/actions/preVenda';
import { iItensList } from '@/@types/PreVenda';
import { iColumnType } from '@/@types/Table';
import { DataTable } from '@/components/CustomDataTable';
import dayjs from 'dayjs';

interface iViewPreSalePageProps {
  params: { id: string };
}

const itensHeaders: iColumnType<iItensList>[] = [
  {
    key: 'PRODUTO.PRODUTO',
    title: 'CÓDIGO',
    width: '15%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.PRODUTO?.PRODUTO}
      </span>
    ),
  },
  {
    key: 'PRODUTO.REFERENCIA',
    title: 'REFERÊNCIA',
    width: '15%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.PRODUTO?.REFERENCIA}
      </span>
    ),
  },
  {
    key: 'PRODUTO.NOME',
    title: 'PRODUTO',
    width: '25%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-start text-wrap h-[45px]'>
        {item.PRODUTO?.NOME}
      </span>
    ),
  },
  {
    key: 'VALOR',
    title: 'VALOR UNITÁRIO',
    width: '12%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.VALOR?.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        })}
      </span>
    ),
  },
  {
    key: 'QTD',
    title: 'QTD',
    width: '8%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.QTD}
      </span>
    ),
  },
  {
    key: 'TOTAL',
    title: 'TOTAL',
    width: '15%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.TOTAL?.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        })}
      </span>
    ),
  },
];

export default async function ViewPreSalePage({ params }: iViewPreSalePageProps) {
  const result = await GetPreVenda(Number(params.id));

  if (result.error || !result.value) {
    return (
      <div className='flex flex-col items-center justify-center h-[60vh] gap-4'>
        <p className='text-lg text-red-600'>
          {result.error?.message || 'Pré-venda não encontrada.'}
        </p>
        <a
          href='/app/pre-sales'
          className='text-emsoft_blue-main underline hover:text-emsoft_blue-light'
        >
          Voltar para pré-vendas
        </a>
      </div>
    );
  }

  const pv = result.value;

  return (
    <div className='flex flex-col w-full max-w-5xl mx-auto px-5 py-8 gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Pré-Venda Nº {pv.MOVIMENTO}</h1>
        <a
          href='/app/pre-sales'
          className='text-emsoft_blue-main underline hover:text-emsoft_blue-light'
        >
          Voltar
        </a>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg'>
        <div>
          <span className='text-sm text-gray-500'>DATA</span>
          <p className='font-semibold'>
            {dayjs(pv.DATA).format('DD/MM/YYYY')}
          </p>
        </div>
        <div>
          <span className='text-sm text-gray-500'>CLIENTE</span>
          <p className='font-semibold'>{pv.CLIENTE?.NOME}</p>
        </div>
        <div>
          <span className='text-sm text-gray-500'>VENDEDOR</span>
          <p className='font-semibold'>{pv.VENDEDOR?.NOME}</p>
        </div>
        <div>
          <span className='text-sm text-gray-500'>TOTAL</span>
          <p className='font-semibold text-emsoft_orange-main'>
            {pv.TOTAL?.toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
        </div>
      </div>

      <div className='border-t-2 border-emsoft_orange-main pt-4'>
        <DataTable
          columns={itensHeaders}
          TableData={pv.Itens_List || []}
          IsLoading={false}
        />
      </div>
    </div>
  );
}
