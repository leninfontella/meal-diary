import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

export function ScreenLoader() {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const delay = setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 250);
    return () => clearTimeout(delay);
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <ActivityIndicator color={colors.sageDark} size="large" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
