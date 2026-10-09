import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { getAdmissionsDb } from './db';
import { loadById, loadWithSnapshot } from './drafts';
import { signValue, signingKey, verifySignedValue } from './signed';
import { cleanToken } from './tokens';
import { allow } from '@/lib/survey/rate-limit';

// The guardian's draft is identified by a random resume token: in an httpOnly cookie on this
// device, and in the resume link (emailed, copyable from the hub) for other devices. "Find my
// application" gives a device a signed, 7-day grant to one application instead.

export const SESSION_COOKIE = 'mq_admission';
const SIXTY_DAYS = 60 * 24 * 60 * 60;

/** This device now works on the application of this token (a Find grant for another one ends). */
export async function setSessionToken(token: string) {
  const jar = await cookies();
  jar.delete(GRANT_COOKIE);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SIXTY_DAYS,
  });
}

export async function sessionToken(): Promise<string | null> {
  return cleanToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export const GRANT_COOKIE = 'mq_admission_grant';
const FOUND_COOKIE = 'mq_admission_found';
const cookieOptions = (maxAge: number) => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge });

/** Find my application: this device may open these applications for 15 minutes. */
export async function rememberFound(ids: string[]) {
  const key = signingKey();
  if (key) (await cookies()).set(FOUND_COOKIE, signValue(ids.join(','), key, 15 * 60), cookieOptions(15 * 60));
}

export async function foundIds(): Promise<string[]> {
  const key = signingKey();
  return key ? (verifySignedValue((await cookies()).get(FOUND_COOKIE)?.value, key)?.split(',').filter(Boolean) ?? []) : [];
}

/** Opens a found application on this device (7 days); it takes precedence over the resume cookie. */
export async function grantApplication(id: string): Promise<boolean> {
  const key = signingKey();
  if (!key) return false;
  (await cookies()).set(GRANT_COOKIE, signValue(id, key, 7 * 24 * 60 * 60), cookieOptions(7 * 24 * 60 * 60));
  return true;
}

async function grantedId(): Promise<string | null> {
  const key = signingKey();
  return key ? verifySignedValue((await cookies()).get(GRANT_COOKIE)?.value, key) : null;
}

/**
 * The application on this device with the form version it was answered against (once per
 * request), and the resume token when the device has one (not for a grant from Find).
 */
export const currentAccess = cache(async () => {
  const granted = await grantedId();
  if (granted) {
    const found = await loadById(granted);
    if (found) return { ...found, token: null as string | null };
  }
  const token = await sessionToken();
  const loaded = token ? await loadWithSnapshot(token) : null;
  return loaded ? { ...loaded, token } : null;
});

export const currentApplication = cache(async () => {
  const access = await currentAccess();
  return access ? { app: access.app, snapshot: access.snapshot } : null;
});

const MINUTE = 60 * 1000;

/** Per-IP budgets. Guardians share carrier IPs, so these only stop scripted abuse. */
export const ADMISSION_LIMITS = {
  start: { limit: 30, windowMs: 10 * MINUTE },
  save: { limit: 1500, windowMs: 10 * MINUTE },
  upload: { limit: 200, windowMs: 10 * MINUTE },
  submit: { limit: 60, windowMs: 10 * MINUTE },
  find: { limit: 30, windowMs: 10 * MINUTE },
  /** Per looked-up ID or mobile number, whatever the IP: stops guessing dates of birth. */
  findValue: { limit: 8, windowMs: 10 * MINUTE },
  findValueDay: { limit: 15, windowMs: 24 * 60 * MINUTE },
} as const;

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export async function withinLimit(kind: keyof typeof ADMISSION_LIMITS, value?: string): Promise<boolean> {
  const { limit, windowMs } = ADMISSION_LIMITS[kind];
  return allow(`admissions:${kind}:${value ?? (await clientIp())}`, limit, windowMs, new Date(), getAdmissionsDb());
}

/** This site's origin as the guardian reached it (payment callbacks, resume links). */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto')?.split(',')[0].trim() || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** Absolute link that reopens this application on another device. */
export async function resumeUrl(locale: string, token: string): Promise<string> {
  return `${await siteOrigin()}/${locale}/pre-admission/resume?t=${token}`;
}
