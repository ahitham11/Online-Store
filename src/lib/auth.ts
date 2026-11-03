import type { SupabaseConfig } from './env.ts';

/**
 * Minimal Supabase Auth (GoTrue) client: email + password, no email
 * verification. In the Supabase dashboard, Authentication → Sign In / Providers
 * → Email must have "Confirm email" switched off, so a new account is signed in
 * immediately (see README).
 *
 * Plain `fetch` keeps the bundle free of extra dependencies.
 */

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  /** Unix seconds. */
  expiresAt: number;
  user: AuthUser;
};

export type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export class AuthError extends Error {
  readonly status: number;
  readonly code:
    | 'invalid_email'
    | 'invalid_credentials'
    | 'weak_password'
    | 'user_exists'
    | 'needs_confirmation'
    | 'rate_limited'
    | 'network'
    | 'unknown';
  constructor(code: AuthError['code'], status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return EMAIL.test(email) ? email : null;
}

/** Supabase's minimum. Any characters are allowed: letters, digits, Arabic. */
export const MIN_PASSWORD_LENGTH = 6;

export function isAcceptablePassword(value: string) {
  return value.length >= MIN_PASSWORD_LENGTH;
}

/** True when the access token expires within `marginSeconds`. */
export function isExpiring(session: Pick<AuthSession, 'expiresAt'>, nowSeconds: number, marginSeconds = 60) {
  return session.expiresAt - nowSeconds <= marginSeconds;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: { id?: string; email?: string | null };
};

export function toSession(body: TokenResponse, nowSeconds: number): AuthSession {
  if (!body.access_token || !body.refresh_token || !body.user?.id) {
    throw new AuthError('unknown', 200, 'Auth response did not include a session');
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_at ?? nowSeconds + (body.expires_in ?? 3600),
    user: { id: body.user.id, email: body.user.email ?? null },
  };
}

function classify(status: number, body: unknown): AuthError {
  const payload = (body ?? {}) as { error_code?: string; code?: string; msg?: string; error_description?: string; message?: string };
  const message = payload.msg ?? payload.error_description ?? payload.message ?? `Auth request failed (${status})`;
  const code = payload.error_code ?? payload.code ?? '';
  if (status === 429 || code.includes('rate_limit')) return new AuthError('rate_limited', status, message);
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(message)) {
    return new AuthError('user_exists', status, message);
  }
  if (code === 'weak_password' || /password should be/i.test(message)) return new AuthError('weak_password', status, message);
  if (code === 'email_not_confirmed') return new AuthError('needs_confirmation', status, message);
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return new AuthError('invalid_credentials', status, message);
  }
  if (code === 'validation_failed' || code === 'email_address_invalid') return new AuthError('invalid_email', status, message);
  return new AuthError('unknown', status, message);
}

export function createAuthClient(config: SupabaseConfig, fetchImpl: FetchLike = fetch as unknown as FetchLike, now = () => Math.floor(Date.now() / 1000)) {
  const base = `${config.url}/auth/v1`;

  async function call(path: string, body: unknown, accessToken?: string): Promise<unknown> {
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await fetchImpl(`${base}${path}`, {
        method: 'POST',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${accessToken ?? config.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new AuthError('network', 0, (error as Error).message);
    }
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw classify(response.status, json);
    return json;
  }

  return {
    /** Creates an account and returns its session straight away. */
    async signUp(email: string, password: string): Promise<AuthSession> {
      const clean = normalizeEmail(email);
      if (!clean) throw new AuthError('invalid_email', 400, 'Invalid email address');
      if (!isAcceptablePassword(password)) throw new AuthError('weak_password', 400, 'Password too short');
      const body = (await call('/signup', { email: clean, password })) as TokenResponse;
      // With "Confirm email" still switched on, Supabase returns a user but no session.
      if (!body.access_token) throw new AuthError('needs_confirmation', 200, 'Email confirmation is switched on');
      return toSession(body, now());
    },

    async signIn(email: string, password: string): Promise<AuthSession> {
      const clean = normalizeEmail(email);
      if (!clean) throw new AuthError('invalid_email', 400, 'Invalid email address');
      if (!password) throw new AuthError('invalid_credentials', 400, 'Missing password');
      const body = (await call('/token?grant_type=password', { email: clean, password })) as TokenResponse;
      return toSession(body, now());
    },

    async refresh(refreshToken: string): Promise<AuthSession> {
      const body = (await call('/token?grant_type=refresh_token', { refresh_token: refreshToken })) as TokenResponse;
      return toSession(body, now());
    },

    async signOut(accessToken: string) {
      await call('/logout', {}, accessToken).catch(() => undefined);
    },
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
