import { Modal, StyleSheet, View } from 'react-native';

import { Bob, Sparkle } from '@/components/decor';
import { Teko } from '@/components/teko';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette } from '@/constants/theme';
import type { TxStatus } from './useTx';

type Props = {
  status: TxStatus;
  /** Teks saat memproses; default untuk aksi pot. */
  processingTitle?: string;
  processingSubtitle?: string;
};

export function TxOverlay({
  status,
  processingTitle = 'Pouring into the pot...',
  processingSubtitle = 'Updating everyone’s balance in real time',
}: Props) {
  if (status === 'idle') return null;

  return (
    <Modal transparent={false} visible animationType="fade" statusBarTranslucent>
      <View style={styles.screen}>
        {/* Decorative sparkles */}
        <Sparkle size={26} color={palette.coin} style={{ position: 'absolute', top: '18%', left: '16%' }} delay={200} />
        <Sparkle size={20} color={colors.accent} style={{ position: 'absolute', top: '24%', right: '18%' }} delay={600} />
        <Sparkle size={18} color={palette.mintBright} style={{ position: 'absolute', bottom: '26%', left: '22%' }} delay={900} />

        <View style={styles.centerContent}>
          {/* Animated Mascot Hero Stage */}
          <View style={styles.haloStage}>
            <View
              style={[
                styles.halo,
                status === 'done' && styles.haloSuccess,
                status === 'error' && styles.haloError,
              ]}
            />
            <Bob distance={8} duration={2600} style={styles.tekoBob}>
              {status === 'processing' && <Teko mood="fill" size={140} bob={false} />}
              {status === 'done' && <Teko mood="cheer" size={140} bob={false} />}
              {status === 'error' && <Teko mood="sad" size={140} bob={false} />}
            </Bob>
          </View>

          {/* Friendly Status Information */}
          <View style={styles.textStack}>
            <Text style={styles.title}>
              {status === 'processing' && processingTitle}
              {status === 'done' && 'All set!'}
              {status === 'error' && 'Something went wrong'}
            </Text>
            <Text style={styles.subtitle}>
              {status === 'processing' && processingSubtitle}
              {status === 'done' && 'All done'}
              {status === 'error' && 'No worries, no funds were changed'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background, // Ivory #faf8f3
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerContent: {
    alignItems: 'center',
    gap: 32,
    maxWidth: 340,
  },
  haloStage: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: palette.mintCard,
  },
  haloSuccess: {
    backgroundColor: palette.greenSoft,
  },
  haloError: {
    backgroundColor: palette.peachSoft,
  },
  tekoBob: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
