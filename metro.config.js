const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: false,
});
config.resolver.sourceExts.push('cjs'),
config.resolver.unstable_enablePackageExports = true,
// Handle platform-specific extensions
config.resolver.platforms = ['ios', 'android'];

module.exports = config;