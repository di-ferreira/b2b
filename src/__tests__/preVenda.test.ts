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
import { ID_TIPO_VENDA_B2B, SavePreVenda } from '@/app/actions/preVenda';

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

/** Corpo enviado ao serviço, já parseado do JSON. */
function corpoEnviado() {
  return JSON.parse(String(mockCustomFetch.mock.calls[0][1]?.body));
}

describe('SavePreVenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCookie.mockResolvedValue('token');
  });

  it('envia a pré-venda para /ServiceVendas/NovaPreVenda', async () => {
    mockCustomFetch.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      body: { MOV: 'P1' },
    } as never);

    const res = await SavePreVenda(preVenda());

    expect(String(mockCustomFetch.mock.calls[0][0])).toBe(
      '/ServiceVendas/NovaPreVenda',
    );
    expect(res.error).toBeUndefined();
  });

  it('sempre envia ID_TIPO_VENDA = 1 (B2B) ao gerar a pré-venda', async () => {
    mockCustomFetch.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      body: { MOV: 'P1' },
    } as never);

    await SavePreVenda(preVenda());

    expect(ID_TIPO_VENDA_B2B).toBe(1);
    expect(corpoEnviado().ID_TIPO_VENDA).toBe(1);
  });

  it('sobrepõe um ID_TIPO_VENDA diferente vindo do chamador', async () => {
    mockCustomFetch.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      body: { MOV: 'P1' },
    } as never);

    await SavePreVenda(preVenda({ ID_TIPO_VENDA: 9 }));

    expect(corpoEnviado().ID_TIPO_VENDA).toBe(1);
  });

  it('mantém os demais campos do pedido no corpo', async () => {
    mockCustomFetch.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      body: { MOV: 'P1' },
    } as never);

    await SavePreVenda(preVenda());

    const corpo = corpoEnviado();
    expect(corpo.CodigoCliente).toBe(1);
    expect(corpo.CodigoCondicaoPagamento).toBe(3);
    expect(corpo.Itens).toHaveLength(1);
  });

  it('devolve erro quando o serviço responde fora de 200', async () => {
    mockCustomFetch.mockResolvedValueOnce({
      status: 400,
      statusText: 'Bad Request',
      body: null,
    } as never);

    const res = await SavePreVenda(preVenda());

    expect(res.value).toBeUndefined();
    expect(res.error?.code).toBe('400');
  });
});
