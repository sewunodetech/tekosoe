import { router, type Href } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Teko } from '@/components/teko';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import {
  addNotificationResponseListener,
  getExpoPushToken,
  requestNotificationPermission,
  sendNotification,
  setupNotificationChannels,
  type NotificationPayload,
} from '@/services/notifications';
import { requestStartupPermissions } from '@/services/permissions';
import { api } from '@/lib/api';
import { isLive } from '@/lib/env';
import { useSession } from './session-provider';

type NotificationContextType = {
  enabled: boolean;
  toggleNotifications: (val: boolean) => Promise<void>;
  notify: (payload: NotificationPayload) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  enabled: true,
  toggleNotifications: async () => {},
  notify: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(true);
  const [activeBanner, setActiveBanner] = useState<NotificationPayload | null>(null);

  const [translateY] = useState(() => new Animated.Value(-120));
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setupNotificationChannels();

    // Izin notifikasi + kamera diminta sekali saat app dibuka.
    if (Platform.OS !== 'web') {
      requestStartupPermissions().then(setEnabled);
    }

    const cleanupSubscription = addNotificationResponseListener((url) => {
      if (url) {
        try {
          router.push(url as Href);
        } catch (e) {
          console.warn('Could not navigate to notification URL:', e);
        }
      }
    });

    return () => {
      cleanupSubscription?.();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setActiveBanner(null));
  }, [translateY]);

  const showBanner = useCallback(
    (payload: NotificationPayload) => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setActiveBanner(payload);

      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();

      hideTimerRef.current = setTimeout(() => {
        dismissBanner();
      }, 4500);
    },
    [dismissBanner, translateY],
  );

  const notify = useCallback(
    async (payload: NotificationPayload) => {
      if (!enabled) return;

      // 1. Tampilkan banner in-app yang cantik
      showBanner(payload);

      // 2. Kirim notifikasi OS lokal
      if (Platform.OS !== 'web') {
        await sendNotification(payload);
      }
    },
    [enabled, showBanner],
  );

  const { signer } = useSession();

  // Live: daftarkan token push ke api setiap kali masuk dengan izin notifikasi aktif.
  useEffect(() => {
    if (!enabled || !signer || !isLive || Platform.OS === 'web') return;
    getExpoPushToken().then((token) => {
      if (token) void api.subscribePush(signer.account, token, Platform.OS as 'ios' | 'android').catch(() => undefined);
    });
  }, [enabled, signer]);

  const toggleNotifications = useCallback(
    async (targetVal: boolean): Promise<void> => {
      if (!targetVal) {
        setEnabled(false);
        return;
      }

      const granted = await requestNotificationPermission();
      setEnabled(granted);

      if (granted) {
        // Token push didaftarkan oleh effect di atas begitu `enabled` aktif.
        // Berikan notifikasi konfirmasi bahwa notifikasi telah aktif
        notify({
          title: 'Notifications enabled',
          body: "You'll be notified when friends request approvals or settle up.",
        });
      }
    },
    [notify],
  );

  const handleBannerPress = () => {
    const url = activeBanner?.data?.url as string | undefined;
    dismissBanner();
    if (url) {
      try {
        router.push(url as Href);
      } catch (e) {
        console.warn('Failed to navigate from banner:', e);
      }
    }
  };

  return (
    <NotificationContext.Provider value={{ enabled, toggleNotifications, notify }}>
      {children}

      {/* Floating In-App Toast Banner */}
      {activeBanner && (
        <Animated.View
          style={[
            styles.bannerContainer,
            { top: Math.max(insets.top, 14), transform: [{ translateY }] },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${activeBanner.title}, ${activeBanner.body}`}
            onPress={handleBannerPress}
            style={styles.banner}>
            <View style={styles.tekoWrap}>
              <Teko mood="wink" size={42} bob={false} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.title} numberOfLines={1}>
                {activeBanner.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {activeBanner.body}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: palette.mintCardDeco,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
  },
  tekoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.mintCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 18,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textMuted,
  },
});
