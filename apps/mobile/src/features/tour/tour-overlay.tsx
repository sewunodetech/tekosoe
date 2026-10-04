import { useEffect, useState, type RefObject } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Pop } from '@/components/decor';
import { Teko, type TekoMood } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius } from '@/constants/theme';

type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };
type Rect = { x: number; y: number; w: number; h: number };
type Target = 'newTrip' | 'bell' | 'cardTab' | 'profileTab';

export type TourTargets = {
  /** Area layar Home di atas tab bar; tab bar dihitung dari tepi bawahnya. */
  scene: RefObject<Measurable | null>;
  newTrip: RefObject<Measurable | null>;
  bell: RefObject<Measurable | null>;
};

type Step = { target?: Target; mood: TekoMood; title: string; body: string; art?: 'trip' };

const steps = (name: string): Step[] => [
  { mood: 'wink', title: `Welcome, ${name}`, body: 'Want a quick tour of how Tekosoe works? It takes 30 seconds.' },
  {
    target: 'newTrip',
    mood: 'idle',
    title: 'Start a trip',
    body: 'Name it, pick an end date and an approval limit, then share the invite link with friends.',
  },
  {
    mood: 'fill',
    art: 'trip',
    title: 'Inside a trip',
    body: 'Add money to the pot, pay from it, and check "If we settled today" anytime.',
  },
  {
    target: 'bell',
    mood: 'think',
    title: 'Requests land here',
    body: "When a friend's spend needs your OK, the bell gets a dot. Approve or decline in one tap.",
  },
  { target: 'cardTab', mood: 'pour', title: 'Pay with the trip card', body: 'Tap to pay at shops. It comes straight out of the pot.' },
  { target: 'profileTab', mood: 'love', title: 'Your dollars and profile', body: 'Top up or cash out your dollars, and edit your profile.' },
  { mood: 'cheer', title: "You're all set", body: 'On the last day, Teko settles everyone up. Have a great trip!' },
];

const PAD = 6;

function measure(ref: RefObject<Measurable | null>): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!ref.current) return resolve(null);
    ref.current.measureInWindow((x, y, w, h) => resolve(w > 0 && h > 0 ? { x, y, w, h } : null));
  });
}

/**
 * Tour pertama setelah sign in (di atas 03 Home): layar digelapkan, bagian yang dijelaskan disorot.
 * Langkah tanpa target (sapaan, isi trip, penutup) tampil sebagai kartu di tengah.
 */
export function TourOverlay({ name, targets, onDone }: { name: string; targets: TourTargets; onDone: () => void }) {
  const list = steps(name);
  const [index, setIndex] = useState(0);
  // Hasil ukur disimpan bersama indeks langkahnya; langkah lain → belum ada sorotan.
  const [measured, setMeasured] = useState<{ index: number; rect: Rect | null }>({ index: -1, rect: null });
  const { width, height } = useWindowDimensions();
  const step = list[index];
  const first = index === 0;
  const last = index === list.length - 1;
  const numbered = list.length - 2;
  const rect = measured.index === index ? measured.rect : null;

  useEffect(() => {
    let alive = true;
    const target = step.target;
    if (!target) return;
    // Tunggu layout Home selesai (tour bisa muncul tepat setelah layar dipasang).
    const timer = setTimeout(async () => {
      const scene = await measure(targets.scene);
      let found: Rect | null = null;
      if (target === 'cardTab' || target === 'profileTab') {
        if (scene) {
          const top = scene.y + scene.h;
          const tabW = width / 3;
          const h = Math.min(Math.max(height - top, 56), 90);
          // Masuk ke dalam sel tab supaya sorotan (+PAD) tidak keluar dari tepi bawah layar.
          found = { x: tabW * (target === 'cardTab' ? 1 : 2) + PAD, y: top + PAD, w: tabW - PAD * 2, h: h - PAD * 2 };
        }
      } else {
        found = await measure(targets[target]);
        // Tombol di luar layar (daftar trip panjang) → kartu di tengah tanpa sorotan.
        if (found && scene && found.y + found.h > scene.y + scene.h) found = null;
      }
      if (alive) setMeasured({ index, rect: found });
    }, 60);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [index, step.target, targets, width, height]);

  const hole = rect && { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + PAD * 2, h: rect.h + PAD * 2 };
  const below = hole ? hole.y + hole.h / 2 < height / 2 : false;
  const cardPos = !hole
    ? styles.center
    : below
      ? { top: hole.y + hole.h + 14 }
      : { bottom: height - hole.y + 14 };

  return (
    <Modal transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onDone}>
      <View style={StyleSheet.absoluteFill}>
        {hole ? (
          <>
            <View style={[styles.dim, { left: 0, right: 0, top: 0, height: Math.max(hole.y, 0) }]} />
            <View style={[styles.dim, { left: 0, right: 0, top: hole.y + hole.h, bottom: 0 }]} />
            <View style={[styles.dim, { left: 0, width: Math.max(hole.x, 0), top: hole.y, height: hole.h }]} />
            <View style={[styles.dim, { left: hole.x + hole.w, right: 0, top: hole.y, height: hole.h }]} />
            <View pointerEvents="none" style={[styles.ring, { left: hole.x, top: hole.y, width: hole.w, height: hole.h }]} />
          </>
        ) : (
          <View style={[styles.dim, StyleSheet.absoluteFill]} />
        )}

        <View style={[styles.cardWrap, cardPos]} pointerEvents="box-none">
          {/* Pop, bukan layout animation Reanimated: yang terakhir bisa macet di web (AGENTS.md). */}
          <Pop key={index} style={styles.card}>
            {first || last ? (
              <View style={styles.centerCol}>
                <Teko mood={step.mood} size={96} />
                <Text variant="h2" style={styles.textCenter}>
                  {step.title}
                </Text>
                <Text variant="body" color={colors.textMuted} style={styles.textCenter}>
                  {step.body}
                </Text>
                <View style={styles.fullButtons}>
                  <Button label={first ? 'Show me around' : "Let's go"} onPress={() => (first ? setIndex(1) : onDone())} />
                  {first && <Button label="Skip tour" variant="ghost" onPress={onDone} />}
                </View>
              </View>
            ) : (
              <>
                <View style={styles.headRow}>
                  <Teko mood={step.mood} size={56} bob={false} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="small" color={colors.textMuted}>
                      {index} of {numbered}
                    </Text>
                    <Text variant="h3">{step.title}</Text>
                  </View>
                </View>
                {step.art === 'trip' && <TripArt />}
                <Text variant="body" color={colors.textMuted}>
                  {step.body}
                </Text>
                <View style={styles.navRow}>
                  <Pressable accessibilityRole="button" onPress={onDone} hitSlop={10}>
                    <Text variant="label" color={colors.textMuted}>
                      Skip
                    </Text>
                  </Pressable>
                  <View style={styles.navButtons}>
                    {index > 1 && (
                      <Pressable accessibilityRole="button" onPress={() => setIndex(index - 1)} style={styles.smallGhost}>
                        <Text variant="label" color={colors.primary}>
                          Back
                        </Text>
                      </Pressable>
                    )}
                    <Pressable accessibilityRole="button" onPress={() => setIndex(index + 1)} style={styles.smallPrimary}>
                      <Text variant="label" color={colors.textOnPrimary}>
                        Next
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </Pop>
        </View>
      </View>
    </Modal>
  );
}

/** Kartu kas mini untuk langkah "Inside a trip": trip belum ada, jadi pakai ilustrasi. */
function TripArt() {
  return (
    <View style={styles.tripArt}>
      <Text variant="caption" color={colors.heroText}>
        In the pot
      </Text>
      <Text variant="h1">$300.00</Text>
      <View style={styles.chips}>
        {['Add money', 'Pay', 'If we settled today'].map((label) => (
          <View key={label} style={styles.chip}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(29, 36, 38, 0.6)',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: colors.accent,
    borderRadius: radius.button,
  },
  cardWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  center: {
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    gap: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    boxShadow: '0 16px 40px rgba(29, 36, 38, 0.25)',
  },
  centerCol: {
    alignItems: 'center',
    gap: 10,
  },
  textCenter: {
    textAlign: 'center',
  },
  fullButtons: {
    alignSelf: 'stretch',
    gap: 4,
    marginTop: 6,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  smallGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  smallPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  tripArt: {
    padding: 14,
    gap: 2,
    borderRadius: radius.row,
    backgroundColor: colors.hero,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
});
