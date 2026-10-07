import { normaliseMobile, toAsciiDigits } from '@/lib/survey/normalise';

export { normaliseMobile, toAsciiDigits };
export { toBengaliDigits } from '@/lib/survey/normalise';

/** `8801712345678` → `01712-345678`; foreign numbers as `+49…`. */
export function formatMobile(canonical: string): string {
  if (/^8801\d{9}$/.test(canonical)) return `${canonical.slice(2, 7)}-${canonical.slice(7)}`;
  return `+${canonical}`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return EMAIL.test(email) ? email : null;
}

// Misspellings seen on Bangladeshi forms for the domains guardians actually use.
const DOMAIN_FIXES: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
};

/** A corrected address when the domain looks like a typo of a common one, else null. */
export function emailSuggestion(input: string): string | null {
  const email = input.trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const fix = DOMAIN_FIXES[email.slice(at + 1)];
  return fix ? `${email.slice(0, at)}@${fix}` : null;
}
