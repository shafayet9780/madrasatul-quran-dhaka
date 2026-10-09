// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSchema, validateDocument, type SanityDocument, type Workspace } from 'sanity';
import { createClient } from '@sanity/client';
import { admissionFormTypes } from '../../../sanity/schemas/admissionForm';
import { preAdmissionForm } from '../../../sanity/schemas/preAdmissionForm';
import { sampleSnapshot } from './testing/fixtures';

const schema = createSchema({ name: 'admissions-test', types: [preAdmissionForm, ...admissionFormTypes] });

/** Sanity array members carry _key/_type; the fixture is the snapshot shape. */
function toSanity(snapshot = sampleSnapshot()) {
  let n = 0;
  const k = () => `k${n++}`;
  return {
    _id: 'preAdmissionForm',
    _type: 'preAdmissionForm',
    declarationText: { bengali: 'ঘোষণা', english: 'Declaration' },
    cycle: { session: '2027', applicationFee: 500, evaluationFee: 500, opensAt: '2026-10-10T00:00:00Z', closesAt: '2026-11-30T18:00:00Z' },
    sections: snapshot.sections.map((s) => ({
      _key: k(),
      _type: 'admissionSection',
      ...s,
      groups: s.groups.map((g) => ({ _key: k(), _type: 'admissionGroup', ...g })),
      fields: s.fields.map((f) => ({
        _key: k(),
        _type: 'admissionField',
        ...f,
        options: f.options.map((o) => ({ _key: k(), _type: 'admissionOption', ...o })),
      })),
    })),
  };
}

const validate = (document: ReturnType<typeof toSanity>) =>
  validateDocument({
    document: document as unknown as SanityDocument,
    workspace: { schema } as Workspace,
    getClient: () => createClient({ projectId: 'admissions-test', dataset: 'test', apiVersion: '2026-09-30', useCdn: false }),
    getDocumentExists: async () => false,
  });

const errorsUnder = (markers: Awaited<ReturnType<typeof validate>>, root: string) =>
  markers.filter((m) => m.level === 'error' && m.path[0] === root).map((m) => m.message);

describe('preAdmissionForm 2027 fields', () => {
  it('accepts the sample form and cycle', async () => {
    const markers = await validate(toSanity());
    expect(errorsUnder(markers, 'sections')).toEqual([]);
    expect(errorsUnder(markers, 'cycle')).toEqual([]);
  });

  it('blocks publishing when a required role is missing', async () => {
    const doc = toSanity();
    doc.sections[2].fields = doc.sections[2].fields.filter((f) => f.role !== 'email');
    const errors = errorsUnder(await validate(doc), 'sections');
    expect(errors.join('\n')).toContain('Assign the role “Guardian email (asked on the start page)” to a field.');
  });

  it('rejects a deadline before the opening time', async () => {
    const doc = toSanity();
    doc.cycle.closesAt = '2026-10-01T00:00:00Z';
    expect(errorsUnder(await validate(doc), 'cycle').join('\n')).toContain('The deadline must be after the opening time.');
  });
});
