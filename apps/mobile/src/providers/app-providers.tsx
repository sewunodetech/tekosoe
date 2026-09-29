import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';
import { SessionProvider } from './session-provider';
import { NotificationProvider } from './notification-provider';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Feed dan saldo di-poll dari Envio beberapa detik sekali (FR-14).
          queries: { staleTime: 3_000, retry: 2 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
