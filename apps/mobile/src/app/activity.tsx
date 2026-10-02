import { View } from 'react-native';

import { FeedRow, NeedsYouRow } from '@/components/feed-row';
import { QueryState } from '@/components/query-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen, SectionLabel } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import type { FeedItem } from '@/data/types';
import { useFeed } from '@/features/activity/useFeed';

// Activity — di luar Final UI (dibuka dari lonceng di 03 Home). Riwayat semua trip + saldo dolar:
// Top up, Cash out, isi pot, pembayaran, struk, settle-up, kembalian. "Needs you" = permintaan yang menunggu persetujuanmu.
export default function ActivityScreen() {
  return (
    <QueryState query={useFeed()} title="Activity">
      {(items) => <ActivityView items={items} />}
    </QueryState>
  );
}

const dayKey = (seconds: number) => new Date(seconds * 1000).toDateString();

function dayLabel(seconds: number): string {
  const date = new Date(seconds * 1000);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const timeOf = (seconds: number) =>
  new Date(seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Kelompokkan per hari, urutan dari data (terbaru dulu). */
function byDay(items: FeedItem[]): { key: string; label: string; items: FeedItem[] }[] {
  const groups: { key: string; label: string; items: FeedItem[] }[] = [];
  for (const item of items) {
    const key = dayKey(item.at);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, label: dayLabel(item.at), items: [item] });
  }
  return groups;
}

function ActivityView({ items }: { items: FeedItem[] }) {
  const needsYou = items.filter((item) => item.needsYou);
  const history = items.filter((item) => !item.needsYou);

  return (
    <Screen gap={18}>
      <ScreenHeader title="Activity" action="back" />

      {items.length === 0 ? (
        <EmptyState
          mood="sleep"
          title="Nothing here yet"
          description="Top ups, filling a pot, payments and settle-ups will show up here."
        />
      ) : null}

      {needsYou.length > 0 && (
        <View style={{ gap: 10 }}>
          <SectionLabel>Needs you</SectionLabel>
          {needsYou.map((item) => (
            <NeedsYouRow key={item.id} item={item} />
          ))}
        </View>
      )}

      {byDay(history).map((day) => (
        <View key={day.key} style={{ gap: 10 }}>
          <SectionLabel>{day.label}</SectionLabel>
          {day.items.map((item) => (
            <FeedRow key={item.id} item={item} time={timeOf(item.at)} />
          ))}
        </View>
      ))}
    </Screen>
  );
}
