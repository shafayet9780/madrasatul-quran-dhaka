import { describe, expect, it } from 'vitest';
import { checkField, checkSection, isVisible, sanitizeDraft, toggleChoice } from './answers';
import { FILE_MISSING, NO_ROUTE, allFields, checkBringList, checkFormConfig, type RawSection } from './form-config';
import { FormConfigError, buildSnapshot, type FormDocument } from './snapshot';
import published from './testing/published-form.json';
import { liveFeeDocument, liveFormDocument } from './testing/live-form';
import { applyFeeUpdates, applyFormUpdates } from './updates-2027';

// The form as published in Sanity on 2026-10-09 (what scripts/setup-admissions-updates.ts edits).
const { changed, ...updates } = applyFormUpdates(published);
const doc = { ...published, ...updates, fees: liveFeeDocument() } as FormDocument;
const snap = buildSnapshot(doc, new Date('2026-10-20T00:00:00Z'));
const field = (key: string) => allFields(snap).find((f) => f.key === key)!;
const section = (key: string) => snap.sections.find((s) => s.key === key)!;
const file = { key: 'drafts/abc/card.pdf', name: 'card.pdf', size: 84000, type: 'application/pdf' };

describe('the updated published form', () => {
  it('lists every change once', () => {
    expect(changed).toHaveLength(15);
  });

  it('is a valid form with the transport routes frozen in', () => {
    expect(snap.sourceRev).toBe(`${published._rev}+local-fees-1`);
    expect(snap.transport?.routes.map((r) => r.key)).toEqual(['mirpur_micro', 'mirpur_auto', 'uttara_micro_1', 'uttara_micro_2', 'uttara_auto']);
    expect(snap.transport?.vehicles).toEqual([
      { key: 'micro', name: { bengali: 'মাইক্রো', english: 'Micro' }, monthly: 5000 },
      { key: 'auto', name: { bengali: 'অটো', english: 'Auto' }, monthly: 2500 },
    ]);
    const stop = field('transport_stop');
    expect(stop.options[0]).toEqual({ value: 'mirpur_micro:mirpur_micro_1', label: { bengali: 'মিরপুর ১০', english: 'Mirpur 10' } });
    expect(stop.options.at(-1)?.value).toBe(NO_ROUTE);
    expect(stop.options).toHaveLength(21);
  });

  it('asks about previous schooling only when the child studied before', () => {
    const keys = section('student').fields.filter((f) => f.group === 'previous').map((f) => f.key);
    expect(keys).toEqual(['studied_before', 'last_class_attended', 'previous_school', 'general_subjects_level', 'previous_result_card']);
    for (const key of keys.slice(1)) {
      expect(isVisible(field(key), { studied_before: 'no' })).toBe(false);
      expect(isVisible(field(key), { studied_before: 'yes' })).toBe(true);
      expect(field(key).required).toBe(true);
    }
    expect(field('general_subjects_level').options.map((o) => o.value)).not.toContain('did_not_attend_school');
  });

  it('accepts "don\'t have it now" for the birth certificate and result card only', () => {
    for (const key of ['student_birth_registration', 'previous_result_card']) {
      expect(checkField(field(key), FILE_MISSING)).toEqual({ value: FILE_MISSING });
      expect(checkField(field(key), undefined)).toEqual({ error: 'required' });
      expect(sanitizeDraft(snap, { [key]: FILE_MISSING })).toEqual({ [key]: FILE_MISSING });
    }
    expect(checkField(field('student_photo'), FILE_MISSING)).toEqual({ error: 'invalid' });
    expect(sanitizeDraft(snap, { student_photo: FILE_MISSING })).toEqual({});
    expect(checkField(field('previous_result_card'), file)).toEqual({ value: file });
  });

  it('keeps "none of the above" on its own', () => {
    const dress = field('father_islamic_clothing');
    expect(toggleChoice(dress, ['loose_clothing', 'beard'], 'none')).toEqual(['none']);
    expect(toggleChoice(dress, ['none'], 'beard')).toEqual(['beard']);
    expect(toggleChoice(dress, ['beard'], 'loose_clothing')).toEqual(['beard', 'loose_clothing']);
    expect(checkField(dress, ['none'])).toEqual({ value: ['none'] });
    expect(checkField(dress, ['beard', 'none'])).toEqual({ error: 'invalid_option' });
  });

  it('asks for a stop, then the area when no route fits', () => {
    const additional = section('additional');
    expect(additional.fields.map((f) => f.key)).toEqual(['heard_from', 'transport_interest', 'transport_stop', 'transport_area', 'comments']);
    const base = { heard_from: 'friends_family' };
    expect(Object.keys(checkSection(additional, { ...base, transport_interest: 'no' }).errors)).toEqual([]);
    expect(checkSection(additional, { ...base, transport_interest: 'yes' }).errors).toEqual({ transport_stop: 'required' });
    expect(checkSection(additional, { ...base, transport_interest: 'yes', transport_stop: 'uttara_auto:uttara_auto_1' }).errors).toEqual({});
    expect(checkSection(additional, { ...base, transport_interest: 'yes', transport_stop: 'uttara_auto:nowhere' }).errors).toEqual({ transport_stop: 'invalid_option' });
    expect(checkSection(additional, { ...base, transport_interest: 'yes', transport_stop: NO_ROUTE }).errors).toEqual({ transport_area: 'required' });
  });

  it('carries the code of conduct and the bring list', () => {
    const conduct = snap.settings.conduct!;
    expect(conduct.groups.map((g) => g.rules.length)).toEqual([3, 3, 3]);
    expect(conduct.pledge.bengali).toContain('আচরণবিধি');
    expect(conduct.declaration.bengali).not.toContain('জঙ্গি');
    expect(snap.settings.declaration.bengali).not.toContain('আচরণবিধি');
    expect(snap.settings.bringList?.map((i) => i.document ?? null)).toEqual([null, 'student_birth_registration', 'previous_result_card', null, null]);
    expect(snap.settings.bringList?.[2].showWhen).toEqual({ field: 'studied_before', values: ['yes'] });
  });
});

describe('applying the updates', () => {
  it('does nothing the second time and keeps text edited in the Studio', () => {
    const once = applyFormUpdates(doc);
    expect(once.changed).toEqual([]);
    const edited = structuredClone(doc);
    edited.cycle!.pdfInstructions = { bengali: 'অফিসের নিজের লেখা' };
    expect(applyFormUpdates(edited).cycle.pdfInstructions).toEqual({ bengali: 'অফিসের নিজের লেখা' });
    expect(applyFeeUpdates(liveFeeDocument()).changed).toEqual([]);
  });

  it('also applies to the local preview form', () => {
    const local = buildSnapshot(liveFormDocument());
    expect(allFields(local).map((f) => f.key)).toEqual(expect.arrayContaining(['studied_before', 'previous_result_card', 'transport_stop']));
    expect(local.settings.conduct).toBeDefined();
  });

  it('keeps a charge the office already set', () => {
    const fees = { transport: [{ _key: 'micro', price: { status: 'priced', amount: 4500 } }] };
    expect(applyFeeUpdates(fees).transport[0].price).toEqual({ status: 'priced', amount: 4500 });
  });
});

describe('transport in the snapshot', () => {
  it('leaves out hidden routes, shows "contact the office" without a charge, and needs a route', () => {
    const fees = structuredClone(liveFeeDocument());
    fees.transport![1].price = { status: 'contactOffice' };
    fees.transportRoutes![0].visible = false;
    const s = buildSnapshot({ ...doc, fees });
    expect(s.transport?.routes).toHaveLength(4);
    expect(s.transport?.vehicles.find((v) => v.key === 'auto')?.monthly).toBeUndefined();

    expect(() => buildSnapshot({ ...doc, fees: { transport: fees.transport } })).toThrow(FormConfigError);
  });
});

describe('form rules for the new settings', () => {
  const sections = () => structuredClone(doc.sections) as RawSection[];

  it('allows "only this choice" on checkbox questions only and needs the tick box text', () => {
    const s = sections();
    const gender = s[0].fields!.find((f) => f.key === 'student_gender')!;
    gender.options![0].exclusive = true;
    s[0].fields!.find((f) => f.key === 'previous_result_card')!.missingLabel = { bengali: '' };
    expect(checkFormConfig(s)).toEqual(
      expect.arrayContaining([expect.stringContaining('works on checkbox questions only'), expect.stringContaining('“don\'t have it now” tick box')]),
    );
  });

  it('checks the bring list against the form', () => {
    expect(checkBringList(doc.cycle!.bringList, doc.sections)).toEqual([]);
    expect(
      checkBringList(
        [
          { text: { bengali: 'ক' }, document: 'student_name_bengali' },
          { text: { bengali: 'খ' }, showWhen: { field: 'studied_before', values: ['maybe'] } },
        ],
        doc.sections,
      ),
    ).toEqual([expect.stringContaining('upload question'), expect.stringContaining('values must be options')]);
  });
});
