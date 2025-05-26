import fs from 'fs';
import type { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(req: NextRequest, res: NextResponse) {
  const dir = path.join(process.cwd(), 'public/banners');
  try {
    const files = fs
      .readdirSync(dir)
      .filter((file) => /\.(jpe?g|png|gif|webp)$/i.test(file));
    // res.status(200).json({ images: files });
    return new Response(JSON.stringify(files), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // res.status(500).json({ error: 'Erro ao ler imagens', details: err });
    return new Response(
      JSON.stringify({ error: 'Erro ao ler imagens', details: err }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

