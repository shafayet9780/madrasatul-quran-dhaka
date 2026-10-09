import { describe, expect, it } from 'vitest';
import { MAX_BYTES, checkUpload, isOwnKey, sniffFileType } from './files';
import { fieldWithRole } from './form-config';
import { sampleSnapshot } from './testing/fixtures';

const bytes = (...b: number[]) => new Uint8Array(b);
const text = (s: string) => new TextEncoder().encode(s);

describe('sniffFileType', () => {
  it('recognises the allowed formats by their first bytes', () => {
    expect(sniffFileType(bytes(0xff, 0xd8, 0xff, 0xdb))).toBe('image/jpeg');
    expect(sniffFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png');
    expect(sniffFileType(text('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '))).toBe('image/webp');
    expect(sniffFileType(text('%PDF-1.4'))).toBe('application/pdf');
  });

  it('rejects anything else, whatever its name claims', () => {
    expect(sniffFileType(text('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(sniffFileType(text('GIF89a'))).toBeNull();
    expect(sniffFileType(bytes())).toBeNull();
  });
});

describe('checkUpload', () => {
  const snap = sampleSnapshot();
  const photo = fieldWithRole(snap, 'studentPhoto');
  const certificate = fieldWithRole(snap, 'birthCertificate');

  it('applies the per-kind type and size limits', () => {
    expect(checkUpload(photo, text('%PDF-1.4'))).toEqual({ ok: false, error: 'wrong_type' });
    expect(checkUpload(certificate, text('%PDF-1.4'))).toEqual({ ok: true, type: 'application/pdf' });
    const big = new Uint8Array(MAX_BYTES.photo + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect(checkUpload(photo, big)).toEqual({ ok: false, error: 'too_large' });
    expect(checkUpload(photo, bytes())).toEqual({ ok: false, error: 'empty' });
    expect(checkUpload(fieldWithRole(snap, 'fatherName'), bytes(0xff, 0xd8, 0xff))).toEqual({ ok: false, error: 'not_a_file_field' });
  });
});

describe('isOwnKey', () => {
  const id = '0b5e4a3c-1d2f-4e5a-9b8c-7d6e5f4a3b2c';
  it('accepts one file name in the application folder', () => {
    expect(isOwnKey(id, `admissions/${id}/student_photo-Ab_9-x.jpg`)).toBe(true);
    expect(isOwnKey(id, `admissions/${id}/application-KG-001.pdf`)).toBe(true);
  });
  it('refuses other folders and path tricks', () => {
    expect(isOwnKey(id, `admissions/other/student_photo-x.jpg`)).toBe(false);
    expect(isOwnKey(id, `admissions/${id}/../other/student_photo-x.jpg`)).toBe(false);
    expect(isOwnKey(id, `admissions/${id}/a/b.jpg`)).toBe(false);
    expect(isOwnKey(id, `admissions/${id}/%2e%2e.jpg`)).toBe(false);
  });
});
