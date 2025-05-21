'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  useReactTable,
} from '@tanstack/react-table';

import { iCliente } from '@/@types/Cliente';
import { iFilter } from '@/@types/Filter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '../ui/select';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalRecords: number;
  handleFunction: (filter: iFilter<iCliente>) => Promise<void>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalRecords,
  handleFunction,
}: DataTableProps<TData, TValue>) {
  const pageSizeOptions = [10, 20, 50, 100];
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const pageCount = useMemo(
    () => Math.ceil(totalRecords / pageSize),
    [totalRecords, pageSize]
  );

  const onPaginationChange: OnChangeFn<{
    pageIndex: number;
    pageSize: number;
  }> = useCallback(async (updaterOrValue) => {
    const newPaginationState =
      typeof updaterOrValue === 'function'
        ? updaterOrValue({ pageIndex, pageSize })
        : updaterOrValue;
    setPageIndex(newPaginationState.pageIndex);
    setPageSize(newPaginationState.pageSize);
    const filter: iFilter<iCliente> = {
      skip: newPaginationState.pageIndex * newPaginationState.pageSize,
      top: newPaginationState.pageSize,
    };

    await handleFunction(filter);
  }, []);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange,
  });

  const externalFunction = useCallback(
    async (filter: iFilter<iCliente>) => await handleFunction(filter),
    []
  );

  useEffect(() => {
    const filter: iFilter<iCliente> = {
      skip: pageIndex * pageSize,
      top: pageSize,
    };

    // externalFunction(filter);
  }, [pageIndex, pageSize]);

  return (
    <div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-around space-x-2 py-4'>
        <div className='flex items-center justify-center space-x-2 py-4'>
          <Label>Registros por página</Label>
          <Select
            defaultValue={String(pageSize)}
            value={String(pageSize)}
            onValueChange={(e: any) => {
              const selected = Number(e);
              setPageSize(selected);
              // setPageIndex(0);
              externalFunction({
                skip: pageIndex,
                top: selected,
              });
            }}
          >
            <SelectTrigger className='w-[70px] text-emsoft_dark-text'>
              {pageSize}
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pageSizeOptions.map((size) => (
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

          <Label>
            {pageIndex + 1} de {pageCount}
          </Label>
        </div>
        <div className='flex items-center justify-center space-x-2 py-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setPageIndex(table.getState().pagination.pageIndex - 1);
              externalFunction({
                skip:
                  (table.getState().pagination.pageIndex - 1) *
                  table.getState().pagination.pageSize,
                top: table.getState().pagination.pageSize,
              });
            }}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setPageIndex(0);
              externalFunction({
                skip: 0,
                top: table.getState().pagination.pageSize,
              });
            }}
            disabled={!table.getCanPreviousPage()}
          >
            Primeiro
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setPageIndex(pageCount - 1);
              externalFunction({
                skip: pageCount - 1,
                top: table.getState().pagination.pageSize,
              });
            }}
            disabled={!table.getCanNextPage()}
          >
            Último
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setPageIndex((old) => {
                return (old = table.getState().pagination.pageIndex + 1);
              });

              externalFunction({
                skip: (pageIndex + 1) * pageSize,
                top: pageSize,
              });
            }}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}

