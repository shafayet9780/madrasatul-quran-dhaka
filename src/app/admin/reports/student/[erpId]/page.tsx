import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { formatDateTime } from '@/lib/survey/dates';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { NoRounds } from '../../NoRounds';
import { ReportTools } from '../../ReportTools';
import { PageTop } from '../../../AdminShell';
import { Card, EmptyState, LINK, PageBody } from '../../../ui';
import { studentPageData, submittedBy } from './data';
import {
  AttentionList,
  ClassManagementBlocks,
  ClassManagementTable,
  CompareTable,
  FormLine,
  GuardianTable,
  History,
  historyCount,
  MarkLegend,
  MUTED,
  Quote,
  TeacherBlocks,
  TeacherTable,
} from './parts';
import { ResponseTabs } from './ResponseTabs';

export const metadata: Metadata = { title: 'শিক্ষার্থী প্রোফাইল' };
export const dynamic = 'force-dynamic';

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ erpId: string }>;
  searchParams: Promise<{ round?: string }>;
}) {
  // Next has already decoded the segment.
  const [{ erpId }, search] = await Promise.all([params, searchParams]);
  const data = await studentPageData(erpId, search.round);
  if (!data.round) return <NoRounds />;
  if (!data.report) {
    return (
      <>
        <PageTop
          crumbs={[
            { label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' },
            { label: 'পাওয়া যায়নি' },
          ]}
        />
        <PageBody>
          <EmptyState>
            শিক্ষার্থী পাওয়া যায়নি।{' '}
            <Link
              href={`/admin/reports?round=${data.round.id}`}
              className={LINK}
            >
              খুঁজুন
            </Link>
          </EmptyState>
        </PageBody>
      </>
    );
  }
  const {
    round,
    report,
    student,
    guardian,
    rated,
    subjectCount,
    father,
    mother,
    classHref,
  } = data;
  const base = `/admin/reports/student/${encodeURIComponent(erpId)}`;

  return (
    <>
      <PageTop
        crumbs={[
          { label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' },
          { label: student.label, href: classHref },
          { label: student.name },
        ]}
        actions={
          <ReportTools
            exportHref={`/admin/reports/export?${new URLSearchParams({ kind: 'student', round: round.id, student: erpId })}`}
            printLabel="অভ্যন্তরীণ প্রিন্ট"
            printHref={`${base}/print?round=${round.id}`}
          />
        }
      />
      <PageBody>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl font-semibold text-muted-foreground"
            >
              {student.name.charAt(0)}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="m-0 text-2xl font-semibold">{student.name}</h1>
              <p className={MUTED}>
                আইডি {bn(student.erpId)} · {student.label}
                {student.roll !== null ? ` · রোল ${bn(student.roll)}` : ''}
                {student.fatherName ? ` · পিতা: ${student.fatherName}` : ''}
                {!student.active ? ' · নিষ্ক্রিয়' : ''}
              </p>
              {(father || mother) && (
                <p className={MUTED}>
                  {[father && `বাবা ${father}`, mother && `মা ${mother}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>
          {guardian.g2 && (
            <Button
              asChild
              variant="outline"
              className="adm h-9 bg-white shadow-none sv-no-print"
            >
              <Link href={`${base}/guardian-print?round=${round.id}`}>
                অভিভাবকের জন্য প্রিন্ট
              </Link>
            </Button>
          )}
        </section>

        <Card title="মনোযোগ প্রয়োজন">
          <AttentionList data={data} />
        </Card>

        <Card title="তুলনা · শিক্ষক বনাম অভিভাবক">
          <p className={`${MUTED} -mt-1 mb-3`}>
            একই বিষয়ে দুই দিকের মার্ক, ১০-এর মধ্যে · শিক্ষক = সব বিষয়ের
            শিক্ষকের গড়
          </p>
          <CompareTable data={data} />
        </Card>

        <Card title="উত্তর · যেভাবে জমা দেওয়া হয়েছে">
          <div className="flex flex-col gap-3">
            <MarkLegend />
            <ResponseTabs
              tabs={[
                {
                  key: 't1',
                  label: 'শিক্ষক',
                  sub: `${bn(rated)}/${bn(subjectCount)} বিষয় জমা`,
                  content: (
                    <>
                      <h3 className="sv-print-only m-0 text-base">
                        শিক্ষকদের উত্তর
                      </h3>
                      <p className={MUTED}>
                        প্রতিটি বিষয়ের শিক্ষক এই শিক্ষার্থীকে যে মার্ক দিয়েছেন
                      </p>
                      <div className="hidden overflow-x-auto md:block print:block">
                        <TeacherTable
                          data={data}
                          columns={report.grid}
                          label="শিক্ষকদের উত্তর"
                        />
                      </div>
                      <div className="md:hidden print:hidden">
                        <TeacherBlocks data={data} />
                      </div>
                      <h4 className="m-0 mt-2 text-[15px] font-semibold">
                        শিক্ষকদের নোট
                      </h4>
                      {report.notes.length === 0 && (
                        <p className={MUTED}>কোনো নোট নেই।</p>
                      )}
                      {report.notes.map((note, i) => (
                        <Quote
                          key={i}
                          label={`${note.teacherName} · ${note.subjectName}${note.submittedAt ? ` · ${formatDateTime(note.submittedAt)}` : ''}`}
                          text={note.note}
                        />
                      ))}
                    </>
                  ),
                },
                {
                  key: 'g2',
                  label: 'অভিভাবক · শিক্ষার্থী',
                  sub: !guardian.g2
                    ? 'রাউন্ড নেই'
                    : guardian.form
                      ? `জমা · ${submittedBy(guardian.form)}`
                      : 'জমা হয়নি',
                  content: (
                    <>
                      <h3 className="sv-print-only m-0 text-base">
                        অভিভাবকের উত্তর · শিক্ষার্থী সম্পর্কে
                      </h3>
                      {!guardian.g2 && (
                        <p className={MUTED}>
                          এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই।
                        </p>
                      )}
                      {guardian.g2 && !guardian.form && (
                        <p className={MUTED}>অভিভাবক এখনো জমা দেননি।</p>
                      )}
                      {guardian.g2 && guardian.form && (
                        <>
                          <FormLine
                            form={guardian.form}
                            label={guardian.g2.label}
                          />
                          <div className="overflow-x-auto">
                            <GuardianTable data={data} />
                          </div>
                          <Quote label="মন্তব্য" text={guardian.form.comment} />
                        </>
                      )}
                    </>
                  ),
                },
                {
                  key: 'g1',
                  label: 'অভিভাবক · ক্লাস পরিচালনা',
                  sub: !guardian.g1
                    ? 'রাউন্ড নেই'
                    : guardian.g1Form
                      ? `জমা · ${submittedBy(guardian.g1Form)}`
                      : 'জমা হয়নি',
                  content: (
                    <>
                      <h3 className="sv-print-only m-0 text-base">
                        অভিভাবকের উত্তর · ক্লাস পরিচালনা
                      </h3>
                      {!guardian.g1 && (
                        <p className={MUTED}>
                          এই রাউন্ডের সাথে ক্লাস পরিচালনার রিভিউ নেই।
                        </p>
                      )}
                      {guardian.g1 && !guardian.g1Form && (
                        <p className={MUTED}>অভিভাবক এখনো জমা দেননি।</p>
                      )}
                      {guardian.g1 && guardian.g1Form && (
                        <>
                          <FormLine
                            form={guardian.g1Form}
                            label={guardian.g1.label}
                          />
                          <p className={MUTED}>
                            প্রতিটি বিষয়ের ক্লাস নিয়ে অভিভাবকের মার্ক
                          </p>
                          <div className="hidden overflow-x-auto md:block print:block">
                            <ClassManagementTable
                              data={data}
                              subjects={guardian.g1Subjects}
                              label="অভিভাবকের উত্তর · ক্লাস পরিচালনা"
                            />
                          </div>
                          <div className="md:hidden print:hidden">
                            <ClassManagementBlocks data={data} />
                          </div>
                          <Quote
                            label="মন্তব্য"
                            text={guardian.g1Form.comment}
                          />
                        </>
                      )}
                    </>
                  ),
                },
              ]}
            />
          </div>
        </Card>

        <details className="group rounded-xl border bg-card px-5 py-1.5">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
            <ChevronRight
              aria-hidden
              className="size-4 text-muted-foreground transition-transform group-open:rotate-90"
            />
            সব জমা · ইতিহাস
            <span className="text-sm font-normal text-muted-foreground">
              {bn(historyCount(data))}টি
            </span>
          </summary>
          <div className="pb-3">
            <History data={data} />
          </div>
        </details>
      </PageBody>
    </>
  );
}

function average(marks: (number | null)[]): number | null {
  const counted = marks.filter(m => m !== null);
  return counted.length
    ? counted.reduce((sum, m) => sum + m, 0) / counted.length
    : null;
}

function CompareRow({
  name,
  teacher,
  guardian,
  gap,
  total = false,
}: {
  name: string;
  teacher: number | null;
  guardian: number | null;
  gap: number | null;
  total?: boolean;
}) {
  const wide =
    gap !== null && Math.round(gap * 10) / 10 >= FLAGS.guardianTeacherGap;
  const num = {
    textAlign: 'right' as const,
    fontWeight: 600,
    fontSize: total ? 16 : 15,
    whiteSpace: 'nowrap' as const,
  };
  return (
    <tr style={{ background: wide ? 'var(--sv-warn-bg)' : undefined }}>
      <th
        scope="row"
        style={{
          fontWeight: total ? 600 : 500,
          fontSize: 15,
          color: 'var(--sv-text)',
          borderBottom: total ? 0 : undefined,
        }}
      >
        {name}
      </th>
      <td
        className="sv-num"
        style={{ ...num, borderBottom: total ? 0 : undefined }}
      >
        {formatMark(teacher, bn)}
      </td>
      <td
        className="sv-num"
        style={{ ...num, borderBottom: total ? 0 : undefined }}
      >
        {formatMark(guardian, bn)}
      </td>
      <td
        className="sv-num"
        style={{
          ...num,
          color: wide ? 'var(--sv-warn)' : undefined,
          borderBottom: total ? 0 : undefined,
        }}
      >
        {gap === null ? '—' : `${wide ? '⚠ ' : ''}${bn(gap.toFixed(1))}`}
      </td>
    </tr>
  );
}

function MarkLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}
    >
      মার্ক:
      {([10, 8, 6, 4] as const).map(m => {
        const tone = markTone(m);
        return (
          <span
            key={m}
            className="sv-mark"
            style={{ background: tone.bg, color: tone.fg }}
          >
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
  return (
    <span
      style={{
        display: 'block',
        fontSize: 12.5,
        color: 'var(--sv-text-muted)',
      }}
    >
      {text}
    </span>
  );
}

function FormLine({
  form,
  label,
}: {
  form: {
    who: string | null;
    relation: string | null;
    submittedAt: Date | null;
    verified: boolean | null;
  };
  label: string;
}) {
  return (
    <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
      {label} · {form.who}
      {form.relation ? ` (${form.relation})` : ''}
      {form.submittedAt ? ` · ${formatDateTime(form.submittedAt)}` : ''} ·{' '}
      <b
        style={{
          color: form.verified ? 'var(--sv-ok)' : 'var(--sv-warn)',
          fontWeight: 600,
        }}
      >
        {form.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}
      </b>
    </div>
  );
}

function Comment({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div
      style={{
        borderRadius: 12,
        background: 'var(--sv-report)',
        padding: '10px 14px',
        fontSize: 14.5,
        lineHeight: 1.6,
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>মন্তব্য</div>
      {text}
    </div>
  );
}

function LogEntry({
  kind,
  who,
  when,
  status,
}: {
  kind: string;
  who: string;
  when: string;
  status: keyof typeof STATUS;
}) {
  const s = STATUS[status];
  const faded = status === 'superseded' || status === 'set-aside';
  return (
    <div
      className="flex gap-3 items-start"
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid var(--sv-hairline)',
        opacity: faded ? 0.7 : 1,
      }}
    >
      <span className="sv-tag" style={{ flex: 'none' }}>
        {kind}
      </span>
      <div className="flex flex-col gap-0.5" style={{ flex: 1, fontSize: 14 }}>
        <div style={{ fontWeight: 600 }}>{who}</div>
        <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
          {when}
        </div>
      </div>
      <span
        style={{
          flex: 'none',
          background: s.bg,
          color: s.fg,
          borderRadius: 6,
          padding: '2px 8px',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {s.label}
      </span>
    </div>
  );
}
