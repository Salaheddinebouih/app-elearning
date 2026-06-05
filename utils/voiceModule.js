import { NativeModules, Platform } from 'react-native';

/** Charge Voice uniquement si le module natif est présent (development build). */
export function getVoiceModule() {
  if (Platform.OS === 'web' || !NativeModules.Voice) {
    return null;
  }
  try {
    return require('@react-native-voice/voice').default;
  } catch {
    return null;
  }
}

export const VOICE_UNAVAILABLE_MESSAGE =
  'La reconnaissance vocale nécessite une app compilée (pas Expo Go). Lancez : npx expo run:android sur un téléphone réel.';
