import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function BarLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.navy }
    }}>
      <Stack.Screen name="index" options={{ title: 'Monitor de Bar' }} />
    </Stack>
  );
}
