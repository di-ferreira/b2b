'use client';
import { iItensOrcamento, iOrcamento } from '@/@types/Orcamento';
import { iColumnType } from '@/@types/Table';
import { GetOrcamento, removeItem } from '@/app/actions/orcamento';
import { DataTable } from '@/components/CustomDataTable';
import { Loading } from '@/components/Loading';
import ToastNotify from '@/components/ToastNotify';
import { Button } from '@/components/ui/button';
import {
  faEdit,
  faFileInvoiceDollar,
  faFilePdf,
  faPlusCircle,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import GeneratePDF from '../../PdfViewer/PdfButton';
import FormEdit from '../EditBudgetIten/FormEdit';
import { ModalEditBudgetItem } from '../EditBudgetIten/ModalEditBudgetItem';

interface iItemBudgetTable {
  orc: iOrcamento;
}

const DataTableItensBudget = ({ orc }: iItemBudgetTable) => {
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
            title='Remover Item'
            onClick={() => {
              removeItem({
                pIdOrcamento: item.ORCAMENTO,
                pProduto: item.PRODUTO.PRODUTO,
              });
              handleItensBudgets();
            }}
          />
          <ModalEditBudgetItem
            key={item.ITEM}
            modalTitle={`Item Orçamento ${item.ORCAMENTO}`}
            buttonIcon={faEdit}
            iconStyle='cursor-pointer text-emsoft_orange-main hover:text-emsoft_orange-light'
            buttonStyle='bg-tranparent hover:bg-tranparent'
            containerStyle='laptop:w-[85vw] laptop:h-[85vh] tablet-a8-portrait:w-[85vw] tablet-a8-portrait:h-[85vh] w-[85vw] h-[85vh]'
          >
            <FormEdit budget={data} item={item} CallBack={handleItensBudgets} />
          </ModalEditBudgetItem>
        </span>
      ),
    },
    {
      key: 'PRODUTO.PRODUTO',
      title: 'CÓDIGO',
      width: '15%',
      render: (_, item) => (
        <span
          className={`flex w-full items-center justify-center gap-x-5  h-[55px] ${
            item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA <= 0 &&
            ' bg-red-700 text-emsoft_light-surface font-bold'
          }`}
        >
          {item.PRODUTO.PRODUTO}
        </span>
      ),
    },
    {
      key: 'PRODUTO.REFERENCIA',
      title: 'REFERÊNCIA',
      width: '15%',
      render: (_, item) => (
        <span
          className={`flex w-full items-center justify-center gap-x-5  h-[55px] ${
            item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA <= 0 &&
            ' bg-red-700 text-emsoft_light-surface font-bold'
          }`}
        >
          {item.PRODUTO.REFERENCIA}
        </span>
      ),
    },
    {
      key: 'PRODUTO.NOME',
      title: 'PRODUTO',
      width: '15%',
      render: (_, item) => (
        <span
          className={`flex w-full items-center justify-start text-wrap gap-x-5  h-[55px] ${
            item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA <= 0 &&
            ' bg-red-700 text-emsoft_light-surface font-bold'
          }`}
        >
          {item.PRODUTO.NOME}
        </span>
      ),
    },
    {
      key: 'VALOR',
      title: 'VALOR UNITÁRIO',
      width: '10%',
      render: (_, item) => (
        <span
          className={`flex w-full items-center justify-center gap-x-5  h-[55px] ${
            item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA <= 0 &&
            ' bg-red-700 text-emsoft_light-surface font-bold'
          }`}
        >
          {item.VALOR.toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </span>
      ),
    },
    {
      key: 'PRODUTO.QTDATUAL',
      title: 'QTD EST.',
      width: '5%',
      render: (_, item) => (
        <span
          className={`flex w-full items-center justify-center gap-x-5  h-[55px] ${
            item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA <= 0 &&
            ' bg-red-700 text-emsoft_light-surface font-bold'
          }`}
        >
          {item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA}
        </span>
      ),
    },
    {
      key: 'QTD',
      title: 'QTD',
      width: '5%',
      render: (_, item) => (
        <span
          className={`flex w-full items-center justify-center gap-x-5  h-[55px] ${
            item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA <= 0 &&
            ' bg-red-700 text-emsoft_light-surface font-bold'
          }`}
        >
          {item.QTD}
        </span>
      ),
    },
    {
      key: 'TOTAL',
      title: 'TOTAL',
      width: '15%',
      render: (_, item) => (
        <span
          className={`flex w-full items-center justify-center gap-x-5  h-[55px] ${
            item.PRODUTO.QTDATUAL - item.PRODUTO.QTD_GARANTIA <= 0 &&
            ' bg-red-700 text-emsoft_light-surface font-bold'
          }`}
        >
          {item.TOTAL.toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </span>
      ),
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      if (orc) setData((old) => orc);
    };

    loadData();
  }, [orc]);
  return (
    <section className='flex flex-col gap-x-5 w-full mt-7 tablet-portrait:gap-y-6'>
      <div className='flex w-full items-center px-5 mt-8 gap-x-4 tablet-portrait:h-auto tablet-portrait:gap-y-6'>
        <ModalEditBudgetItem
          modalTitle={'Novo Item'}
          buttonText={'Novo Item'}
          buttonIcon={faPlusCircle}
          containerStyle='laptop:w-[85vw] laptop:h-[85vh] tablet-a8-portrait:w-[85vw] tablet-a8-portrait:h-[85vh] w-[85vw] h-[85vh]'
        >
          <FormEdit budget={data} CallBack={handleItensBudgets} />
        </ModalEditBudgetItem>
        <ModalEditBudgetItem
          modalTitle={`Orçamento ${data.ORCAMENTO}`}
          buttonText={'Gerar PDF'}
          buttonIcon={faFilePdf}
        >
          <div className='w-full h-full'>
            <GeneratePDF orc={data} />
          </div>
        </ModalEditBudgetItem>
        <Button>
          <Link href={`/app/pre-sales/${data.ORCAMENTO}`}>
            <FontAwesomeIcon
              icon={faFileInvoiceDollar}
              className={'text-emsoft_light-main mr-2'}
              size='xl'
              title={'Gerar Pré-venda'}
            />
            Gerar Pré-venda
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
              TableData={data.ItensOrcamento}
              IsLoading={false}
            />
          </Suspense>
        )}
      </div>
      <div className='flex w-full gap-x-5 items-end justify-end px-5 pt-3 mt-4 border-t-2 border-emsoft_orange-main'>
        <span className='bold text-3xl'>TOTAL:</span>
        <span className='bold text-xl'>
          {data !== undefined && data.TOTAL
            ? data.TOTAL.toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })
            : 'R$ 0,00'}
        </span>
      </div>
    </section>
  );
};

export default DataTableItensBudget;

