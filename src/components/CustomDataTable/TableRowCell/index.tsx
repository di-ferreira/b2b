import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { get } from 'lodash';
import { iButtonAction, iColumnType } from '../../../@types/Table';

interface iTableCellProps<T> {
  item: T;
  column: iColumnType<T>;
}

export function TableRowCell<T>({ item, column }: iTableCellProps<T>) {
  const value = get(item, column.key);
  return (
    <>
      {
        <td
          className={cn(
            column.isHideMobile && 'tablet:hidden',
            `pr-5 pl-0 text-xs text-center overflow-hidden whitespace-nowrap table-fixed text-ellipsis`,
            `overflow-hidden table-fixed border-b`,
            `${column.isHideMobile ? 'tablet:hidden' : ''}`
          )}
        >
          {column.action ? (
            <span className='flex items-center justify-evenly'>
              {column.action.map((button: iButtonAction<T>, i) => (
                <Button
                  title={button.Title}
                  className={cn(
                    ' text-2xl text-center  capitalize text-emsoft_blue-main bg-transparent hover:bg-transparent hover:text-emsoft_blue-light',
                    `${button.Color.text}`,
                    `${button.Color.background}`,
                    `${button.Color.backgroundHover}`,
                    `${button.Color.hover}`,
                    `${button.Rounded ? ` rounded-full ` : 'rounded-sm'}`
                  )}
                  key={i}
                  onClick={() => button.onclick(item)}
                >
                  {button.Icon ? <FontAwesomeIcon icon={button.Icon} /> : ''}
                  {button.Text}
                </Button>
              ))}
            </span>
          ) : column.render ? (
            column.render(column, item)
          ) : (
            value
          )}
        </td>
      }
    </>
  );
}

