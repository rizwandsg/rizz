export type QueryFilter = { column: string; operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'; value: string };
export function parseFilters(filter: string): QueryFilter[] {
  return filter.split(',').map(part => {
    // Values can contain periods (email, decimals, timestamps).
    const match = /^([a-z_][a-z0-9_]*)\.(eq|neq|gte|lte|gt|lt)\.(.+)$/i.exec(part);
    if (!match) throw new Error('Invalid query filter');
    return { column: match[1], operator: match[2] as QueryFilter['operator'], value: match[3] };
  });
}
