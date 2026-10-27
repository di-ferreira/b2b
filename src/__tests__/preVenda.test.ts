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
import { SavePreVenda } from '@/app/actions/preVenda';

const mockCustomFetch = vi.mocked(CustomFetch);
const mockGetCookie = vi.mocked(getCookie);

function preVenda(extra: Record<string, unknown> = {}) {
  return {
    DataPedido: '2026-10-26',
    CodigoCliente: 1,
    CodigoVendedor1: 2,
    SubTotal: 100,
    Total: 100,
    ObsPedido1: '',
    ObsNotaFiscal: '',
    CodigoCondicaoPagamento: 3,
    ModeloNota: '55',
    NumeroOrdemCompraCliente: '',
    Entrega: 'N' as const,
    Itens: [
      {
        CodigoProduto: '00102',
        Qtd: 1,
        Valor: 100,
        SubTotal: 100,
        Frete: 0,
        Desconto: 0,
        Total: 100,
        Tabela: 'SISTEMA',
      },
    ],
    ...extra,
  };
}

function corpoEnviado(index: number) {
  return JSON.parse(String(mockCustomFetch.mock.calls[index][1]?.body));
}

function call(index: number) {
  return mockCustomFetch.mock.calls[index];
}

function okInsert(movimento = 10) {
  return {
    status: 200,
    statusText: 'OK',
    body: {
      StatusCode: 200,
      StatusMessage: 'sucesso',
      RecordCount: 0,
      Data: { MOVIMENTO: movimento, MOV: 'P1' },
    },
  } as never;
}

function okPatch(movimento = 10) {
  return {
    status: 200,
    statusText: 'OK',
    body: { MOVIMENTO: movimento, ORIGEM: 'B2B', ID_TIPO_VENDA: 1 },
  } as never;
}

describe('SavePreVenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCookie.mockResolvedValue('token');
  });

  it('faz POST de insert para NovaPreVenda e PATCH para complementar ORIGEM/ID_TIPO_VENDA', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(okInsert(12))
      .mockResolvedValueOnce(okPatch(12));

    const res = await SavePreVenda(preVenda());

    expect(mockCustomFetch).toHaveBeenCalledTimes(2);
    expect(String(call(0)[0])).toBe('/ServiceVendas/NovaPreVenda');
    expect(String(call(1)[0])).toBe('/Movimento(12)');
    expect(res.value?.MOVIMENTO).toBe(12);
    expect(res.error).toBeUndefined();
  });

  it('primeira chamada envia o pedido sem tentar forçar os campos no insert', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(okInsert(1))
      .mockResolvedValueOnce(okPatch(1));

    await SavePreVenda(preVenda());

    const corpo = corpoEnviado(0);
    expect(corpo.CodigoCliente).toBe(1);
    expect(corpo.CodigoCondicaoPagamento).toBe(3);
    expect(corpo.Itens).toHaveLength(1);
  });

  it('segunda chamada (PATCH) envia apenas ORIGEM e ID_TIPO_VENDA', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(okInsert(7))
      .mockResolvedValueOnce(okPatch(7));

    await SavePreVenda(preVenda());

    const corpo = corpoEnviado(1);
    const keys = Object.keys(corpo).sort();
    expect(keys).toEqual(['ID_TIPO_VENDA', 'ORIGEM']);
    expect(corpo.ORIGEM).toBe('B2B');
    expect(corpo.ID_TIPO_VENDA).toBe(1);
  });

  it('devolve erro quando o insert responde fora de 200', async () => {
    mockCustomFetch.mockResolvedValueOnce({
      status: 400,
      statusText: 'Bad Request',
      body: { StatusCode: 400, StatusMessage: 'Bad Request', RecordCount: 0, Data: null },
    } as never);

    const res = await SavePreVenda(preVenda());

    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
    expect(res.value).toBeUndefined();
    expect(res.error?.code).toBe('400');
  });

  it('mantém a pre-venda (insert) quando o PATCH falha', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(okInsert(99))
      .mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error',
        body: null,
      } as never);

    const res = await SavePreVenda(preVenda());

    expect(mockCustomFetch).toHaveBeenCalledTimes(2);
    expect(res.value?.MOVIMENTO).toBe(99);
    expect(res.error).toBeUndefined();
  });

  it('usa o método PATCH com Authorization na segunda chamada', async () => {
    mockCustomFetch
      .mockResolvedValueOnce(okInsert(3))
      .mockResolvedValueOnce(okPatch(3));

    await SavePreVenda(preVenda());

    expect(call(1)[1]?.method).toBe('PATCH');
    expect((call(1)[1]?.headers as Record<string, string>)['Authorization'])
      .toBe('bearer token');
  });
});