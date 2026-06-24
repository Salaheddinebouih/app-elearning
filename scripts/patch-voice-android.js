const fs = require('fs');
const path = require('path');

let patchFailed = false;

function fail(msg) {
  console.error('patch-voice-android ERROR:', msg);
  patchFailed = true;
}

// ── 1. Patch android/build.gradle: migrate appcompat to AndroidX ─────────────
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
  console.warn('patch-voice-android: build.gradle not found — skipping AndroidX patch');
} else {
  let content = fs.readFileSync(voiceGradle, 'utf8');
  const patched = content.replace(
    /implementation "com\.android\.support:appcompat-v7:\$\{supportVersion\}"/,
    'implementation "androidx.appcompat:appcompat:1.7.0"'
  );

  if (patched !== content) {
    fs.writeFileSync(voiceGradle, patched);
    console.log('patch-voice-android: migrated appcompat to AndroidX ✓');
  } else {
    console.log('patch-voice-android: build.gradle already patched or pattern not found — skipping');
  }
}

// ── 2. Patch dist/index.js ────────────────────────────────────────────────────
//
// ROOT CAUSE (proven from source code, not speculation):
//
//   dist/index.js line 8:
//     const Voice = NativeModules.Voice;
//
//   This is a module-level variable captured ONCE when the module is first
//   require()'d by Metro Bundler. On Android, the native module registers
//   itself as "RCTVoice" (VoiceModule.java → getName() returns "RCTVoice"),
//   NOT as "Voice". Therefore NativeModules.Voice === undefined at module
//   load time, and Voice = undefined is frozen in the closure forever.
//
//   dist/index.js lines 94–107 (cancel method):
//     cancel() {
//       if (!this._loaded && !this._listeners) {
//         return Promise.resolve();   ← skipped after first start()
//       }
//       return new Promise((resolve, reject) => {
//         Voice.cancelSpeech(...)     ← Voice is undefined → CRASH
//       });
//     }
//
// FIX: Replace the static assignment with a Proxy-based lazy getter that
//      reads NativeModules.Voice OR NativeModules.RCTVoice at the moment
//      of each native call — not at module-load time.
//
const SEARCH_STRING = 'const Voice = react_native_1.NativeModules.Voice;';
const REPLACEMENT = [
  '// PATCHED_BY_POSTINSTALL: lazy getter so RCTVoice alias is resolved at call time',
  'const getVoice = () => react_native_1.NativeModules.Voice || react_native_1.NativeModules.RCTVoice || null;',
  'const Voice = new Proxy({}, {',
  '  get(_, prop) {',
  '    const v = getVoice();',
  '    if (!v) { console.warn("[RCTVoice] Native module not found for prop:", prop); return undefined; }',
  '    return typeof v[prop] === "function" ? v[prop].bind(v) : v[prop];',
  '  }',
  '});',
].join('\n');

const EMITTER_SEARCH  = "const voiceEmitter = react_native_1.Platform.OS !== 'web' ? new react_native_1.NativeEventEmitter(Voice) : null;";
const EMITTER_REPLACE = "const voiceEmitter = react_native_1.Platform.OS !== 'web' ? new react_native_1.NativeEventEmitter(getVoice()) : null;";

const voiceIndex = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-voice',
  'voice',
  'dist',
  'index.js'
);

if (!fs.existsSync(voiceIndex)) {
  fail('dist/index.js not found — @react-native-voice/voice may not be installed');
} else {
  let content = fs.readFileSync(voiceIndex, 'utf8');

  if (content.includes('PATCHED_BY_POSTINSTALL')) {
    console.log('patch-voice-android: dist/index.js already patched — skipping ✓');
  } else {
    // Verify the search strings actually exist before patching
    if (!content.includes(SEARCH_STRING)) {
      fail(
        'dist/index.js does not contain expected string:\n  "' + SEARCH_STRING + '"\n' +
        '  The library may have been updated. Manual inspection required.'
      );
    } else {
      let patched = content.replace(SEARCH_STRING, REPLACEMENT);

      if (content.includes(EMITTER_SEARCH)) {
        patched = patched.replace(EMITTER_SEARCH, EMITTER_REPLACE);
      }

      // Verify the patch actually applied
      if (!patched.includes('PATCHED_BY_POSTINSTALL')) {
        fail('Patch did not apply — string replacement produced no change.');
      } else {
        fs.writeFileSync(voiceIndex, patched);
        console.log('patch-voice-android: patched dist/index.js with lazy Voice getter ✓');

        // Final verification read
        const verify = fs.readFileSync(voiceIndex, 'utf8');
        if (!verify.includes('PATCHED_BY_POSTINSTALL')) {
          fail('Write verification failed — file on disk does not contain the patch.');
        } else {
          console.log('patch-voice-android: write verification passed ✓');
        }
      }
    }
  }
}

// ── Exit with non-zero code if anything failed ────────────────────────────────
if (patchFailed) {
  console.error('patch-voice-android: one or more patches FAILED — see errors above.');
  process.exit(1);
} else {
  console.log('patch-voice-android: all patches applied successfully ✓');
}
