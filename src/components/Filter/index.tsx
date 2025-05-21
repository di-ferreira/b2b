'use client';
import { iSearch } from '@/@types';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '../ui/select';

interface FilterProps<T, K> {
  options?: { key: string; value: K }[];
  onSearch: (params: iSearch<T>) => void;
  button?: boolean;
  input?: boolean;
}
interface iFilterOptions<T, K> {
  value: K;
  key: string;
}

function Filter<T, K>({
  options,
  onSearch,
  button = true,
  input = true,
}: FilterProps<T, K>) {
  const [FilterOptions, setFilterOptions] = useState<iFilterOptions<T, K>>({
    value: options ? options[0].value : ('' as K),
    key: options ? options[0].key : '',
  });

  const [SearchInput, setSearchInput] = useState<string>('');

  const OnSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch({
        filterBy: FilterOptions.value,
        value: SearchInput,
      } as iSearch<T>);
    }
  };

  return (
    <div className='flex justify-center items-center w-full min-h-10 overflow-hidden'>
      {options && (
        <Select
          defaultValue={String(options[0].value)}
          value={String(FilterOptions.value)}
          onValueChange={(e: any) => {
            const selected = options.find((opt) => opt.value === e);
            setFilterOptions((old) => {
              return selected ? (old = selected) : old;
            });
          }}
        >
          <SelectTrigger className='w-fit text-emsoft_dark-text'>
            {FilterOptions.key}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((opt) => (
                <SelectItem
                  key={opt.key}
                  value={String(opt.value)}
                  className='text-emsoft_dark-text'
                >
                  {opt.key}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      {input && (
        <div className='w-96 mr-0 ml-2'>
          <Input
            onChange={(e) => setSearchInput((old) => (old = e.target.value))}
            onKeyDown={OnSearchKeyDown}
            value={SearchInput}
            placeholder='Digite sua busca'
            className='w-full h-16'
          />
        </div>
      )}

      {button && (
        <Button
          className='ml-3 h-10'
          variant='secondary'
          size='sm'
          onClick={() =>
            onSearch({
              filterBy: FilterOptions.value,
              value: SearchInput,
            } as iSearch<T>)
          }
        >
          Buscar
        </Button>
      )}
    </div>
  );
}

export default Filter;

