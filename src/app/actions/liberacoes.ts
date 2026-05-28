'use server';
import { iApiResultBody, ResponseType } from '@/@types';
import { iFilter, iFilterQuery } from '@/@types/Filter';
import { iLiberacoes } from '@/@types/Liberacoes';
import { iDataResultTable } from '@/@types/Table';
import { toIntSafe } from '@/lib/utils';
import { CustomFetch } from '@/services/api';
import dayjs from 'dayjs';
import { getCookie } from '.';
import { getVendedorAction } from './vendedor';

const ROUTE_GET_ALL_LIBERACOES = '/Liberacoes';

function ReturnFilterQuery(typeSearch: iFilterQuery<iLiberacoes>): string {
  // Tratamento especial para valores nulos
  if (typeSearch.value === null) {
    return typeSearch.typeSearch === 'ne'
      ? `${typeSearch.key} ne null`
      : `${typeSearch.key} eq null`;
  }

  // Tratamento para operações numéricas
  if (['CHAVE', 'ID_ONDE'].includes(String(typeSearch.key))) {
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
        typeSearch.value,
      ).toUpperCase()}')`;

    case 'eq':
      return `${typeSearch.key} eq '${typeSearch.value}'`;

    case 'ne':
      return `${typeSearch.key} ne '${typeSearch.value}'`;

    default:
      return `contains(${typeSearch.key}, '${String(
        typeSearch.value,
      ).toUpperCase()}')`;
  }
}

async function CreateQueryParams(
  filter: iFilter<iLiberacoes>,
): Promise<string> {
  // 1. Separação dos filtros por campo
  const groupedFilters: { [key: string]: iFilterQuery<iLiberacoes>[] } = {};

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
    const groupOperator = items[0].groupOperator; // || (key === 'ONDE' ? 'or' : 'and');

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
  const VendedorLocal: string = await getCookie('user_b2b');

  let dateFilter = '';
  dateFilter = `DATA_HORA ge ${dayjs()
    .subtract(1, 'day')
    .format('YYYY-MM-DD HH:mm')}`;
  conditions.push(dateFilter);

  // Filtro do vendedor (sempre presente)
  conditions.unshift(`QUEM eq ${VendedorLocal}`);

  // 4. Monta a string final
  const filterString = conditions.length
    ? `$filter=${conditions.join(' and ')}`
    : '';

  // 5. Parâmetros de paginação e ordenação
  const ResultTop = filter.top ? `&$top=${filter.top}` : '&$top=15';
  const ResultSkip = filter.skip ? `&$skip=${filter.skip}` : '&$skip=0';
  const ResultOrderBy = filter.orderBy
    ? `&$orderby=${filter.orderBy}`
    : '&$orderby=ORCAMENTO desc';

  // 6. Monta URL final
  return `?${filterString}${ResultTop}${ResultSkip}${ResultOrderBy}&$inlinecount=allpages`;
}

export async function CreateLiberacao(
  liberacao: iLiberacoes,
): Promise<ResponseType<iLiberacoes>> {
  const tokenCookie = await getCookie('token');

  const response = await CustomFetch<iApiResultBody<iLiberacoes>>(
    `${ROUTE_GET_ALL_LIBERACOES}`,
    {
      method: 'POST',
      body: JSON.stringify(liberacao),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );
  console.log('CreateLiberacao response', response);
  if (response.status !== 201) {
    return {
      value: undefined,
      error: {
        code: String(response.status),
        message: String(response.statusText),
      },
    };
  }

  return {
    value: response.body as unknown as iLiberacoes,
    error: undefined,
  };
}

export async function UpdateLiberacao(
  liberacao: iLiberacoes,
): Promise<ResponseType<iLiberacoes>> {
  const tokenCookie = await getCookie('token');

  const response = await CustomFetch<iApiResultBody<iLiberacoes>>(
    `${ROUTE_GET_ALL_LIBERACOES}(${liberacao.ID})`,
    {
      method: 'PUT',
      body: JSON.stringify({
        ...liberacao,
        ID_ONDE: toIntSafe(liberacao.ID_ONDE),
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenCookie}`,
      },
    },
  );
  console.log('UpdateLiberacao response', response);

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
    value: response.body as unknown as iLiberacoes,
    error: undefined,
  };
}

export async function LoadLiberacao(
  filter?: iFilter<iLiberacoes> | null | undefined,
): Promise<ResponseType<iDataResultTable<iLiberacoes>>> {
  const tokenCookie = await getCookie('token');
  const VendedorLocal: string = await getCookie('user_b2b');

  const FILTER = filter
    ? await CreateQueryParams(filter)
    : `?$filter=USADO eq 'N' and QUEM eq ${VendedorLocal} and DATA_HORA ge ${dayjs()
        .subtract(1, 'day')
        .format(
          'YYYY-MM-DD HH:mm',
        )}&$orderby=iddesc&$top=50&$inlinecount=allpages`;

  const response = await CustomFetch<{
    '@xdata.count': number;
    value: iLiberacoes[];
  }>(`${ROUTE_GET_ALL_LIBERACOES}${FILTER}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });

  const result: iDataResultTable<iLiberacoes> = {
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

export async function LoadLiberacaoCliente(
  cliente: number,
  codigo: string,
): Promise<ResponseType<iLiberacoes>> {
  const tokenCookie = await getCookie('token');

  const URL = `?$filter=CHAVE eq ${cliente} and CODIGO eq '${codigo}'&$top=1&$orderby=DATA_HORA desc`;

  const response = await CustomFetch<{
    value: iLiberacoes[];
  }>(`${ROUTE_GET_ALL_LIBERACOES}${URL}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${tokenCookie}`,
    },
  });

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
    value: response.body?.value[0],
    error: undefined,
  };
}

export async function Liberacoes(
  param: iLiberacoes,
): Promise<ResponseType<iLiberacoes>> {
  const agora = dayjs().format('YYYY-MM-DDTHH:mm:ss');
  const vendedor = await getVendedorAction();
  const nomeVendedor = ('Ven:' + (vendedor.value?.NOME || 'S/N')).substring(
    0,
    10,
  );

  const responseBusca = await LoadLiberacaoCliente(param.CHAVE, param.CODIGO);
  const liberacaoExistente = responseBusca.value;

  console.log('responseBusca liberacaoExistente', liberacaoExistente);

  const dadosNovaLiberacao: iLiberacoes = {
    ...param,
    ID: 0,
    DATA_HORA: agora,
    QUEM: nomeVendedor,
    ONDE: 'PRÉ-VENDA',
    ID_ONDE: Number(9999),
    USADO: 'N',
  };

  let resultLiberacao: ResponseType<iLiberacoes> =
    {} as ResponseType<iLiberacoes>;

  if (!liberacaoExistente)
    resultLiberacao = {
      value: (await CreateLiberacao(dadosNovaLiberacao)).value!,
      error: undefined,
    };
  console.log('responseBusca resultLiberacao1', resultLiberacao);

  if (liberacaoExistente !== undefined) {
    if (liberacaoExistente.ID_ONDE === 9999) {
      resultLiberacao = {
        value: (
          await UpdateLiberacao({
            ...liberacaoExistente,
            ID_ONDE: toIntSafe(param.ID_ONDE),
            DATA_HORA: agora,
            OBS: param.OBS || liberacaoExistente.OBS,
          })
        ).value!,
        error: undefined,
      };
    }
    console.log('responseBusca resultLiberacao2', resultLiberacao);

    if (liberacaoExistente.USADO === 'S') {
      resultLiberacao = {
        value: (await CreateLiberacao(dadosNovaLiberacao)).value!,
        error: undefined,
      };
      console.log('responseBusca resultLiberacao3', resultLiberacao);
    } else {
      const updateLiberacao = await UpdateLiberacao({
        ...liberacaoExistente,
        USADO: 'S',
        DATA_HORA: agora,
        ONDE: param.ONDE,
      });
      console.log('responseBusca updateLiberacao', updateLiberacao);
      resultLiberacao = {
        value: updateLiberacao.value!,
        error: undefined,
      };
      console.log('responseBusca resultLiberacao4', resultLiberacao);
    }
  }
  return resultLiberacao;
}

export async function SolicitarLiberacao(
  param: iLiberacoes,
): Promise<ResponseType<iLiberacoes>> {
  const agora = dayjs().format('YYYY-MM-DDTHH:mm:ss');
  const vendedor = await getVendedorAction();
  const nomeVendedor = ('Ven:' + (vendedor.value?.NOME || 'S/N')).substring(
    0,
    10,
  );

  const liberacaoExistente = (
    await LoadLiberacaoCliente(param.CHAVE, param.CODIGO)
  ).value;

  // Já existe aguardando ERP
  if (liberacaoExistente && liberacaoExistente.ID_ONDE === 9999) {
    return { value: liberacaoExistente, error: undefined };
  }

  // Já existe liberada e não usada
  if (
    liberacaoExistente &&
    liberacaoExistente.ID_ONDE !== 9999 &&
    liberacaoExistente.USADO === 'N'
  ) {
    return { value: liberacaoExistente, error: undefined };
  }

  // Criar nova solicitação
  const novaLiberacao: iLiberacoes = {
    ...param,
    ID: 0,
    DATA_HORA: agora,
    QUEM: nomeVendedor,
    ONDE: 'PRÉ-VENDA',
    ID_ONDE: 9999, // aguardando ERP
    USADO: 'N',
  };

  return await CreateLiberacao(novaLiberacao);
}

export async function ValidarLiberacao(
  cliente: number,
  codigo: string,
): Promise<ResponseType<iLiberacoes>> {
  return await LoadLiberacaoCliente(cliente, codigo);
}

export async function MarcarLiberacaoComoUsada(
  liberacao: iLiberacoes,
): Promise<ResponseType<iLiberacoes>> {
  const agora = dayjs().format('YYYY-MM-DDTHH:mm:ss');

  return await UpdateLiberacao({
    ...liberacao,
    USADO: 'S',
    DATA_HORA: agora,
  });
}

