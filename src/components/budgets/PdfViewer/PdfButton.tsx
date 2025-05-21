'use client';
import { iOrcamento } from '@/@types/Orcamento';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useRef } from 'react';
import LogoAutoSul from '../../../../public/LogoAutosul.png';

const OpenPDF = dynamic(
  () => import('./PdfViewer').then((mod) => mod.OpenPDF),
  { ssr: false }
);
const DownloadPDF = dynamic(
  () => import('./PdfViewer').then((mod) => mod.DownloadPDF),
  { ssr: false }
);

interface iGeneratePDF {
  orc: iOrcamento;
}
const GeneratePDF: React.FC<iGeneratePDF> = ({ orc }) => {
  const formatDate = (date: Date | number): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };
  const printRef = useRef(null);
  const DataAtual = formatDate(new Date());

  return (
    <main className='flex flex-col min-h-[50%] h-full mx-6 my-5 font-montserrat'>
      <section
        ref={printRef}
        className='w-full h-[85%] font-medium text-gray-900 border-solid border-black overflow-hidden'
      >
        {/* header  */}
        <header className='w-full'>
          <div className='gap-x-4 text-xs flex mb-5'>
            <div className='w-[25%] tablet-portrait:w-[35%]  h-auto min-h-[65px] mt-1 ml-1'>
              <Image src={LogoAutoSul} alt={'Logo'} className='w-full h-full' />
            </div>

            <div className='w-[75%] flex flex-col gap-y-3 mx-1'>
              <div className='flex gap-x-1'>
                <p className='capitalize'>data:</p>
                <p className='w-[85%] text-gray-900 border-b-[1px] border-solid border-black pl-1 pr-4 text-ellipsis font-bold pb-1'>
                  {DataAtual}
                </p>
              </div>

              <div className='flex gap-x-1'>
                <p className='capitalize'>cliente:</p>
                <p className='w-[85%] text-gray-900 border-b-[1px] border-solid border-black pl-1 pr-4 text-ellipsis font-bold pb-1'>
                  {orc.CLIENTE.NOME}
                </p>
              </div>

              <div className='flex gap-x-1'>
                <p className='capitalize'>vendedor:</p>
                <p className='w-[85%] text-gray-900 border-b-[1px] border-solid border-black pl-1 pr-4 text-ellipsis font-bold pb-1'>
                  {orc.VENDEDOR.NOME}
                </p>
              </div>

              <div className='flex gap-x-1'>
                <p className='capitalize'>nº orçamento:</p>
                <p className='w-[85%] tablet-portrait:w-[75%] text-gray-900 border-b-[1px] border-solid border-black pl-1 pr-4 text-ellipsis font-bold pb-1'>
                  {orc.ORCAMENTO}
                </p>
              </div>
            </div>
          </div>

          <div
            className='my-1 bg-black h-[2px]'
            style={{
              margin: '5px 0',
              backgroundColor: '#000',
              height: '2px',
            }}
          ></div>
        </header>
        {/* body */}
        <section className='w-full h-full min-h-[50vh] flex flex-col justify-between overflow-x-hidden overflow-y-auto'>
          {/* Tabela */}
          <div className='flex flex-grow flex-col w-auto'>
            {/* Cabeçalho da Tabela */}
            <header className='flex text-gray-900 border-solid border-black border-b max-h-[35px] overflow-hidden bg-white font-bold'>
              <div className='w-[25%] p-1 text-center'>
                <p className='text-xs'>Produto</p>
              </div>
              <div className='w-[10%] p-1 text-center'>
                <p className='text-xs'>Qtd</p>
              </div>

              <div className='w-[30%] p-1 text-center text-ellipsis text-nowrap whitespace-nowrap overflow-hidden'>
                <p className='text-xs text-center text-ellipsis text-nowrap whitespace-nowrap overflow-hidden'>
                  Descrição
                </p>
              </div>

              <div className='w-[15%] p-1 text-right'>
                <p className='text-xs'>Valor</p>
              </div>

              <div className='w-[20%] p-1 text-right'>
                <p className='text-xs'>Total</p>
              </div>
            </header>

            {/* Linhas da Tabela */}
            {orc.ItensOrcamento.map((item, idx) => (
              <div
                key={idx}
                className='flex text-gray-900 border-solid border-black border-b max-h-[35px] overflow-hidden bg-white font-bold'
              >
                <div className='w-[25%] p-1 text-center'>
                  <p className='text-xs'>{item.PRODUTO.PRODUTO}</p>
                </div>
                <div className='w-[10%] p-1 text-center'>
                  <p className='text-xs'>{item.QTD}</p>
                </div>
                <div className='w-[30%] p-1 text-center text-ellipsis text-nowrap whitespace-nowrap overflow-hidden'>
                  <p className='text-xs text-center text-ellipsis text-nowrap whitespace-nowrap overflow-hidden'>
                    {item.PRODUTO.APLICACOES}
                  </p>
                </div>
                <div className='w-[15%] p-1 text-right'>
                  <p className='text-xs'>
                    {item.VALOR.toLocaleString('pt-br', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
                <div className='w-[20%] p-1 text-right'>
                  <p className='text-xs'>
                    {item.TOTAL.toLocaleString('pt-br', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/*TOTAL*/}
          <footer className='flex justify-between text-sm p-1'>
            <p>TOTAL:</p>
            <p>_________________________________________________________</p>

            <p>
              {orc.TOTAL.toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </footer>
        </section>
      </section>
      <div className='flex mt-4 gap-x-3 font-sans'>
        <OpenPDF orc={orc} />
        <DownloadPDF orc={orc} />
      </div>
    </main>
  );
};

export default GeneratePDF;

