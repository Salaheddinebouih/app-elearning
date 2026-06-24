const path = require('path');
module.exports = {
  dependencies: {
    '@react-native-voice/voice': {
      platforms: {
        android: {
          sourceDir: path.join(__dirname, 'node_modules', '@react-native-voice/voice', 'android'),
          packageImportPath: 'import com.wenkesj.voice.VoicePackage;',
          packageInstance: 'new VoicePackage()',
        },
        ios: null,
      },
    },
  },
};
