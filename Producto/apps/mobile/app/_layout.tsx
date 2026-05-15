import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useAuth, AuthProvider } from '../context/AuthContext';
import { RestaurantThemeProvider } from '../context/ThemeContext';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, loading, role, isPasswordRecovery } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Handle deep links for password recovery (menubites://reset-password#access_token=...&type=recovery)
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url.includes('access_token')) return;
      const hash = url.split('#')[1] ?? '';
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    };

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  // Redirect to reset-password screen when recovery session is active
  useEffect(() => {
    if (isPasswordRecovery) {
      router.replace('/(auth)/reset-password' as any);
    }
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inTabsGroup = (segments[0] as string) === '(tabs)';
    const inMenuGroup = (segments[0] as string) === '[restaurantSlug]';
    const inScannerGroup = (segments[0] as string) === 'scanner';

    if (isPasswordRecovery) return;

    if (!session && !inAuthGroup && !inTabsGroup && !inMenuGroup && !inScannerGroup) {
      router.replace('/(tabs)' as any);
    } else if (session) {
      let targetGroup = '(tabs)';
      if (role === 'SUPER_ADMIN') targetGroup = '(super-admin)';
      else if (role === 'ADMIN') targetGroup = '(admin)';
      else if (role === 'GARZON') targetGroup = '(waiter)';
      else if (role === 'COCINA') targetGroup = '(kitchen)';
      else if (role === 'CAJERO') targetGroup = '(cashier)';
      else if (role === 'BAR') targetGroup = '(bar)';

      if (segments[0] !== targetGroup) {
        router.replace(`/${targetGroup}` as any);
      }
    }
  }, [session, loading, segments, role, isPasswordRecovery]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#020617' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="scanner/index" options={{ presentation: 'modal', title: 'Escanear QR' }} />
      <Stack.Screen name="[restaurantSlug]/[tableNumber]/index" options={{ title: 'Menú' }} />
      <Stack.Screen name="(super-admin)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(waiter)" options={{ headerShown: false }} />
      <Stack.Screen name="(kitchen)" options={{ headerShown: false }} />
      <Stack.Screen name="(cashier)" options={{ headerShown: false }} />
      <Stack.Screen name="(bar)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Detalles' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#020617',
      card: '#020617',
      text: '#F7F4F3',
    },
  };

  if (!loaded) return null;

  return (
    <AuthProvider>
      <RestaurantThemeProvider>
        <ThemeProvider value={customDarkTheme}>
          <InitialLayout />
        </ThemeProvider>
      </RestaurantThemeProvider>
    </AuthProvider>
  );
}
