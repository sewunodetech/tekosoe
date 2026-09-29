import { useQuery } from '@tanstack/react-query';

import { trips } from '@/data/demo';

// TODO (M6): Envio (grup milik alamat user: pot, saldo) + api (nama trip).
export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      // Simulasi latensi jaringan di mode demo.
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        list: Object.values(trips),
        settled: [{ name: 'Bali Weekend', returnAmount: '$12.50' }],
      };
    },
  });
}
