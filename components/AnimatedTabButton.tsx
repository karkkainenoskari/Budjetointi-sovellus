import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';

export default function AnimatedTabButton({
  accessibilityState,
  ...rest
}: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected;
  const scale = useRef(new Animated.Value(focused ? 1 : 0.95)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: focused ? 1 : 0.95,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.8,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, opacity]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <PlatformPressable accessibilityState={accessibilityState} {...rest} />
    </Animated.View>
  );
}