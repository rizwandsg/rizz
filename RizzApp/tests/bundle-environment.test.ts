import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const {environmentCacheVersion,assertWebRuntime}=createRequire(import.meta.url)('../config/bundle-environment.cjs');
const env={EXPO_PUBLIC_SUPABASE_URL:'https://production.example.test',EXPO_PUBLIC_SUPABASE_KEY:'sb_publishable_production',EXPO_PUBLIC_FIREBASE_PROJECT_ID:'rizz-production',EXPO_PUBLIC_FIREBASE_API_KEY:'public-firebase-key',EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:'rizz-production.firebaseapp.com',EXPO_PUBLIC_FIREBASE_APP_ID:'1:123:web:abcdef'};
it.each(Object.keys(env))('isolates cached modules when %s changes',key=>{
 expect(environmentCacheVersion(env)).not.toBe(environmentCacheVersion({...env,[key]:'different'}));
});
it('keeps cache keys deterministic without exposing settings',()=>{
 const key=environmentCacheVersion(env);
 expect(key).toBe(environmentCacheVersion(Object.fromEntries(Object.entries(env).reverse())));
 expect(key).not.toContain(env.EXPO_PUBLIC_SUPABASE_KEY);
});
it('accepts a complete matching export and rejects mixed cached settings without exposing keys',()=>{
 const content=Object.values(env).join('\n');expect(()=>assertWebRuntime(content,env)).not.toThrow();
 expect(()=>assertWebRuntime(content.replace(env.EXPO_PUBLIC_SUPABASE_URL,'https://bundle-test.example.com'),env)).toThrow('do not match');
 expect(()=>assertWebRuntime(content+'\nsb_publishable_bundle_test',env)).toThrow('do not match');
 expect(()=>assertWebRuntime('',env)).toThrow('do not match');
});
