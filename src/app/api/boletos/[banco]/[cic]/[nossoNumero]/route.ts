// import fs from 'fs';
// import { NextRequest, NextResponse } from 'next/server';
// import path from 'path';

// const PDFS_DIR = process.env.PDFS_DIR || '';

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { banco: string; cic: string; nossoNumero: string } }
// ) {
//   try {
//     let { banco, cic, nossoNumero } = params;
//     console.log('banco: ', banco);

//     // Normaliza banco igual seu código original
//     if (banco.toUpperCase() === 'CAIXA ECONOMICA') {
//       banco = 'caixa';
//     }
//     banco = banco.toLocaleLowerCase().trim().replaceAll(' ', '');

//     // Monta o nome do arquivo esperado
//     const fileName = `Boleto_${cic}_${nossoNumero}.pdf`;

//     // Constrói o caminho completo
//     const filePath = path.join(PDFS_DIR, banco, fileName);
//     console.log('filePath:', filePath);

//     if (!fs.existsSync(filePath)) {
//       return NextResponse.json(
//         { error: 'Boleto não encontrado' },
//         { status: 404 }
//       );
//     }

//     const fileBuffer = fs.readFileSync(filePath);

//     return new NextResponse(fileBuffer, {
//       headers: {
//         'Content-Type': 'application/pdf',
//         'Content-Disposition': `attachment; filename="${encodeURIComponent(
//           fileName
//         )}"`,
//         'Cache-Control': 'no-cache, no-store, must-revalidate',
//         Pragma: 'no-cache',
//         Expires: '0',
//       },
//     });
//   } catch (error) {
//     console.error('Erro ao gerar boleto:', error);
//     return NextResponse.json(
//       { error: 'Erro interno ao gerar boleto' },
//       { status: 500 }
//     );
//   }
// }

import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const PDFS_DIR = process.env.PDFS_DIR || '';

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
    // Se vier itau, tenta nas duas pastas
    return ['itau', 'itau2'];
  }

  // fallback: usa o normalizado
  return [normalized];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { banco: string; cic: string; nossoNumero: string } }
) {
  try {
    let { banco, cic, nossoNumero } = params;
    console.log('banco: ', banco);
    const fileName = `Boleto_${cic}_${nossoNumero}.pdf`;
    console.log('fileName: ', fileName);

    const possibleFolders = resolveBancoFolder(banco);

    let fileBuffer: Buffer | null = null;
    let foundFileName: string | null = null;

    for (const folder of possibleFolders) {
      const filePath = path.join(PDFS_DIR, folder, fileName);
      console.log('filePath: ', filePath);

      if (fs.existsSync(filePath)) {
        fileBuffer = fs.readFileSync(filePath);
        foundFileName = fileName;
        break;
      }

      console.log('foundFileName: ', foundFileName);
      console.log('fileBuffer: ', fileBuffer);
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
    console.error('Erro ao gerar boleto:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar boleto' },
      { status: 500 }
    );
  }
}

