const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname, {
  isCSSEnabled: false,
});

const config = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    resolveRequest: (context, moduleName, platform) => {
      // Alias native-only modules to UnimplementedView for web platform
      if (platform === 'web' && moduleName === 'react-native/Libraries/Utilities/codegenNativeCommands') {
        return {
          filePath: require.resolve('react-native-web/dist/modules/UnimplementedView'),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = config;