import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

let tokenProvider: (() => Promise<string | null>) | null = null;
let providerGeneration = 0;
export function setAccessTokenProvider(provider: (() => Promise<string | null>) | null) { tokenProvider = provider; providerGeneration++; }
async function currentAccessToken(): Promise<string | null> {
  const started = providerGeneration;
  const token = await tokenProvider?.() ?? null;
  if (started !== providerGeneration) throw new Error('Session changed. Please sign in again');
  return token;
}
export async function requireAccessToken(): Promise<string> {
  const token = await currentAccessToken();
  if (!token) throw new Error('Please sign in again');
  return token;
}
const extra = Constants.expoConfig?.extra;
export const supabase = createClient(extra?.supabaseUrl, extra?.supabaseKey, {
  accessToken: currentAccessToken,
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
