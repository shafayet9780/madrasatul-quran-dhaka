import { FormConfigError, buildSnapshot, cycleWindow, type FormDocument } from './snapshot';
import { sampleSnapshot } from './testing/fixtures';

function sanityDoc(): FormDocument {
  const s = sampleSnapshot();
  return {
    _rev: 'rev-1',
    declarationText: s.settings.declaration,
    cycle: { session: '2027', applicationFee: 500, evaluationFee: 500, closesAt: '2026-11-30T18:00:00Z', whatsappUrl: 'https://chat.whatsapp.com/x' },
    sections: s.sections.map((sec, i) => ({
      _key: `s${i}`,
      _type: 'admissionSection',
      ...sec,
      fields: sec.fields.map((f, j) => ({ _key: `f${j}`, _type: 'admissionField', ...f, placeholder: { bengali: '' } })),
    })) as FormDocument['sections'],
  };
}

describe('buildSnapshot', () => {
  it('strips Sanity keys and empty values', () => {
    const snap = buildSnapshot(sanityDoc(), new Date('2026-10-07T00:00:00Z'));
    expect(snap.takenAt).toBe('2026-10-07T00:00:00.000Z');
    expect(snap.sourceRev).toBe('rev-1');
    expect(snap.sections[0].fields[0]).not.toHaveProperty('_key');
    expect(snap.sections[0].fields[0].placeholder).toEqual({});
    expect(snap.settings.applicationFee).toBe(500);
  });

  it('refuses an incomplete form or cycle', () => {
    const doc = sanityDoc();
    doc.cycle = { session: '2027' };
    doc.sections![0].fields = doc.sections![0].fields!.filter((f) => f.role !== 'studentPhoto');
    try {
      buildSnapshot(doc);
      throw new Error('expected a FormConfigError');
    } catch (e) {
      expect(e).toBeInstanceOf(FormConfigError);
      expect((e as FormConfigError).problems).toEqual(
        expect.arrayContaining(['Assign the role “Student photo” to a field.', 'Cycle settings: add the application fee.', 'Cycle settings: add the evaluation fee.']),
      );
    }
  });
});

describe('cycleWindow', () => {
  const settings = sampleSnapshot().settings;
  it('follows the opening and closing times', () => {
    expect(cycleWindow(settings, new Date('2026-10-01T00:00:00Z'))).toBe('not_open');
    expect(cycleWindow(settings, new Date('2026-10-20T00:00:00Z'))).toBe('open');
    expect(cycleWindow(settings, new Date('2026-12-01T00:00:00Z'))).toBe('closed');
    expect(cycleWindow({ ...settings, opensAt: undefined, closesAt: undefined })).toBe('open');
  });
});
