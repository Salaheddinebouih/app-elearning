import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';

const NUM_BARS = 9;
// Different max scales and durations for each bar to create a natural wave contour
const BAR_CONFIGS = [
  { maxScale: 0.4, duration: 380 },
  { maxScale: 0.7, duration: 480 },
  { maxScale: 1.1, duration: 420 },
  { maxScale: 1.5, duration: 550 },
  { maxScale: 1.8, duration: 500 }, // Center bar (tallest)
  { maxScale: 1.5, duration: 520 },
  { maxScale: 1.1, duration: 440 },
  { maxScale: 0.7, duration: 460 },
  { maxScale: 0.4, duration: 400 },
];

export default function WaveformAnimation({ isRecording }) {
  // Animated values for scaleY of each bar
  const barScales = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0.15))
  ).current;

  // Animated value for container entrance/exit opacity
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerTranslateY = useRef(new Animated.Value(10)).current;

  // Keep references to active loops
  const activeLoops = useRef([]);

  useEffect(() => {
    if (isRecording) {
      // Fade in the waveform container
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(containerTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Start looping animation for each individual bar
      activeLoops.current = BAR_CONFIGS.map((config, index) => {
        const animVal = barScales[index];
        animVal.setValue(0.15);

        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(animVal, {
              toValue: config.maxScale,
              duration: config.duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(animVal, {
              toValue: 0.15,
              duration: config.duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
        loop.start();
        return loop;
      });
    } else {
      // Stop all active loops
      activeLoops.current.forEach((loop) => loop.stop());
      activeLoops.current = [];

      // Fade out and slide down the container
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(containerTranslateY, {
          toValue: 10,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        // Animate all bars back to baseline scale
        ...barScales.map((animVal) =>
          Animated.timing(animVal, {
            toValue: 0.15,
            duration: 250,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }

    return () => {
      activeLoops.current.forEach((loop) => loop.stop());
    };
  }, [isRecording, barScales, containerOpacity, containerTranslateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ translateY: containerTranslateY }],
        },
      ]}
    >
      <View style={styles.waveformRow}>
        {barScales.map((scaleVal, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                transform: [{ scaleY: scaleVal }],
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 5,
  },
  bar: {
    width: 4,
    height: 28,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
});
