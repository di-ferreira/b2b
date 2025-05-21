import { iCliente } from '@/@types/Cliente';
import {
  GetCliente,
  GetPGTOsAtrazados,
  GetPGTOsEmAberto,
  GetPGTOsNaoVencidos,
} from '@/app/actions/cliente';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaskCnpjCpf } from '@/lib/utils';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';
import { RiMedalFill } from 'react-icons/ri';

interface iCustomerPage {
  params: { id: number };
}
interface iCredito {
  VENCIMENTO: string;
  DATA: string;
  TIPO: string;
  HISTORICO: string;
  ATRASO: number;
  RESTA: number;
  DOC: string;
  EMISSAO_BOLETO: string;
}

const Customers = async ({ params }: iCustomerPage) => {
  const customer = await GetCliente(params.id);
  const emAtrazo = await GetPGTOsAtrazados(params.id);
  const naoVencidas = await GetPGTOsNaoVencidos(params.id);
  const emAberto = await GetPGTOsEmAberto(params.id);

  function parseCurrency(currency: number) {
    return currency.toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  if (!customer.value) return <p>Failed to load customer.</p>;

  const contasAtrazadas = emAtrazo.value[0]?.VALOR ?? 0;

  const contasAVencer = naoVencidas.value?.Data[0]?.VALOR ?? 0;

  const contasAbertas =
    emAberto.value?.Data?.reduce(
      (total: any, conta: { RESTA: any }) => total + conta.RESTA,
      0
    ) ?? 0;

  const listaDebitos: iCredito[] =
    emAberto.value?.Data?.filter((abertos: iCredito) => abertos.ATRASO > 0) ??
    [];

  const listaCreditos: iCredito[] =
    emAberto.value?.Data?.filter((aberto: iCredito) => aberto.ATRASO <= 0) ??
    [];

  const saldoCompra =
    customer.value.LIMITE - (contasAtrazadas + contasAVencer + contasAbertas);

  function verifyTypeCustomer(customer: iCliente) {
    if (customer.TIPO_CLIENTE == 'BRONZE') {
      return (
        <RiMedalFill
          className={`text-[#cc7700] w-[35px] h-[35px] rounded-full p-1`}
          style={{
            stroke: '#474747',
            strokeWidth: '1px',
          }}
          title={customer.TIPO_CLIENTE}
        />
      );
    }
    if (customer.TIPO_CLIENTE == 'PRATA') {
      return (
        <RiMedalFill
          className={`text-[#B6C2CC] w-[35px] h-[35px] rounded-full p-1`}
          style={{
            stroke: '#474747',
            strokeWidth: '1px',
          }}
          title={customer.TIPO_CLIENTE}
        />
      );
    }
    if (customer.TIPO_CLIENTE == 'OURO') {
      return (
        <RiMedalFill
          className={'text-[#FFC600] w-[35px] h-[35px] rounded-full p-1'}
          style={{
            stroke: '#474747',
            strokeWidth: '1px',
          }}
          title={customer.TIPO_CLIENTE}
        />
      );
    }
    if (customer.TIPO_CLIENTE == 'FIEL') {
      return (
        <RiMedalFill
          className={'text-[#115C55] w-[35px] h-[35px] rounded-full p-1'}
          style={{
            stroke: '#474747',
            strokeWidth: '1px',
          }}
          title={customer.TIPO_CLIENTE}
        />
      );
    }
  }

  return (
    <section className='flex flex-col gap-4 w-full h-full'>
      <h1
        className={`flex gap-x-3 text-4xl font-bold mt-5 py-1 px-3 
          border-b-2 text-emsoft_dark-text
       border-emsoft_orange-main`}
      >
        Cliente {customer.value.CLIENTE} {verifyTypeCustomer(customer.value)}
      </h1>

      <div className='flex gap-4 w-full h-full px-5 py-0 flex-wrap'>
        <Input
          labelText='NOME'
          labelPosition='top'
          value={customer.value.NOME}
          className='w-[35%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='EMAIL'
          labelPosition='top'
          value={customer.value.EMAIL}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='TELEFONE'
          labelPosition='top'
          value={customer.value.TELEFONE}
          className='w-[15%] tablet-portrait:w-[45%]'
        />

        <Input
          labelText='CPF/CNPJ'
          labelPosition='top'
          value={MaskCnpjCpf(customer.value.CIC)}
          className='w-[24%] tablet-portrait:w-[45%]'
        />

        <Input
          labelText='ENDEREÇO'
          labelPosition='top'
          value={customer.value.ENDERECO}
          className='w-[37.5%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='BAIRRO'
          labelPosition='top'
          value={customer.value.BAIRRO}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='CIDADE'
          labelPosition='top'
          value={customer.value.CIDADE}
          className='w-[20%] tablet-portrait:w-[25%]'
        />
        <Input
          labelText='CIDADE'
          labelPosition='top'
          value={customer.value.UF}
          className='w-[5%] tablet-portrait:w-[10%]'
        />
        <Input
          labelText='CEP'
          labelPosition='top'
          value={customer.value.CEP}
          className='w-[10%] tablet-portrait:w-[20%]'
        />

        <Input
          labelText='TIPO DE CLIENTE'
          labelPosition='top'
          value={customer.value.TIPO_CLIENTE}
          className='w-[10%] tablet-portrait:w-[20%]'
        />

        <Input
          labelText='TABELA'
          labelPosition='top'
          value={customer.value.Tabela}
          className='w-[10%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='USAR LIMITE'
          labelPosition='top'
          value={customer.value.USARLIMITE === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[15%]'
        />
        <Input
          labelText='LIMITE CLIENTE'
          labelPosition='top'
          value={
            customer.value.LIMITE
              ? customer.value.LIMITE.toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : Number(0).toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })
          }
          className='w-[10%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='LIMITE CHEQUE'
          labelPosition='top'
          value={
            customer.value.LIMITE_CHEQUE
              ? customer.value.LIMITE_CHEQUE.toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : Number(0).toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })
          }
          className='w-[10%] tablet-portrait:w-[15%]'
        />
        <Input
          labelText='SOMENTE NFE'
          labelPosition='top'
          value={customer.value.SOMENTE_NFE === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[15%]'
        />
        <Input
          labelText='CARTEIRA'
          labelPosition='top'
          value={customer.value.CARTEIRA === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[15%]'
        />
        <Input
          labelText='DDA'
          labelPosition='top'
          value={customer.value.DDA === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[15%]'
        />

        <Input
          labelText='BLOQUEADO'
          labelPosition='top'
          value={customer.value.BLOQUEADO === 'S' ? 'SIM' : 'NÃO'}
          className='w-[25%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='MOTIVO BLOQUEIO'
          labelPosition='top'
          value={customer.value.MOTIVO}
          className='w-[45%] tablet-portrait:w-[35%]'
        />
      </div>
      <h2
        className={`flex gap-x-3 text-2xl font-bold mt-5 py-1 px-3 
          border-b-2 text-emsoft_dark-text
       border-emsoft_orange-main`}
      >
        Financeiro
      </h2>
      <div className='flex gap-4 w-full h-[300px] overflow-x-hidden overflow-y-auto px-5 py-0 flex-wrap'>
        <Tabs defaultValue='resumo' className='w-full'>
          <TabsList>
            <TabsTrigger value='resumo'>Resumo</TabsTrigger>
            <TabsTrigger value='creditos'>Créditos</TabsTrigger>
            <TabsTrigger value='vencidos'>Vencidos</TabsTrigger>
            <TabsTrigger value='nao_vencidos'>Não Vencidos</TabsTrigger>
          </TabsList>
          <TabsContent value='resumo'>
            <section className='w-full h-full flex flex-col'>
              <header className='flex w-[40%] px-3 justify-between border border-b-slate-800'>
                <span className='font-bold'>Descrição</span>
                <span className='font-bold'>Valor</span>
              </header>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Limite de crédito</p>
                <p>
                  {customer.value.LIMITE
                    ? customer.value.LIMITE.toLocaleString('pt-br', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : Number(0).toLocaleString('pt-br', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                </p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Contas não vencidas</p>
                <p>{parseCurrency(contasAVencer)}</p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Contas vencidas</p>
                <p>{parseCurrency(contasAtrazadas)}</p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Total de Contas a receber</p>
                <p>{parseCurrency(contasAbertas)}</p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Saldo para comprar</p>
                <p>{parseCurrency(saldoCompra)}</p>
              </article>
            </section>
          </TabsContent>
          <TabsContent value='creditos'>
            <Table className='w-[40%]'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[150px]'>VENCIMENTO</TableHead>
                  <TableHead>DOC</TableHead>
                  <TableHead>HISTÓRICO</TableHead>
                  <TableHead className='text-right'>A PAGAR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCreditos && listaCreditos.length <= 0 ? (
                  <span>Não há Créditos</span>
                ) : (
                  listaCreditos.map((lc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className='font-medium'>
                        {dayjs(lc.VENCIMENTO).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>{lc.DOC}</TableCell>
                      <TableCell>{lc.HISTORICO}</TableCell>
                      <TableCell className='text-right'>
                        {parseCurrency(lc.RESTA)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value='vencidos'>
            <Table className='w-[40%]'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[150px]'>VENCIMENTO</TableHead>
                  <TableHead>DOC</TableHead>
                  <TableHead>HISTÓRICO</TableHead>
                  <TableHead className='text-right'>A PAGAR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaDebitos.length <= 0 ? (
                  <span>Não pagamentos vencidos</span>
                ) : (
                  listaDebitos.map((lc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className='font-medium'>
                        {dayjs(lc.VENCIMENTO).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>{lc.DOC}</TableCell>
                      <TableCell>{lc.HISTORICO}</TableCell>
                      <TableCell className='text-right'>
                        {parseCurrency(lc.RESTA)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value='nao_vencidos'>
            <Table className='w-[40%]'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[150px]'>VENCIMENTO</TableHead>
                  <TableHead>DOC</TableHead>
                  <TableHead>HISTÓRICO</TableHead>
                  <TableHead className='text-right'>A PAGAR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCreditos.length <= 0 ? (
                  <span>Não pagamentos não vencidos</span>
                ) : (
                  listaCreditos.map((lc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className='font-medium'>
                        {dayjs(lc.VENCIMENTO).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>{lc.DOC}</TableCell>
                      <TableCell>{lc.HISTORICO}</TableCell>
                      <TableCell className='text-right'>
                        {parseCurrency(lc.RESTA)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>

      <div className='flex gap-4 w-full px-5 py-0 flex-wrap justify-end'>
        <Link
          href={`/app/customers`}
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

export default Customers;

