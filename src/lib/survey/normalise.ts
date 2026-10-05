const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';

export function toAsciiDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BENGALI_DIGITS.indexOf(d)));
}

export function toBengaliDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]);
}

// Invisible format characters (e.g. U+200C, which the ERP puts before every phone number).
const FORMAT_CHARS = /\p{Cf}/gu;

/** Student ID as typed: Bengali digits converted, spaces, dashes and invisible characters stripped. */
export function normaliseStudentId(input: string): string {
  return toAsciiDigits(input).replace(FORMAT_CHARS, '').replace(/[\s-]/g, '');
}

/** A teacher's ERP ID as typed: same rules as a student ID. */
export const normaliseTeacherId = normaliseStudentId;

/**
 * Mobile in canonical form (country code + number, digits only), or null when invalid.
 * Bangladeshi: `01…`, `8801…` or `+8801…` → `8801XXXXXXXXX`. Foreign (some guardians live abroad):
 * only when written with a country code, `+49…` or `0049…` → `49…`. Bengali digits, spaces,
 * dashes and brackets are accepted.
 */
export function normaliseMobile(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = toAsciiDigits(input).replace(FORMAT_CHARS, '').replace(/[\s\-()]/g, '');
  const international = /^(\+|00)/.test(raw);
  const digits = raw.replace(/^(\+|00)/, '');
  if (/^01[3-9]\d{8}$/.test(digits)) return `88${digits}`;
  if (/^8801[3-9]\d{8}$/.test(digits)) return digits;
  // E.164: at most 15 digits. A Bangladeshi number that failed the checks above stays invalid.
  if (international && !digits.startsWith('880') && /^[1-9]\d{7,14}$/.test(digits)) return digits;
  return null;
}

/** Display form of an imported English name: `ADRUP HOSSAIN MAHAJ` → `Adrup Hossain Mahaj`. */
export function titleCase(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s\-.'(])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase());
}
