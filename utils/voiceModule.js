import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

class VoiceWrapper {
  constructor() {
    this.listeners = [];
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onSpeechResults = null;
    this.onSpeechError = null;
    this.onSpeechPartialResults = null;
    
    // Lifecycle tracking variables
    this.isRecognizing = false;
    this.hasSpeechEnded = false;
  }

  setupListeners() {
    // Clear any existing listeners first to prevent duplicates
    this.removeAllListeners();

    // start event
    this.listeners.push(
      ExpoSpeechRecognitionModule.addListener('start', () => {
        this.isRecognizing = true;
        this.hasSpeechEnded = false;
        if (typeof this.onSpeechStart === 'function') {
          this.onSpeechStart({ error: false });
        }
      })
    );

    // speechend event (fired when the user stops speaking)
    this.listeners.push(
      ExpoSpeechRecognitionModule.addListener('speechend', () => {
        if (!this.hasSpeechEnded) {
          this.hasSpeechEnded = true;
          if (typeof this.onSpeechEnd === 'function') {
            this.onSpeechEnd({ error: false });
          }
        }
      })
    );

    // audioend event (fired when capturing ends - fallback for speechend)
    this.listeners.push(
      ExpoSpeechRecognitionModule.addListener('audioend', () => {
        if (!this.hasSpeechEnded) {
          this.hasSpeechEnded = true;
          if (typeof this.onSpeechEnd === 'function') {
            this.onSpeechEnd({ error: false });
          }
        }
      })
    );

    // result event
    this.listeners.push(
      ExpoSpeechRecognitionModule.addListener('result', (event) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        
        // Handle final vs interim results
        if (event.isFinal) {
          this.isRecognizing = false;
          if (typeof this.onSpeechResults === 'function') {
            this.onSpeechResults({ value: [transcript] });
          }
        } else {
          if (typeof this.onSpeechPartialResults === 'function') {
            this.onSpeechPartialResults({ value: [transcript] });
          } else if (typeof this.onSpeechResults === 'function') {
            // Fallback: trigger onSpeechResults on interim results if partial results callback is not defined
            this.onSpeechResults({ value: [transcript] });
          }
        }
      })
    );

    // nomatch event (fired when speech is finished but no match is found)
    this.listeners.push(
      ExpoSpeechRecognitionModule.addListener('nomatch', () => {
        this.isRecognizing = false;
        if (typeof this.onSpeechResults === 'function') {
          this.onSpeechResults({ value: [] });
        }
      })
    );

    // error event
    this.listeners.push(
      ExpoSpeechRecognitionModule.addListener('error', (event) => {
        this.isRecognizing = false;
        if (typeof this.onSpeechError === 'function') {
          this.onSpeechError({
            error: {
              message: event.message || event.error || 'Speech recognition error',
              code: event.error,
            },
          });
        }
      })
    );

    // end event (fired when the session completely disconnects)
    this.listeners.push(
      ExpoSpeechRecognitionModule.addListener('end', () => {
        // Safe guard: if the session ended but we never received a final result, error, or nomatch
        if (this.isRecognizing) {
          this.isRecognizing = false;
          if (typeof this.onSpeechResults === 'function') {
            this.onSpeechResults({ value: [] });
          }
        }
      })
    );
  }

  async start(lang) {
    // Ensure native listeners are active before starting recognition
    if (this.listeners.length === 0) {
      this.setupListeners();
    }

    try {
      // Handle permissions using Expo APIs
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Speech recognition permission denied.');
      }

      // Start recognition
      await ExpoSpeechRecognitionModule.start({
        lang: lang || 'de-DE',
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      this.isRecognizing = false;
      if (typeof this.onSpeechError === 'function') {
        this.onSpeechError({
          error: {
            message: error.message || 'Failed to start speech recognition',
            code: 'start-failure',
          },
        });
      }
      throw error;
    }
  }

  async stop() {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.warn('[VoiceWrapper] stop() ignored error:', e.message);
    }
  }

  async cancel() {
    try {
      await ExpoSpeechRecognitionModule.abort();
    } catch (e) {
      // Prevent crash if cancel() is called when no recognition is running
      console.warn('[VoiceWrapper] cancel() ignored error:', e.message);
    }
  }

  async destroy() {
    try {
      await ExpoSpeechRecognitionModule.abort();
    } catch (e) {
      // Ignore errors if already stopped/aborted
    }
    this.removeAllListeners();
  }

  removeAllListeners() {
    this.listeners.forEach((listener) => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    });
    this.listeners = [];
  }
}

const VoiceInstance = new VoiceWrapper();

export function getVoiceModule() {
  if (Platform.OS === 'web') {
    return null;
  }
  
  // Ensure listeners are configured when retrieving the module instance
  if (VoiceInstance.listeners.length === 0) {
    VoiceInstance.setupListeners();
  }
  
  return VoiceInstance;
}

export const VOICE_UNAVAILABLE_MESSAGE =
  'Speech recognition is not available. Check that Google Speech Services is installed on your device.';
