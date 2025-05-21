import { IconProp } from '@fortawesome/fontawesome-svg-core';
import React from 'react';
import { iButtonAction } from './Button';
import { iFilter } from './Filter';

export interface iOption {
  label: string;
  value: string | number;
}
export interface iTablePagination {
  CurrentPage: number;
  TotalPages: number;
  RowsPerPage: number;
  onFirstPage: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onLastPage: () => void;
  onChange: (value: iOption) => void;
}
export interface iButtonAction<T> {
  Text?: string;
  Title?: string;
  Color: {
    hover?: string;
    text?: string;
    background?: string;
    backgroundHover?: string;
  };
  Icon?: IconProp;
  Size?: SizeProp;
  Rounded?: boolean;
  Type?: iButtonType;
  onclick: (item: T) => void;
}
export interface iColumnType<T> {
  key: string;
  title: string;
  width?: string;
  isHideMobile?: boolean;
  render?: (column: iColumnType<T>, item: T) => void;
  action?: iButtonAction<T>[];
}
export interface iTableProps<T> {
  messageNoData?: string;
  data: T[];
  columns: iColumnType<T>[];
  pagination?: iTablePagination;
}

export interface iDataResultTable<T> {
  Qtd_Registros: number;
  value: T[];
}

export type iTabData = {
  Icon: IconProp;
  TitleTab: string;
  Link: string;
  Closable?: boolean;
  isActive: boolean;
};

export interface iTableRef<T> {
  onRefresh: (filter?: iFilter<T>) => void;
  onRefreshData: (Data: T[]) => void;
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/ban-types
  function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.JSX.Element | null
  ): (props: P & React.RefAttributes<T>) => React.JSX.Element | null;
}

