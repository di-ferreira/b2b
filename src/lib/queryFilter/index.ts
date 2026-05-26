import {
  FilterCondition,
  FilterGroup,
  ModelMetadata,
  QueryOptions,
} from '@/@types/QueryFilter';
import dayjs from 'dayjs';

/* ============================
   Sanitização
============================ */

function sanitizeString(value: string): string {
  return value.replace(/'/g, "''");
}

/* ============================
   Normalização baseada em metadata
============================ */

function normalizeValue<T>(
  key: keyof T,
  value: unknown,
  metadata: ModelMetadata<T>,
): string {
  // 1. Tratamento de Nulo Global: Se o valor for null, undefined ou a string 'null'
  // ele deve retornar sem aspas independentemente do tipo no metadata.
  if (value === null || value === undefined || value === 'null') {
    return 'null';
  }

  const type = metadata[key];

  switch (type) {
    case 'date': {
      if (
        value instanceof Date ||
        dayjs.isDayjs(value) ||
        typeof value === 'string'
      ) {
        const d = dayjs(value);

        if (!d.isValid()) {
          throw new Error(`Invalid date for ${String(key)}`);
        }

        // Para OData, datas geralmente precisam de aspas simples: 'YYYY-MM-DD'
        return `'${d.format('YYYY-MM-DD')}'`;
      }

      throw new Error(`Invalid date value for ${String(key)}`);
    }

    case 'number': {
      if (typeof value !== 'number' && isNaN(Number(value))) {
        throw new Error(`Invalid number for ${String(key)}`);
      }

      return String(value);
    }

    case 'boolean':
      return value ? 'true' : 'false';

    case 'string':
    default:
      // Como o 'null' já foi tratado no topo, aqui cairão apenas strings reais
      return `'${sanitizeString(String(value))}'`;
  }
}

/* ============================
   Serialização de condição
============================ */

function serializeCondition<T>(
  condition: FilterCondition<T>,
  metadata: ModelMetadata<T>,
): string {
  const { key, operator, value } = condition;

  const normalized = normalizeValue(key, value, metadata);

  switch (operator) {
    case 'contains':
    case 'startswith':
    case 'endswith':
      return `${operator}(${String(key)}, ${normalized})`;

    default:
      return `${String(key)} ${operator} ${normalized}`;
  }
}

/* ============================
   Serialização de grupo
============================ */

function serializeGroup<T>(
  group: FilterGroup<T>,
  metadata: ModelMetadata<T>,
): string {
  const parts = group.conditions.map((c) => {
    if ('conditions' in c) {
      return `(${serializeGroup(c, metadata)})`;
    }

    return serializeCondition(c, metadata);
  });

  return parts.join(` ${group.operator} `);
}

export const defineMetadata =
  <T>() =>
  <M extends ModelMetadata<T>>(metadata: M) =>
    metadata;

/* ============================
   Builder principal
============================ */

export class ODataQueryBuilder<T> {
  private metadata: ModelMetadata<T>;
  private options: QueryOptions<T> = {
    inlineCount: true,
  };

  constructor(metadata: ModelMetadata<T>) {
    this.metadata = metadata;
  }

  where(filter: FilterGroup<T>) {
    this.options.filter = filter;
    return this;
  }

  top(value: number) {
    this.options.top = value;
    return this;
  }

  skip(value: number) {
    this.options.skip = value;
    return this;
  }

  orderBy(field: keyof T, dir: 'asc' | 'desc' = 'desc') {
    this.options.orderBy = field;
    this.options.orderDirection = dir;
    return this;
  }

  expand(...fields: string[]) {
    this.options.expand = fields;
    return this;
  }

  select(...fields: (keyof T)[]) {
    this.options.select = fields;
    return this;
  }

  setOptions(options: QueryOptions<T>) {
    this.options = { ...this.options, ...options };
    return this;
  }

  build(): string {
    const params: string[] = [];

    if (this.options.filter) {
      params.push(
        `$filter=${serializeGroup(this.options.filter, this.metadata)}`,
      );
    }

    params.push(`$top=${this.options.top ?? 15}`);
    params.push(`$skip=${this.options.skip ?? 0}`);

    if (this.options.orderBy) {
      params.push(
        `$orderby=${String(this.options.orderBy)} ${this.options.orderDirection ?? 'desc'}`,
      );
    }

    if (this.options.expand?.length) {
      params.push(`$expand=${this.options.expand.join(',')}`);
    }

    if (this.options.select?.length) {
      params.push(`$select=${this.options.select.join(',')}`);
    }

    if (this.options.inlineCount) {
      params.push(`$inlinecount=allpages`);
    }

    return `?${params.join('&')}`;
  }
}

