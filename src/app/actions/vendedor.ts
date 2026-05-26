'use server';
import { ResponseType } from '@/@types';
import { iVendedor } from '@/@types/Vendedor';
import { CustomFetch } from '@/services/api';
import { getCookie } from '.';

export async function getVendedorAction(): Promise<ResponseType<iVendedor>> {
  const tokenCookie = await getCookie('token');
  const userCookie = await getCookie('user');

  const responseData = await CustomFetch(`/Colaboradores(${userCookie})`, {
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
      VENDEDOR: (responseData.body as iVendedor).VENDEDOR,
      NOME: (responseData.body as iVendedor).NOME,
      CPF: (responseData.body as iVendedor).CPF,
      IDENTIDADE: (responseData.body as iVendedor).IDENTIDADE,
      ATIVO: (responseData.body as iVendedor).ATIVO,
      VENDA: (responseData.body as iVendedor).VENDA,
      TIPO_VENDEDOR: (responseData.body as iVendedor).TIPO_VENDEDOR,
      TABELAS_PERMITIDAS: (responseData.body as iVendedor).TABELAS_PERMITIDAS,
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
    },
    error: undefined,
  };
}

