import { Redirect, useLocalSearchParams } from 'expo-router';

// 06 Join + put in tidak dipakai lagi (ADR 0009): gabung langsung dari 05 Invite tanpa setoran.
// Route tetap ada supaya link/riwayat lama ke /invite/<kode>/join tidak berakhir di layar kosong.
export default function JoinRedirect() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={`/invite/${code}`} />;
}
