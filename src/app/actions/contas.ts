'use server';
import { iBancoBoleto, iContas } from '@/@types/Contas';
import fs from 'fs';
import { CustomFetch } from '@/services/api';
import { NextResponse } from 'next/server';
import path from 'path';
import { getCookie } from '.';

const PDFS_DIR = process.env.PDFS_DIR || '';

const ROUTE_GET_BANCO_BOLETO = '/BancoBoleto';

// Cache curto para evitar chamada a cada download (ex.: 1 min).
let cacheBancos: { data: iBancoBoleto[]; expires: number } | null = null;

function normalizeBankName(value: string): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

export async function GetBancosBoleto(): Promise<iBancoBoleto[]> {
  const tokenCookie = await getCookie('token_b2b');
  if (cacheBancos && Date.now() < cacheBancos.expires) {
    return cacheBancos.data;
  }

  try {
    const response = await CustomFetch<{ value: iBancoBoleto[] }>(
      ROUTE_GET_BANCO_BOLETO,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${tokenCookie}`,
        },
      }
    );

    if (response.status !== 200 || !response.body?.value) {
      return cacheBancos?.data ?? [];
    }

    cacheBancos = {
      data: response.body.value,
      expires: Date.now() + 60_000,
    };
    return cacheBancos.data;
  } catch (error) {
    console.error('[GetBancosBoleto] erro:', error);
    return cacheBancos?.data ?? [];
  }
}

// Exportado como utilitário para reutilização na rota.
export async function findBancoBoleto(
  nome: string,
  bancos: iBancoBoleto[]
): Promise<iBancoBoleto | undefined> {
  const alvo = normalizeBankName(nome);
  return bancos.find((b) => normalizeBankName(b.NOME_BANCO) === alvo);
}
export async function GetBoletoCliente(conta: iContas): Promise<NextResponse> {
  try {
    let banco: string = conta.EMISSAO_BOLETO;
    if (banco === 'CAIXA ECONOMICA') {
      banco = 'caixa';
    }
    banco = banco.toLocaleLowerCase().trim().replaceAll(' ', '');

    // Monta o nome do arquivo esperado
    const fileName = `Boleto_${conta.CLIENTE.CIC}_${conta.NOSSO_NUMERO}.pdf`;

    // Constrói o caminho completo
    const filePath = path.join(PDFS_DIR, banco, fileName);

    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Boleto não encontrado para esta conta' },
        { status: 404 }
      );
    }

    // Lê o arquivo como buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Retorna como resposta de download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          fileName
        )}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno ao gerar boleto' },
      { status: 500 }
    );
  }
}

