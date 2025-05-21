'use client';
import { iCliente, iRegiao } from '@/@types/Cliente';
import { getClienteAction } from '@/app/actions/user';
import useSWR from 'swr';

const UserNameText = () => {
  const { data: user, isLoading } = useSWR(
    'getClienteAction',
    getClienteAction
  );

  if (isLoading) return <span>Carregando nome do vendedor...</span>;

  if (user === undefined)
    console.error('Error:Falha ao carregar nome do vendedor.');

  if (user === undefined || user.value === undefined)
    return <span>Failed to load user.</span>;

  const cliente: iCliente = {
    CLIENTE: user.value.CLIENTE,
    NOME: user.value.NOME,
    CIC: user.value.CIC,
    IDENTIDADE: user.value.IDENTIDADE,
    ENDERECO: '',
    BAIRRO: '',
    CIDADE: '',
    UF: '',
    CEP: '',
    DT_CADASTRO: '',
    DT_NASCIMENTO: '',
    DT_ULT_COMPRA: '',
    INSC_IDENT: '',
    TELEFONE: '',
    FAX: '',
    EMAIL: '',
    BLOQUEADO: '',
    MOTIVO: '',
    P1_DE: 0,
    P1_ATE: 0,
    P1_VENCIMENTO: 0,
    P2_DE: 0,
    P2_ATE: 0,
    P2_VENCIMENTO: 0,
    USARLIMITE: '',
    LIMITE: 0,
    DESCONTO: '',
    OBS: '',
    VALOR_DESCONTO: 0,
    ECF: '',
    BOLETO: '',
    CARTEIRA: '',
    ROTA: 0,
    TAXA_ENTREGA: 0,
    CLASSIFICACAO: 0,
    FRETE_POR_CONTA: '',
    FRETE_TIPO: '',
    ACRESCIMO_NOTA: 0,
    VENDEDOR: 0,
    OS: '',
    TIPO_FAT: '',
    MESSAGEM_FINANCEIRO: '',
    ENDERECO_NUM: '',
    ENDERECO_CPL: '',
    ENDERECO_COD_MUN: 0,
    ENDERECO_COD_UF: 0,
    Tabela: '',
    ATUALIZAR: '',
    CONDICAO_PAGAMENTO: '',
    APELIDO: '',
    EMAIL_FINANCEIRO: '',
    DESCONTO_AVISTA: 0,
    TRANSPORTADORA: 0,
    ID_CONDICAO: 0,
    FROTA: '',
    MENSAGEM_FINANCEIRO: '',
    GRUPO: 0,
    END_ENTREGA: '',
    INSCRICAO_M: '',
    LIMITE_CHEQUE: 0,
    META: 0,
    SOMENTE_NFE: '',
    VENDEDOR_INTERNO: 0,
    DATA_ATUALIZACAO: '',
    GEO_LAT: '',
    GEO_LNG: '',
    DDA: '',
    V100: '',
    TIPO_CLIENTE: user.value.TIPO_CLIENTE,
    AtualizarRegiao: '',
    SENHA: '',
    EMAIL_VENDA_DIRETA: '',
    SENHA_VENDA_DIRETA: '',
    PERC_VENDA_DIRETA: 0,
    ConsumidorFinal: '',
    DESCONTO_BOLETO: '',
    REGIAO: {} as iRegiao,
    OFICINA: '',
    Telefones: [],
    FollowUpList: [],
    AgendamentosList: [],
    PendenciasList: [],
  };

  return (
    <div className='flex flex-1 items-center mr-4 justify-center text-emsoft_light-main font-bold'>
      <span>{cliente.NOME}</span>
    </div>
  );
};

export default UserNameText;

