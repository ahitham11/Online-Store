import { useQuery } from '@tanstack/react-query';

import { readSupabaseConfig } from '@/lib/env';
import { createOrdersClient } from '@/lib/orders';
import { useSessionStore } from '@/stores/session';

const config = readSupabaseConfig();
export const ordersClient = config ? createOrdersClient(config) : null;

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
};

async function token() {
  const accessToken = await useSessionStore.getState().getAccessToken();
  if (!accessToken) throw new Error('sign_in_required');
  return accessToken;
}

export function useMyOrders() {
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  return useQuery({
    queryKey: orderKeys.all,
    enabled: signedIn && !!ordersClient,
    queryFn: async () => ordersClient!.listOrders(await token()),
  });
}

export function useOrder(id: string | undefined) {
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    enabled: signedIn && !!ordersClient && !!id,
    queryFn: async () => ordersClient!.getOrder(await token(), id!),
    refetchInterval: 60_000,
  });
}
