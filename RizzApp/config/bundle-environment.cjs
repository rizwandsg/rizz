const {createHash}=require('node:crypto');
function environmentCacheVersion(env) {
  const settings=Object.keys(env).filter(key=>key.startsWith('EXPO_PUBLIC_')).sort().map(key=>[key,env[key]]);
  return createHash('sha256').update(JSON.stringify(settings)).digest('hex');
}
function assertWebRuntime(content,env) {
  const keys=['EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_SUPABASE_KEY','EXPO_PUBLIC_FIREBASE_PROJECT_ID','EXPO_PUBLIC_FIREBASE_API_KEY','EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN','EXPO_PUBLIC_FIREBASE_APP_ID'];
  if(keys.some(key=>!env[key]||!content.includes(env[key])) || ['bundle-test.example.com','sb_publishable_bundle_test','rizz-bundle.firebaseapp.com'].some(value=>content.includes(value))) {
    throw new Error('Exported web settings do not match the production environment. Rebuild with an isolated Metro cache.');
  }
}
module.exports={environmentCacheVersion,assertWebRuntime};
