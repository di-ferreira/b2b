import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

const PDFS_DIR = process.env.PDFS_DIR || '';
if (!PDFS_DIR) {
  throw new Error('PDFS_DIR não definido. Verifique .env.local');
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"|?*]/g, '').trim();
}

export async function GET(request: NextRequest) {
  const fileName = request.url.split('/').pop();

  if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
  }

  const filePath = join(PDFS_DIR, fileName);

  try {
    await stat(filePath);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }

  const stream = createReadStream(filePath);
  const webStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
    cancel() {
      stream.destroy();
    },
  });

  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(fileName)}"`,
  );
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  return new NextResponse(webStream, { headers });
}

