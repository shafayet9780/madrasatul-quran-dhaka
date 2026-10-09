import 'server-only';
import { cookies } from 'next/headers';
import { signValue, signingKey, verifySignedValue } from './signed';

// The office's test pass (admin → ভর্তি → ওভারভিউ): the published form opens on this device only,
// even while it is switched off or outside its dates, so the live payment can be tried before
// launch. Applications started with it are tests (applications.is_test).

const TEST_PASS_COOKIE = 'mq_admission_test';
const TWELVE_HOURS = 12 * 60 * 60;

/** False when there is no signing key (ADMISSIONS_SECRET or CRON_SECRET). */
export async function giveTestPass(): Promise<boolean> {
  const key = signingKey();
  if (!key) return false;
  (await cookies()).set(TEST_PASS_COOKIE, signValue('test', key, TWELVE_HOURS), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TWELVE_HOURS,
  });
  return true;
}

export async function endTestPass() {
  (await cookies()).delete(TEST_PASS_COOKIE);
}

export async function hasTestPass(): Promise<boolean> {
  const key = signingKey();
  return !!key && verifySignedValue((await cookies()).get(TEST_PASS_COOKIE)?.value, key) === 'test';
}
