import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/constants/theme';
import { AppProviders } from '@/providers/app-providers';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    // TODO: tunda juga sampai sesi Mera dipulihkan supaya tidak berkedip ke Welcome.
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip/[id]/add-money" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/pay" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/add-receipt" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/spend/[spendId]/approve" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/spend/[spendId]/declined" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
