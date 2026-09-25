'use client';
import { iCliente, iFinanceiroCliente } from '@/@types/Cliente';
import { iOrcamento } from '@/@types/Orcamento';
import {
  iCondicaoPgto,
  iFormaPgto,
  iItemPreVenda,
  iParcelasPgto,
  iPreVenda,
} from '@/@types/PreVenda';
import { iVendedor } from '@/@types/Vendedor';
import { GetFinanceiroCliente } from '@/app/actions/cliente';
import { Liberacoes } from '@/app/actions/liberacoes';
import { UpdateOrcamento } from '@/app/actions/orcamento';
import {
  GetCondicaoPGTO,
  GetFormasPGTO,
  SavePreVenda,
} from '@/app/actions/preVenda';
import { getVendedorAction } from '@/app/actions/vendedor';
import { getBloqueios } from '@/lib/bloqueios';
import { cn, FormatToCurrency, getErrorMessage } from '@/lib/utils';
import useBudget from '@/store/BudgetStore';
import {
  faFileInvoiceDollar,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Flip, toast } from 'react-toastify';
import { DataTable } from '../CustomDataTable';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '../ui/select';
import { tableHeaders } from './columnsParcelas';

type iFrete = 'ENTREGA' | 'RETIRADA';
interface iTipoEntrega {
  id: iFrete;
  value: iFrete;
}

const FormEditPreSale = () => {
  const { current } = useBudget();
  const router = useRouter();
  const [CondicaoPgto, setCondicaoPgto] = useState<iCondicaoPgto[]>([]);
  const [CondicaoPgtoSelected, setCondicaoPgtoSelected] =
    useState<iCondicaoPgto>({
      ID: 0,
      NOME: '',
      PARCELAS: 0,
      VALOR_PARCELA: 0,
      VALOR_MINIMO: 0,
      PM: 0,
      PZ01: 0,
      PZ02: 0,
      PZ03: 0,
      PZ04: 0,
      PZ05: 0,
      PZ06: 0,
      PZ07: 0,
      PZ08: 0,
      PZ09: 0,
      PZ10: 0,
      TIPO: '',
      DESTACAR_DESCONTO: '',
      FORMA: '',
    });
  const [FormaPgto, setFormaPgto] = useState<iFormaPgto[]>([]);
  const [FormaPgtoSelected, setFormaPgtoSelected] = useState<iFormaPgto>();
  const [ParcelasPgto, setParcelasPgto] = useState<iParcelasPgto[]>([]);
  const [TipoEntrega, _] = useState<iTipoEntrega[]>([
    {
      id: 'ENTREGA',
      value: 'ENTREGA',
    },
    {
      id: 'RETIRADA',
      value: 'RETIRADA',
    },
  ]);
  const [TipoEntregaSelected, setTipoEntregaSelected] = useState<iTipoEntrega>(
    TipoEntrega[0],
  );

  const [IsDelivery, setIsDelivery] = useState<boolean>(false);

  const [preSale, setPreSale] = useState<iPreVenda>({
    CodigoCliente: (current.CLIENTE as iCliente).CLIENTE,
    CodigoCondicaoPagamento: 0,
    CodigoVendedor1: (current.VENDEDOR as iVendedor).VENDEDOR,
    DataPedido: dayjs().format('YYYY-MM-DD').toString(),
    ModeloNota: '55',
    Itens: [],
    SubTotal: current.TOTAL,
    Total: current.TOTAL,
    ObsPedido1: current.OBS1 ? current.OBS1 : '',
    ObsPedido2: current.OBS2 ? current.OBS2 : '',
    ObsNotaFiscal: '',
    Entrega: 'N',
    NumeroOrdemCompraCliente: '',
    CodigoVendedor2: 0,
    Desconto: 0,
    Origem: '',
    PedidoEcommerce: '',
    TipoEntrega: undefined,
    ValorFrete: 0,
  });

  function getCondicao() {
    if (current.TOTAL > 0) {
      const cliente = current.CLIENTE as iCliente;
      const tabela = cliente?.Tabela || 'SISTEMA';
      const somenteAvista = cliente?.CARTEIRA === 'N';
      GetCondicaoPGTO(
        current.TOTAL,
        tabela,
        somenteAvista,
      ).then((condicao) => {
        if (condicao.value === null) {
          toast('não há condições para o total do orçamento!', {
            position: 'bottom-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'colored',
            type: 'error',
            transition: Flip,
          });
        }
        if (condicao.value && condicao.value.length > 0) {
          setCondicaoPgto(condicao.value);
          setCondicaoPgtoSelected(condicao.value[0]);
          parcelasList(condicao.value[0]);
        } else if (!condicao.error) {
          toast('Nenhuma condição de pagamento disponível para este total.', {
            position: 'bottom-right',
            autoClose: 5000,
            theme: 'colored',
            type: 'warning',
            transition: Flip,
          });
        }
      });
    }
  }

  function getFormasPgto() {
    GetFormasPGTO().then((formas) => {
      if (formas.value) {
        setFormaPgto(formas.value);
        setFormaPgtoSelected(formas.value[0]);
      }
    });
  }

  function parcelasList(condicao: iCondicaoPgto) {
    const parcelas: iParcelasPgto[] = [];
    const DataVencimento = dayjs();
    type KeyCondicao = keyof typeof condicao;

    for (let i = 0; i < condicao.PARCELAS; i++) {
      const ParcelaNameKey: KeyCondicao = ('PZ0' +
        String(i + 1)) as KeyCondicao;
      const DiaParcela: number = Number(condicao[ParcelaNameKey]);

      parcelas.push({
        DIAS: DiaParcela,
        VALOR: preSale.Total / condicao.PARCELAS,
        VENCIMENTO: DataVencimento.add(DiaParcela, 'day').format('DD/MM/YYYY'),
      });
    }

    setParcelasPgto((old) => (old = parcelas));
  }

  function hasProdutoZerado(orc: iOrcamento): boolean {
    return orc.ItensOrcamento.some((item) => {
      const estoqueDisponivel =
        item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA;
      return estoqueDisponivel <= 0;
    });
  }

  async function hasBloqueioCliente(orc: iOrcamento): Promise<boolean> {
    try {
      const resultFinanceiro = await GetFinanceiroCliente(
        (orc.CLIENTE as iCliente).CLIENTE,
      );
      if (resultFinanceiro.error !== undefined) {
        throw new Error(resultFinanceiro.error.message);
      }

      const financeiro: iFinanceiroCliente = resultFinanceiro.value!;
      const nomeVendedor: string = (await getVendedorAction()).value!.NOME;

      const bloqueios = getBloqueios({
        contasAtrazadas: financeiro.ContasAtrazadas,
        usaLimite: financeiro.UsaLimite,
        saldoCompra: financeiro.SaldoCompra,
        totalPedido: orc.TOTAL,
        bloqueado: (orc.CLIENTE as iCliente).BLOQUEADO,
      });

      for (const codigo of bloqueios) {
        let message = '';

        if (codigo === 'LIMITE') {
          message = `Cliente ${(orc.CLIENTE as iCliente).NOME} possui saldo disponível de ${FormatToCurrency(financeiro.SaldoCompra.toString())} para um pedido de ${FormatToCurrency(orc.TOTAL.toString())}.`;
        }
        if (codigo === 'INADIMPLENCIA') {
          message = `Cliente ${(orc.CLIENTE as iCliente).NOME} possui inadimplência de ${FormatToCurrency(financeiro.ContasAtrazadas.toString())} não liberada.`;
        }
        if (codigo === 'BLOQUEADO') {
          message = `Cliente ${(orc.CLIENTE as iCliente).NOME} está bloqueado.`;
        }

        const liberacao = await Liberacoes({
          ID: 0,
          NOME: 'CLIENTE',
          CODIGO: codigo,
          CHAVE: (orc.CLIENTE as iCliente).CLIENTE,
          DATA_HORA: '',
          QUEM: `Ven:${nomeVendedor}`,
          USADO: 'N',
          ONDE: 'PRÉ-VENDA',
          ID_ONDE: 9999,
          OBS: message,
          MOVIMENTO: 0,
        });

        if (
          !liberacao.value ||
          liberacao.value.USADO !== 'S' ||
          liberacao.value.ID_ONDE === 9999
        ) {
          toast(`Cliente ${(orc.CLIENTE as iCliente).NOME} possui bloqueio de ${codigo} não liberado.`, {
            position: 'bottom-right',
            autoClose: 5000,
            theme: 'colored',
            type: 'error',
            transition: Flip,
          });
          return true;
        }
      }

      return false;
    } catch (e) {
      toast(`Erro ao verificar bloqueios do cliente: ${getErrorMessage(e)}`, {
        position: 'bottom-right',
        autoClose: 5000,
        theme: 'colored',
        type: 'error',
        transition: Flip,
      });
      return true;
    }
  }

  const GerarPV = async () => {
    try {
      if (hasProdutoZerado(current)) {
        toast('Existe produto com estoque zerado na lista!', {
          position: 'bottom-right',
          autoClose: 5000,
          theme: 'colored',
          type: 'error',
          transition: Flip,
        });
        return;
      }

      const bloqueio = await hasBloqueioCliente(current);
      if (bloqueio) return;

      const ItensPV: iItemPreVenda[] = [];
      for (const item of current.ItensOrcamento) {
        if (item.QTD <= 0)
          throw new Error(`O Item ${item.PRODUTO.PRODUTO} está zerado!`);
        ItensPV.push({
          CodigoProduto: item.PRODUTO.PRODUTO,
          Qtd: item.QTD,
          Desconto: item.DESCONTO || 0,
          SubTotal: item.SUBTOTAL,
          Tabela: item.TABELA,
          Valor: item.VALOR,
          Total: item.TOTAL,
          Frete: 0,
        });
      }

      const PV: iPreVenda = {
        ...preSale,
        Itens: ItensPV,
        CodigoCondicaoPagamento: CondicaoPgtoSelected.ID,
        Entrega: IsDelivery ? 'S' : 'N',
        TipoEntrega: IsDelivery ? 'CARRO' : 'VEM BUSCAR',
      };

      const res = await SavePreVenda(PV);
      if (res.error) throw res.error;

      const resOrc = await UpdateOrcamento({
        ...current,
        PV: 'S',
      });
      if (resOrc.error) throw resOrc.error;

      if (res.value) {
        toast('Pré-venda gerada com sucesso', {
          position: 'bottom-right',
          autoClose: 5000,
          theme: 'colored',
          type: 'success',
          transition: Flip,
        });
        router.push('/app/pre-sales');
      }
    } catch (e) {
      toast(`Erro ao gerar pré-venda: ${getErrorMessage(e)}`, {
        position: 'bottom-right',
        autoClose: 5000,
        theme: 'colored',
        type: 'error',
        transition: Flip,
      });
    }
  };

  useEffect(() => {
    getCondicao();
    getFormasPgto();
  }, []);

  return (
    <section className='flex flex-col w-full gap-4 pb-4 max-h-screen overflow-y-auto'>
      <h1
        className={`text-4xl font-bold mt-5 py-1 px-3 
          border-b-2 text-emsoft_dark-text
       border-emsoft_orange-main`}
      >
        Nova Pré-Venda
      </h1>
      <div className='flex flex-col w-full'>
        <div className='w-[85%] flex gap-x-3 tablet:w-full tablet:px-3'>
          <div className='flex flex-col w-[70%] px-4 tablet:w-[50%]'>
            <h4>CONDIÇÃO DE PAGAMENTO</h4>
            <div className='flex w-full mt-5 flex-wrap gap-x-3'>
              <div className='flex w-full gap-x-3 items-end tablet:flex-wrap'>
                <div className='w-[17.5%] tablet:w-[20%]'>
                  <Input
                    name='ID_CONDICAO'
                    value={CondicaoPgtoSelected!.ID}
                    labelPosition='top'
                    className='w-full'
                    disabled
                  />
                </div>
                <div className='w-[40%] tablet:w-[76%]'>
                  <Select
                    defaultValue={CondicaoPgtoSelected.NOME}
                    value={String(CondicaoPgtoSelected.ID)}
                    onValueChange={(e: any) => {
                      const selectedCondicao = CondicaoPgto.find(
                        (cp) => cp.NOME === e,
                      );
                      if (selectedCondicao) {
                        parcelasList(selectedCondicao);
                        setCondicaoPgtoSelected(
                          (old) => (old = selectedCondicao),
                        );
                      }
                    }}
                  >
                    <SelectTrigger className='w-full mb-2 text-emsoft_dark-text'>
                      {CondicaoPgtoSelected.NOME}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CondicaoPgto.map((tb) => (
                          <SelectItem
                            key={tb.ID}
                            value={String(tb.NOME)}
                            className='text-emsoft_dark-text'
                          >
                            {tb.NOME}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className='w-[40%] tablet:w-[100%]'>
                  <Label>Forma de pagamento:</Label>
                  <Select
                    defaultValue={FormaPgtoSelected?.CARTAO}
                    value={String(FormaPgtoSelected?.CARTAO)}
                    onValueChange={(e: any) => {
                      const selectedForma = FormaPgto.find(
                        (cp) => cp.CARTAO === e,
                      );
                      if (selectedForma) {
                        setFormaPgtoSelected((old) => (old = selectedForma));
                      }
                    }}
                  >
                    <SelectTrigger className='w-full mb-2 text-emsoft_dark-text'>
                      {FormaPgtoSelected?.CARTAO}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {FormaPgto.map((frmPgto) => (
                          <SelectItem
                            key={frmPgto.CARTAO}
                            value={String(frmPgto.CARTAO)}
                            className='text-emsoft_dark-text'
                          >
                            {frmPgto.CARTAO}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='w-full pr-3 tablet:pr-0'>
                <Input
                  onChange={(e) =>
                    setPreSale(
                      (old) =>
                        (old = { ...preSale, ObsPedido1: e.target.value }),
                    )
                  }
                  labelText='OBS PEDIDO'
                  labelPosition='top'
                  name='OBS_PEDIDO'
                  value={preSale.ObsPedido1}
                  height='3.5rem'
                />
              </div>
            </div>
            <div className={cn('flex ', 'w-full mt-5 flex-wrap')}>
              <div className='w-full'>
                <h4>FRETE</h4>
              </div>
              <div className='w-full flex flex-col items-start gap-x-3'>
                <div className='w-[40%] tablet:w-full'>
                  <Select
                    defaultValue={TipoEntregaSelected.value}
                    value={String(TipoEntregaSelected.value)}
                    onValueChange={(e: any) => {
                      const entrega = TipoEntrega.find((cp) => cp.value === e);
                      if (entrega) {
                        setTipoEntregaSelected(entrega);
                        setIsDelivery(false);
                        setPreSale({
                          ...preSale,
                          Entrega: 'N',
                        });
                      }

                      if (entrega?.value === 'ENTREGA') {
                        setIsDelivery(true);
                        setPreSale({
                          ...preSale,
                          Entrega: 'S',
                        });
                      }
                    }}
                  >
                    <SelectTrigger className='w-full mb-2 text-emsoft_dark-text'>
                      {TipoEntregaSelected.value}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TipoEntrega.map((tranp, idx) => (
                          <SelectItem
                            key={idx}
                            value={String(tranp.value)}
                            className='text-emsoft_dark-text'
                          >
                            {tranp.value}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className='flex w-full mt-5 my-4'>
              <Input
                onChange={(e) =>
                  setPreSale(
                    (old) =>
                      (old = { ...preSale, ObsNotaFiscal: e.target.value }),
                  )
                }
                labelText='OBS NOTA FISCAL'
                labelPosition='top'
                name='OBS_NF'
                value={preSale.ObsNotaFiscal}
                height='3.5rem'
              />
            </div>
          </div>
          <div className='flex flex-col w-[30%] tablet:w-[45%]'>
            <Suspense fallback={<span>Carregando parcelas...</span>}>
              <DataTable
                columns={tableHeaders}
                TableData={ParcelasPgto}
                IsLoading={false}
              />
            </Suspense>
          </div>
        </div>
        <div className='w-[85%] flex mt-5 px-4 flex-wrap gap-3 items-end tablet:w-full'>
          <div className='w-[32.5%] tablet:w-[50%]'>
            <Input
              readOnly={true}
              labelText='SUBTOTAL'
              labelPosition='top'
              name='SUBTOTAL'
              value={preSale.SubTotal.toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
              height='3.5rem'
            />
          </div>
          <div className='w-[32.99%] tablet:w-[47%]'>
            <Input
              readOnly={true}
              labelText='TOTAL'
              labelPosition='top'
              name='TOTAL'
              value={preSale.Total.toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
              height='3.5rem'
            />
          </div>
        </div>
      </div>
      <footer className='flex w-[85%] px-5 gap-x-3 justify-end'>
        <Button title={'Gerar Pré-venda'} onClick={GerarPV}>
          <FontAwesomeIcon
            icon={faFileInvoiceDollar}
            className={'text-emsoft_light-main mr-2'}
            size='xl'
          />
          Gerar Pré-venda
        </Button>
        <Button className='bg-red-700 hover:bg-red-500' title={'Voltar'}>
          <Link href={`/app/cart`}>
            <FontAwesomeIcon
              icon={faTimes}
              className={'text-emsoft_light-main mr-2'}
              size='xl'
            />
            Voltar
          </Link>
        </Button>
      </footer>
    </section>
  );
};

export default FormEditPreSale;

