import React from 'react';
import { Stack } from 'expo-router';
import { MB_COLORS } from '../../constants/MB_Theme';

export default function WaiterLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: MB_COLORS.navy }
    }}>
      <Stack.Screen name="index" options={{ title: 'Terminal de Garzón' }} />
      <Stack.Screen name="table/[id]" options={{ title: 'Tomar Pedido' }} />
    </Stack>
  );
}
