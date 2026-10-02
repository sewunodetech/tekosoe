import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InfoBox, Pill, Screen } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { setReceiptDraft } from '@/features/spends/receipt-draft';
import { useAttachReceipt } from '@/features/spends/useAttachReceipt';
import { useTrip } from '@/features/trips/useTrip';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';

// R1 Add receipt — canvas "Final UI" › S07ReceiptCapture
// Dari 09 (tanpa `spendId`): foto disimpan sebagai draf, lalu 09 melampirkannya setelah `spend` berhasil.
// Dengan `?spendId=`: langsung dilampirkan ke pemakaian itu.
// TODO (M7): kompres → AES-GCM kunci grup → keccak256(ciphertext) → unggah lewat api → attachReceipt.
export default function AddReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <QueryState query={useTrip(id)} title="Add receipt" headerAction="close">
      {(trip) => <AddReceiptView trip={trip} />}
    </QueryState>
  );
}

function backToPay(tripId: string) {
  if (router.canGoBack()) router.back();
  else router.replace(`/trip/${tripId}/pay`);
}

function AddReceiptView({ trip }: { trip: Trip }) {
  const { spendId } = useLocalSearchParams<{ spendId?: string }>();
  const others = trip.members.filter((m) => m.label !== 'You').map((m) => m.name);

  const attachReceipt = useAttachReceipt(trip.id, spendId);
  const attachTx = useTx(attachReceipt.mutateAsync, { onSuccess: () => router.back() });

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) setPhotoUri(photo.uri);
    } finally {
      setCapturing(false);
    }
  };

  const handlePickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const handleUsePhoto = () => {
    if (!photoUri) return;
    if (spendId) {
      attachTx.execute({ receiptUri: photoUri });
      return;
    }
    setReceiptDraft(trip.id, photoUri);
    backToPay(trip.id);
  };

  const cameraReady = Boolean(permission?.granted) && !photoUri;

  return (
    <>
      <Screen
        gap={16}
        footer={
          photoUri ? (
            <View style={styles.footer}>
              <Button label="Retake" variant="outline" style={{ flex: 1 }} onPress={() => setPhotoUri(null)} />
              <Button label="Use photo" style={{ flex: 1 }} onPress={handleUsePhoto} disabled={attachTx.isProcessing} />
            </View>
          ) : (
            <Button
              label={capturing ? 'Taking photo…' : 'Take photo'}
              icon={<Icon name="camera" size={20} color={cameraReady && !capturing ? colors.textOnPrimary : colors.textMuted} strokeWidth={2} />}
              onPress={handleCapture}
              disabled={!cameraReady || capturing}
            />
          )
        }>
        <ScreenHeader title="Add receipt" action="close" />

        <View style={styles.camera}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Receipt photo" />
          ) : permission?.granted ? (
            <>
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
              <Corner style={{ left: 44, top: 44, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 14 }} />
              <Corner style={{ right: 44, top: 44, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 14 }} />
              <Corner style={{ left: 44, bottom: 44, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 14 }} />
              <Corner style={{ right: 44, bottom: 44, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 14 }} />
              <ScanLine />
              <View style={styles.hint}>
                <Pill label="Fit the whole receipt in the frame" weight="bold" />
              </View>
            </>
          ) : (
            <CameraAccess
              loading={!permission}
              canAskAgain={permission?.canAskAgain ?? true}
              onAllow={requestPermission}
            />
          )}
        </View>

        <View style={styles.pages}>
          <View style={[styles.page, photoUri ? styles.pageOn : styles.pageEmpty]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 11 }} color={colors.textMuted}>
                1
              </Text>
            )}
          </View>
          <Pressable accessibilityRole="button" onPress={handlePickGallery} style={styles.gallery} hitSlop={8}>
            <Icon name="receipt" size={18} color={colors.primary} strokeWidth={2} />
            <Text variant="label" color={colors.primary}>
              Pick from gallery
            </Text>
          </Pressable>
        </View>

        <InfoBox icon={<Icon name="lock" size={18} color={colors.primary} strokeWidth={2} />}>
          Encrypted on this phone before upload. Only {others.join(', ').replace(/, ([^,]*)$/, ' and $1')} and you can open it.
        </InfoBox>
      </Screen>
      <TxOverlay status={attachTx.status} />
    </>
  );
}

/** Isi bingkai kamera saat izin belum diberikan. Kalau ditolak permanen, arahkan ke Settings. */
function CameraAccess({ loading, canAskAgain, onAllow }: { loading: boolean; canAskAgain: boolean; onAllow: () => void }) {
  if (loading) return null;
  return (
    <View style={styles.access}>
      <View style={styles.accessIcon}>
        <Icon name="camera" size={26} color={colors.primary} strokeWidth={2} />
      </View>
      <Text variant="bodyStrong" style={{ textAlign: 'center' }}>
        Snap the receipt
      </Text>
      <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center', maxWidth: 240 }}>
        {canAskAgain
          ? 'Allow the camera to take a photo, or pick one from your gallery.'
          : 'Camera is turned off for Tekosoe. Turn it on in Settings, or pick a photo from your gallery.'}
      </Text>
      <Button
        label={canAskAgain ? 'Allow camera' : 'Open settings'}
        variant="pill"
        onPress={canAskAgain ? onAllow : () => Linking.openSettings()}
      />
    </View>
  );
}

function Corner({ style }: { style: object }) {
  return <View style={[styles.corner, style]} pointerEvents="none" />;
}

function ScanLine() {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * 300 }] }));
  return <Animated.View style={[styles.scan, anim]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  camera: {
    width: '100%',
    height: 430,
    borderRadius: radius.hero,
    backgroundColor: palette.cameraBg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  access: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  accessIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.iconTile,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: colors.primary,
  },
  scan: {
    position: 'absolute',
    left: 60,
    right: 60,
    top: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    opacity: 0.8,
  },
  hint: {
    position: 'absolute',
    top: 14,
  },
  pages: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  page: {
    width: 52,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageOn: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pageEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  gallery: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
