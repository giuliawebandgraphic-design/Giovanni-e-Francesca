import { createHmac, timingSafeEqual } from 'node:crypto';

export const DASHBOARD_SESSION_COOKIE = 'wedding_dashboard_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

type DashboardSession = { expiresAt: number };

function configuredPassword(): string {
  return process.env.DASHBOARD_PASSWORD?.trim() || '';
}

function signature(value: string): string {
  return createHmac('sha256', configuredPassword()).update(value).digest('base64url');
}

function readCookie(cookieHeader: string | undefined): string | undefined {
  return cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DASHBOARD_SESSION_COOKIE}=`))
    ?.slice(DASHBOARD_SESSION_COOKIE.length + 1);
}

export function isDashboardProtectionConfigured(): boolean {
  return Boolean(configuredPassword());
}

export function isDashboardPasswordValid(password: unknown): boolean {
  const expected = Buffer.from(configuredPassword());
  const provided = Buffer.from(typeof password === 'string' ? password : '');
  return expected.length > 0 && expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function dashboardSessionCookie(): string {
  const payload: DashboardSession = { expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 };
  const value = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${DASHBOARD_SESSION_COOKIE}=${value}.${signature(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function expiredDashboardSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${DASHBOARD_SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
}

export function hasDashboardSession(cookieHeader: string | undefined): boolean {
  if (!isDashboardProtectionConfigured()) return true;
  const token = readCookie(cookieHeader);
  if (!token) return false;
  const [value, providedSignature] = token.split('.');
  if (!value || !providedSignature) return false;
  const expected = Buffer.from(signature(value));
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return false;
  try {
    const session = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as DashboardSession;
    return Number.isFinite(session.expiresAt) && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}
