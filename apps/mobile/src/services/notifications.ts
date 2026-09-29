import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { colors } from '@/constants/theme';

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Konfigurasi bagaimana notifikasi ditampilkan saat aplikasi aktif di latar depan (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Inisialisasi channel notifikasi untuk Android.
 */
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('tekosoe-default', {
        name: 'Tekosoe Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.primary,
        sound: 'default',
      });
    } catch (e) {
      console.warn('Channel setup skipped (Expo Go / unsupported):', e);
    }
  }
}

/**
 * Minta izin notifikasi dari pengguna dan kembalikan status perizinan.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Permission request skipped (Expo Go):', err);
    return true; // di Expo Go anggap true untuk in-app notification
  }
}

/**
 * Ambil token push Expo untuk disimpan ke backend (tabel `push_subs`).
 * Aman dari error Expo Go SDK 53+ (remote push dihapus dari Expo Go, butuh dev build).
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || isExpoGo) {
    // Di Expo Go atau Web, remote push notification dinonaktifkan oleh Expo SDK 53+
    return 'ExponentPushToken[expo-go-demo]';
  }

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (err) {
    console.warn('Could not get push token:', err);
    return null;
  }
}

export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/**
 * Kirim notifikasi lokal ke perangkat (langsung muncul di status bar OS).
 */
export async function sendNotification({ title, body, data }: NotificationPayload) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // segera muncul
    });
  } catch (err) {
    console.warn('Failed to schedule local notification:', err);
  }
}
