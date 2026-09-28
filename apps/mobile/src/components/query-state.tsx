import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { Teko } from './teko';
import { Button } from './ui/button';
import { Screen } from './ui/layout';
import { ScreenHeader } from './ui/screen-header';
import { Text } from './ui/text';

export type QueryLike<T> = { data: T | undefined; isLoading: boolean; error: unknown; refetch: () => unknown };

/** Gabungkan dua query untuk layar yang butuh keduanya (mis. trip + spend). */
export function combine<A, B>(a: QueryLike<A>, b: QueryLike<B>): QueryLike<[A, B]> {
  return {
    data: a.data !== undefined && b.data !== undefined ? [a.data, b.data] : undefined,
    isLoading: a.isLoading || b.isLoading,
    error: a.error ?? b.error,
    refetch: () => {
      a.refetch();
      b.refetch();
    },
  };
}

type Props<T> = {
  query: QueryLike<T>;
  /** Judul header selama loading/error, supaya tombol kembali tetap ada. */
  title?: string;
  headerAction?: 'back' | 'close' | 'none';
  tab?: boolean;
  children: (data: T) => ReactNode;
};

/**
 * Pembungkus state data untuk semua layar: loading → spinner teal, error → Teko sedih + "Try again",
 * sukses → render `children(data)`. Urutan cek: error dulu, baru loading (jangan sampai error berputar selamanya).
 */
export function QueryState<T>({ query, title, headerAction = 'back', tab = false, children }: Props<T>) {
  if (query.error) {
    return (
      <Screen tab={tab} footer={<Button label="Try again" onPress={() => query.refetch()} />}>
        {headerAction !== 'none' && <ScreenHeader title={title} action={headerAction} />}
        <View style={styles.center}>
          <View style={styles.halo}>
            <Teko mood="sad" size={120} />
          </View>
          <Text variant="h2" style={styles.textCenter}>
            Teko couldn&apos;t load this
          </Text>
          <Text style={[styles.textCenter, { fontFamily: fonts.body, fontSize: 15 }]} color={colors.textMuted}>
            Check your connection and try again. Your money is safe in the pot.
          </Text>
        </View>
      </Screen>
    );
  }

  if (query.isLoading || query.data === undefined) {
    return (
      <Screen tab={tab} scroll={false}>
        {headerAction !== 'none' && <ScreenHeader title={title} action={headerAction} />}
        <View style={[styles.center, { flex: 1 }]} accessibilityLabel="Loading">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return <>{children(query.data)}</>;
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 40,
  },
  halo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.sadBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
});
