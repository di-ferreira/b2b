'use server';

import { iApiResult } from '@/@types';
import { iFilter } from '@/@types/Filter';
import { iMovimentoEventos } from '@/@types/MovimentosEventos';
import {
  iCondicaoPgto,
  iFormaPgto,
  iMovimento,
  iPreVenda,
  iTransportadora,
} from '@/@types/PreVenda';
import { iDataResultTable } from '@/@types/Table';
import { CustomFetch } from '@/services/api';
import dayjs from 'dayjs';
import { getCookie } from '.';
const ROUTE_GET_ALL_PRE_VENDA = '/Movimento';
const ROUTE_GET_ALL_MOVIMENTOS_EVENTOS = '/MovimentoEventos';
const ROUTE_SAVE_PRE_VENDA = '/ServiceVendas/NovaPreVenda';
const ROUTE_SELECT_SQL = '/ServiceSistema/SelectSQL';
const SQL_CONDICAO_PGTO = `SELECT O.id, O.nome, O.parcelas, O.valor_parcela, O.valor_parcela*O.PARCELAS AS VALOR_MINIMO,
       CASE O.parcelas
       WHEN 1  THEN O.pz01
       WHEN 2  THEN CAST((O.pz01+o.pz02)/2 AS INTEGER)
       WHEN 3  THEN CAST((O.pz01+o.pz02+O.pz03)/3 AS INTEGER)
       WHEN 4  THEN CAST((O.pz01+o.pz02+O.pz03+O.pz04)/4 AS INTEGER)
       WHEN 5  THEN CAST((O.pz01+o.pz02+O.pz03+O.pz04+O.pz05)/5 AS INTEGER)
       WHEN 6  THEN CAST((O.pz01+o.pz02+O.pz03+O.pz04+O.pz05+O.pz06)/6 AS INTEGER)
       WHEN 7  THEN CAST((O.pz01+o.pz02+O.pz03+O.pz04+O.pz05+O.pz06+O.pz07)/7 AS INTEGER)
       WHEN 8  THEN CAST((O.pz01+o.pz02+O.pz03+O.pz04+O.pz05+O.pz06+O.pz07+O.pz08)/8 AS INTEGER)
       WHEN 9  THEN CAST((O.pz01+o.pz02+O.pz03+O.pz04+O.pz05+O.pz06+O.pz07+O.pz08+O.pz09)/9 AS INTEGER)
       WHEN 10 THEN CAST((O.pz01+o.pz02+O.pz03+O.pz04+O.pz05+O.pz06+O.pz07+O.pz08+O.pz09+O.pz10)/10 AS INTEGER)
       END AS PM,
       PZ01,PZ02,PZ03,PZ04,PZ05,PZ06,PZ07,PZ08,PZ09,PZ10, TIPO, DESTACAR_DESCONTO, FORMA,O.DESCONTO_MAX
FROM OPP O
WHERE (O.valor_parcela*O.PARCELAS)<=:VALOR AND O.TIPO='V' AND O.tabela=:TABELA
ORDER BY 6`;
const SQL_FORMA_PGTO =
  "SELECT C.CARTAO FROM CAR C WHERE C.CAIXA='S' order by 1";
const SQL_TRANSPORTADORA =
  'SELECT FIRST 1500 F.FORNECEDOR, F.NOME, F.CIDADE FROM FNC F ORDER BY F.NOME';

const CreateFilter = async (filter: iFilter<iMovimento>): Promise<string> => {
  const ClienteLocal: string = await getCookie('user');

  let ResultFilter: string = `$filter=TIPOMOV eq 'PRE-VENDA'and CANCELADO eq 'N' and CLIENTE eq ${ClienteLocal}`;

  if (filter.filter && filter.filter.length >= 1) {
    ResultFilter = `$filter=CLIENTE eq ${ClienteLocal}`;
    const andStr = ' AND ';
    filter.filter.map((itemFilter) => {
      if (itemFilter.typeSearch)
        itemFilter.typeSearch === 'like'
          ? (ResultFilter = `${ResultFilter}${andStr}${
              itemFilter.key
            } like '% ${String(itemFilter.value).toUpperCase()} %'${andStr}`)
          : itemFilter.typeSearch === 'eq' &&
            (ResultFilter = `${ResultFilter}${andStr}${itemFilter.key} eq '${itemFilter.value}'${andStr}`);
      else
        ResultFilter = `${ResultFilter}${andStr}${
          itemFilter.key
        } like '% ${String(itemFilter.value).toUpperCase()} %'${andStr}`;
      return ResultFilter;
    });
    ResultFilter = ResultFilter.slice(0, -andStr.length);
  }

  const ResultOrderBy = filter.orderBy ? `&$orderby=${filter.orderBy}` : '';

  const ResultSkip = filter.skip ? `&$skip=${filter.skip}` : '&$skip=0';

  let ResultTop = filter.top ? `$top=${filter.top}` : '$top=15';

  ResultFilter !== '' && (ResultTop = `&${ResultTop}`);

  const ResultRoute: string = `?${ResultFilter}${ResultTop}${ResultSkip}${ResultOrderBy}&$inlinecount=allpages&$orderby=DATA desc&$expand=CLIENTE,VENDEDOR,Itens_List,Itens_List/PRODUTO`;

  return ResultRoute;
};

export async function GetPreVendas(filter: iFilter<iMovimento>) {
  const ClienteLocal: string = await getCookie('user');
  const tokenCookie = await getCookie('token');

  const FILTER = filter
    ? await CreateFilter(filter)
    : `?$filter=CLIENTE eq ${ClienteLocal} and TIPOMOV eq 'PRE-VENDA' and CANCELADO eq 'N'&$top=15&$inlinecount=allpages&$orderby=DATA desc&$expand=CLIENTE,VENDEDOR,Itens_List,Itens_List/PRODUTO`;

  const response = await CustomFetch<{
    '@xdata.count': number;
    value: iMovimento[];
  }>(`${ROUTE_GET_ALL_PRE_VENDA}${FILTER}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });
  console.log('pre venda', response.body);

  const result: iDataResultTable<iMovimento> = {
    Qtd_Registros: response.body['@xdata.count'],
    value: response.body.value,
  };

  if (response.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }
  return {
    value: result,
    error: undefined,
  };
}

export async function GetMovimentosDashboard() {
  const ClienteLocal: string = await getCookie('user');
  const tokenCookie = await getCookie('token');

  const FILTER = `?$filter=MOVIMENTO/CLIENTE eq ${ClienteLocal} and MOVIMENTO/TIPOMOV eq 'PRE-VENDA' and MOVIMENTO/CANCELADO eq 'N' and MOVIMENTO/DATA ge ${String(
    dayjs().subtract(3, 'months').format('YYYY-MM-DD')
  )}&$inlinecount=allpages&$orderby=MOVIMENTO/MOVIMENTO desc&$expand=MOVIMENTO, MOVIMENTO/Itens_List, MOVIMENTO/CLIENTE `;

  const response = await CustomFetch<{
    '@xdata.count': number;
    value: iMovimentoEventos[];
  }>(`${ROUTE_GET_ALL_MOVIMENTOS_EVENTOS}${FILTER}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });
  console.log('pre venda', response.body);

  const result: iDataResultTable<iMovimentoEventos> = {
    Qtd_Registros: response.body['@xdata.count'],
    value: response.body.value,
  };

  if (response.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }
  return {
    value: result,
    error: undefined,
  };
}

export async function GetPreVenda(IdPV: number) {
  const tokenCookie = await getCookie('token');

  const response = await CustomFetch<iMovimento>(
    `${ROUTE_GET_ALL_PRE_VENDA}(${IdPV})?$expand=CLIENTE,VENDEDOR,Itens_List,Itens_List/PRODUTO`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );

  if (response.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }

  return {
    value: response.body,
    error: undefined,
  };
}

export async function GetFormasPGTO() {
  const tokenCookie = await getCookie('token');

  const response = await CustomFetch<iApiResult<iFormaPgto[]>>(
    ROUTE_SELECT_SQL,
    {
      method: 'POST',
      body: JSON.stringify({
        pSQL: SQL_FORMA_PGTO,
        pPar: [],
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );

  if (response.body.StatusCode !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.body.StatusCode),
        message: String(response.body.StatusMessage),
      },
    };
  }

  return {
    value: response.body.Data,
    error: undefined,
  };
}

export async function GetCondicaoPGTO(valor: number, tabela: string) {
  const tokenCookie = await getCookie('token');

  const body: string = JSON.stringify({
    pSQL: SQL_CONDICAO_PGTO,
    pPar: [
      {
        ParamName: 'VALOR',
        ParamType: 'ftString',
        ParamValues: [valor],
      },
      {
        ParamName: 'TABELA',
        ParamType: 'ftString',
        ParamValues: [tabela],
      },
    ],
  });

  const response = await CustomFetch<iApiResult<iCondicaoPgto[]>>(
    `${ROUTE_SELECT_SQL}`,
    {
      method: 'POST',
      body: body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );

  if (response.body.StatusCode !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.body.StatusCode),
        message: String(response.body.StatusMessage),
      },
    };
  }

  return {
    value: response.body.Data,
    error: undefined,
  };
}

export async function GetTransport() {
  const tokenCookie = await getCookie('token');

  const response = await CustomFetch<iApiResult<iTransportadora[]>>(
    ROUTE_SELECT_SQL,
    {
      method: 'POST',
      body: JSON.stringify({
        pSQL: SQL_TRANSPORTADORA,
        pPar: [],
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );

  if (response.body.StatusCode !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.body.StatusCode),
        message: String(response.body.StatusMessage),
      },
    };
  }

  return {
    value: response.body.Data,
    error: undefined,
  };
}

export async function SavePreVenda(PreVenda: iPreVenda) {
  const tokenCookie = await getCookie('token');

  const responseInsert = await CustomFetch<iMovimento>(ROUTE_SAVE_PRE_VENDA, {
    body: JSON.stringify(PreVenda),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });

  if (responseInsert.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(responseInsert.status),
        message: String(responseInsert.statusText),
      },
    };
  }

  return {
    value: responseInsert.body,
    error: undefined,
  };
}

