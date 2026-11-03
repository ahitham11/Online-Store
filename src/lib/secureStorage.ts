import * as SecureStore from 'expo-secure-store';

/**
 * Keychain / Keystore storage for the auth refresh token. Only the refresh
 * token and the user id/email are stored; the access token stays in memory.
 */
export async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function secureRemove(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}
