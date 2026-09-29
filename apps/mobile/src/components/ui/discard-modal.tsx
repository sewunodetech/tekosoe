import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Bob } from '@/components/decor';
import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal konfirmasi pembatalan perubahan input (Discard changes).
 * Mengikuti sistem desain Tekosoe: Maskot Teko mood "worry", font Bricolage & Manrope,
 * serta tombol aksi yang ramah.
 */
export function DiscardModal({
  visible,
  title = 'Discard changes?',
  message = "You have unsaved changes. If you leave now, your changes will be lost.",
  confirmLabel = 'Discard changes',
  cancelLabel = 'Keep editing',
  onConfirm,
  onCancel,
}: Props) {
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <View style={styles.badge}>
            <Bob distance={5} duration={2400}>
              <Teko mood="worry" size={82} bob={false} />
            </Bob>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              onPress={onCancel}
              style={styles.cancelBtn}
            />
            <Button
              label={confirmLabel}
              variant="outline"
              onPress={onConfirm}
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 36, 38, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.hero,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 18,
    borderWidth: 1,
    borderColor: palette.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.peachSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    width: '100%',
    height: 52,
  },
  confirmBtn: {
    width: '100%',
    height: 48,
    borderColor: palette.lineStrong,
  },
});
