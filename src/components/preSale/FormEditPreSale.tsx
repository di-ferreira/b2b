'use client';
import { iOrcamento } from '@/@types/Orcamento';
import {
  iCondicaoPgto,
  iFormaPgto,
  iItemPreVenda,
  iParcelasPgto,
  iPreVenda,
} from '@/@types/PreVenda';
import {
  GetCondicaoPGTO,
  GetFormasPGTO,
  SavePreVenda,
} from '@/app/actions/preVenda';
import { cn } from '@/lib/utils';
import {
  faFileInvoiceDollar,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
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
import { toast } from '../ui/use-toast';
import { tableHeaders } from './columnsParcelas';

interface iFormEditPreSale {
  orc: iOrcamento;
}
type iFrete = 'ENTREGA' | 'RETIRADA';
interface iTipoEntrega {
  id: iFrete;
  value: iFrete;
}

const FormEditPreSale = ({ orc }: iFormEditPreSale) => {
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
    TipoEntrega[0]
  );

  const [IsDelivery, setIsDelivery] = useState<boolean>(false);

  const [preSale, setPreSale] = useState<iPreVenda>({
    CodigoCliente: orc.CLIENTE.CLIENTE,
    CodigoCondicaoPagamento: 0,
    CodigoVendedor1: orc.VENDEDOR.VENDEDOR,
    DataPedido: dayjs().format('YYYY-MM-DD').toString(),
    ModeloNota: '55',
    Itens: [],
    SubTotal: orc.TOTAL,
    Total: orc.TOTAL,
    ObsPedido1: orc.OBS1 ? orc.OBS1 : '',
    ObsPedido2: orc.OBS2 ? orc.OBS2 : '',
    ObsNotaFiscal: '',
    Entrega: 'N',
    NumeroOrdemCompraCliente: '',
    CodigoVendedor2: 0,
    Desconto: 0,
    Origem: '',
    PedidoEcommerce: '',
    TipoEntrega: '',
    ValorFrete: 0,
  });

  function getCondicao() {
    if (orc.TOTAL > 0) {
      GetCondicaoPGTO(orc ? orc.TOTAL : 0, orc.CLIENTE.Tabela).then(
        (condicao) => {
          if (condicao.value === null) {
            toast({
              title: 'Error!',
              description: 'não a condições para o total do orçamento!',
              variant: 'destructive',
            });
          }
          if (condicao.value) {
            setCondicaoPgto(condicao.value);
            setCondicaoPgtoSelected(condicao.value[0]);
            parcelasList(condicao.value[0]);
          }
        }
      );
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

  function GerarPV() {
    const ItensPV: iItemPreVenda[] = [];

    for (const item in orc.ItensOrcamento) {
      ItensPV.push({
        CodigoProduto: orc.ItensOrcamento[item].PRODUTO.PRODUTO,
        Qtd: orc.ItensOrcamento[item].QTD,
        Desconto: orc.ItensOrcamento[item].DESCONTO
          ? orc.ItensOrcamento[item].DESCONTO
          : 0,
        SubTotal: orc.ItensOrcamento[item].SUBTOTAL,
        Tabela: orc.ItensOrcamento[item].TABELA,
        Valor: orc.ItensOrcamento[item].VALOR,
        Total: orc.ItensOrcamento[item].TOTAL,
        Frete: 0,
      });
    }

    const PV: iPreVenda = {
      ...preSale,
      Itens: ItensPV,
      CodigoCondicaoPagamento: CondicaoPgtoSelected.ID,
      Entrega: IsDelivery ? 'S' : 'N',
    };

    SavePreVenda(PV)
      .then((res) => {
        if (res.value) {
          toast({
            title: 'Sucesso!',
            description: 'Pré-venda gerada com sucesso',
            variant: 'success',
          });
        }
        if (res.error) {
          toast({
            title: 'Error!',
            description: res.error.message,
            variant: 'destructive',
          });
        }
      })
      .catch((e) => {
        toast({
          title: 'Error!',
          description: e.message,
          variant: 'destructive',
        });
      })
      .finally(() => {
        router.push('/app/pre-sales');
      });
  }

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
                        (cp) => cp.NOME === e
                      );
                      if (selectedCondicao) {
                        parcelasList(selectedCondicao);
                        setCondicaoPgtoSelected(
                          (old) => (old = selectedCondicao)
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
                        (cp) => cp.CARTAO === e
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
                        (old = { ...preSale, ObsPedido1: e.target.value })
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
                      (old = { ...preSale, ObsNotaFiscal: e.target.value })
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

