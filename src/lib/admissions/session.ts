import 'server-only';
import { cookies, headers } from 'next/headers';
import { getAdmissionsDb } from './db';
import { loadWithSnapshot } from './drafts';
import { cleanToken } from './tokens';
import { allow } from '@/lib/survey/rate-limit';

// The guardian's draft is identified by a random resume token: in an httpOnly cookie on this
// device, and in the resume link (emailed, copyable from the hub) for other devices.

export const SESSION_COOKIE = 'mq_admission';
const SIXTY_DAYS = 60 * 24 * 60 * 60;

export async function setSessionToken(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
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

/** The application on this device with the form version it was answered against. */
export async function currentApplication() {
  const token = await sessionToken();
  return token ? loadWithSnapshot(token) : null;
}

const MINUTE = 60 * 1000;

/** Per-IP budgets. Guardians share carrier IPs, so these only stop scripted abuse. */
export const ADMISSION_LIMITS = {
  start: { limit: 30, windowMs: 10 * MINUTE },
  save: { limit: 1500, windowMs: 10 * MINUTE },
  upload: { limit: 200, windowMs: 10 * MINUTE },
  submit: { limit: 60, windowMs: 10 * MINUTE },
} as const;

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export async function withinLimit(kind: keyof typeof ADMISSION_LIMITS): Promise<boolean> {
  const { limit, windowMs } = ADMISSION_LIMITS[kind];
  return allow(`admissions:${kind}:${await clientIp()}`, limit, windowMs, new Date(), getAdmissionsDb());
}

/** Absolute link that reopens this application on another device. */
export async function resumeUrl(locale: string, token: string): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}/${locale}/pre-admission/resume?t=${token}`;
}
