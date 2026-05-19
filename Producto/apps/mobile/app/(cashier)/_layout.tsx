import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function CashierLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.navy }
    }}>
      <Stack.Screen name="index" options={{ title: 'Caja' }} />
    </Stack>
  );
}
