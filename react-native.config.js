const path = require('path');
module.exports = {
  dependencies: {
    '@react-native-voice/voice': {
      platforms: {
        android: {
          sourceDir: 'android',
          packageImportPath: 'import com.wenkesj.voice.VoicePackage;',
          packageInstance: 'new VoicePackage()',
        },
        ios: null,
      },
    },
  },
};
