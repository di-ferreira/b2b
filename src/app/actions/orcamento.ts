'use server';
import { iApiResult, iResultApi, ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import {
  iItemInserir,
  iItemRemove,
  iItensOrcamento,
  iOrcamento,
  iOrcamentoInserir,
} from '@/@types/Orcamento';
import {
  FilterCondition,
  FilterGroup,
  ModelMetadata,
  QueryOptions,
  SearchOperator,
} from '@/@types/QueryFilter';
import { iDataResultTable } from '@/@types/Table';
import { iVendedor } from '@/@types/Vendedor';
import { ODataQueryBuilder } from '@/lib/queryFilter';
import { CustomFetch } from '@/services/api';
import dayjs from 'dayjs';
import { getCookie } from '.';
import { getClienteAction } from './user';
import { getVendedorAction } from './vendedor';
const ROUTE_GET_ALL_ORCAMENTO = '/Orcamento';
const ROUTE_SAVE_ORCAMENTO = '/ServiceVendas/NovoOrcamento';
const ROUTE_REMOVE_ITEM_ORCAMENTO = '/ServiceVendas/ExcluirItemOrcamento';
const ROUTE_SAVE_ITEM_ORCAMENTO = '/ServiceVendas/NovoItemOrcamento';

export async function LoadOrcamento(): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token_b2b');
  const ClienteLocal: string = await getCookie('user_b2b');
  const DataBusca: string = dayjs().format('YYYY-MM-DD');

  const response = await CustomFetch<iResultApi<iOrcamento>>(
    `${ROUTE_GET_ALL_ORCAMENTO}?$filter=(PV eq 'N' or PV eq null) and DATA eq ${DataBusca} and CLIENTE eq ${ClienteLocal}&orderby=ORCAMENTO desc&$top=1&$expand=VENDEDOR,CLIENTE,
    ItensOrcamento/PRODUTO/FORNECEDOR,ItensOrcamento/PRODUTO/FABRICANTE,ItensOrcamento, ItensOrcamento/PRODUTO,ItensOrcamento/ORCAMENTO,
    ItensOrcamento/PRODUTO/ListaChaves`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  const result: iOrcamento = response.body.value[0];

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

export async function GetOrcamentosFromVendedor(
  filter?: QueryOptions<iOrcamento>,
): Promise<ResponseType<iDataResultTable<iOrcamento>>> {
  const VendedorLocal: string = await getCookie('user');
  const Vendedor: iVendedor = (await getVendedorAction()).value!;
  const tokenCookie = await getCookie('token');
  const OrcamentoMetadata = {
    ORCAMENTO: 'number' as const,
    VENDEDOR: 'number' as const,
    CLIENTE: 'number' as const,
    TOTAL: 'number' as const,
    ItensOrcamento: 'string' as const,
  } satisfies ModelMetadata<iOrcamento>;

  const formattedFilter =
    filter &&
    filter.filter!.conditions.map((f: any) => {
      const operator: SearchOperator = f.operator;
      return {
        key: f.key,
        value: f.value,
        operator: operator || 'eq',
      };
    });

  const filterConditions: FilterGroup<iOrcamento> = filter?.filter!;

  const QueryBuilder = new ODataQueryBuilder<iOrcamento>(
    OrcamentoMetadata,
  ).expand(
    'VENDEDOR',
    'CLIENTE',
    'ItensOrcamento/PRODUTO/FORNECEDOR',
    'ItensOrcamento/PRODUTO/FABRICANTE',
    'ItensOrcamento',
    'ItensOrcamento/PRODUTO',
  );

  const filterVendedor: Array<
    FilterCondition<iOrcamento> | FilterGroup<iOrcamento>
  > =
    Vendedor.TIPO_VENDEDOR === 'I'
      ? []
      : [
          {
            key: 'VENDEDOR',
            operator: 'eq',
            value: VendedorLocal,
          },
        ];

  filter !== undefined
    ? QueryBuilder.where({
        operator: filterConditions.operator,
        conditions: [
          ...(filterVendedor as FilterGroup<iOrcamento>['conditions']),
          ...(formattedFilter as FilterGroup<iOrcamento>['conditions']),
        ],
      })
        .top(filter.top || 10)
        .skip(filter.skip || 0)
        .orderBy(filter.orderBy || 'ORCAMENTO', 'desc')
        .build()
    : QueryBuilder.where({
        operator: 'and',
        conditions: [
          ...(filterVendedor as FilterGroup<iOrcamento>['conditions']),
          {
            key: 'DATA',
            operator: 'ge',
            value: `${dayjs().subtract(36, 'hours').format('YYYY-MM-DD')}`,
          },
          {
            operator: 'or',
            conditions: [
              {
                key: 'PV',
                operator: 'eq',
                value: 'N',
              },
              {
                key: 'PV',
                operator: 'eq',
                value: null,
              },
            ],
          },
        ],
      })
        .top(10)
        .skip(0)
        .orderBy('ORCAMENTO', 'desc');

  const FILTER = QueryBuilder.build();

  const response = await CustomFetch<{
    '@xdata.count': number;
    value: iOrcamento[];
  }>(`${ROUTE_GET_ALL_ORCAMENTO}${FILTER}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });

  const result: iDataResultTable<iOrcamento> = {
    Qtd_Registros: response.body!['@xdata.count'],
    value: response.body!.value,
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

export async function GetOrcamento(
  OrcamentoNumber: string | number,
): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token');

  const response = await CustomFetch<iOrcamento>(
    `${ROUTE_GET_ALL_ORCAMENTO}(${OrcamentoNumber})?$expand=VENDEDOR,CLIENTE,
    ItensOrcamento/PRODUTO/FORNECEDOR,ItensOrcamento/PRODUTO/FABRICANTE,ItensOrcamento,
    ItensOrcamento/PRODUTO,ItensOrcamento/ORCAMENTO,ItensOrcamento/PRODUTO/ListaChaves`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  const result: iOrcamento = response.body!;

  if (response.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }

  const itensOrcs: iItensOrcamento[] = response.body!.ItensOrcamento.map(
    (item) => {
      return { ...item, ORCAMENTO: response.body!.ORCAMENTO };
    },
  );

  return {
    value: {
      ...result,
      ItensOrcamento: itensOrcs,
    },
    error: undefined,
  };
}

export async function NewOrcamento(): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token_b2b');

  const cliente: iCliente = (await getClienteAction()).value!;

  const OrcamentoInsert: iOrcamentoInserir = {
    CodigoCliente: cliente.CLIENTE,
    CodigoVendedor1: cliente.VENDEDOR,
    Total: 0,
    SubTotal: 0,
    Itens: [],
  };

  const responseInsert = await CustomFetch<iApiResult<iOrcamento>>(
    ROUTE_SAVE_ORCAMENTO,
    {
      body: JSON.stringify(OrcamentoInsert),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (responseInsert.body.StatusCode !== 200) {
    return {
      value: undefined,
      error: {
        code: String(responseInsert.body.StatusCode),
        message: String(responseInsert.body.StatusMessage),
      },
    };
  }

  const response = await GetOrcamento(responseInsert.body.Data.ORCAMENTO);

  if (response.error !== undefined) {
    return {
      value: undefined,
      error: {
        code: response.error.code,
        message: response.error.message,
      },
    };
  }

  return {
    value: response.value,
    error: undefined,
  };
}

export async function UpdateOrcamento(orcamento: iOrcamento) {
  const tokenCookie = await getCookie('token');

  const responseInsert = await CustomFetch<iOrcamento>(
    `/Orcamento(${orcamento.ORCAMENTO})`,
    {
      body: JSON.stringify({
        OBS1: orcamento.OBS1,
        OBS2: orcamento.OBS2,
        PV: orcamento.PV,
      }),
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );
  if (responseInsert.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(responseInsert.status),
        message: String(responseInsert.statusText),
      },
    };
  }

  const response = await GetOrcamento(responseInsert.body!.ORCAMENTO);

  if (response.error !== undefined) {
    return {
      value: undefined,
      error: {
        code: response.error.code,
        message: response.error.message,
      },
    };
  }

  return {
    value: response.value,
    error: undefined,
  };
}

export async function RemoverOrcamento(orcamento: iOrcamento) {
  const tokenCookie = await getCookie('token');
  for (const item of orcamento.ItensOrcamento) {
    const result = await removeItem({
      pIdOrcamento: orcamento.ORCAMENTO,
      pProduto: item.PRODUTO.PRODUTO,
    });

    if (result.error) {
      return {
        value: undefined,
        error: result.error,
      };
    }
  }

  const responseRemove = await CustomFetch<any>(
    `/Orcamento(${orcamento.ORCAMENTO})`,
    {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (responseRemove.status !== 204) {
    return {
      value: undefined,
      error: {
        code: String(responseRemove.status),
        message: String(responseRemove.statusText),
      },
    };
  }

  return {
    value: 'Orçamento excluído com sucesso!',
    error: undefined,
  };
}

export async function removeItem(
  itemOrcamento: iItemRemove,
): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token');

  const data = await CustomFetch<iApiResult<iOrcamento>>(
    ROUTE_REMOVE_ITEM_ORCAMENTO,
    {
      body: JSON.stringify({
        pIdOrcamento: itemOrcamento.pIdOrcamento,
        pProduto: itemOrcamento.pProduto,
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  const response = await GetOrcamento(itemOrcamento.pIdOrcamento);

  if (response.error !== undefined) {
    return {
      value: undefined,
      error: {
        code: response.error.code,
        message: response.error.message,
      },
    };
  }

  if (data.status !== 200) {
    return {
      value: undefined,
      error: {
        code: String(data.status),
        message: String(data.statusText),
      },
    };
  }
  return {
    value: response.value,
    error: undefined,
  };
}

export async function addItem(itemOrcamento: iItemInserir) {
  const tokenCookie = await getCookie('token');
  const res = await CustomFetch<iApiResult<iOrcamento>>(
    ROUTE_SAVE_ITEM_ORCAMENTO,
    {
      body: JSON.stringify(itemOrcamento),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (res.body!.StatusCode !== 200) {
    return {
      value: undefined,
      error: {
        code: String(res.body!.StatusCode),
        message: String(res.body!.StatusMessage),
      },
    };
  }

  const response = await GetOrcamento(itemOrcamento.pIdOrcamento);

  if (response.error !== undefined) {
    return {
      value: undefined,
      error: {
        code: response.error.code,
        message: response.error.message,
      },
    };
  }

  return {
    value: response.value,
    error: undefined,
  };
}

export async function updateItem(itemOrcamento: iItemInserir) {
  const tokenCookie = await getCookie('token');

  const removeResult = await CustomFetch<iApiResult<iOrcamento>>(
    ROUTE_REMOVE_ITEM_ORCAMENTO,
    {
      body: JSON.stringify({
        pIdOrcamento: itemOrcamento.pIdOrcamento,
        pProduto: itemOrcamento.pItemOrcamento.CodigoProduto,
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (removeResult.body!.StatusCode !== 200) {
    return {
      value: undefined,
      error: {
        code: String(removeResult.body!.StatusCode),
        message: String(removeResult.body!.StatusMessage),
      },
    };
  }

  const resultSave = await CustomFetch<iApiResult<iOrcamento>>(
    ROUTE_SAVE_ITEM_ORCAMENTO,
    {
      body: JSON.stringify(itemOrcamento),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (resultSave.body!.StatusCode !== 200) {
    return {
      value: undefined,
      error: {
        code: String(resultSave.body!.StatusCode),
        message: String(resultSave.body!.StatusMessage),
      },
    };
  }

  const response = await GetOrcamento(itemOrcamento.pIdOrcamento);

  if (response.error !== undefined) {
    return {
      value: undefined,
      error: {
        code: response.error.code,
        message: response.error.message,
      },
    };
  }

  return {
    value: response.value,
    error: undefined,
  };
}

