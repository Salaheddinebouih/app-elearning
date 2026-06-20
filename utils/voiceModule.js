import { Platform } from 'react-native';

/**
 * Load the Voice module only if it was compiled into the binary.
 *
 * NOTE: @react-native-voice/voice registers its Android native module as
 * "RCTVoice" (see VoiceModule.java → getName()), NOT as "Voice".
 * Checking NativeModules.Voice therefore ALWAYS returns undefined, even in
 * a correctly-built APK, causing the unavailable warning to show on every
 * real device. The fix: skip the NativeModules guard and rely on try/catch.
 */
export function getVoiceModule() {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    const Voice = require('@react-native-voice/voice').default;
    // Basic sanity check — if native module is missing the JS wrapper will
    // throw on the first method call, so we verify start() is a function.
    if (!Voice || typeof Voice.start !== 'function') {
      return null;
    }
    return Voice;
  } catch {
    return null;
  }
}

export const VOICE_UNAVAILABLE_MESSAGE =
  "La reconnaissance vocale n'est pas disponible. Vérifiez que Google Speech Services est installé sur l'appareil.";
