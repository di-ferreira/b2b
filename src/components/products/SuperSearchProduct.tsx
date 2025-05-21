'use client';
import { ResponseType } from '@/@types';
import { iFilter } from '@/@types/Filter';
import { iProduto } from '@/@types/Produto';
import { iColumnType, iDataResultTable } from '@/@types/Table';
import { SuperFindProducts } from '@/app/actions/produto';
import useModal from '@/hooks/useModal';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Suspense, useEffect, useState } from 'react';
import { DataTable } from '../CustomDataTable';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface iProps {
  data: iDataResultTable<iProduto>;
  words: string;
  CallBack?: (product: iProduto) => void;
}

const SuperSearchProducts = ({ data, words, CallBack }: iProps) => {
  const { Modal, OnCloseModal, showModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [Products, setProducts] = useState<iDataResultTable<iProduto>>(data);
  const [WordProducts, setWordProducts] = useState<string>(words);

  const tableHeaders: iColumnType<iProduto>[] = [
    {
      key: 'acoes',
      title: 'AÇÕES',
      width: '10%',
      render: (_, item) => (
        <span className='flex w-full items-center justify-center gap-x-5'>
          <FontAwesomeIcon
            icon={faPlus}
            className='cursor-pointer text-emsoft_blue-main hover:text-emsoft_blue-light'
            size='xl'
            title='Adicionar'
            onClick={() => {
              if (CallBack !== undefined) {
                OnCloseModal();
                CallBack(item);
              }
            }}
          />
        </span>
      ),
    },
    {
      key: 'PRODUTO',
      title: 'CÓDIGO',
      width: '10%',
    },
    {
      key: 'REFERENCIA',
      title: 'REFERÊNCIA',
      width: '25%',
    },
    {
      key: 'NOME',
      title: 'NOME',
      width: '20%',
    },
    {
      key: 'APLICACOES',
      title: 'APLICAÇÕES',
      width: '35%',
    },
    {
      key: 'FABRICANTE.NOME',
      title: 'FABRICANTE',
      width: '35%',
    },
    {
      key: 'QTDATUAL',
      title: 'QTD',
      width: '10%',
    },
    {
      key: 'PRECO',
      title: 'VALOR',
      width: '10%',
      render: (_, item) => {
        return item.PRECO.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        });
      },
    },
  ];

  function findProduct(filter: iFilter<iProduto>) {
    let pd: iProduto = {
      PRODUTO: '',
      REFERENCIA: '',
      LOCAL: null,
      NOME: '',
      OUTROLADO: null,
      REFERENCIA2: '',
      QTDATUAL: 0,
      QTDMINIMA: 0,
      CUSTO: 0,
      CUSTOMEDIO: 0,
      PRECO: 0,
      PRECOWEB: null,
      DT_COMPRA: '',
      DT_VENDA: '',
      COMISSAO: 0,
      UNIDADE_TRIB_CONVERSAO: null,
      TRIBUTO: '',
      DESCONTO: 0,
      SERVICO: '',
      APLICACOES: '',
      ATIVO: '',
      INSTRUCOES: null,
      MARGEM_SEGURANCA: 0,
      MARGEM_MAXIMA: null,
      QTD_VENDA: 0,
      CURVA: '',
      USAR_MARGEM_CURVA: '',
      MARGEM_CURVA: 0,
      CURVA_ESTOQUE: '',
      CURVA_FREQUENCIA: null,
      ETIQUETA: '',
      COMPRA: '',
      CST: '',
      ICMS: 0,
      IPI: null,
      ST: null,
      QTD_MAXIMA: 0,
      QTD_SEGURANCA: 0,
      QTD_GARANTIA: 0,
      LOCAL2: null,
      LOCAL3: null,
      Atualizar: '',
      PESO: null,
      FAB_BRUTO: 0,
      FAB_DESC: null,
      FAB_IPI: null,
      FAB_LIQUIDO1: null,
      FAB_ST: null,
      FAB_FRETE: null,
      FAB_LIQUIDO2: null,
      QTD_EMBALAGEM: null,
      DEPARTAMENTO: 0,
      DT_CURVA_EST: null,
      DT_CURVA_FAB: null,
      CURVA_ANTERIOR: null,
      USUARIO: '',
      DATA_HORA: '',
      SIMP: null,
      CFOP_DE: '',
      CFOP_FE: '',
      MULTIPLO_COMPRA: 0,
      TRANCAR: '',
      WEB: '',
      CFOP_DEV_DE: '',
      CFOP_DEV_FE: '',
      COMISSAO_TELEMARKETING: null,
      VOLUME: 0,
      IMPORTADO: null,
      LARGURA: null,
      ALTURA: null,
      COMPRIMENTO: null,
      ID_MONTADORA: null,
      PAGINA_CATALOGO: null,
      ORDEM_CATALOGO: null,
      DT_CADASTRO: null,
      VENDA: '',
      OBS1: null,
      OBS2: null,
      FAB_BRUTO_OFERTA: null,
      FAB_DESC_OFERTA: null,
      FAB_IPI_OFERTA: null,
      FAB_LIQUIDO1_OFERTA: null,
      FAB_ST_OFERTA: null,
      FAB_FRETE_OFERTA: null,
      FAB_LIQUIDO2_OFERTA: null,
      VENDA_COM_OFERTA: null,
      MARGEM_OFERTA: null,
      PRECO_COM_OFERTA: null,
      FAB_OFERTA_VALIDADE: null,
      CNA: null,
      CODIGO_BARRA_CAIXA: null,
      QTD_CAIXA: null,
      QTD_MAX_ARMAZENAGEM: null,
      DATA_ATUALIZACAO: null,
      COMISSAO_HOME_OFFICE: null,
      COMISSAO_PROMOTOR: null,
      COMISSAO_ASSISTENTE: null,
      COMISSAO_MECANICO: null,
      IA: null,
      FCI: null,
      LINHA: null,
      NAO_DEVOLVER: null,
      STATUS: null,
      CTA_SPED_CONTRIB_E: null,
      CTA_SPED_CONTRIB_S: null,
      RESPONSABILIDADE_ICMS: null,
      RETENCAO_PIS_COFINS: null,
      NOVO_PRECO: null,
      NOVO_CUSTO: null,
      DATA_NOVO_PRECO: null,
      DATA_OFERTA_NOVO_PRECO: null,
      ID_NOVO_PRECO: null,
      FABRICANTE: {
        FABRICANTE: 0,
        NOME: '',
        CONTATO: '',
        ENDERECO: '',
        BAIRRO: '',
        CIDADE: '',
        UF: '',
        CEP: '',
        CGC: '',
        INSCRICAO: '',
        TELEFONE: '',
        OBS: '',
        MARGEM_CURVA_A: 0,
        MARGEM_CURVA_B: 0,
        MARGEM_CURVA_C: 0,
        PERC_CURVA_A: 0,
        PERC_CURVA_B: 0,
        PERC_CURVA_C: 0,
        MARGEM_CURVA_D: 0,
        MARGEM_CURVA_E: 0,
        MARGEM_CURVA_F: 0,
        MARGEM_CURVA_G: 0,
        PERC_CURVA_D: 0,
        PERC_CURVA_E: 0,
        PERC_CURVA_F: 0,
        PERC_CURVA_G: 0,
        ATUALIZAR: '',
        LER_CODIGO_BARRAS: '',
        MARGEM: 0,
        IA: 0,
        LINHA: '',
        COTACAO: '',
        FORNECEDOR: 0,
        ENDERECO_NUM: '',
        ENDERECO_CPL: '',
        ENDERECO_COD_MUN: 0,
        ENDERECO_COD_UF: 0,
        EMAIL: '',
        PREFERENCIAL: '',
        LUCRO_REAL: '',
        AJUSTA_CUSTO: '',
        MVA: 0,
        ID_CONTA: 0,
        ID_SUBCONTA: 0,
        APELIDO: '',
        MOVTO_GARANTIA: '',
        EMAIL_PEDIDO: '',
        ID_CONDICAO_PAGAMENTO: 0,
        ID_TRANSPORTADORA: 0,
        DIAS_ENTREGA: 0,
        FORMA_COMPRA: '',
        PERC_CCN: 0,
        PERC_CSN: 0,
        PERC_DESC_CCN: 0,
        PERC_DESC_CSN: 0,
        PERC_FRETE: 0,
        PERC_MARKUP: 0,
        FRETE_LIMITE: 0,
        FRETE_VALOR: 0,
        FRETE_PERC: 0,
        IPI_SN: '',
        GRUPO: 0,
        TIPO_FNC: '',
        DATA_ATUALIZACAO: '',
        NIVEL_ACESSO: 0,
        SISPAG: '',
        VALOR_MIN_COMPRA: 0,
        PENDENCIA: '',
      },
      FORNECEDOR: {
        FABRICANTE: 0,
        NOME: '',
        CONTATO: '',
        ENDERECO: '',
        BAIRRO: '',
        CIDADE: '',
        UF: '',
        CEP: '',
        CGC: '',
        INSCRICAO: '',
        TELEFONE: '',
        OBS: '',
        MARGEM_CURVA_A: 0,
        MARGEM_CURVA_B: 0,
        MARGEM_CURVA_C: 0,
        PERC_CURVA_A: 0,
        PERC_CURVA_B: 0,
        PERC_CURVA_C: 0,
        MARGEM_CURVA_D: 0,
        MARGEM_CURVA_E: 0,
        MARGEM_CURVA_F: 0,
        MARGEM_CURVA_G: 0,
        PERC_CURVA_D: 0,
        PERC_CURVA_E: 0,
        PERC_CURVA_F: 0,
        PERC_CURVA_G: 0,
        ATUALIZAR: '',
        LER_CODIGO_BARRAS: '',
        MARGEM: 0,
        IA: 0,
        LINHA: '',
        COTACAO: '',
        FORNECEDOR: 0,
        ENDERECO_NUM: '',
        ENDERECO_CPL: '',
        ENDERECO_COD_MUN: 0,
        ENDERECO_COD_UF: 0,
        EMAIL: '',
        PREFERENCIAL: '',
        LUCRO_REAL: '',
        AJUSTA_CUSTO: '',
        MVA: 0,
        ID_CONTA: 0,
        ID_SUBCONTA: 0,
        APELIDO: '',
        MOVTO_GARANTIA: '',
        EMAIL_PEDIDO: '',
        ID_CONDICAO_PAGAMENTO: 0,
        ID_TRANSPORTADORA: 0,
        DIAS_ENTREGA: 0,
        FORMA_COMPRA: '',
        PERC_CCN: 0,
        PERC_CSN: 0,
        PERC_DESC_CCN: 0,
        PERC_DESC_CSN: 0,
        PERC_FRETE: 0,
        PERC_MARKUP: 0,
        FRETE_LIMITE: 0,
        FRETE_VALOR: 0,
        FRETE_PERC: 0,
        IPI_SN: '',
        GRUPO: 0,
        TIPO_FNC: '',
        DATA_ATUALIZACAO: '',
        NIVEL_ACESSO: 0,
        SISPAG: '',
        VALOR_MIN_COMPRA: 0,
        PENDENCIA: '',
      },
      ListaSimilares: [],
      iListaVendaCasada: [],
      iListaOfertaProduto: [],
      ListaChaves: [],
    };
    setLoading(true);
    SuperFindProducts({
      top: filter.top,
      skip: filter.skip,
      orderBy: 'PRODUTO',
      filter: [{ key: 'PRODUTO', value: WordProducts }],
    })
      .then(async (products: ResponseType<iDataResultTable<iProduto>>) => {
        if (products.value !== undefined) {
          pd = products.value.value[0];
          setProducts((old) => (old = products.value!));
        }

        if (products.error !== undefined)
          console.error('Error find Products', products.error);
      })
      .catch((e) => {
        console.error('Error find Products', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const OnSearchProduto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      findProduct({ top: 10, skip: 0 });
    }
  };

  useEffect(() => {
    setProducts(data);
    if (data.value.length > 0) {
      showModal();
    }
  }, [data]);
  return (
    <>
      {Modal && (
        <Modal
          Title={'BUSCAR PRODUTO'}
          containerStyle='laptop:w-[75%] laptop:h-[80%]'
        >
          <div className='flex flex-col gap-4 w-full h-[95%] p-2'>
            <div className='flex gap-x-2 w-full items-center'>
              <Input
                value={WordProducts}
                onChange={(e) => setWordProducts(e.target.value)}
                onKeyDown={OnSearchProduto}
              />
              <Button
                className={`flex w-fit h-[35px] p-3 gap-3`}
                title='Buscar Produto'
                onClick={() => findProduct({ top: 10, skip: 0 })}
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  size='xl'
                  title='SALVAR'
                  className='text-white'
                />
                Buscar
              </Button>
            </div>
            <div className='flex w-full h-full flex-col overflow-x-hidden overflow-y-auto'>
              {loading ? (
                <span>Carregando...</span>
              ) : (
                <Suspense fallback={<span>Carregando...</span>}>
                  <DataTable
                    columns={tableHeaders}
                    TableData={Products.value}
                    IsLoading={loading}
                    QuantityRegiters={Products.Qtd_Registros}
                    onFetchPagination={findProduct}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SuperSearchProducts;

