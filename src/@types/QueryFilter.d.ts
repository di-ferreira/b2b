export type LogicalOperator = 'and' | 'or';

export type SearchOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'ge'
  | 'lt'
  | 'le'
  | 'contains'
  | 'startswith'
  | 'endswith';

export type FieldType = 'string' | 'number' | 'date' | 'boolean';

export type ModelMetadata<T> = {
  [K in keyof T]: FieldType;
};

export interface FilterCondition<T> {
  key: keyof T;
  operator: SearchOperator;
  value: unknown;
}

export interface FilterGroup<T> {
  operator: LogicalOperator;
  conditions: Array<FilterCondition<T> | FilterGroup<T>>;
}

export interface QueryOptions<T> {
  filter?: FilterGroup<T>;
  top?: number;
  skip?: number;
  orderBy?: keyof T;
  orderDirection?: 'asc' | 'desc';
  expand?: string[];
  select?: (keyof T)[];
  inlineCount?: boolean;
}

