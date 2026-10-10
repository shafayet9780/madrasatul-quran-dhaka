import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDateTime } from '@/lib/survey/dates';
import { KIND_LABEL } from '@/lib/survey/labels';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { roundStatus } from '@/lib/survey/round-status';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { listTrackerRounds, loadTracker } from '@/lib/survey/tracker';
import type { CellState } from '@/lib/survey/coverage';
import { GuardianTracker } from './GuardianTracker';
import { DuplicateResolver } from './TrackerControls';
import { PageTop } from '../AdminShell';
import { ReportFilters } from '../reports/ReportFilters';
import { ReportTools } from '../reports/ReportTools';
import { Card, EmptyState, LINK, PageBody, PageTitle } from '../ui';

export const metadata: Metadata = { title: 'রেসপন্স ট্র্যাকার' };
export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;
const STATE_LABEL: Record<Exclude<CellState, 'na'>, string> = { done: 'জমা', partial: 'আংশিক জমা', draft: 'খসড়া', dup: 'ডুপ্লিকেট', todo: 'বাকি' };

function StateIcon({ state }: { state: CellState }) {
  if (state === 'done')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sv-ok)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5 12 5 5 9-10" />
      </svg>
    );
  if (state === 'draft' || state === 'partial') {
    const color = state === 'draft' ? 'var(--sv-info)' : 'var(--sv-ok)';
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill={color} />
      </svg>
    );
  }
  if (state === 'dup')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sv-warn)" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 2 20h20L12 3z" />
      </svg>
    );
  if (state === 'todo') return <span aria-hidden="true" style={{ display: 'inline-block', width: 12, height: 2, background: 'var(--sv-icon-muted)' }} />;
  return null;
}

export default async function TrackerPage({ searchParams }: { searchParams: Promise<{ round?: string; place?: string }> }) {
  const [{ round: requested, place }, rounds] = await Promise.all([searchParams, listTrackerRounds()]);
  const now = new Date();

  if (!rounds.length) {
    return (
      <>
        <PageTop crumbs={[{ label: 'সংগ্রহ' }, { label: 'রেসপন্স ট্র্যাকার' }]} round={false} />
        <PageBody>
          <PageTitle>রেসপন্স ট্র্যাকার</PageTitle>
          <EmptyState>
            এখনো কোনো রাউন্ড খোলা হয়নি।{' '}
            <Link href="/admin/rounds" className={LINK}>
              রাউন্ড পাতায়
            </Link>{' '}
            গিয়ে একটি রাউন্ড খুলুন।
          </EmptyState>
        </PageBody>
      </>
    );
  }

  // Default: the teacher round chosen in the sidebar, else the open round, else the latest.
  const sidebar = await chosenRoundId();
  const chosen =
    rounds.find((r) => r.id === requested) ?? rounds.find((r) => r.id === sidebar) ?? rounds.find((r) => roundStatus(r, now) === 'open') ?? rounds[0];
  const picker = rounds.map((r) => ({ value: r.id, label: `${KIND_LABEL[r.kind]} · ${r.label}` }));
  if (chosen.kind !== 'T1') return <GuardianTracker roundId={chosen.id} rounds={picker} place={place} now={now} />;
  const data = await loadTracker(chosen.id);
  if (!data) return null;
  const { round, coverage, levelGaps, drafts, duplicates } = data;
  const status = roundStatus(round, now);
  const daysLeft = Math.ceil((round.closesAt.getTime() - now.getTime()) / DAY);
  const when =
    status === 'open' ? `বন্ধ হতে ${bn(daysLeft)} দিন বাকি` : status === 'scheduled' ? `খুলবে ${formatDateTime(round.opensAt)}` : `বন্ধ হয়েছে ${formatDateTime(round.closesAt)}`;

  return (
    <>
      <PageTop crumbs={[{ label: 'সংগ্রহ' }, { label: 'রেসপন্স ট্র্যাকার' }]} round={false} actions={<ReportTools exportHref={`/admin/reports/export?kind=tracker&round=${round.id}`} />} />
      <PageBody>
        <PageTitle sub={`${round.label} · ${when}`}>রেসপন্স ট্র্যাকার</PageTitle>
        <ReportFilters action="/admin/tracker" selects={[{ name: 'round', label: 'জরিপ ও রাউন্ড', value: round.id, options: picker }]} />

        {/* Announced when the last duplicate is decided and its box goes away. */}
        <p role="status" className="sv-visually-hidden">
          {duplicates.length ? '' : 'কোনো ডুপ্লিকেট নেই।'}
        </p>
        {/* A duplicate waits for a decision, so it comes first. */}
        {duplicates.length > 0 && (
          <section className="flex flex-col gap-3 rounded-xl border border-[var(--sv-tint-border)] bg-[var(--sv-warn-bg)] p-5" aria-labelledby="dups-title">
            <div className="flex flex-col gap-0.5">
              <h2 id="dups-title" className="m-0 text-[15px] font-semibold">
                ডুপ্লিকেট ({bn(duplicates.length)}) · সিদ্ধান্ত দরকার
              </h2>
              <p className="m-0 text-[13.5px] text-muted-foreground">একই শ্রেণি ও বিষয়ে একাধিক শিক্ষক জমা দিয়েছেন। কোনটি রাখবেন ঠিক করুন; যেটি রাখবেন না সেটি রিপোর্টে গণ্য হবে না, তবে মুছে যাবে না।</p>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {duplicates.map((d) => (
                <DuplicateResolver
                  key={d.batches.map((b) => b.id).join('|')}
                  roundId={round.id}
                  title={d.title}
                  batches={d.batches.map((b) => ({ ...b, submittedAt: b.submittedAt.toISOString() }))}
                />
              ))}
            </div>
          </section>
        )}

        <Card
          title={`শিক্ষক কভারেজ · শ্রেণি × বিষয় · কভার ${bn(coverage.covered)}/${bn(coverage.total)}`}
          action={
            <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground" aria-hidden="true">
              {(['done', ...(coverage.rows.some((r) => r.cells.some((c) => c.progress)) ? (['partial'] as const) : []), 'draft', 'dup', 'todo'] as const).map((state) => (
                <span key={state} className="flex items-center gap-1">
                  <StateIcon state={state} />
                  {STATE_LABEL[state]}
                </span>
              ))}
            </div>
          }
        >
          {coverage.subjects.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">এই রাউন্ডে কোনো বিষয় নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="sv-cover">
                <caption className="sv-visually-hidden">প্রতিটি শ্রেণি ও বিষয়ের শিক্ষক রিভিউর অবস্থা</caption>
                <thead>
                  <tr>
                    <td />
                    {coverage.subjects.map((s) => (
                      <th key={s.key} scope="col">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coverage.rows.map((row) => (
                    <tr key={`${row.classKey}|${row.sectionKey}`}>
                      <th scope="row">{row.label}</th>
                      {row.cells.map((cell) => {
                        const subject = coverage.subjects.find((s) => s.key === cell.subjectKey)!.name;
                        const text =
                          cell.state === 'na'
                            ? 'প্রযোজ্য নয়'
                            : `${STATE_LABEL[cell.state]}${cell.progress ? ` ${bn(cell.progress.done)}/${bn(cell.progress.total)} জন` : ''}${cell.teachers.length ? ` · ${cell.teachers.join(', ')}` : ''}`;
                        return (
                          <td key={cell.subjectKey} className={cell.state === 'na' ? undefined : `is-${cell.state}`} title={`${row.label} · ${subject}: ${text}`}>
                            <StateIcon state={cell.state} />
                            {cell.progress && cell.state === 'partial' && (
                              <span aria-hidden="true" className="ml-1 text-xs font-semibold tabular-nums">
                                {bn(cell.progress.done)}/{bn(cell.progress.total)}
                              </span>
                            )}
                            <span className="sv-visually-hidden">{text}</span>
                            {cell.teachers.length > 0 && (
                              <span aria-hidden="true" className="mt-0.5 block text-[11px] font-normal leading-tight">
                                {cell.teachers.join(', ')}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {levelGaps.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <h3 className="m-0 text-[15px] font-semibold">লেভেলভিত্তিক বিষয়: যাদের এখনো রেটিং হয়নি</h3>
              {levelGaps.map((gap) => (
                <p key={gap.title} className="m-0 text-[13.5px] leading-relaxed">
                  <b className="font-semibold">{gap.title}</b> ({bn(gap.students.length)} জন):{' '}
                  <span className="text-muted-foreground">{gap.students.map((s) => `${s.roll !== null ? `${bn(s.roll)}. ` : ''}${s.name}`).join(', ')}</span>
                </p>
              ))}
            </div>
          )}
        </Card>

        <section className="flex flex-col gap-2.5 rounded-xl border bg-card p-5" aria-labelledby="drafts-title">
          <h2 id="drafts-title" className="m-0 text-[15px] font-semibold">
            শিক্ষকদের খসড়া ({bn(drafts.length)})
          </h2>
          {drafts.length === 0 && <p className="m-0 text-sm text-muted-foreground">কোনো অসমাপ্ত খসড়া নেই।</p>}
          {status === 'closed' && drafts.length > 0 && <p className="m-0 text-[13.5px] text-muted-foreground">রাউন্ড বন্ধ; খসড়া রিপোর্টে গণ্য হবে না। মেয়াদ বাড়ালে শিক্ষকরা জমা দিতে পারবেন।</p>}
          {drafts.length > 0 && (
            <ul className="m-0 flex list-none flex-col p-0">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 border-b py-2.5 last:border-b-0">
                  <span className="flex flex-col">
                    <span className="font-medium">{d.title}</span>
                    <span className="text-[13px] text-muted-foreground">{[d.teacherName, `শেষ সম্পাদনা ${formatDateTime(d.updatedAt)}`, d.device].filter(Boolean).join(' · ')}</span>
                  </span>
                  {/* A by-level draft with nobody marked yet has no count to show. */}
                  {d.total > 0 && (
                    <span className="text-[13.5px] font-semibold tabular-nums">
                      {bn(d.done)}/{bn(d.total)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageBody>
    </>
  );
}
