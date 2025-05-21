import React from 'react';
import { iColumnType } from '../../../@types/Table';
import { TableRowCell } from '../TableRowCell';

interface iTableRowProps<T> {
  data: T[];
  columns: iColumnType<T>[];
}

function TableRow<T>({ data, columns }: iTableRowProps<T>) {
  return (
    <>
      {data &&
        data.map((item, idx) => (
          <tr
            className={`relative table-fixed w-full  
                       cursor-auto last:rounded-e even:bg-gray-50  odd:bg-gray-100 
                      text-emsoft_dark-text h-14`}
            key={`table-row-${idx}`}
          >
            {columns.map((column, columnIndex) => (
              <React.Fragment key={columnIndex}>
                <TableRowCell item={item} column={column} />
              </React.Fragment>
            ))}
          </tr>
        ))}
    </>
  );
}

export default TableRow;

