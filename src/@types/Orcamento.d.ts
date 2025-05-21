import { iCliente } from './Cliente';
import { iProduto } from './Produto';
import { iVendedor } from './Vendedor';

export interface iItemOrcamentoInserir {
  CodigoProduto: string;
  Qtd: number;
  Valor: number;
  SubTotal: number;
  Frete: number;
  Desconto: number;
  Total: number;
  Tabela: string;
}

export interface iItemRemove {
  pIdOrcamento: number;
  pProduto: string;
}

export interface iItemInserir {
  pIdOrcamento: number;
  pItemOrcamento: iItemOrcamentoInserir;
}
export interface iItensOrcamento {
  QTD: number;
  VALOR: number;
  TOTAL: number;
  SUBTOTAL: number;
  DESCONTO: number;
  TABELA: string;
  OBS?: string;
  MD5?: string;
  ITEM?: number;
  PRECO_LIQUIDO?: string;
  IMP_SEPARACAO?: string;
  GORDURA?: number;
  P_DESC?: number;
  ID_VALE_CASCO?: number;
  // eslint-disable-next-line no-use-before-define
  ORCAMENTO: number;
  PRODUTO: iProduto;
}
export interface iOrcamento {
  ORCAMENTO: number;
  DATA?: string;
  TOTAL: number;
  COM_FRETE?: string;
  FRETE_POR_CONTA?: string;
  TAXA_ENTREGA?: number;
  OBS1?: string;
  OBS2?: string;
  TABELA?: string;
  ECF_ID?: string;
  ECF_COO?: string;
  ECF_CCF?: string;
  CNPJ_DESTINATARIO?: string;
  NOME_DESTINATARIO?: string;
  ENDE_DESTINATARIO?: string;
  NUM_DESTINARARIO?: string;
  CPL_DESTINARARIO?: string;
  BAIRRO_DESTINARARIO?: string;
  CIDADE_DESTINARARIO?: string;
  UF_DESTINARARIO?: string;
  CEP_DESTINARARIO?: string;
  ENTREGA?: string;
  ROTA?: number;
  MD5?: string;
  OS?: number;
  LIDO?: string;
  PV?: string;
  TIPO?: string;
  PEDIDO_TIPO?: string;
  SEPARACAO?: string;
  BLOQUEADO?: string;
  VENDEDOR: iVendedor;
  CLIENTE: iCliente;
  VENDEDOR2?: iVendedor;
  ItensOrcamento: iItensOrcamento[];
}

export interface iOrcamentoInserir {
  CodigoCliente: number;
  CodigoVendedor1: number;
  CodigoVendedor2?: number;
  SubTotal: number;
  ValorFrete?: number;
  Desconto?: number;
  Total: number;
  ObsPedido1?: string;
  ObsPedido2?: string;
  ObsNotaFiscal?: string;
  CodigoCondicaoPagamento?: number;
  PedidoEcommerce?: string;
  ModeloNota?: string;
  NumeroOrdemCompraCliente?: string;
  Entrega?: string;
  TipoEntrega?: string;
  Origem?: string;
  Itens?: iItemInserir[];
}

