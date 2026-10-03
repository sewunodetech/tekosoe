import { useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { passkeyErrorCode, useSession } from '@/providers/session-provider';

// 02 Sign in — canvas "Final UI" › F02SignIn
export default function SignInScreen() {
  const { signIn } = useSession();

  const handlePasskeySignIn = async () => {
    try {
      // Setelah sesi ada, gate di app/_layout.tsx mengarahkan: akun baru → P1 Set up profile, lainnya → Home.
      await signIn();
    } catch (err: any) {
      // Sheet passkey ditutup user: bukan error, cukup tetap di layar ini.
      if (passkeyErrorCode(err) === 'UserCancelled') return;
      console.error('Mera Auth Error:', err);
      Alert.alert('Sign in failed', err?.message || 'Failed to authenticate');
    }
  };

  return (
    <Screen
      gap={24}
      footer={
        <View style={{ gap: 16 }}>
          <Button label="Continue with Passkey" onPress={handlePasskeySignIn} />
          <Text variant="caption" color={colors.textMuted} style={styles.textCenter}>
            Whether you&apos;re new or returning, just use your passkey. 
            New phone? Same passkey, same account.
          </Text>
        </View>
      }>
      <ScreenHeader />

      <View style={styles.center}>
        <View style={styles.badgeWrap}>
          <View style={styles.halo} />
          <View style={styles.faceTile}>
            <Icon name="faceId" size={58} color={colors.primary} strokeWidth={1.6} />
            <ScanLine />
          </View>
          <View style={styles.teko}>
            <Teko mood="wink" size={84} />
          </View>
        </View>
        <Text variant="h1" style={[styles.textCenter, { fontSize: 30, lineHeight: 34 }]}>
          Sign in with Passkey
        </Text>
        <Text variant="body" color={colors.textMuted} style={[styles.textCenter, { maxWidth: 300 }]}>
          Your account lives safely on this phone. No passwords, no secret words to remember.
        </Text>
      </View>
    </Screen>
  );
}

/** Garis pindai oranye yang naik-turun di atas ikon Face ID. */
function ScanLine() {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: -30 + y.value * 60 }] }));
  return <Animated.View style={[styles.scan, anim]} />;
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 40,
  },
  badgeWrap: {
    width: 200,
    height: 200,
  },
  halo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 100,
    backgroundColor: colors.hero,
  },
  faceTile: {
    position: 'absolute',
    left: 50,
    top: 50,
    width: 100,
    height: 100,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 24px rgba(31, 122, 110, 0.14)',
  },
  scan: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    opacity: 0.85,
  },
  teko: {
    position: 'absolute',
    right: -24,
    bottom: -8,
  },
  textCenter: {
    textAlign: 'center',
  },
});
