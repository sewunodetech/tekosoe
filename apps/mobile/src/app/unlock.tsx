import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { PasskeyBadge } from '@/components/passkey-badge';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { passkeyErrorCode, useSession } from '@/providers/session-provider';

/**
 * Unlock — HP ini sudah pernah masuk, tapi sesi belum terbuka (kunci tidak tersimpan dengan biometrik
 * strong, atau prompt biometrik dibatalkan). Seperti app keuangan: langsung minta passkey, tanpa
 * onboarding atau pilihan sign up. Di luar Final UI; memakai visual 02 Sign in.
 */
export default function UnlockScreen() {
  const { signIn, forgetAccount } = useSession();
  const [busy, setBusy] = useState(false);

  // Setelah sesi ada, gate di app/_layout.tsx membawa ke Home (atau P1 kalau profil belum ada).
  const unlock = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signIn();
    } catch (err) {
      const code = passkeyErrorCode(err);
      if (code === 'UserCancelled') return;
      if (code === 'NoCredentials') {
        Alert.alert('Passkey not found', "This phone no longer has your Tekosoe passkey. Sign in another way?", [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign in', onPress: () => void switchAccount() },
        ]);
        return;
      }
      console.error('Mera unlock error:', err);
      Alert.alert('Could not unlock', 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const switchAccount = async () => {
    await forgetAccount();
    router.replace('/sign-in');
  };

  // Langsung tampilkan prompt passkey sekali saat layar dibuka.
  const prompted = useRef(false);
  useEffect(() => {
    if (prompted.current) return;
    prompted.current = true;
    void unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen
      gap={24}
      footer={
        <View style={{ gap: 8 }}>
          <Button label="Unlock with Passkey" onPress={unlock} disabled={busy} />
          <Button label="Use a different account" variant="ghost" onPress={switchAccount} disabled={busy} />
        </View>
      }>
      <Logo />
      <View style={styles.center}>
        <PasskeyBadge />
        <Text variant="h1" style={[styles.textCenter, { fontSize: 30, lineHeight: 34 }]}>
          Welcome back
        </Text>
        <Text variant="body" color={colors.textMuted} style={[styles.textCenter, { maxWidth: 300 }]}>
          Use your passkey to open your trips.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 40,
  },
  textCenter: {
    textAlign: 'center',
  },
});
