'use client';

import { iItensList } from '@/@types/PreVenda';
import { iColumnType } from '@/@types/Table';
import { DataTable } from '@/components/CustomDataTable';

interface iPreSaleItemsTableProps {
  itens: iItensList[];
}

const itensHeaders: iColumnType<iItensList>[] = [
  {
    key: 'PRODUTO.PRODUTO',
    title: 'CÓDIGO',
    width: '15%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.PRODUTO?.PRODUTO}
      </span>
    ),
  },
  {
    key: 'PRODUTO.REFERENCIA',
    title: 'REFERÊNCIA',
    width: '15%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.PRODUTO?.REFERENCIA}
      </span>
    ),
  },
  {
    key: 'PRODUTO.NOME',
    title: 'PRODUTO',
    width: '25%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-start text-wrap h-[45px]'>
        {item.PRODUTO?.NOME}
      </span>
    ),
  },
  {
    key: 'VALOR',
    title: 'VALOR UNITÁRIO',
    width: '12%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.VALOR?.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        })}
      </span>
    ),
  },
  {
    key: 'QTD',
    title: 'QTD',
    width: '8%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.QTD}
      </span>
    ),
  },
  {
    key: 'TOTAL',
    title: 'TOTAL',
    width: '15%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center h-[45px]'>
        {item.TOTAL?.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        })}
      </span>
    ),
  },
];

export default function PreSaleItemsTable({ itens }: iPreSaleItemsTableProps) {
  return (
    <DataTable
      columns={itensHeaders}
      TableData={itens}
      IsLoading={false}
    />
  );
}
