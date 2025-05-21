import { iParcelasPgto } from '@/@types/PreVenda';
import { iColumnType } from '@/@types/Table';

export const tableHeaders: iColumnType<iParcelasPgto>[] = [
  {
    key: 'DIAS',
    title: 'DIAS',
    width: '10%',
  },
  {
    key: 'VENCIMENTO',
    title: 'VENCIMENTO',
    width: '10%',
  },
  {
    key: 'VALOR',
    title: 'VALOR',
    width: '20%',
    render: (_, item) => {
      let TotalPV: number = 0.0;

      if (item.VALOR) {
        TotalPV = item.VALOR;
      }

      return TotalPV.toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
      });
    },
  },
];

