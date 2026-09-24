'use server';
import { iApiResult, iResultApi, ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import { iProduto } from '@/@types/Produto';
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
const ROUTE_SELECT_SQL = '/ServiceSistema/SelectSQL';

async function loadOrcamentoItems(
  orcamentoId: number,
): Promise<iItensOrcamento[]> {
  const tokenCookie = await getCookie('token_b2b');

  const sqlItems = `SELECT ORCAMENTO, PRODUTO, QTD, VALOR, TOTAL, SUBTOTAL, DESCONTO, TABELA, OBS, MD5, ITEM, PRECO_LIQUIDO, ID_VALE_CASCO, IMP_SEPARACAO, P_DESC, GORDURA FROM IOC WHERE ORCAMENTO = ${orcamentoId}`;
  const encodedItems = encodeURIComponent(sqlItems);

  const resItems = await CustomFetch<{ Data: any[] }>(
    `${ROUTE_SELECT_SQL}?pSQL=${encodedItems}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (resItems.status !== 200) {
    console.error('[loadOrcamentoItems] IOC query failed:', resItems.status, JSON.stringify(resItems.body)?.slice(0, 300));
    return [];
  }

  if (!resItems.body?.Data?.length) {
    return [];
  }

  const productCodes = resItems.body.Data.map((item) => item.PRODUTO);
  const codesIn = productCodes.map((c) => `'${c}'`).join(',');

  const sqlProducts = `SELECT PRODUTO, REFERENCIA, NOME, PRECO, QTDATUAL, QTD_GARANTIA, APLICACOES, VENDA, TRANCAR, ATIVO, FABRICANTE FROM EST WHERE PRODUTO IN (${codesIn})`;
  const encodedProducts = encodeURIComponent(sqlProducts);

  const resProducts = await CustomFetch<{ Data: any[] }>(
    `${ROUTE_SELECT_SQL}?pSQL=${encodedProducts}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  const productMap: Record<string, iProduto> = {};
  if (resProducts.status === 200 && resProducts.body?.Data) {
    for (const prod of resProducts.body.Data) {
      productMap[prod.PRODUTO] = prod as iProduto;
    }
  } else {
    console.error('[loadOrcamentoItems] EST query failed:', resProducts.status, JSON.stringify(resProducts.body)?.slice(0, 300));
  }

  return resItems.body.Data.map((item) => ({
    ...item,
    ORCAMENTO: orcamentoId,
    PRODUTO: productMap[item.PRODUTO] || (item.PRODUTO as unknown as iProduto),
  }));
}

export async function LoadOrcamento(): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token_b2b');
  const ClienteLocal: string = await getCookie('user_b2b');

  const response = await CustomFetch<iResultApi<iOrcamento>>(
    `${ROUTE_GET_ALL_ORCAMENTO}?$filter=(PV eq 'N' or PV eq null) and CLIENTE eq ${ClienteLocal}&orderby=ORCAMENTO desc&$top=1&$expand=VENDEDOR,CLIENTE`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (response.status !== 200) {
    console.error('[LoadOrcamento] API error:', response.status, response.statusText, JSON.stringify(response.body)?.slice(0, 500));
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }

  const result: iOrcamento | undefined = response.body?.value?.[0];

  if (result === undefined) {
    console.error('[LoadOrcamento] No orcamento found for CLIENTE:', ClienteLocal, 'body:', JSON.stringify(response.body)?.slice(0, 300));
    return {
      value: undefined,
      error: {
        code: '404',
        message: 'Not Found',
      },
    };
  }

  let itensOrcs: iItensOrcamento[] = [];
  try {
    itensOrcs = await loadOrcamentoItems(result.ORCAMENTO);
  } catch (err) {
    console.error('[LoadOrcamento] loadOrcamentoItems failed:', err);
  }

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
  const VendedorLocal: string = await getCookie('user_b2b');
  const Vendedor: iVendedor = (await getVendedorAction()).value!;
  const tokenCookie = await getCookie('token_b2b');
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
  ).expand('VENDEDOR', 'CLIENTE', 'ItensOrcamento');

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
  const tokenCookie = await getCookie('token_b2b');

  const response = await CustomFetch<iOrcamento>(
    `${ROUTE_GET_ALL_ORCAMENTO}(${OrcamentoNumber})?$expand=VENDEDOR,CLIENTE`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (response.status !== 200 || !response.body) {
    console.error('[GetOrcamento] API error for ORC:', OrcamentoNumber, response.status, JSON.stringify(response.body)?.slice(0, 300));
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }

  const result: iOrcamento = response.body;

  let itensOrcs: iItensOrcamento[] = [];
  try {
    itensOrcs = await loadOrcamentoItems(result.ORCAMENTO);
  } catch (err) {
    console.error('[GetOrcamento] loadOrcamentoItems failed:', err);
  }

  return {
    value: {
      ...result,
      ItensOrcamento: itensOrcs,
    },
    error: undefined,
  };
}

async function resolveVendedor(clienteId: number, clienteVendedor: number): Promise<number> {
  if (clienteVendedor && clienteVendedor > 0) {
    return clienteVendedor;
  }

  const tokenCookie = await getCookie('token_b2b');

  const sql = `SELECT VENDEDOR FROM ORC WHERE CLIENTE = ${clienteId} AND VENDEDOR > 0 ORDER BY ORCAMENTO DESC`;
  const encoded = encodeURIComponent(sql);

  const res = await CustomFetch<{ Data: any[] }>(
    `${ROUTE_SELECT_SQL}?pSQL=${encoded}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (res.status === 200 && res.body?.Data?.length) {
    return res.body.Data[0].VENDEDOR;
  }

  const sqlFallback = `SELECT VENDEDOR FROM VEN WHERE ATIVO = 'S'`;
  const encodedFallback = encodeURIComponent(sqlFallback);

  const resFallback = await CustomFetch<{ Data: any[] }>(
    `${ROUTE_SELECT_SQL}?pSQL=${encodedFallback}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );

  if (resFallback.status === 200 && resFallback.body?.Data?.length) {
    return resFallback.body.Data[0].VENDEDOR;
  }

  throw new Error('No valid vendedor found for client or system');
}

export async function NewOrcamento(): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token_b2b');

  const clienteResult = await getClienteAction();
  if (!clienteResult.value) {
    console.error('[NewOrcamento] getClienteAction failed:', clienteResult.error);
    return {
      value: undefined,
      error: clienteResult.error || { code: '500', message: 'Failed to get client' },
    };
  }
  const cliente: iCliente = clienteResult.value;

  let vendedor: number;
  try {
    vendedor = await resolveVendedor(cliente.CLIENTE, cliente.VENDEDOR);
  } catch (err) {
    console.error('[NewOrcamento] resolveVendedor failed:', err);
    return {
      value: undefined,
      error: { code: '500', message: 'Failed to resolve vendedor' },
    };
  }

  const OrcamentoInsert: iOrcamentoInserir = {
    CodigoCliente: cliente.CLIENTE,
    CodigoVendedor1: vendedor,
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

  if (responseInsert.status !== 200 || responseInsert.body?.StatusCode !== 200) {
    console.error('[NewOrcamento] POST NovoOrcamento failed:', responseInsert.status, JSON.stringify(responseInsert.body)?.slice(0, 300));
    return {
      value: undefined,
      error: {
        code: String(responseInsert.body?.StatusCode || responseInsert.status),
        message: String(responseInsert.body?.StatusMessage || responseInsert.statusText),
      },
    };
  }

  const response = await GetOrcamento(responseInsert.body.Data.ORCAMENTO);

  if (response.error !== undefined) {
    console.error('[NewOrcamento] GetOrcamento failed:', response.error);
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
  const tokenCookie = await getCookie('token_b2b');

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
  const tokenCookie = await getCookie('token_b2b');
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
  const tokenCookie = await getCookie('token_b2b');

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
  const tokenCookie = await getCookie('token_b2b');
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

  if (!res.body) {
    console.error('[addItem] NovoItemOrcamento returned null body:', res.status, res.statusText);
    return {
      value: undefined,
      error: {
        code: String(res.status),
        message: `API retornou resposta vazia (${res.status})`,
      },
    };
  }

  if (res.body.StatusCode !== 200) {
    console.error('[addItem] NovoItemOrcamento error:', res.body.StatusCode, res.body.StatusMessage);
    return {
      value: undefined,
      error: {
        code: String(res.body.StatusCode),
        message: String(res.body.StatusMessage),
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
  const tokenCookie = await getCookie('token_b2b');

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

  if (!removeResult.body) {
    console.error('[updateItem] ExcluirItemOrcamento returned null body:', removeResult.status, removeResult.statusText);
    return {
      value: undefined,
      error: {
        code: String(removeResult.status),
        message: `API retornou resposta vazia ao excluir item (${removeResult.status})`,
      },
    };
  }

  if (removeResult.body.StatusCode !== 200) {
    console.error('[updateItem] ExcluirItemOrcamento error:', removeResult.body.StatusCode, removeResult.body.StatusMessage);
    return {
      value: undefined,
      error: {
        code: String(removeResult.body.StatusCode),
        message: String(removeResult.body.StatusMessage),
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

  if (!resultSave.body) {
    console.error('[updateItem] NovoItemOrcamento returned null body:', resultSave.status, resultSave.statusText);
    return {
      value: undefined,
      error: {
        code: String(resultSave.status),
        message: `API retornou resposta vazia ao salvar item (${resultSave.status})`,
      },
    };
  }

  if (resultSave.body.StatusCode !== 200) {
    console.error('[updateItem] NovoItemOrcamento error:', resultSave.body.StatusCode, resultSave.body.StatusMessage);
    return {
      value: undefined,
      error: {
        code: String(resultSave.body.StatusCode),
        message: String(resultSave.body.StatusMessage),
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

