import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';

export default function VoicePulse({ isRecording, children }) {
  // Animated values for three expanding rings
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  // Animated value for the button pulse itself
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Active animations reference to stop them cleanly
  const animationsRef = useRef([]);

  useEffect(() => {
    if (isRecording) {
      // Setup staggered expanding rings animations
      const createRingAnimation = (animatedValue, delay) => {
        animatedValue.setValue(0);
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            })
          ),
        ]);
      };

      const ringAnim1 = createRingAnimation(ring1, 0);
      const ringAnim2 = createRingAnimation(ring2, 600);
      const ringAnim3 = createRingAnimation(ring3, 1200);

      // Button scale pulse animation
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.08,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1.0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animationsRef.current = [ringAnim1, ringAnim2, ringAnim3, pulseAnim];

      // Start all animations parallelly
      Animated.parallel(animationsRef.current).start();
    } else {
      // Stop all active animations immediately
      animationsRef.current.forEach((anim) => anim.stop());
      animationsRef.current = [];

      // Reset animated values to baseline
      Animated.parallel([
        Animated.timing(ring1, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(ring2, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(ring3, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      animationsRef.current.forEach((anim) => anim.stop());
    };
  }, [isRecording, ring1, ring2, ring3, buttonScale]);

  // Interpolations for scale and opacity of the rings
  const getRingStyle = (animatedValue) => {
    return {
      transform: [
        {
          scale: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 2.3],
          }),
        },
      ],
      opacity: animatedValue.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [0.6, 0.3, 0],
      }),
    };
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <>
          <Animated.View style={[styles.ring, getRingStyle(ring1)]} />
          <Animated.View style={[styles.ring, getRingStyle(ring2)]} />
          <Animated.View style={[styles.ring, getRingStyle(ring3)]} />
        </>
      )}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 100,
    height: 100,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
});
