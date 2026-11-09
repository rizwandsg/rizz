import * as Crypto from 'expo-crypto';
import {managedEmailFromDigest,normalizeRizzId} from '../supabase/functions/_shared/rizzId';
export { isRizzId, normalizeRizzId, RIZZ_ID_DOMAIN,isManagedIdentityEmail } from '../supabase/functions/_shared/rizzId';
export async function rizzIdLoginEmail(value:string):Promise<string>{
  return managedEmailFromDigest(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,normalizeRizzId(value)));
}
