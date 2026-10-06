import { Alert, Platform, Share } from 'react-native';

import type { Trip } from '@/data/types';
import { inviteUrl, loadInviteCode } from '@/lib/invite';

/** Live: link undangan hanya ada di HP pembuat trip (rahasianya tidak pernah dikirim ke server). */
export async function shareInvite(trip: Trip) {
  const code = await loadInviteCode(trip.id);
  if (!code) {
    Alert.alert('Invite link', 'Ask the person who created this trip to share the invite link.');
    return;
  }
  const message = `Join our trip "${trip.name}" on Tekosue: ${inviteUrl(code)}`;
  // Browsers without navigator.share: show the link instead.
  await Share.share({ message }).catch(() => {
    // react-native-web has no Alert; prompt() lets the user copy the link.
    if (Platform.OS === 'web') globalThis.prompt?.('Invite link', inviteUrl(code));
    else Alert.alert('Invite link', inviteUrl(code));
  });
}
