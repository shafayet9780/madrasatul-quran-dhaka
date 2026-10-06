import { toBengaliDigits } from './normalise';
import { classSections, NA, roundSnapshotSchema, t1PairCount, type RoundSnapshot } from './snapshot';

type Named = { key?: string | null; name?: string | null };

/** Raw published Sanity data for one round, as returned by the GROQ in sanity-source.ts. */
export type RoundSource = {
  round: {
    _id: string;
    label?: string | null;
    slug?: string | null;
    plannedOpensAt?: string | null;
    plannedClosesAt?: string | null;
    template?: {
      _id: string;
      kind?: string | null;
      version?: number | null;
      title?: string | null;
      intro?: string | null;
      commentLabel?: string | null;
      layout?: string | null;
      scale?: number[] | null;
      questions?:
        | {
            key?: string | null;
            text?: string | null;
            shortLabel?: string | null;
            hint?: string | null;
            type?: string | null;
            options?: { key?: string | null; label?: string | null; mark?: number | null }[] | null;
            areaKey?: string | null;
            required?: boolean | null;
            allowNA?: boolean | null;
            naLabel?: string | null;
            unscored?: boolean | null;
          }[]
        | null;
    } | null;
  } | null;
} & ListsSource;

export type ListsSource = {
  areas: (Named & { group?: string | null })[];
  classes: (Named & { sections?: Named[] | null; subjects?: Named[] | null })[];
  teachers: Named[];
};

export type RoundSummary = {
  questions: number;
  classSections: number;
  t1Pairs: number;
  areas: number;
  teachers: number;
};

export type PlannedRound = {
  sanityRoundId: string;
  kind: RoundSnapshot['template']['kind'];
  label: string;
  slug: string;
  opensAt: Date;
  closesAt: Date;
  snapshot: RoundSnapshot;
  summary: RoundSummary;
};

export type BuildResult = { ok: true; round: PlannedRound } | { ok: false; errors: string[] };

const opt = <T>(value: T | null | undefined): T | undefined => (value === null ? undefined : value);
const n = (value: number) => toBengaliDigits(value);

export function summarise(snapshot: RoundSnapshot): RoundSummary {
  return {
    questions: snapshot.template.questions.length,
    classSections: classSections(snapshot).length,
    t1Pairs: t1PairCount(snapshot),
    areas: snapshot.areas.length,
    teachers: snapshot.teachers.length,
  };
}

/** Classes and teachers for a snapshot; also used by "Refresh lists". */
export function buildLists(source: ListsSource): Pick<RoundSnapshot, 'classes' | 'teachers'> {
  return {
    classes: source.classes.map((c) => ({
      key: c.key ?? '',
      name: c.name ?? '',
      sections: (c.sections ?? []).map((s) => ({ key: s.key ?? '', name: s.name ?? '' })),
      subjects: (c.subjects ?? []).map((s) => ({ key: s.key ?? '', name: s.name ?? '' })),
    })),
    teachers: source.teachers.map((t) => ({ key: t.key ?? '', name: t.name ?? '' })),
  };
}

/** Lists problems that would make the round unusable, in Bengali for the admin. */
export function listProblems(kind: string, lists: Pick<RoundSnapshot, 'classes' | 'teachers'>): string[] {
  if (kind === 'G1') {
    if (!lists.classes.length) return ['কোনো শ্রেণি নেই (Studio → Surveys → Classes & Subjects)।'];
    const missing = lists.classes.filter((c) => !c.subjects.length).map((c) => c.name);
    return missing.length ? [`এসব শ্রেণিতে বিষয় নেই: ${missing.join(', ')} (Studio → Surveys → Classes & Subjects)।`] : [];
  }
  if (kind !== 'T1') return [];
  const errors: string[] = [];
  if (!lists.teachers.length) errors.push('কোনো সক্রিয় শিক্ষক নেই (Studio → Surveys → Teachers)।');
  if (!lists.classes.some((c) => c.subjects.length)) errors.push('কোনো শ্রেণিতে বিষয় যোগ করা হয়নি (Studio → Surveys → Classes & Subjects)।');
  return errors;
}

/**
 * Validates published Sanity data and builds the round row with its snapshot.
 * `dates` overrides the planned times (admin panel); `now` rejects rounds that would already be over.
 */
export function buildRound(
  source: RoundSource,
  { dates, now = new Date() }: { dates?: { opensAt: Date; closesAt: Date }; now?: Date } = {}
): BuildResult {
  const { round } = source;
  if (!round) return { ok: false, errors: ['রাউন্ডটি Studio-তে প্রকাশ (Publish) করা হয়নি।'] };
  const template = round.template;
  const errors: string[] = [];
  if (!round.label) errors.push('রাউন্ডের নাম (Label) দেওয়া হয়নি।');
  if (!round.slug) errors.push('লিংক নাম (Link name) দেওয়া হয়নি।');
  if (!template) errors.push('রাউন্ডে কোনো টেমপ্লেট বাছাই করা হয়নি।');

  const opensAt = dates?.opensAt ?? (round.plannedOpensAt ? new Date(round.plannedOpensAt) : null);
  const closesAt = dates?.closesAt ?? (round.plannedClosesAt ? new Date(round.plannedClosesAt) : null);
  if (!opensAt || !closesAt) errors.push('খোলা ও বন্ধের সময় দিন।');
  else if (closesAt <= opensAt) errors.push('বন্ধের সময় খোলার সময়ের পরে হতে হবে।');
  else if (closesAt <= now) errors.push('বন্ধের সময় পেরিয়ে গেছে; সময় বদলান।');

  const questions = template?.questions ?? [];
  questions.forEach((q, i) => {
    if (!q.areaKey) errors.push(`প্রশ্ন ${n(i + 1)}: এরিয়া বাছাই করা হয়নি।`);
    if (q.type === 'options' && (q.options?.length ?? 0) < 2) errors.push(`প্রশ্ন ${n(i + 1)}: অন্তত দুটি অপশন দিন।`);
    if (q.type === 'options' && q.options?.some((o) => typeof o.mark !== 'number')) errors.push(`প্রশ্ন ${n(i + 1)}: প্রতিটি অপশনের মার্ক দিন।`);
    if (q.options?.some((o) => o.key === NA)) errors.push(`প্রশ্ন ${n(i + 1)}: অপশনের key "na" ব্যবহার করা যাবে না।`);
    if (q.allowNA && template?.kind !== 'G2') errors.push(`প্রশ্ন ${n(i + 1)}: "প্রযোজ্য নয়" শুধু শিক্ষার্থীর উপর অভিভাবক রিভিউতে (G2) রাখা যায়।`);
    if (q.unscored && template?.kind !== 'G2') errors.push(`প্রশ্ন ${n(i + 1)}: "মার্ক গণনা হবে না" শুধু শিক্ষার্থীর উপর অভিভাবক রিভিউতে (G2) রাখা যায়।`);
  });
  if (template && !questions.length) errors.push('টেমপ্লেটে কোনো প্রশ্ন নেই।');

  const lists = buildLists(source);
  errors.push(...listProblems(template?.kind ?? '', lists));
  if (errors.length || !template || !opensAt || !closesAt) return { ok: false, errors };

  const usedAreas = new Set(questions.map((q) => q.areaKey));
  const parsed = roundSnapshotSchema.safeParse({
    takenAt: now.toISOString(),
    template: {
      id: template._id,
      version: template.version ?? 1,
      kind: template.kind,
      title: template.title,
      intro: opt(template.intro),
      commentLabel: opt(template.commentLabel),
      layout: template.kind === 'G1' ? (template.layout === 'by-question' ? 'by-question' : 'by-subject') : undefined,
      scale: template.scale ?? [],
      questions: questions.map((q) => ({
        key: q.key,
        text: q.text,
        shortLabel: opt(q.shortLabel),
        hint: opt(q.hint),
        type: q.type,
        options: (q.options ?? []).map((o) => ({ key: o.key, label: o.label, mark: o.mark })),
        areaKey: q.areaKey,
        required: opt(q.required),
        allowNA: opt(q.allowNA),
        naLabel: q.allowNA && q.naLabel ? q.naLabel : undefined,
        unscored: opt(q.unscored),
      })),
    },
    areas: source.areas.filter((a) => usedAreas.has(a.key)).map((a) => ({ key: a.key, name: a.name, group: a.group })),
    ...lists,
  });
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `Studio-র তথ্যে সমস্যা: ${issue.path.join(' › ')} (${issue.message})`),
    };
  }

  const snapshot = parsed.data;
  return {
    ok: true,
    round: {
      sanityRoundId: round._id,
      kind: snapshot.template.kind,
      label: round.label!,
      slug: round.slug!,
      opensAt,
      closesAt,
      snapshot,
      summary: summarise(snapshot),
    },
  };
}
