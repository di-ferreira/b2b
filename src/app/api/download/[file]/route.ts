import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { file: string } }
) {
  try {
    // Caminho da pasta no servidor Windows
    const pdfDir = process.env.PDFS_DIR || '';

    // Garante que o nome do arquivo não tem path traversal (..)
    const fileName = path.basename(params.file);

    const filePath = path.join(pdfDir, fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao ler PDF:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

