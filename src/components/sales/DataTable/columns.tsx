'use client';
import { iMovimento } from '@/@types/PreVenda';
import { iColumnType } from '@/@types/Table';
import dayjs from 'dayjs';

export const headers: iColumnType<iMovimento>[] = [
  {
    key: 'MOVIMENTO',
    title: 'VENDA',
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

