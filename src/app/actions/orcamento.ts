'use server';
import { iApiResult, Response, ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import { iFilter } from '@/@types/Filter';
import {
  iItemInserir,
  iItemRemove,
  iItensOrcamento,
  iOrcamento,
  iOrcamentoInserir,
} from '@/@types/Orcamento';
import { iDataResultTable } from '@/@types/Table';
import { CustomFetch } from '@/services/api';
import dayjs from 'dayjs';
import { getCookie } from '.';
import { getClienteAction } from './user';
const ROUTE_GET_ALL_ORCAMENTO = '/Orcamento';
const ROUTE_SAVE_ORCAMENTO = '/ServiceVendas/NovoOrcamento';
const ROUTE_REMOVE_ITEM_ORCAMENTO = '/ServiceVendas/ExcluirItemOrcamento';
const ROUTE_SAVE_ITEM_ORCAMENTO = '/ServiceVendas/NovoItemOrcamento';

async function CreateFilter(filter: iFilter<iOrcamento>): Promise<string> {
  const VendedorLocal: string = await getCookie('user');

  let DataSql: string = ` and year(DATA) eq ${dayjs()
    .subtract(1, 'day')
    .format('YYYY')} and month(DATA) eq ${dayjs()
    .subtract(1, 'day')
    .format('MM')} and day(DATA) ge ${dayjs().subtract(1, 'day').format('DD')}`;

  if (filter.filter?.some((item) => item.key === 'PV' && item.value === 'S'))
    DataSql = '';

  let ResultFilter: string = `$filter=VENDEDOR eq ${VendedorLocal} ${DataSql}`;

  if (filter.filter && filter.filter.length >= 1) {
    ResultFilter = `$filter=VENDEDOR eq ${VendedorLocal} ${DataSql}`;
    const andStr = ' AND ';
    filter.filter.map((itemFilter) => {
      if (itemFilter.typeSearch)
        itemFilter.typeSearch === 'like'
          ? (ResultFilter = `${ResultFilter}${andStr} contains(${
              itemFilter.key
            }, '${String(itemFilter.value).toUpperCase()}')${andStr}`)
          : itemFilter.typeSearch === 'eq' &&
            (ResultFilter = `${ResultFilter}${andStr}${itemFilter.key} eq '${itemFilter.value}'${andStr}`);
      else
        ResultFilter = `${ResultFilter}${andStr} contains(${
          itemFilter.key
        }, '${String(itemFilter.value).toUpperCase()}')${andStr}`;
    });
    ResultFilter = ResultFilter.slice(0, -andStr.length);
  }

  const ResultOrderBy = filter.orderBy
    ? `&$orderby=${filter.orderBy}`
    : '&$orderby=ORCAMENTO desc';

  const ResultSkip = filter.skip ? `&$skip=${filter.skip}` : '&$skip=0';

  let ResultTop = filter.top ? `$top=${filter.top}` : '$top=15';

  ResultFilter !== '' && (ResultTop = `&${ResultTop}`);

  const ResultRoute: string = `?${ResultFilter}${ResultTop}${ResultSkip}${ResultOrderBy}&$expand=VENDEDOR,CLIENTE,
  ItensOrcamento/PRODUTO/FORNECEDOR,ItensOrcamento/PRODUTO/FABRICANTE,
  ItensOrcamento,ItensOrcamento/PRODUTO&$inlinecount=allpages`;
  return ResultRoute;
}

export async function LoadOrcamento(): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token');
  const ClienteLocal: string = await getCookie('user');
  const DataBusca: string = dayjs().format('YYYY-MM-DD');

  const response = await CustomFetch<Response<iOrcamento[]>>(
    `${ROUTE_GET_ALL_ORCAMENTO}?$filter=(PV eq 'N' or PV eq null) and DATA eq ${DataBusca} and CLIENTE eq ${ClienteLocal}&orderby=ORCAMENTO desc&$top=1&$expand=VENDEDOR,CLIENTE,
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
  console.log('orcamento response', response.body.value);

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

export async function GetOrcamentosFromVendedor(
  filter: iFilter<iOrcamento> | null | undefined
): Promise<ResponseType<iDataResultTable<iOrcamento>>> {
  const VendedorLocal: string = await getCookie('user');
  const tokenCookie = await getCookie('token');

  const FILTER = filter
    ? await CreateFilter(filter)
    : `?$filter=VENDEDOR eq ${VendedorLocal} and year(DATA) eq ${dayjs()
        .subtract(1, 'day')
        .format('YYYY')} and month(DATA) eq ${dayjs()
        .subtract(1, 'day')
        .format('MM')} and day(DATA) ge ${dayjs()
        .subtract(1, 'day')
        .format(
          'DD'
        )}&$orderby=ORCAMENTO desc&$top=10&$expand=VENDEDOR,CLIENTE,ItensOrcamento/PRODUTO/FORNECEDOR,ItensOrcamento/PRODUTO/FABRICANTE,ItensOrcamento,ItensOrcamento/PRODUTO&$inlinecount=allpages`;

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

export async function GetOrcamento(
  OrcamentoNumber: string | number
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

export async function NewOrcamento(): Promise<ResponseType<iOrcamento>> {
  const tokenCookie = await getCookie('token');
  const ClienteLocal: string = await getCookie('user');

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
    }
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
  const VendedorLocal: string = await getCookie('user');

  const itens = orcamento.ItensOrcamento.map((i) => {
    return { ...i, ORCAMENTO: String(i.ORCAMENTO) };
  });

  const responseInsert = await CustomFetch<iOrcamento>(
    `/Orcamento(${orcamento.ORCAMENTO})`,
    {
      body: JSON.stringify({
        OBS1: orcamento.OBS1,
        OBS2: orcamento.OBS2,
      }),
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    }
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

  const response = await GetOrcamento(responseInsert.body.ORCAMENTO);

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

export async function removeItem(
  itemOrcamento: iItemRemove
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
    }
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
    }
  );

  if (res.body.StatusCode !== 200) {
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
    }
  );

  if (removeResult.body.StatusCode !== 200) {
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
    }
  );

  if (resultSave.body.StatusCode !== 200) {
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

