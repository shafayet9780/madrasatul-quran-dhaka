import type { Metadata } from 'next';
import { requestOrigin } from '@/lib/survey/admin-auth';
import { formatDateRange, formatDateTime, toDhakaInput } from '@/lib/survey/dates';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { roundStatus } from '@/lib/survey/round-status';
import { listRounds, openRound, surveyPath, type RoundListItem } from '@/lib/survey/rounds';
import { fetchUnopenedRounds } from '@/lib/survey/sanity-source';
import { t1PairCount } from '@/lib/survey/snapshot';
import { RoundsBoard } from './RoundsBoard';
import type { BoardRow, OpenedRow, UnopenedRow } from './types';
import { PageTop } from '../AdminShell';
import { PageBody, PageTitle } from '../ui';

export const metadata: Metadata = { title: 'রাউন্ড' };
export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;

function openedRow(round: RoundListItem, origin: string, now: Date): OpenedRow {
  const t1 = round.kind === 'T1';
  const pairs = t1PairCount(round.snapshot);
  const count = t1 ? `${bn(round.coveredPairs)}/${bn(pairs)} ক্লাস-বিষয়` : `${bn(round.current)} জন`;
  const drafts = round.drafts ? `${bn(round.drafts)}টি খসড়া রয়ে যাবে` : 'কোনো খসড়া নেই';
  return {
    type: 'opened',
    roundId: round.id,
    kind: round.kind,
    label: round.label,
    status: roundStatus(round, now),
    when: formatDateRange(round.opensAt, round.closesAt),
    whenTitle: `খোলা: ${formatDateTime(round.opensAt)} · বন্ধ: ${formatDateTime(round.closesAt)}`,
    count,
    drafts: round.drafts,
    url: new URL(surveyPath(round.slug, round.linkKey), origin).toString(),
    // A closed round is reopened by extending; suggest 23:59 a week from now rather than the past close time.
    closesAtInput: roundStatus(round, now) === 'closed' ? `${toDhakaInput(new Date(now.getTime() + 7 * DAY)).slice(0, 10)}T23:59` : toDhakaInput(round.closesAt),
    progress: `${count} জমা হয়েছে; ${drafts}।`,
    respondents: t1 ? 'শিক্ষকরা' : 'অভিভাবকরা',
  };
}

export default async function RoundsPage() {
  const now = new Date();
  const [rounds, origin] = await Promise.all([listRounds(), requestOrigin()]);
  const unopened = await fetchUnopenedRounds(rounds.map((r) => r.sanityRoundId));

  // Check each unopened round's content now; dates are checked when the admin opens it.
  const placeholderDates = { opensAt: now, closesAt: new Date(now.getTime() + DAY) };
  const unopenedRows: UnopenedRow[] = await Promise.all(
    unopened.map(async (round) => {
      const opensAt = round.plannedOpensAt ? new Date(round.plannedOpensAt) : now;
      const closesAt = round.plannedClosesAt ? new Date(round.plannedClosesAt) : new Date(now.getTime() + 14 * DAY);
      const check = await openRound(round._id, { dryRun: true, dates: placeholderDates });
      return {
        type: 'unopened' as const,
        sanityRoundId: round._id,
        kind: round.kind ?? '—',
        label: round.label ?? 'নাম নেই',
        when: `${formatDateRange(opensAt, closesAt)} (পরিকল্পিত)`,
        studioHref: `/studio/structure/surveys;surveyRound;${round._id}`,
        opensAtInput: toDhakaInput(opensAt),
        closesAtInput: toDhakaInput(closesAt),
        linkPreview: `${origin.replace(/^https?:\/\//, '')}/survey/${round.slug ?? '…'}?k=••••••••`,
        check: check.ok ? { ok: true as const, summary: check.summary } : check,
      };
    })
  );

  const opened = rounds.map((r) => openedRow(r, origin, now));
  const rows: BoardRow[] = [
    ...opened.filter((r) => r.status !== 'closed'),
    ...unopenedRows,
    ...opened.filter((r) => r.status === 'closed'),
  ];

  return (
    <>
      <PageTop crumbs={[{ label: 'অ্যাডমিন' }, { label: 'রাউন্ড' }]} round={false} />
      <PageBody>
        <PageTitle sub="প্রশ্ন ও রাউন্ডের খসড়া Studio-তে তৈরি হয়; এখানে খোলা, লিংক শেয়ার, মেয়াদ বাড়ানো ও বন্ধ করা হয়">রাউন্ড</PageTitle>
        <RoundsBoard rows={rows} />
      </PageBody>
    </>
  );
}
