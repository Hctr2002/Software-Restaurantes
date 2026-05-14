import React from 'react';
import { Stack } from 'expo-router';
import { MB_COLORS } from '../../constants/MB_Theme';

export default function CashierLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: MB_COLORS.navy }
    }}>
      <Stack.Screen name="index" options={{ title: 'Caja' }} />
    </Stack>
  );
}
