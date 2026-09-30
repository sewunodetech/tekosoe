import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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
import { env, isLive } from '@/lib/env';
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
  const [selectedWho, setSelectedWho] = useState<string>(who ?? 'jack');

  const activeWho = who ?? selectedWho;
  const query = combine(useTrip(id), useInvoice(id, activeWho));

  return (
    <QueryState query={query} title="Trip invoice">
      {([trip, invoice]) => (
        <InvoiceView
          trip={trip}
          invoice={invoice}
          activeWho={activeWho}
          onSelectWho={setSelectedWho}
        />
      )}
    </QueryState>
  );
}

function InvoiceView({
  trip,
  invoice,
  activeWho,
  onSelectWho,
}: {
  trip: Trip;
  invoice: Invoice;
  activeWho: string;
  onSelectWho: (who: string) => void;
}) {
  const [locallyPaid, setLocallyPaid] = useState(false);

  const currentStatus = locallyPaid ? 'paid' : invoice.status;
  const badge = BADGE[currentStatus];
  const headline = locallyPaid ? 'Paid in full' : invoice.headline;
  const subline = locallyPaid ? 'All debts settled with the group vault' : invoice.subline;

  const verifyUrl = `${env.webDomain}/v/${invoice.number}`;
  const due = invoice.totals.find((t) => t.strong)?.value ?? 0n;

  const payDebt = usePayDebt(trip.id);
  const payTx = useTx(payDebt.mutateAsync, {
    onSuccess: () => {
      setLocallyPaid(true);
    },
  });

  const handlePay = () => {
    payTx.execute({ amount: due });
  };

  const share = () => Share.share({ message: `${trip.name} invoice ${invoice.number}: https://${verifyUrl}` });

  const handleSavePdf = async () => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #faf8f3; color: #1d2426; padding: 36px; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e6e2d8; padding-bottom: 18px; margin-bottom: 24px; }
              .brand { font-size: 26px; font-weight: 800; color: #1f7a6e; }
              .num { font-size: 14px; font-weight: bold; color: #5f6b6d; }
              .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #cdeedd; color: #145c3b; font-weight: bold; font-size: 13px; margin-bottom: 12px; }
              .title { font-size: 32px; font-weight: 800; margin: 0 0 6px 0; }
              .subtitle { color: #5f6b6d; margin-bottom: 24px; font-size: 15px; }
              .lines { margin-top: 16px; border-top: 1px solid #e6e2d8; }
              .line { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f1eee6; }
              .totals { margin-top: 24px; padding-top: 16px; border-top: 2px solid #1d2426; font-size: 16px; }
              .footer { margin-top: 48px; font-size: 12px; color: #5f6b6d; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">tekosoe</div>
              <div class="num">${invoice.number}</div>
            </div>
            <div class="badge">${invoice.status.toUpperCase()}</div>
            <h1 class="title">${trip.name}</h1>
            <div class="subtitle">${invoice.headline} · ${invoice.subline}</div>
            
            <div class="lines">
              ${invoice.lines
          .map(
            (line) => `
                <div class="line">
                  <div>
                    <strong>${line.title}</strong><br/>
                    <small style="color: #5f6b6d">${line.date} · ${line.sub}</small>
                  </div>
                  <div style="font-weight: bold; color: ${line.positive ? '#1c7a4f' : '#1d2426'}">
                    ${line.positive ? '+' : ''}${(Number(line.amount) / 1000000).toFixed(2)}
                  </div>
                </div>
              `
          )
          .join('')}
            </div>

            <div class="totals">
              ${invoice.totals
          .map(
            (t) => `
                <div class="line" style="${t.strong ? 'font-weight: 800; font-size: 18px;' : ''}">
                  <div>${t.label}</div>
                  <div>$${(Number(t.value) / 1000000).toFixed(2)}</div>
                </div>
              `
          )
          .join('')}
            </div>

            <div class="footer">
              Verified on Monad Metropolis Testnet · tekosoe.xyz/v/${invoice.number}
            </div>
          </body>
        </html>
      `;
      await Print.printAsync({ html });
    } catch {
      // user dismissed print modal
    }
  };

  return (
    <>
      <Screen
        gap={12}
        footer={
          currentStatus === 'due' ? (
            <View style={{ gap: 10 }}>
              <Button
                label={`Pay ${money(due)}`}
                onPress={handlePay}
                disabled={payTx.isProcessing}
              />
              <View style={styles.footer}>
                <Button label="Save as PDF" variant="outline" style={{ flex: 1 }} onPress={handleSavePdf} />
                <Button label="Share" style={{ flex: 1, height: 52 }} onPress={share} />
              </View>
            </View>
          ) : (
            <View style={styles.footer}>
              <Button label="Save as PDF" variant="outline" style={{ flex: 1 }} onPress={handleSavePdf} />
              <Button label="Share" style={{ flex: 1, height: 52 }} onPress={share} />
            </View>
          )
        }>
        <ScreenHeader title="Trip invoice" right={invoice.device ? <Pill label={invoice.device} weight="bold" color={colors.textMuted} /> : undefined} />

        {/* Member Invoice Switcher (demo multi-HP saja; live = invoice akun ini) */}
        {!isLive && <View style={styles.whoSwitcher}>
          {(['jack', 'wei', 'rina'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              onPress={() => {
                setLocallyPaid(false);
                onSelectWho(m);
              }}
              style={[styles.whoPill, activeWho === m && styles.whoPillActive]}>
              <Text
                style={{
                  fontFamily: activeWho === m ? fonts.bodyExtraBold : fonts.bodyBold,
                  fontSize: 12,
                }}
                color={activeWho === m ? colors.textOnPrimary : colors.textMuted}>
                {m === 'jack' ? 'Jack (Refund)' : m === 'wei' ? 'Wei (Due)' : 'Rina (Paid)'}
              </Text>
            </Pressable>
          ))}
        </View>}

        <Surface style={styles.summary}>
          <View style={styles.summaryTop}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.5 }} color={colors.textMuted}>
              {invoice.number}
            </Text>
            <Pill label={badge.label} bg={badge.bg} color={badge.color} />
          </View>
          <Text variant="h1" style={{ fontSize: 32, lineHeight: 34, letterSpacing: -1 }} color={currentStatus === 'refunded' ? colors.positive : colors.text}>
            {headline}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {subline}
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
  whoSwitcher: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  whoPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whoPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
