import { Button } from '@/components/ui/button';
import { useAddDemoFunds } from '@/features/wallet/useFunds';
import { isLive } from '@/lib/env';
import { mapTxError } from '@/tx/errors';
import { Alert } from 'react-native';

/**
 * Testnet saja: tombol "Add demo funds" (faucet AUSD Agora) saat saldo kurang.
 * Tidak tampil di mode demo.
 */
export function DemoFundsButton({ needed, balance }: { needed: bigint; balance: bigint | undefined }) {
  const add = useAddDemoFunds();
  if (!isLive || balance === undefined || balance >= needed) return null;
  return (
    <Button
      label={add.isPending ? 'Adding demo funds…' : 'Add demo funds'}
      variant="outline"
      disabled={add.isPending}
      onPress={() =>
        add.mutate(undefined, {
          onError: (error) => Alert.alert('Unable to complete', mapTxError(error)),
        })
      }
    />
  );
}
