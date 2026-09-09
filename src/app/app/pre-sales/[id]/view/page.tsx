import { GetPreVenda } from '@/app/actions/preVenda';
import PreSaleItemsTable from '@/components/preSale/ViewItemsTable';
import dayjs from 'dayjs';

interface iViewPreSalePageProps {
  params: { id: string };
}

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
        <PreSaleItemsTable itens={pv.Itens_List || []} />
      </div>
    </div>
  );
}
