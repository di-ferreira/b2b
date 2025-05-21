'use server';
import { ResponseType, userLogin } from '@/@types';
import { iCliente, iRegiao } from '@/@types/Cliente';
import { compareHash, RemoveSpecialCharacter } from '@/lib/utils';
import { CustomFetch } from '@/services/api';
import { getCookie, setCookie } from '.';

export async function LoginUser(
  user: userLogin
): Promise<ResponseType<iCliente>> {
  const resultVenda = await vendaLogin();

  if (resultVenda.value === undefined) {
    return { error: resultVenda.error };
  }

  const token = resultVenda.value;

  const cliente: ResponseType<iCliente> = await getCliente({
    token,
    user: user.cliente,
  });

  if (cliente.value === undefined) {
    return { error: cliente.error };
  }

  const verifyPassword = compareHash(cliente.value.SENHA, user.password);

  if (!verifyPassword)
    return {
      error: { code: 'unauthorized', message: 'User or password invalid!' },
    };

  const clienteResult: ResponseType<iCliente> = {
    value: {
      CLIENTE: cliente.value.CLIENTE,
      NOME: cliente.value.NOME,
      ENDERECO: cliente.value.ENDERECO,
      BAIRRO: cliente.value.BAIRRO,
      CIDADE: cliente.value.CIDADE,
      UF: cliente.value.UF,
      CEP: cliente.value.CEP,
      CIC: cliente.value.CIC,
      TELEFONE: cliente.value.TELEFONE,
      EMAIL: cliente.value.EMAIL,
      BLOQUEADO: cliente.value.BLOQUEADO,
      MOTIVO: cliente.value.MOTIVO,
      USARLIMITE: cliente.value.USARLIMITE,
      LIMITE: cliente.value.LIMITE,
      VENDEDOR: cliente.value.VENDEDOR,
      DT_CADASTRO: '',
      DT_NASCIMENTO: '',
      DT_ULT_COMPRA: '',
      INSC_IDENT: '',
      FAX: '',
      P1_DE: 0,
      P1_ATE: 0,
      P1_VENCIMENTO: 0,
      P2_DE: 0,
      P2_ATE: 0,
      P2_VENCIMENTO: 0,
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
      IDENTIDADE: '',
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
      TIPO_CLIENTE: 'FIEL',
      AtualizarRegiao: '',
      SENHA: '',
      EMAIL_VENDA_DIRETA: '',
      SENHA_VENDA_DIRETA: '',
      PERC_VENDA_DIRETA: 0,
      ConsumidorFinal: '',
      DESCONTO_BOLETO: '',
      OFICINA: '',
      Telefones: [],
      FollowUpList: [],
      AgendamentosList: [],
      PendenciasList: [],
      REGIAO: {} as iRegiao,
    },
  };
  await setCookie('token', token);

  await setCookie('user', String(cliente.value.CLIENTE));

  return { value: clienteResult.value };
}

async function vendaLogin(): Promise<ResponseType<string>> {
  const data = await CustomFetch<ResponseType<string>>(
    '/ServiceSistema/Login',
    {
      body: JSON.stringify({
        usuario: process.env.VENDA_LOGIN,
        senha: process.env.VENDA_PASSWORD,
      }),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return data.body;
}

async function getCliente(data: {
  token: string;
  user: string;
}): Promise<ResponseType<iCliente>> {
  const responseData = await CustomFetch<{
    value: iCliente[];
  }>(
    `/Clientes?$filter=CIC eq '${
      data.user
    }' or CIC eq '${RemoveSpecialCharacter(
      data.user
    )}'&$expand=Telefones, AgendamentosList, PendenciasList`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${data.token}`,
      },
    }
  );
  if (responseData.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(responseData.status),
        message: String(responseData.statusText),
      },
    };
  }

  return {
    value: responseData.body.value[0] as iCliente,
    error: undefined,
  };
}

export async function getClienteAction(): Promise<ResponseType<iCliente>> {
  const tokenCookie = await getCookie('token');
  const userCookie = await getCookie('user');

  const responseData = await CustomFetch(`/Clientes(${userCookie})`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });
  if (responseData.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(responseData.status),
        message: String(responseData.statusText),
      },
    };
  }
  return {
    value: {
      CLIENTE: (responseData.body as iCliente).CLIENTE,
      NOME: (responseData.body as iCliente).NOME,
      ENDERECO: (responseData.body as iCliente).ENDERECO,
      BAIRRO: (responseData.body as iCliente).BAIRRO,
      CIDADE: (responseData.body as iCliente).CIDADE,
      UF: (responseData.body as iCliente).UF,
      CEP: (responseData.body as iCliente).CEP,
      CIC: (responseData.body as iCliente).CIC,
      TELEFONE: (responseData.body as iCliente).TELEFONE,
      EMAIL: (responseData.body as iCliente).EMAIL,
      BLOQUEADO: (responseData.body as iCliente).BLOQUEADO,
      MOTIVO: (responseData.body as iCliente).MOTIVO,
      USARLIMITE: (responseData.body as iCliente).USARLIMITE,
      LIMITE: (responseData.body as iCliente).LIMITE,
      VENDEDOR: (responseData.body as iCliente).VENDEDOR,
      DT_CADASTRO: '',
      DT_NASCIMENTO: '',
      DT_ULT_COMPRA: '',
      INSC_IDENT: '',
      FAX: '',
      P1_DE: 0,
      P1_ATE: 0,
      P1_VENCIMENTO: 0,
      P2_DE: 0,
      P2_ATE: 0,
      P2_VENCIMENTO: 0,
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
      IDENTIDADE: '',
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
      TIPO_CLIENTE: (responseData.body as iCliente).TIPO_CLIENTE,
      AtualizarRegiao: '',
      SENHA: '',
      EMAIL_VENDA_DIRETA: '',
      SENHA_VENDA_DIRETA: '',
      PERC_VENDA_DIRETA: 0,
      ConsumidorFinal: '',
      DESCONTO_BOLETO: '',
      OFICINA: '',
      Telefones: [],
      FollowUpList: [],
      AgendamentosList: [],
      PendenciasList: [],
      REGIAO: {} as iRegiao,
    },
    error: undefined,
  };
}

