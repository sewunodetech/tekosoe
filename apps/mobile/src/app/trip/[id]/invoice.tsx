import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { QrCode } from '@/components/invoice/qr-code';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { KeyValue, Pill, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { combine, QueryState } from '@/components/query-state';
import { colors, fonts, palette } from '@/constants/theme';
import type { Invoice, InvoiceStatus, Trip } from '@/data/types';
import { useInvoice } from '@/features/invoices/useInvoice';
import { usePayDebt } from '@/features/trips/usePayDebt';
import { useTrip } from '@/features/trips/useTrip';
import { money, signed } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';

// I1 Refunded · I2 Due · I3 Paid — canvas "Final UI" › S10Invoice, S11InvoiceDue, S12InvoicePaid.
// `?who=jack|wei|rina` memilih invoice anggota (demo multi-HP).
// TODO: angka dari Envio, nomor/status/hash dari api → invoices. "Pay" → payDebt → DebtPaid.
// "Save as PDF" → expo-print. Tiap baris menaut ke transaksinya di explorer Monad.
const BADGE: Record<InvoiceStatus, { label: string; bg: string; color: string }> = {
  refunded: { label: 'Refunded', bg: colors.positiveBg, color: colors.positiveText },
  due: { label: 'Due', bg: palette.peachSoft, color: colors.danger },
  paid: { label: 'Paid', bg: palette.sky, color: palette.navy },
};

export default function InvoiceScreen() {
  const { id, who } = useLocalSearchParams<{ id: string; who?: string }>();
  const query = combine(useTrip(id), useInvoice(who ?? 'jack'));
  return (
    <QueryState query={query} title="Trip invoice">
      {([trip, invoice]) => <InvoiceView trip={trip} invoice={invoice} />}
    </QueryState>
  );
}

function InvoiceView({ trip, invoice }: { trip: Trip; invoice: Invoice }) {
  const badge = BADGE[invoice.status];
  const verifyUrl = `tekosoe.app/v/${invoice.number}`;
  const due = invoice.totals.find((t) => t.strong)?.value ?? 0n;

  const payDebt = usePayDebt(trip.id);
  const payTx = useTx(payDebt.mutateAsync, {
    onSuccess: () => {
      router.replace(`/trip/${trip.id}/invoice?who=rina`);
    },
  });

  const handlePay = () => {
    payTx.execute({ amount: due });
  };

  const share = () => Share.share({ message: `${trip.name} invoice ${invoice.number}: https://${verifyUrl}` });

  return (
    <>
      <Screen
        gap={12}
        footer={
          invoice.status === 'due' ? (
            <Button
              label={`Pay ${money(due)}`}
              onPress={handlePay}
              disabled={payTx.isProcessing}
            />
          ) : (
            <View style={styles.footer}>
              <Button label="Save as PDF" variant="outline" style={{ flex: 1 }} />
              <Button label="Share" style={{ flex: 1, height: 52 }} onPress={share} />
            </View>
          )
        }>
      <ScreenHeader title="Trip invoice" right={invoice.device ? <Pill label={invoice.device} weight="bold" color={colors.textMuted} /> : undefined} />

      <Surface style={styles.summary}>
        <View style={styles.summaryTop}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.5 }} color={colors.textMuted}>
            {invoice.number}
          </Text>
          <Pill label={badge.label} bg={badge.bg} color={badge.color} />
        </View>
        <Text variant="h1" style={{ fontSize: 32, lineHeight: 34, letterSpacing: -1 }} color={invoice.headlineColor === 'positive' ? colors.positive : colors.text}>
          {invoice.headline}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          {invoice.subline}
        </Text>
      </Surface>

      <Surface style={{ paddingVertical: 0 }}>
        {invoice.lines.map((line) => (
          <Pressable key={line.date + line.title} accessibilityRole="link" style={styles.line}>
            <Text style={styles.date} color={colors.textMuted}>
              {line.date}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{line.title}</Text>
              <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
                {line.sub}
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }} color={line.positive ? colors.positive : colors.text}>
              {line.positive ? signed(line.amount) : money(line.amount)}
            </Text>
            <Icon name="external" size={14} color={colors.primary} />
          </Pressable>
        ))}
        <View style={styles.totals}>
          {invoice.totals.map((t) => (
            <KeyValue key={t.label} label={t.label} value={money(t.value)} strong={t.strong} />
          ))}
        </View>
      </Surface>

      <Surface style={styles.verify}>
        <QrCode />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>Scan to verify</Text>
          <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body, lineHeight: 17 }}>
            Rebuilds this invoice from Monad and checks it was not changed.
          </Text>
          <Text variant="small" color={colors.primary}>
            {verifyUrl}
          </Text>
        </View>
      </Surface>
    </Screen>
    <TxOverlay status={payTx.status} />
  </>
);
}

const styles = StyleSheet.create({
  summary: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: palette.sand,
  },
  date: {
    width: 44,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  totals: {
    gap: 5,
    paddingVertical: 10,
  },
  verify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
});
