// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { syncCycle, type CycleState } from './cycle';
import { countOtherApplications, createDraft, findApplications, loadWithSnapshot, getByToken, loadById, saveDraft, submitDraft, type Application } from './drafts';
import { applicationEvents, applications } from './schema';
import type { FormDocument } from './snapshot';
import { sampleSnapshot } from './testing/fixtures';
import { startTestDb } from './testing/pg';
import { uploadDocument, type BlobStore } from './uploads';
import type { AdmissionsDb } from './db';

let db: AdmissionsDb;
let stop: () => Promise<void>;

function formDoc(rev: string, patch: Partial<FormDocument> = {}): FormDocument {
  const s = sampleSnapshot();
  return {
    _rev: rev,
    formSettings: { isEnabled: true },
    declarationText: s.settings.declaration,
    cycle: { session: '2027', applicationFee: 500, evaluationFee: 500, closesAt: '2099-01-01T00:00:00Z' },
    sections: structuredClone(s.sections),
    ...patch,
  };
}

beforeAll(async () => {
  ({ db, stop } = await startTestDb());
});
afterAll(async () => stop());
beforeEach(async () => {
  await db.execute(sql`TRUNCATE admission_cycles, applications, application_events, payments RESTART IDENTITY CASCADE`);
});

describe('syncCycle', () => {
  it('versions the form when the published revision changes and keeps the last good one', async () => {
    const v1 = (await syncCycle(formDoc('r1')))!;
    expect(v1.version).toBe(1);
    expect((await syncCycle(formDoc('r1')))!.version).toBe(1);

    const changed = formDoc('r2');
    changed.cycle!.applicationFee = 600;
    const v2 = (await syncCycle(changed))!;
    expect(v2.version).toBe(2);
    expect(v2.snapshot.settings.applicationFee).toBe(600);
    expect(v2.cycleId).toBe(v1.cycleId);

    const broken = formDoc('r3');
    broken.sections![0].fields = broken.sections![0].fields!.filter((f) => f.role !== 'studentPhoto');
    const still = (await syncCycle(broken))!;
    expect(still.version).toBe(2);
    expect(still.problems).toContain('Assign the role “Student photo” to a field.');
  });

  it('reports the switch and the window', async () => {
    expect((await syncCycle(formDoc('r1', { formSettings: { isEnabled: false } })))!.enabled).toBe(false);
    const late = formDoc('r2');
    late.cycle!.closesAt = '2020-01-01T00:00:00Z';
    expect((await syncCycle(late))!.window).toBe('closed');
  });
});

describe('drafts', () => {
  let cycle: CycleState;
  beforeEach(async () => {
    cycle = (await syncCycle(formDoc('r1')))!;
  });

  async function start(mobile = '০১৭১২-৩৪৫৬৭৮'): Promise<{ app: Application; token: string }> {
    const result = await createDraft(cycle, { mobile, email: ' Rafiq@Gmail.com', locale: 'bengali' });
    if (!result.ok) throw new Error('start failed');
    return { app: (await getByToken(result.token))!, token: result.token };
  }

  it('starts only while open and with a valid mobile and email', async () => {
    expect(await createDraft({ ...cycle, enabled: false }, { mobile: '01712345678', email: 'a@b.co', locale: 'bengali' })).toEqual({ ok: false, reason: 'closed' });
    expect(await createDraft(cycle, { mobile: '123', email: 'nope', locale: 'bengali' })).toEqual({
      ok: false,
      reason: 'invalid',
      errors: { mobile: 'invalid_mobile', email: 'invalid_email' },
    });
    const { app } = await start();
    expect(app.primaryMobile).toBe('8801712345678');
    expect(app.email).toBe('rafiq@gmail.com');
    expect(app.answers).toEqual({ father_mobile: '8801712345678', email: 'rafiq@gmail.com' });
    expect(app.resumeTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(await getByToken('x'.repeat(43))).toBeNull();
    const events = await db.select().from(applicationEvents).where(eq(applicationEvents.applicationId, app.id));
    expect(events.map((e) => e.kind)).toEqual(['created']);
  });

  it('merges concurrent autosaves, clears emptied fields and refreshes role columns', async () => {
    const { app } = await start();
    await Promise.all([
      saveDraft(app, cycle.snapshot, { student_name_bn: 'আব্দুল্লাহ', unknown_key: 'x' }),
      saveDraft(app, cycle.snapshot, { date_of_birth: '2021-03-12', class_applied: 'kg' }),
    ]);
    const cleared = await saveDraft(app, cycle.snapshot, { class_applied: '', student_photo: { key: 'admissions/someone-else/p.jpg', name: 'p.jpg', size: 1, type: 'image/jpeg' } });
    expect(cleared.ok && cleared.answers).toEqual({ father_mobile: '8801712345678', email: 'rafiq@gmail.com', student_name_bn: 'আব্দুল্লাহ', date_of_birth: '2021-03-12' });
    const [row] = await db.select().from(applications).where(eq(applications.id, app.id));
    expect(row.studentNameBn).toBe('আব্দুল্লাহ');
    expect(row.dateOfBirth).toBe('2021-03-12');
    expect(row.classValue).toBeNull();
  });

  it('submits a complete form, and editing afterwards reopens it', async () => {
    const { app, token } = await start();
    const photo = { key: `admissions/${app.id}/student_photo-a.jpg`, name: 'p.jpg', size: 10, type: 'image/jpeg' };
    await saveDraft(app, cycle.snapshot, {
      student_photo: photo,
      student_name_bn: 'আব্দুল্লাহ আল-মাহমুদ',
      student_name_en: 'Abdullah Al-Mahmud',
      date_of_birth: '2021-03-12',
      class_applied: 'kg',
      birth_certificate: { ...photo, key: `admissions/${app.id}/birth_certificate-b.pdf`, type: 'application/pdf' },
      father_name: 'মোহাম্মদ রফিকুল ইসলাম',
      father_occupation: 'other',
      father_organization: 'should be dropped',
      father_prayer_location: ['mosque'],
      father_smoking: 'no',
      address: 'মিরপুর ১০',
    });

    let current = (await getByToken(token))!;
    expect(await submitDraft(current, cycle.snapshot, false)).toEqual({ ok: false, reason: 'declaration' });
    expect(await submitDraft(current, cycle.snapshot, true)).toEqual({ ok: false, reason: 'invalid', errors: { father_facebook: 'required' } });

    await saveDraft(current, cycle.snapshot, { father_facebook: 'নেই' });
    current = (await getByToken(token))!;
    expect(await submitDraft(current, cycle.snapshot, true)).toEqual({ ok: true, classCode: 'KG' });
    current = (await getByToken(token))!;
    expect(current.status).toBe('unpaid');
    expect(current.classCode).toBe('KG');
    expect(current.declaredAt).not.toBeNull();
    expect(current.answers.father_organization).toBeUndefined();

    await saveDraft(current, cycle.snapshot, { address: 'উত্তরা' });
    current = (await getByToken(token))!;
    expect(current.status).toBe('draft');
    expect(current.declaredAt).toBeNull();
  });

  it('refuses changes once paid', async () => {
    const { app, token } = await start();
    await db.update(applications).set({ status: 'paid', publicRef: 'KG-001' }).where(eq(applications.id, app.id));
    const paid = (await getByToken(token))!;
    expect(await saveDraft(paid, cycle.snapshot, { address: 'x' })).toEqual({ ok: false, reason: 'locked' });
    expect(await submitDraft(paid, cycle.snapshot, true)).toEqual({ ok: false, reason: 'locked' });
  });

  it('a draft follows form changes when opened; a submitted application keeps its version', async () => {
    const draft = await start();
    const submitted = await start('01812345678');
    const file = (id: string, k: string) => ({ key: `admissions/${id}/${k}-x`, name: k, size: 1, type: 'image/jpeg' });
    await saveDraft(submitted.app, cycle.snapshot, {
      student_photo: file(submitted.app.id, 'p'),
      student_name_bn: 'উমর',
      student_name_en: 'Umar',
      date_of_birth: '2021-03-12',
      class_applied: 'kg',
      birth_certificate: file(submitted.app.id, 'b'),
      father_name: 'রফিক',
      father_occupation: 'other',
      father_prayer_location: ['mosque'],
      father_smoking: 'no',
      father_facebook: 'নেই',
      address: 'মিরপুর',
    });
    expect((await submitDraft((await getByToken(submitted.token))!, cycle.snapshot, true)).ok).toBe(true);
    await saveDraft(draft.app, cycle.snapshot, { student_name_bn: 'আব্দুল্লাহ' });

    const changed = formDoc('r2');
    changed.sections![0].groups = [{ key: 'names', title: { bengali: 'পরিচয়', english: 'Identity' } }] as never;
    expect((await syncCycle(changed))!.version).toBe(2);

    const opened = (await loadWithSnapshot(draft.token))!;
    expect(opened.app.snapshotVersion).toBe(2);
    expect(opened.snapshot.sections[0].groups[0].title.bengali).toBe('পরিচয়');
    expect(opened.app.answers.student_name_bn).toBe('আব্দুল্লাহ');
    expect(opened.app.studentNameBn).toBe('আব্দুল্লাহ');
    expect((await loadWithSnapshot(submitted.token))!.app.snapshotVersion).toBe(1);
  });

  it('counts other applications from the same mobile, whatever the date of birth', async () => {
    const a = await start();
    await start('01712345678');
    await start('01812345678');
    const first = (await getByToken(a.token))!;
    expect(await countOtherApplications(first)).toBe(1);
  });
});

describe('uploadDocument', () => {
  const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  const PDF = new TextEncoder().encode('%PDF-1.7 test');

  function memoryStore() {
    const files = new Map<string, Uint8Array>();
    const store: BlobStore = {
      put: async (p, body) => void files.set(p, body),
      del: async (p) => void files.delete(p),
      get: async () => null,
    };
    return { files, store };
  }

  it('stores documents privately per application and replaces the previous file', async () => {
    const cycle = (await syncCycle(formDoc('r1')))!;
    const started = await createDraft(cycle, { mobile: '01712345678', email: 'a@b.co', locale: 'english' });
    if (!started.ok) throw new Error('start failed');
    const { files, store } = memoryStore();

    let app = (await getByToken(started.token))!;
    expect(await uploadDocument(app, cycle.snapshot, 'student_photo', PDF, 'cert.pdf', store)).toEqual({ ok: false, error: 'wrong_type' });
    expect(await uploadDocument(app, cycle.snapshot, 'father_name', JPEG, 'x.jpg', store)).toEqual({ ok: false, error: 'not_a_file_field' });

    const first = await uploadDocument(app, cycle.snapshot, 'student_photo', JPEG, 'photo.jpg', store);
    expect(first.ok).toBe(true);
    const firstKey = first.ok ? first.file.key : '';
    expect(firstKey).toMatch(new RegExp(`^admissions/${app.id}/student_photo-[\\w-]+\\.jpg$`));

    app = (await getByToken(started.token))!;
    const second = await uploadDocument(app, cycle.snapshot, 'student_photo', JPEG, 'photo2.jpg', store);
    expect([...files.keys()]).toEqual([second.ok ? second.file.key : '']);
    expect(files.has(firstKey)).toBe(false);

    const doc = await uploadDocument(app, cycle.snapshot, 'birth_certificate', PDF, 'cert.pdf', store);
    expect(doc.ok && doc.file.type).toBe('application/pdf');
  });
});

describe('findApplications', () => {
  it('matches the ID or the guardian mobile, and always the date of birth', async () => {
    const cycle = (await syncCycle(formDoc('r1')))!;
    const started = await createDraft(cycle, { mobile: '01712345678', email: 'a@b.co', locale: 'bengali' });
    if (!started.ok) throw new Error('start failed');
    const app = (await getByToken(started.token))!;
    await saveDraft(app, cycle.snapshot, { date_of_birth: '2021-03-12' });
    await db.update(applications).set({ status: 'paid', publicRef: 'KG-007', classCode: 'KG' }).where(eq(applications.id, app.id));

    expect((await findApplications(cycle.cycleId, { publicRef: 'KG-007' }, '2021-03-12')).map((a) => a.id)).toEqual([app.id]);
    expect((await findApplications(cycle.cycleId, { mobile: '8801712345678' }, '2021-03-12')).map((a) => a.id)).toEqual([app.id]);
    expect(await findApplications(cycle.cycleId, { mobile: '8801712345678' }, '2021-03-13')).toEqual([]);
    expect(await findApplications(cycle.cycleId, { publicRef: 'KG-008' }, '2021-03-12')).toEqual([]);
    expect((await loadById(app.id))!.app.publicRef).toBe('KG-007');
    expect(await loadById('not-a-uuid')).toBeNull();
  });
});
