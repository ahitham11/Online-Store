import { readString, removeKey, writeString } from '@/lib/storage';

/**
 * Browsers have no keychain. The web build keeps the refresh token in
 * localStorage, which is the same trade-off supabase-js makes on the web.
 */
export async function secureGet(key: string): Promise<string | null> {
  return readString(key) ?? null;
}

export async function secureSet(key: string, value: string): Promise<void> {
  writeString(key, value);
}

export async function secureRemove(key: string): Promise<void> {
  removeKey(key);
}
