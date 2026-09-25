'use server';
import { ResponseType } from '@/@types';
import { iVendedor } from '@/@types/Vendedor';
import { CustomFetch } from '@/services/api';
import { getCookie } from '.';

function buildVendedor(data: iVendedor): iVendedor {
  return {
    VENDEDOR: data.VENDEDOR,
    NOME: data.NOME,
    CPF: data.CPF,
    IDENTIDADE: data.IDENTIDADE,
    ATIVO: data.ATIVO,
    VENDA: data.VENDA,
    TIPO_VENDEDOR: data.TIPO_VENDEDOR,
    TABELAS_PERMITIDAS: data.TABELAS_PERMITIDAS,
    ENDERECO: '',
    BAIRRO: '',
    CIDADE: '',
    UF: '',
    CEP: '',
    TELEFONE: '',
    SENHA: '',
    ATUALIZAR: '',
    COMISSAO: 0,
    CTPS: '',
    FUNCAO: '',
    ADMISSAO: '',
    DEMISSAO: '',
    SALARIO: 0,
    VALE_TRANSPORTE: 0,
    NASCIMENTO: '',
    ESTADO_CIVIL: '',
    PIS: '',
    NACIONALIDADE: '',
    NATURALIDADE: '',
    CONJUGE: '',
    EMAIL: '',
    CELULAR: '',
    CARTAO_NUMERO: '',
    CARTAO_MATRICULA: '',
    META_MARKUP: 0,
    META_INDEXADOR: 0,
    SETOR: '',
  };
}

async function fetchColaborador(vendedorId: number, token: string): Promise<ResponseType<iVendedor>> {
  const responseData = await CustomFetch(`/Colaboradores(${vendedorId})`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${token}`,
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
  return { value: buildVendedor(responseData.body as iVendedor), error: undefined };
}

export async function getVendedorAction(): Promise<ResponseType<iVendedor>> {
  const tokenCookie = await getCookie('token_b2b');
  const clienteId = await getCookie('user_b2b');

  const orcamentoRes = await CustomFetch<{ value: { VENDEDOR: iVendedor | number }[] }>(
    `/Orcamento?$filter=CLIENTE eq ${clienteId}&orderby=ORCAMENTO desc&$top=1&$expand=VENDEDOR`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (orcamentoRes.status === 200 && orcamentoRes.body.value?.length > 0) {
    const vendedor = orcamentoRes.body.value[0].VENDEDOR;
    if (typeof vendedor === 'object' && vendedor !== null) {
      return { value: buildVendedor(vendedor), error: undefined };
    }
    if (typeof vendedor === 'number' && vendedor > 0) {
      return fetchColaborador(vendedor, tokenCookie);
    }
  }

  const vendaRes = await CustomFetch<{ value: { VENDEDOR: iVendedor | number }[] }>(
    `/Movimento?$filter=CLIENTE eq ${clienteId} and TIPOMOV eq 'VENDA' and CANCELADO eq 'N'&orderby=DATA desc&$top=1&$expand=VENDEDOR`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (vendaRes.status === 200 && vendaRes.body.value?.length > 0) {
    const vendedor = vendaRes.body.value[0].VENDEDOR;
    if (typeof vendedor === 'object' && vendedor !== null) {
      return { value: buildVendedor(vendedor), error: undefined };
    }
    if (typeof vendedor === 'number' && vendedor > 0) {
      return fetchColaborador(vendedor, tokenCookie);
    }
  }

  return {
    value: undefined,
    error: { code: '404', message: 'Vendedor não encontrado para o cliente' },
  };
}

