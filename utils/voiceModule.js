import { Platform, NativeModules } from 'react-native';

// ─── POLYFILL — must run at module-load time, before any require() ───────────
//
// @react-native-voice/voice dist/index.js line 8 reads:
//   const Voice = NativeModules.Voice;
//
// That line executes the very first time the module is required by Metro.
// On Android the native module registers as "RCTVoice" (VoiceModule.java getName()).
// We alias it here — at the TOP LEVEL — so it is in place before Metro evaluates
// the library's module-level code.
//
if (
  Platform.OS === 'android' &&
  !NativeModules.Voice &&
  NativeModules.RCTVoice
) {
  NativeModules.Voice = NativeModules.RCTVoice;
}

// ─── Debug logs (can be removed after confirmation) ──────────────────────────
console.log('NativeModules.Voice  =', NativeModules?.Voice);
console.log('NativeModules.RCTVoice =', NativeModules?.RCTVoice);

// ─── Exported helper ─────────────────────────────────────────────────────────

export function getVoiceModule() {
  if (Platform.OS === 'web') return null;

  try {
    const Voice = require('@react-native-voice/voice').default;

    console.log('Voice object =', Voice);
    console.log('Voice.start typeof =', typeof Voice?.start);

    // If native side is missing, the JS wrapper exists but its bridge methods
    // will be undefined or will throw when called.
    if (!Voice || typeof Voice.start !== 'function') {
      console.error('[voiceModule] JS wrapper invalid — native module not linked.');
      return null;
    }

    return Voice;
  } catch (err) {
    console.error('[voiceModule] require() threw:', err);
    return null;
  }
}

export const VOICE_UNAVAILABLE_MESSAGE =
  "La reconnaissance vocale n'est pas disponible. Vérifiez que Google Speech Services est installé sur l'appareil.";
