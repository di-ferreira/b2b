'use server';

import { iApiResult, ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import { iFilter, iFilterQuery } from '@/@types/Filter';
import {
  iListaSimilare,
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
const ROUTE_GET_ALL_SIMILARES = '/Similares';
const ROUTE_GET_SALE_HISTORY = '/ServiceClientes/ListaHistoricoVendas';

function ReturnFilterQuery(typeSearch: iFilterQuery<iProduto>): string {
  // Tratamento especial para valores nulos
  if (typeSearch.value === null) {
    return typeSearch.typeSearch === 'ne'
      ? `${typeSearch.key} ne null `
      : `${typeSearch.key} eq null `;
  }

  // ✅ Tratamento genérico: se o valor for número, usa operadores numéricos
  if (typeof typeSearch.value === 'number') {
    switch (typeSearch.typeSearch) {
      case 'gt':
        return `${typeSearch.key} gt ${typeSearch.value} `;
      case 'lt':
        return `${typeSearch.key} lt ${typeSearch.value} `;
      case 'ge':
        return `${typeSearch.key} ge ${typeSearch.value} `;
      case 'le':
        return `${typeSearch.key} le ${typeSearch.value} `;
      // Se for 'eq' ou 'ne' com número, cai no tratamento padrão abaixo (com aspas)
      // Mas se quiser também tratar eq/ne como numérico (sem aspas), descomente:
      // case 'eq':
      //   return `${typeSearch.key} eq ${typeSearch.value}`;
      // case 'ne':
      //   return `${typeSearch.key} ne ${typeSearch.value}`;
      default:
        // Se for outro operador (ex: like), continua para o padrão
        break;
    }
  }

  // Tratamento padrão para strings e outros tipos
  switch (typeSearch.typeSearch) {
    // case 'like':
    //   return `contains(${typeSearch.key}, '${String(
    //     typeSearch.value
    //   ).toUpperCase()}') `;

    case 'like':
      return `${typeSearch.key} like '%${String(
        typeSearch.value
      ).toUpperCase()}%'`;

    case 'eq':
      return `${typeSearch.key} eq '${typeSearch.value}'`;

    case 'ne':
      return `${typeSearch.key} ne '${typeSearch.value}'`;

    default:
      return `${typeSearch.key} like '%${String(
        typeSearch.value
      ).toUpperCase()}%' `;
    // default:
    //   return `contains(${typeSearch.key}, '${String(
    //     typeSearch.value
    //   ).toUpperCase()}') `;
  }
}

async function CreateQueryParams(filter: iFilter<iProduto>): Promise<string> {
  // Campos que são considerados "campos de busca textual" (para OR)
  const searchFields: (keyof iProduto)[] = [
    'PRODUTO',
    'REFERENCIA',
    'NOME',
    'APLICACOES',
    'CODIGOBARRA',
    'REFERENCIA2',
  ];

  // Separa os filtros em dois grupos
  const likeFilters: iFilterQuery<iProduto>[] = [];
  const otherFilters: iFilterQuery<iProduto>[] = [];

  filter.filter?.forEach((item) => {
    if (item.typeSearch === 'like' && searchFields.includes(item.key)) {
      likeFilters.push(item);
    } else {
      otherFilters.push(item);
    }
  });

  const conditions: string[] = [];

  // 1. Agrupa todos os filtros LIKE em um único OR entre os campos de busca
  if (likeFilters.length > 0) {
    const likeConditions = likeFilters.map(ReturnFilterQuery).filter(Boolean);
    if (likeConditions.length > 0) {
      conditions.push(`(${encodeURIComponent(likeConditions.join(' or '))})`);
    }
  }

  // 2. Adiciona os demais filtros (eq, ne, gt, etc.) como AND soltos
  const otherConditions = otherFilters.map(ReturnFilterQuery).filter(Boolean);
  conditions.push(...otherConditions);

  // 3. Filtros fixos (ATIVO e DATA_ATUALIZACAO) — evita duplicação
  const VendedorLocal: string = await getCookie('user_b2b');

  // Evita duplicação de ATIVO eq 'S'
  const hasAtivoFilter = filter.filter?.some(
    (f) => f.key === 'ATIVO' && f.typeSearch === 'eq' && f.value === 'S'
  );
  if (!hasAtivoFilter) {
    conditions.push(`ATIVO eq 'S'`);
  }

  // Filtro fixo: atualização nos últimos 7 dias
  // const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  // conditions.push(`DATA_ATUALIZACAO ge ${sevenDaysAgo}`);

  // 4. Monta a string final de filtros
  const filterString = conditions.length
    ? `$filter=${conditions.join(' and ')}`
    : '';

  // 5. Parâmetros de paginação e ordenação
  const ResultTop = filter.top ? `&$top=${filter.top}` : '&$top=15';
  const ResultSkip = filter.skip ? `&$skip=${filter.skip}` : '&$skip=0';
  const ResultOrderBy = filter.orderBy
    ? `&$orderby=${filter.orderBy}`
    : '&$orderby=PRODUTO asc';

  // 6. Expansões específicas para iProduto
  // const expand = `&$expand=FABRICANTE,FORNECEDOR,GRUPO,ListaChaves,ListaSimilares,ListaSimilares/PRODUTO,ListaSimilares/EXTERNO`;
  const expand = `&$expand=FABRICANTE,FORNECEDOR,GRUPO,ListaChaves`;

  // 7. Monta URL final
  return `?${filterString}${ResultTop}${ResultSkip}${ResultOrderBy}${expand}&$inlinecount=allpages`;
}

export async function SuperFindProducts(
  filter: iFilter<iProduto>
): Promise<ResponseType<iDataResultTable<iProduto>>> {
  const tokenCookie = await getCookie('token_b2b');
  const bodyReq: iReqSuperBusca = {
    Palavras: filter?.filter ? String(filter.filter[0].value) : '',
    PularRegistros: filter?.skip ? filter.skip : 0,
    QuantidadeRegistros: filter?.top ? filter.top : 15,
  };
  const URL = `${ROUTE_SUPER_BUSCA}?$expand=FABRICANTE,FORNECEDOR,GRUPO,ListaChaves,ListaSimilares`;
  const res = await CustomFetch<iApiResult<iProduto[]>>(URL, {
    method: 'POST',
    body: JSON.stringify(bodyReq),
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
    value: {
      value: res.body!.Data,
      Qtd_Registros: res.body!.RecordCount,
    },
    error: undefined,
  };
}

export async function GetProducts(
  filter: iFilter<iProduto>
): Promise<ResponseType<iDataResultTable<iProduto>>> {
  const tokenCookie = await getCookie('token_b2b');
  const url: string = `${ROUTE_GET_ALL_PRODUTO}${await CreateQueryParams(
    filter
  )}`;

  const res = await CustomFetch<{ '@xdata.count': number; value: iProduto[] }>(
    url,
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
    value: {
      value: res.body!.value,
      Qtd_Registros: res.body!['@xdata.count'],
    },
    error: undefined,
  };
}

export async function GetProduct(productCode: string) {
  const tokenCookie = await getCookie('token_b2b');
  const productScape = encodeURIComponent(productCode);

  const res = await CustomFetch<iProduto>(
    `${ROUTE_GET_ALL_PRODUTO}('${productScape}')?$expand=FABRICANTE,ListaSimilares,ListaSimilares/PRODUTO,ListaSimilares/EXTERNO`,
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
  const tokenCookie = await getCookie('token_b2b');
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
  const tokenCookie = await getCookie('token_b2b');

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

  if (res.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(res.status),
        message: res.statusText,
      },
    };
  }

  if (res.body.Data === null && res.body.RecordCount <= 0) {
    return {
      value: undefined,
      error: {
        code: '404',
        message: 'Produto não encontrado!',
      },
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
  const tokenCookie = await getCookie('token_b2b');

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
  const tokenCookie = await getCookie('token_b2b');

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

export async function GetSimilares(productCode: string) {
  const tokenCookie = await getCookie('token_b2b');
  const productScape = encodeURIComponent(productCode);

  const res = await CustomFetch<{ value: iListaSimilare[] }>(
    `${ROUTE_GET_ALL_SIMILARES}?$filter=PRODUTO eq '${productScape}'`,
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

  if (res.body === null) {
    return {
      value: undefined,
      error: {
        code: '404',
        message: 'Sem produtos similares',
      },
    };
  }

  return {
    value: res.body.value,
    error: undefined,
  };
}

