import { toAsciiDigits } from './normalise';

/** `KG`, 17 → `KG-017`. Serials grow past 999 without breaking (`KG-1000`). */
export function formatApplicationId(classCode: string, serial: number): string {
  return `${classCode}-${String(serial).padStart(3, '0')}`;
}

/**
 * An application ID as a guardian might type it (`kg 17`, `KG-০১৭`, `kg017`) in canonical form, or
 * null. Matched against the cycle's class codes, longest first: codes may end in a digit (`C1`), so
 * `C1017` alone could not be split without them.
 */
export function parseApplicationId(input: string, classCodes: readonly string[]): string | null {
  const compact = toAsciiDigits(input).trim().toUpperCase().replace(/[\s_–—-]+/g, '');
  const codes = [...classCodes].sort((a, b) => b.length - a.length);
  for (const code of codes) {
    if (!compact.startsWith(code)) continue;
    const digits = compact.slice(code.length);
    if (/^\d{1,5}$/.test(digits) && Number(digits) > 0) return formatApplicationId(code, Number(digits));
  }
  return null;
}
