import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';

type Options = {
  isDirty: boolean;
  onExit?: () => void;
  fallbackRoute?: Href;
};

/**
 * Hook untuk menangani konfirmasi pembatalan perubahan input (unsaved changes).
 * Mencegah pengguna keluar secara tidak sengaja baik lewat tombol back di header maupun
 * tombol back perangkat Android.
 */
export function useUnsavedChanges({ isDirty, onExit, fallbackRoute }: Options) {
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const confirmExit = useCallback(() => {
    setShowDiscardModal(false);
    if (onExit) {
      onExit();
    } else if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute);
    } else {
      router.replace('/');
    }
  }, [onExit, fallbackRoute]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      confirmExit();
    }
  }, [isDirty, confirmExit]);

  useEffect(() => {
    // Tombol back perangkat hanya ada di Android; di web BackHandler memunculkan error.
    if (Platform.OS === 'web') return;
    const onBackPress = () => {
      if (isDirty) {
        setShowDiscardModal(true);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isDirty]);

  return {
    showDiscardModal,
    setShowDiscardModal,
    handleBack,
    confirmExit,
  };
}
