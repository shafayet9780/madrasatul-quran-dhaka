import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDateTime } from '@/lib/survey/dates';
import { KIND_LABEL } from '@/lib/survey/labels';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { roundStatus } from '@/lib/survey/round-status';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { listTrackerRounds, loadTracker } from '@/lib/survey/tracker';
import type { CellState } from '@/lib/survey/coverage';
import { RoundPicker } from '../RoundPicker';
import { GuardianTracker } from './GuardianTracker';
import { DuplicateResolver, PrintButton } from './TrackerControls';
import { PageTop } from '../AdminShell';

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
        <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
          রেসপন্স ট্র্যাকার
        </h1>
        <div className="sv-card" style={{ padding: 20 }}>
          এখনো কোনো রাউন্ড খোলা হয়নি। <Link href="/admin/rounds">রাউন্ড পাতায়</Link> গিয়ে একটি রাউন্ড খুলুন।
        </div>
      </>
    );
  }

  // Default: the teacher round chosen in the sidebar, else the open round, else the latest.
  const sidebar = await chosenRoundId();
  const chosen =
    rounds.find((r) => r.id === requested) ?? rounds.find((r) => r.id === sidebar) ?? rounds.find((r) => roundStatus(r, now) === 'open') ?? rounds[0];
  const picker = rounds.map((r) => ({ id: r.id, label: `${KIND_LABEL[r.kind]} · ${r.label}` }));
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
      <PageTop crumbs={[{ label: 'সংগ্রহ' }, { label: 'রেসপন্স ট্র্যাকার' }]} round={false} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            রেসপন্স ট্র্যাকার
          </h1>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
            {round.label} · {when}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center sv-no-print">
          <RoundPicker rounds={picker} value={round.id} basePath="/admin/tracker" label="জরিপ ও রাউন্ড" />
          <a className="sv-sbtn" href={`/admin/reports/export?kind=tracker&round=${round.id}`}>
            Excel
          </a>
          <PrintButton />
        </div>
      </div>

      <nav aria-label="এই পাতায়" className="flex flex-wrap gap-2 items-center sv-no-print">
        <span style={{ fontSize: 13, color: 'var(--sv-text-muted)', marginRight: 4 }}>এই পাতায়:</span>
        <a className="sv-jump" href="#coverage">
          শিক্ষক কভারেজ
        </a>
        <a className="sv-jump" href="#drafts">
          খসড়া ও ডুপ্লিকেট ({bn(drafts.length + duplicates.length)})
        </a>
      </nav>

      <h2 id="coverage" className="sv-head sv-h2" style={{ fontSize: 22, paddingTop: 4 }}>
        শিক্ষক কভারেজ
      </h2>
      <section className="sv-card flex flex-col gap-2.5" aria-labelledby="coverage-title">
        <div className="flex flex-wrap justify-between items-baseline gap-2">
          <h3 id="coverage-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            শ্রেণি × বিষয় · কভার {bn(coverage.covered)}/{bn(coverage.total)}
          </h3>
          <div className="flex flex-wrap gap-3" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
            {(['done', ...(coverage.rows.some((r) => r.cells.some((c) => c.progress)) ? (['partial'] as const) : []), 'draft', 'dup', 'todo'] as const).map((state) => (
              <span key={state} className="flex items-center gap-1">
                <StateIcon state={state} />
                {STATE_LABEL[state]}
              </span>
            ))}
          </div>
        </div>
        {coverage.subjects.length === 0 ? (
          <p className="sv-muted" style={{ margin: 0 }}>
            এই রাউন্ডে কোনো বিষয় নেই।
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                            <span aria-hidden="true" className="sv-num" style={{ fontSize: 12, marginLeft: 4 }}>
                              {bn(cell.progress.done)}/{bn(cell.progress.total)}
                            </span>
                          )}
                          <span className="sv-visually-hidden">{text}</span>
                          {cell.teachers.length > 0 && (
                            <span aria-hidden="true" style={{ display: 'block', fontSize: 11, lineHeight: 1.3, marginTop: 2, fontWeight: 400 }}>
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
          <div className="flex flex-col gap-2" style={{ paddingTop: 6 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>লেভেলভিত্তিক বিষয়: যাদের এখনো রেটিং হয়নি</h3>
            {levelGaps.map((gap) => (
              <div key={gap.title} style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                <b>{gap.title}</b> ({bn(gap.students.length)} জন):{' '}
                <span style={{ color: 'var(--sv-text-muted)' }}>
                  {gap.students.map((s) => `${s.roll !== null ? `${bn(s.roll)}. ` : ''}${s.name}`).join(', ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <h2 id="drafts" className="sv-head sv-h2" style={{ fontSize: 22, paddingTop: 8 }}>
        খসড়া ও ডুপ্লিকেট
      </h2>
      <div className="flex flex-wrap gap-4 items-start">
        <section className="sv-card flex flex-col gap-2.5 min-w-0" style={{ flex: '1 1 380px' }} aria-labelledby="drafts-title">
          <h3 id="drafts-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            শিক্ষকদের খসড়া ({bn(drafts.length)})
          </h3>
          {drafts.length === 0 && <p className="sv-muted" style={{ margin: 0, fontSize: 14 }}>কোনো অসমাপ্ত খসড়া নেই।</p>}
          {status === 'closed' && drafts.length > 0 && (
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
              রাউন্ড বন্ধ; খসড়া রিপোর্টে গণ্য হবে না। মেয়াদ বাড়ালে শিক্ষকরা জমা দিতে পারবেন।
            </p>
          )}
          {drafts.map((d) => (
            <div key={d.id} className="flex flex-col gap-0.5" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-hairline)' }}>
              <div className="flex justify-between gap-2">
                <span style={{ fontWeight: 600 }}>{d.title}</span>
                {/* A by-level draft with nobody marked yet has no count to show. */}
                {d.total > 0 && (
                  <span className="sv-num" style={{ fontSize: 13.5 }}>
                    {bn(d.done)}/{bn(d.total)}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                {[d.teacherName, `শেষ সম্পাদনা ${formatDateTime(d.updatedAt)}`, d.device].filter(Boolean).join(' · ')}
              </span>
            </div>
          ))}
        </section>
        <section className="sv-card flex flex-col gap-2.5 min-w-0" style={{ flex: '1 1 380px' }} aria-labelledby="dups-title">
          <h3 id="dups-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            ডুপ্লিকেট ({bn(duplicates.length)})
          </h3>
          {duplicates.length === 0 && <p className="sv-muted" style={{ margin: 0, fontSize: 14 }}>কোনো ডুপ্লিকেট নেই।</p>}
          {duplicates.map((d) => (
            <DuplicateResolver
              key={d.batches.map((b) => b.id).join('|')}
              roundId={round.id}
              title={d.title}
              batches={d.batches.map((b) => ({ ...b, submittedAt: b.submittedAt.toISOString() }))}
            />
          ))}
        </section>
      </div>
    </>
  );
}
