import 'react-native-get-random-values';
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
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';

import { colors } from '@/constants/theme';
import { useProfile } from '@/features/profile/useProfile';
import { AppProviders } from '@/providers/app-providers';
import { useSession } from '@/providers/session-provider';

SplashScreen.preventAutoHideAsync();

/** Halaman yang boleh dibuka tanpa login. Undangan tetap bisa dilihat sebelum Face ID. */
const PUBLIC = new Set(['', 'index', 'sign-in', 'invite']);

function RootLayoutNav({ fontsLoaded, fontError }: { fontsLoaded: boolean; fontError: Error | null }) {
  const { isLoading, signer } = useSession();
  const profile = useProfile(!!signer);
  const segments = useSegments() as string[];
  const pathname = usePathname();
  const router = useRouter();

  const profileLoading = !!signer && profile.isLoading;
  const ready = (fontsLoaded || fontError != null) && !isLoading && !profileLoading;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // Gate (M3/M12): belum login → Welcome; login tanpa profil → P1 Set up profile; lengkap → Home.
  useEffect(() => {
    if (!ready) return;
    const first = segments[0] ?? '';
    const isPublic = PUBLIC.has(first);
    const onSetup = first === 'setup-profile';

    if (!signer) {
      if (!isPublic && !onSetup) router.replace('/');
      return;
    }
    if (!profile.data) {
      // Akun baru: isi profil dulu, lalu kembali ke tujuan semula (mis. layar Join dari link undangan).
      if (!onSetup) {
        const next = first === 'invite' ? pathname : undefined;
        router.replace(next ? { pathname: '/setup-profile', params: { next } } : '/setup-profile');
      }
      return;
    }
    if (first === '' || first === 'index' || first === 'sign-in') {
      router.replace('/trips');
    }
  }, [ready, signer, profile.data, segments, pathname, router]);

  if (!ready) return null;

  return (
    <>
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
    </>
  );
}

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

  return (
    <AppProviders>
      <RootLayoutNav fontsLoaded={fontsLoaded} fontError={fontError} />
    </AppProviders>
  );
}
