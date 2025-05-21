import { iColumnType } from '../../../@types/Table';

interface iTableCellProps<T> {
  item: T;
  column: iColumnType<T>;
}

export function TableRowHeaderCell<T>({ column }: iTableCellProps<T>) {
  return (
    <>
      {
        <td
          className={`p-2 text-2xl text-center flex-grow capitalize text-emsoft_dark-text  max-w-36
            w-[${column.width ? column.width : 'w-min'}]
            overflow-hidden table-fixed hidden font-bold
            ${
              column.isHideMobile && 'max-sm:hidden'
            } max-sm:w-1/2 max-sm:items-center
            `}
          // isHideMobile={column.isHideMobile} min_width={column.width}
        >
          {column.title}
        </td>
      }
    </>
  );
}

