'use client';
import { iItensOrcamento, iOrcamento } from '@/@types/Orcamento';
import { iColumnType } from '@/@types/Table';
import { GetOrcamento } from '@/app/actions/orcamento';
import { DataTable } from '@/components/CustomDataTable';
import { Loading } from '@/components/Loading';
import ToastNotify from '@/components/ToastNotify';
import { Button } from '@/components/ui/button';
import useOrcamento from '@/store/orcamentoStore';
import {
  faEdit,
  faFileInvoiceDollar,
  faFilePdf,
  faPlusCircle,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { Suspense, useCallback, useState } from 'react';
import GeneratePDF from '../../PdfViewer/PdfButton';
import FormEdit from '../EditBudgetIten/FormEdit';
import { ModalEditBudgetItem } from '../EditBudgetIten/ModalEditBudgetItem';

interface iItemBudgetTable {
  orc: iOrcamento;
}

const DataTableItensBudget = ({ orc }: iItemBudgetTable) => {
  const { removeItem, current } = useOrcamento();

  const [data, setData] = useState<iOrcamento>(orc);
  const [loading, setLoading] = useState(false);

  const handleItensBudgets = useCallback(() => {
    setLoading(true);
    GetOrcamento(orc.ORCAMENTO)
      .then((res) => {
        if (res.value) {
          setData(res.value);
        }
        if (res.error !== undefined) {
          ToastNotify({
            message: `Erro: ${res.error.message}`,
            type: 'error',
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar clientes:', err);
        ToastNotify({
          message: `Erro: ${err.message}`,
          type: 'error',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const tableHeaders: iColumnType<iItensOrcamento>[] = [
    {
      key: 'acoes',
      title: 'AÇÕES',
      width: '15%',
      render: (_, item) => (
        <span className='flex w-full items-center justify-center gap-x-5'>
          <FontAwesomeIcon
            icon={faTrashAlt}
            className='cursor-pointer text-emsoft_blue-main hover:text-emsoft_blue-light'
            size='xl'
            title='Gerar Pré-venda'
            onClick={async () => {
              await removeItem({
                pIdOrcamento: item.ORCAMENTO,
                pProduto: item.PRODUTO.PRODUTO,
              });
            }}
          />
          <ModalEditBudgetItem
            key={item.ITEM}
            modalTitle={`Item Orçamento ${item.ORCAMENTO}`}
            buttonIcon={faEdit}
            iconStyle='cursor-pointer text-emsoft_orange-main hover:text-emsoft_orange-light'
            buttonStyle='bg-tranparent hover:bg-tranparent'
          >
            <FormEdit
              // budget={current}
              item={item}
              // CallBack={handleItensBudgets}
            />
          </ModalEditBudgetItem>
        </span>
      ),
    },
    {
      key: 'PRODUTO.PRODUTO',
      title: 'CÓDIGO',
      width: '15%',
    },
    {
      key: 'PRODUTO.REFERENCIA',
      title: 'REFERÊNCIA',
      width: '15%',
    },
    {
      key: 'PRODUTO.NOME',
      title: 'PRODUTO',
      width: '15%',
    },
    {
      key: 'VALOR',
      title: 'VALOR UNITÁRIO',
      width: '10%',
      render: (_, item) => {
        return item.VALOR.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        });
      },
    },
    {
      key: 'QTD',
      title: 'QTD',
      width: '5%',
    },
    {
      key: 'TOTAL',
      title: 'TOTAL',
      width: '15%',
      render: (_, item) => {
        return item.TOTAL.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        });
      },
    },
  ];

  return (
    <section className='flex flex-col gap-x-5 w-full mt-7 tablet-portrait:gap-y-6'>
      <div className='flex w-full items-center px-5 mt-8 gap-x-4 tablet-portrait:h-auto tablet-portrait:gap-y-6'>
        <ModalEditBudgetItem
          modalTitle={'Novo Item'}
          buttonText={'Novo Item'}
          buttonIcon={faPlusCircle}
        >
          <FormEdit CallBack={handleItensBudgets} />
        </ModalEditBudgetItem>
        <ModalEditBudgetItem
          modalTitle={`Orçamento ${current.ORCAMENTO}`}
          buttonText={'Gerar PDF'}
          buttonIcon={faFilePdf}
        >
          <div className='w-full h-full'>
            <GeneratePDF orc={current} />
          </div>
        </ModalEditBudgetItem>
        <Button>
          <Link href={`/app/pre-sales/${current.ORCAMENTO}`}>
            <FontAwesomeIcon
              icon={faFileInvoiceDollar}
              className={'text-emsoft_light-main mr-2'}
              size='xl'
              title={'Gerar Pré-venda'}
            />
            Gerar Pedido
          </Link>
        </Button>
      </div>

      <div className='flex flex-col gap-4 w-full h-[70%] px-5 py-2 mt-5 border-t-2 border-emsoft_orange-main overflow-x-hidden overflow-y-scroll'>
        {loading ? (
          <Loading />
        ) : (
          <Suspense fallback={<span>Carregando...</span>}>
            <DataTable
              columns={tableHeaders}
              TableData={current.ItensOrcamento}
              IsLoading={false}
            />
          </Suspense>
        )}
      </div>
    </section>
  );
};

export default DataTableItensBudget;

