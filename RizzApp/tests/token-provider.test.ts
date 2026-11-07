import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({accessToken:null as null | (()=>Promise<string|null>)}));
vi.mock('expo-constants',()=>({default:{expoConfig:{extra:{supabaseUrl:'https://simulation.invalid',supabaseKey:'simulation'}}}}));
vi.mock('@supabase/supabase-js',()=>({createClient:(_url:string,_key:string,options:any)=>{state.accessToken=options.accessToken;return {};}}));
import { requireAccessToken, setAccessTokenProvider } from '../services/supabaseClient';
beforeEach(()=>setAccessTokenProvider(null));
it('rejects a token that resolves after logout or account replacement',async()=>{
  for(const next of [null,async()=> 'next-session-token']){
    let finish!: (value:string)=>void;
    setAccessTokenProvider(()=>new Promise(resolve=>{finish=resolve;}));
    const pending=requireAccessToken();
    setAccessTokenProvider(next);
    finish('previous-session-token');
    await expect(pending).rejects.toThrow('Session changed');
  }
});
it('uses the same generation guard for Supabase automatic token requests',async()=>{
  let finish!: (value:string)=>void;
  setAccessTokenProvider(()=>new Promise(resolve=>{finish=resolve;}));
  const pending=state.accessToken!();
  setAccessTokenProvider(null);
  finish('previous-session-token');
  await expect(pending).rejects.toThrow('Session changed');
  await expect(requireAccessToken()).rejects.toThrow('Please sign in again');
  setAccessTokenProvider(async()=> 'current-session-token');
  await expect(requireAccessToken()).resolves.toBe('current-session-token');
});
