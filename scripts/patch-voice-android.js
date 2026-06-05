const fs = require('fs');
const path = require('path');

const voiceGradle = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-voice',
  'voice',
  'android',
  'build.gradle'
);

if (!fs.existsSync(voiceGradle)) {
  process.exit(0);
}

let content = fs.readFileSync(voiceGradle, 'utf8');
const patched = content.replace(
  /implementation "com\.android\.support:appcompat-v7:\$\{supportVersion\}"/,
  'implementation "androidx.appcompat:appcompat:1.7.0"'
);

if (patched !== content) {
  fs.writeFileSync(voiceGradle, patched);
  console.log('patch-voice-android: migrated appcompat to AndroidX');
}
