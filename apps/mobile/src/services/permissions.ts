import { Camera } from 'expo-camera';
import { Platform } from 'react-native';

import { requestNotificationPermission } from './notifications';

/**
 * Minta izin yang dibutuhkan app sekali di awal (saat app dibuka), berurutan supaya dialog
 * tidak bertumpuk: notifikasi (persetujuan pemakaian, settle-up) lalu kamera (foto struk).
 * Izin yang sudah diberikan atau ditolak permanen tidak ditanyakan lagi.
 * Mengembalikan status izin notifikasi.
 */
export async function requestStartupPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const notifications = await requestNotificationPermission();

  try {
    const camera = await Camera.getCameraPermissionsAsync();
    if (!camera.granted && camera.canAskAgain) {
      await Camera.requestCameraPermissionsAsync();
    }
  } catch (err) {
    console.warn('[permissions] Camera permission request skipped:', err);
  }

  return notifications;
}
