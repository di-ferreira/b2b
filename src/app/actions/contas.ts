'use server';
import { iContas } from '@/@types/Contas';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

const PDFS_DIR = process.env.PDFS_DIR || '';

if (!PDFS_DIR) {
  throw new Error(
    'Variável de ambiente PDFS_DIR não definida. Verifique .env.local'
  );
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
    console.log('filePath: ', filePath);

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
    console.error('Erro ao gerar boleto:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar boleto' },
      { status: 500 }
    );
  }
}

