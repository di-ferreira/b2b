'use client';
import { iProduto } from '@/@types/Produto';
import { iColumnType } from '@/@types/Table';

export const headers: iColumnType<iProduto>[] = [
  {
    key: 'NOME',
    title: 'NOME',
    width: '20rem',
  },
  {
    key: 'PRODUTO',
    title: 'PRODUTO',
    width: '20rem',
  },
  {
    key: 'REFERENCIA',
    title: 'REFERENCIA',
    width: '11rem',
  },
  {
    key: 'CODIGOBARRA',
    title: 'CODIGO DE BARRAS',
    width: '5rem',
    render: (_, item) => <>{item.CODIGOBARRA ? item.CODIGOBARRA : ''}</>,
  },
  {
    key: 'APLICACOES',
    title: 'APLICAÇÕES',
    width: '20rem',
  },
  {
    key: 'QTDATUAL',
    title: 'QTD ATUAL',
    width: '20rem',
  },
  {
    key: 'LOCAL',
    title: 'LOCAL',
    width: '20rem',
  },
];

