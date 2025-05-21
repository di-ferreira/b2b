import { cn } from '@/lib/utils';
import React from 'react';
import { iColumnType } from '../../../@types/Table';

interface iHeaderProps<T> {
  columns: iColumnType<T>[];
}

function TableHeader<T>({ columns }: iHeaderProps<T>) {
  return (
    <tr
      className={cn(
        'relative table-fixed  w-screen h-8 tablet:overflow-x-auto tablet:overflow-y-hidden tablet:h-full bg-white border-b-2 border-gray-400'
      )}
    >
      {columns.map((column, idx) => (
        <React.Fragment key={idx}>
          {
            <th
              className={cn(
                column.isHideMobile && 'tablet:hidden',
                `font-semibold table-fixed text-center text-base pr-5 pl-0`,
                ` tablet:w-1/2`,
                `overflow-hidden table-fixed border-b`,
                `${column.isHideMobile ? 'tablet:hidden' : ''}`
              )}
              key={`table-head-cell-${column.title}`}
              //   min_width={column.width}
            >
              {column.title}
            </th>
          }
        </React.Fragment>
      ))}
    </tr>
  );
}

export default TableHeader;

