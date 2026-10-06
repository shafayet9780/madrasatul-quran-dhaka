import type { Metadata } from 'next';
import { cache } from 'react';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/survey/db';
import { SUBMIT_GRACE_MS, surveyAccess } from '@/lib/survey/round-status';
import { students, surveyRounds } from '@/lib/survey/schema';
import { fetchOfficePhone } from '@/lib/survey/sanity-source';
import { keyMatches } from '@/lib/survey/survey-request';
import { GuardianFlow } from './guardian/GuardianFlow';
import type { GuardianConfig } from './guardian/types';
import { LinkInvalid, NotOpenYet, RoundClosed } from './StatusScreens';
import { T1Flow } from './t1/T1Flow';
import { searchToState } from './t1/url-state';
import { sizeKey, type T1Config } from './t1/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

// One query per request for both the page and its title.
const loadRound = cache(async (slug: string) => {
  const [round] = await getDb().select().from(surveyRounds).where(eq(surveyRounds.slug, slug)).limit(1);
  return round;
});

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const round = await loadRound((await params).slug);
  return { title: round && round.kind !== 'T1' ? 'অভিভাবক রিভিউ' : 'শিক্ষকের রিভিউ' };
}

export default async function SurveyPage({ params, searchParams }: Props) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const single = Object.fromEntries(Object.entries(search).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const db = getDb();
  // This query also wakes the database (Neon suspends when idle), before the teacher starts tapping.
  const [round, officePhone] = await Promise.all([loadRound(slug), fetchOfficePhone().catch(() => null)]);

  if (!round || !keyMatches(single.k, round.linkKey)) return <LinkInvalid phone={officePhone} />;
  const access = surveyAccess(round);
  if (access === 'scheduled') return <NotOpenYet opensAt={round.opensAt} />;
  if (access === 'closed') return <RoundClosed label={round.label} closesAt={round.closesAt} phone={officePhone} />;
  if (round.kind !== 'T1') {
    const guardian: GuardianConfig = {
      roundId: round.id,
      linkKey: round.linkKey,
      label: round.label,
      closesAt: round.closesAt.toISOString(),
      kind: round.kind,
      snapshot: { template: round.snapshot.template, areas: round.snapshot.areas, classes: round.snapshot.classes },
      officePhone,
    };
    return <GuardianFlow config={guardian} />;
  }

  const sizes = await db
    .select({ classKey: students.classKey, sectionKey: students.sectionKey, n: sql<number>`count(*)`.mapWith(Number) })
    .from(students)
    .where(and(eq(students.active, true)))
    .groupBy(students.classKey, students.sectionKey);

  const config: T1Config = {
    roundId: round.id,
    slug: round.slug,
    linkKey: round.linkKey,
    label: round.label,
    closesAt: round.closesAt.toISOString(),
    graceMs: SUBMIT_GRACE_MS,
    // The teacher list stays on the server: teachers start by typing their ERP ID.
    snapshot: { template: round.snapshot.template, areas: round.snapshot.areas, classes: round.snapshot.classes },
    classSizes: Object.fromEntries(sizes.map((s) => [sizeKey(s.classKey, s.sectionKey), s.n])),
    officePhone,
  };
  return <T1Flow config={config} initial={searchToState(single)} />;
}
