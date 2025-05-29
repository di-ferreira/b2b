'use client';
import { iMovimentoEventos } from '@/@types/MovimentosEventos';
import { iColumnType } from '@/@types/Table';
import dayjs from 'dayjs';

export const headers: iColumnType<iMovimentoEventos>[] = [
  {
    key: 'DATA',
    title: 'DATA',
    width: '20rem',
    render: (_, item) => {
      return dayjs(item.MOVIMENTO.DATA).format('DD/MM/YYYY');
    },
  },
  {
    key: 'DOC',
    title: 'DOC',
    width: '5rem',
    render: (_, item) => {
      return item.MOVIMENTO.DOC;
    },
  },
  {
    key: 'TOTAL',
    title: 'TOTAL',
    width: '7rem',
    render: (_, item) => {
      return item.MOVIMENTO.TOTAL.toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
      });
    },
  },
  {
    key: 'STATUS',
    title: 'STATUS',
    width: '20rem',
  },
];

