'use server';
import { Response, ResponseType } from '@/@types';
import { iContas } from '@/@types/Contas';
import { iFilter, iFilterQuery } from '@/@types/Filter';
import { iItensOrcamento, iOrcamento } from '@/@types/Orcamento';
import { iDataResultTable } from '@/@types/Table';
import { CustomFetch } from '@/services/api';
import dayjs from 'dayjs';
import { getCookie } from '.';
const ROUTE_GET_ALL_CONTAS = '/ContaPagarReceber';
const ROUTE_SAVE_ORCAMENTO = '/ServiceVendas/NovoOrcamento';
const ROUTE_REMOVE_ITEM_ORCAMENTO = '/ServiceVendas/ExcluirItemOrcamento';
const ROUTE_SAVE_ITEM_ORCAMENTO = '/ServiceVendas/NovoItemOrcamento';

function ReturnFilterQuery(typeSearch: iFilterQuery<iContas>): string {
  // Tratamento especial para valores nulos
  if (typeSearch.value === null) {
    return typeSearch.typeSearch === 'ne'
      ? `${typeSearch.key} ne null`
      : `${typeSearch.key} eq null`;
  }

  // Tratamento para operações numéricas
  if (
    ['RESTA', 'TOTAL', 'MOVIMENTO', 'PAGO'].includes(String(typeSearch.key))
  ) {
    switch (typeSearch.typeSearch) {
      case 'gt':
        return `${typeSearch.key} gt ${typeSearch.value}`;
      case 'lt':
        return `${typeSearch.key} lt ${typeSearch.value}`;
      case 'ge':
        return `${typeSearch.key} ge ${typeSearch.value}`;
      case 'le':
        return `${typeSearch.key} le ${typeSearch.value}`;
    }
  }

  // Tratamento padrão
  switch (typeSearch.typeSearch) {
    case 'like':
      return `contains(${typeSearch.key}, '${String(
        typeSearch.value
      ).toUpperCase()}')`;

    case 'eq':
      return `${typeSearch.key} eq '${typeSearch.value}'`;

    case 'ne':
      return `${typeSearch.key} ne '${typeSearch.value}'`;

    default:
      return `contains(${typeSearch.key}, '${String(
        typeSearch.value
      ).toUpperCase()}')`;
  }
}

async function CreateQueryParams(filter: iFilter<iContas>): Promise<string> {
  // 1. Separação dos filtros por campo
  const groupedFilters: { [key: string]: iFilterQuery<iContas>[] } = {};

  // Adiciona filtros do usuário
  filter.filter?.forEach((item) => {
    if (!groupedFilters[item.key]) {
      groupedFilters[item.key] = [];
    }
    groupedFilters[item.key].push(item);
  });

  // 2. Gera condições agrupadas
  const conditions: string[] = [];

  Object.entries(groupedFilters).forEach(([key, items]) => {
    // Determina operador de agrupamento (padrão: 'or' para PV, 'and' para outros)
    const groupOperator =
      items[0].groupOperator || (key === 'CLIENTE' ? 'or' : 'and');

    // Gera sub-condições
    const subConditions = items.map(ReturnFilterQuery).filter(Boolean);

    // Agrupa com operador definido
    if (subConditions.length > 1) {
      conditions.push(`(${subConditions.join(` ${groupOperator} `)})`);
    }
    // Única condição → adiciona sem parênteses
    else if (subConditions.length === 1) {
      conditions.push(subConditions[0]);
    }
  });

  // 3. Adiciona filtros fixos (VENDEDOR e DATA)
  const ClienteLocal: string = await getCookie('user');

  // let dateFilter = '';
  // dateFilter = `year(DATA) eq ${dayjs()
  //   .subtract(1, 'day')
  //   .format('YYYY')} and month(DATA) eq ${dayjs()
  //   .subtract(1, 'day')
  //   .format('MM')} and day(DATA) ge ${dayjs().subtract(1, 'day').format('DD')}`;
  // conditions.push(dateFilter);

  // Filtro do vendedor (sempre presente)
  conditions.unshift(`CLIENTE eq '${ClienteLocal}'`);

  // 4. Monta a string final
  const filterString = conditions.length
    ? `$filter=${conditions.join(' and ')}`
    : '';

  // 5. Parâmetros de paginação e ordenação
  const ResultTop = filter.top ? `&$top=${filter.top}` : '&$top=15';
  const ResultSkip = filter.skip ? `&$skip=${filter.skip}` : '&$skip=0';
  const ResultOrderBy = filter.orderBy
    ? `&$orderby=${filter.orderBy}`
    : '&$orderby=VENCIMENTO desc';

  // 6. Monta URL final
  return `?${filterString}${ResultTop}${ResultSkip}${ResultOrderBy}&$inlinecount=allpages`;
  // return `?${filterString}${ResultTop}${ResultSkip}${ResultOrderBy}&$expand=VENDEDOR,CLIENTE,ItensOrcamento/PRODUTO/FORNECEDOR,ItensOrcamento/PRODUTO/FABRICANTE,ItensOrcamento,ItensOrcamento/PRODUTO&$inlinecount=allpages`;
}

export async function LoadOrcamento(): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token');
  const ClienteLocal: string = await getCookie('user');
  const DataBusca: string = dayjs().format('YYYY-MM-DD');

  const response = await CustomFetch<Response<iOrcamento[]>>(
    `${ROUTE_GET_ALL_CONTAS}?$filter=(PV eq 'N' or PV eq null) and DATA eq ${DataBusca} and CLIENTE eq ${ClienteLocal}&orderby=ORCAMENTO desc&$top=1&$expand=VENDEDOR,CLIENTE,
    ItensOrcamento/PRODUTO/FORNECEDOR,ItensOrcamento/PRODUTO/FABRICANTE,ItensOrcamento, ItensOrcamento/PRODUTO,ItensOrcamento/ORCAMENTO,
    ItensOrcamento/PRODUTO/ListaChaves`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );

  const result: iOrcamento = response.body.value![0];

  if (result === undefined) {
    return {
      value: undefined,
      error: {
        code: '404',
        message: 'Not Found',
      },
    };
  }

  if (response.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }

  const itensOrcs: iItensOrcamento[] = result.ItensOrcamento.map((item) => {
    return { ...item, ORCAMENTO: result.ORCAMENTO };
  });

  return {
    value: {
      ...result,
      ItensOrcamento: itensOrcs,
    },
    error: undefined,
  };
}

export async function GetContasAPagarFromCliente(
  filter: iFilter<iContas> | null | undefined
): Promise<ResponseType<iDataResultTable<iContas>>> {
  const Cliente: string = await getCookie('CIC');
  const tokenCookie = await getCookie('token');

  const FILTER = filter
    ? await CreateQueryParams(filter)
    : `?$filter=VENDEDOR eq ${Cliente} and year(DATA) eq ${dayjs()
        .subtract(1, 'day')
        .format('YYYY')} and month(DATA) eq ${dayjs()
        .subtract(1, 'day')
        .format('MM')} and day(DATA) ge ${dayjs()
        .subtract(1, 'day')
        .format(
          'DD'
        )}&$orderby=ORCAMENTO desc&$top=10&$expand=VENDEDOR,CLIENTE,ItensOrcamento/PRODUTO/FORNECEDOR,ItensOrcamento/PRODUTO/FABRICANTE,ItensOrcamento,ItensOrcamento/PRODUTO&$inlinecount=allpages`;

  console.log('FILTER: ', FILTER);

  const response = await CustomFetch<{
    '@xdata.count': number;
    value: iContas[];
  }>(`${ROUTE_GET_ALL_CONTAS}${FILTER}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });

  const result: iDataResultTable<iContas> = {
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

export async function GetContasDashboard() {
  const Cliente: string = await getCookie('user');
  const tokenCookie = await getCookie('token');

  const FILTER = `?$filter=CLIENTE eq ${Cliente} and TIPO eq 'BOLETO' and CANCELADO eq 'N' and CONTA eq 'R' and RESTA ge 1&$orderby=VENCIMENTO desc&$inlinecount=allpages`;

  console.log('FILTER: ', FILTER);

  const response = await CustomFetch<{
    '@xdata.count': number;
    value: iContas[];
  }>(`${ROUTE_GET_ALL_CONTAS}${FILTER}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });
  console.log('response: ', response);

  const result: iDataResultTable<iContas> = {
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

export async function GetConta(
  OrcamentoNumber: string | number
): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token');

  const response = await CustomFetch<iOrcamento>(
    `${ROUTE_GET_ALL_CONTAS}(${OrcamentoNumber})?$expand=VENDEDOR,CLIENTE,
    ItensOrcamento/PRODUTO/FORNECEDOR,ItensOrcamento/PRODUTO/FABRICANTE,ItensOrcamento,
    ItensOrcamento/PRODUTO,ItensOrcamento/ORCAMENTO,ItensOrcamento/PRODUTO/ListaChaves`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
  );

  const result: iOrcamento = response.body;

  if (response.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }

  const itensOrcs: iItensOrcamento[] = response.body.ItensOrcamento.map(
    (item) => {
      return { ...item, ORCAMENTO: response.body.ORCAMENTO };
    }
  );

  return {
    value: {
      ...result,
      ItensOrcamento: itensOrcs,
    },
    error: undefined,
  };
}

