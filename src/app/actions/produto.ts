'use server';

import { iApiResult, ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import { iFilter } from '@/@types/Filter';
import {
  iProductPromotion,
  iProduto,
  iSaleHistory,
  iTabelaVenda,
} from '@/@types/Produto';
import { iDataResultTable } from '@/@types/Table';
import { CustomFetch } from '@/services/api';
import { getCookie } from '.';

interface iReqSuperBusca {
  Palavras: string;
  PularRegistros?: number;
  QuantidadeRegistros?: number;
}
const SQL_NEW_PRICE_FROM_TABLE = `select 
                                  E.PRODUTO,
                                  E.PRECO, cast(E.PRECO * ((T.PERCENTUAL / 100) + 1) as numeric(10,2)) as NOVO_PRECO
                                  from EST E
                                  join TAB T on (T.TABELA = :TABELA)
                                  where E.PRODUTO = :PRODUTO `;

const SQL_PRODUCTS_PROMOTION = `select  E.PRODUTO,
                                        E.REFERENCIA,
                                        e.nome,
                                        e.preco,
                                        e.qtdatual,
                                        P.valor as OFERTA,
                                        p.validade
                                from EST E
                                join promocao p on (p.produto = e.produto)
                                where p.validade >= 'TODAY' and
                                e.produto = :PRODUTO
                                order by 6`;

const SQL_MWM =
  "select TRIM(T.TABELA) AS TABELA, CAST((E.fab_bruto - ((E.fab_bruto*T.PERCENTUAL)/100)) AS NUMERIC(10,2)) AS NOVO_PRECO, T.bloqueada AS BLOQUEADO from tabela_mwm T, EST E WHERE E.PRODUTO=:PRODUTO AND TRIM(T.TABELA) <> '%%'";
const SQL_NORMAL =
  'select T.TABELA, CAST((E.PRECO + ((E.PRECO*T.PERCENTUAL)/100)) AS NUMERIC(10,2)) AS PRECO, T.BLOQUEADO from TAB T, EST E ' +
  'WHERE E.PRODUTO = :PRODUTO AND (((SELECT COUNT(*) FROM fab_tab F WHERE F.fabricante = E.fabricante)=0) OR ( T.TABELA IN (SELECT' +
  ' F.TABELA FROM FAB_TAB F WHERE E.fabricante = F.fabricante AND F.tabela = T.tabela)))';
const SQL_2D =
  "SELECT 'TAB01' AS TABELA, fab_liquido1 AS NOVO_PRECO  FROM EST E  WHERE E.PRODUTO = :PRODUTO AND E.fab_liquido1 > 0 UNION  SELECT 'TAB02' AS TABELA, fab_liquido2 AS NOVO_PRECO FROM EST E  WHERE E.PRODUTO = :PRODUTO AND E.fab_st > 0";
const ROUTE_SUPER_BUSCA = '/ServiceProdutos/SuperBusca';
const ROUTE_SELECT_SQL = '/ServiceSistema/SelectSQL';
const ROUTE_ESTOQUE_LOJAS = '/EstoqueFiliais';

const ROUTE_GET_ALL_PRODUTO = '/Produto';
const ROUTE_GET_SALE_HISTORY = '/ServiceClientes/ListaHistoricoVendas';

export async function SuperFindProducts(
  filter: iFilter<iProduto>
): Promise<ResponseType<iDataResultTable<iProduto>>> {
  const tokenCookie = await getCookie('token');
  const bodyReq: iReqSuperBusca = {
    Palavras: filter?.filter ? String(filter.filter[0].value) : '',
    PularRegistros: filter?.skip ? filter.skip : 0,
    QuantidadeRegistros: filter?.top ? filter.top : 15,
  };

  const res = await CustomFetch<iApiResult<iProduto[]>>(
    `${ROUTE_SUPER_BUSCA}?$expand=FABRICANTE,FORNECEDOR,GRUPO,ListaChaves,ListaSimilares`,
    {
      method: 'POST',
      body: JSON.stringify(bodyReq),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );
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
    value: {
      value: res.body.Data,
      Qtd_Registros: res.body.RecordCount,
    },
    error: undefined,
  };
}

export async function GetProduct(productCode: string) {
  const tokenCookie = await getCookie('token');
  const res = await CustomFetch<iProduto>(
    `${ROUTE_GET_ALL_PRODUTO}(${productCode})?$expand=FABRICANTE,ListaSimilares,ListaSimilares/PRODUTO,ListaSimilares/EXTERNO`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );

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
    value: res.body,
    error: undefined,
  };
}

export async function TableFromProduct(
  product: iProduto
): Promise<ResponseType<iTabelaVenda[]>> {
  const tokenCookie = await getCookie('token');
  let tabelas: iTabelaVenda[] = [];

  let sql: string = SQL_NORMAL;

  if (product.FAB_BRUTO > 0 && product.FABRICANTE?.NOME === 'MWM')
    sql = SQL_MWM;
  if (product.FAB_BRUTO > 0 && product.FABRICANTE?.NOME !== 'MWM') sql = SQL_2D;

  const body: string = JSON.stringify({
    pSQL: sql,
    pPar: [
      {
        ParamName: 'PRODUTO',
        ParamType: 'ftString',
        ParamValues: [product.PRODUTO],
      },
    ],
  });

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

  const newTables: iTabelaVenda[] = [];

  res.body.Data.map((tb: iTabelaVenda) => {
    if ('NOVO_PRECO' in tb) {
      newTables.push({
        BLOQUEADO: tb.BLOQUEADO,
        PRECO: Number(tb.NOVO_PRECO),
        TABELA: tb.TABELA,
      });
    } else {
      newTables.push(tb);
    }
  });

  tabelas = [...tabelas, ...newTables];

  return {
    value: newTables,
    error: undefined,
  };
}

export async function GetNewPriceFromTable(
  product: iProduto,
  table: string
): Promise<ResponseType<number>> {
  const tokenCookie = await getCookie('token');

  const body: string = JSON.stringify({
    pSQL: SQL_NEW_PRICE_FROM_TABLE,
    pPar: [
      {
        ParamName: 'PRODUTO',
        ParamType: 'ftString',
        ParamValues: [product.PRODUTO],
      },
      {
        ParamName: 'TABELA',
        ParamType: 'ftString',
        ParamValues: [table],
      },
    ],
  });

  const res = await CustomFetch<any>(`${ROUTE_SELECT_SQL}`, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });
  console.log('produtos', res.body);

  if (res.status !== 200 || res.body.Data === null) {
    return {
      value: product.PRECO,
      error: undefined,
    };
  }

  return {
    value: res.body.Data[0].NOVO_PRECO,
    error: undefined,
  };
}

export async function GetProductPromotion(
  product: iProduto
): Promise<ResponseType<iProductPromotion>> {
  const tokenCookie = await getCookie('token');

  const body: string = JSON.stringify({
    pSQL: SQL_PRODUCTS_PROMOTION,
    pPar: [
      {
        ParamName: 'PRODUTO',
        ParamType: 'ftString',
        ParamValues: [product.PRODUTO],
      },
    ],
  });

  const res = await CustomFetch<any>(`${ROUTE_SELECT_SQL}`, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });

  if (res.body.Data === null) {
    return {
      value: undefined,
      error: {
        code: '404',
        message: 'Produto não encontrado',
      },
    };
  }

  return {
    value: res.body.Data[0],
    error: undefined,
  };
}

export async function GetSaleHistory(
  customer: iCliente,
  product: iProduto
): Promise<ResponseType<iSaleHistory[]>> {
  const tokenCookie = await getCookie('token');

  const res = await CustomFetch<any>(
    `${ROUTE_GET_SALE_HISTORY}?pCliente=${customer.CLIENTE}&pProduto=${product.PRODUTO}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );

  if (res.status !== 200) {
    return {
      value: undefined,
      error: {
        code: res.status.toString(),
        message: res.statusText,
      },
    };
  }

  return {
    value: res.body.Data,
    error: undefined,
  };
}

