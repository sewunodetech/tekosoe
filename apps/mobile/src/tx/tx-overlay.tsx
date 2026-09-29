import { Modal, StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius } from '@/constants/theme';
import type { TxStatus } from './useTx';

type Props = {
  status: TxStatus;
};

export function TxOverlay({ status }: Props) {
  return (
    <Modal transparent visible={status !== 'idle'} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.tekoWrap}>
            {status === 'processing' && <Teko mood="think" size={100} />}
            {status === 'done' && <Teko mood="cheer" size={100} />}
            {status === 'error' && <Teko mood="sad" size={100} />}
          </View>
          <Text variant="h2" style={styles.text}>
            {status === 'processing' && 'Processing...'}
            {status === 'done' && 'Done!'}
            {status === 'error' && 'Failed'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(29, 36, 38, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: radius.card,
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  },
  tekoWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
  },
});
