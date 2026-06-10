import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '../components/useColorScheme';
import { useAuthStore } from '../stores/auth.store';
import { getProfile } from '../services/user.service';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
  unstable_skipStaticRendering: true,
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="training/program-editor" options={{ title: 'New Program' }} />
        <Stack.Screen name="training/active-workout" options={{ title: 'Workout' }} />
      </Stack>
      <ProtectedRouteGuard />
    </ThemeProvider>
  );
}

function ProtectedRouteGuard() {
  const segments = useSegments();
  const router = useRouter();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasProfile = useAuthStore((state) => state.hasProfile);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || hasProfile) {
      return;
    }

    void getProfile().catch(() => {
      useAuthStore.getState().setHasProfile(false);
    });
  }, [hasProfile, isAuthenticated, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingRoute = segments[0] === "(auth)" && segments[1] === "onboarding";
    const inTabsGroup = segments[0] === '(tabs)';
    const inTrainingGroup = segments[0] === 'training';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    if (!hasProfile && !inOnboardingRoute) {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (hasProfile && (inAuthGroup || inOnboardingRoute || (!inTabsGroup && !inTrainingGroup))) {
      router.replace('/(tabs)/nutrition');
    }
    // Intentionally exclude `router` from deps; it is a stable instance
    // and including it triggers an infinite redirect loop on web.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProfile, isAuthenticated, isHydrated, segments]);

  return null;
}
