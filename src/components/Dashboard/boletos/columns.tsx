'use client';
import { iContas } from '@/@types/Contas';
import { iColumnType } from '@/@types/Table';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';

export const headers: iColumnType<iContas>[] = [
  {
    key: 'DATA',
    title: 'DATA',
    width: '20rem',
    render: (_, item) => {
      return dayjs(item.Data).format('DD/MM/YYYY');
    },
  },
  {
    key: 'DOC',
    title: 'DOC',
    width: '5rem',
    render: (_, item) => {
      return item.Doc;
    },
  },
  {
    key: 'TOTAL',
    title: 'TOTAL',
    width: '7rem',
    render: (_, item) => {
      return item.TOTAL.toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
      });
    },
  },
  {
    key: '',
    title: 'BOLETO',
    width: '20rem',
    render: (_, item) => {
      let banco: string = item.EMISSAO_BOLETO;
      if (banco === 'CAIXA ECONOMICA') {
        banco = 'caixa';
      }
      banco = banco.toLocaleLowerCase().trim().replaceAll(' ', '');
      return (
        <span className='w-full h-full flex justify-center items-center'>
          <Link
            className='w-full h-8 flex items-center justify-center text-emsoft_light-main rounded-sm  bg-emsoft_orange-main hover:bg-emsoft_orange-light  tablet-portrait:h-14 tablet-portrait:text-2xl'
            href={`/api/download/Boleto_${item.CLIENTE.CIC}_${item.NOSSO_NUMERO}.pdf`}
            download={`Boleto_${item.CLIENTE.CIC}_${item.NOSSO_NUMERO}.pdf`}
            target='_top'
          >
            <FontAwesomeIcon icon={faFilePdf} className='h-1/2 mr-4' />
            Download
          </Link>
        </span>
      );
    },
  },
];

