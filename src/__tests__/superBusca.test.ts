import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  CustomFetch: vi.fn(),
}));

vi.mock('@/app/actions', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

import { CustomFetch } from '@/services/api';
import { getCookie } from '@/app/actions';
import { SuperFindProducts } from '@/app/actions/produto';

const mockCustomFetch = vi.mocked(CustomFetch);
const mockGetCookie = vi.mocked(getCookie);

function produto(codigo: string) {
  return {
    PRODUTO: codigo,
    REFERENCIA: codigo,
    NOME: `Produto ${codigo}`,
    PRECO: 10,
    QTDATUAL: 5,
  };
}

function response(body: unknown) {
  return { status: 200, statusText: 'OK', body } as never;
}

function superBuscaOk(codigos: string[], recordCount = 42) {
  return response({
    StatusCode: 200,
    StatusMessage: 'sucesso',
    RecordCount: recordCount,
    Data: codigos.map(produto),
  });
}

function superBuscaVazia() {
  return response({
    StatusCode: 400,
    StatusMessage: 'Não foi encontrado nenhum produto.',
    RecordCount: 0,
    Data: [],
  });
}

function estoqueLoja(
  linhas: { PRODUTO: string; LOJA?: string; ESTOQUE: number; PRECO: number }[],
) {
  return response({
    value: linhas.map((linha, idx) => ({
      $id: idx + 1,
      LOJA: 'Filial',
      ...linha,
    })),
  });
}

/** URL da requisição de estoque já decodificada (mais legível nas asserções). */
function estoqueUrl(index: number) {
  return decodeURIComponent(String(mockCustomFetch.mock.calls[index][0]));
}

describe('SuperFindProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCookie.mockResolvedValue('token');
  });

  it('usa o SuperBusca e devolve o RecordCount do servidor', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(superBuscaOk(['A1']))
      .mockResolvedValueOnce(estoqueLoja([]));

    const res = await SuperFindProducts('bomba', 10, 0);

    expect(mockCustomFetch).toHaveBeenCalledTimes(2);
    expect(String(mockCustomFetch.mock.calls[0][0])).toContain(
      '/ServiceProdutos/SuperBusca?Palavras=bomba&PularRegistros=0&QuantidadeRegistros=10',
    );
    expect(res.error).toBeUndefined();
    expect(res.value?.Qtd_Registros).toBe(42);
    expect(res.value?.value[0].PRODUTO).toBe('A1');
  });

  it('consulta a filial uma única vez por página e enriquece os produtos', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(superBuscaOk(['A1', 'A2']))
      .mockResolvedValueOnce(
        estoqueLoja([
          { PRODUTO: 'A1', ESTOQUE: 7, PRECO: 99.9 },
          { PRODUTO: 'A2', ESTOQUE: 0, PRECO: 12.5 },
        ]),
      );

    const res = await SuperFindProducts('bomba', 10, 0);

    expect(mockCustomFetch).toHaveBeenCalledTimes(2);

    const url = estoqueUrl(1);
    expect(url).toContain('/EstoqueFiliais');
    // lower(LOJA) porque o eq do XData é sensível à caixa do valor gravado.
    expect(url).toContain("lower(LOJA) eq 'filial'");
    expect(url).toContain("PRODUTO eq 'A1' or PRODUTO eq 'A2'");
    expect(url).toContain('$select=PRODUTO,LOJA,ESTOQUE,PRECO');
    expect(url).toContain('$top=2');

    const [primeiro, segundo] = res.value?.value ?? [];
    expect(primeiro.QTD_ES).toBe(7);
    expect(primeiro.PRECO_ES).toBe(99.9);
    // Loja com estoque zerado é diferente de produto sem linha na loja.
    expect(segundo.QTD_ES).toBe(0);
    expect(segundo.PRECO_ES).toBe(12.5);
  });

  it('mantém o produto sem QTD_ES/PRECO_ES quando não há linha na filial', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(superBuscaOk(['A1', 'A2']))
      .mockResolvedValueOnce(estoqueLoja([{ PRODUTO: 'A1', ESTOQUE: 3, PRECO: 5 }]));

    const res = await SuperFindProducts('bomba', 10, 0);

    const [comEstoque, semEstoque] = res.value?.value ?? [];
    expect(comEstoque.QTD_ES).toBe(3);
    expect(semEstoque.QTD_ES).toBeUndefined();
    expect(semEstoque.PRECO_ES).toBeUndefined();
  });

  it('não derruba a busca quando a consulta de estoque da filial falha', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockCustomFetch
      .mockResolvedValueOnce(superBuscaOk(['A1']))
      .mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error',
        body: null,
      } as never);

    const res = await SuperFindProducts('bomba', 10, 0);

    expect(res.error).toBeUndefined();
    expect(res.value?.value[0].PRODUTO).toBe('A1');
    expect(res.value?.value[0].QTD_ES).toBeUndefined();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('cai para a busca SQL quando o SuperBusca não encontra nada', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(superBuscaVazia())
      .mockResolvedValueOnce(
        response({
          Data: [
            {
              PRODUTO: 'R42684',
              REFERENCIA: 'VP7211',
              NOME: 'FLANGE',
              PRECO: 10,
              QTDATUAL: 1,
              FABRICANTE: 972,
              FABRICANTE_NOME: 'FABRICANTE TESTE',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(response({ Data: [{ TOTAL: 1 }] }))
      .mockResolvedValueOnce(
        estoqueLoja([{ PRODUTO: 'R42684', ESTOQUE: 4, PRECO: 77.7 }]),
      );

    const res = await SuperFindProducts('4268', 10, 0);

    expect(mockCustomFetch).toHaveBeenCalledTimes(4);

    const sqlUrl = decodeURIComponent(String(mockCustomFetch.mock.calls[1][0]));
    expect(sqlUrl).toContain('/ServiceSistema/SelectSQL');
    expect(sqlUrl).toContain("LIKE '%4268%'");

    // O estoque da filial também vale para o caminho SQL.
    expect(estoqueUrl(3)).toContain("PRODUTO eq 'R42684'");
    expect(res.value?.Qtd_Registros).toBe(1);
    expect(res.value?.value[0].PRODUTO).toBe('R42684');
    expect(res.value?.value[0].QTD_ES).toBe(4);
    expect(res.value?.value[0].PRECO_ES).toBe(77.7);
  });

  it('não repete a busca SQL quando uma página seguinte vem vazia', async () => {
    mockCustomFetch.mockResolvedValueOnce(superBuscaVazia());

    const res = await SuperFindProducts('4268', 10, 100);

    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
    expect(res.value?.value).toEqual([]);
    expect(res.value?.Qtd_Registros).toBe(0);
  });

  it('não chama a API quando o termo está vazio', async () => {
    const res = await SuperFindProducts('   ', 10, 0);

    expect(mockCustomFetch).not.toHaveBeenCalled();
    expect(res.value?.value).toEqual([]);
  });

  it('devolve erro da API quando a requisição falha', async () => {
    mockCustomFetch.mockResolvedValueOnce({
      status: 401,
      statusText: 'Unauthorized',
      body: null,
    } as never);

    const res = await SuperFindProducts('bomba', 10, 0);

    expect(res.error?.code).toBe('401');
  });

  it('não consulta a filial quando o SuperBusca devolve página sem produtos', async () => {
    mockCustomFetch.mockResolvedValueOnce(superBuscaOk([], 0));

    const res = await SuperFindProducts('bomba', 10, 0);

    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
    expect(res.value?.value).toEqual([]);
  });
});
