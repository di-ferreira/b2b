import { iMovimento } from '@/@types/PreVenda';
import { GetVendaById } from '@/app/actions/vendas';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';

interface iSalePage {
  params: { id: string };
}

function parseCurrency(currency: number) {
  return currency.toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL',
  });
}

const SaleDetail = async ({ params }: iSalePage) => {
  const id = Number(params.id);
  const result = await GetVendaById(id);

  if (!result.value) return <p>Failed to load sale.</p>;

  const venda: iMovimento = result.value;

  return (
    <section className='flex flex-col gap-4 w-full h-full'>
      <h1
        className={`flex gap-x-3 text-4xl font-bold mt-5 py-1 px-3 
          border-b-2 text-emsoft_dark-text
       border-emsoft_orange-main`}
      >
        Venda #{venda.MOVIMENTO}
      </h1>

      <div className='flex gap-4 w-full h-full px-5 py-0 flex-wrap'>
        <Input
          labelText='DATA'
          labelPosition='top'
          value={dayjs(venda.DATA).format('DD/MM/YYYY HH:mm')}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='CLIENTE'
          labelPosition='top'
          value={venda.CLIENTE?.NOME ?? '-'}
          className='w-[35%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='VENDEDOR'
          labelPosition='top'
          value={venda.VENDEDOR?.NOME ?? '-'}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='TIPO'
          labelPosition='top'
          value={venda.TIPOMOV}
          className='w-[10%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='SUBTOTAL'
          labelPosition='top'
          value={parseCurrency(venda.SUBTOTAL)}
          className='w-[15%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='DESCONTO'
          labelPosition='top'
          value={parseCurrency(venda.DESCONTO)}
          className='w-[10%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='TOTAL'
          labelPosition='top'
          value={parseCurrency(venda.TOTAL)}
          className='w-[15%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='OBSERVAÇÃO'
          labelPosition='top'
          value={venda.OBS1 || '-'}
          className='w-[45%] tablet-portrait:w-[45%]'
        />
      </div>

      <h2
        className={`flex gap-x-3 text-2xl font-bold mt-5 py-1 px-3 
          border-b-2 text-emsoft_dark-text
       border-emsoft_orange-main`}
      >
        Itens
      </h2>

      <div className='w-full px-5 py-0 overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PRODUTO</TableHead>
              <TableHead>REFERÊNCIA</TableHead>
              <TableHead className='text-right'>QTD</TableHead>
              <TableHead className='text-right'>VALOR</TableHead>
              <TableHead className='text-right'>TOTAL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venda.Itens_List?.length <= 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center'>
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              venda.Itens_List.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className='font-medium'>
                    {item.PRODUTO?.NOME ?? '-'}
                  </TableCell>
                  <TableCell>{item.PRODUTO?.REFERENCIA ?? '-'}</TableCell>
                  <TableCell className='text-right'>{item.QTD}</TableCell>
                  <TableCell className='text-right'>
                    {parseCurrency(item.VALOR)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {parseCurrency(item.TOTAL)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex gap-4 w-full px-5 py-0 flex-wrap justify-end'>
        <Link
          href={`/app/sales`}
          className='text-red-700 hover:text-red-500 font-bold px-6 py-3'
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            size='xl'
            title='Voltar'
            className='mr-3'
          />
          Voltar
        </Link>
      </div>
    </section>
  );
};

export default SaleDetail;
