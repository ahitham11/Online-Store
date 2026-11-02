import { useQuery } from '@tanstack/react-query';

import { emptyCatalog, type CatalogSnapshot } from '@/data/catalog';

export const catalogKeys = {
  all: ['catalog'] as const,
};

async function fetchCatalog(): Promise<CatalogSnapshot> {
  // Phase 2 replaces this with the Supabase catalog query. Until a catalog is
  // published, the app shows designed empty states rather than fixtures.
  return emptyCatalog;
}

export function useCatalog() {
  return useQuery({
    queryKey: catalogKeys.all,
    queryFn: fetchCatalog,
    initialData: emptyCatalog,
    staleTime: 60_000,
  });
}

export function useCatalogEmpty() {
  const catalog = useCatalog();
  return catalog.data.status === 'empty';
}
