import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';

export default function AnalysisLoader({ isProcessing }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const activeAnimations = useRef([]);

  useEffect(() => {
    if (isProcessing) {
      const createDotAnimation = (animatedValue, delay) => {
        animatedValue.setValue(0);
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(animatedValue, {
                toValue: 1,
                duration: 400,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: 400,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          ),
        ]);
      };

      const anim1 = createDotAnimation(dot1, 0);
      const anim2 = createDotAnimation(dot2, 150);
      const anim3 = createDotAnimation(dot3, 300);

      activeAnimations.current = [anim1, anim2, anim3];
      Animated.parallel(activeAnimations.current).start();
    } else {
      activeAnimations.current.forEach((anim) => anim.stop());
      activeAnimations.current = [];
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }

    return () => {
      activeAnimations.current.forEach((anim) => anim.stop());
    };
  }, [isProcessing, dot1, dot2, dot3]);

  const getDotStyle = (animatedValue) => {
    return {
      opacity: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1.0],
      }),
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -6],
          }),
        },
      ],
    };
  };

  if (!isProcessing) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 8,
    marginVertical: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5', // Theme brand color
  },
});
