/**
 * Client-safe configuration. Expo inlines `process.env.EXPO_PUBLIC_*` at build
 * time, so each value must be read with a static property access.
 *
 * Only the Supabase URL and anon key ever reach the bundle. Row Level Security
 * is the security boundary; service-role keys stay in server-side scripts.
 */
export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function readSupabaseConfig(
  url: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
): SupabaseConfig | null {
  const cleanUrl = url?.trim().replace(/\/+$/, '');
  const cleanKey = anonKey?.trim();
  if (!cleanUrl || !cleanKey) return null;
  if (!/^https:\/\/[^\s/]+$/.test(cleanUrl)) return null;
  return { url: cleanUrl, anonKey: cleanKey };
}
