/* eslint-disable import/export */
/* eslint-disable no-redeclare */
export interface iUnidade {
  ID: string;
  Descricao: string;
}

export interface iUnidadeTrib {
  ID: string;
  Descricao: string;
}

export interface iEstoqueLoja {
  PRODUTO: string;
  LOJA: string;
  ATUALIZACAO: string;
  CURVA_EST: string;
  CURVA_FAB: string;
  ESTOQUE: number;
  MINIMO: number;
  MAXIMO: number;
  PRECO: number;
  LOCAL1: string;
  LOCAL2: string;
  LOCAL3: string;
  PEDIDO: string;
}

export interface iNcm {
  NCM: string;
  DESCRICAO: string;
  RETENCAO: string;
  MVA1: number;
  MVA2: number;
  MVA3: number;
  NATUREZA: number;
  ALIQ_APROX: number;
  ALIQ_APROX_I: number;
  DESONERACAO_FOLHA: string;
  ID: number;
  ALIQ_EST: number;
  ALIQ_MUN: number;
  CEST: string;
  USAR_ALIQ_IMPORTACAO: string;
  RESPONSABILIDADE_ICMS: string;
  RED_BC_ICMS: number;
  OBS_NF: string;
  IMP_II: number;
  IMP_IPI: number;
  IMP_CST_PIS_COFINS: string;
  IMP_ALIQ_PIS: number;
  IMP_ALIQ_COFINS: number;
}

export interface iFabricante {
  FABRICANTE: number;
  NOME: string;
  CONTATO: string;
  ENDERECO: string;
  BAIRRO: string;
  CIDADE: string;
  UF: string;
  CEP: string;
  CGC: string;
  INSCRICAO: string;
  TELEFONE: string;
  OBS: string;
  MARGEM_CURVA_A: number;
  MARGEM_CURVA_B: number;
  MARGEM_CURVA_C: number;
  PERC_CURVA_A: number;
  PERC_CURVA_B: number;
  PERC_CURVA_C: number;
  MARGEM_CURVA_D: number;
  MARGEM_CURVA_E: number;
  MARGEM_CURVA_F: number;
  MARGEM_CURVA_G: number;
  PERC_CURVA_D: number;
  PERC_CURVA_E: number;
  PERC_CURVA_F: number;
  PERC_CURVA_G: number;
  ATUALIZAR: string;
  LER_CODIGO_BARRAS: string;
  MARGEM: number;
  IA: number;
  LINHA: string;
  COTACAO: string;
}

export interface iFabricante {
  FORNECEDOR: number;
  NOME: string;
  CONTATO: string;
  ENDERECO: string;
  BAIRRO: string;
  CIDADE: string;
  UF: string;
  CEP: string;
  CGC: string;
  INSCRICAO: string;
  TELEFONE: string;
  OBS: string;
  ENDERECO_NUM: string;
  ENDERECO_CPL: string;
  ENDERECO_COD_MUN: number;
  ENDERECO_COD_UF: number;
  ATUALIZAR: string;
  EMAIL: string;
  PREFERENCIAL: string;
  LUCRO_REAL: string;
  AJUSTA_CUSTO: string;
  MVA: number;
  ID_CONTA: number;
  ID_SUBCONTA: number;
  APELIDO: string;
  MOVTO_GARANTIA: string;
  EMAIL_PEDIDO: string;
  ID_CONDICAO_PAGAMENTO: number;
  ID_TRANSPORTADORA: number;
  DIAS_ENTREGA: number;
  FORMA_COMPRA: string;
  PERC_CCN: number;
  PERC_CSN: number;
  PERC_DESC_CCN: number;
  PERC_DESC_CSN: number;
  PERC_FRETE: number;
  PERC_MARKUP: number;
  FRETE_LIMITE: number;
  FRETE_VALOR: number;
  FRETE_PERC: number;
  IPI_SN: string;
  GRUPO: number;
  TIPO_FNC: string;
  DATA_ATUALIZACAO: string;
  NIVEL_ACESSO: number;
  SISPAG: string;
  VALOR_MIN_COMPRA: number;
  PENDENCIA: string;
}

export interface iIdFamilia {
  ID: number;
  NOME: string;
}
export interface iGrupo {
  GRUPO: number;
  NOME: string;
  ESTOQUE: string;
  PALAVRAS_CHAVES: string;
  INVENTARIO: string;
  DATA_ATUALIZACAO: string;
  ID_FAMILIA: iIdFamilia;
}

export interface iTipoItem {
  ID: string;
  Descricao: string;
}

export interface iListaSimilare {
  EQUIVALENTE: string;
  DATA_ATUALIZACAO: string;
  PRODUTO: iProduto;
  EXTERNO: iProduto;
}

export interface iListaVendaCasada {
  Qtd: number;
  PodeExcluir: string;
  DATA_ATUALIZACAO: string;
  PRODUTO: string;
  ITEM: string;
}

export interface iListaOfertaProduto {
  VALOR: number;
  USUARIO: string;
  VALIDADE: string;
  ACIMA_DE: number;
  USAR_QTD_OFERTA: string;
  QTD_OFERTA: number;
  OBS: string;
  DESCONTO: string;
  DATA_ATUALIZACAO: string;
  PRODUTO: string;
}

export interface iFabricanteChave {
  FABRICANTE: number;
  NOME: string;
  CONTATO: string;
  ENDERECO: string;
  BAIRRO: string;
  CIDADE: string;
  UF: string;
  CEP: string;
  CGC: string;
  INSCRICAO: string;
  TELEFONE: string;
  OBS: string;
  MARGEM_CURVA_A: number;
  MARGEM_CURVA_B: number;
  MARGEM_CURVA_C: number;
  PERC_CURVA_A: number;
  PERC_CURVA_B: number;
  PERC_CURVA_C: number;
  MARGEM_CURVA_D: number;
  MARGEM_CURVA_E: number;
  MARGEM_CURVA_F: number;
  MARGEM_CURVA_G: number;
  PERC_CURVA_D: number;
  PERC_CURVA_E: number;
  PERC_CURVA_F: number;
  PERC_CURVA_G: number;
  ATUALIZAR: string;
  LER_CODIGO_BARRAS: string;
  MARGEM: number;
  IA: number;
  LINHA: string;
  COTACAO: string;
}
export interface iListaChave {
  Chave: string;
  CNA: string;
  DATA_ATUALIZACAO: string;
  PRODUTO: string;
  FABRICANTE: iFabricanteChave;
}

export interface iTabelaVenda {
  TABELA: string;
  PRECO: number;
  BLOQUEADO: string;
}

export interface iProduto {
  PRODUTO: string;
  REFERENCIA: string;
  CODIGOBARRA?: string;
  LOCAL: string | null;
  NOME: string;
  OUTROLADO: string | null;
  REFERENCIA2: string;
  QTDATUAL: number;
  QTDMINIMA: number;
  CUSTO: number;
  CUSTOMEDIO: number;
  PRECO: number;
  PRECOWEB: number | null;
  DT_COMPRA: string;
  DT_VENDA: string;
  COMISSAO: number;
  UNIDADE_TRIB_CONVERSAO: number | null;
  TRIBUTO: string;
  DESCONTO: number;
  SERVICO: string;
  APLICACOES: string;
  ATIVO: string;
  INSTRUCOES: string | null;
  MARGEM_SEGURANCA: number;
  MARGEM_MAXIMA: number | null;
  QTD_VENDA: number;
  CURVA: string;
  USAR_MARGEM_CURVA: string;
  MARGEM_CURVA: number;
  CURVA_ESTOQUE: string;
  CURVA_FREQUENCIA: string | null;
  ETIQUETA: string;
  COMPRA: string;
  CST: string;
  ICMS: number;
  IPI: number | null;
  ST: number | null;
  QTD_MAXIMA: number;
  QTD_SEGURANCA: number;
  QTD_GARANTIA: number;
  LOCAL2: string | null;
  LOCAL3: string | null;
  Atualizar: string;
  PESO: number | null;
  FAB_BRUTO: number;
  FAB_DESC: number | null;
  FAB_IPI: number | null;
  FAB_LIQUIDO1: number | null;
  FAB_ST: number | null;
  FAB_FRETE: number | null;
  FAB_LIQUIDO2: number | null;
  QTD_EMBALAGEM: number | null;
  DEPARTAMENTO: number;
  DT_CURVA_EST: string | null;
  DT_CURVA_FAB: string | null;
  CURVA_ANTERIOR: string | null;
  USUARIO: string;
  DATA_HORA: string;
  SIMP: string | null;
  CFOP_DE: string;
  CFOP_FE: string;
  MULTIPLO_COMPRA: number;
  TRANCAR: string;
  WEB: string;
  CFOP_DEV_DE: string;
  CFOP_DEV_FE: string;
  COMISSAO_TELEMARKETING: number | null;
  VOLUME: number;
  IMPORTADO: string | null;
  LARGURA: string | null;
  ALTURA: string | null;
  COMPRIMENTO: string | null;
  ID_MONTADORA: string | null;
  PAGINA_CATALOGO: number | null;
  ORDEM_CATALOGO: number | null;
  DT_CADASTRO: string | null;
  VENDA: string;
  OBS1: string | null;
  OBS2: string | null;
  FAB_BRUTO_OFERTA: number | null;
  FAB_DESC_OFERTA: number | null;
  FAB_IPI_OFERTA: number | null;
  FAB_LIQUIDO1_OFERTA: number | null;
  FAB_ST_OFERTA: number | null;
  FAB_FRETE_OFERTA: number | null;
  FAB_LIQUIDO2_OFERTA: number | null;
  VENDA_COM_OFERTA: string | null;
  MARGEM_OFERTA: number | null;
  PRECO_COM_OFERTA: number | null;
  FAB_OFERTA_VALIDADE: string | null;
  CNA: string | null;
  CODIGO_BARRA_CAIXA: string | null;
  QTD_CAIXA: number | null;
  QTD_MAX_ARMAZENAGEM: number | null;
  DATA_ATUALIZACAO: string | null;
  COMISSAO_HOME_OFFICE: number | null;
  COMISSAO_PROMOTOR: number | null;
  COMISSAO_ASSISTENTE: number | null;
  COMISSAO_MECANICO: number | null;
  IA: number | null;
  FCI: string | null;
  LINHA: string | null;
  NAO_DEVOLVER: string | null;
  STATUS: string | null;
  CTA_SPED_CONTRIB_E: string | null;
  CTA_SPED_CONTRIB_S: string | null;
  RESPONSABILIDADE_ICMS: string | null;
  RETENCAO_PIS_COFINS: string | null;
  NOVO_PRECO: number | null;
  NOVO_CUSTO: number | null;
  DATA_NOVO_PRECO: string | null;
  DATA_OFERTA_NOVO_PRECO: string | null;
  ID_NOVO_PRECO: number | null;
  UNIDADE?: iUnidade;
  UNIDADE_TRIB?: iUnidadeTrib;
  NCM?: iNcm;
  FABRICANTE: iFabricante;
  FORNECEDOR: iFabricante;
  GRUPO?: iGrupo;
  TIPO_ITEM?: iTipoItem;
  ListaSimilares: iListaSimilare[];
  iListaVendaCasada: iListaVendaCasada[];
  iListaOfertaProduto: iListaOfertaProduto[];
  ListaChaves: iListaChave[];
}

export interface iProdutoWithTables {
  produto: iProduto;
  tables: iTabelaVenda[];
  estoque_lojas: iEstoqueLoja[];
}

export interface iProductPromotion {
  PRODUTO: stringify;
  REFERENCIA: stringify;
  NOME: stringify;
  PRECO: number;
  QTDATUAL: number;
  OFERTA: number;
  VALIDADE: string;
}
export interface iSaleHistory {
  DATA: string;
  DOC: string;
  VENDEDOR: number;
  QTD: number;
  VALOR: number;
  TOTAL: number;
}

