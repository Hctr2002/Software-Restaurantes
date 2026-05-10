import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useAuth, AuthProvider } from '../context/AuthContext';
import { RestaurantThemeProvider } from '../context/ThemeContext';
import { useRouter, useSegments } from 'expo-router';

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
  const { session, loading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inTabsGroup = (segments[0] as string) === '(tabs)';

    if (!session && !inAuthGroup && !inTabsGroup) {
      // Redirect to login if not authenticated and not in tabs/auth
      router.replace('/(tabs)' as any);
    } else if (session) {
      // Determine the target group based on role
      let targetGroup = '(tabs)'; // Default to client
      if (role === 'SUPER_ADMIN') targetGroup = '(super-admin)';
      else if (role === 'ADMIN') targetGroup = '(admin)';
      else if (role === 'GARZON') targetGroup = '(waiter)';
      else if (role === 'COCINA') targetGroup = '(kitchen)';

      // Redirect if they are in the wrong group
      if (segments[0] !== targetGroup) {
        router.replace(`/${targetGroup}` as any);
      }
    }
  }, [session, loading, segments, role]);

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
      <Stack.Screen name="(super-admin)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(waiter)" options={{ headerShown: false }} />
      <Stack.Screen name="(kitchen)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Detalles' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
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
