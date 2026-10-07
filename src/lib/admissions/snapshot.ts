import { checkFormConfig, formSnapshotSchema, type FormSnapshot, type RawSection } from './form-config';

/** The parts of the Sanity `preAdmissionForm` document the 2027 flow reads (published version). */
export type FormDocument = {
  _rev?: string;
  formSettings?: { isEnabled?: boolean };
  declarationText?: { bengali?: string; english?: string };
  cycle?: {
    session?: string;
    applicationFee?: number;
    evaluationFee?: number;
    opensAt?: string;
    closesAt?: string;
    whatsappUrl?: string;
    pdfInstructions?: { bengali?: string; english?: string };
    refundNote?: { bengali?: string; english?: string };
  };
  sections?: (RawSection & Record<string, unknown>)[];
};

export class FormConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`The pre-admission form is not ready: ${problems.join(' ')}`);
  }
}

// Sanity adds _key/_type to array members and omits never-set booleans; strip the former.
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k, v]) => !k.startsWith('_') && v !== null && v !== '')
        .map(([k, v]) => [k, clean(v)]),
    );
  }
  return value;
}

/**
 * Freezes the published form into the shape stored with the cycle. Throws FormConfigError when the
 * form or the cycle settings are incomplete, so a broken form is never opened to guardians.
 */
export function buildSnapshot(doc: FormDocument, takenAt: Date = new Date()): FormSnapshot {
  const problems = checkFormConfig(doc.sections);
  const c = doc.cycle;
  if (!c?.session) problems.push('Cycle settings: add the session.');
  if (!c?.applicationFee) problems.push('Cycle settings: add the application fee.');
  if (c?.evaluationFee == null) problems.push('Cycle settings: add the evaluation fee.');
  if (!doc.declarationText?.bengali) problems.push('Add the declaration text.');
  if (problems.length) throw new FormConfigError(problems);

  const parsed = formSnapshotSchema.safeParse({
    takenAt: takenAt.toISOString(),
    sourceRev: doc._rev,
    settings: clean({
      session: c!.session,
      applicationFee: c!.applicationFee,
      evaluationFee: c!.evaluationFee,
      opensAt: c!.opensAt,
      closesAt: c!.closesAt,
      whatsappUrl: c!.whatsappUrl,
      declaration: doc.declarationText,
      pdfInstructions: c!.pdfInstructions,
      refundNote: c!.refundNote,
    }),
    sections: clean(doc.sections),
  });
  if (!parsed.success) throw new FormConfigError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
  return parsed.data;
}

export type CycleWindow = 'not_open' | 'open' | 'closed';

/** Whether guardians can apply right now (the Studio on/off switch is checked separately). */
export function cycleWindow(settings: FormSnapshot['settings'], now: Date = new Date()): CycleWindow {
  if (settings.opensAt && now < new Date(settings.opensAt)) return 'not_open';
  if (settings.closesAt && now > new Date(settings.closesAt)) return 'closed';
  return 'open';
}
