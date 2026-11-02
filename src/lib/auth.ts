import type { SupabaseConfig } from './env.ts';

/**
 * Minimal Supabase Auth (GoTrue) client for one-time email codes.
 *
 * Plain `fetch` keeps the bundle free of extra dependencies. In the Supabase
 * dashboard, the "Magic Link" email template must include `{{ .Token }}` so the
 * email carries the 6-digit code (see README).
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
  readonly code: 'invalid_email' | 'invalid_code' | 'rate_limited' | 'expired' | 'network' | 'unknown';
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

/** Accepts Arabic-Indic and Persian digits, spaces and dashes. */
export function normalizeOtp(value: string): string | null {
  const latin = value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\s-]/g, '');
  return /^\d{6,10}$/.test(latin) ? latin : null;
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
  const payload = (body ?? {}) as { error_code?: string; msg?: string; error_description?: string; message?: string };
  const message = payload.msg ?? payload.error_description ?? payload.message ?? `Auth request failed (${status})`;
  const code = payload.error_code ?? '';
  if (status === 429 || code.includes('rate_limit')) return new AuthError('rate_limited', status, message);
  if (code === 'otp_expired' || /expired/i.test(message)) return new AuthError('expired', status, message);
  if (code === 'validation_failed' || code === 'email_address_invalid') return new AuthError('invalid_email', status, message);
  if (status === 401 || status === 403 || /token|otp/i.test(message)) return new AuthError('invalid_code', status, message);
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
    /** Sends a one-time code. New shoppers are created on first sign-in. */
    async requestEmailCode(email: string) {
      const clean = normalizeEmail(email);
      if (!clean) throw new AuthError('invalid_email', 400, 'Invalid email address');
      await call('/otp', { email: clean, create_user: true });
      return clean;
    },

    async verifyEmailCode(email: string, code: string): Promise<AuthSession> {
      const clean = normalizeEmail(email);
      const token = normalizeOtp(code);
      if (!clean) throw new AuthError('invalid_email', 400, 'Invalid email address');
      if (!token) throw new AuthError('invalid_code', 400, 'Invalid code');
      const body = (await call('/verify', { type: 'email', email: clean, token })) as TokenResponse;
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
