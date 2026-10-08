import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDateTime } from '@/lib/survey/dates';
import { KIND_LABEL } from '@/lib/survey/labels';
import { gapFlag, sharedAreaGap } from '@/lib/survey/guardian-report-math';
import { allReportRounds, studentGuardian } from '@/lib/survey/guardian-reports';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { FLAGS, formatMark, GUARDIAN_AREAS } from '@/lib/survey/report-math';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { pickRound, studentReport } from '@/lib/survey/reports';
import { MarkChip, markTone } from '../../charts';
import { NoRounds } from '../../NoRounds';
import { ReportTools } from '../../ReportTools';
import { PageTop } from '../../../AdminShell';
import { ResponseTabs } from './ResponseTabs';

export const metadata: Metadata = { title: 'শিক্ষার্থী প্রোফাইল' };
export const dynamic = 'force-dynamic';

/** 8801712345678 → ০১৭১২-৩৪৫৬৭৮; a foreign number keeps its country code: +৪৯১৬৩… */
function localMobile(mobile: string | null) {
  if (!mobile) return null;
  if (!mobile.startsWith('8801')) return bn(`+${mobile}`);
  const local = mobile.replace(/^88/, '');
  return bn(`${local.slice(0, 5)}-${local.slice(5)}`);
}

const STATUS = {
  current: { label: 'বর্তমান', bg: 'var(--sv-ok-bg)', fg: 'var(--sv-ok)' },
  duplicate: { label: 'ডুপ্লিকেট', bg: 'var(--sv-warn-bg)', fg: 'var(--sv-warn)' },
  superseded: { label: 'পুরনো', bg: 'var(--sv-neutral-bg)', fg: 'var(--sv-text-body)' },
  'set-aside': { label: 'বাদ (অ্যাডমিন সিদ্ধান্ত)', bg: 'var(--sv-neutral-bg)', fg: 'var(--sv-text-body)' },
} as const;

export default async function StudentProfilePage({ params, searchParams }: { params: Promise<{ erpId: string }>; searchParams: Promise<{ round?: string }> }) {
  const [{ erpId: rawId }, search, all] = await Promise.all([params, searchParams, allReportRounds()]);
  const rounds = all.filter((r) => r.kind === 'T1');
  // Next has already decoded the segment.
  const erpId = rawId;
  const round = pickRound(rounds, await chosenRoundId(search.round));
  if (!round) return <NoRounds />;
  const report = await studentReport(round, erpId);
  if (!report) {
    return (
      <>
        <PageTop crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' }, { label: 'পাওয়া যায়নি' }]} />
        <div className="sv-card" style={{ padding: 20 }}>
          শিক্ষার্থী পাওয়া যায়নি। <Link href={`/admin/reports?round=${round.id}`}>খুঁজুন</Link>
        </div>
      </>
    );
  }
  const { student } = report;
  const guardian = await studentGuardian(round, all, erpId, student, { verifiedOnly: false });
  const marked = (list: { areaKey: string; mean: number | null }[]) => new Map(list.filter((a) => a.mean !== null).map((a) => [a.areaKey, a.mean!]));
  // Guardian against teachers on the areas both rated (the গড় row and the flag).
  const shared = sharedAreaGap(marked(guardian.areas), marked(report.areas));
  const guardianAreas = new Map(guardian.areas.map((a) => [a.areaKey, a]));
  const teacherAreas = new Map(report.areas.map((a) => [a.areaKey, a]));
  const areas = [...new Set([...report.areas.map((a) => a.areaKey), ...guardian.areas.map((a) => a.areaKey)])].map((key) => {
    const g = guardianAreas.get(key);
    const t = teacherAreas.get(key);
    return { key, name: (t ?? g)!.name, guardian: g?.mean ?? null, teacher: t?.mean ?? null };
  });
  // The comparison: areas both surveys ask about (the teacher questions about the guardian stay out).
  const t1Questions = round.snapshot.template.questions;
  const t1AreaKeys = new Set(t1Questions.map((q) => q.areaKey));
  const g2AreaKeys = new Set(guardian.g2?.snapshot.template.questions.filter((q) => !q.unscored).map((q) => q.areaKey) ?? []);
  const compared = areas.filter((a) => t1AreaKeys.has(a.key) && g2AreaKeys.has(a.key) && !GUARDIAN_AREAS.has(a.key));
  const guardianOnly = areas.filter((a) => !compared.includes(a) && a.guardian !== null && a.teacher === null);
  const teacherOnly = areas.filter((a) => !compared.includes(a) && a.teacher !== null && a.guardian === null);
  const teacherTotal = shared?.teacher ?? average(compared.map((a) => a.teacher));

  // Attention: the flags, then whatever has not come in yet.
  const flags = [...report.flags, gapFlag(shared, bn)].filter((f) => f !== null);
  const teacherMissing = report.grid.filter((row) => !row.marks).map((row) => row.subject);
  const missing = [
    teacherMissing.length ? `শিক্ষক (${teacherMissing.join(', ')})` : null,
    guardian.g2 && !guardian.form ? 'অভিভাবক · শিক্ষার্থী' : null,
    guardian.g1 && !guardian.g1Form ? 'অভিভাবক · ক্লাস পরিচালনা' : null,
  ].filter((m) => m !== null);

  const submittedBy = (form: { who: string | null; relation: string | null }) => `${form.who ?? ''}${form.relation ? ` (${form.relation})` : ''}`;
  // A kept duplicate gives a subject two columns; count subjects, not columns.
  const rated = new Set(report.grid.filter((row) => row.marks).map((row) => row.subject)).size;
  const subjectCount = new Set(report.grid.map((row) => row.subject)).size;
  // A teacher's average for the child leaves out the questions about the guardian (as everywhere else).
  const childQuestion = t1Questions.map((q) => !GUARDIAN_AREAS.has(q.areaKey));
  const father = localMobile(student.fatherMobile);
  const mother = localMobile(student.motherMobile);
  const classHref = `/admin/reports/class?${new URLSearchParams({ round: round.id, class: student.classKey, section: student.sectionKey })}`;

  return (
    <>
      <PageTop crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' }, { label: student.label, href: classHref }, { label: student.name }]} actions={<ReportTools exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'student', round: round.id, student: erpId })}`} printLabel="অভ্যন্তরীণ প্রিন্ট (নোটসহ)" />} />
      <section className="sv-card flex flex-wrap gap-5 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div
            aria-hidden="true"
            className="sv-head flex items-center justify-center"
            style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--sv-tint)', color: 'var(--sv-bronze-pressed)', fontSize: 24 }}
          >
            {student.name.charAt(0)}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="sv-head" style={{ margin: 0, fontSize: 28 }}>
              {student.name}
            </h1>
            <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
              আইডি {bn(student.erpId)} · {student.label}
              {student.roll !== null ? ` · রোল ${bn(student.roll)}` : ''}
              {student.fatherName ? ` · পিতা: ${student.fatherName}` : ''}
              {!student.active ? ' · নিষ্ক্রিয়' : ''}
            </div>
            {(father || mother) && (
              <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>{[father && `বাবা ${father}`, mother && `মা ${mother}`].filter(Boolean).join(' · ')}</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {guardian.g2 && (
            <Link
              href={`/admin/reports/student/${encodeURIComponent(erpId)}/guardian-print?round=${round.id}`}
              className="sv-sbtn sv-no-print"
              style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}
            >
              অভিভাবকের জন্য প্রিন্ট
            </Link>
          )}
        </div>
      </section>

      <section className="sv-card flex flex-col gap-2.5" aria-labelledby="attention-title">
        <h2 id="attention-title" className="sv-head sv-h2">
          মনোযোগ প্রয়োজন
        </h2>
        {flags.length === 0 && missing.length === 0 && <p style={{ margin: 0, fontSize: 14.5, color: 'var(--sv-text-muted)' }}>কিছু নেই।</p>}
        {(flags.length > 0 || missing.length > 0) && (
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {flags.map((f) => (
              <li key={f.kind} className="flex gap-2.5 items-start" style={{ fontSize: 15 }}>
                <span aria-hidden="true" className="flex items-center justify-center" style={{ flex: 'none', marginTop: 2, width: 22, height: 22, borderRadius: '50%', background: 'var(--sv-warn-bg)', color: 'var(--sv-warn)', fontWeight: 600, fontSize: 13 }}>
                  !
                </span>
                <span style={{ fontWeight: 600 }}>{f.label}</span>
              </li>
            ))}
            {missing.length > 0 && (
              <li className="flex gap-2.5 items-start" style={{ fontSize: 15 }}>
                <span aria-hidden="true" className="flex items-center justify-center" style={{ flex: 'none', marginTop: 2, width: 22, height: 22, borderRadius: '50%', background: 'var(--sv-info-bg)', color: 'var(--sv-info)', fontWeight: 600, fontSize: 13 }}>
                  i
                </span>
                <span>
                  <b style={{ fontWeight: 600 }}>এখনো জমা হয়নি:</b> <span style={{ color: 'var(--sv-text-muted)' }}>{missing.join(' · ')}</span>
                </span>
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="sv-card flex flex-col gap-2.5" aria-labelledby="compare-title">
        <div className="flex flex-col gap-0.5">
          <h2 id="compare-title" className="sv-head sv-h2">
            তুলনা · শিক্ষক বনাম অভিভাবক
          </h2>
          <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>একই বিষয়ে দুই দিকের মার্ক, ১০-এর মধ্যে · শিক্ষক = সব বিষয়ের শিক্ষকের গড়</div>
        </div>
        {compared.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)' }}>এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই।</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="sv-table sv-compare" style={{ minWidth: 280 }}>
              <thead>
                <tr>
                  <th scope="col">ক্ষেত্র</th>
                  <th scope="col" style={{ textAlign: 'right', width: 64 }}>
                    শিক্ষক
                  </th>
                  <th scope="col" style={{ textAlign: 'right', width: 72 }}>
                    অভিভাবক
                  </th>
                  <th scope="col" style={{ textAlign: 'right', width: 72 }}>
                    পার্থক্য
                  </th>
                </tr>
              </thead>
              <tbody>
                {compared.map((a) => {
                  const gap = a.guardian !== null && a.teacher !== null ? Math.abs(a.guardian - a.teacher) : null;
                  return <CompareRow key={a.key} name={a.name} teacher={a.teacher} guardian={a.guardian} gap={gap} />;
                })}
              </tbody>
              <tfoot>
                <CompareRow name="গড়" teacher={teacherTotal} guardian={shared?.guardian ?? null} gap={shared ? Math.abs(shared.gap) : null} total />
              </tfoot>
            </table>
          </div>
        )}
        <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
          ⚠ = {bn(FLAGS.guardianTeacherGap)} মার্ক বা বেশি পার্থক্য
          {guardianOnly.length > 0 && ` · শুধু অভিভাবক: ${guardianOnly.map((a) => `${a.name} ${formatMark(a.guardian, bn)}`).join(', ')}`}
          {teacherOnly.length > 0 && ` · শুধু শিক্ষক: ${teacherOnly.map((a) => `${a.name} ${formatMark(a.teacher, bn)}${GUARDIAN_AREAS.has(a.key) ? ' (শিক্ষার্থীর গড়ে ধরা হয়নি)' : ''}`).join(', ')}`}
        </div>
      </section>

      <section className="sv-card flex flex-col gap-3" aria-labelledby="answers-title">
        <h2 id="answers-title" className="sv-head sv-h2">
          উত্তর · যেভাবে জমা দেওয়া হয়েছে
        </h2>
        <ResponseTabs
          tabs={[
            {
              key: 't1',
              label: 'শিক্ষক',
              sub: `${bn(rated)}/${bn(subjectCount)} বিষয় জমা`,
              content: (
                <>
                  <h3 className="sv-print-only" style={{ margin: 0, fontSize: 16 }}>
                    শিক্ষকদের উত্তর
                  </h3>
                  <MarkLegend />
                  <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>প্রতিটি বিষয়ের শিক্ষক এই শিক্ষার্থীকে যে মার্ক দিয়েছেন</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table sv-answers" style={{ minWidth: 160 + report.grid.length * 76 }}>
                      <thead>
                        <tr>
                          <th scope="col">প্রশ্ন</th>
                          {report.grid.map((row, i) => (
                            <th key={i} scope="col" style={{ textAlign: 'center', width: 76, whiteSpace: 'normal', lineHeight: 1.35, color: 'var(--sv-text)' }}>
                              {row.subject}
                              <span style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--sv-text-muted)' }}>{row.teacher || 'জমা হয়নি'}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {t1Questions.map((q, qi) => (
                          <tr key={q.key}>
                            <th scope="row">
                              {q.text}
                              <QuestionHint text={childQuestion[qi] ? q.hint : [q.hint, 'অভিভাবক সম্পর্কে · শিক্ষার্থীর গড়ে ধরা হয় না'].filter(Boolean).join(' · ')} />
                            </th>
                            {report.grid.map((row, i) => (
                              <td key={i} style={{ textAlign: 'center' }}>
                                <MarkChip mark={row.marks ? row.marks[qi] : null} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th scope="row" style={{ fontWeight: 600 }}>
                            গড়
                            <QuestionHint text="অভিভাবক সম্পর্কে প্রশ্নগুলো বাদে" />
                          </th>
                          {report.grid.map((row, i) => (
                            <td key={i} style={{ textAlign: 'center' }}>
                              <MarkChip mark={row.marks ? average(row.marks.filter((_, qi) => childQuestion[qi])) : null} average />
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>শিক্ষকদের নোট</h3>
                  {report.notes.length === 0 && <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)' }}>কোনো নোট নেই।</p>}
                  {report.notes.map((note, i) => (
                    <div key={i} style={{ borderRadius: 12, background: 'var(--sv-report)', padding: '10px 14px', fontSize: 14.5, lineHeight: 1.55 }}>
                      <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                        {note.teacherName} · {note.subjectName}
                        {note.submittedAt ? ` · ${formatDateTime(note.submittedAt)}` : ''}
                      </div>
                      {note.note}
                    </div>
                  ))}
                </>
              ),
            },
            {
              key: 'g2',
              label: 'অভিভাবক · শিক্ষার্থী',
              sub: !guardian.g2 ? 'রাউন্ড নেই' : guardian.form ? `জমা · ${submittedBy(guardian.form)}` : 'জমা হয়নি',
              content: (
                <>
                  <h3 className="sv-print-only" style={{ margin: 0, fontSize: 16 }}>
                    অভিভাবকের উত্তর · শিক্ষার্থী সম্পর্কে
                  </h3>
                  {!guardian.g2 && <p style={{ margin: 0, fontSize: 14.5, color: 'var(--sv-text-muted)' }}>এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই।</p>}
                  {guardian.g2 && !guardian.form && <p style={{ margin: 0, fontSize: 14.5, color: 'var(--sv-text-muted)' }}>অভিভাবক এখনো জমা দেননি।</p>}
                  {guardian.g2 && guardian.form && (
                    <>
                      <FormLine form={guardian.form} label={guardian.g2.label} />
                      <MarkLegend />
                      <div style={{ overflowX: 'auto' }}>
                        <table className="sv-table sv-answers" style={{ minWidth: 320 }}>
                          <thead>
                            <tr>
                              <th scope="col">প্রশ্ন</th>
                              <th scope="col">উত্তর</th>
                              <th scope="col" style={{ textAlign: 'right', width: 90 }}>
                                মার্ক
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {guardian.answers.map((a) => (
                              <tr key={a.label}>
                                <th scope="row">{a.question}</th>
                                <td style={{ fontWeight: 600 }}>{a.answer ?? '—'}</td>
                                <td style={{ textAlign: 'right' }}>
                                  {a.unscored ? <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>মার্ক নেই</span> : <MarkChip mark={a.mark} />}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <th scope="row" colSpan={2} style={{ fontWeight: 600 }}>
                                গড়
                                <QuestionHint text="মার্কহীন উত্তর বাদে" />
                              </th>
                              <td style={{ textAlign: 'right' }}>
                                <MarkChip mark={guardian.mean} average />
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <Comment text={guardian.form.comment} />
                    </>
                  )}
                </>
              ),
            },
            {
              key: 'g1',
              label: 'অভিভাবক · ক্লাস পরিচালনা',
              sub: !guardian.g1 ? 'রাউন্ড নেই' : guardian.g1Form ? `জমা · ${submittedBy(guardian.g1Form)}` : 'জমা হয়নি',
              content: (
                <>
                  <h3 className="sv-print-only" style={{ margin: 0, fontSize: 16 }}>
                    অভিভাবকের উত্তর · ক্লাস পরিচালনা
                  </h3>
                  {!guardian.g1 && <p style={{ margin: 0, fontSize: 14.5, color: 'var(--sv-text-muted)' }}>এই রাউন্ডের সাথে ক্লাস পরিচালনার রিভিউ নেই।</p>}
                  {guardian.g1 && !guardian.g1Form && <p style={{ margin: 0, fontSize: 14.5, color: 'var(--sv-text-muted)' }}>অভিভাবক এখনো জমা দেননি।</p>}
                  {guardian.g1 && guardian.g1Form && (
                    <>
                      <FormLine form={guardian.g1Form} label={guardian.g1.label} />
                      <MarkLegend />
                      <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>প্রতিটি বিষয়ের ক্লাস নিয়ে অভিভাবকের মার্ক</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="sv-table sv-answers" style={{ minWidth: 160 + guardian.g1Subjects.length * 76 }}>
                          <thead>
                            <tr>
                              <th scope="col">প্রশ্ন</th>
                              {guardian.g1Subjects.map((s) => (
                                <th key={s.key} scope="col" style={{ textAlign: 'center', width: 76, whiteSpace: 'normal', color: 'var(--sv-text)' }}>
                                  {s.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {guardian.g1Answers.map((q, qi) => (
                              <tr key={qi}>
                                <th scope="row">
                                  {q.question}
                                  <QuestionHint text={q.hint} />
                                </th>
                                {guardian.g1Subjects.map((s) => {
                                  const mark = q.marks.get(s.key);
                                  return (
                                    <td key={s.key} style={{ textAlign: 'center' }}>
                                      {mark === 'na' ? <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>প্রযোজ্য নয়</span> : <MarkChip mark={mark ?? null} />}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <th scope="row" style={{ fontWeight: 600 }}>
                                গড়
                              </th>
                              {guardian.g1Subjects.map((s) => (
                                <td key={s.key} style={{ textAlign: 'center' }}>
                                  <MarkChip mark={average(guardian.g1Answers.map((q) => q.marks.get(s.key)).map((m) => (m === 'na' || m === undefined ? null : m)))} average />
                                </td>
                              ))}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <Comment text={guardian.g1Form.comment} />
                    </>
                  )}
                </>
              ),
            },
          ]}
        />
      </section>

      <details className="sv-card" style={{ paddingTop: 6, paddingBottom: 6 }}>
        <summary className="sv-head" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 18 }}>
          সব জমা · ইতিহাস
          <span style={{ fontFamily: 'var(--sv-font-body)', fontWeight: 400, fontSize: 14, color: 'var(--sv-text-muted)', marginLeft: 8 }}>{bn(guardian.log.length + report.log.length)}টি</span>
        </summary>
        <div className="flex flex-col gap-2" style={{ padding: '8px 0 10px' }}>
          {report.log.length === 0 && guardian.log.length === 0 && <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)' }}>এখনো কোনো জমা নেই।</p>}
          {guardian.log.map((entry, i) => (
            <LogEntry
              key={`g${i}`}
              kind={KIND_LABEL[entry.kind as keyof typeof KIND_LABEL]}
              who={submittedBy(entry)}
              when={`${entry.roundLabel}${entry.submittedAt ? ` · ${formatDateTime(entry.submittedAt)}` : ''} · ${entry.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}`}
              status={entry.supersededBy ? 'superseded' : 'current'}
            />
          ))}
          {report.log.map((entry, i) => (
            <LogEntry
              key={i}
              kind={KIND_LABEL.T1}
              who={`${entry.teacherName} · ${entry.subjectName}`}
              when={`${entry.roundLabel}${entry.submittedAt ? ` · ${formatDateTime(entry.submittedAt)}` : ''}`}
              status={entry.status}
            />
          ))}
        </div>
      </details>
    </>
  );
}

function average(marks: (number | null)[]): number | null {
  const counted = marks.filter((m) => m !== null);
  return counted.length ? counted.reduce((sum, m) => sum + m, 0) / counted.length : null;
}

function CompareRow({ name, teacher, guardian, gap, total = false }: { name: string; teacher: number | null; guardian: number | null; gap: number | null; total?: boolean }) {
  const wide = gap !== null && Math.round(gap * 10) / 10 >= FLAGS.guardianTeacherGap;
  const num = { textAlign: 'right' as const, fontWeight: 600, fontSize: total ? 16 : 15, whiteSpace: 'nowrap' as const };
  return (
    <tr style={{ background: wide ? 'var(--sv-warn-bg)' : undefined }}>
      <th scope="row" style={{ fontWeight: total ? 600 : 500, fontSize: 15, color: 'var(--sv-text)', borderBottom: total ? 0 : undefined }}>
        {name}
      </th>
      <td className="sv-num" style={{ ...num, borderBottom: total ? 0 : undefined }}>
        {formatMark(teacher, bn)}
      </td>
      <td className="sv-num" style={{ ...num, borderBottom: total ? 0 : undefined }}>
        {formatMark(guardian, bn)}
      </td>
      <td className="sv-num" style={{ ...num, color: wide ? 'var(--sv-warn)' : undefined, borderBottom: total ? 0 : undefined }}>
        {gap === null ? '—' : `${wide ? '⚠ ' : ''}${bn(gap.toFixed(1))}`}
      </td>
    </tr>
  );
}

function MarkLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
      মার্ক:
      {([10, 8, 6, 4] as const).map((m) => {
        const tone = markTone(m);
        return (
          <span key={m} className="sv-mark" style={{ background: tone.bg, color: tone.fg }}>
            {{ 10: '১০', 8: '৮', 6: '৬–৭', 4: '৪–৫' }[m]}
          </span>
        );
      })}
      <span>· ৭ বা কম = কম মার্ক</span>
    </div>
  );
}

function QuestionHint({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return <span style={{ display: 'block', fontSize: 12.5, color: 'var(--sv-text-muted)' }}>{text}</span>;
}

function FormLine({ form, label }: { form: { who: string | null; relation: string | null; submittedAt: Date | null; verified: boolean | null }; label: string }) {
  return (
    <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
      {label} · {form.who}
      {form.relation ? ` (${form.relation})` : ''}
      {form.submittedAt ? ` · ${formatDateTime(form.submittedAt)}` : ''} · <b style={{ color: form.verified ? 'var(--sv-ok)' : 'var(--sv-warn)', fontWeight: 600 }}>{form.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}</b>
    </div>
  );
}

function Comment({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div style={{ borderRadius: 12, background: 'var(--sv-report)', padding: '10px 14px', fontSize: 14.5, lineHeight: 1.6 }}>
      <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>মন্তব্য</div>
      {text}
    </div>
  );
}

function LogEntry({ kind, who, when, status }: { kind: string; who: string; when: string; status: keyof typeof STATUS }) {
  const s = STATUS[status];
  const faded = status === 'superseded' || status === 'set-aside';
  return (
    <div className="flex gap-3 items-start" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-hairline)', opacity: faded ? 0.7 : 1 }}>
      <span className="sv-tag" style={{ flex: 'none' }}>
        {kind}
      </span>
      <div className="flex flex-col gap-0.5" style={{ flex: 1, fontSize: 14 }}>
        <div style={{ fontWeight: 600 }}>{who}</div>
        <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{when}</div>
      </div>
      <span style={{ flex: 'none', background: s.bg, color: s.fg, borderRadius: 6, padding: '2px 8px', fontSize: 13, fontWeight: 600 }}>{s.label}</span>
    </div>
  );
}
