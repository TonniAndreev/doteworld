import 'dotenv/config';

export default {
  // EAS CLI and build profiles
  cli: {
    version: ">= 16.13.2",
    appVersionSource: "remote"
  },
  build: {
    internal: {
      distribution: "internal",
      android: { buildType: "apk" }
    },
    development: {
      developmentClient: true,
      distribution: "internal"
    },
    preview: {
      distribution: "internal"
    },
    production: {
      autoIncrement: true
    }
  },
  submit: {
    production: {}
  },

  // Expo config
  expo: {
    name: "Dote",
    slug: "doteapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "doteapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      package: "com.dungyov.doteapp",
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-location",
        { locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location." }
      ],
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: { projectId: "7ebc011e-e3d1-4ff9-b2f6-1b6f3d409234" }
    }
  }
};
