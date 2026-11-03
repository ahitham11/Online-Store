import { create } from 'zustand';

import { AuthError, createAuthClient, isExpiring, type AuthSession, type AuthUser } from '@/lib/auth';
import { readSupabaseConfig } from '@/lib/env';
import { secureGet, secureRemove, secureSet } from '@/lib/secureStorage';

const STORAGE_KEY = 'velvety.session.v1';

const config = readSupabaseConfig();
const auth = config ? createAuthClient(config) : null;

/** Sign-in needs Supabase credentials in the build. */
export const authIsAvailable = auth !== null;

type Status = 'restoring' | 'signedOut' | 'signedIn';

type SessionState = {
  status: Status;
  user: AuthUser | null;
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** A valid access token, refreshed when close to expiry; null when signed out. */
  getAccessToken: () => Promise<string | null>;
};

// The access token stays in memory only. The keychain holds the refresh token.
let current: AuthSession | null = null;
let refreshing: Promise<AuthSession | null> | null = null;

async function persist(session: AuthSession | null) {
  current = session;
  if (!session) {
    await secureRemove(STORAGE_KEY);
    return;
  }
  await secureSet(STORAGE_KEY, JSON.stringify({ refreshToken: session.refreshToken, user: session.user }));
}

export const useSessionStore = create<SessionState>()((set, get) => {
  async function refreshWith(refreshToken: string): Promise<AuthSession | null> {
    if (!auth) return null;
    if (!refreshing) {
      refreshing = auth
        .refresh(refreshToken)
        .then(async (session) => {
          await persist(session);
          set({ status: 'signedIn', user: session.user });
          return session;
        })
        .catch(async (error: unknown) => {
          // A network failure keeps the stored session for the next attempt;
          // a rejected refresh token signs the shopper out.
          if (error instanceof AuthError && error.code !== 'network') {
            await persist(null);
            set({ status: 'signedOut', user: null });
          }
          return null;
        })
        .finally(() => {
          refreshing = null;
        });
    }
    return refreshing;
  }

  return {
    status: auth ? 'restoring' : 'signedOut',
    user: null,

    async restore() {
      if (!auth) return set({ status: 'signedOut' });
      const raw = await secureGet(STORAGE_KEY);
      if (!raw) return set({ status: 'signedOut', user: null });
      try {
        const stored = JSON.parse(raw) as { refreshToken: string; user: AuthUser };
        // Show the shopper as signed in straight away; the refresh confirms it.
        set({ status: 'signedIn', user: stored.user });
        await refreshWith(stored.refreshToken);
      } catch {
        await persist(null);
        set({ status: 'signedOut', user: null });
      }
    },

    async signIn(email, password) {
      if (!auth) throw new AuthError('unknown', 0, 'Sign-in is not configured');
      const session = await auth.signIn(email, password);
      await persist(session);
      set({ status: 'signedIn', user: session.user });
    },

    async signUp(email, password) {
      if (!auth) throw new AuthError('unknown', 0, 'Sign-in is not configured');
      const session = await auth.signUp(email, password);
      await persist(session);
      set({ status: 'signedIn', user: session.user });
    },

    async signOut() {
      const session = current;
      await persist(null);
      set({ status: 'signedOut', user: null });
      if (auth && session) await auth.signOut(session.accessToken);
    },

    async getAccessToken() {
      if (get().status !== 'signedIn') return null;
      if (current && !isExpiring(current, Math.floor(Date.now() / 1000))) return current.accessToken;
      const refreshToken = current?.refreshToken ?? (await readStoredRefreshToken());
      if (!refreshToken) return null;
      const session = await refreshWith(refreshToken);
      return session?.accessToken ?? null;
    },
  };
});

async function readStoredRefreshToken() {
  const raw = await secureGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { refreshToken?: string }).refreshToken ?? null;
  } catch {
    return null;
  }
}
