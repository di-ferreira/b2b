import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GetBancosBoleto, findBancoBoleto } from '@/app/actions/contas';

const PDFS_DIR = process.env.PDFS_DIR || '';

function normalizePath(value: string): string {
  return String(value ?? '').replace(/\\\\/g, '/').replace(/\\/g, '/');
}

function resolveBancoFolder(bancoRaw: string): string[] {
  const normalized = bancoRaw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '');
  if (normalized === 'caixaeconomica' || normalized === 'caixa') {
    return ['caixa'];
  }
  if (normalized === 'bradesco' || normalized === 'bradesconovo') {
    return ['bradesco'];
  }
  if (normalized === 'bancodobrasil' || normalized === 'bb') {
    return ['bancodobrasil'];
  }
  if (normalized.startsWith('itau')) {
    return ['itau', 'itau2'];
  }
  return [normalized];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { banco: string; cic: string; nossoNumero: string } }
) {
  try {
    const { banco, cic, nossoNumero } = params;

    if (!/^\d+$/.test(cic) || !/^\d+$/.test(nossoNumero)) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    const fileName = `Boleto_${cic}_${nossoNumero}.pdf`;

    let fileBuffer: Buffer | null = null;
    let foundFileName: string | null = null;

    // 1) Caminho via BancoBoleto (PATH_GERARPDF)
    try {
      const bancos = await GetBancosBoleto();
      const bancoRegistro = await findBancoBoleto(banco, bancos);

      if (bancoRegistro?.PATH_GERARPDF) {
        const folderPath = normalizePath(bancoRegistro.PATH_GERARPDF);
        const candidate = path.posix.normalize(`${folderPath}/${fileName}`);
        if (fs.existsSync(candidate)) {
          fileBuffer = fs.readFileSync(candidate);
          foundFileName = fileName;
        }
      }
    } catch (err) {
      console.warn('[boletos] falha ao consultar BancoBoleto:', err);
    }

    // 2) Fallback legado: PDFS_DIR/banco/folder/Boleto_...pdf
    if (!fileBuffer || !foundFileName) {
      const possibleFolders = resolveBancoFolder(banco);

      for (const folder of possibleFolders) {
        if (!/^[a-z0-9]+$/.test(folder)) {
          return NextResponse.json(
            { error: 'Parâmetro banco inválido' },
            { status: 400 }
          );
        }
      }

      for (const folder of possibleFolders) {
        const filePath = path.join(PDFS_DIR, folder, fileName);
        if (fs.existsSync(filePath)) {
          fileBuffer = fs.readFileSync(filePath);
          foundFileName = fileName;
          break;
        }
      }
    }

    if (!fileBuffer || !foundFileName) {
      return NextResponse.json(
        { error: 'Boleto não encontrado' },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          foundFileName
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
