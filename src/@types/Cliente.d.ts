import { iProduto } from './Produto';
import { iVendedor } from './Vendedor';

export interface iLocaisList {
  ID: number;
  CIDADE: string;
  BAIRRO: string;
  REGIAO: string;
}
export interface iRegiao {
  ID: number;
  DESCRICAO: string;
  CARENCIA: number;
  COMISSAO: number;
  Locais_List: iLocaisList[];
}

export interface iTelefone {
  ID: number;
  CONTATO: string;
  TIPO: string;
  TELEFONE: string;
  ANIVERSARIO: string;
  EMAIL: string;
  ID_CLIENTE: string;
}

export interface iFollowUpList {
  ID: number;
  DATA: string;
  DESCRICAO: string;
  USUARIO: string;
  CLIENTE: string;
}

export interface iAgendamentosList {
  ID: number;
  DATA: string;
  GEO_LAT: string;
  GEO_LNG: string;
  OK: string;
  DATA_FIM: string;
  HORA_INICIO: string;
  HORA_FIM: string;
  RECORRENTE: string;
  PERIODICIDADE: string;
  REAGENDADO: string;
  CLIENTE: string;
  VENDEDOR: iVendedor;
}

export interface iPendenciasList {
  PEDIDO: number;
  DATA: string;
  QTD: number;
  ENTREGUE: number;
  PENDENTE: number;
  VALOR_UNIT: number;
  GORDURA: number;
  Tabela: string;
  VEND1: number;
  VEND2: number;
  ID_CONDICAO: number;
  OBS1: string;
  OBS2: string;
  LIBERADO: string;
  ID_PEDIDO_ECOMMERCE: string;
  PRODUTO: iProduto;
  CLIENTE: string;
}

type tTipoCliente = 'FIEL' | 'OURO' | 'PRATA' | 'BRONZE';

export interface iCliente {
  CLIENTE: number;
  NOME: string;
  ENDERECO: string;
  BAIRRO: string;
  CIDADE: string;
  UF: string;
  CEP: string;
  CIC: string;
  DT_CADASTRO: string;
  DT_NASCIMENTO: string;
  DT_ULT_COMPRA: string;
  INSC_IDENT: string;
  TELEFONE: string;
  FAX: string;
  EMAIL: string;
  BLOQUEADO: string;
  MOTIVO: string;
  P1_DE: number;
  P1_ATE: number;
  P1_VENCIMENTO: number;
  P2_DE: number;
  P2_ATE: number;
  P2_VENCIMENTO: number;
  USARLIMITE: string;
  LIMITE: number;
  DESCONTO: string;
  OBS: string;
  VALOR_DESCONTO: number;
  ECF: string;
  BOLETO: string;
  CARTEIRA: string;
  ROTA: number;
  TAXA_ENTREGA: number;
  CLASSIFICACAO: number;
  FRETE_POR_CONTA: string;
  FRETE_TIPO: string;
  ACRESCIMO_NOTA: number;
  VENDEDOR: number;
  OS: string;
  TIPO_FAT: string;
  MESSAGEM_FINANCEIRO: string;
  ENDERECO_NUM: string;
  ENDERECO_CPL: string;
  ENDERECO_COD_MUN: number;
  ENDERECO_COD_UF: number;
  Tabela: string;
  ATUALIZAR: string;
  CONDICAO_PAGAMENTO: string;
  APELIDO: string;
  EMAIL_FINANCEIRO: string;
  DESCONTO_AVISTA: number;
  TRANSPORTADORA: number;
  ID_CONDICAO: number;
  FROTA: string;
  IDENTIDADE: string;
  MENSAGEM_FINANCEIRO: string;
  GRUPO: number;
  END_ENTREGA: string;
  INSCRICAO_M: string;
  LIMITE_CHEQUE: number;
  META: number;
  SOMENTE_NFE: string;
  VENDEDOR_INTERNO: number;
  DATA_ATUALIZACAO: string;
  GEO_LAT: string;
  GEO_LNG: string;
  DDA: string;
  V100: string;
  TIPO_CLIENTE: tTipoCliente;
  AtualizarRegiao: string;
  SENHA: string;
  EMAIL_VENDA_DIRETA: string;
  SENHA_VENDA_DIRETA: string;
  PERC_VENDA_DIRETA: number;
  ConsumidorFinal: string;
  DESCONTO_BOLETO: string;
  REGIAO: iRegiao;
  OFICINA: string;
  Telefones: iTelefone[];
  FollowUpList: iFollowUpList[];
  AgendamentosList: iAgendamentosList[];
  PendenciasList: iPendenciasList[];
}

