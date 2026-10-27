import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GetBancosBoleto, findBancoBoleto } from '@/app/actions/contas';

const PDFS_DIR = process.env.PDFS_DIR || '';

function normalizePath(value: string): string {
  return String(value ?? '').replace(/\\\\/g, '/').replace(/\\/g, '/');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
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

    const docSan = String(req.nextUrl.searchParams.get('doc') || '')
      .replace(/[^\w\d-]/g, '')
      .slice(0, 30);

    let fileBuffer: Buffer | null = null;
    let foundFileName: string | null = null;

    // 1) Caminho via BancoBoleto (PATH_GERARPDF)
    try {
      const bancos = await GetBancosBoleto();
      const bancoRegistro = await findBancoBoleto(banco, bancos);

      if (bancoRegistro?.PATH_GERARPDF) {
        const rawFolder = String(bancoRegistro.PATH_GERARPDF).trim();
        const isUnc = rawFolder.startsWith('\\\\');
        const folderPath = isUnc ? rawFolder : normalizePath(rawFolder);
        console.log('[boletos] folderPath =', JSON.stringify(folderPath));

        const candidateNames = [
          docSan ? `Boleto_${cic}_${docSan}_${nossoNumero}.pdf` : '',
          fileName,
        ].filter(Boolean) as string[];

        for (const cand of candidateNames) {
          const candidate = isUnc
            ? path.win32.join(folderPath, cand)
            : path.posix.normalize(`${folderPath}/${cand}`);
          if (fs.existsSync(candidate)) {
            fileBuffer = fs.readFileSync(candidate);
            foundFileName = cand;
            break;
          }
          console.log('[boletos] candidate não existe:', candidate);
        }

        // Heurística final quando DOC não vier: buscar arquivo que comece com
        // Boleto_<cic>_ e termine em _<nossoNumero>.pdf (qualquer segmento meio).
        if (!fileBuffer || !foundFileName) {
          try {
            const names = fs.readdirSync(folderPath);
            const pattern = new RegExp(
              `^Boleto_${escapeRegex(cic)}_(.*)_?${escapeRegex(nossoNumero)}\\.pdf$`,
              'i'
            );
            const match = names.find((n) => pattern.test(n));
            if (match) {
              const candidate = isUnc
                ? path.win32.join(folderPath, match)
                : path.posix.normalize(`${folderPath}/${match}`);
              fileBuffer = fs.readFileSync(candidate);
              foundFileName = match;
            }
          } catch (e) {
            console.warn('[boletos] readdir falhou:', e, 'folder=', folderPath);
          }
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
