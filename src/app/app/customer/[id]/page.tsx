'use client';
import { iCredito } from '@/@types';
import { iCliente, iFinanceiroCliente } from '@/@types/Cliente';
import { iOrcamento } from '@/@types/Orcamento';
import { iVendedor } from '@/@types/Vendedor';
import { GetCliente, GetFinanceiroCliente } from '@/app/actions/cliente';
import {
  MarcarLiberacaoComoUsada,
  SolicitarLiberacao,
  ValidarLiberacao,
} from '@/app/actions/liberacoes';

import ToastNotify from '@/components/ToastNotify';
import { Button } from '@/components/ui/button';
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
import useBudget from '@/store/BudgetStore';
import {
  faArrowLeft,
  faFileLines,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RiMedalFill } from 'react-icons/ri';

interface iCustomerPage {
  params: { id: string };
}

function Customers({ params }: iCustomerPage) {
  const router = useRouter();
  const { error, isLoading, newBudget, current, setCurrent } = useBudget();
  const [Customer, setcustomer] = useState<iCliente>({} as iCliente);
  const [ContasAtrazadas, setContasAtrazadas] = useState(0);
  const [ContasAVencer, setContasAVencer] = useState(0);
  const [ContasAbertas, setContasAbertas] = useState(0);
  const [TotalCreditos, setTotalCreditos] = useState(0);
  const [LimiteCredito, setLimiteCredito] = useState(0);

  const [ListaDebitos, setListaDebitos] = useState<iCredito[]>([]);
  const [ListaDebitosNaoVencidos, setListaDebitosNaoVencidos] = useState<
    iCredito[]
  >([]);

  const [ListaCreditos, setListaCreditos] = useState<iCredito[]>([]);

  const [SaldoCompra, setSaldoCompra] = useState<number>(
    Customer?.LIMITE - ContasAbertas,
  );

  if (!Customer) return <p>Failed to load customer.</p>;

  const NewAddOrcamento: iOrcamento = {
    ORCAMENTO: 0,
    TOTAL: 0.0,
    CLIENTE: {} as iCliente,
    VENDEDOR: {} as iVendedor,
    COM_FRETE: 'N',
    ItensOrcamento: [],
  };

  function parseCurrency(currency: number) {
    return currency.toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    });
  }

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

  async function GerarOrcamento() {
    try {
      const bloqueios: string[] = [];

      if (ContasAtrazadas > 0) bloqueios.push('INADIMPLENCIA');
      if (LimiteCredito <= 0) bloqueios.push('LIMITE');
      if (Customer.BLOQUEADO === 'S') bloqueios.push('BLOQUEADO');

      for (const codigo of bloqueios) {
        const result = await ValidarLiberacao(Customer.CLIENTE, codigo);

        const liberacao = result.value;

        // ❌ Não existe → solicitar e parar
        if (!liberacao) {
          await SolicitarLiberacao({
            ID: 0,
            NOME: 'CLIENTE',
            CODIGO: codigo,
            CHAVE: Customer.CLIENTE,
            DATA_HORA: '',
            QUEM: '',
            USADO: 'N',
            ONDE: 'PRÉ-VENDA',
            ID_ONDE: 9999,
            OBS: '',
            MOVIMENTO: 0,
          });

          ToastNotify({
            message: `Solicitação enviada para ${codigo}.`,
            type: 'warning',
          });

          return;
        }

        // ⏳ Aguardando ERP
        if (liberacao.ID_ONDE === 9999) {
          ToastNotify({
            message: `Aguardando liberação do ERP (${codigo}).`,
            type: 'warning',
          });

          return;
        }

        if (liberacao.USADO === 'N') {
          await MarcarLiberacaoComoUsada(liberacao);
        }
      }

      await newBudget({
        ...NewAddOrcamento,
        CLIENTE: Customer!,
        TABELA: Customer!.Tabela,
      });

      current && router.push(`/app/budgets/${current.ORCAMENTO}`);

      error &&
        ToastNotify({
          message: error,
          type: 'error',
        });
    } catch (err: any) {
      ToastNotify({
        message: err.message,
        type: 'error',
      });
    }
  }
  // Carrega o item quando o componente monta ou o 'item' prop muda
  const loadData = async () => {
    try {
      const id = Number(params.id);
      console.log('load data param', id);
      const customer = await GetCliente(id);
      const resultFinanceiro = await GetFinanceiroCliente(id);
      console.log('load data resultFinanceiro', resultFinanceiro);
      console.log('load data customer', customer);

      if (resultFinanceiro.error !== undefined) {
        throw new Error(resultFinanceiro.error.message);
      }

      const financeiro: iFinanceiroCliente = resultFinanceiro.value!;

      setcustomer((old) => customer.value!);
      setLimiteCredito((old) => financeiro.LimiteCredito);

      setContasAtrazadas((old) => financeiro.ContasAtrazadas);
      setContasAVencer((old) => financeiro.ContasAVencer);
      setContasAbertas((old) => financeiro.ContasAbertas);
      setListaDebitosNaoVencidos((old) => financeiro.ListaDebitosNaoVencidos);
      setListaDebitos((old) => financeiro.ListaDebitos);
      setTotalCreditos((old) => financeiro.TotalCreditos);
      setListaCreditos((old) => financeiro.ListaCreditos);
      setSaldoCompra((old) => financeiro.SaldoCompra);
    } catch (err: any) {
      ToastNotify({ message: err.message, type: 'error' });
    }
  };

  useEffect(() => {
    setCurrent({} as unknown as iOrcamento);
    loadData();
    // Cleanup opcional se necessário
    return () => {
      // Código de limpeza aqui (se aplicável)
    };
  }, []);

  return (
    <section className='flex flex-col gap-4 w-full h-full'>
      <h1
        className={`flex items-center  gap-x-3 text-4xl font-bold mt-5 py-1 px-3 
          border-b-2 text-emsoft_dark-text
       border-emsoft_orange-main`}
      >
        Cliente {Customer.CLIENTE} {verifyTypeCustomer(Customer)}{' '}
        <Button
          className='w-40 p-3 bg-emsoft_orange-main hover:bg-emsoft_orange-light tablet-portrait:h-14 tablet-portrait:text-2xl'
          type='button'
          disabled={isLoading}
          onClick={GerarOrcamento}
          title='Gerar Orçamento'
        >
          Gerar Orçamento
          <FontAwesomeIcon
            icon={isLoading ? faSpinner : faFileLines}
            spinPulse={isLoading}
            className='h-full ml-3'
          />
        </Button>
      </h1>

      <div className='flex gap-4 w-full h-full px-5 py-0 flex-wrap'>
        <Input
          labelText='NOME'
          labelPosition='top'
          value={Customer.NOME}
          className='w-[35%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='EMAIL'
          labelPosition='top'
          value={Customer.EMAIL}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='TELEFONE'
          labelPosition='top'
          value={Customer.TELEFONE}
          className='w-[15%] tablet-portrait:w-[45%]'
        />

        <Input
          labelText='CPF/CNPJ'
          labelPosition='top'
          value={MaskCnpjCpf(Customer.CIC)}
          className='w-[24%] tablet-portrait:w-[45%]'
        />

        <Input
          labelText='ENDEREÇO'
          labelPosition='top'
          value={Customer.ENDERECO}
          className='w-[37.5%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='BAIRRO'
          labelPosition='top'
          value={Customer.BAIRRO}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='CIDADE'
          labelPosition='top'
          value={Customer.CIDADE}
          className='w-[20%] tablet-portrait:w-[25%]'
        />
        <Input
          labelText='CIDADE'
          labelPosition='top'
          value={Customer.UF}
          className='w-[5%] tablet-portrait:w-[10%]'
        />
        <Input
          labelText='CEP'
          labelPosition='top'
          value={Customer.CEP}
          className='w-[10%] tablet-portrait:w-[20%]'
        />

        <Input
          labelText='TIPO DE CLIENTE'
          labelPosition='top'
          value={Customer.TIPO_CLIENTE}
          className='w-[10%] tablet-portrait:w-[20%]'
        />

        <Input
          labelText='TABELA'
          labelPosition='top'
          value={Customer.Tabela}
          className='w-[10%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='USAR LIMITE'
          labelPosition='top'
          value={Customer.USARLIMITE === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[15%]'
        />
        <Input
          labelText='LIMITE CLIENTE'
          labelPosition='top'
          value={
            Customer.LIMITE
              ? Customer.LIMITE.toLocaleString('pt-br', {
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
            Customer.LIMITE_CHEQUE
              ? Customer.LIMITE_CHEQUE.toLocaleString('pt-br', {
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
          value={Customer.SOMENTE_NFE === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[15%]'
        />
        <Input
          labelText='CARTEIRA'
          labelPosition='top'
          value={Customer.CARTEIRA === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[15%]'
        />
        <Input
          labelText='DDA'
          labelPosition='top'
          value={Customer.DDA === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[15%]'
        />

        <Input
          labelText='BLOQUEADO'
          labelPosition='top'
          value={Customer.BLOQUEADO === 'S' ? 'SIM' : 'NÃO'}
          className='w-[25%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='MOTIVO BLOQUEIO'
          labelPosition='top'
          value={Customer.MOTIVO}
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
                  {LimiteCredito.toLocaleString('pt-br', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Contas não vencidas</p>
                <p>{parseCurrency(ContasAVencer)}</p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Contas vencidas</p>
                <p>{parseCurrency(ContasAtrazadas)}</p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Total de Contas a receber</p>
                <p>{parseCurrency(ContasAbertas)}</p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Créditos</p>
                <p>{parseCurrency(TotalCreditos)}</p>
              </article>
              <article className='flex w-[40%] px-3 justify-between border border-b-slate-400'>
                <p>Saldo para comprar</p>
                <p>{parseCurrency(SaldoCompra)}</p>
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
                {ListaCreditos && ListaCreditos.length <= 0 ? (
                  <span>Não há Créditos</span>
                ) : (
                  ListaCreditos.map((lc, idx) => (
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
                {ListaDebitos.length <= 0 ? (
                  <span>Não pagamentos vencidos</span>
                ) : (
                  ListaDebitos.map((lc, idx) => (
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
                {ListaDebitosNaoVencidos.length <= 0 ? (
                  <span>Não pagamentos não vencidos</span>
                ) : (
                  ListaDebitosNaoVencidos.map((lc, idx) => (
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
}

export default Customers;

