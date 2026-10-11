import {
  NO_ROUTE,
  NO_ROUTE_LABEL,
  checkBringList,
  checkFormConfig,
  formSnapshotSchema,
  type FormSnapshot,
  type RawBringItem,
  type RawSection,
  type Transport,
} from './form-config';

type Bi = { bengali?: string; english?: string };
type Keyed<T> = T & { _key?: string };

/** Fees & Discounts → Transport (published document `feeSettings`). */
export type FeeDocument = {
  _rev?: string;
  transport?: Keyed<{ name?: Bi; visible?: boolean; price?: { status?: string; amount?: number } }>[];
  transportRoutes?: Keyed<{ name?: Bi; area?: Bi; vehicle?: string; visible?: boolean; stops?: Keyed<{ name?: Bi }>[] }>[];
};

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
    conductIntro?: Bi;
    conductGroups?: { title?: Bi; rules?: Bi[] }[];
    conductPledge?: Bi;
    familyDeclaration?: Bi;
    bringList?: (RawBringItem & { text?: Bi })[];
  };
  sections?: (RawSection & Record<string, unknown>)[];
  /** Fetched with the form: routes and charges are frozen with it. */
  fees?: FeeDocument | null;
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

/** Short FNV-1a hash, so a version changes only when the frozen transport data changes. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

/** Visible routes with at least one stop, and the vehicles they use. */
function buildTransport(fees: FeeDocument | null | undefined): Transport {
  const routes = (fees?.transportRoutes ?? [])
    .filter((r) => r.visible !== false && r._key && r.vehicle && r.stops?.some((s) => s._key))
    .map((r) => ({
      key: r._key!,
      name: r.name,
      area: r.area,
      vehicle: r.vehicle!,
      stops: r.stops!.filter((s) => s._key).map((s) => ({ key: s._key!, name: s.name })),
    }));
  const used = new Set(routes.map((r) => r.vehicle));
  const vehicles = (fees?.transport ?? [])
    .filter((v) => v._key && used.has(v._key))
    .map((v) => ({ key: v._key!, name: v.name, monthly: v.price?.status === 'priced' && typeof v.price.amount === 'number' ? v.price.amount : undefined }));
  return clean({ vehicles, routes }) as Transport;
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
  problems.push(...checkBringList(c?.bringList, doc.sections));
  const conductGiven = !!(c?.conductGroups?.length || c?.conductPledge?.bengali || c?.familyDeclaration?.bengali);
  if (conductGiven && !(c?.conductGroups?.length && c.conductPledge?.bengali && c.familyDeclaration?.bengali))
    problems.push('Cycle settings: the code of conduct needs its rule groups, the conduct pledge and the declaration.');

  const stopFields = (doc.sections ?? []).flatMap((s) => s.fields ?? []).filter((f) => f.type === 'transportStop');
  const transport = stopFields.length ? buildTransport(doc.fees) : undefined;
  if (transport) {
    if (!transport.routes.length) problems.push('Fees & Discounts → Transport: add at least one route with stops (the form asks for the nearest stop).');
    const vehicles = new Set(transport.vehicles.map((v) => v.key));
    for (const r of transport.routes) if (!vehicles.has(r.vehicle)) problems.push(`Fees & Discounts → Transport → ${r.name?.bengali ?? r.key}: choose a vehicle.`);
  }
  if (problems.length) throw new FormConfigError(problems);

  // A transport stop field is answered like a one-choice question: one option per stop.
  const stopOptions = transport && [
    ...transport.routes.flatMap((r) => r.stops.map((s) => ({ value: `${r.key}:${s.key}`, label: s.name }))),
    { value: NO_ROUTE, label: NO_ROUTE_LABEL },
  ];
  const sections = clean(doc.sections) as RawSection[];
  for (const f of sections.flatMap((s) => s.fields ?? [])) if (f.type === 'transportStop') f.options = stopOptions;

  const parsed = formSnapshotSchema.safeParse({
    takenAt: takenAt.toISOString(),
    // A change to the routes or charges is a new version too (other fee edits are not).
    sourceRev: transport ? `${doc._rev}+${hash(JSON.stringify(transport))}` : doc._rev,
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
      conduct: conductGiven
        ? { intro: c!.conductIntro, groups: c!.conductGroups, pledge: c!.conductPledge, declaration: c!.familyDeclaration }
        : undefined,
      // Studio leaves an emptied "show only when" behind as an empty object.
      bringList: c!.bringList?.map(({ text, showWhen, document }) => ({ text, showWhen: showWhen?.field ? showWhen : undefined, document })),
    }),
    sections,
    transport,
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
