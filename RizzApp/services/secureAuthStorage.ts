// Firebase persistence adapter. Native tokens remain in the OS secure store.
// Small chunks handle platforms that reject values larger than about 2 KB.
export interface SecureStoreAdapter {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}
export function createSecureAuthStorage(store: SecureStoreAdapter, hash: (key: string) => Promise<string>, uuid: () => string) {
  const pending = new Map<string, Promise<unknown>>();
  function serialize<T>(key: string, action: () => Promise<T>): Promise<T> {
    const result = (pending.get(key) || Promise.resolve()).catch(() => {}).then(action);
    pending.set(key, result);
    void result.finally(() => { if (pending.get(key) === result) pending.delete(key); }).catch(() => {});
    return result;
  }
  async function location(key: string) { return 'rizz.auth.' + await hash(key); }
  async function chunks(key: string): Promise<string[]> {
    const raw = await store.getItemAsync(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as { version?: string; count?: number };
      if (!parsed || typeof parsed.version !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(parsed.version) ||
          !Number.isInteger(parsed.count) || parsed.count! < 1 || parsed.count! > 128) throw new Error('Invalid manifest');
      return Array.from({ length: parsed.count! }, (_, i) => `${key}.${parsed.version}.${i}`);
    } catch {
      await store.deleteItemAsync(key);
      return [];
    }
  }
  async function discard(keys: string[]) { await Promise.all(keys.map(key => store.deleteItemAsync(key).catch(() => {}))); }
  return {
    getItem: (key: string): Promise<string | null> => serialize(key, async () => {
      const prefix = await location(key);
      const names = await chunks(prefix);
      if (!names.length) return null;
      const values = await Promise.all(names.map(name => store.getItemAsync(name)));
      if (values.some(value => value === null)) {
        await store.deleteItemAsync(prefix);
        await discard(names);
        return null;
      }
      try { const value: unknown = JSON.parse(values.join('')); if (typeof value !== 'string') throw new Error('Invalid session'); return value; }
      catch { await store.deleteItemAsync(prefix); await discard(names); return null; }
    }),
    setItem: (key: string, value: string): Promise<void> => serialize(key, async () => {
      // ASCII encoding avoids splitting UTF-16 surrogate pairs between chunks.
      const encoded = JSON.stringify(value).replace(/[\u007f-\uffff]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
      if (encoded.length > 128000) throw new Error('Sign-in state exceeds secure storage capacity');
      const prefix = await location(key);
      const old = await chunks(prefix);
      const version = uuid();
      if (!/^[a-zA-Z0-9-]{1,80}$/.test(version)) throw new Error('Invalid storage version');
      const names: string[] = [];
      try {
        for (let start = 0; start < encoded.length; start += 1000) {
          const name = `${prefix}.${version}.${names.length}`;
          names.push(name);
          await store.setItemAsync(name, encoded.slice(start, start + 1000));
        }
        await store.setItemAsync(prefix, JSON.stringify({ version, count: names.length }));
      } catch (error) { await discard(names); throw error; }
      await discard(old);
    }),
    removeItem: (key: string): Promise<void> => serialize(key, async () => {
      const prefix = await location(key);
      // Removing the pointer revokes persisted access even if orphan cleanup fails.
      let old: string[] = [];
      try { old = await chunks(prefix); } catch { /* Clear a corrupt manifest too. */ }
      await store.deleteItemAsync(prefix);
      await discard(old);
    }),
  };
}
