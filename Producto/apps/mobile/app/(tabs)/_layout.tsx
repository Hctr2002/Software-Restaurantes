import React from 'react';
import { Tabs } from 'expo-router';
import { Utensils } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          display: 'none', // Hiding the tab bar since we only have one screen now
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Utensils size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
