import { getCurrentCycle } from '../cycle';
import { createDraft, getByToken, saveDraft, submitDraft } from '../drafts';
import type { FormField } from '../form-config';
import { closePayment, confirmPayment, latestPayment, startPayment } from '../payments';
import type { BlobStore } from '../uploads';
import type { MockGateway } from './mock-gateway';

// Local preview only (POST /api/admissions/dev/seed): sample applications made through the real
// draft, submit and payment code, so the admin pages have something to show. Answers are filled
// from the form itself, so this keeps working when the form changes.

const NAMES: [string, string][] = [
  ['আব্দুল্লাহ আল-মাহমুদ', 'Abdullah Al-Mahmud'],
  ['মারইয়াম বিনতে হাসান', 'Maryam Binte Hasan'],
  ['উমর ফারুক', 'Umar Faruk'],
  ['আয়েশা সিদ্দিকা', 'Ayesha Siddika'],
  ['ইউসুফ আহমাদ', 'Yusuf Ahmad'],
  ['খাদিজা আক্তার', 'Khadija Akter'],
  ['সাদ বিন মুয়ায', 'Saad Bin Muaz'],
  ['নুসাইবা জান্নাত', 'Nusaiba Jannat'],
  ['আনাস মালিক', 'Anas Malik'],
  ['হামযা ইবনে কাসিম', 'Hamza Ibne Kasim'],
];

// A 1×1 JPEG, enough for the photo and document previews.
const JPEG = Uint8Array.from(Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64'));

function answerFor(f: FormField, i: number, appId: string): unknown {
  const [bn, en] = NAMES[i % NAMES.length];
  switch (f.role) {
    case 'studentNameBn':
      return bn;
    case 'studentNameEn':
      return en;
    case 'dateOfBirth':
      return `20${19 + (i % 4)}-0${1 + (i % 9)}-1${i % 10}`;
    case 'primaryMobile':
    case 'email':
      return undefined; // Given on the start page.
  }
  const choose = (n: number) => f.options[n % Math.max(1, f.options.length)]?.value;
  switch (f.type) {
    case 'file':
      return { key: `admissions/${appId}/${f.key}-sample`, name: `${f.key}.jpg`, size: 120_000 + i * 1000, type: 'image/jpeg' };
    case 'select':
    case 'radio':
      return choose(f.role === 'classApplied' ? i : 0);
    case 'checkbox':
      return f.options.length ? [f.options[0].value] : [];
    case 'yesno':
      return i % 3 ? 'no' : 'yes';
    case 'date':
      return '1990-05-20';
    case 'tel':
      return `0181${String(1000000 + i).slice(-7)}`;
    case 'email':
      return `guardian${i}@example.com`;
    case 'number':
      return 2;
    default:
      return f.role === 'fatherName' ? 'মোহাম্মদ রফিকুল ইসলাম' : f.role === 'motherName' ? 'সাবিনা ইয়াসমিন' : f.role === 'address' ? 'বাসা ১২, রোড ৫, মিরপুর ১০, ঢাকা' : 'নেই';
  }
}

export async function seedSampleApplications(opts: { paid: number; unpaid: number; drafts: number; origin: string; gateway: MockGateway; store: BlobStore }) {
  const cycle = await getCurrentCycle();
  if (!cycle) throw new Error('No open cycle');
  const made = { paid: 0, unpaid: 0, drafts: 0 };
  const total = opts.paid + opts.unpaid + opts.drafts;
  for (let i = 0; i < total; i++) {
    const kind = i < opts.paid ? 'paid' : i < opts.paid + opts.unpaid ? 'unpaid' : 'drafts';
    const started = await createDraft(cycle, { mobile: `0171${String(2000000 + i).slice(-7)}`, email: `guardian${i}@example.com`, locale: i % 4 === 3 ? 'english' : 'bengali' });
    if (!started.ok) throw new Error(`Start failed: ${started.reason}`);
    let app = (await getByToken(started.token))!;
    const fields = cycle.snapshot.sections.flatMap((s) => s.fields);
    const answers: Record<string, unknown> = {};
    for (const f of kind === 'drafts' ? fields.slice(0, 6) : fields) {
      const v = answerFor(f, i, app.id);
      if (v === undefined) continue;
      answers[f.key] = v;
      if (f.type === 'file') await opts.store.put((v as { key: string }).key, JPEG, 'image/jpeg', { overwrite: true });
    }
    await saveDraft(app, cycle.snapshot, answers);
    if (kind !== 'drafts') {
      app = (await getByToken(started.token))!;
      const submitted = await submitDraft(app, cycle.snapshot, true);
      if (!submitted.ok) throw new Error(`Submit failed: ${JSON.stringify(submitted)}`);
    }
    if (kind === 'paid') {
      app = (await getByToken(started.token))!;
      await startPayment(app, cycle.snapshot, opts.origin, opts.gateway);
      const p = (await latestPayment(app.id))!;
      await confirmPayment(p.tranId, opts.gateway.complete(p.tranId, 'pay')!, 'ipn', opts.gateway);
    } else if (kind === 'unpaid' && i % 2) {
      app = (await getByToken(started.token))!;
      await startPayment(app, cycle.snapshot, opts.origin, opts.gateway);
      const p = (await latestPayment(app.id))!;
      opts.gateway.complete(p.tranId, 'fail');
      await closePayment(p.tranId, 'failed', opts.gateway);
    }
    made[kind]++;
  }
  return made;
}
