import React from 'react';
import { Stack } from 'expo-router';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Menu as MenuIcon, Bell } from 'lucide-react-native';
import { MB_COLORS } from '../../constants/MB_Theme';
import AdminSideMenu from '../../components/AdminSideMenu';

export default function AdminLayout() {
  const [menuVisible, setMenuVisible] = React.useState(false);

  const HeaderLeft = () => (
    <TouchableOpacity 
      onPress={() => setMenuVisible(true)} 
      style={styles.headerButton}
    >
      <MenuIcon color={MB_COLORS.brandAccent} size={24} />
    </TouchableOpacity>
  );

  const HeaderRight = () => (
    <TouchableOpacity style={styles.headerButton}>
      <Bell color="white" size={20} />
      <View style={styles.badge} />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: MB_COLORS.navy,
          },
          headerShadowVisible: false,
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: '900',
            fontSize: 16,
            textTransform: 'uppercase',
            letterSpacing: 1,
          } as any,
          headerLeft: () => <HeaderLeft />,
          headerRight: () => <HeaderRight />,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="users" options={{ title: 'Usuarios' }} />
        <Stack.Screen name="menu" options={{ title: 'Menú' }} />
        <Stack.Screen name="categories" options={{ title: 'Categorías' }} />
        <Stack.Screen name="tables" options={{ title: 'Mesas' }} />
        <Stack.Screen name="orders" options={{ title: 'Pedidos' }} />
        <Stack.Screen name="inventory" options={{ title: 'Inventario' }} />
        <Stack.Screen name="branding" options={{ title: 'Branding' }} />
        <Stack.Screen name="reports" options={{ title: 'Reportes' }} />
        <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
      </Stack>

      <AdminSideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MB_COLORS.brandAccent,
    borderWidth: 2,
    borderColor: MB_COLORS.navy,
  },
});
