import React from 'react';
import { Stack } from 'expo-router';
import { MB_COLORS } from '../../constants/MB_Theme';

export default function KitchenLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: MB_COLORS.navy }
    }}>
      <Stack.Screen name="index" options={{ title: 'Monitor de Cocina' }} />
    </Stack>
  );
}
