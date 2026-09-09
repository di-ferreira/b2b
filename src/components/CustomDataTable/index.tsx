'use client';
import { iFilter } from '@/@types/Filter';
import { iColumnType } from '../../@types/Table';
import { Loading } from '../Loading';
import TableHeader from './TableHeader';
import { TablePagination } from './TablePagination';
import TableRow from './TableRow';

type iTableDataProps<T> = {
  ErrorMessage?: string;
  columns: iColumnType<T>[];
  TableData: T[];
  QuantityRegisters?: number;
  IsLoading: boolean;
  onFetchPagination?: (filter: iFilter<T>) => void;
};

export function DataTable<T>({
  columns,
  TableData,
  ErrorMessage,
  onFetchPagination,
  QuantityRegisters,
  IsLoading,
}: iTableDataProps<T>) {
  return (
    <table className='border-collapse relative border-none w-full table-fixed'>
      <thead className='w-full table-fixed'>
        <TableHeader columns={columns} />
      </thead>
      <tbody className='w-full table-fixed overflow-x-hidden overflow-y-auto tablet:overflow-auto'>
        {IsLoading && (
          <div className='w-[calc(100vw-10%)] relative'>
            <Loading />
          </div>
        )}

        {ErrorMessage !== '' && !TableData && (
          <div className='flex absolute w-[300px] top-[100%] left-[50%] translate-x-[-50%] items-center justify-center pl-14 pr-6'>
            <p className='mt-5'>{ErrorMessage}</p>
          </div>
        )}
        {TableData && TableData.length === 0 && (
          <div className='flex absolute w-[300px] top-[100%] left-[50%] translate-x-[-50%] items-center justify-center pl-14 pr-6'>
            <p className='mt-5'>Não há registros</p>
          </div>
        )}

        {!IsLoading && <TableRow data={TableData} columns={columns} />}
      </tbody>
      {onFetchPagination &&
        QuantityRegisters !== undefined &&
        QuantityRegisters > 0 && (
          <TablePagination
            OnFetchData={onFetchPagination}
            QuantityRegisters={QuantityRegisters}
            rowsQtd={columns.length}
          />
        )}
    </table>
  );
}

