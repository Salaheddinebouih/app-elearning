import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VoicePulse from './VoicePulse';
import WaveformAnimation from './WaveformAnimation';
import AnalysisLoader from './AnalysisLoader';

export default function RecordingAnimation({
  isRecording,
  isProcessing,
  voiceAvailable,
  handlePressIn,
  handlePressOut,
  language,
  t,
}) {
  const [reduceMotion, setReduceMotion] = useState(false);

  // Check for reduced motion settings
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  // Determine the status text based on language and state
  const getStatusText = () => {
    if (isRecording) {
      if (language === 'fr') {
        return '🎙️ Parlez maintenant...';
      } else if (language === 'ar') {
        return '🎙️ تحدث الآن...';
      } else {
        return '🎤 Listening...';
      }
    } else if (isProcessing) {
      return t('speechTracker.processing') || 'Analyzing...';
    } else {
      return t('speechTracker.pressToRead') || 'Hold to speak';
    }
  };

  const busy = isRecording || isProcessing;

  return (
    <View style={styles.container}>
      {/* VoicePulse wraps the button and displays waves only when recording */}
      <VoicePulse isRecording={isRecording && !reduceMotion}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!voiceAvailable || (isProcessing && !isRecording)}
          style={({ pressed }) => [
            styles.recordButton,
            !voiceAvailable && styles.recordButtonDisabled,
            isRecording && styles.recordButtonActive,
            pressed && voiceAvailable && !isRecording && styles.recordButtonPressed,
          ]}
          accessibilityLabel={
            isRecording ? 'Stop recording' : 'Hold to speak and record'
          }
          accessibilityRole="button"
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <Ionicons name="mic" size={40} color="#FFFFFF" />
          )}
        </Pressable>
      </VoicePulse>

      {/* Waveform Visualization during recording */}
      {isRecording && !reduceMotion && (
        <WaveformAnimation isRecording={isRecording} />
      )}

      {/* Speech analysis loader */}
      {isProcessing && !reduceMotion && (
        <AnalysisLoader isProcessing={isProcessing} />
      )}

      {/* Fallback spacers for reduced motion or empty states to prevent layout shifts */}
      {(!isRecording || reduceMotion) && !isProcessing && (
        <View style={styles.spacer} />
      )}

      {/* Status Text Display */}
      <Text style={styles.statusText}>{getStatusText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4F46E5', // Brand purple
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  recordButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowColor: '#94A3B8',
  },
  recordButtonActive: {
    backgroundColor: '#EF4444', // Red active color
    shadowColor: '#EF4444',
  },
  recordButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 20,
  },
  spacer: {
    height: 48,
    marginVertical: 14,
  },
});
