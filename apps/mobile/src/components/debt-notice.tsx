import { Link } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { OutstandingDebt } from '@/features/trips/useOutstandingDebt';
import { money } from '@/lib/money';

/**
 * Ditampilkan di layar buat/ikut trip selama masih ada utang dari trip yang sudah settle (ADR 0013).
 * Mengarahkan ke invoice trip pertama yang masih berutang, tempat tombol Pay berada.
 */
export function DebtNotice({ debt, action }: { debt: OutstandingDebt; action: 'start' | 'join' }) {
  const first = debt.trips[0];
  if (!first) return null;
  const where = debt.trips.length === 1 ? first.tripName : `${first.tripName} and ${debt.trips.length - 1} more`;
  return (
    <View style={{ gap: 12, padding: 16, borderRadius: radius.row, backgroundColor: palette.peach }}>
      <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 15 }}>You still owe {money(debt.total)}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }} color={colors.textMuted}>
        From {where}. Pay it first, then you can {action === 'start' ? 'start a new trip' : 'join this trip'}.
      </Text>
      <Link href={`/trip/${first.tripId}/invoice`} asChild>
        <Button label={`Pay ${money(first.debt)}`} variant="outline" />
      </Link>
    </View>
  );
}
