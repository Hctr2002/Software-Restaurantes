import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function WaiterLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.navy }
    }}>
      <Stack.Screen name="index" options={{ title: 'Terminal de Garzón' }} />
      <Stack.Screen name="table/[id]" options={{ title: 'Tomar Pedido' }} />
    </Stack>
  );
}
