'use client';
import { iMovimento } from '@/@types/PreVenda';
import { iColumnType } from '@/@types/Table';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

export const headers: iColumnType<iMovimento>[] = [
  {
    key: 'acoes',
    title: 'AÇÕES',
    width: '5rem',
    render: (_, item) => {
      const router = useRouter();
      return (
        <span className='flex w-full items-center justify-center'>
          <FontAwesomeIcon
            icon={faEye}
            className='cursor-pointer text-emsoft_blue-main hover:text-emsoft_blue-light'
            size='lg'
            title='Ver detalhes'
            onClick={() => router.push(`/app/pre-sales/${item.MOVIMENTO}/view`)}
          />
        </span>
      );
    },
  },
  {
    key: 'MOVIMENTO',
    title: 'PRÉ-VENDA',
    width: '5rem',
  },
  {
    key: 'CLIENTE.NOME',
    title: 'NOME',
    width: '20rem',
  },
  {
    key: 'DATA',
    title: 'DATA',
    width: '20rem',
    render: (_, item) => {
      return dayjs(item.DATA).format('DD/MM/YYYY');
    },
  },
  {
    key: 'VENDEDOR.NOME',
    title: 'VENDEDOR',
    width: '20rem',
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
];

