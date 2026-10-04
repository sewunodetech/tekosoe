import { Redirect, useLocalSearchParams } from 'expo-router';

// Link undangan web https://<webDomain>/j/<kode> (App Links / Universal Links) → 05 Invite.
export default function InviteLinkRedirect() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={`/invite/${code}`} />;
}
