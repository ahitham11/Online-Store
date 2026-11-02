/**
 * Web storage adapter. react-native-mmkv v4 supports web, but keeping the
 * platform split avoids pulling a native-only import into the web bundle.
 */

const memory = new Map<string, string>();

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export function readString(key: string): string | undefined {
  return safeGet(key) ?? undefined;
}

export function writeString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    memory.delete(key);
  }
}

export const mmkvStorage = {
  getItem: (name: string) => safeGet(name),
  setItem: (name: string, value: string) => writeString(name, value),
  removeItem: (name: string) => removeKey(name),
};
