const { getDefaultConfig } = require('expo/metro-config');
const { validateEnvironment } = require('./config/runtime-config.cjs');
const {environmentCacheVersion}=require('./config/bundle-environment.cjs');

// Config discovery must work before EAS retrieves its remote environment.
// Actual bundling must never proceed without valid runtime configuration.
validateEnvironment(process.env, ['preview', 'production','production-apk'].includes(process.env.EAS_BUILD_PROFILE));
const config=getDefaultConfig(__dirname);
// Expo embeds public settings in transformed modules, including web Constants.
// Synthetic verification exports must never supply cached settings to a release.
config.cacheVersion=(config.cacheVersion||'1.0')+':'+environmentCacheVersion(process.env);
module.exports = config;
