import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/services/api', () => ({
  CustomFetch: vi.fn(),
}));

vi.mock('@/app/actions', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

import { CustomFetch } from '@/services/api';
import { setCookie } from '@/app/actions';
import { LoginUser } from '@/app/actions/user';

const mockCustomFetch = vi.mocked(CustomFetch);
const mockSetCookie = vi.mocked(setCookie);

const mockCliente = {
  CLIENTE: 1,
  NOME: 'Teste Cliente',
  ENDERECO: 'Rua Teste',
  BAIRRO: 'Centro',
  CIDADE: 'São Paulo',
  UF: 'SP',
  CEP: '01000000',
  CIC: '12345678909',
  TELEFONE: '11999999999',
  EMAIL: 'teste@email.com',
  BLOQUEADO: 'N',
  MOTIVO: '',
  USARLIMITE: 'S',
  LIMITE: 10000,
  VENDEDOR: 1,
  SENHA: '1515',
  TIPO_CLIENTE: 'FIEL',
};

describe('LoginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when vendaLogin fails', async () => {
    mockCustomFetch.mockResolvedValueOnce({
      status: 401,
      statusText: 'Unauthorized',
      body: { value: undefined, error: { code: '401', message: 'Invalid' } },
    });

    const result = await LoginUser({ cliente: '123', password: '1515' });

    expect(result.error).toBeDefined();
    expect(result.value).toBeUndefined();
  });

  it('returns error when client not found', async () => {
    mockCustomFetch
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        body: { value: 'mock-token', error: undefined },
      })
      .mockResolvedValueOnce({
        status: 404,
        statusText: 'Not Found',
        body: { value: [] },
      });

    const result = await LoginUser({ cliente: '999', password: '1515' });

    expect(result.error).toBeDefined();
    expect(result.value).toBeUndefined();
  });

  it('returns error when password does not match (plain text comparison)', async () => {
    mockCustomFetch
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        body: { value: 'mock-token', error: undefined },
      })
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        body: { value: [{ ...mockCliente, SENHA: '1515' }] },
      });

    const result = await LoginUser({ cliente: '12345678909', password: 'wrong' });

    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('unauthorized');
    expect(result.value).toBeUndefined();
  });

  it('succeeds when password matches (plain text comparison)', async () => {
    mockCustomFetch
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        body: { value: 'mock-token', error: undefined },
      })
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        body: { value: [{ ...mockCliente, SENHA: '1515' }] },
      });

    const result = await LoginUser({ cliente: '12345678909', password: '1515' });

    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();
    expect(result.value?.NOME).toBe('Teste Cliente');
    expect(result.value?.SENHA).toBe('');
    expect(mockSetCookie).toHaveBeenCalledWith('token_b2b', 'mock-token');
    expect(mockSetCookie).toHaveBeenCalledWith('user_b2b', '1');
    expect(mockSetCookie).toHaveBeenCalledWith('CIC', '12345678909');
  });

  it('strips SENHA from the returned client object', async () => {
    mockCustomFetch
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        body: { value: 'mock-token', error: undefined },
      })
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        body: { value: [{ ...mockCliente, SENHA: 'secret123' }] },
      });

    const result = await LoginUser({ cliente: '12345678909', password: 'secret123' });

    expect(result.value?.SENHA).toBe('');
  });
});
