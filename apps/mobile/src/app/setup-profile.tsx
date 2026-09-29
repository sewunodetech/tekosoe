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

import { COUNTRIES, LOCATIONS } from '@/data/locations';

import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { DiscardModal } from '@/components/ui/discard-modal';

export default function SetupProfileScreen() {
  const { next, mode } = useLocalSearchParams<{ next?: string; mode?: string }>();
  const editing = mode === 'edit';
  const existing = useProfile().data;
  const save = useSaveProfile();

  const [name, setName] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [tint, setTint] = useState<string | null>(null);
  const [pickingCountry, setPickingCountry] = useState(false);
  const [pickingCity, setPickingCity] = useState(false);

  const initialCountry = existing?.country ?? 'Australia';
  const currentCountry = country ?? initialCountry;
  const defaultCities = LOCATIONS[currentCountry] ?? ['Sydney'];
  const initialCity = existing?.city ?? defaultCities[0];
  const currentCity = city ?? initialCity;
  const initialName = existing?.name ?? '';
  const currentName = name ?? initialName;
  const initialTint = existing?.tint ?? avatarColors[2];
  const currentTint = tint ?? initialTint;

  const isDirty =
    (name !== null && name.trim() !== initialName.trim()) ||
    (country !== null && country !== initialCountry) ||
    (city !== null && city !== initialCity) ||
    (tint !== null && tint !== initialTint);

  const { showDiscardModal, setShowDiscardModal, handleBack, confirmExit } = useUnsavedChanges({
    isDirty,
    fallbackRoute: (next as Href | undefined) ?? '/trips',
  });

  const valid = currentName.trim().length > 0 && currentCity.trim().length > 0 && currentCountry.trim().length > 0;

  const submit = async () => {
    if (!valid) return;
    await save.mutateAsync({ name: currentName.trim(), city: currentCity.trim(), country: currentCountry, tint: currentTint });
    if (editing && router.canGoBack()) router.back();
    else router.replace((next as Href | undefined) ?? '/trips');
  };

  const handleSelectCountry = (c: string) => {
    setCountry(c);
    const cities = LOCATIONS[c] ?? [];
    setCity(cities[0] ?? '');
    setPickingCountry(false);
  };

  return (
    <>
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
        <ScreenHeader
          onPress={handleBack}
          right={editing ? undefined : <Pill label="Passkey is set" bg={colors.positiveBg} color={colors.positiveText} />}
        />

        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: currentTint }]}>
              <Text style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 42 }}>{(currentName.trim()[0] ?? '?').toUpperCase()}</Text>
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

        <TextField label="Your name" value={currentName} onChangeText={setName} placeholder="Jack" autoCapitalize="words" />

        {/* Country and City select dropdowns */}
        <View style={styles.twoCol}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text variant="label">Country</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Country, ${currentCountry}`}
              onPress={() => {
                setPickingCountry((p) => !p);
                setPickingCity(false);
              }}
              style={styles.select}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15 }} numberOfLines={1}>
                {currentCountry}
              </Text>
              <Icon name="chevron" size={18} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={{ flex: 1, gap: 8 }}>
            <Text variant="label">City</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`City, ${currentCity}`}
              onPress={() => {
                setPickingCity((p) => !p);
                setPickingCountry(false);
              }}
              style={styles.select}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15 }} numberOfLines={1}>
                {currentCity || 'Select city'}
              </Text>
              <Icon name="chevron" size={18} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {pickingCountry && (
          <View style={styles.countryList}>
            {COUNTRIES.map((c) => (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ selected: c === currentCountry }}
                onPress={() => handleSelectCountry(c)}
                style={[styles.countryRow, c === currentCountry && { backgroundColor: colors.hero }]}>
                <Text style={{ fontFamily: c === currentCountry ? fonts.bodyBold : fonts.bodyMedium, fontSize: 15 }}>{c}</Text>
                {c === currentCountry && <Icon name="check" size={16} color={colors.primary} strokeWidth={2.6} />}
              </Pressable>
            ))}
          </View>
        )}

        {pickingCity && (
          <View style={styles.countryList}>
            {(LOCATIONS[currentCountry] ?? []).map((cityName) => (
              <Pressable
                key={cityName}
                accessibilityRole="radio"
                accessibilityState={{ selected: cityName === currentCity }}
                onPress={() => {
                  setCity(cityName);
                  setPickingCity(false);
                }}
                style={[styles.countryRow, cityName === currentCity && { backgroundColor: colors.hero }]}>
                <Text style={{ fontFamily: cityName === currentCity ? fonts.bodyBold : fonts.bodyMedium, fontSize: 15 }}>
                  {cityName}
                </Text>
                {cityName === currentCity && <Icon name="check" size={16} color={colors.primary} strokeWidth={2.6} />}
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
                accessibilityState={{ selected: c === currentTint }}
                accessibilityLabel="Avatar color"
                onPress={() => setTint(c)}
                style={[styles.swatch, { backgroundColor: c }, c === currentTint ? styles.swatchOn : styles.swatchOff]}
              />
            ))}
          </View>
        </View>

        <InfoBox icon={<Icon name="lock" size={18} color={colors.primary} strokeWidth={2} />}>
          Only people in your trips see this. You can change it any time in Profile.
        </InfoBox>
      </Screen>
      <DiscardModal
        visible={showDiscardModal}
        onCancel={() => setShowDiscardModal(false)}
        onConfirm={confirmExit}
      />
    </>
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
