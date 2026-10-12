import { useCallback, useEffect, useState } from 'react';
import { Animated } from 'react-native';

const TRANSITION_DURATION = 450;

export function useScreenFade() {
  const [opacity] = useState(() => new Animated.Value(0));

  const fadeIn = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: TRANSITION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  useEffect(() => {
    fadeIn();
  }, [fadeIn]);

  const fadeOut = useCallback(() => new Promise<void>((resolve) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: TRANSITION_DURATION,
      useNativeDriver: true,
    }).start(() => resolve());
  }), [opacity]);

  return { opacity, fadeIn, fadeOut };
}
