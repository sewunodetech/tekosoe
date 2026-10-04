import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View, Alert } from 'react-native';

import { PasskeyBadge } from '@/components/passkey-badge';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { passkeyErrorCode, useSession } from '@/providers/session-provider';

// 02 Sign in — canvas "Final UI" › F02SignIn. Juga slide terakhir onboarding (O4).
export default function SignInScreen() {
  const { signIn, signUp } = useSession();
  const [busy, setBusy] = useState(false);

  // Setelah sesi ada, gate di app/_layout.tsx mengarahkan: akun baru → P1 Set up profile, lainnya → Home.
  const run = async (action: () => Promise<void>, onError: (err: unknown) => void) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (err) {
      // Sheet passkey ditutup user: bukan error, cukup tetap di layar ini.
      if (passkeyErrorCode(err) !== 'UserCancelled') onError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () =>
    run(signUp, (err) => {
      console.error('Mera sign up error:', err);
      const code = passkeyErrorCode(err);
      Alert.alert(
        'Could not create your account',
        code === 'NoCreateOption' || code === 'NotConfigured' || code === 'NotSupported'
          ? 'Turn on a passkey provider (like Google Password Manager or iCloud Keychain) and a screen lock, then try again.'
          : 'Something went wrong. Please try again.',
      );
    });

  const handleSignIn = () =>
    run(signIn, (err) => {
      if (passkeyErrorCode(err) === 'NoCredentials') {
        Alert.alert('No account on this phone yet', 'Create a new account with your passkey?', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Create account', onPress: () => void handleCreate() },
        ]);
        return;
      }
      console.error('Mera sign in error:', err);
      Alert.alert('Sign in failed', 'Something went wrong. Please try again.');
    });

  return (
    <Screen
      gap={24}
      footer={
        <View style={{ gap: 8 }}>
          <Button label="Create account with Passkey" onPress={handleCreate} disabled={busy} />
          <Button label="I already have an account" variant="ghost" onPress={handleSignIn} disabled={busy} />
          <Text variant="caption" color={colors.textMuted} style={styles.textCenter}>
            New phone? Sign in with the same passkey and you&apos;ll get the same account.
          </Text>
        </View>
      }>
      {/* Onboarding sudah dilihat → / langsung ke sini; tanpa riwayat, back memutar ulang onboarding. */}
      <ScreenHeader onPress={() => (router.canGoBack() ? router.back() : router.replace('/?intro=1'))} />

      <View style={styles.center}>
        <PasskeyBadge />
        <Text variant="h1" style={[styles.textCenter, { fontSize: 30, lineHeight: 34 }]}>
          Just your face. No passwords.
        </Text>
        <Text variant="body" color={colors.textMuted} style={[styles.textCenter, { maxWidth: 300 }]}>
          Your account lives on this phone with a passkey. No secret words to remember.
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
