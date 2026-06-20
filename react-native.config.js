/**
 * react-native.config.js
 *
 * Explicit autolinking configuration for @react-native-voice/voice.
 *
 * @react-native-voice/voice v3.2.4 does not have a "react-native" field in its
 * package.json (required by React Native 0.60+ autolinking) and lacks an
 * expo-module.config.json. Without this file, autolinking may silently skip
 * the library during `expo prebuild` / `eas build`, causing NativeModules to
 * be empty on the device even in a compiled APK.
 */
module.exports = {
  dependencies: {
    '@react-native-voice/voice': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-voice/voice/android',
          packageImportPath: 'import com.wenkesj.voice.VoicePackage;',
          packageInstance: 'new VoicePackage()',
        },
        ios: null, // handled by CocoaPods via podspec
      },
    },
  },
};
