export interface iFilterQuery<T> {
  key: keyof T;
  value: string | number;
  typeSearch?: 'eq' | 'like';
}

export interface iFilter<T> {
  filter?: iFilterQuery<T>[];
  orderBy?: keyof T;
  top?: number;
  skip?: number;
}
