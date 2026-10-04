import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDateTime } from '@/lib/survey/dates';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { formatMark } from '@/lib/survey/report-math';
import { pickRound, studentReport, t1Rounds } from '@/lib/survey/reports';
import { RoundPicker } from '../../../RoundPicker';
import { MarkAxis, MarkBar, markCell, TEACHER, TrendChart } from '../../charts';
import { NoRounds } from '../../NoRounds';
import { ReportTools } from '../../ReportTools';

export const metadata: Metadata = { title: 'শিক্ষার্থী প্রোফাইল' };
export const dynamic = 'force-dynamic';

/** 8801712345678 → ০১৭১২-৩৪৫৬৭৮ */
function localMobile(mobile: string | null) {
  if (!mobile) return null;
  const local = mobile.replace(/^88/, '');
  return bn(`${local.slice(0, 5)}-${local.slice(5)}`);
}

const STATUS = {
  current: { label: 'বর্তমান', bg: 'var(--sv-ok-bg)', fg: 'var(--sv-ok)' },
  duplicate: { label: 'ডুপ্লিকেট', bg: 'var(--sv-warn-bg)', fg: 'var(--sv-warn)' },
  superseded: { label: 'পুরনো', bg: 'var(--sv-neutral-bg)', fg: 'var(--sv-text-body)' },
} as const;

export default async function StudentProfilePage({ params, searchParams }: { params: Promise<{ erpId: string }>; searchParams: Promise<{ round?: string }> }) {
  const [{ erpId: rawId }, search, rounds] = await Promise.all([params, searchParams, t1Rounds()]);
  const erpId = decodeURIComponent(rawId);
  const round = pickRound(rounds, search.round);
  if (!round) return <NoRounds />;
  const report = await studentReport(round, erpId);
  if (!report) {
    return (
      <div className="sv-card" style={{ padding: 20 }}>
        শিক্ষার্থী পাওয়া যায়নি। <Link href={`/admin/reports?round=${round.id}`}>খুঁজুন</Link>
      </div>
    );
  }
  const { student } = report;
  const father = localMobile(student.fatherMobile);
  const mother = localMobile(student.motherMobile);
  const classHref = `/admin/reports/class?${new URLSearchParams({ round: round.id, class: student.classKey, section: student.sectionKey })}`;

  return (
    <>
      <Link href={classHref} className="sv-no-print" style={{ fontSize: 14, fontWeight: 600, alignSelf: 'flex-start' }}>
        ← {student.label}
      </Link>

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
          <span className="sv-no-print">
            <RoundPicker rounds={[...rounds].reverse().map((r) => ({ id: r.id, label: r.label }))} value={round.id} basePath={`/admin/reports/student/${encodeURIComponent(erpId)}`} />
          </span>
          <ReportTools exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'student', round: round.id, student: erpId })}`} printLabel="অভ্যন্তরীণ প্রিন্ট (নোটসহ)" />
        </div>
      </section>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="sv-card sv-kpi">
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>শিক্ষকের চোখে · T1</div>
          <div className="flex items-baseline gap-1">
            <span className="sv-num" style={{ fontSize: 30 }}>
              {formatMark(report.mean, bn)}
            </span>
            <span style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>/ ১০</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
            {bn(report.teachers)} জন শিক্ষক · ক্লাসের গড় {formatMark(report.classMean, bn)}
          </div>
        </div>
        <div className="sv-card sv-kpi">
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>অভিভাবকের চোখে · G2</div>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)', lineHeight: 1.6 }}>G2 শুরু হলে দেখা যাবে</div>
        </div>
        <div className="sv-card sv-kpi">
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', fontWeight: 600 }}>ফ্ল্যাগ</div>
          {report.flags.length ? (
            report.flags.map((f) => (
              <span key={f.kind} className="sv-flag" style={{ alignSelf: 'flex-start' }}>
                ⚠ {f.label}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--sv-text-muted)' }}>কোনো ফ্ল্যাগ নেই</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-stretch">
        <section className="sv-card flex flex-col gap-3 min-w-0" style={{ flex: '999 1 520px' }} aria-labelledby="areas-title">
          <h2 id="areas-title" className="sv-head sv-h2">
            ক্ষেত্রভিত্তিক তুলনা
          </h2>
          <div className="flex flex-wrap gap-4" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }} aria-hidden="true">
            <span className="flex items-center gap-1.5">
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: TEACHER }} />
              শিক্ষকদের গড়
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 3, height: 14, background: 'var(--sv-text-body)' }} />
              ক্লাসের গড়
            </span>
          </div>
          {report.areas.map((area) => (
            <div key={area.areaKey} className="grid items-center gap-3" style={{ gridTemplateColumns: 'minmax(120px, 190px) minmax(0, 1fr) 110px', fontSize: 14, minHeight: 34 }}>
              <div style={{ fontWeight: 600 }}>{area.name}</div>
              <MarkBar
                value={area.mean}
                reference={area.classMean}
                label={`${area.name}: ${formatMark(area.mean, bn)}, ক্লাসের গড় ${formatMark(area.classMean, bn)}`}
              />
              <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', textAlign: 'right' }}>
                {formatMark(area.mean, bn)} · ক্লাস {formatMark(area.classMean, bn)}
              </div>
            </div>
          ))}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(120px, 190px) minmax(0, 1fr) 110px' }}>
            <div />
            <MarkAxis />
            <div />
          </div>
        </section>
        <section className="sv-card flex flex-col gap-2.5 min-w-0" style={{ flex: '1 1 340px' }} aria-labelledby="trend-title">
          <h2 id="trend-title" className="sv-head sv-h2">
            রাউন্ডভিত্তিক গড়
          </h2>
          {report.trend.length >= 2 ? (
            <TrendChart points={report.trend} />
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-2 text-center"
              style={{ minHeight: 180, borderRadius: 12, border: '1.5px dashed var(--sv-dashed)', padding: 16 }}
            >
              <div style={{ fontWeight: 600 }}>দ্বিতীয় রাউন্ড থেকে প্রবণতা দেখা যাবে</div>
              <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>এখন শুধু এই রাউন্ডের ফলাফল দেখানো হচ্ছে।</div>
            </div>
          )}
        </section>
      </div>

      <section className="sv-card flex flex-col gap-3" aria-labelledby="grid-title">
        <div className="flex flex-wrap justify-between gap-2 items-baseline">
          <h2 id="grid-title" className="sv-head sv-h2">
            শিক্ষকদের মার্ক · বিষয় × প্রশ্ন
          </h2>
          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{report.questions.map((q) => `${bn(q.n)} ${q.label}`).join(' · ')}</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="sv-cover" style={{ minWidth: 760, tableLayout: 'fixed' }}>
            <caption className="sv-visually-hidden">প্রতিটি বিষয়ের শিক্ষকের দেওয়া মার্ক, প্রশ্ন অনুযায়ী</caption>
            <colgroup>
              <col style={{ width: 110 }} />
              <col style={{ width: 200 }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left' }}>
                  বিষয়
                </th>
                <th scope="col" style={{ textAlign: 'left' }}>
                  শিক্ষক
                </th>
                {report.questions.map((q) => (
                  <th key={q.n} scope="col" title={q.label}>
                    {bn(q.n)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.grid.map((row, i) => (
                <tr key={`${row.subject}-${i}`}>
                  <th scope="row">{row.subject}</th>
                  <td style={{ textAlign: 'left', color: 'var(--sv-text-muted)', paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.teacher || 'এখনো জমা হয়নি'}
                  </td>
                  {report.questions.map((q, qi) => {
                    const mark = row.marks ? row.marks[qi] : null;
                    const colours = markCell(mark);
                    return (
                      <td
                        key={q.n}
                        className="sv-num"
                        style={{ background: colours.bg, color: colours.fg, fontSize: 14 }}
                        title={`${row.subject} · প্রশ্ন ${bn(q.n)}: ${mark === null ? 'নেই' : bn(mark)}`}
                      >
                        {mark === null ? '·' : bn(mark)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2" style={{ borderTop: '1px solid var(--sv-hairline)', paddingTop: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>শিক্ষকদের নোট</h3>
          {report.notes.length === 0 && <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)' }}>কোনো নোট নেই।</p>}
          {report.notes.map((note, i) => (
            <div key={i} style={{ border: '1px solid var(--sv-hairline)', borderRadius: 12, padding: '12px 14px', fontSize: 14.5, lineHeight: 1.55 }}>
              <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', marginBottom: 4 }}>
                <b style={{ color: 'var(--sv-text)' }}>{note.teacherName}</b> · {note.subjectName}
                {note.submittedAt ? ` · ${formatDateTime(note.submittedAt)}` : ''}
              </div>
              {note.note}
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 items-start">
        <section className="sv-card flex flex-col gap-2 min-w-0" style={{ flex: '1 1 420px' }}>
          <h2 className="sv-head sv-h2">অভিভাবকের উত্তর</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)' }}>G2 শুরু হলে দেখা যাবে। অভিভাবকের জন্য প্রিন্টও তখন চালু হবে।</p>
        </section>
        <section className="sv-card flex flex-col gap-2 min-w-0" style={{ flex: '1 1 420px' }} aria-labelledby="log-title">
          <h2 id="log-title" className="sv-head sv-h2" style={{ marginBottom: 4 }}>
            সব জমা · ইতিহাসসহ
          </h2>
          {report.log.length === 0 && <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)' }}>এখনো কোনো জমা নেই।</p>}
          {report.log.map((entry, i) => {
            const status = STATUS[entry.status];
            return (
              <div
                key={i}
                className="flex gap-3 items-start"
                style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-hairline)', opacity: entry.status === 'superseded' ? 0.7 : 1 }}
              >
                <span className="sv-tag" style={{ flex: 'none' }}>
                  T1
                </span>
                <div className="flex flex-col gap-0.5" style={{ flex: 1, fontSize: 14 }}>
                  <div style={{ fontWeight: 600 }}>
                    {entry.teacherName} · {entry.subjectName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                    {entry.roundLabel}
                    {entry.submittedAt ? ` · ${formatDateTime(entry.submittedAt)}` : ''}
                  </div>
                </div>
                <span style={{ flex: 'none', background: status.bg, color: status.fg, borderRadius: 6, padding: '2px 8px', fontSize: 13, fontWeight: 600 }}>{status.label}</span>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}
