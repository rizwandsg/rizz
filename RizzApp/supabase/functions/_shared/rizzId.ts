export const RIZZ_ID_DOMAIN = 'rizz.com';
export function isRizzId(value: string): boolean { return value.trim().toLowerCase().endsWith('@' + RIZZ_ID_DOMAIN); }
export function isManagedIdentityEmail(value: string): boolean { return /^[a-f0-9]{64}@rizz\.invalid$/.test(value); }
export function managedEmailFromDigest(digest: string): string {
  if(!/^[a-f0-9]{64}$/.test(digest))throw new Error('Invalid login digest');
  return digest+'@rizz.invalid';
}
export async function managedIdentityEmail(value: string): Promise<string> {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalizeRizzId(value)));
  return managedEmailFromDigest(Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''));
}
export function normalizeRizzId(value: string): string {
  const normalized=value.trim().toLowerCase();
  const name=normalized.endsWith('@'+RIZZ_ID_DOMAIN) ? normalized.slice(0,-(RIZZ_ID_DOMAIN.length+1)) : normalized;
  if(!/^[a-z0-9][a-z0-9._-]{1,38}[a-z0-9]$/.test(name)||name.includes('..')) throw new Error('Rizz ID must contain 3 to 40 letters, numbers, dots, underscores or hyphens.');
  return name+'@'+RIZZ_ID_DOMAIN;
}
