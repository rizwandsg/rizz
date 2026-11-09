import { beforeEach, expect, it, vi } from 'vitest';
import { createSecureAuthStorage } from '../services/secureAuthStorage';
let data: Map<string,string>;
let sequence=0;
const store={getItemAsync:vi.fn(),setItemAsync:vi.fn(),deleteItemAsync:vi.fn()};
let storage:ReturnType<typeof createSecureAuthStorage>;
beforeEach(()=>{
  data=new Map(); sequence=0;
  store.getItemAsync.mockReset().mockImplementation(async key=>data.get(key)??null);
  store.setItemAsync.mockReset().mockImplementation(async (key,value)=>{expect(Buffer.byteLength(value)).toBeLessThanOrEqual(2000);data.set(key,value);});
  store.deleteItemAsync.mockReset().mockImplementation(async key=>{data.delete(key);});
  storage=createSecureAuthStorage(store,async key=>key,()=>String(++sequence));
});
it.each(['','abc','🎉नाम'.repeat(2000),'x'.repeat(120000)])('round trips secure storage including Unicode and large sessions',async value=>{
  await storage.setItem('identity',value); expect(await storage.getItem('identity')).toBe(value);
  await storage.removeItem('identity'); expect(await storage.getItem('identity')).toBeNull(); expect(data.size).toBe(0);
});
it('keeps the previous session when writing a replacement fails',async()=>{
  await storage.setItem('identity','previous'); store.setItemAsync.mockRejectedValueOnce(new Error('Storage unavailable'));
  await expect(storage.setItem('identity','replacement')).rejects.toThrow(); expect(await storage.getItem('identity')).toBe('previous');
});
it('serializes writes and sign-out to avoid resurrecting a token',async()=>{
  await Promise.all([storage.setItem('identity','first'),storage.setItem('identity','second'),storage.removeItem('identity')]);
  expect(await storage.getItem('identity')).toBeNull(); expect(data.size).toBe(0);
});
it.each(['not-json','{"version":"../../outside","count":1}','{"version":"ok","count":999}'])('recovers corrupt manifests without reading arbitrary keys',async manifest=>{
  data.set('rizz.auth.identity',manifest); expect(await storage.getItem('identity')).toBeNull();
  await storage.setItem('identity','new'); expect(await storage.getItem('identity')).toBe('new');
  expect(store.getItemAsync.mock.calls.every(([key])=>!key.includes('outside'))).toBe(true);
});
it('recovers an incomplete persisted session',async()=>{
  await storage.setItem('identity','previous'); data.delete('rizz.auth.identity.1.0'); expect(await storage.getItem('identity')).toBeNull();
});
it('does not destroy the current session on capacity rejection',async()=>{
  await storage.setItem('identity','previous'); await expect(storage.setItem('identity','x'.repeat(128001))).rejects.toThrow('capacity');
  expect(await storage.getItem('identity')).toBe('previous');
});
