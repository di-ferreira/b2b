/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';

import { iFilter } from '@/@types/Filter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { KEY_NAME_TABLE_PAGINATION, ROWS_PER_PAGE_OPTIONS } from '@/constants';
import { loadStorage, saveStorage } from '@/lib/utils';
interface iDataTablePagination<T> {
  QuantityRegisters: number;
  OnFetchData: (filter: iFilter<T>) => void;
  rowsQtd: number;
}

export type tpPaginationValues = {
  CurrentPage: number;
  RowsPerPage: number;
  TotalPages: number;
  TotalRegisters: number;
};

export function TablePagination<T>({
  QuantityRegisters,
  OnFetchData,
  rowsQtd,
}: iDataTablePagination<T>) {
  const [PaginationOptions, setPaginationOptions] =
    useState<tpPaginationValues>({
      CurrentPage: 1,
      RowsPerPage: ROWS_PER_PAGE_OPTIONS[0],
      TotalPages: 0,
      TotalRegisters: QuantityRegisters,
    });

  const SkipPage = (
    NextPage: boolean = true,
    RegPerPage: number = PaginationOptions.RowsPerPage
  ): number => {
    const CurPage = NextPage
      ? PaginationOptions.CurrentPage + 1
      : PaginationOptions.CurrentPage - 1;
    const Skip = RegPerPage * CurPage - RegPerPage;
    return Skip;
  };

  const ChangeRowsPerPage = (value: Number) => {
    const rows = Number(value) || ROWS_PER_PAGE_OPTIONS[0];
    const pagination = {
      ...PaginationOptions,
      CurrentPage: 1,
      RowsPerPage: rows,
      TotalPages: Math.max(Math.ceil(QuantityRegisters / rows), 1),
      TotalRegisters: QuantityRegisters,
    };
    setPaginationOptions(pagination);

    saveStorage<tpPaginationValues>(KEY_NAME_TABLE_PAGINATION, pagination);

    OnFetchData({ top: rows, skip: 0 });
  };

  const GoToFirstPage = () => {
    const pagination = { ...PaginationOptions, CurrentPage: 1 };
    setPaginationOptions(pagination);
    saveStorage<tpPaginationValues>(KEY_NAME_TABLE_PAGINATION, pagination);
    OnFetchData({ top: PaginationOptions.RowsPerPage, skip: 0 });
  };

  const GoToNextPage = () => {
    if (PaginationOptions.CurrentPage < PaginationOptions.TotalPages) {
      const pagination = {
        ...PaginationOptions,
        CurrentPage: PaginationOptions.CurrentPage + 1,
      };
      setPaginationOptions(pagination);

      const top = PaginationOptions.RowsPerPage;
      const skip = SkipPage();

      saveStorage<tpPaginationValues>(KEY_NAME_TABLE_PAGINATION, pagination);
      OnFetchData({ top, skip });
    }
  };

  const GoToPrevPage = () => {
    if (PaginationOptions.CurrentPage > 1) {
      const pagination = {
        ...PaginationOptions,
        CurrentPage: PaginationOptions.CurrentPage - 1,
      };
      setPaginationOptions((oldPage) => (oldPage = pagination));
      saveStorage<tpPaginationValues>(KEY_NAME_TABLE_PAGINATION, pagination);
      OnFetchData({ top: pagination.RowsPerPage, skip: SkipPage(false) });
    }
  };

  const GoToLastPage = () => {
    const pagination = {
      ...PaginationOptions,
      CurrentPage: PaginationOptions.TotalPages,
    };
    setPaginationOptions(pagination);
    saveStorage<tpPaginationValues>(KEY_NAME_TABLE_PAGINATION, pagination);
    OnFetchData({
      top: pagination.RowsPerPage,
      skip: (pagination.TotalPages - 1) * pagination.RowsPerPage,
    });
  };

  // Só o tamanho de página vem do storage (preferência do usuário). Total e
  // página atual são sempre da lista que está na tela: o storage é
  // compartilhado entre tabelas e trazia o total de outra tela.
  useEffect(() => {
    let storageRows = 0;
    try {
      const storagePagination = loadStorage<tpPaginationValues>(
        KEY_NAME_TABLE_PAGINATION
      );
      storageRows = Number(storagePagination?.RowsPerPage);
    } catch {
      storageRows = 0;
    }

    const rowsPerPage = ROWS_PER_PAGE_OPTIONS.includes(storageRows)
      ? storageRows
      : ROWS_PER_PAGE_OPTIONS[0];

    setPaginationOptions({
      CurrentPage: 1,
      RowsPerPage: rowsPerPage,
      TotalPages: Math.max(Math.ceil(QuantityRegisters / rowsPerPage), 1),
      TotalRegisters: QuantityRegisters,
    });
  }, []);

  // Nova busca / item incluído / item removido: a lista mudou de tamanho,
  // então volta para a primeira página, que é o que o pai recarregou.
  useEffect(() => {
    setPaginationOptions((old) => {
      const totalPages = Math.max(
        Math.ceil(QuantityRegisters / old.RowsPerPage),
        1
      );

      if (
        old.TotalRegisters === QuantityRegisters &&
        old.TotalPages === totalPages
      ) {
        return old;
      }

      return {
        ...old,
        CurrentPage: 1,
        TotalPages: totalPages,
        TotalRegisters: QuantityRegisters,
      };
    });
  }, [QuantityRegisters, PaginationOptions.RowsPerPage]);

  return (
    <tfoot className='w-full table-fixed'>
      <tr className='table-row'>
        <td colSpan={rowsQtd}>
          <div className='flex w-full px-4 justify-between'>
            <div className='flex items-center gap-x-3 w-[50%] py-4'>
              <Label>Registros por página</Label>
              <Select
                defaultValue={String(PaginationOptions.RowsPerPage)}
                value={String(PaginationOptions.RowsPerPage)}
                onValueChange={(e: any) => {
                  const selected = Number(e);
                  setPaginationOptions({
                    ...PaginationOptions,
                    RowsPerPage: selected,
                  });
                  ChangeRowsPerPage(selected);
                }}
              >
                <SelectTrigger className='w-[70px] text-emsoft_dark-text'>
                  {PaginationOptions.RowsPerPage}
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ROWS_PER_PAGE_OPTIONS.map((size) => (
                      <SelectItem
                        key={size}
                        value={String(size)}
                        className='text-emsoft_dark-text'
                      >
                        Mostrar {size}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Label className='flex gap-x-2'>
                <strong>{PaginationOptions.CurrentPage}</strong> de
                <strong>{PaginationOptions.TotalPages}</strong>
              </Label>
            </div>
            <div className='flex items-center justify-end gap-x-2 w-[50%] py-4'>
              <Button
                variant='outline'
                size='sm'
                disabled={PaginationOptions.CurrentPage === 1}
                onClick={() => GoToPrevPage()}
              >
                Anterior
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={PaginationOptions.CurrentPage === 1}
                onClick={() => GoToFirstPage()}
              >
                Primeiro
              </Button>

              <Button
                variant='outline'
                size='sm'
                disabled={
                  PaginationOptions.CurrentPage === PaginationOptions.TotalPages
                }
                onClick={() => GoToLastPage()}
              >
                Último
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={
                  PaginationOptions.CurrentPage === PaginationOptions.TotalPages
                }
                onClick={() => GoToNextPage()}
              >
                Próximo
              </Button>
            </div>
          </div>
        </td>
      </tr>
    </tfoot>
  );
}

