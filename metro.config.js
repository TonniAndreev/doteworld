const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // CSS is disabled for React Native
});

// Ensure we're targeting mobile platforms
config.resolver.platforms = ['ios', 'android', 'native'];

module.exports = config;