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
 * Bangladeshi mobile in canonical form `8801XXXXXXXXX`, or null when invalid.
 * Accepts `01…`, `8801…` and `+8801…`, with Bengali digits, spaces, dashes or brackets.
 */
export function normaliseMobile(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = toAsciiDigits(input).replace(FORMAT_CHARS, '').replace(/[\s\-()]/g, '').replace(/^\+/, '');
  if (/^01[3-9]\d{8}$/.test(digits)) return `88${digits}`;
  if (/^8801[3-9]\d{8}$/.test(digits)) return digits;
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
