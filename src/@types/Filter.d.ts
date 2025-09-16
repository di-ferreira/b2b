export type tTypeSearch = 'eq' | 'ne' | 'like' | 'gt' | 'lt' | 'ge' | 'le';

export type tTypeCondition = 'and' | 'or';
export type tGroupOperator = tTypeCondition;
export interface iFilterQuery<T> {
  key: keyof T;
  value: string | number | null;
  typeSearch?: tTypeSearch;
  typeCondition?: tTypeCondition;
  groupOperator?: tGroupOperator;
}

export interface iFilter<T> {
  filter?: iFilterQuery<T>[];
  orderBy?: keyof T;
  top?: number;
  skip?: number;
}

