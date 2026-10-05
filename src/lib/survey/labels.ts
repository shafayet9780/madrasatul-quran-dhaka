import { toBengaliDigits } from './normalise';
import type { RoundSnapshot } from './snapshot';

/** Single-letter sections read as "শাখা A"; named ones (বালক, বালিকা) stand alone. */
export function sectionDisplay(name: string): string {
  return /^[A-Za-z]$/.test(name) ? `শাখা ${name}` : name;
}

type Key = { classKey: string; sectionKey: string; subjectKey?: string };

/** "নার্সারি · শাখা A · কুরআন" (long) or "নার্সারি A · কুরআন" (short). */
export function batchLabel(snapshot: Pick<RoundSnapshot, 'classes'>, key: Key, form: 'long' | 'short' = 'long'): string {
  const cls = snapshot.classes.find((c) => c.key === key.classKey);
  if (!cls) return key.classKey;
  const section = cls.sections.find((s) => s.key === key.sectionKey);
  const subject = key.subjectKey ? cls.subjects.find((s) => s.key === key.subjectKey)?.name : undefined;
  const place = section ? (form === 'long' ? [cls.name, sectionDisplay(section.name)] : [`${cls.name} ${section.name}`]) : [cls.name];
  return [...place, ...(subject ? [subject] : [])].join(' · ');
}

/** Short question label for tables, falling back to the full text. */
export function questionLabel(question: { text: string; shortLabel?: string }): string {
  return question.shortLabel ?? question.text;
}

export const bn = toBengaliDigits;

/** Teacher initial for the avatar, skipping honorifics. */
export function nameInitial(name: string): string {
  return name.replace(/^(মাওলানা|মাওঃ|উস্তাদ|উস্তাযা|উস্তাজা|হাফেজ|হাফেয|মুফতি|ড\.|মো\.|মোঃ|মোহাম্মদ)\s*/, '').charAt(0);
}

/** Short reference shown on receipts and in the Sheet copy ("৭২৪১ ৯৩৫৮"), derived from the submission id. */
export function referenceNumber(submissionId: string, bengali = true): string {
  const n = parseInt(submissionId.replace(/-/g, '').slice(0, 12), 16) % 100000000;
  const digits = String(n).padStart(8, '0');
  const text = `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return bengali ? toBengaliDigits(text) : text;
}
