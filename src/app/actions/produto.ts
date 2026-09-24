'use server';

import { iApiResult, ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import { iFilter, iFilterQuery } from '@/@types/Filter';
import {
  iEstoqueLoja,
  iListaSimilare,
  iProductPromotion,
  iProduto,
  iSaleHistory,
  iTabelaVenda,
} from '@/@types/Produto';
import { iDataResultTable } from '@/@types/Table';
import { sanitizeODataValue } from '@/lib/queryFilter';
import { assertSafeSQLValue } from '@/lib/utils';
import { CustomFetch } from '@/services/api';
import { getCookie } from '.';

interface iReqSuperBusca {
  Palavras: string;
  PularRegistros?: number;
  QuantidadeRegistros?: number;
}
const SQL_NEW_PRICE_FROM_TABLE = (produto: string, tabela: string) =>
  `select E.PRODUTO, E.PRECO, cast(E.PRECO * ((T.PERCENTUAL / 100) + 1) as numeric(10,2)) as NOVO_PRECO from EST E join TAB T on (T.TABELA = '${assertSafeSQLValue(tabela, 'tabela')}') where E.PRODUTO = '${assertSafeSQLValue(produto, 'produto')}' `;

const SQL_PRODUCTS_PROMOTION = (produto: string) =>
  `select  E.PRODUTO, E.REFERENCIA, e.nome, e.preco, e.qtdatual, P.valor as OFERTA, p.validade from EST E join promocao p on (p.produto = e.produto) where p.validade >= 'TODAY' and e.produto = '${assertSafeSQLValue(produto, 'produto')}' order by 6`;

const SQL_MWM = (produto: string) => {
  return `select TRIM(T.TABELA) AS TABELA, CAST((E.fab_bruto - ((E.fab_bruto*T.PERCENTUAL)/100)) AS NUMERIC(10,2)) AS NOVO_PRECO, T.bloqueada AS BLOQUEADO from tabela_mwm T, EST E WHERE E.PRODUTO='${assertSafeSQLValue(produto, 'produto')}' AND TRIM(T.TABELA) <> '%%'`;
};

const SQL_NORMAL = (produto: string) => {
  return `select T.TABELA, CAST((E.PRECO + ((E.PRECO*T.PERCENTUAL)/100)) AS NUMERIC(10,2)) AS PRECO, T.BLOQUEADO from TAB T, EST E  WHERE E.PRODUTO = '${assertSafeSQLValue(produto, 'produto')}' AND (((SELECT COUNT(*) FROM fab_tab F WHERE F.fabricante = E.fabricante)=0) OR ( T.TABELA IN (SELECT F.TABELA FROM FAB_TAB F WHERE E.fabricante = F.fabricante AND F.tabela = T.tabela)))`;
};

const SQL_2D = (produto: string) => {
  return `SELECT 'TAB01' AS TABELA, fab_liquido1 AS NOVO_PRECO  FROM EST E  WHERE E.PRODUTO =   '${assertSafeSQLValue(produto, 'produto')}' AND E.fab_liquido1 > 0 UNION  SELECT 'TAB02' AS TABELA, fab_liquido2 AS NOVO_PRECO FROM EST E  WHERE E.PRODUTO = '${assertSafeSQLValue(produto, 'produto')}' AND E.fab_st > 0`;
};

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
    case 'like':
      return `${typeSearch.key} like '%${sanitizeODataValue(
        String(typeSearch.value).toUpperCase(),
      )}%'`;

    case 'eq':
      return `${typeSearch.key} eq '${sanitizeODataValue(typeSearch.value)}'`;

    case 'ne':
      return `${typeSearch.key} ne '${sanitizeODataValue(typeSearch.value)}'`;

    default:
      return `${typeSearch.key} like '%${sanitizeODataValue(
        String(typeSearch.value).toUpperCase(),
      )}%'`;
  }
}

async function CreateQueryParams(filter: iFilter<iProduto>): Promise<string> {
  const searchFields: (keyof iProduto)[] = [
    'PRODUTO',
    'REFERENCIA',
    'NOME',
    'APLICACOES',
    'CODIGOBARRA',
    'REFERENCIA2',
  ];

  const conditions: string[] = [];
  const groups: Record<string, string[]> = {};
  const ungroupedConditions: string[] = [];

  // 1. Processamento dos filtros
  filter.filter?.forEach((item) => {
    const query = ReturnFilterQuery(item);
    if (!query) return;

    // Se for um campo de busca textual (LIKE), forçamos o grupo 'textSearch'
    if (item.typeSearch === 'like' && searchFields.includes(item.key)) {
      const groupName = 'textSearch';
      groups[groupName] = groups[groupName] || [];
      groups[groupName].push(query);
    }
    // Se tiver groupOperator, agrupa dinamicamente
    else if (item.groupOperator) {
      const groupName = `group_${item.groupOperator}`; // ou use a própria key se quiser grupos por campo
      groups[groupName] = groups[groupName] || [];
      groups[groupName].push(query);
    }
    // Filtros comuns
    else {
      ungroupedConditions.push(query);
    }
  });

  // 2. Monta as strings dos grupos (ex: (A or B))
  Object.keys(groups).forEach((groupName) => {
    const groupItems = groups[groupName];
    if (groupItems.length > 0) {
      // Determina o operador interno do grupo
      // Se o nome do grupo contiver 'or' ou for a busca textual, usamos 'or'
      const operator =
        groupName.includes('or') || groupName === 'textSearch'
          ? ' or '
          : ' and ';
      conditions.push(`(${groupItems.join(operator)})`);
    }
  });

  // 3. Adiciona os filtros soltos
  conditions.push(...ungroupedConditions);

  // 4. Regras de negócio fixas (ATIVO)
  const hasAtivoFilter = filter.filter?.some(
    (f) => f.key === 'ATIVO' && f.typeSearch === 'eq' && f.value === 'S',
  );
  if (!hasAtivoFilter) {
    conditions.push(`ATIVO eq 'S'`);
  }

  // 5. Montagem da URL (Codificando apenas o conteúdo dos parâmetros)
  const filterString = conditions.length
    ? `$filter=${encodeURIComponent(conditions.join(' and '))}` // Codifica apenas os filtros
    : '';

  const ResultTop = filter.top ? `&$top=${filter.top}` : '&$top=15';
  const ResultSkip = filter.skip ? `&$skip=${filter.skip}` : '&$skip=0';
  const ResultOrderBy = filter.orderBy
    ? `&$orderby=${encodeURIComponent(filter.orderBy)}` // Protege contra espaços do 'asc/desc'
    : '&$orderby=PRODUTO asc';

  // O expand pode ficar puro se não tiver caracteres especiais, mas mapear os nomes limpos é seguro
  const expand = `&$expand=FABRICANTE,FORNECEDOR,GRUPO,ListaChaves`;

  // RETORNE A STRING COM OS CARACTERES '?' E '&' NATIVOS, SEM ENCODE NA STRING TODA
  return `?${filterString}${ResultTop}${ResultSkip}${ResultOrderBy}${expand}&$inlinecount=allpages`;
}

export async function SuperFindProducts(
  filter: iFilter<iProduto>,
): Promise<ResponseType<iDataResultTable<iProduto>>> {
  const tokenCookie = await getCookie('token_b2b');
  const palavras = filter?.filter?.[0] ? encodeURIComponent(String(filter.filter[0].value)) : '';
  const URL = `${ROUTE_SUPER_BUSCA}?Palavras=${palavras}&PularRegistros=${filter?.skip ?? 0}&QuantidadeRegistros=${filter?.top ?? 15}&$expand=FABRICANTE,FORNECEDOR,GRUPO,ListaChaves,ListaSimilares`;
  const res = await CustomFetch<iApiResult<iProduto[]>>(URL, {
    method: 'GET',
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
  filter: iFilter<iProduto>,
): Promise<ResponseType<iDataResultTable<iProduto>>> {
  const tokenCookie = await getCookie('token_b2b');
  const url: string = `${ROUTE_GET_ALL_PRODUTO}${await CreateQueryParams(
    filter,
  )}`;

  const res = await CustomFetch<{ '@xdata.count': number; value: iProduto[] }>(
    url,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
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

const SQL_SEARCH_PRODUCTS = (word: string) =>
  `SELECT PRODUTO, REFERENCIA, NOME, PRECO, QTDATUAL, VENDA, TRANCAR, ATIVO, APLICACOES, FABRICANTE FROM EST WHERE (PRODUTO LIKE '%${word}%' OR REFERENCIA LIKE '%${word}%' OR NOME LIKE '%${word}%' OR APLICACOES LIKE '%${word}%') AND (VENDA = 'S' OR VENDA IS NULL) AND TRANCAR = 'N' AND ATIVO = 'S' ORDER BY PRODUTO`;

export async function SearchProductsViaSQL(
  word: string,
): Promise<ResponseType<iDataResultTable<iProduto>>> {
  const tokenCookie = await getCookie('token_b2b');
  const safe = word.replace(/'/g, '').substring(0, 50);
  const sql = SQL_SEARCH_PRODUCTS(safe);
  const encoded = encodeURIComponent(sql);

  const res = await CustomFetch<{ Data: iProduto[] }>(
    `${ROUTE_SELECT_SQL}?SQL=${encoded}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
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

  const data = res.body?.Data || [];
  return {
    value: {
      value: data as iProduto[],
      Qtd_Registros: data.length,
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
    },
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
  product: iProduto,
): Promise<ResponseType<iTabelaVenda[]>> {
  const tokenCookie = await getCookie('token_b2b');
  let tabelas: iTabelaVenda[] = [];

  let sql: string = SQL_NORMAL(product.PRODUTO);

  if (product.FAB_BRUTO > 0 && product.FABRICANTE?.NOME === 'MWM')
    sql = SQL_MWM(product.PRODUTO);
  if (product.FAB_BRUTO > 0 && product.FABRICANTE?.NOME !== 'MWM')
    sql = SQL_2D(product.PRODUTO);

  const res = await CustomFetch<any>(
    `${ROUTE_SELECT_SQL}?pSQL=${encodeURIComponent(sql)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
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

  if (!res.body?.Data || res.body.Data.length === 0) {
    return {
      value: undefined,
      error: {
        code: '404',
        message: 'Nenhuma tabela encontrada para o produto',
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
  table: string,
): Promise<ResponseType<number>> {
  const tokenCookie = await getCookie('token_b2b');

  const sql = SQL_NEW_PRICE_FROM_TABLE(product.PRODUTO, table);

  const res = await CustomFetch<any>(
    `${ROUTE_SELECT_SQL}?pSQL=${encodeURIComponent(sql)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (res.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(res.status),
        message: res.statusText,
      },
    };
  }

  if (!res.body?.Data || res.body.Data.length === 0) {
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
  product: iProduto,
): Promise<ResponseType<iProductPromotion>> {
  const tokenCookie = await getCookie('token_b2b');

  const sql = SQL_PRODUCTS_PROMOTION(product.PRODUTO);

  const res = await CustomFetch<any>(
    `${ROUTE_SELECT_SQL}?pSQL=${encodeURIComponent(sql)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
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

  if (!res.body?.Data || res.body.Data.length === 0) {
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
  product: iProduto,
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
    },
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
    `${ROUTE_GET_ALL_SIMILARES}?$filter=PRODUTO eq '${productScape}'&$expand=EXTERNO,EXTERNO/FABRICANTE`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
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

const SQL_ESTOQUE_FILIAIS = (produto: string) =>
  `SELECT PRODUTO, LOJA, ATUALIZACAO, CURVA_EST, CURVA_FAB, ESTOQUE, MINIMO, MAXIMO, PRECO, LOCAL1, LOCAL2, LOCAL3, PEDIDO FROM ESTOQUE_FILIAIS WHERE PRODUTO = '${assertSafeSQLValue(produto, 'produto')}'`;

export async function GetEstoqueFiliais(
  productCode: string,
): Promise<ResponseType<iEstoqueLoja[]>> {
  const tokenCookie = await getCookie('token_b2b');
  const sql = SQL_ESTOQUE_FILIAIS(productCode);

  const res = await CustomFetch<any>(
    `${ROUTE_SELECT_SQL}?pSQL=${encodeURIComponent(sql)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (res.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(res.status),
        message: res.statusText,
      },
    };
  }

  if (!res.body?.Data || res.body.Data.length === 0) {
    return {
      value: [],
      error: undefined,
    };
  }

  return {
    value: res.body.Data as iEstoqueLoja[],
    error: undefined,
  };
}

