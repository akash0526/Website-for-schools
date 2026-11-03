import type { Filter, ListQuery } from '../domain/ports.js';
export function matches<T>(item: T, filter: Filter<T>): boolean {
  const value = item[filter.field];
  switch (filter.op) {
    case 'eq':
      return value === filter.value;
    case 'gte':
      return String(value) >= String(filter.value);
    case 'lte':
      return String(value) <= String(filter.value);
    case 'ilike':
      return String(value)
        .toLowerCase()
        .includes(String(filter.value).replace(/[%_]/g, '').toLowerCase());
    case 'in':
      return Array.isArray(filter.value) && filter.value.includes(String(value));
  }
}
export function queryItems<T>(items: T[], query: ListQuery<T> = {}) {
  let result = items.filter((item) =>
    (query.filters || []).every((filter) => matches(item, filter)),
  );
  for (const order of [...(query.order || [])].reverse())
    result.sort((a, b) => {
      const av = a[order.field],
        bv = b[order.field];
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return order.ascending ? cmp : -cmp;
    });
  const page = query.page || 1,
    limit = query.limit || 50,
    total = result.length;
  result = result.slice((page - 1) * limit, page * limit);
  return { items: result, total, page, limit };
}
