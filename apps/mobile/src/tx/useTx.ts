import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export type TxStatus = 'idle' | 'processing' | 'done' | 'error';

export function useTx<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  options?: { onSuccess?: (data: TResult) => void; onError?: (error: Error) => void }
) {
  const [status, setStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (args: TArgs) => {
      try {
        setStatus('processing');
        setError(null);
        const result = await mutationFn(args);
        setStatus('done');
        
        // Return to idle after a short delay so user can see "Done" state
        setTimeout(() => {
          setStatus('idle');
          options?.onSuccess?.(result);
        }, 800);
        
        return result;
      } catch (err: any) {
        setStatus('error');
        const message = err?.message || 'Transaction failed. Please try again.';
        setError(message);
        
        // Show friendly error
        Alert.alert('Error', message);
        options?.onError?.(err);
        
        // Reset status
        setStatus('idle');
        throw err;
      }
    },
    [mutationFn, options]
  );

  return {
    status,
    isProcessing: status === 'processing',
    isDone: status === 'done',
    error,
    execute,
  };
}
