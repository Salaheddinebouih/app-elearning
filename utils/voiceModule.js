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
  if (Platform.OS === 'web') {
    return null;
  }
  
  // Always ensure listeners are configured when retrieving the module instance
  if (VoiceInstance.listeners.length === 0) {
    VoiceInstance.setupListeners();
  }
  
  return VoiceInstance;
}

export const VOICE_UNAVAILABLE_MESSAGE =
  "La reconnaissance vocale n'est pas disponible. Vérifiez que Google Speech Services est installé sur l'appareil.";
