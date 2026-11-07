const { getDefaultConfig } = require('expo/metro-config');
const { validateEnvironment } = require('./config/runtime-config.cjs');

// Config discovery must work before EAS retrieves its remote environment.
// Actual bundling must never proceed without valid runtime configuration.
validateEnvironment(process.env, ['preview', 'production'].includes(process.env.EAS_BUILD_PROFILE));
module.exports = getDefaultConfig(__dirname);
