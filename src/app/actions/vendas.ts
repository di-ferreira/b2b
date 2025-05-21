'use server';

import { iSelectSQL } from '@/@types';
import { iFilter } from '@/@types/Filter';
import { iMovimento } from '@/@types/PreVenda';
import { iDataResultTable } from '@/@types/Table';
import { CustomFetch } from '@/services/api';
import { getCookie } from '.';

const ROUTE_GET_ALL_PRE_VENDA = '/Movimento';
const ROUTE_SELECT_SQL = '/ServiceSistema/SelectSQL';

const CreateFilter = async (filter: iFilter<iMovimento>): Promise<string> => {
  const VendedorLocal: string = await getCookie('user');

  let ResultFilter: string = `$filter=TIPOMOV eq 'VENDA'and CANCELADO eq 'N' and VENDEDOR eq ${VendedorLocal}`;

  if (filter.filter && filter.filter.length >= 1) {
    ResultFilter = `$filter=VENDEDOR eq ${VendedorLocal}`;
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

export async function GetVendas(filter: iFilter<iMovimento>) {
  const VendedorLocal: string = await getCookie('user');
  const tokenCookie = await getCookie('token');

  const FILTER = filter
    ? await CreateFilter(filter)
    : `?$filter=VENDEDOR eq ${VendedorLocal} and TIPOMOV eq 'VENDA' and CANCELADO eq 'N'&$top=15&$inlinecount=allpages&$orderby=DATA desc&$expand=CLIENTE,VENDEDOR,Itens_List,Itens_List/PRODUTO`;

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

export async function getVendasDashboard() {
  const VendedorLocal: string = await getCookie('user');
  const tokenCookie = await getCookie('token');

  const sql: string = `SELECT
    c.NOME AS CLIENTE,
    SUM(m.TOTAL) AS TOTAL_VENDAS
FROM
    MVE m
    JOIN CLI c ON m.CLIENTE = c.CLIENTE
WHERE
    m.TIPOMOV = 'VENDA'
    AND m.VENDEDOR = ${VendedorLocal}
    AND m.CANCELADO = 'N'
    AND m.DATA BETWEEN DATEADD(1 - EXTRACT(DAY FROM CURRENT_DATE) DAY TO CURRENT_DATE)
                    AND DATEADD(-EXTRACT(DAY FROM DATEADD(1 MONTH TO CURRENT_DATE)) DAY TO DATEADD(1 MONTH TO CURRENT_DATE))
GROUP BY
    c.NOME
ORDER BY
    c.NOME;
`;

  const body: string = JSON.stringify({
    pSQL: sql,
    pPar: [],
  } as iSelectSQL);

  const res = await CustomFetch<any>(`${ROUTE_SELECT_SQL}`, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });

  if (res.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(res.status),
        message: String(res.statusText),
      },
    };
  }
  return {
    value: res.body.Data,
    error: undefined,
  };
}

export async function getDataTotalVenda() {
  const VendedorLocal: string = await getCookie('user');
  const tokenCookie = await getCookie('token');

  const sql: string = `SELECT 
    EXTRACT(YEAR FROM data) AS ano,
    EXTRACT(MONTH FROM data) AS mes,
    SUM(M.TOTAL) AS total_mensal
FROM 
    MVE M
WHERE 
    M.VENDEDOR = ${VendedorLocal} 
    AND M.data >= dateadd(month, -1, current_date)
    AND M.CANCELADO = 'N'
GROUP BY 
    EXTRACT(YEAR FROM data),
    EXTRACT(MONTH FROM data)
ORDER BY 
    ano, mes;`;

  const body: string = JSON.stringify({
    pSQL: sql,
    pPar: [],
  } as iSelectSQL);

  const res = await CustomFetch<any>(`${ROUTE_SELECT_SQL}`, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });

  if (res.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(res.status),
        message: String(res.statusText),
      },
    };
  }
  return {
    value: res.body.Data,
    error: undefined,
  };
}
export async function getLastVenda() {
  const VendedorLocal: string = await getCookie('user');
  const tokenCookie = await getCookie('token');

  const FILTER = `?$filter=VENDEDOR eq ${VendedorLocal} and TIPOMOV eq 'VENDA' and CANCELADO eq 'N'&$top=1&$inlinecount=allpages&$orderby=DATA desc&$expand=CLIENTE,VENDEDOR,Itens_List,Itens_List/PRODUTO`;

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

