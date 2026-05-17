import React from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Menu as MenuIcon, Bell, ShoppingBag } from 'lucide-react-native';
import AdminSideMenu from '../../components/AdminSideMenu';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

export default function AdminLayout() {
  const { restaurantId } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [newOrder, setNewOrder] = React.useState<any | null>(null);

  const isNotificationsPage = pathname.includes('notifications');

  React.useEffect(() => {
    if (!restaurantId) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const channelSuffix = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`global-notifications-${restaurantId}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          setNewOrder(payload.new);
          // Auto-hide after 5 seconds
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => setNewOrder(null), 5000);
        }
      )
      .subscribe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const HeaderLeft = () => (
    <TouchableOpacity 
      onPress={() => setMenuVisible(true)} 
      style={styles.headerButton}
    >
      <MenuIcon color={colors.brandAccent} size={24} />
    </TouchableOpacity>
  );

  const HeaderRight = () => {
    if (isNotificationsPage) return <View style={{ width: 40 }} />;
    
    return (
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => {
          setNewOrder(null);
          router.push('/(admin)/notifications');
        }}
      >
        <Bell color={newOrder ? colors.brandAccent : colors.text} size={20} />
        {newOrder && <View style={[styles.badge, { backgroundColor: colors.brandAccent, borderColor: colors.navy }]} />}
      </TouchableOpacity>
    );
  };

  const OrderNotification = () => {
    if (!newOrder) return null;
    return (
      <Animated.View 
        entering={FadeInUp} 
        exiting={FadeOutUp}
        style={styles.notificationContainer}
      >
        <TouchableOpacity 
          style={[styles.notificationToast, { backgroundColor: colors.navy, borderColor: colors.brandAccent }]}
          onPress={() => setNewOrder(null)}
        >
          <View style={[styles.notifIcon, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }]}>
            <ShoppingBag color="white" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.notifTitle, { color: colors.text }]}>¡NUEVO PEDIDO!</Text>
            <Text style={[styles.notifSub, { color: colors.muted }]}>Revisa la sección de pedidos ahora</Text>
          </View>
          <TouchableOpacity onPress={() => setNewOrder(null)}>
            <Text style={[styles.closeNotif, { color: colors.text, backgroundColor: colors.glass }]}>OK</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.navy,
          },
          contentStyle: { backgroundColor: colors.navy },
          headerShadowVisible: false,
          headerTintColor: colors.text,
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
        <Stack.Screen name="notifications" options={{ title: 'Notificaciones' }} />
        <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
        <Stack.Screen name="security" options={{ title: 'Seguridad' }} />
      </Stack>

      <OrderNotification />

      <AdminSideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
      />
    </View>
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
    borderWidth: 2,
  },
  notificationContainer: {
    position: 'absolute',
    top: 70, 
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notificationToast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    gap: 16,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notifSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  closeNotif: {
    fontWeight: '900',
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  }
});
