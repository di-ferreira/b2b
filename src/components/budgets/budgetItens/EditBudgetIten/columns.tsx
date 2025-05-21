'use client';
import { iSaleHistory } from '@/@types/Produto';
import { iColumnType } from '@/@types/Table';
import { FormatToCurrency } from '@/lib/utils';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import { iListaSimilare } from '../../../../@types/Produto';

export const tableSalesHistoryHeaders: iColumnType<iSaleHistory>[] = [
  {
    key: 'DATA',
    title: 'DATA',
    width: '30%',
    render: (_, item) => {
      if (item.DATA === null) {
        return '00/00/0000';
      }
      return dayjs(item.DATA).format('DD/MM/YYYY');
    },
  },
  {
    key: 'DOC',
    title: 'DOC',
    width: '10%',
  },
  {
    key: 'QTD',
    title: 'QTD',
    width: '10%',
  },
  {
    key: 'VALOR',
    title: 'VALOR',
    width: '25%',
    render: (_, item) => {
      return FormatToCurrency(item.VALOR.toString());
    },
  },
];
export const tableSimilaresHeaders: iColumnType<iListaSimilare>[] = [
  {
    key: 'acoes',
    title: 'AÇÕES',
    width: '10%',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center gap-x-5'>
        <FontAwesomeIcon
          icon={faPlus}
          className='cursor-pointer text-emsoft_orange-main hover:text-emsoft_orange-light'
          size='xl'
          title='Adicionar'
          onClick={() => {
            // CallBack && CallBack(item);
          }}
        />
      </span>
    ),
  },
  {
    key: 'EXTERNO.PRODUTO',
    title: 'PRODUTO',
    width: '10%',
  },
  {
    key: 'EXTERNO.NOME',
    title: 'NOME',
    width: '15%',
  },
  {
    key: 'EXTERNO.REFERENCIA',
    title: 'REFERÊNCIA',
    width: '15%',
  },
  {
    key: 'EXTERNO.DATA_ATUALIZACAO',
    title: 'DATA ATUALIZAÇÃO',
    width: '15%',
  },
  {
    key: 'EXTERNO.QTDATUAL',
    title: 'QTD ATUAL',
    width: '15%',
  },
];

