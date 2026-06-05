const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/** Fix AndroidX vs support-lib manifest merger (@react-native-voice/voice). */
function withAndroidXManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    app.$['android:appComponentFactory'] =
      'androidx.core.app.CoreComponentFactory';
    app.$['tools:replace'] = 'android:appComponentFactory';

    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return config;
  });
}

module.exports = withAndroidXManifestFix;
