import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DECLARATION_ENGLISH } from '../legacy-english';
import { DEFAULT_CYCLE, convertLegacyForm, type LegacyFormDocument } from '../legacy-form';
import type { FeeDocument, FormDocument } from '../snapshot';
import { applyFeeUpdates, applyFormUpdates } from '../updates-2027';

// The live form as exported by scripts/extract-form-questions.js (Bengali text only), turned back
// into the Sanity document shape. Used by tests and the local preview.

type Exported = {
  declarationText: string;
  sections: {
    sectionNameEn: string;
    fields: { fieldName: string; questionTitle: string; questionType: string; isRequired: boolean; placeholder: string; helpText: string; fileType?: string; options: { label: string; value: string }[] }[];
  }[];
};

export function exportedForm(): Exported {
  return JSON.parse(readFileSync(join(process.cwd(), 'docs/pre-admission-form/pre-admission-form-questions.json'), 'utf8'));
}

export function liveLegacyDocument(): LegacyFormDocument {
  const exported = exportedForm();
  const fields = (name: string, asQuestion = false) =>
    exported.sections
      .find((s) => s.sectionNameEn === name)!
      .fields.map((f) => ({
        ...(f.fieldName && { fieldName: f.fieldName }),
        [asQuestion ? 'question' : 'label']: { bengali: f.questionTitle },
        fieldType: f.questionType,
        fileType: f.fileType,
        isRequired: f.isRequired,
        placeholder: { bengali: f.placeholder },
        helpText: { bengali: f.helpText },
        options: f.options.map((o) => ({ label: { bengali: o.label }, value: o.value })),
      }));
  return {
    generalQuestions: fields('General Questions', true),
    studentInfoFields: fields('Student Information'),
    parentInfoFields: { fatherFields: fields('Father Information'), motherFields: fields('Mother Information') },
    additionalQuestions: fields('Additional Information'),
    contactInfoFields: fields('Contact Information'),
  };
}

const AGES: Record<string, [number, number]> = { N: [4, 5], KG: [5, 6], C1: [6, 7], C2: [7, 8], C3: [8, 9], C4: [9, 10], C5: [10, 11] };

/** Fees & Discounts → Transport as published before the 2027 updates (vehicles, no charges, no routes). */
const LIVE_FEES = {
  _rev: 'local-fees-1',
  transport: [
    { _key: 'micro', name: { bengali: 'মাইক্রো', english: 'Micro' }, price: { status: 'contactOffice' }, visible: true },
    { _key: 'auto', name: { bengali: 'অটো', english: 'Auto' }, price: { status: 'contactOffice' }, visible: true },
  ],
};

/** Transport with the 2027 updates applied (charges and routes). */
export function liveFeeDocument(): FeeDocument {
  const { transport, transportRoutes, transportIntroduction } = applyFeeUpdates(LIVE_FEES);
  return { ...LIVE_FEES, transport, transportRoutes, transportIntroduction } as FeeDocument;
}

/** The converted live form with the 2027 updates (updates-2027.ts), published and open, with sample class ages. */
export function liveFormDocument(now = new Date()): FormDocument {
  const { sections } = convertLegacyForm(liveLegacyDocument());
  for (const s of sections as any[]) {
    for (const f of s.fields) {
      if (f.role !== 'classApplied') continue;
      for (const o of f.options) [o.ageMin, o.ageMax] = AGES[o.code] ?? [];
    }
  }
  const day = 24 * 60 * 60 * 1000;
  const updated = applyFormUpdates({
    sections,
    declarationText: { bengali: exportedForm().declarationText, english: DECLARATION_ENGLISH },
    cycle: DEFAULT_CYCLE,
  });
  return {
    _rev: 'local-1',
    formSettings: { isEnabled: true },
    declarationText: updated.declarationText,
    cycle: {
      ...updated.cycle,
      opensAt: new Date(now.getTime() - day).toISOString(),
      closesAt: new Date(now.getTime() + 30 * day).toISOString(),
      whatsappUrl: 'https://chat.whatsapp.com/LocalPreviewGroup',
    },
    sections: updated.sections as FormDocument['sections'],
    fees: liveFeeDocument(),
  };
}
