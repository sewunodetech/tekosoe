import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Bob } from '@/components/decor';
import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InfoBox, Pill, Screen } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { avatarColors, colors, fonts, radius } from '@/constants/theme';
import { useProfile, useSaveProfile } from '@/features/profile/useProfile';

// P1 Set up profile — canvas "Final UI" › P01SetupProfile.
// Muncul sekali tepat setelah passkey pertama dibuat (gate di app/_layout.tsx), dan dari "Edit" di P2 (`?mode=edit`).
// `?next=/invite/<code>/join` = kembali ke layar Join setelah selesai (akun baru dari link undangan).
// TODO (M12 live): simpan ke api → `profiles` (display_name, city, country_code, avatar_color).

const COUNTRIES = ['Australia', 'Indonesia', 'Singapore', 'Japan', 'Malaysia', 'Thailand', 'Germany', 'United States'];

export default function SetupProfileScreen() {
  const { next, mode } = useLocalSearchParams<{ next?: string; mode?: string }>();
  const editing = mode === 'edit';
  const existing = useProfile().data;
  const save = useSaveProfile();

  const [name, setName] = useState(existing?.name ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [country, setCountry] = useState(existing?.country ?? 'Australia');
  const [tint, setTint] = useState<string>(existing?.tint ?? avatarColors[2]);
  const [picking, setPicking] = useState(false);

  const valid = name.trim().length > 0 && city.trim().length > 0;

  const submit = async () => {
    if (!valid) return;
    await save.mutateAsync({ name: name.trim(), city: city.trim(), country, tint });
    if (editing && router.canGoBack()) router.back();
    else router.replace((next as Href | undefined) ?? '/trips');
  };

  return (
    <Screen
      gap={18}
      footer={
        <Button
          label={save.isPending ? 'Saving…' : editing ? 'Save' : 'Continue'}
          disabled={!valid || save.isPending}
          style={!valid ? { opacity: 0.5 } : undefined}
          onPress={submit}
        />
      }>
      <ScreenHeader right={editing ? undefined : <Pill label="Passkey is set" bg={colors.positiveBg} color={colors.positiveText} />} />

      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: tint }]}>
            <Text style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 42 }}>{(name.trim()[0] ?? '?').toUpperCase()}</Text>
          </View>
          <Bob style={styles.teko}>
            <Teko mood="wink" size={56} bob={false} />
          </Bob>
        </View>
        <View style={{ flex: 1, gap: 4, paddingLeft: 12 }}>
          <Text variant="h1">{editing ? 'Edit your profile' : 'Say hi to your friends'}</Text>
          <Text variant="label" style={{ fontFamily: fonts.body }} color={colors.textMuted}>
            This is how you show up in every trip.
          </Text>
        </View>
      </View>

      <TextField label="Your name" value={name} onChangeText={setName} placeholder="Jack" autoCapitalize="words" />

      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <TextField label="City" value={city} onChangeText={setCity} placeholder="Sydney" autoCapitalize="words" />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Text variant="label">Country</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Country, ${country}`}
            onPress={() => setPicking((p) => !p)}
            style={styles.select}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16 }} numberOfLines={1}>
              {country}
            </Text>
            <Icon name="chevron" size={18} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {picking && (
        <View style={styles.countryList}>
          {COUNTRIES.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityState={{ selected: c === country }}
              onPress={() => {
                setCountry(c);
                setPicking(false);
              }}
              style={[styles.countryRow, c === country && { backgroundColor: colors.hero }]}>
              <Text style={{ fontFamily: c === country ? fonts.bodyBold : fonts.bodyMedium, fontSize: 15 }}>{c}</Text>
              {c === country && <Icon name="check" size={16} color={colors.primary} strokeWidth={2.6} />}
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Text variant="label">Your color</Text>
        <View style={styles.swatches} accessibilityRole="radiogroup">
          {avatarColors.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityState={{ selected: c === tint }}
              accessibilityLabel="Avatar color"
              onPress={() => setTint(c)}
              style={[styles.swatch, { backgroundColor: c }, c === tint ? styles.swatchOn : styles.swatchOff]}
            />
          ))}
        </View>
      </View>

      <InfoBox icon={<Icon name="lock" size={18} color={colors.primary} strokeWidth={2} />}>
        Only people in your trips see this. You can change it any time in Profile.
      </InfoBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 88,
    height: 88,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teko: {
    position: 'absolute',
    right: -22,
    bottom: -14,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  select: {
    height: 54,
    paddingLeft: 16,
    paddingRight: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryList: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: 6,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  swatches: {
    flexDirection: 'row',
    gap: 10,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  swatchOn: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  swatchOff: {
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
