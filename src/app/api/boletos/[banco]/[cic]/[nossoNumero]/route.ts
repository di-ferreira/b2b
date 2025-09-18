import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const PDFS_DIR = process.env.PDFS_DIR || '';

export async function GET(
  req: NextRequest,
  { params }: { params: { banco: string; cic: string; nossoNumero: string } }
) {
  try {
    let { banco, cic, nossoNumero } = params;

    // Normaliza banco igual seu código original
    if (banco.toUpperCase() === 'CAIXA ECONOMICA') {
      banco = 'caixa';
    }
    banco = banco.toLocaleLowerCase().trim().replaceAll(' ', '');

    // Monta o nome do arquivo esperado
    const fileName = `Boleto_${cic}_${nossoNumero}.pdf`;

    // Constrói o caminho completo
    const filePath = path.join(PDFS_DIR, banco, fileName);
    console.log('filePath:', filePath);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Boleto não encontrado' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

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

