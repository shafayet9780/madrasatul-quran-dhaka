import type { FormField } from './form-config';

// Upload rules for guardian documents. Pure: the upload route and the browser share them.

export type SniffedType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

/** The real type from the first bytes (never the browser-declared type or the file name). */
export function sniffFileType(bytes: Uint8Array): SniffedType | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'image/webp';
  if (b.length >= 5 && String.fromCharCode(...b.slice(0, 5)) === '%PDF-') return 'application/pdf';
  return null;
}

/** Photos are resized in the browser to well under this; documents may be scanned PDFs. */
export const MAX_BYTES = { photo: 1024 * 1024, document: 4 * 1024 * 1024 } as const;

const ALLOWED: Record<'photo' | 'document', readonly SniffedType[]> = {
  photo: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

export const EXTENSION: Record<SniffedType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export type UploadCheck = { ok: true; type: SniffedType } | { ok: false; error: 'not_a_file_field' | 'too_large' | 'wrong_type' | 'empty' };

export function checkUpload(field: FormField | undefined, bytes: Uint8Array): UploadCheck {
  if (!field || field.type !== 'file') return { ok: false, error: 'not_a_file_field' };
  if (bytes.length === 0) return { ok: false, error: 'empty' };
  const kind = field.fileKind ?? 'document';
  if (bytes.length > MAX_BYTES[kind]) return { ok: false, error: 'too_large' };
  const type = sniffFileType(bytes);
  if (!type || !ALLOWED[kind].includes(type)) return { ok: false, error: 'wrong_type' };
  return { ok: true, type };
}

/** Private store path: everything for an application sits under its own folder. */
export function documentPath(applicationId: string, fieldKey: string, type: SniffedType, random: string): string {
  return `admissions/${applicationId}/${fieldKey}-${random}.${EXTENSION[type]}`;
}
