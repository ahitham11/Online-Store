import { useQuery } from '@tanstack/react-query';

import { emptyCatalog, type CatalogSnapshot } from '@/data/catalog';
import { fetchSupabaseCatalog } from '@/data/supabaseCatalog';
import { readSupabaseConfig } from '@/lib/env';

export const catalogKeys = {
  all: ['catalog'] as const,
};

const supabase = readSupabaseConfig();

/** True when the build carries Supabase credentials. */
export const catalogIsConnected = supabase !== null;

async function fetchCatalog({ signal }: { signal: AbortSignal }): Promise<CatalogSnapshot> {
  // Without Supabase credentials the app keeps its designed empty states
  // rather than showing fixtures.
  if (!supabase) return emptyCatalog;
  return fetchSupabaseCatalog(supabase, undefined, signal);
}

export function useCatalog() {
  return useQuery({
    queryKey: catalogKeys.all,
    queryFn: fetchCatalog,
    initialData: emptyCatalog,
    // The empty snapshot is only a first paint; mark it stale so the published
    // catalog is fetched immediately when Supabase is configured.
    initialDataUpdatedAt: 0,
    staleTime: 60_000,
  });
}

export function useCatalogEmpty() {
  const catalog = useCatalog();
  return catalog.data.status === 'empty';
}
