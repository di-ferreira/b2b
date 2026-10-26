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

describe('SuperFindProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCookie.mockResolvedValue('token');
  });

  it('usa o SuperBusca e devolve o RecordCount do servidor', async () => {
    mockCustomFetch.mockResolvedValueOnce(
      response({
        StatusCode: 200,
        StatusMessage: 'sucesso',
        RecordCount: 42,
        Data: [produto('A1')],
      }),
    );

    const res = await SuperFindProducts('bomba', 10, 0);

    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
    expect(String(mockCustomFetch.mock.calls[0][0])).toContain(
      '/ServiceProdutos/SuperBusca?Palavras=bomba&PularRegistros=0&QuantidadeRegistros=10',
    );
    expect(res.error).toBeUndefined();
    expect(res.value?.Qtd_Registros).toBe(42);
    expect(res.value?.value[0].PRODUTO).toBe('A1');
  });

  it('cai para a busca SQL quando o SuperBusca não encontra nada', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(
        response({
          StatusCode: 400,
          StatusMessage: 'Não foi encontrado nenhum produto.',
          RecordCount: 0,
          Data: [],
        }),
      )
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
      .mockResolvedValueOnce(response({ Data: [{ TOTAL: 1 }] }));

    const res = await SuperFindProducts('4268', 10, 0);

    expect(mockCustomFetch).toHaveBeenCalledTimes(3);

    const sqlUrl = decodeURIComponent(String(mockCustomFetch.mock.calls[1][0]));
    expect(sqlUrl).toContain('/ServiceSistema/SelectSQL');
    expect(sqlUrl).toContain("LIKE '%4268%'");

    expect(res.value?.Qtd_Registros).toBe(1);
    expect(res.value?.value[0].PRODUTO).toBe('R42684');
  });

  it('não repete a busca SQL quando uma página seguinte vem vazia', async () => {
    mockCustomFetch.mockResolvedValueOnce(
      response({
        StatusCode: 400,
        StatusMessage: 'Não foi encontrado nenhum produto.',
        RecordCount: 0,
        Data: [],
      }),
    );

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
});
