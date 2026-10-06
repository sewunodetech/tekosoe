import type * as NotificationsType from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { colors } from '@/constants/theme';

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const isAndroidExpoGo = Platform.OS === 'android' && isExpoGo;

let notificationsModule: typeof NotificationsType | null = null;
let handlerConfigured = false;
let pushTokenFailureLogged = false;

/**
 * Channel Android dengan suara khas Tekosue (assets/sounds/tekosoe.wav, didaftarkan lewat plugin
 * expo-notifications di app.json). Suara channel tidak bisa diubah setelah dibuat, jadi channel
 * baru = id baru. apps/api mengirim push ke channel yang sama.
 */
export const NOTIFICATION_CHANNEL_ID = 'tekosoe-chime';
export const NOTIFICATION_SOUND = 'tekosoe.wav';
const LEGACY_CHANNEL_IDS = ['tekosoe-default', 'tekosoe'];

/**
 * Lazy loader aman untuk expo-notifications.
 * Pada Android Expo Go, pemuatan runtime sengaja dilewati karena Expo SDK 53+
 * melempar error fatal ketika modul dievaluasi di Android Expo Go.
 */
function getNotifications(): typeof NotificationsType | null {
  if (Platform.OS === 'web' || isAndroidExpoGo) {
    return null;
  }

  if (!notificationsModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      notificationsModule = require('expo-notifications');
      if (notificationsModule && !handlerConfigured) {
        handlerConfigured = true;
        notificationsModule.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }
    } catch (e) {
      console.warn('[notifications] Failed to load expo-notifications:', e);
      return null;
    }
  }

  return notificationsModule;
}

/**
 * Inisialisasi channel notifikasi untuk Android (hanya di luar Expo Go Android).
 */
export async function setupNotificationChannels() {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Tekosue',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 120, 80, 180],
      lightColor: colors.primary,
      sound: NOTIFICATION_SOUND,
    });
    for (const id of LEGACY_CHANNEL_IDS) {
      await Notifications.deleteNotificationChannelAsync(id);
    }
  } catch (e) {
    console.warn('[notifications] Channel setup skipped:', e);
  }
}

/**
 * Cek status izin notifikasi saat ini.
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return true; // di Expo Go atau Web, izinkan in-app notification

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return true;
  }
}

/**
 * Minta izin notifikasi dari pengguna dan kembalikan status perizinan.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return true;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[notifications] Permission request skipped:', err);
    return true;
  }
}

/**
 * Ambil token push Expo untuk disimpan ke backend (tabel `push_subs`).
 * Aman dari error Expo Go SDK 53+.
 */
export async function getExpoPushToken(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications) {
    // Di Expo Go atau Web, remote push notification dinonaktifkan oleh Expo SDK 53+
    return 'ExponentPushToken[expo-go-demo]';
  }

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (err) {
    // Push dari server butuh Firebase (google-services.json) di build Android. Tanpa itu notifikasi
    // lokal tetap jalan — cukup dicatat sekali, bukan peringatan setiap kali masuk.
    if (!pushTokenFailureLogged) {
      pushTokenFailureLogged = true;
      console.info('[notifications] Push token unavailable, local notifications only:', (err as Error)?.message);
    }
    return null;
  }
}

export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/**
 * Kirim notifikasi lokal ke OS (hanya aktif di luar Expo Go Android).
 */
export async function sendNotification({ title, body, data }: NotificationPayload) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: NOTIFICATION_SOUND,
      },
      trigger: Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : null,
    });
  } catch (err) {
    console.warn('[notifications] Failed to schedule local notification:', err);
  }
}

/**
 * Daftarkan listener saat notifikasi OS di-tap oleh pengguna.
 */
export function addNotificationResponseListener(
  onResponse: (url?: string) => void,
): (() => void) | undefined {
  const Notifications = getNotifications();
  if (!Notifications) return undefined;

  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url as string | undefined;
      onResponse(url);
    });
    return () => subscription.remove();
  } catch {
    return undefined;
  }
}
