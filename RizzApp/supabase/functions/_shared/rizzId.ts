export const RIZZ_ID_DOMAIN = 'rizz.com';
export function isRizzId(value: string): boolean { return value.trim().toLowerCase().endsWith('@' + RIZZ_ID_DOMAIN); }
export function normalizeRizzId(value: string): string {
  const normalized=value.trim().toLowerCase();
  const name=normalized.endsWith('@'+RIZZ_ID_DOMAIN) ? normalized.slice(0,-(RIZZ_ID_DOMAIN.length+1)) : normalized;
  if(!/^[a-z0-9][a-z0-9._-]{1,38}[a-z0-9]$/.test(name)||name.includes('..')) throw new Error('Rizz ID must contain 3 to 40 letters, numbers, dots, underscores or hyphens.');
  return name+'@'+RIZZ_ID_DOMAIN;
}
