import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '../components/useColorScheme';
import { darkTheme, lightTheme } from '../constants/theme';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
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
    void useThemeStore.getState().hydrate();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? darkTheme : lightTheme;
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: t.primary,
      background: t.background,
      card: t.background,
      text: t.text,
      border: t.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="training/program-editor" options={{ title: 'New Program' }} />
        <Stack.Screen name="training/active-workout" options={{ title: 'Workout' }} />
        <Stack.Screen name="training/progress" options={{ title: 'Progress' }} />
        <Stack.Screen name="ai/program-review" options={{ title: 'Program Review' }} />
        <Stack.Screen name="ai/exercise-suggest" options={{ title: 'Exercise Ideas' }} />
        <Stack.Screen name="nutrition/meal-plan" options={{ title: 'Meal Ideas' }} />
        <Stack.Screen name="nutrition/fast-food" options={{ title: 'Fast Food' }} />
        <Stack.Screen name="nutrition/grocery-list" options={{ title: 'Grocery List' }} />
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
    const inAiGroup = segments[0] === 'ai';
    const inNutritionGroup = segments[0] === 'nutrition';

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

    if (hasProfile && (inAuthGroup || inOnboardingRoute || (!inTabsGroup && !inTrainingGroup && !inAiGroup && !inNutritionGroup))) {
      router.replace('/(tabs)/nutrition');
    }
    // Intentionally exclude `router` from deps; it is a stable instance
    // and including it triggers an infinite redirect loop on web.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProfile, isAuthenticated, isHydrated, segments]);

  return null;
}
