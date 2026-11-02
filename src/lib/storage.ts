import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'velvety.atelier.v1' });

export function readString(key: string): string | undefined {
  return storage.getString(key);
}

export function writeString(key: string, value: string): void {
  storage.set(key, value);
}

export function removeKey(key: string): void {
  storage.remove(key);
}

export const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};
