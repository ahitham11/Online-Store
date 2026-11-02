import { useEffect, useRef } from 'react';

import { useCatalog } from '@/data/useCatalog';
import { createSyncClient, findVariantBySku, mergeBag, mergeWishlist } from '@/lib/accountSync';
import { readSupabaseConfig } from '@/lib/env';
import { useBagStore } from '@/stores/bag';
import { useSessionStore } from '@/stores/session';
import { useWishlistStore } from '@/stores/wishlist';

const config = readSupabaseConfig();
const sync = config ? createSyncClient(config) : null;
const PUSH_DELAY_MS = 800;

function report(error: unknown) {
  if (__DEV__) console.warn('[account sync]', error);
}

/**
 * Restores the session at launch. While signed in, merges the device bag and
 * wishlist with the server once, then pushes later changes (debounced). If a
 * push fails, the next change retries it; the device copy stays the
 * source of truth.
 */
export function useAccountSync() {
  const status = useSessionStore((state) => state.status);
  const userId = useSessionStore((state) => state.user?.id ?? null);
  const restore = useSessionStore((state) => state.restore);
  const catalog = useCatalog().data;
  const catalogRef = useRef(catalog);
  const catalogReady = catalog.status === 'ready';
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  useEffect(() => {
    restore().catch(report);
  }, [restore]);

  useEffect(() => {
    if (!sync || status !== 'signedIn' || !userId || !catalogReady) {
      if (status === 'signedOut') mergedFor.current = null;
      return;
    }

    let cancelled = false;
    let bagTimer: ReturnType<typeof setTimeout> | undefined;
    let wishlistTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribers: (() => void)[] = [];
    const token = () => useSessionStore.getState().getAccessToken();

    const pushBag = () => {
      clearTimeout(bagTimer);
      bagTimer = setTimeout(async () => {
        const accessToken = await token();
        if (!accessToken || cancelled) return;
        const lines = useBagStore
          .getState()
          .lines.filter((line) => findVariantBySku(catalogRef.current, line.sku));
        sync.pushBag(accessToken, userId, lines).catch(report);
      }, PUSH_DELAY_MS);
    };

    const pushWishlist = () => {
      clearTimeout(wishlistTimer);
      wishlistTimer = setTimeout(async () => {
        const accessToken = await token();
        if (!accessToken || cancelled) return;
        const known = new Set(catalogRef.current.products.map((product) => product.id));
        const ids = useWishlistStore.getState().productIds.filter((id) => known.has(id));
        sync.pushWishlist(accessToken, userId, ids).catch(report);
      }, PUSH_DELAY_MS);
    };

    (async () => {
      if (mergedFor.current !== userId) {
        const accessToken = await token();
        if (!accessToken || cancelled) return;
        const remote = await sync.pull(accessToken);
        if (cancelled) return;
        const bag = mergeBag(useBagStore.getState().lines, remote.bag, catalogRef.current);
        const wishlist = mergeWishlist(useWishlistStore.getState().productIds, remote.wishlist, catalogRef.current);
        useBagStore.getState().replaceLines(bag);
        useWishlistStore.getState().replaceAll(wishlist);
        await Promise.all([
          sync.pushBag(accessToken, userId, bag),
          sync.pushWishlist(accessToken, userId, wishlist),
        ]);
        mergedFor.current = userId;
      }
      if (cancelled) return;
      unsubscribers.push(
        useBagStore.subscribe((state, previous) => {
          if (state.lines !== previous.lines) pushBag();
        }),
        useWishlistStore.subscribe((state, previous) => {
          if (state.productIds !== previous.productIds) pushWishlist();
        }),
      );
    })().catch(report);

    return () => {
      cancelled = true;
      clearTimeout(bagTimer);
      clearTimeout(wishlistTimer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [catalogReady, status, userId]);
}
