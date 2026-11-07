const { spawnSync } = require('node:child_process');
const path = require('node:path');
const platform = process.argv[2] || 'android';
if (!['android','ios','web'].includes(platform)) throw new Error('Unsupported platform');
const env = { ...process.env, CI: '1', EAS_BUILD_PROFILE: '', EXPO_NO_DOTENV: '1', EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k', EXPO_PUBLIC_SUPABASE_URL: 'https://bundle-test.example.com', EXPO_PUBLIC_SUPABASE_KEY: 'sb_publishable_bundle_test', EXPO_PUBLIC_API_URL: '', EXPO_PUBLIC_BACKEND_CONTRACT_VERSION: '2' };
const result = spawnSync(process.execPath, [path.resolve('node_modules/expo/bin/cli'), 'export', '--platform', platform, '--max-workers', '2', '--output-dir', 'dist/verify-' + platform], { env, stdio: 'inherit' });
process.exit(result.status ?? 1);
