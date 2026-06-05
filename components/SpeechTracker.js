import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { getVoiceModule, VOICE_UNAVAILABLE_MESSAGE } from '../utils/voiceModule';

const ARABIC_DIACRITICS = /َ|ً|ُ|ٌ|ِ|ٍ|ْ|ّ|ـ/g;

export function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(ARABIC_DIACRITICS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compareSpeech(targetText, spokenText) {
  const targetWords = normalizeText(targetText).split(' ').filter(Boolean);
  const spokenWords = normalizeText(spokenText).split(' ').filter(Boolean);

  let correctCount = 0;
  const wordResults = targetWords.map((word, index) => {
    const correct = spokenWords[index] === word;
    if (correct) correctCount += 1;
    return { word, correct };
  });

  const accuracy =
    targetWords.length > 0
      ? Math.round((correctCount / targetWords.length) * 100)
      : 0;

  return { wordResults, accuracy };
}

async function requestMicrophonePermission() {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export default function SpeechTracker({ targetText = '' }) {
  const Voice = useMemo(() => getVoiceModule(), []);
  const voiceAvailable = Voice != null;

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [wordResults, setWordResults] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(
    voiceAvailable ? null : VOICE_UNAVAILABLE_MESSAGE
  );

  const applyResults = useCallback(
    (transcript) => {
      const text = transcript?.trim() ?? '';
      setSpokenText(text);
      if (!text) {
        setWordResults([]);
        setAccuracy(0);
        return;
      }
      const { wordResults: results, accuracy: pct } = compareSpeech(
        targetText,
        text
      );
      setWordResults(results);
      setAccuracy(pct);
    },
    [targetText]
  );

  useEffect(() => {
    if (!Voice) return undefined;

    Voice.onSpeechStart = () => {
      setIsRecording(true);
      setError(null);
    };

    Voice.onSpeechEnd = () => {
      setIsRecording(false);
      setIsProcessing(true);
    };

    Voice.onSpeechResults = (event) => {
      setIsProcessing(false);
      const transcript = event.value?.[0] ?? '';
      applyResults(transcript);
    };

    Voice.onSpeechError = (event) => {
      setIsRecording(false);
      setIsProcessing(false);
      const message =
        event.error?.message ||
        'La reconnaissance vocale a échoué. Réessayez sur un appareil réel.';
      setError(message);
    };

    return () => {
      Voice.destroy()
        .then(Voice.removeAllListeners)
        .catch(() => Voice.removeAllListeners());
    };
  }, [Voice, applyResults]);

  const startRecording = async () => {
    if (!Voice) {
      setError(VOICE_UNAVAILABLE_MESSAGE);
      return;
    }

    setError(null);
    setSpokenText('');
    setWordResults([]);
    setAccuracy(null);

    const granted = await requestMicrophonePermission();
    if (!granted) {
      setError(
        'Permission micro refusée. Activez le micro dans les réglages de l’appareil.'
      );
      return;
    }

    try {
      await Voice.cancel();
      await Voice.start('ar-SA');
    } catch (err) {
      setIsRecording(false);
      setIsProcessing(false);
      setError(
        err?.message ||
          'Impossible de démarrer l’enregistrement. Utilisez un development build sur appareil réel.'
      );
    }
  };

  const stopRecording = async () => {
    if (!Voice) return;

    try {
      await Voice.stop();
    } catch (err) {
      setIsRecording(false);
      setIsProcessing(false);
      setError(err?.message || 'Impossible d’arrêter l’enregistrement.');
    }
  };

  const handlePressIn = () => {
    if (!voiceAvailable || isRecording || isProcessing) return;
    startRecording();
  };

  const handlePressOut = () => {
    if (!voiceAvailable || (!isRecording && !isProcessing)) return;
    stopRecording();
  };

  const busy = isRecording || isProcessing;

  return (
    <View style={styles.container}>
      <Text style={styles.targetLabel}>Texte à lire</Text>
      <Text style={styles.targetText}>{targetText}</Text>

      {!voiceAvailable && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{VOICE_UNAVAILABLE_MESSAGE}</Text>
        </View>
      )}

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!voiceAvailable || (busy && !isRecording)}
        style={({ pressed }) => [
          styles.recordButton,
          !voiceAvailable && styles.recordButtonDisabled,
          isRecording && styles.recordButtonActive,
          pressed && voiceAvailable && !isRecording && styles.recordButtonPressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" size="large" />
        ) : (
          <Text style={styles.recordButtonText}>Appuyer pour lire</Text>
        )}
      </Pressable>

      {isRecording && (
        <Text style={styles.statusText}>Enregistrement en cours…</Text>
      )}
      {isProcessing && !isRecording && (
        <Text style={styles.statusText}>Analyse de votre lecture…</Text>
      )}

      {error && voiceAvailable ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {accuracy !== null && (
        <View style={styles.resultsSection}>
          <Text style={styles.accuracyText}>Précision : {accuracy}%</Text>

          <Text style={styles.sectionLabel}>Mots du texte cible</Text>
          <View style={styles.wordsRow}>
            {wordResults.map((item, index) => (
              <Text
                key={`${item.word}-${index}`}
                style={[
                  styles.wordChip,
                  item.correct ? styles.wordCorrect : styles.wordIncorrect,
                ]}
              >
                {item.word}
              </Text>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Vous avez dit</Text>
          <Text style={styles.spokenText}>
            {spokenText || '— (aucune parole détectée)'}
          </Text>
        </View>
      )}

      {Platform.OS === 'ios' && (
        <Text style={styles.hint}>
          Testez sur un iPhone réel — le simulateur ne gère pas bien le micro.
        </Text>
      )}
      {Platform.OS === 'android' && (
        <Text style={styles.hint}>
          Testez sur un téléphone Android réel avec Google Speech installé.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  targetLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  targetText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 32,
    writingDirection: 'rtl',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  recordButton: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  recordButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  recordButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsSection: {
    marginTop: 20,
  },
  accuracyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
    textAlign: 'center',
  },
  wordsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  wordChip: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  wordCorrect: {
    color: '#16A34A',
  },
  wordIncorrect: {
    color: '#DC2626',
  },
  spokenText: {
    fontSize: 20,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 32,
    writingDirection: 'rtl',
  },
  hint: {
    marginTop: 24,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
