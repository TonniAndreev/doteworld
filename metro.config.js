const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: false,
});

// Handle platform-specific extensions
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;