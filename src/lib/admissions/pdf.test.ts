// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { pdfFileName } from './pdf';

describe('pdfFileName', () => {
  it('names the file by the ID and the payment time in Dhaka', () => {
    expect(pdfFileName({ publicRef: 'N-001', paidAt: new Date('2026-10-09T06:54:30Z') })).toBe('mqd_pre_admission_application_N-001_2026-10-09_12-54.pdf');
    // Past midnight in Dhaka is the next day.
    expect(pdfFileName({ publicRef: 'KG-017', paidAt: new Date('2026-10-09T19:05:00Z') })).toBe('mqd_pre_admission_application_KG-017_2026-10-10_01-05.pdf');
  });
});
