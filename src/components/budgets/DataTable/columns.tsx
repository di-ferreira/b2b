'use client';
import { iOrcamento } from '@/@types/Orcamento';
import { iColumnType } from '@/@types/Table';
import {
  faEdit,
  faFileLines,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';
import { ModalEditBudgetItem } from '../budgetItens/EditBudgetIten/ModalEditBudgetItem';
import GeneratePDF from '../PdfViewer/PdfButton';

export const headers: iColumnType<iOrcamento>[] = [
  {
    key: 'ORCAMENTO',
    title: 'ORCAMENTO',
    width: '150px',
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
  {
    key: 'acoes',
    title: 'AÇÕES',
    width: '5rem',
    render: (_, item) => (
      <span className='flex w-full items-center justify-center gap-x-5'>
        <Link href={`/app/pre-sales/${item.ORCAMENTO}`}>
          <FontAwesomeIcon
            icon={faFileLines}
            className='text-emsoft_success-main hover:text-emsoft_success-light'
            size='xl'
            title='Gerar Pré-venda'
          />
        </Link>

        <Link href={`/app/budgets/${item.ORCAMENTO}`}>
          <FontAwesomeIcon
            icon={faEdit}
            className='text-emsoft_orange-main hover:text-emsoft_orange-light'
            size='xl'
            title='Editar'
          />
        </Link>
        <ModalEditBudgetItem
          modalTitle={`Orçamento ${item.ORCAMENTO}`}
          buttonIcon={faFilePdf}
          buttonStyle='bg-transparent hover:bg-transparent m-0 p-0'
          iconStyle='text-emsoft_danger-dark hover:text-emsoft_danger-main'
          titleButton='Gerar PDF'
        >
          <div className='w-full h-full'>
            <GeneratePDF orc={item} />
          </div>
        </ModalEditBudgetItem>
      </span>
    ),
  },
];

